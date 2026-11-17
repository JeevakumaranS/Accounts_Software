import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { FinancialYearStatus } from '../../../shared/enums/financial-year-status.enum';

@Entity('financial_years')
export class FinancialYear extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'enum', enum: FinancialYearStatus, default: FinancialYearStatus.ACTIVE })
  status: FinancialYearStatus;
}
