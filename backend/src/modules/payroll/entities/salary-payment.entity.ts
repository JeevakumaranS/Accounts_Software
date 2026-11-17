import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { PaymentMode } from '../../../shared/enums/payment-mode.enum';
import { PayrollItem } from './payroll-item.entity';
import { CashBankAccount } from '../../cash-bank/entities/cash-bank-account.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';

@Entity('salary_payments')
export class SalaryPayment extends BaseEntity {
  @Column({ type: 'uuid' })
  payroll_item_id: string;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'enum', enum: PaymentMode })
  payment_mode: PaymentMode;

  @Column({ type: 'uuid' })
  account_id: string;

  @Column({ nullable: true })
  reference_number: string;

  @Column({ type: 'uuid', nullable: true })
  journal_entry_id: string | null;

  @ManyToOne(() => PayrollItem)
  @JoinColumn({ name: 'payroll_item_id' })
  payroll_item: PayrollItem;

  @ManyToOne(() => CashBankAccount)
  @JoinColumn({ name: 'account_id' })
  account: CashBankAccount;

  @ManyToOne(() => JournalEntry, { nullable: true })
  @JoinColumn({ name: 'journal_entry_id' })
  journal_entry: JournalEntry | null;
}
