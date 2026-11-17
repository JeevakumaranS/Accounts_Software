import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VendorBill } from './entities/vendor-bill.entity';
import { VendorBillItem } from './entities/vendor-bill-item.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { AccountingService } from '../accounting/accounting.service';
import { CompanyService } from '../company/company.service';
import { BillStatus } from '../../shared/enums/bill-status.enum';
import { JournalSourceType } from '../../shared/enums/journal-source-type.enum';

@Injectable()
export class VendorBillsService {
  constructor(
    @InjectRepository(VendorBill)
    private readonly billRepository: Repository<VendorBill>,
    @InjectRepository(VendorBillItem)
    private readonly itemRepository: Repository<VendorBillItem>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    private readonly accountingService: AccountingService,
    private readonly companyService: CompanyService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<VendorBill[]> {
    return this.billRepository.find({
      relations: ['vendor', 'items', 'items.account'],
      order: { bill_date: 'DESC' },
    });
  }

  async findById(id: string): Promise<VendorBill> {
    const bill = await this.billRepository.findOne({
      where: { id },
      relations: ['vendor', 'items', 'items.account', 'journal_entry', 'payment_allocations'],
    });
    if (!bill) throw new NotFoundException('Vendor bill not found');
    return bill;
  }

  async createBill(dto: any, userId: string): Promise<VendorBill> {
    const activeFy = await this.companyService.getActiveFinancialYear();
    if (!activeFy) throw new BadRequestException('No active financial year found');

    const vendor = await this.vendorRepository.findOne({ where: { id: dto.vendor_id } });
    if (!vendor) throw new BadRequestException('Vendor not found');

    // Duplicate check on (vendor_id, vendor_bill_number)
    if (dto.vendor_bill_number) {
      const dup = await this.billRepository.findOne({
        where: { vendor_id: vendor.id, vendor_bill_number: dto.vendor_bill_number },
      });
      if (dup) {
        throw new ConflictException(`Vendor bill #${dto.vendor_bill_number} already recorded for this vendor`);
      }
    }

    const count = await this.billRepository.count();
    const billNumber = `DZT/BILL/${activeFy.name}/${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let billTotal = 0;

    const companySettings = await this.companyService.getSettings();
    const isInterState = vendor.state_code && companySettings.state_code && vendor.state_code !== companySettings.state_code;

    const defaultExpenseAccount = await this.accountingService.getAccountByCode('5100');
    const itemsToSave: Partial<VendorBillItem>[] = [];

    for (const itm of dto.items || []) {
      const qty = Number(itm.quantity) || 1;
      const rate = Number(itm.unit_price) || 0;
      const lineTaxable = qty * rate;
      const taxRate = Number(itm.tax_rate) || 18;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterState) {
        igst = Number(((lineTaxable * taxRate) / 100).toFixed(2));
      } else {
        const half = taxRate / 2;
        cgst = Number(((lineTaxable * half) / 100).toFixed(2));
        sgst = Number(((lineTaxable * half) / 100).toFixed(2));
      }

      const lineTotal = lineTaxable + cgst + sgst + igst;

      subtotal += lineTaxable;
      totalTaxable += lineTaxable;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      billTotal += lineTotal;

      itemsToSave.push({
        account_id: itm.account_id || defaultExpenseAccount?.id,
        description: itm.description || itm.item_description,
        hsn_sac: itm.hsn_sac || itm.hsn_sac_code,
        quantity: qty,
        unit: itm.unit || 'NOS',
        unit_price: rate,
        taxable_value: lineTaxable,
        tax_rate: taxRate,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        total_amount: lineTotal,
      });
    }

    const billId = await this.dataSource.transaction(async (manager) => {
      const bill = manager.create(VendorBill, {
        bill_number: billNumber,
        vendor_id: vendor.id,
        vendor_bill_number: dto.vendor_bill_number,
        bill_date: dto.bill_date || new Date(),
        due_date: dto.due_date || new Date(Date.now() + 30 * 86400000),
        subtotal: Number(subtotal.toFixed(2)),
        taxable_amount: Number(totalTaxable.toFixed(2)),
        cgst_amount: Number(totalCgst.toFixed(2)),
        sgst_amount: Number(totalSgst.toFixed(2)),
        igst_amount: Number(totalIgst.toFixed(2)),
        total_amount: Number(billTotal.toFixed(2)),
        amount_paid: 0,
        balance_due: Number(billTotal.toFixed(2)),
        status: BillStatus.POSTED,
        financial_year_id: activeFy.id,
        created_by_id: userId,
      });
      const savedBill = await manager.save(bill);

      const createdItems = itemsToSave.map((itm) =>
        manager.create(VendorBillItem, {
          ...itm,
          bill_id: savedBill.id,
        }),
      );
      await manager.save(VendorBillItem, createdItems);

      // Post Journal Entry (Double Entry)
      const apAccount = await this.accountingService.getAccountByCode('2000'); // Accounts Payable
      const inputCgst = await this.accountingService.getAccountByCode('1200'); // Input CGST
      const inputSgst = await this.accountingService.getAccountByCode('1201'); // Input SGST
      const inputIgst = await this.accountingService.getAccountByCode('1202'); // Input IGST

      if (!apAccount) throw new BadRequestException('Accounts Payable account (2000) not found');

      const lines: { account_id: string; debit: number; credit: number }[] = [];

      // Debit expense accounts for each item
      for (const itm of itemsToSave) {
        lines.push({
          account_id: itm.account_id,
          debit: Number(itm.taxable_value),
          credit: 0,
        });
      }

      // Debit Input GST (ITC)
      if (totalCgst > 0 && inputCgst) {
        lines.push({ account_id: inputCgst.id, debit: Number(totalCgst.toFixed(2)), credit: 0 });
      }
      if (totalSgst > 0 && inputSgst) {
        lines.push({ account_id: inputSgst.id, debit: Number(totalSgst.toFixed(2)), credit: 0 });
      }
      if (totalIgst > 0 && inputIgst) {
        lines.push({ account_id: inputIgst.id, debit: Number(totalIgst.toFixed(2)), credit: 0 });
      }

      // Credit Accounts Payable for billTotal
      lines.push({
        account_id: apAccount.id,
        debit: 0,
        credit: Number(billTotal.toFixed(2)),
      });

      const journalEntry = await this.accountingService.postJournalEntry({
        narration: `Vendor Bill ${billNumber} from ${vendor.name}`,
        posting_date: savedBill.bill_date,
        source_type: JournalSourceType.VENDOR_BILL,
        source_id: savedBill.id,
        financial_year_id: activeFy.id,
        created_by_id: userId,
        lines,
      });

      savedBill.journal_entry_id = journalEntry.id;
      await manager.save(savedBill);

      return savedBill.id;
    });

    return this.findById(billId);
  }
}
