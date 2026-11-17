import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { CustomerPayment } from './customer-payment.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';

@Entity('payment_allocations')
export class PaymentAllocation extends BaseEntity {
  @Column({ type: 'uuid' })
  payment_id: string;

  @Column({ type: 'uuid' })
  invoice_id: string;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  allocated_amount: number;

  @ManyToOne(() => CustomerPayment, (payment) => payment.allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: CustomerPayment;

  @ManyToOne(() => Invoice, (invoice) => invoice.payment_allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
