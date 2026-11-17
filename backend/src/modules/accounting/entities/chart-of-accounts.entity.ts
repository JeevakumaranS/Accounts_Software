import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { AccountType } from '../../../shared/enums/account-type.enum';
import { JournalEntryLine } from './journal-entry-line.entity';

@Entity('chart_of_accounts')
export class ChartOfAccounts extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AccountType })
  account_type: AccountType;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string | null;

  @Column({ type: 'boolean', default: false })
  is_system_account: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => ChartOfAccounts, (account) => account.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: ChartOfAccounts | null;

  @OneToMany(() => ChartOfAccounts, (account) => account.parent)
  children: ChartOfAccounts[];

  @OneToMany(() => JournalEntryLine, (line) => line.account)
  journal_entry_lines: JournalEntryLine[];
}
