import { Entity, Column, OneToMany, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { PayrollStatus } from '../../../shared/enums/payroll-status.enum';
import { PayrollItem } from './payroll-item.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { FinancialYear } from '../../company/entities/financial-year.entity';
import { User } from '../../users/entities/user.entity';

@Entity('payroll_runs')
@Unique(['payroll_month', 'payroll_year'])
export class PayrollRun extends BaseEntity {
  @Column({ type: 'int' })
  payroll_month: number;

  @Column({ type: 'int' })
  payroll_year: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  total_gross: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  total_deductions: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  total_net_pay: number;

  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT })
  status: PayrollStatus;

  @Column({ type: 'uuid', nullable: true })
  journal_entry_id: string | null;

  @Column({ type: 'uuid' })
  financial_year_id: string;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @OneToMany(() => PayrollItem, (item) => item.payroll_run, { cascade: true })
  items: PayrollItem[];

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
