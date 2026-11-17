import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CashBankAccount } from './entities/cash-bank-account.entity';
import { AccountTransaction } from './entities/account-transaction.entity';
import { AccountingService } from '../accounting/accounting.service';
import { CompanyService } from '../company/company.service';
import { AccountTransactionType } from '../../shared/enums/account-transaction-type.enum';
import { JournalSourceType } from '../../shared/enums/journal-source-type.enum';

@Injectable()
export class CashBankService {
  constructor(
    @InjectRepository(CashBankAccount)
    private readonly accountRepository: Repository<CashBankAccount>,
    @InjectRepository(AccountTransaction)
    private readonly txRepository: Repository<AccountTransaction>,
    private readonly accountingService: AccountingService,
    private readonly companyService: CompanyService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<CashBankAccount[]> {
    return this.accountRepository.find({
      relations: ['ledger_account'],
      order: { created_at: 'ASC' },
    });
  }

  async findById(id: string): Promise<CashBankAccount> {
    const acc = await this.accountRepository.findOne({
      where: { id },
      relations: ['ledger_account'],
    });
    if (!acc) throw new NotFoundException('Cash/Bank account not found');
    return acc;
  }

  async create(data: Partial<CashBankAccount>): Promise<CashBankAccount> {
    const acc = this.accountRepository.create(data);
    return this.accountRepository.save(acc);
  }

  // Internal transfer between accounts (e.g. Bank A -> Bank B, Cash -> Bank deposit, Bank -> Cash withdrawal)
  async transfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    date: Date,
    description: string,
    userId: string,
  ) {
    if (fromAccountId === toAccountId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }
    const transferAmount = Number(amount);
    if (transferAmount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than zero');
    }

    const fromAcc = await this.findById(fromAccountId);
    const toAcc = await this.findById(toAccountId);
    const activeFy = await this.companyService.getActiveFinancialYear();
    if (!activeFy) throw new BadRequestException('No active financial year found');

    return this.dataSource.transaction(async (manager) => {
      // 1. Deduct from source account
      fromAcc.current_balance = Number(
        (Number(fromAcc.current_balance) - transferAmount).toFixed(2),
      );
      await manager.save(fromAcc);

      // 2. Add to destination account
      toAcc.current_balance = Number(
        (Number(toAcc.current_balance) + transferAmount).toFixed(2),
      );
      await manager.save(toAcc);

      // 3. Post Balanced Journal Entry (Neither income nor expense)
      // Debit: To Account Ledger
      // Credit: From Account Ledger
      const journalEntry = await this.accountingService.postJournalEntry({
        narration: `Internal transfer: ${fromAcc.account_name} -> ${toAcc.account_name}. ${description || ''}`,
        posting_date: date || new Date(),
        source_type: JournalSourceType.TRANSFER,
        financial_year_id: activeFy.id,
        created_by_id: userId,
        lines: [
          {
            account_id: toAcc.ledger_account_id,
            debit: transferAmount,
            credit: 0,
          },
          {
            account_id: fromAcc.ledger_account_id,
            debit: 0,
            credit: transferAmount,
          },
        ],
      });

      // 4. Record transactions
      const txOut = manager.create(AccountTransaction, {
        account_id: fromAcc.id,
        transaction_type: AccountTransactionType.TRANSFER_OUT,
        amount: transferAmount,
        running_balance: fromAcc.current_balance,
        reference_id: journalEntry.id,
        reference_type: 'JOURNAL',
        description: `Transfer to ${toAcc.account_name}`,
        transaction_date: date || new Date(),
      });

      const txIn = manager.create(AccountTransaction, {
        account_id: toAcc.id,
        transaction_type: AccountTransactionType.TRANSFER_IN,
        amount: transferAmount,
        running_balance: toAcc.current_balance,
        reference_id: journalEntry.id,
        reference_type: 'JOURNAL',
        description: `Transfer from ${fromAcc.account_name}`,
        transaction_date: date || new Date(),
      });

      await manager.save([txOut, txIn]);

      return {
        message: 'Transfer completed successfully',
        journal_entry: journalEntry,
        from_account: fromAcc,
        to_account: toAcc,
      };
    });
  }

  // Get statement / transaction list for an account
  async getTransactions(accountId: string) {
    const account = await this.findById(accountId);
    const transactions = await this.txRepository.find({
      where: { account_id: accountId },
      order: { transaction_date: 'DESC', created_at: 'DESC' },
    });
    return { account, transactions };
  }
}
