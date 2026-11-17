import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import { CashBankAccount } from '../cash-bank/entities/cash-bank-account.entity';
import { AccountingService } from '../accounting/accounting.service';
import { CompanyService } from '../company/company.service';
import { ExpenseStatus } from '../../shared/enums/expense-status.enum';
import { ExpenseType } from '../../shared/enums/expense-type.enum';
import { JournalSourceType } from '../../shared/enums/journal-source-type.enum';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepository: Repository<ExpenseCategory>,
    @InjectRepository(CashBankAccount)
    private readonly bankAccountRepository: Repository<CashBankAccount>,
    private readonly accountingService: AccountingService,
    private readonly companyService: CompanyService,
    private readonly dataSource: DataSource,
  ) {}

  // Categories
  async getCategories(): Promise<ExpenseCategory[]> {
    return this.categoryRepository.find({
      relations: ['account'],
      order: { name: 'ASC' },
    });
  }

  async createCategory(data: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    const cat = this.categoryRepository.create(data);
    return this.categoryRepository.save(cat);
  }

  // Expenses
  async findAll(): Promise<Expense[]> {
    return this.expenseRepository.find({
      relations: ['category', 'vendor', 'payment_account'],
      order: { expense_date: 'DESC' },
    });
  }

  async findById(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['category', 'category.account', 'vendor', 'payment_account', 'journal_entry'],
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async createExpense(dto: any, userId: string): Promise<Expense> {
    const activeFy = await this.companyService.getActiveFinancialYear();
    if (!activeFy) throw new BadRequestException('No active financial year found');

    const category = await this.categoryRepository.findOne({
      where: { id: dto.category_id },
      relations: ['account'],
    });
    if (!category) throw new BadRequestException('Expense category not found');

    let paymentAccount: CashBankAccount | null = null;
    if (dto.payment_account_id) {
      paymentAccount = await this.bankAccountRepository.findOne({
        where: { id: dto.payment_account_id },
        relations: ['ledger_account'],
      });
      if (!paymentAccount) throw new BadRequestException('Payment cash/bank account not found');
    }

    const count = await this.expenseRepository.count();
    const expenseNumber = `EXP/${activeFy.name}/${String(count + 1).padStart(4, '0')}`;

    const taxableAmount = Number(dto.taxable_amount) || Number(dto.total_amount) || 0;
    const cgst = Number(dto.cgst_amount) || 0;
    const sgst = Number(dto.sgst_amount) || 0;
    const igst = Number(dto.igst_amount) || 0;
    const totalAmount = taxableAmount + cgst + sgst + igst;

    const expenseId = await this.dataSource.transaction(async (manager) => {
      const expense = manager.create(Expense, {
        expense_number: expenseNumber,
        category_id: category.id,
        vendor_id: dto.vendor_id || null,
        description: dto.description,
        expense_date: dto.expense_date || new Date(),
        taxable_amount: taxableAmount,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        total_amount: totalAmount,
        payment_account_id: paymentAccount ? paymentAccount.id : null,
        payment_mode: dto.payment_mode || null,
        bill_number: dto.bill_number,
        remarks: dto.remarks,
        expense_type: dto.expense_type || ExpenseType.CASH_BANK,
        status: ExpenseStatus.POSTED,
        financial_year_id: activeFy.id,
        created_by_id: userId,
      });
      const savedExpense = await manager.save(expense);

      // Post Journal Entry if paid via Cash/Bank
      if (paymentAccount && category.account_id) {
        const inputCgst = await this.accountingService.getAccountByCode('1200');
        const inputSgst = await this.accountingService.getAccountByCode('1201');
        const inputIgst = await this.accountingService.getAccountByCode('1202');

        const lines: { account_id: string; debit: number; credit: number }[] = [];

        // Debit Expense Account
        lines.push({
          account_id: category.account_id,
          debit: taxableAmount,
          credit: 0,
        });

        // Debit Input GST if any
        if (cgst > 0 && inputCgst) lines.push({ account_id: inputCgst.id, debit: cgst, credit: 0 });
        if (sgst > 0 && inputSgst) lines.push({ account_id: inputSgst.id, debit: sgst, credit: 0 });
        if (igst > 0 && inputIgst) lines.push({ account_id: inputIgst.id, debit: igst, credit: 0 });

        // Credit Bank/Cash Account
        lines.push({
          account_id: paymentAccount.ledger_account_id,
          debit: 0,
          credit: totalAmount,
        });

        const journalEntry = await this.accountingService.postJournalEntry({
          narration: `Expense ${expenseNumber}: ${dto.description}`,
          posting_date: savedExpense.expense_date,
          source_type: JournalSourceType.EXPENSE,
          source_id: savedExpense.id,
          financial_year_id: activeFy.id,
          created_by_id: userId,
          lines,
        });

        savedExpense.journal_entry_id = journalEntry.id;
        await manager.save(savedExpense);

        // Deduct payment account current_balance
        paymentAccount.current_balance = Number(
          (Number(paymentAccount.current_balance) - totalAmount).toFixed(2),
        );
        await manager.save(paymentAccount);
      }

      return savedExpense.id;
    });

    return this.findById(expenseId);
  }
}
