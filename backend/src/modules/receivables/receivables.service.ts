import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerPayment } from './entities/customer-payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { CashBankAccount } from '../cash-bank/entities/cash-bank-account.entity';
import { AccountingService } from '../accounting/accounting.service';
import { CompanyService } from '../company/company.service';
import { PaymentStatus } from '../../shared/enums/payment-status.enum';
import { InvoiceStatus } from '../../shared/enums/invoice-status.enum';
import { JournalSourceType } from '../../shared/enums/journal-source-type.enum';

export interface CreateReceiptDto {
  customer_id: string;
  payment_date: Date;
  amount: number;
  payment_mode: any;
  receiving_account_id: string;
  reference_number?: string;
  remarks?: string;
  allocations: {
    invoice_id: string;
    allocated_amount: number;
  }[];
}

@Injectable()
export class ReceivablesService {
  constructor(
    @InjectRepository(CustomerPayment)
    private readonly paymentRepository: Repository<CustomerPayment>,
    @InjectRepository(PaymentAllocation)
    private readonly allocationRepository: Repository<PaymentAllocation>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(CashBankAccount)
    private readonly bankAccountRepository: Repository<CashBankAccount>,
    private readonly accountingService: AccountingService,
    private readonly companyService: CompanyService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<CustomerPayment[]> {
    return this.paymentRepository.find({
      relations: ['customer', 'receiving_account', 'allocations', 'allocations.invoice'],
      order: { payment_date: 'DESC' },
    });
  }

  async findById(id: string): Promise<CustomerPayment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['customer', 'receiving_account', 'allocations', 'allocations.invoice', 'journal_entry'],
    });
    if (!payment) throw new NotFoundException('Payment receipt not found');
    return payment;
  }

  async createReceipt(dto: CreateReceiptDto, userId: string): Promise<CustomerPayment> {
    const activeFy = await this.companyService.getActiveFinancialYear();
    if (!activeFy) throw new BadRequestException('No active financial year found');

    const receivingAccount = await this.bankAccountRepository.findOne({
      where: { id: dto.receiving_account_id },
      relations: ['ledger_account'],
    });
    if (!receivingAccount) throw new BadRequestException('Receiving cash/bank account not found');

    const arAccount = await this.accountingService.getAccountByCode('1100'); // Accounts Receivable
    if (!arAccount) throw new BadRequestException('Accounts Receivable account (1100) not found');

    const totalAmount = Number(dto.amount);
    if (totalAmount <= 0) throw new BadRequestException('Amount must be greater than zero');

    const paymentId = await this.dataSource.transaction(async (manager) => {
      const count = await manager.count(CustomerPayment);
      const receiptNumber = `DZT/REC/${activeFy.name}/${String(count + 1).padStart(4, '0')}`;

      // 1. Create CustomerPayment record
      const payment = manager.create(CustomerPayment, {
        receipt_number: receiptNumber,
        customer_id: dto.customer_id,
        payment_date: dto.payment_date || new Date(),
        amount: totalAmount,
        payment_mode: dto.payment_mode,
        receiving_account_id: receivingAccount.id,
        reference_number: dto.reference_number,
        remarks: dto.remarks,
        status: PaymentStatus.POSTED,
        financial_year_id: activeFy.id,
        created_by_id: userId,
      });
      const savedPayment = await manager.save(payment);

      // 2. Process Allocations & update invoices
      let allocatedTotal = 0;
      for (const alloc of dto.allocations || []) {
        const inv = await manager.findOne(Invoice, { where: { id: alloc.invoice_id } });
        if (inv) {
          const allocAmount = Number(alloc.allocated_amount);
          allocatedTotal += allocAmount;

          const allocation = manager.create(PaymentAllocation, {
            payment_id: savedPayment.id,
            invoice_id: inv.id,
            allocated_amount: allocAmount,
          });
          await manager.save(allocation);

          inv.amount_paid = Number((Number(inv.amount_paid) + allocAmount).toFixed(2));
          inv.balance_due = Number((Number(inv.balance_due) - allocAmount).toFixed(2));
          if (inv.balance_due <= 0.01) {
            inv.status = InvoiceStatus.PAID;
            inv.balance_due = 0;
          } else {
            inv.status = InvoiceStatus.PARTIALLY_PAID;
          }
          await manager.save(inv);
        }
      }

      // 3. Post Double-entry Journal:
      // Debit: Receiving Cash/Bank Ledger Account = totalAmount
      // Credit: Accounts Receivable = totalAmount
      const journalEntry = await this.accountingService.postJournalEntry({
        narration: `Receipt ${receiptNumber} from customer`,
        posting_date: dto.payment_date || new Date(),
        source_type: JournalSourceType.RECEIPT,
        source_id: savedPayment.id,
        financial_year_id: activeFy.id,
        created_by_id: userId,
        lines: [
          {
            account_id: receivingAccount.ledger_account_id,
            debit: totalAmount,
            credit: 0,
          },
          {
            account_id: arAccount.id,
            debit: 0,
            credit: totalAmount,
          },
        ],
      });

      savedPayment.journal_entry_id = journalEntry.id;
      await manager.save(savedPayment);

      // 4. Update bank account balance
      receivingAccount.current_balance = Number(
        (Number(receivingAccount.current_balance) + totalAmount).toFixed(2),
      );
      await manager.save(receivingAccount);

      return savedPayment.id;
    });

    return this.findById(paymentId);
  }

  // Ageing report for Receivables
  async getAgeingReport() {
    const invoices = await this.invoiceRepository.find({
      where: [{ status: InvoiceStatus.POSTED }, { status: InvoiceStatus.PARTIALLY_PAID }],
      relations: ['customer'],
    });

    const now = new Date().getTime();
    let current = 0;
    let days1_30 = 0;
    let days31_60 = 0;
    let days61_90 = 0;
    let above90 = 0;

    for (const inv of invoices) {
      const due = new Date(inv.due_date).getTime();
      const bal = Number(inv.balance_due) || 0;
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
      total_outstanding: current + days1_30 + days31_60 + days61_90 + above90,
    };
  }
}
