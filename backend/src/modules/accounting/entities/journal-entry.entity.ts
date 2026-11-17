import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { JournalSourceType } from '../../../shared/enums/journal-source-type.enum';
import { JournalStatus } from '../../../shared/enums/journal-status.enum';
import { JournalEntryLine } from './journal-entry-line.entity';
import { FinancialYear } from '../../company/entities/financial-year.entity';
import { User } from '../../users/entities/user.entity';

@Entity('journal_entries')
export class JournalEntry extends BaseEntity {
  @Column({ unique: true })
  entry_number: string;

  @Column({ type: 'enum', enum: JournalSourceType })
  source_type: JournalSourceType;

  @Column({ type: 'uuid', nullable: true })
  source_id: string | null;

  @Column({ type: 'text', nullable: true })
  narration: string | null;

  @Column({ type: 'date' })
  posting_date: Date;

  @Column({ type: 'enum', enum: JournalStatus, default: JournalStatus.POSTED })
  status: JournalStatus;

  @Column({ type: 'uuid', nullable: true })
  reversed_by_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  reversal_of_id: string | null;

  @Column({ type: 'uuid' })
  financial_year_id: string;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @Column({ unique: true, nullable: true })
  idempotency_key: string | null;

  @OneToMany(() => JournalEntryLine, (line) => line.journal_entry, { cascade: true })
  lines: JournalEntryLine[];

  @ManyToOne(() => FinancialYear)
  @JoinColumn({ name: 'financial_year_id' })
  financial_year: FinancialYear;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  @ManyToOne(() => JournalEntry, { nullable: true })
  @JoinColumn({ name: 'reversed_by_id' })
  reversed_by: JournalEntry | null;

  @ManyToOne(() => JournalEntry, { nullable: true })
  @JoinColumn({ name: 'reversal_of_id' })
  reversal_of: JournalEntry | null;
}
