import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { AccountTransactionType } from '../../../shared/enums/account-transaction-type.enum';
import { CashBankAccount } from './cash-bank-account.entity';

@Entity('account_transactions')
export class AccountTransaction extends BaseEntity {
  @Column({ type: 'uuid' })
  account_id: string;

  @Column({ type: 'enum', enum: AccountTransactionType })
  transaction_type: AccountTransactionType;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  amount: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  running_balance: number;

  @Column({ nullable: true })
  reference_type: string;

  @Column({ type: 'uuid', nullable: true })
  reference_id: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  transaction_date: Date;

  @ManyToOne(() => CashBankAccount)
  @JoinColumn({ name: 'account_id' })
  account: CashBankAccount;
}
