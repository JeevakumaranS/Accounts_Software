import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { ChartOfAccounts } from '../../accounting/entities/chart-of-accounts.entity';

@Entity('expense_categories')
export class ExpenseCategory extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  account_id: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => ChartOfAccounts, { nullable: true })
  @JoinColumn({ name: 'account_id' })
  account: ChartOfAccounts | null;
}
