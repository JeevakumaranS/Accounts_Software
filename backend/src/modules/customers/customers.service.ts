import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
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
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['invoices', 'customer_payments'],
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    if (!data.customer_code) {
      const count = await this.customerRepository.count();
      data.customer_code = `CUST-${String(count + 1).padStart(4, '0')}`;
    }
    const existing = await this.customerRepository.findOne({
      where: { customer_code: data.customer_code },
    });
    if (existing) {
      throw new ConflictException('Customer code already exists');
    }
    const customer = this.customerRepository.create(data);
    return this.customerRepository.save(customer);
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const customer = await this.findById(id);
    Object.assign(customer, data);
    return this.customerRepository.save(customer);
  }

  async getLedger(id: string) {
    const customer = await this.findById(id);
    return {
      customer,
      invoices: customer.invoices || [],
      payments: customer.customer_payments || [],
    };
  }
}
