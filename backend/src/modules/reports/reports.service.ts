import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartOfAccounts } from '../accounting/entities/chart-of-accounts.entity';
import { JournalEntryLine } from '../accounting/entities/journal-entry-line.entity';
import { JournalStatus } from '../../shared/enums/journal-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ChartOfAccounts)
    private readonly coaRepository: Repository<ChartOfAccounts>,
    @InjectRepository(JournalEntryLine)
    private readonly lineRepository: Repository<JournalEntryLine>,
  ) {}

  // Profit and Loss Report
  async getProfitLoss(startDate?: string, endDate?: string) {
    const incomeAccounts = await this.coaRepository.find({
      where: { account_type: 'INCOME' as any },
      order: { code: 'ASC' },
    });
    const expenseAccounts = await this.coaRepository.find({
      where: { account_type: 'EXPENSE' as any },
      order: { code: 'ASC' },
    });

    const incomeDetails = [];
    let totalIncome = 0;

    for (const acc of incomeAccounts) {
      const q = this.lineRepository
        .createQueryBuilder('line')
        .leftJoin('line.journal_entry', 'entry')
        .where('line.account_id = :accId', { accId: acc.id })
        .andWhere('entry.status = :status', { status: JournalStatus.POSTED });

      if (startDate) q.andWhere('entry.posting_date >= :startDate', { startDate });
      if (endDate) q.andWhere('entry.posting_date <= :endDate', { endDate });

      const res = await q.select('SUM(line.credit - line.debit)', 'net').getRawOne();
      const amount = Number(res.net) || 0;
      if (amount !== 0) {
        totalIncome += amount;
        incomeDetails.push({ code: acc.code, name: acc.name, amount });
      }
    }

    const expenseDetails = [];
    let totalExpense = 0;

    for (const acc of expenseAccounts) {
      const q = this.lineRepository
        .createQueryBuilder('line')
        .leftJoin('line.journal_entry', 'entry')
        .where('line.account_id = :accId', { accId: acc.id })
        .andWhere('entry.status = :status', { status: JournalStatus.POSTED });

      if (startDate) q.andWhere('entry.posting_date >= :startDate', { startDate });
      if (endDate) q.andWhere('entry.posting_date <= :endDate', { endDate });

      const res = await q.select('SUM(line.debit - line.credit)', 'net').getRawOne();
      const amount = Number(res.net) || 0;
      if (amount !== 0) {
        totalExpense += amount;
        expenseDetails.push({ code: acc.code, name: acc.name, amount });
      }
    }

    const netProfit = totalIncome - totalExpense;

    return {
      period: {
        startDate: startDate || 'Start of FY',
        endDate: endDate || new Date().toISOString().split('T')[0],
      },
      income: {
        accounts: incomeDetails,
        total_income: Number(totalIncome.toFixed(2)),
      },
      expenses: {
        accounts: expenseDetails,
        total_expense: Number(totalExpense.toFixed(2)),
      },
      net_profit: Number(netProfit.toFixed(2)),
    };
  }

  // Balance Sheet Report (Assets = Liabilities + Equity)
  async getBalanceSheet(asOfDate?: string) {
    const assetAccounts = await this.coaRepository.find({
      where: { account_type: 'ASSET' as any },
      order: { code: 'ASC' },
    });
    const liabilityAccounts = await this.coaRepository.find({
      where: { account_type: 'LIABILITY' as any },
      order: { code: 'ASC' },
    });
    const equityAccounts = await this.coaRepository.find({
      where: { account_type: 'EQUITY' as any },
      order: { code: 'ASC' },
    });

    const assets = [];
    let totalAssets = 0;
    for (const acc of assetAccounts) {
      const q = this.lineRepository
        .createQueryBuilder('line')
        .leftJoin('line.journal_entry', 'entry')
        .where('line.account_id = :accId', { accId: acc.id })
        .andWhere('entry.status = :status', { status: JournalStatus.POSTED });
      if (asOfDate) q.andWhere('entry.posting_date <= :asOfDate', { asOfDate });
      const res = await q.select('SUM(line.debit - line.credit)', 'net').getRawOne();
      const val = Number(res.net) || 0;
      if (val !== 0) {
        totalAssets += val;
        assets.push({ code: acc.code, name: acc.name, amount: val });
      }
    }

    const liabilities = [];
    let totalLiabilities = 0;
    for (const acc of liabilityAccounts) {
      const q = this.lineRepository
        .createQueryBuilder('line')
        .leftJoin('line.journal_entry', 'entry')
        .where('line.account_id = :accId', { accId: acc.id })
        .andWhere('entry.status = :status', { status: JournalStatus.POSTED });
      if (asOfDate) q.andWhere('entry.posting_date <= :asOfDate', { asOfDate });
      const res = await q.select('SUM(line.credit - line.debit)', 'net').getRawOne();
      const val = Number(res.net) || 0;
      if (val !== 0) {
        totalLiabilities += val;
        liabilities.push({ code: acc.code, name: acc.name, amount: val });
      }
    }

    const equity = [];
    let totalEquity = 0;
    for (const acc of equityAccounts) {
      const q = this.lineRepository
        .createQueryBuilder('line')
        .leftJoin('line.journal_entry', 'entry')
        .where('line.account_id = :accId', { accId: acc.id })
        .andWhere('entry.status = :status', { status: JournalStatus.POSTED });
      if (asOfDate) q.andWhere('entry.posting_date <= :asOfDate', { asOfDate });
      const res = await q.select('SUM(line.credit - line.debit)', 'net').getRawOne();
      const val = Number(res.net) || 0;
      if (val !== 0) {
        totalEquity += val;
        equity.push({ code: acc.code, name: acc.name, amount: val });
      }
    }

    // Add Net Profit to Retained Earnings
    const pnl = await this.getProfitLoss(undefined, asOfDate);
    const currentYearProfit = pnl.net_profit;
    const finalTotalEquity = totalEquity + currentYearProfit;

    const totalLiabilitiesAndEquity = totalLiabilities + finalTotalEquity;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.05;

    return {
      as_of_date: asOfDate || new Date().toISOString().split('T')[0],
      assets: {
        accounts: assets,
        total_assets: Number(totalAssets.toFixed(2)),
      },
      liabilities: {
        accounts: liabilities,
        total_liabilities: Number(totalLiabilities.toFixed(2)),
      },
      equity: {
        accounts: equity,
        current_year_earnings: currentYearProfit,
        total_equity: Number(finalTotalEquity.toFixed(2)),
      },
      total_liabilities_and_equity: Number(totalLiabilitiesAndEquity.toFixed(2)),
      is_balanced: isBalanced,
    };
  }

  // Cash Flow Statement
  async getCashFlow(startDate?: string, endDate?: string) {
    const pnl = await this.getProfitLoss(startDate, endDate);
    return {
      operating_activities: {
        net_profit: pnl.net_profit,
        adjustments: 0,
        net_cash_from_operations: pnl.net_profit,
      },
      investing_activities: {
        capital_expenditure: 0,
        net_cash_from_investing: 0,
      },
      financing_activities: {
        equity_introduced: 0,
        net_cash_from_financing: 0,
      },
      net_change_in_cash: pnl.net_profit,
    };
  }
}
