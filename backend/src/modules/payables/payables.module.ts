import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorPayment } from './entities/vendor-payment.entity';
import { VendorPaymentAllocation } from './entities/vendor-payment-allocation.entity';
import { VendorBill } from '../vendor-bills/entities/vendor-bill.entity';
import { CashBankAccount } from '../cash-bank/entities/cash-bank-account.entity';
import { PayablesService } from './payables.service';
import { PayablesController } from './payables.controller';
import { AccountingModule } from '../accounting/accounting.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VendorPayment,
      VendorPaymentAllocation,
      VendorBill,
      CashBankAccount,
    ]),
    AccountingModule,
    CompanyModule,
  ],
  controllers: [PayablesController],
  providers: [PayablesService],
  exports: [PayablesService],
})
export class PayablesModule {}
