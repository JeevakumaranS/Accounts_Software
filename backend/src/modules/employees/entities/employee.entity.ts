import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { EmployeeStatus } from '../../../shared/enums/employee-status.enum';

@Entity('employees')
export class Employee extends BaseEntity {
  @Column({ unique: true })
  employee_code: string;

  @Column()
  name: string;

  @Column()
  department: string;

  @Column()
  designation: string;

  @Column({ type: 'date' })
  joining_date: Date;

  @Column({ type: 'enum', enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  status: EmployeeStatus;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  basic_salary: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  hra: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  allowances: number;

  @Column({ nullable: true })
  pan: string;

  @Column({ nullable: true })
  uan: string;

  @Column({ nullable: true })
  esi_number: string;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  bank_account_number: string;

  @Column({ nullable: true })
  bank_ifsc: string;
}
