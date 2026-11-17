import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VendorPayment } from './entities/vendor-payment.entity';
import { VendorPaymentAllocation } from './entities/vendor-payment-allocation.entity';
import { VendorBill } from '../vendor-bills/entities/vendor-bill.entity';
import { CashBankAccount } from '../cash-bank/entities/cash-bank-account.entity';
import { AccountingService } from '../accounting/accounting.service';
import { CompanyService } from '../company/company.service';
import { PaymentStatus } from '../../shared/enums/payment-status.enum';
import { BillStatus } from '../../shared/enums/bill-status.enum';
import { JournalSourceType } from '../../shared/enums/journal-source-type.enum';

export interface CreateVendorPaymentDto {
  vendor_id: string;
  payment_date: Date;
  amount: number;
  payment_mode: any;
  paying_account_id: string;
  reference_number?: string;
  remarks?: string;
  allocations: {
    bill_id: string;
    allocated_amount: number;
  }[];
}

@Injectable()
export class PayablesService {
  constructor(
    @InjectRepository(VendorPayment)
    private readonly paymentRepository: Repository<VendorPayment>,
    @InjectRepository(VendorPaymentAllocation)
    private readonly allocationRepository: Repository<VendorPaymentAllocation>,
    @InjectRepository(VendorBill)
    private readonly billRepository: Repository<VendorBill>,
    @InjectRepository(CashBankAccount)
    private readonly bankAccountRepository: Repository<CashBankAccount>,
    private readonly accountingService: AccountingService,
    private readonly companyService: CompanyService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<VendorPayment[]> {
    return this.paymentRepository.find({
      relations: ['vendor', 'paying_account', 'allocations', 'allocations.bill'],
      order: { payment_date: 'DESC' },
    });
  }

  async findById(id: string): Promise<VendorPayment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['vendor', 'paying_account', 'allocations', 'allocations.bill', 'journal_entry'],
    });
    if (!payment) throw new NotFoundException('Vendor payment not found');
    return payment;
  }

  async createPayment(dto: CreateVendorPaymentDto, userId: string): Promise<VendorPayment> {
    const activeFy = await this.companyService.getActiveFinancialYear();
    if (!activeFy) throw new BadRequestException('No active financial year found');

    const payingAccount = await this.bankAccountRepository.findOne({
      where: { id: dto.paying_account_id },
      relations: ['ledger_account'],
    });
    if (!payingAccount) throw new BadRequestException('Paying cash/bank account not found');

    const apAccount = await this.accountingService.getAccountByCode('2000'); // Accounts Payable
    if (!apAccount) throw new BadRequestException('Accounts Payable account (2000) not found');

    const totalAmount = Number(dto.amount);
    if (totalAmount <= 0) throw new BadRequestException('Amount must be greater than zero');

    const paymentId = await this.dataSource.transaction(async (manager) => {
      const count = await manager.count(VendorPayment);
      const paymentNumber = `DZT/VPAY/${activeFy.name}/${String(count + 1).padStart(4, '0')}`;

      // 1. Create payment record
      const payment = manager.create(VendorPayment, {
        payment_number: paymentNumber,
        vendor_id: dto.vendor_id,
        payment_date: dto.payment_date || new Date(),
        amount: totalAmount,
        payment_mode: dto.payment_mode,
        paying_account_id: payingAccount.id,
        reference_number: dto.reference_number,
        remarks: dto.remarks,
        status: PaymentStatus.POSTED,
        financial_year_id: activeFy.id,
        created_by_id: userId,
      });
      const savedPayment = await manager.save(payment);

      // 2. Process Allocations & update bills
      for (const alloc of dto.allocations || []) {
        const bill = await manager.findOne(VendorBill, { where: { id: alloc.bill_id } });
        if (bill) {
          const allocAmount = Number(alloc.allocated_amount);
          const allocation = manager.create(VendorPaymentAllocation, {
            payment_id: savedPayment.id,
            bill_id: bill.id,
            allocated_amount: allocAmount,
          });
          await manager.save(allocation);

          bill.amount_paid = Number((Number(bill.amount_paid) + allocAmount).toFixed(2));
          bill.balance_due = Number((Number(bill.balance_due) - allocAmount).toFixed(2));
          if (bill.balance_due <= 0.01) {
            bill.status = BillStatus.PAID;
            bill.balance_due = 0;
          } else {
            bill.status = BillStatus.PARTIALLY_PAID;
          }
          await manager.save(bill);
        }
      }

      // 3. Post Double-entry Journal:
      // Debit: Accounts Payable (2000) = totalAmount
      // Credit: Paying Cash/Bank Account = totalAmount
      const journalEntry = await this.accountingService.postJournalEntry({
        narration: `Vendor Payment ${paymentNumber}`,
        posting_date: dto.payment_date || new Date(),
        source_type: JournalSourceType.VENDOR_PAYMENT,
        source_id: savedPayment.id,
        financial_year_id: activeFy.id,
        created_by_id: userId,
        lines: [
          {
            account_id: apAccount.id,
            debit: totalAmount,
            credit: 0,
          },
          {
            account_id: payingAccount.ledger_account_id,
            debit: 0,
            credit: totalAmount,
          },
        ],
      });

      savedPayment.journal_entry_id = journalEntry.id;
      await manager.save(savedPayment);

      // 4. Update paying account balance (decreases by totalAmount)
      payingAccount.current_balance = Number(
        (Number(payingAccount.current_balance) - totalAmount).toFixed(2),
      );
      await manager.save(payingAccount);

      return savedPayment.id;
    });

    return this.findById(paymentId);
  }

  // Payables Ageing Report
  async getAgeingReport() {
    const bills = await this.billRepository.find({
      where: [{ status: BillStatus.POSTED }, { status: BillStatus.PARTIALLY_PAID }],
      relations: ['vendor'],
    });

    const now = new Date().getTime();
    let current = 0;
    let days1_30 = 0;
    let days31_60 = 0;
    let days61_90 = 0;
    let above90 = 0;

    for (const b of bills) {
      const due = new Date(b.due_date).getTime();
      const bal = Number(b.balance_due) || 0;
      if (due >= now) {
        current += bal;
      } else {
        const daysPast = Math.floor((now - due) / (1000 * 60 * 60 * 24));
        if (daysPast <= 30) days1_30 += bal;
        else if (daysPast <= 60) days31_60 += bal;
        else if (daysPast <= 90) days61_90 += bal;
        else above90 += bal;
      }
    }

    return {
      current,
      days1_30,
      days31_60,
      days61_90,
      above90,
      total_payable: current + days1_30 + days31_60 + days61_90 + above90,
    };
  }
}
