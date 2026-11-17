import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { VendorPayment } from './vendor-payment.entity';
import { VendorBill } from '../../vendor-bills/entities/vendor-bill.entity';

@Entity('vendor_payment_allocations')
export class VendorPaymentAllocation extends BaseEntity {
  @Column({ type: 'uuid' })
  payment_id: string;

  @Column({ type: 'uuid' })
  bill_id: string;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  allocated_amount: number;

  @ManyToOne(() => VendorPayment, (payment) => payment.allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: VendorPayment;

  @ManyToOne(() => VendorBill, (bill) => bill.payment_allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill: VendorBill;
}
