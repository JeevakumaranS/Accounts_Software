import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Invoice } from './invoice.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { FinancialYear } from '../../company/entities/financial-year.entity';
import { User } from '../../users/entities/user.entity';

@Entity('credit_notes')
export class CreditNote extends BaseEntity {
  @Column({ unique: true })
  credit_note_number: string;

  @Column({ type: 'uuid' })
  invoice_id: string;

  @Column({ type: 'uuid' })
  customer_id: string;

  @Column({ type: 'date' })
  credit_note_date: Date;

  @Column()
  reason: string;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  taxable_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  cgst_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  sgst_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  igst_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  cess_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  total_amount: number;

  @Column({ default: 'POSTED' })
  status: string;

  @Column({ type: 'uuid' })
  financial_year_id: string;

  @Column({ type: 'uuid', nullable: true })
  journal_entry_id: string | null;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

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
