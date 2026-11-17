import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

// All Entities
import { User } from '../../modules/users/entities/user.entity';
import { CompanySettings } from '../../modules/company/entities/company-settings.entity';
import { FinancialYear } from '../../modules/company/entities/financial-year.entity';
import { ChartOfAccounts } from '../../modules/accounting/entities/chart-of-accounts.entity';
import { JournalEntry } from '../../modules/accounting/entities/journal-entry.entity';
import { JournalEntryLine } from '../../modules/accounting/entities/journal-entry-line.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Vendor } from '../../modules/vendors/entities/vendor.entity';
import { Invoice } from '../../modules/invoices/entities/invoice.entity';
import { InvoiceItem } from '../../modules/invoices/entities/invoice-item.entity';
import { CustomerPayment } from '../../modules/receivables/entities/customer-payment.entity';
import { PaymentAllocation } from '../../modules/receivables/entities/payment-allocation.entity';
import { VendorBill } from '../../modules/vendor-bills/entities/vendor-bill.entity';
import { VendorBillItem } from '../../modules/vendor-bills/entities/vendor-bill-item.entity';
import { VendorPayment } from '../../modules/payables/entities/vendor-payment.entity';
import { VendorPaymentAllocation } from '../../modules/payables/entities/vendor-payment-allocation.entity';
import { ExpenseCategory } from '../../modules/expenses/entities/expense-category.entity';
import { Expense } from '../../modules/expenses/entities/expense.entity';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { PayrollRun } from '../../modules/payroll/entities/payroll-run.entity';
import { PayrollItem } from '../../modules/payroll/entities/payroll-item.entity';
import { SalaryPayment } from '../../modules/payroll/entities/salary-payment.entity';
import { CashBankAccount } from '../../modules/cash-bank/entities/cash-bank-account.entity';
import { AccountTransaction } from '../../modules/cash-bank/entities/account-transaction.entity';
import { TaxRate } from '../../modules/gst/entities/tax-rate.entity';
import { Attachment } from '../../modules/attachments/entities/attachment.entity';
import { AuditLog } from '../../modules/audit/entities/audit-log.entity';
import { Notification } from '../../modules/notifications/entities/notification.entity';

// Enums
import { Role } from '../../shared/enums/role.enum';
import { UserStatus } from '../../shared/enums/user-status.enum';
import { AccountType } from '../../shared/enums/account-type.enum';
import { FinancialYearStatus } from '../../shared/enums/financial-year-status.enum';
import { CashBankAccountType } from '../../shared/enums/cash-bank-account-type.enum';
import { TaxType } from '../../shared/enums/tax-type.enum';
import { EmployeeStatus } from '../../shared/enums/employee-status.enum';
import { CustomerStatus } from '../../shared/enums/customer-status.enum';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'user',
  database: process.env.DB_NAME || 'durozen_accounts',
  entities: [
    User,
    CompanySettings,
    FinancialYear,
    ChartOfAccounts,
    JournalEntry,
    JournalEntryLine,
    Customer,
    Vendor,
    Invoice,
    InvoiceItem,
    CustomerPayment,
    PaymentAllocation,
    VendorBill,
    VendorBillItem,
    VendorPayment,
    VendorPaymentAllocation,
    ExpenseCategory,
    Expense,
    Employee,
    PayrollRun,
    PayrollItem,
    SalaryPayment,
    CashBankAccount,
    AccountTransaction,
    TaxRate,
    Attachment,
    AuditLog,
    Notification,
  ],
  synchronize: true,
});

