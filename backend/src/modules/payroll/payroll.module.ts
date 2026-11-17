import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollRun } from './entities/payroll-run.entity';
import { PayrollItem } from './entities/payroll-item.entity';
import { SalaryPayment } from './entities/salary-payment.entity';
import { Employee } from '../employees/entities/employee.entity';
import { CashBankAccount } from '../cash-bank/entities/cash-bank-account.entity';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { AccountingModule } from '../accounting/accounting.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollRun,
      PayrollItem,
      SalaryPayment,
      Employee,
      CashBankAccount,
    ]),
    AccountingModule,
    CompanyModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
