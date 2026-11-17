import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { JournalEntry } from './journal-entry.entity';
import { ChartOfAccounts } from './chart-of-accounts.entity';

@Entity('journal_entry_lines')
export class JournalEntryLine extends BaseEntity {
  @Column({ type: 'uuid' })
  journal_entry_id: string;

  @Column({ type: 'uuid' })
  account_id: string;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  debit: number;

  @Column('numeric', { precision: 18, scale: 2, default: 0 })
  credit: number;

  @ManyToOne(() => JournalEntry, (entry) => entry.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journal_entry_id' })
  journal_entry: JournalEntry;

  @ManyToOne(() => ChartOfAccounts, (account) => account.journal_entry_lines)
  @JoinColumn({ name: 'account_id' })
  account: ChartOfAccounts;
}
