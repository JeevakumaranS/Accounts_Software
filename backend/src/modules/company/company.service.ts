import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanySettings } from './entities/company-settings.entity';
import { FinancialYear } from './entities/financial-year.entity';
import { FinancialYearStatus } from '../../shared/enums/financial-year-status.enum';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(CompanySettings)
    private readonly companyRepository: Repository<CompanySettings>,
    @InjectRepository(FinancialYear)
    private readonly fyRepository: Repository<FinancialYear>,
  ) {}

  async getSettings(): Promise<CompanySettings> {
    const settings = await this.companyRepository.find();
    if (settings.length > 0) {
      return settings[0];
    }
    // Default placeholder
    const defaultSettings = this.companyRepository.create({
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
    return this.companyRepository.save(defaultSettings);
  }

  async updateSettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
    const current = await this.getSettings();
    Object.assign(current, data);
    return this.companyRepository.save(current);
  }

  // Financial Years
  async getFinancialYears(): Promise<FinancialYear[]> {
    return this.fyRepository.find({ order: { start_date: 'DESC' } });
  }

  async getActiveFinancialYear(): Promise<FinancialYear | null> {
    return this.fyRepository.findOne({
      where: { status: FinancialYearStatus.ACTIVE },
    });
  }

  async createFinancialYear(data: Partial<FinancialYear>): Promise<FinancialYear> {
    const fy = this.fyRepository.create(data);
    return this.fyRepository.save(fy);
  }
}
