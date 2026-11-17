import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

// Modules
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { CustomersModule } from './modules/customers/customers.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ReceivablesModule } from './modules/receivables/receivables.module';
import { VendorBillsModule } from './modules/vendor-bills/vendor-bills.module';
import { PayablesModule } from './modules/payables/payables.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { CashBankModule } from './modules/cash-bank/cash-bank.module';
import { GstModule } from './modules/gst/gst.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'durozen_accounts'),
        autoLoadEntities: true,
        synchronize: true, // Auto schema sync in development
        logging: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    CompanyModule,
    CustomersModule,
    VendorsModule,
    AccountingModule,
    InvoicesModule,
    ReceivablesModule,
    VendorBillsModule,
    PayablesModule,
    ExpensesModule,
    EmployeesModule,
    PayrollModule,
    CashBankModule,
    GstModule,
    DashboardModule,
    ReportsModule,
    AttachmentsModule,
    AuditModule,
    NotificationsModule,
  ],
})
export class AppModule {}
