import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { CustomerStatus } from '../../../shared/enums/customer-status.enum';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { CustomerPayment } from '../../receivables/entities/customer-payment.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ unique: true })
  customer_code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  business_name: string;

  @Column({ nullable: true })
  contact_person: string;

  @Column()
  mobile: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  gstin: string;

  @Column()
  billing_address: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  state_code: string;

  @Column({ nullable: true })
  pincode: string;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  opening_balance: number;

  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status: CustomerStatus;

  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices: Invoice[];

  @OneToMany(() => CustomerPayment, (payment) => payment.customer)
  customer_payments: CustomerPayment[];
}