async function runSeed() {
  console.log('🌱 Connecting to database for seeding...');
  await dataSource.initialize();
  console.log('✅ Connected.');

  const userRepo = dataSource.getRepository(User);
  const companyRepo = dataSource.getRepository(CompanySettings);
  const fyRepo = dataSource.getRepository(FinancialYear);
  const coaRepo = dataSource.getRepository(ChartOfAccounts);
  const bankRepo = dataSource.getRepository(CashBankAccount);
  const taxRepo = dataSource.getRepository(TaxRate);
  const expCatRepo = dataSource.getRepository(ExpenseCategory);
  const empRepo = dataSource.getRepository(Employee);
  const custRepo = dataSource.getRepository(Customer);
  const vendRepo = dataSource.getRepository(Vendor);

  // 1. Users
  const adminExists = await userRepo.findOne({ where: { email: 'admin@durozen.com' } });
  if (!adminExists) {
    const adminPass = await bcrypt.hash('Admin@123', 12);
    const admin = userRepo.create({
      name: 'CEO Administrator',
      email: 'admin@durozen.com',
      password_hash: adminPass,
      role: Role.CEO,
      status: UserStatus.ACTIVE,
    });
    await userRepo.save(admin);
    console.log('👤 Created CEO user: admin@durozen.com / Admin@123');
  }

  const accExists = await userRepo.findOne({ where: { email: 'accountant@durozen.com' } });
  if (!accExists) {
    const accPass = await bcrypt.hash('Accountant@123', 12);
    const accountant = userRepo.create({
      name: 'Chief Accountant',
      email: 'accountant@durozen.com',
      password_hash: accPass,
      role: Role.ACCOUNTANT,
      status: UserStatus.ACTIVE,
    });
    await userRepo.save(accountant);
    console.log('👤 Created Accountant user: accountant@durozen.com / Accountant@123');
  }

  // 2. Company Settings
  const companyExists = await companyRepo.find();
  if (companyExists.length === 0) {
    const company = companyRepo.create({
      legal_name: 'Durozen Technologies Pvt. Ltd.',
      gstin: '33AABCD1234E1Z5',
      address: '123 Tech Park, Anna Salai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      state_code: '33',
      pincode: '600002',
      phone: '+91 98765 43210',
      email: 'accounts@durozen.com',
    });
    await companyRepo.save(company);
    console.log('🏢 Created Company Settings for Durozen Technologies Pvt. Ltd.');
  }

  // 3. Financial Year
  const fyExists = await fyRepo.findOne({ where: { name: '2026-27' } });
  if (!fyExists) {
    const fy = fyRepo.create({
      name: '2026-27',
      start_date: new Date('2026-04-01'),
      end_date: new Date('2027-03-31'),
      status: FinancialYearStatus.ACTIVE,
    });
    await fyRepo.save(fy);
    console.log('📅 Created Financial Year 2026-27 (Active)');
  }

  // 4. Chart of Accounts
  const defaultAccounts = [
    { code: '1000', name: 'Cash in Hand', account_type: AccountType.ASSET, is_system_account: true },
    { code: '1010', name: 'Bank Account', account_type: AccountType.ASSET, is_system_account: true },
    { code: '1100', name: 'Accounts Receivable', account_type: AccountType.ASSET, is_system_account: true },
    { code: '1200', name: 'Input CGST', account_type: AccountType.ASSET, is_system_account: true },
    { code: '1201', name: 'Input SGST', account_type: AccountType.ASSET, is_system_account: true },
    { code: '1202', name: 'Input IGST', account_type: AccountType.ASSET, is_system_account: true },
    { code: '1300', name: 'Fixed Assets', account_type: AccountType.ASSET, is_system_account: true },
    { code: '2000', name: 'Accounts Payable', account_type: AccountType.LIABILITY, is_system_account: true },
    { code: '2100', name: 'Output CGST', account_type: AccountType.LIABILITY, is_system_account: true },
    { code: '2101', name: 'Output SGST', account_type: AccountType.LIABILITY, is_system_account: true },
    { code: '2102', name: 'Output IGST', account_type: AccountType.LIABILITY, is_system_account: true },
    { code: '2200', name: 'Salary Payable', account_type: AccountType.LIABILITY, is_system_account: true },
    { code: '2300', name: 'Statutory Payables', account_type: AccountType.LIABILITY, is_system_account: true },
    { code: '2400', name: 'Employee Deductions Payable', account_type: AccountType.LIABILITY, is_system_account: true },
    { code: '2500', name: 'Customer Advances', account_type: AccountType.LIABILITY, is_system_account: true },
    { code: '3000', name: "Owner's Capital / Equity", account_type: AccountType.EQUITY, is_system_account: true },
    { code: '3100', name: 'Retained Earnings', account_type: AccountType.EQUITY, is_system_account: true },
    { code: '4000', name: 'Service Revenue', account_type: AccountType.INCOME, is_system_account: true },
    { code: '4100', name: 'Other Income', account_type: AccountType.INCOME, is_system_account: true },
    { code: '5000', name: 'Employee Salary Expense', account_type: AccountType.EXPENSE, is_system_account: true },
    { code: '5100', name: 'Office Rent', account_type: AccountType.EXPENSE, is_system_account: true },
    { code: '5200', name: 'Internet and Utilities', account_type: AccountType.EXPENSE, is_system_account: true },
    { code: '5300', name: 'Marketing Expense', account_type: AccountType.EXPENSE, is_system_account: true },
    { code: '5400', name: 'Software Subscription', account_type: AccountType.EXPENSE, is_system_account: true },
    { code: '5500', name: 'Travel Expense', account_type: AccountType.EXPENSE, is_system_account: true },
    { code: '5600', name: 'Other Operating Expenses', account_type: AccountType.EXPENSE, is_system_account: true },
  ];

  const coaMap = new Map<string, ChartOfAccounts>();
  for (const acc of defaultAccounts) {
    let existing = await coaRepo.findOne({ where: { code: acc.code } });
    if (!existing) {
      existing = coaRepo.create(acc);
      existing = await coaRepo.save(existing);
    }
    coaMap.set(acc.code, existing);
  }
  console.log(`📊 Verified ${defaultAccounts.length} Chart of Accounts entries.`);

  // 5. Cash & Bank Accounts
  const cashLedger = coaMap.get('1000');
  const bankLedger = coaMap.get('1010');

  const cashAcc = await bankRepo.findOne({ where: { account_name: 'Cash in Hand' } });
  if (!cashAcc && cashLedger) {
    await bankRepo.save(
      bankRepo.create({
        account_name: 'Cash in Hand',
        account_type: CashBankAccountType.CASH,
        opening_balance: 25000,
        current_balance: 25000,
        ledger_account_id: cashLedger.id,
      }),
    );
  }

  const bankAcc = await bankRepo.findOne({ where: { account_name: 'HDFC Current Account' } });
  if (!bankAcc && bankLedger) {
    await bankRepo.save(
      bankRepo.create({
        account_name: 'HDFC Current Account',
        account_type: CashBankAccountType.CURRENT_ACCOUNT,
        bank_name: 'HDFC Bank',
        account_number: '50200012345678',
        ifsc_code: 'HDFC0000123',
        opening_balance: 550000,
        current_balance: 550000,
        ledger_account_id: bankLedger.id,
      }),
    );
  }
  console.log('🏦 Verified default Cash and Bank Accounts.');

  // 6. GST Tax Rates
  const defaultRates = [
    { tax_name: 'GST 5%', rate: 5, tax_type: TaxType.IGST },
    { tax_name: 'CGST 2.5%', rate: 2.5, tax_type: TaxType.CGST },
    { tax_name: 'SGST 2.5%', rate: 2.5, tax_type: TaxType.SGST },
    { tax_name: 'GST 12%', rate: 12, tax_type: TaxType.IGST },
    { tax_name: 'CGST 6%', rate: 6, tax_type: TaxType.CGST },
    { tax_name: 'SGST 6%', rate: 6, tax_type: TaxType.SGST },
    { tax_name: 'GST 18%', rate: 18, tax_type: TaxType.IGST },
    { tax_name: 'CGST 9%', rate: 9, tax_type: TaxType.CGST },
    { tax_name: 'SGST 9%', rate: 9, tax_type: TaxType.SGST },
    { tax_name: 'GST 28%', rate: 28, tax_type: TaxType.IGST },
  ];
  for (const r of defaultRates) {
    const existing = await taxRepo.findOne({ where: { tax_name: r.tax_name } });
    if (!existing) {
      await taxRepo.save(
        taxRepo.create({
          tax_name: r.tax_name,
          rate: r.rate,
          tax_type: r.tax_type,
          effective_from: new Date('2026-04-01'),
        }),
      );
    }
  }

  // 7. Expense Categories
  const categories = [
    { name: 'Office Rent', code: '5100' },
    { name: 'Electricity and Utilities', code: '5200' },
    { name: 'Internet', code: '5200' },
    { name: 'Employee Welfare', code: '5600' },
    { name: 'Travel and Conveyance', code: '5500' },
    { name: 'Marketing and Advertising', code: '5300' },
    { name: 'Software Subscriptions', code: '5400' },
    { name: 'Office Maintenance', code: '5600' },
    { name: 'Hardware and Equipment', code: '1300' },
    { name: 'Professional Fees', code: '5600' },
    { name: 'Bank Charges', code: '5600' },
    { name: 'Training', code: '5600' },
    { name: 'Miscellaneous', code: '5600' },
  ];
  for (const c of categories) {
    const existing = await expCatRepo.findOne({ where: { name: c.name } });
    if (!existing) {
      const acc = coaMap.get(c.code);
      await expCatRepo.save(
        expCatRepo.create({
          name: c.name,
          account_id: acc ? acc.id : null,
        }),
      );
    }
  }

  // 8. Sample Employees
  const empCount = await empRepo.count();
  if (empCount === 0) {
    await empRepo.save([
      empRepo.create({
        employee_code: 'EMP-0001',
        name: 'Arun Kumar',
        department: 'Engineering',
        designation: 'Senior Lead Architect',
        joining_date: new Date('2025-01-15'),
        status: EmployeeStatus.ACTIVE,
        basic_salary: 75000,
        hra: 30000,
        allowances: 20000,
        pan: 'ABCDE1234F',
        uan: '100987654321',
        bank_name: 'HDFC Bank',
        bank_account_number: '123456789012',
        bank_ifsc: 'HDFC0000123',
      }),
      empRepo.create({
        employee_code: 'EMP-0002',
        name: 'Sneha Reddy',
        department: 'Product & Design',
        designation: 'UI/UX Lead',
        joining_date: new Date('2025-03-01'),
        status: EmployeeStatus.ACTIVE,
        basic_salary: 50000,
        hra: 20000,
        allowances: 15000,
        pan: 'WXYZ9876K',
        bank_name: 'ICICI Bank',
        bank_account_number: '987654321098',
        bank_ifsc: 'ICIC0000987',
      }),
    ]);
    console.log('👥 Created sample employees.');
  }

  // 9. Sample Customers & Vendors
  const custCount = await custRepo.count();
  if (custCount === 0) {
    await custRepo.save([
      custRepo.create({
        customer_code: 'CUST-0001',
        name: 'Omni Retail Solutions Pvt. Ltd.',
        business_name: 'Omni Retail',
        contact_person: 'Vikram Mehta',
        mobile: '9840123456',
        email: 'finance@omniretail.in',
        gstin: '33AAFCO1234K1Z2',
        billing_address: '42 Mount Road, Guindy',
        city: 'Chennai',
        state: 'Tamil Nadu',
        state_code: '33',
        pincode: '600032',
        opening_balance: 0,
        status: CustomerStatus.ACTIVE,
      }),
      custRepo.create({
        customer_code: 'CUST-0002',
        name: 'Zenith Global Technologies',
        business_name: 'Zenith Global',
        contact_person: 'Ananya Roy',
        mobile: '9880198765',
        email: 'accounts@zenithglobal.com',
        gstin: '29AABCG5678L1Z9',
        billing_address: '88 Brigade Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        state_code: '29',
        pincode: '560025',
        opening_balance: 0,
        status: CustomerStatus.ACTIVE,
      }),
    ]);
    console.log('🤝 Created sample customers (Tamil Nadu & Karnataka).');
  }

  const vendCount = await vendRepo.count();
  if (vendCount === 0) {
    await vendRepo.save([
      vendRepo.create({
        vendor_code: 'VEND-0001',
        name: 'Amazon Web Services India',
        contact_person: 'Billing Team',
        mobile: '9820011223',
        email: 'aws-in-billing@amazon.com',
        gstin: '27AAECB2971P1ZT',
        address: 'Bandra Kurla Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        state_code: '27',
        pincode: '400051',
      }),
      vendRepo.create({
        vendor_code: 'VEND-0002',
        name: 'Airtel Broadband Enterprises',
        contact_person: 'Enterprise Relationship Desk',
        mobile: '9845099887',
        email: 'support@airtel.in',
        gstin: '33AABCA2801J1ZM',
        address: 'Nelson Manickam Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        state_code: '33',
        pincode: '600029',
      }),
    ]);
    console.log('📦 Created sample vendors.');
  }

  await dataSource.destroy();
  console.log('✨ Database seeding complete!');
}

runSeed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
