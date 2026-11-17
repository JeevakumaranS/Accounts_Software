import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { BillStatus } from '../../../shared/enums/bill-status.enum';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { VendorBillItem } from './vendor-bill-item.entity';
import { VendorPaymentAllocation } from '../../payables/entities/vendor-payment-allocation.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { FinancialYear } from '../../company/entities/financial-year.entity';
import { User } from '../../users/entities/user.entity';

@Entity('vendor_bills')
@Unique(['vendor_id', 'vendor_bill_number'])
export class VendorBill extends BaseEntity {
  @Column({ unique: true })
  bill_number: string;

  @Column({ type: 'uuid' })
  vendor_id: string;

  @Column({ nullable: true })
  vendor_bill_number: string;

  @Column({ type: 'date' })
  bill_date: Date;

  @Column({ type: 'date' })
  due_date: Date;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  subtotal: number;

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

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  amount_paid: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  balance_due: number;

  @Column({ type: 'enum', enum: BillStatus, default: BillStatus.DRAFT })
  status: BillStatus;

  @Column({ type: 'uuid' })
  financial_year_id: string;

  @Column({ type: 'uuid', nullable: true })
  journal_entry_id: string | null;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @OneToMany(() => VendorBillItem, (item) => item.bill, { cascade: true })
  items: VendorBillItem[];

  @OneToMany(() => VendorPaymentAllocation, (allocation) => allocation.bill)
  payment_allocations: VendorPaymentAllocation[];

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
