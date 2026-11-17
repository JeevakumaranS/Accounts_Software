import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChartOfAccounts } from './entities/chart-of-accounts.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { JournalSourceType } from '../../shared/enums/journal-source-type.enum';
import { JournalStatus } from '../../shared/enums/journal-status.enum';
import { FinancialYear } from '../company/entities/financial-year.entity';
import { FinancialYearStatus } from '../../shared/enums/financial-year-status.enum';

export interface PostJournalDto {
  narration?: string;
  posting_date: Date;
  source_type: JournalSourceType;
  source_id?: string;
  financial_year_id: string;
  created_by_id: string;
  idempotency_key?: string;
  lines: {
    account_id: string;
    debit: number;
    credit: number;
  }[];
}

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(ChartOfAccounts)
    private readonly coaRepository: Repository<ChartOfAccounts>,
    @InjectRepository(JournalEntry)
    private readonly journalRepository: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine)
    private readonly lineRepository: Repository<JournalEntryLine>,
    private readonly dataSource: DataSource,
  ) {}

  // Chart of Accounts
  async getAccounts(): Promise<ChartOfAccounts[]> {
    return this.coaRepository.find({
      order: { code: 'ASC' },
      relations: ['children'],
    });
  }

  async getAccountById(id: string): Promise<ChartOfAccounts> {
    const acc = await this.coaRepository.findOne({ where: { id } });
    if (!acc) throw new NotFoundException('Account not found');
    return acc;
  }

  async getAccountByCode(code: string): Promise<ChartOfAccounts | null> {
    return this.coaRepository.findOne({ where: { code } });
  }

  async createAccount(data: Partial<ChartOfAccounts>): Promise<ChartOfAccounts> {
    const existing = await this.coaRepository.findOne({ where: { code: data.code } });
    if (existing) {
      throw new ConflictException(`Account with code ${data.code} already exists`);
    }
    const acc = this.coaRepository.create(data);
    return this.coaRepository.save(acc);
  }

  // Journal Entries Engine
  async postJournalEntry(dto: PostJournalDto): Promise<JournalEntry> {
    // 1. Validate at least two lines
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('A journal entry must contain at least two lines');
    }

    // 2. Validate balanced debit and credit
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of dto.lines) {
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      if (debit < 0 || credit < 0) {
        throw new BadRequestException('Debits and credits cannot be negative');
      }
      if (debit === 0 && credit === 0) {
        throw new BadRequestException('Line must have either debit or credit greater than zero');
      }
      totalDebit += debit;
      totalCredit += credit;
    }

    // Rounding check to 2 decimal places
    const diff = Math.abs(Math.round(totalDebit * 100) - Math.round(totalCredit * 100));
    if (diff > 0.01) {
      throw new BadRequestException(
        `Journal entry is unbalanced: Total Debit = ₹${totalDebit.toFixed(2)}, Total Credit = ₹${totalCredit.toFixed(2)}`,
      );
    }

    // 3. Check idempotency
    if (dto.idempotency_key) {
      const existing = await this.journalRepository.findOne({
        where: { idempotency_key: dto.idempotency_key },
        relations: ['lines'],
      });
      if (existing) return existing;
    }

    let fyId = dto.financial_year_id;
    if (!fyId) {
      const activeFy = await this.dataSource.getRepository(FinancialYear).findOne({ where: { status: FinancialYearStatus.ACTIVE } });
      fyId = activeFy?.id;
    }

    // 4. Generate sequential entry number in atomic transaction
    return this.dataSource.transaction(async (manager) => {
      const count = await manager.count(JournalEntry);
      const entry_number = `JRN/${new Date().getFullYear()}/${String(count + 1).padStart(5, '0')}`;

      const entry = manager.create(JournalEntry, {
        entry_number,
        source_type: dto.source_type || JournalSourceType.MANUAL,
        source_id: dto.source_id || null,
        narration: dto.narration,
        posting_date: dto.posting_date || new Date(),
        status: JournalStatus.POSTED,
        financial_year_id: fyId,
        created_by_id: dto.created_by_id,
        idempotency_key: dto.idempotency_key,
      });
      const savedEntry = await manager.save(entry);

      const lines = dto.lines.map((l) =>
        manager.create(JournalEntryLine, {
          journal_entry_id: savedEntry.id,
          account_id: l.account_id,
          debit: l.debit || 0,
          credit: l.credit || 0,
        }),
      );
      await manager.save(lines);

      return manager.findOne(JournalEntry, {
        where: { id: savedEntry.id },
        relations: ['lines', 'lines.account'],
      });
    });
  }

  // Reverse Journal Entry
  async reverseJournalEntry(
    id: string,
    userId: string,
    reason: string,
  ): Promise<JournalEntry> {
    const entry = await this.journalRepository.findOne({
      where: { id },
      relations: ['lines'],
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.status === JournalStatus.REVERSED) {
      throw new BadRequestException('Journal entry is already reversed');
    }

    return this.dataSource.transaction(async (manager) => {
      const count = await manager.count(JournalEntry);
      const reversal_entry_number = `REV/${new Date().getFullYear()}/${String(count + 1).padStart(5, '0')}`;

      // Create reversing entry (swap debits and credits)
      const reversalEntry = manager.create(JournalEntry, {
        entry_number: reversal_entry_number,
        source_type: entry.source_type,
        source_id: entry.source_id,
        narration: `Reversal of ${entry.entry_number}: ${reason}`,
        posting_date: new Date(),
        status: JournalStatus.POSTED,
        reversal_of_id: entry.id,
        financial_year_id: entry.financial_year_id,
        created_by_id: userId,
      });
      const savedReversal = await manager.save(reversalEntry);

      const reversedLines = entry.lines.map((l) =>
        manager.create(JournalEntryLine, {
          journal_entry_id: savedReversal.id,
          account_id: l.account_id,
          debit: l.credit, // swap
          credit: l.debit, // swap
        }),
      );
      await manager.save(reversedLines);

      // Mark original entry as reversed
      entry.status = JournalStatus.REVERSED;
      entry.reversed_by_id = savedReversal.id;
      await manager.save(entry);

      return savedReversal;
    });
  }

  // Get Journal Register
  async getJournals(page = 1, limit = 20): Promise<{ items: JournalEntry[]; total: number }> {
    const [items, total] = await this.journalRepository.findAndCount({
      relations: ['lines', 'lines.account', 'created_by'],
      order: { posting_date: 'DESC', created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  // General Ledger for an Account
  async getLedger(accountId: string, startDate?: string, endDate?: string) {
    const account = await this.getAccountById(accountId);
    const query = this.lineRepository
      .createQueryBuilder('line')
      .leftJoinAndSelect('line.journal_entry', 'entry')
      .where('line.account_id = :accountId', { accountId })
      .andWhere('entry.status = :status', { status: JournalStatus.POSTED })
      .orderBy('entry.posting_date', 'ASC');

    if (startDate) {
      query.andWhere('entry.posting_date >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('entry.posting_date <= :endDate', { endDate });
    }

    const lines = await query.getMany();

    let runningBalance = 0;
    const items = lines.map((l) => {
      const debit = Number(l.debit);
      const credit = Number(l.credit);
      // For Assets and Expenses, debit increases balance. For Liab, Equity, Income, credit increases balance.
      if (['ASSET', 'EXPENSE'].includes(account.account_type)) {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }
      return {
        id: l.id,
        posting_date: l.journal_entry.posting_date,
        entry_number: l.journal_entry.entry_number,
        narration: l.journal_entry.narration,
        source_type: l.journal_entry.source_type,
        debit,
        credit,
        running_balance: runningBalance,
      };
    });

    return {
      account,
      closing_balance: runningBalance,
      transactions: items,
    };
  }

  // Trial Balance
  async getTrialBalance(asOfDate?: string) {
    const accounts = await this.coaRepository.find({ order: { code: 'ASC' } });
    const result = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const acc of accounts) {
      const q = this.lineRepository
        .createQueryBuilder('line')
        .leftJoin('line.journal_entry', 'entry')
        .where('line.account_id = :accountId', { accountId: acc.id })
        .andWhere('entry.status = :status', { status: JournalStatus.POSTED });

      if (asOfDate) {
        q.andWhere('entry.posting_date <= :asOfDate', { asOfDate });
      }

      const sums = await q
        .select('SUM(line.debit)', 'total_debit')
        .addSelect('SUM(line.credit)', 'total_credit')
        .getRawOne();

      const sumDebit = Number(sums.total_debit) || 0;
      const sumCredit = Number(sums.total_credit) || 0;

      let netDebit = 0;
      let netCredit = 0;

      if (['ASSET', 'EXPENSE'].includes(acc.account_type)) {
        const net = sumDebit - sumCredit;
        if (net >= 0) netDebit = net;
        else netCredit = Math.abs(net);
      } else {
        const net = sumCredit - sumDebit;
        if (net >= 0) netCredit = net;
        else netDebit = Math.abs(net);
      }

      if (sumDebit > 0 || sumCredit > 0) {
        totalDebit += netDebit;
        totalCredit += netCredit;
        result.push({
          code: acc.code,
          name: acc.name,
          account_type: acc.account_type,
          debit: netDebit,
          credit: netCredit,
        });
      }
    }

    return {
      as_of_date: asOfDate || new Date().toISOString().split('T')[0],
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      accounts: result,
    };
  }
}
