import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { ExpenseType } from '../../../shared/enums/expense-type.enum';
import { ExpenseStatus } from '../../../shared/enums/expense-status.enum';
import { PaymentMode } from '../../../shared/enums/payment-mode.enum';
import { ExpenseCategory } from './expense-category.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { CashBankAccount } from '../../cash-bank/entities/cash-bank-account.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { FinancialYear } from '../../company/entities/financial-year.entity';
import { User } from '../../users/entities/user.entity';

@Entity('expenses')
export class Expense extends BaseEntity {
  @Column({ unique: true })
  expense_number: string;

  @Column({ type: 'uuid' })
  category_id: string;

  @Column({ type: 'uuid', nullable: true })
  vendor_id: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  expense_date: Date;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  taxable_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  cgst_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  sgst_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  igst_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'uuid', nullable: true })
  payment_account_id: string | null;

  @Column({ type: 'enum', enum: PaymentMode, nullable: true })
  payment_mode: PaymentMode | null;

  @Column({ nullable: true })
  bill_number: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'enum', enum: ExpenseType, default: ExpenseType.CASH_BANK })
  expense_type: ExpenseType;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.DRAFT })
  status: ExpenseStatus;

  @Column({ type: 'uuid', nullable: true })
  journal_entry_id: string | null;

  @Column({ type: 'uuid' })
  financial_year_id: string;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @ManyToOne(() => ExpenseCategory)
  @JoinColumn({ name: 'category_id' })
  category: ExpenseCategory;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor | null;

  @ManyToOne(() => CashBankAccount, { nullable: true })
  @JoinColumn({ name: 'payment_account_id' })
  payment_account: CashBankAccount | null;

  @ManyToOne(() => JournalEntry, { nullable: true })
  @JoinColumn({ name: 'journal_entry_id' })
  journal_entry: JournalEntry | null;

  @ManyToOne(() => FinancialYear)
  @JoinColumn({ name: 'financial_year_id' })
  financial_year: FinancialYear;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;
}
