import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../invoices/entities/invoice.entity';
import { VendorBill } from '../vendor-bills/entities/vendor-bill.entity';
import { CashBankAccount } from '../cash-bank/entities/cash-bank-account.entity';
import { JournalEntry } from '../accounting/entities/journal-entry.entity';
import { JournalEntryLine } from '../accounting/entities/journal-entry-line.entity';
import { ChartOfAccounts } from '../accounting/entities/chart-of-accounts.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { GstModule } from '../gst/gst.module';
import { ReceivablesModule } from '../receivables/receivables.module';
import { PayablesModule } from '../payables/payables.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      VendorBill,
      CashBankAccount,
      JournalEntry,
      JournalEntryLine,
      ChartOfAccounts,
    ]),
    GstModule,
    ReceivablesModule,
    PayablesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
