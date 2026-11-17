import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { PaymentMode } from '../../../shared/enums/payment-mode.enum';
import { PaymentStatus } from '../../../shared/enums/payment-status.enum';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { VendorPaymentAllocation } from './vendor-payment-allocation.entity';
import { CashBankAccount } from '../../cash-bank/entities/cash-bank-account.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { FinancialYear } from '../../company/entities/financial-year.entity';
import { User } from '../../users/entities/user.entity';

@Entity('vendor_payments')
export class VendorPayment extends BaseEntity {
  @Column({ unique: true })
  payment_number: string;

  @Column({ type: 'uuid' })
  vendor_id: string;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMode })
  payment_mode: PaymentMode;

  @Column({ type: 'uuid' })
  paying_account_id: string;

  @Column({ nullable: true })
  reference_number: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.POSTED })
  status: PaymentStatus;

  @Column({ type: 'uuid', nullable: true })
  journal_entry_id: string | null;

  @Column({ type: 'uuid' })
  financial_year_id: string;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @OneToMany(() => VendorPaymentAllocation, (allocation) => allocation.payment, { cascade: true })
  allocations: VendorPaymentAllocation[];

  @ManyToOne(() => CashBankAccount)
  @JoinColumn({ name: 'paying_account_id' })
  paying_account: CashBankAccount;

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
