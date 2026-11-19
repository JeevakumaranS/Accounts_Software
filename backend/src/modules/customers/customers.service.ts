import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(): Promise<Customer[]> {
    return this.customerRepository.find({
      relations: ['invoices', 'customer_payments'],
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: [
        'invoices',
        'customer_payments',
        'customer_payments.receiving_account',
      ],
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    // 1. Mandatory Customer Name
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Customer Name is mandatory.');
    }

    // 2. Mandatory Mobile Number & Format Validation
    if (!data.mobile || !data.mobile.trim()) {
      throw new BadRequestException('Mobile Number is mandatory.');
    }
    const cleanMobile = data.mobile.trim();
    if (!/^[+0-9() -]{7,20}$/.test(cleanMobile)) {
      throw new BadRequestException(
        'Invalid Mobile Number format. Please enter a valid phone number.',
      );
    }

    // 3. Optional Email format validation
    if (data.email && data.email.trim()) {
      const cleanEmail = data.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw new BadRequestException('Invalid Email address format.');
      }
      data.email = cleanEmail;
    } else {
      data.email = undefined;
    }

    // 4. Optional GSTIN format validation (Indian 15-char format)
    if (data.gstin && data.gstin.trim()) {
      const cleanGstin = data.gstin.trim().toUpperCase();
      if (
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          cleanGstin,
        )
      ) {
        throw new BadRequestException(
          'Invalid Indian GSTIN format. Expected 15-character alphanumeric format (e.g. 33AABCD1234E1Z5).',
        );
      }
      data.gstin = cleanGstin;
    } else {
      data.gstin = undefined;
    }

    // 5. Mandatory Billing Address
    if (!data.billing_address || !data.billing_address.trim()) {
      throw new BadRequestException('Billing Address is mandatory.');
    }

    // 6. Mandatory State and State Code for GST treatment
    if (
      !data.state ||
      !data.state.trim() ||
      !data.state_code ||
      !data.state_code.trim()
    ) {
      throw new BadRequestException(
        'State and State Code are mandatory for GST treatment.',
      );
    }

    // 7. Duplicate Checks (considering Mobile Number & GSTIN)
    const existingMobile = await this.customerRepository.findOne({
      where: { mobile: cleanMobile },
    });
    if (existingMobile) {
      throw new ConflictException(
        `A customer with mobile number "${cleanMobile}" already exists (${existingMobile.name} - ${existingMobile.customer_code}).`,
      );
    }

    if (data.gstin) {
      const existingGstin = await this.customerRepository.findOne({
        where: { gstin: data.gstin },
      });
      if (existingGstin) {
        throw new ConflictException(
          `A customer with GSTIN "${data.gstin}" already exists (${existingGstin.name} - ${existingGstin.customer_code}).`,
        );
      }
    }

    // 8. Auto-generate unique Customer ID if not supplied
    if (!data.customer_code) {
      const count = await this.customerRepository.count();
      data.customer_code = `CUST-${String(count + 1).padStart(4, '0')}`;
    }

    const customer = this.customerRepository.create({
      ...data,
      name: data.name.trim(),
      mobile: cleanMobile,
      city: data.city?.trim() || 'Chennai',
      state: data.state.trim(),
      state_code: data.state_code.trim(),
      opening_balance: Number(data.opening_balance) || 0,
    });

    return this.customerRepository.save(customer);
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const customer = await this.findById(id);

    // Mobile duplicate check on update
    if (data.mobile && data.mobile.trim() !== customer.mobile) {
      const cleanMobile = data.mobile.trim();
      if (!/^[+0-9() -]{7,20}$/.test(cleanMobile)) {
        throw new BadRequestException('Invalid Mobile Number format.');
      }
      const existingMobile = await this.customerRepository.findOne({
        where: { mobile: cleanMobile },
      });
      if (existingMobile && existingMobile.id !== id) {
        throw new ConflictException(
          `A customer with mobile number "${cleanMobile}" already exists.`,
        );
      }
      customer.mobile = cleanMobile;
    }

    // GSTIN duplicate check on update
    if (data.gstin && data.gstin.trim() !== customer.gstin) {
      const cleanGstin = data.gstin.trim().toUpperCase();
      if (
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          cleanGstin,
        )
      ) {
        throw new BadRequestException('Invalid Indian GSTIN format.');
      }
      const existingGstin = await this.customerRepository.findOne({
        where: { gstin: cleanGstin },
      });
      if (existingGstin && existingGstin.id !== id) {
        throw new ConflictException(
          `A customer with GSTIN "${cleanGstin}" already exists.`,
        );
      }
      customer.gstin = cleanGstin;
    }

    if (data.name) customer.name = data.name.trim();
    if (data.business_name !== undefined) customer.business_name = data.business_name;
    if (data.contact_person !== undefined) customer.contact_person = data.contact_person;
    if (data.email !== undefined) customer.email = data.email?.trim() || undefined;
    if (data.billing_address) customer.billing_address = data.billing_address.trim();
    if (data.city) customer.city = data.city.trim();
    if (data.state) customer.state = data.state.trim();
    if (data.state_code) customer.state_code = data.state_code.trim();
    if (data.status) customer.status = data.status;

    return this.customerRepository.save(customer);
  }

  // Customer Profile, Ledger & Ageing (SRS Section 4.2)
  async getLedger(id: string) {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: [
        'invoices',
        'customer_payments',
        'customer_payments.receiving_account',
      ],
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const invoices = (customer.invoices || []).sort(
      (a, b) =>
        new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime(),
    );

    const payments = (customer.customer_payments || []).sort(
      (a, b) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
    );

    // Filter posted invoices for accounting ledger calculations
    const postedInvoices = invoices.filter(
      (inv) => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED',
    );
    const totalInvoiced = postedInvoices.reduce(
      (sum, inv) => sum + Number(inv.total_amount || 0),
      0,
    );
    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
    const openingBalance = Number(customer.opening_balance || 0);
    const outstandingBalance = Number(
      (openingBalance + totalInvoiced - totalPaid).toFixed(2),
    );

    // Customer Ageing breakdown based on overdue posted invoices
    const now = new Date().getTime();
    let current = 0;
    let days1_30 = 0;
    let days31_60 = 0;
    let days61_90 = 0;
    let above90 = 0;

    for (const inv of postedInvoices) {
      const bal = Number(inv.balance_due) || 0;
      if (bal <= 0) continue;
      const due = new Date(inv.due_date).getTime();
      if (due >= now) {
        current += bal;
      } else {
        const daysPast = Math.floor((now - due) / (1000 * 60 * 60 * 24));
        if (daysPast <= 30) days1_30 += bal;
        else if (daysPast <= 60) days31_60 += bal;
        else if (daysPast <= 90) days61_90 += bal;
        else above90 += bal;
      }
    }

    // Chronological statement ledger
    const statementEntries = [
      ...postedInvoices.map((inv) => ({
        date: inv.invoice_date,
        type: 'INVOICE',
        ref_number: inv.invoice_number,
        description: `Tax Invoice #${inv.invoice_number}`,
        debit: Number(inv.total_amount),
        credit: 0,
        status: inv.status,
      })),
      ...payments.map((p) => ({
        date: p.payment_date,
        type: 'RECEIPT',
        ref_number: p.receipt_number,
        description: `Payment Receipt #${p.receipt_number} via ${p.payment_mode}`,
        debit: 0,
        credit: Number(p.amount),
        status: p.status,
      })),
    ].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let running = openingBalance;
    const ledger = statementEntries.map((entry) => {
      running += entry.debit - entry.credit;
      return {
        ...entry,
        running_balance: Number(running.toFixed(2)),
      };
    });

    return {
      customer,
      summary: {
        opening_balance: openingBalance,
        total_invoiced: Number(totalInvoiced.toFixed(2)),
        total_paid: Number(totalPaid.toFixed(2)),
        outstanding_balance: outstandingBalance,
      },
      ageing: {
        current: Number(current.toFixed(2)),
        days1_30: Number(days1_30.toFixed(2)),
        days31_60: Number(days31_60.toFixed(2)),
        days61_90: Number(days61_90.toFixed(2)),
        above90: Number(above90.toFixed(2)),
        total_outstanding: outstandingBalance,
      },
      invoices,
      payments,
      ledger,
    };
  }
}
