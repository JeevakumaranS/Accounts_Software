import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PayrollRun } from './entities/payroll-run.entity';
import { PayrollItem } from './entities/payroll-item.entity';
import { SalaryPayment } from './entities/salary-payment.entity';
import { Employee } from '../employees/entities/employee.entity';
import { CashBankAccount } from '../cash-bank/entities/cash-bank-account.entity';
import { AccountingService } from '../accounting/accounting.service';
import { CompanyService } from '../company/company.service';
import { PayrollStatus } from '../../shared/enums/payroll-status.enum';
import { SalaryPaymentStatus } from '../../shared/enums/salary-payment-status.enum';
import { EmployeeStatus } from '../../shared/enums/employee-status.enum';
import { JournalSourceType } from '../../shared/enums/journal-source-type.enum';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollRun)
    private readonly runRepository: Repository<PayrollRun>,
    @InjectRepository(PayrollItem)
    private readonly itemRepository: Repository<PayrollItem>,
    @InjectRepository(SalaryPayment)
    private readonly paymentRepository: Repository<SalaryPayment>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(CashBankAccount)
    private readonly bankAccountRepository: Repository<CashBankAccount>,
    private readonly accountingService: AccountingService,
    private readonly companyService: CompanyService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<PayrollRun[]> {
    return this.runRepository.find({
      relations: ['items', 'items.employee'],
      order: { payroll_year: 'DESC', payroll_month: 'DESC' },
    });
  }

  async findById(id: string): Promise<PayrollRun> {
    const run = await this.runRepository.findOne({
      where: { id },
      relations: ['items', 'items.employee', 'journal_entry'],
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  // Calculate Payroll for a given month and year
  async calculatePayroll(month: number, year: number, userId: string): Promise<PayrollRun> {
    const activeFy = await this.companyService.getActiveFinancialYear();
    if (!activeFy) throw new BadRequestException('No active financial year found');

    const existing = await this.runRepository.findOne({
      where: { payroll_month: month, payroll_year: year },
    });
    if (existing && existing.status !== PayrollStatus.DRAFT) {
      throw new ConflictException(`Payroll for ${month}/${year} is already ${existing.status}`);
    }

    const employees = await this.employeeRepository.find({
      where: { status: EmployeeStatus.ACTIVE },
    });
    if (employees.length === 0) {
      throw new BadRequestException('No active employees found to process payroll');
    }

    const runId = await this.dataSource.transaction(async (manager) => {
      let run = existing;
      if (!run) {
        run = manager.create(PayrollRun, {
          payroll_month: month,
          payroll_year: year,
          status: PayrollStatus.CALCULATED,
          financial_year_id: activeFy.id,
          created_by_id: userId,
          total_gross: 0,
          total_deductions: 0,
          total_net_pay: 0,
        });
        run = await manager.save(run);
      } else {
        await manager.delete(PayrollItem, { payroll_run_id: run.id });
      }

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      const items: PayrollItem[] = [];

      for (const emp of employees) {
        const basic = Number(emp.basic_salary) || 0;
        const hra = Number(emp.hra) || 0;
        const allowances = Number(emp.allowances) || 0;
        const incentives = 0;
        const gross = basic + hra + allowances + incentives;

        // Standard statutory deductions: PF 12% on basic, Professional Tax / ESI
        const pf = Number((basic * 0.12).toFixed(2));
        const tds = 0;
        const esi = 0;
        const other = 0;
        const advance = 0;
        const deductions = pf + tds + esi + other + advance;
        const net = gross - deductions;

        totalGross += gross;
        totalDeductions += deductions;
        totalNet += net;

        const itm = manager.create(PayrollItem, {
          payroll_run_id: run.id,
          employee_id: emp.id,
          basic,
          hra,
          allowances,
          incentives,
          gross_earnings: gross,
          pf_deduction: pf,
          esi_deduction: esi,
          tds_deduction: tds,
          other_deductions: other,
          total_deductions: deductions,
          advance_recovery: advance,
          net_pay: net,
          payment_status: SalaryPaymentStatus.PENDING,
        });
        items.push(itm);
      }

      await manager.save(items);

      run.total_gross = Number(totalGross.toFixed(2));
      run.total_deductions = Number(totalDeductions.toFixed(2));
      run.total_net_pay = Number(totalNet.toFixed(2));
      run.status = PayrollStatus.CALCULATED;
      await manager.save(run);

      return run.id;
    });

    return this.findById(runId);
  }

  // Approve & Post Payroll Journal
  async postPayroll(id: string, userId: string): Promise<PayrollRun> {
    const run = await this.findById(id);
    if (run.status === PayrollStatus.POSTED) {
      throw new BadRequestException('Payroll is already posted');
    }

    const salaryExpenseAcc = await this.accountingService.getAccountByCode('5000'); // Employee Salary Expense
    const deductionsPayableAcc = await this.accountingService.getAccountByCode('2400'); // Employee Deductions Payable
    const netSalaryPayableAcc = await this.accountingService.getAccountByCode('2200'); // Net Salary Payable

    if (!salaryExpenseAcc || !netSalaryPayableAcc) {
      throw new BadRequestException('Salary accounts (5000, 2200) not found in Chart of Accounts');
    }

    const lines: { account_id: string; debit: number; credit: number }[] = [];

    // Debit Salary Expense for Total Gross
    lines.push({
      account_id: salaryExpenseAcc.id,
      debit: Number(run.total_gross),
      credit: 0,
    });

    // Credit Deductions Payable for Total Deductions
    if (run.total_deductions > 0 && deductionsPayableAcc) {
      lines.push({
        account_id: deductionsPayableAcc.id,
        debit: 0,
        credit: Number(run.total_deductions),
      });
    }

    // Credit Net Salary Payable for Total Net Pay
    lines.push({
      account_id: netSalaryPayableAcc.id,
      debit: 0,
      credit: Number(run.total_net_pay),
    });

    const journalEntry = await this.accountingService.postJournalEntry({
      narration: `Payroll for ${run.payroll_month}/${run.payroll_year}`,
      posting_date: new Date(),
      source_type: JournalSourceType.PAYROLL,
      source_id: run.id,
      financial_year_id: run.financial_year_id,
      created_by_id: userId,
      lines,
    });

    run.status = PayrollStatus.POSTED;
    run.journal_entry_id = journalEntry.id;
    await this.runRepository.save(run);

    return run;
  }

  // Record Salary Payment to an employee
  async recordSalaryPayment(
    itemId: string,
    bankAccountId: string,
    paymentMode: any,
    userId: string,
  ): Promise<SalaryPayment> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: ['payroll_run', 'employee'],
    });
    if (!item) throw new NotFoundException('Payroll item not found');
    if (item.payment_status === SalaryPaymentStatus.PAID) {
      throw new BadRequestException('Salary is already paid for this employee');
    }

    const bankAccount = await this.bankAccountRepository.findOne({
      where: { id: bankAccountId },
      relations: ['ledger_account'],
    });
    if (!bankAccount) throw new BadRequestException('Bank account not found');

    const netSalaryPayableAcc = await this.accountingService.getAccountByCode('2200');
    if (!netSalaryPayableAcc) throw new BadRequestException('Net Salary Payable (2200) not found');

    return this.dataSource.transaction(async (manager) => {
      const netAmount = Number(item.net_pay);

      // Create salary payment record
      const payment = manager.create(SalaryPayment, {
        payroll_item_id: item.id,
        amount: netAmount,
        payment_date: new Date(),
        payment_mode: paymentMode,
        account_id: bankAccount.id,
      });
      const saved = await manager.save(payment);

      // Post Double Entry:
      // Debit: Net Salary Payable (2200)
      // Credit: Bank Account
      const journalEntry = await this.accountingService.postJournalEntry({
        narration: `Salary payment to ${item.employee.name} for ${item.payroll_run.payroll_month}/${item.payroll_run.payroll_year}`,
        posting_date: new Date(),
        source_type: JournalSourceType.PAYROLL,
        source_id: saved.id,
        financial_year_id: item.payroll_run.financial_year_id,
        created_by_id: userId,
        lines: [
          {
            account_id: netSalaryPayableAcc.id,
            debit: netAmount,
            credit: 0,
          },
          {
            account_id: bankAccount.ledger_account_id,
            debit: 0,
            credit: netAmount,
          },
        ],
      });

      saved.journal_entry_id = journalEntry.id;
      await manager.save(saved);

      // Mark item as PAID
      item.payment_status = SalaryPaymentStatus.PAID;
      item.payment_date = new Date();
      await manager.save(item);

      // Update bank account balance
      bankAccount.current_balance = Number(
        (Number(bankAccount.current_balance) - netAmount).toFixed(2),
      );
      await manager.save(bankAccount);

      return saved;
    });
  }

  // Get payslips for a payroll run
  async getPayslips(runId: string) {
    const run = await this.findById(runId);
    return {
      run,
      company: await this.companyService.getSettings(),
      payslips: run.items.map((item) => ({
        employee: item.employee,
        month: run.payroll_month,
        year: run.payroll_year,
        basic: item.basic,
        hra: item.hra,
        allowances: item.allowances,
        gross: item.gross_earnings,
        pf: item.pf_deduction,
        tds: item.tds_deduction,
        total_deductions: item.total_deductions,
        net_pay: item.net_pay,
        status: item.payment_status,
      })),
    };
  }
}
