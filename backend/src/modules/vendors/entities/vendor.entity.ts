import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { CustomerStatus } from '../../../shared/enums/customer-status.enum';

@Entity('vendors')
export class Vendor extends BaseEntity {
  @Column({ unique: true })
  vendor_code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  contact_person: string;

  @Column()
  mobile: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  gstin: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  state_code: string;

  @Column({ nullable: true })
  pincode: string;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  bank_account_number: string;

  @Column({ nullable: true })
  bank_ifsc: string;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  opening_balance: number;

  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status: CustomerStatus;
}
