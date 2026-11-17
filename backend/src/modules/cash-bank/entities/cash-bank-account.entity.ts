import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { CashBankAccountType } from '../../../shared/enums/cash-bank-account-type.enum';
import { ChartOfAccounts } from '../../accounting/entities/chart-of-accounts.entity';

@Entity('cash_bank_accounts')
export class CashBankAccount extends BaseEntity {
  @Column()
  account_name: string;

  @Column({ type: 'enum', enum: CashBankAccountType })
  account_type: CashBankAccountType;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  account_number: string;

  @Column({ nullable: true })
  ifsc_code: string;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  opening_balance: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  current_balance: number;

  @Column({ type: 'uuid' })
  ledger_account_id: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => ChartOfAccounts)
  @JoinColumn({ name: 'ledger_account_id' })
  ledger_account: ChartOfAccounts;
}
