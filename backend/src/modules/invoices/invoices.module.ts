import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CreditNote } from './entities/credit-note.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { AccountingModule } from '../accounting/accounting.module';
import { CompanyModule } from '../company/company.module';
import { AuditModule } from '../audit/audit.module';
import { ReceivablesModule } from '../receivables/receivables.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceItem, Customer, CreditNote]),
    AccountingModule,
    CompanyModule,
    AuditModule,
    ReceivablesModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
