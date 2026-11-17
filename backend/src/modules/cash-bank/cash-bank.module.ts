import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashBankAccount } from './entities/cash-bank-account.entity';
import { AccountTransaction } from './entities/account-transaction.entity';
import { CashBankService } from './cash-bank.service';
import { CashBankController } from './cash-bank.controller';
import { AccountingModule } from '../accounting/accounting.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CashBankAccount, AccountTransaction]),
    AccountingModule,
    CompanyModule,
  ],
  controllers: [CashBankController],
  providers: [CashBankService],
  exports: [CashBankService],
})
export class CashBankModule {}
