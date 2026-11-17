import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { VendorBill } from './vendor-bill.entity';
import { ChartOfAccounts } from '../../accounting/entities/chart-of-accounts.entity';

@Entity('vendor_bill_items')
export class VendorBillItem extends BaseEntity {
  @Column({ type: 'uuid' })
  bill_id: string;

  @Column({ type: 'uuid' })
  account_id: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  hsn_sac: string;

  @Column('numeric', { precision: 10, scale: 3, default: 1 })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  unit_price: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  taxable_value: number;

  @Column('numeric', { precision: 5, scale: 2, default: 0 })
  tax_rate: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  cgst_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  sgst_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  igst_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  total_amount: number;

  @ManyToOne(() => VendorBill, (bill) => bill.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill: VendorBill;

  @ManyToOne(() => ChartOfAccounts)
  @JoinColumn({ name: 'account_id' })
  account: ChartOfAccounts;
}
