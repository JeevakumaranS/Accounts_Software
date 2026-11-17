import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { AccountingService } from '../accounting/accounting.service';
import { CompanyService } from '../company/company.service';
import { InvoiceStatus } from '../../shared/enums/invoice-status.enum';
import { JournalSourceType } from '../../shared/enums/journal-source-type.enum';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly itemRepository: Repository<InvoiceItem>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly accountingService: AccountingService,
    private readonly companyService: CompanyService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      relations: ['customer', 'items'],
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'journal_entry', 'journal_entry.lines', 'payment_allocations'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async createDraft(dto: any, userId: string): Promise<Invoice> {
    const activeFy = await this.companyService.getActiveFinancialYear();
    if (!activeFy) throw new BadRequestException('No active financial year found');

    const customer = await this.customerRepository.findOne({ where: { id: dto.customer_id } });
    if (!customer) throw new BadRequestException('Customer not found');

    const companySettings = await this.companyService.getSettings();
    const isInterState = customer.state_code && companySettings.state_code && customer.state_code !== companySettings.state_code;

    // Temporary draft invoice number
    const draftNumber = `DRAFT-${Date.now().toString().slice(-6)}`;

    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTaxable = 0;
    let invoiceTotal = 0;

    const itemsToSave: Partial<InvoiceItem>[] = [];

    for (const item of dto.items || []) {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.unit_price) || 0;
      const lineSubtotal = qty * rate;
      const discountPct = Number(item.discount_percent) || 0;
      const discountAmt = (lineSubtotal * discountPct) / 100;
      const taxableVal = lineSubtotal - discountAmt;
      const taxRate = Number(item.tax_rate) || 18;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterState) {
        igst = Number(((taxableVal * taxRate) / 100).toFixed(2));
      } else {
        const halfRate = taxRate / 2;
        cgst = Number(((taxableVal * halfRate) / 100).toFixed(2));
        sgst = Number(((taxableVal * halfRate) / 100).toFixed(2));
      }

      const lineTotal = taxableVal + cgst + sgst + igst;

      subtotal += lineSubtotal;
      totalTaxable += taxableVal;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      invoiceTotal += lineTotal;

      itemsToSave.push({
        description: item.description || item.item_description,
        hsn_sac: item.hsn_sac || item.hsn_sac_code,
        quantity: qty,
        unit: item.unit || 'NOS',
        unit_price: rate,
        discount_percent: discountPct,
        discount_amount: discountAmt,
        taxable_value: taxableVal,
        tax_rate: taxRate,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        total_amount: lineTotal,
      });
    }

    const invoice = this.invoiceRepository.create({
      invoice_number: draftNumber,
      customer_id: customer.id,
      invoice_date: dto.invoice_date || new Date(),
      due_date: dto.due_date || new Date(Date.now() + 15 * 86400000),
      place_of_supply: customer.state || 'Tamil Nadu',
      is_reverse_charge: dto.is_reverse_charge || false,
      subtotal: Number(subtotal.toFixed(2)),
      discount_amount: Number((dto.discount_amount || 0).toFixed(2)),
      taxable_amount: Number(totalTaxable.toFixed(2)),
      cgst_amount: Number(totalCgst.toFixed(2)),
      sgst_amount: Number(totalSgst.toFixed(2)),
      igst_amount: Number(totalIgst.toFixed(2)),
      total_amount: Number(invoiceTotal.toFixed(2)),
      amount_paid: 0,
      balance_due: Number(invoiceTotal.toFixed(2)),
      notes: dto.notes,
      terms: dto.terms,
      status: InvoiceStatus.DRAFT,
      financial_year_id: activeFy.id,
      created_by_id: userId,
    });

    const saved = await this.invoiceRepository.save(invoice);
    const createdItems = itemsToSave.map((itm) =>
      this.itemRepository.create({
        ...itm,
        invoice_id: saved.id,
      }),
    );
    await this.itemRepository.save(createdItems);

    return this.findById(saved.id);
  }

  // Post Invoice -> Assign official unique statutory number and create balanced Journal Entry
  async postInvoice(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT invoices can be posted');
    }

    const activeFy = await this.companyService.getActiveFinancialYear();
    const fyName = activeFy ? activeFy.name : '2026-27';

    return this.dataSource.transaction(async (manager) => {
      // 1. Generate sequential official invoice number e.g. DZT/INV/2026-27/0001
      const count = await manager
        .createQueryBuilder(Invoice, 'inv')
        .where('inv.status != :status', { status: InvoiceStatus.DRAFT })
        .andWhere('inv.financial_year_id = :fyId', { fyId: invoice.financial_year_id })
        .getCount();

      const statutoryNumber = `DZT/INV/${fyName}/${String(count + 1).padStart(4, '0')}`;

      // 2. Fetch Control Accounts
      const arAccount = await this.accountingService.getAccountByCode('1100'); // Accounts Receivable
      const revenueAccount = await this.accountingService.getAccountByCode('4000'); // Service Revenue
      const cgstAccount = await this.accountingService.getAccountByCode('2100'); // Output CGST
      const sgstAccount = await this.accountingService.getAccountByCode('2101'); // Output SGST
      const igstAccount = await this.accountingService.getAccountByCode('2102'); // Output IGST

      if (!arAccount || !revenueAccount) {
        throw new BadRequestException('Essential chart of accounts (1100, 4000) not configured');
      }

      // Build balanced journal lines
      const journalLines: { account_id: string; debit: number; credit: number }[] = [];

      // Debit AR for invoice total
      journalLines.push({
        account_id: arAccount.id,
        debit: Number(invoice.total_amount),
        credit: 0,
      });

      // Credit Service Revenue for taxable amount
      journalLines.push({
        account_id: revenueAccount.id,
        debit: 0,
        credit: Number(invoice.taxable_amount),
      });

      // Credit Output GST
      if (invoice.cgst_amount > 0 && cgstAccount) {
        journalLines.push({
          account_id: cgstAccount.id,
          debit: 0,
          credit: Number(invoice.cgst_amount),
        });
      }
      if (invoice.sgst_amount > 0 && sgstAccount) {
        journalLines.push({
          account_id: sgstAccount.id,
          debit: 0,
          credit: Number(invoice.sgst_amount),
        });
      }
      if (invoice.igst_amount > 0 && igstAccount) {
        journalLines.push({
          account_id: igstAccount.id,
          debit: 0,
          credit: Number(invoice.igst_amount),
        });
      }

      // Post Journal Entry through accounting engine
      const journalEntry = await this.accountingService.postJournalEntry({
        narration: `Sales Invoice ${statutoryNumber} to ${invoice.customer.name}`,
        posting_date: invoice.invoice_date,
        source_type: JournalSourceType.INVOICE,
        source_id: invoice.id,
        financial_year_id: invoice.financial_year_id,
        created_by_id: userId,
        lines: journalLines,
      });

      // Update invoice to POSTED
      invoice.invoice_number = statutoryNumber;
      invoice.status = InvoiceStatus.POSTED;
      invoice.journal_entry_id = journalEntry.id;
      await manager.save(invoice);

      return invoice;
    });
  }

  // Cancel Invoice
  async cancelInvoice(id: string, reason: string, userId: string): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Invoice is already cancelled');
    }
    if (invoice.amount_paid > 0) {
      throw new BadRequestException('Cannot cancel invoice with recorded payments. Reverse payments first.');
    }

    if (invoice.journal_entry_id) {
      await this.accountingService.reverseJournalEntry(invoice.journal_entry_id, userId, `Invoice cancelled: ${reason}`);
    }

    invoice.status = InvoiceStatus.CANCELLED;
    return this.invoiceRepository.save(invoice);
  }
}
