import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerPayment } from './entities/customer-payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { CashBankAccount } from '../cash-bank/entities/cash-bank-account.entity';
import { ReceivablesService } from './receivables.service';
import { ReceivablesController } from './receivables.controller';
import { AccountingModule } from '../accounting/accounting.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerPayment,
      PaymentAllocation,
      Invoice,
      CashBankAccount,
    ]),
    AccountingModule,
    CompanyModule,
  ],
  controllers: [ReceivablesController],
  providers: [ReceivablesService],
  exports: [ReceivablesService],
})
export class ReceivablesModule {}
