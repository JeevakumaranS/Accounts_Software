import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { SalaryPaymentStatus } from '../../../shared/enums/salary-payment-status.enum';
import { PayrollRun } from './payroll-run.entity';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('payroll_items')
export class PayrollItem extends BaseEntity {
  @Column({ type: 'uuid' })
  payroll_run_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  basic: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  hra: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  allowances: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  incentives: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  gross_earnings: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  pf_deduction: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  esi_deduction: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  tds_deduction: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  other_deductions: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  total_deductions: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  advance_recovery: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  net_pay: number;

  @Column({ type: 'enum', enum: SalaryPaymentStatus, default: SalaryPaymentStatus.PENDING })
  payment_status: SalaryPaymentStatus;

  @Column({ type: 'date', nullable: true })
  payment_date: Date;

  @ManyToOne(() => PayrollRun, (run) => run.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payroll_run_id' })
  payroll_run: PayrollRun;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
