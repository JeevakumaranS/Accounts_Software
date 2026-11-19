import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Invoice } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItem extends BaseEntity {
  @Column({ type: 'uuid' })
  invoice_id: string;

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

  @Column('numeric', { precision: 5, scale: 2, default: 0 })
  discount_percent: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  discount_amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  taxable_value: number;

  @Column('numeric', { precision: 5, scale: 2, default: 0 })
  tax_rate: number;

  @Column('numeric', { precision: 5, scale: 2, default: 0 })
  cess_rate: number;

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

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
