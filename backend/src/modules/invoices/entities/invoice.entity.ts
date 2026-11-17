import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { InvoiceStatus } from '../../../shared/enums/invoice-status.enum';
import { Customer } from '../../customers/entities/customer.entity';
import { InvoiceItem } from './invoice-item.entity';
import { PaymentAllocation } from '../../receivables/entities/payment-allocation.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { FinancialYear } from '../../company/entities/financial-year.entity';
import { User } from '../../users/entities/user.entity';

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ unique: true })
  invoice_number: string;

  @Column({ type: 'uuid' })
  customer_id: string;

  @Column({ type: 'date' })
  invoice_date: Date;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ nullable: true })
  place_of_supply: string;

  @Column({ type: 'date', nullable: true })
  supply_date: Date;

  @Column({ type: 'boolean', default: false })
  is_reverse_charge: boolean;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  subtotal: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  discount_amount: number;

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

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  amount_paid: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  balance_due: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  terms: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'uuid' })
  financial_year_id: string;

  @Column({ type: 'uuid', nullable: true })
  journal_entry_id: string | null;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @ManyToOne(() => Customer, (customer) => customer.invoices)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @OneToMany(() => PaymentAllocation, (allocation) => allocation.invoice)
  payment_allocations: PaymentAllocation[];

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
