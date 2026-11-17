import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  async findAll(): Promise<Vendor[]> {
    return this.vendorRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async create(data: Partial<Vendor>): Promise<Vendor> {
    if (!data.vendor_code) {
      const count = await this.vendorRepository.count();
      data.vendor_code = `VEND-${String(count + 1).padStart(4, '0')}`;
    }
    const existing = await this.vendorRepository.findOne({
      where: { vendor_code: data.vendor_code },
    });
    if (existing) {
      throw new ConflictException('Vendor code already exists');
    }
    const vendor = this.vendorRepository.create(data);
    return this.vendorRepository.save(vendor);
  }

  async update(id: string, data: Partial<Vendor>): Promise<Vendor> {
    const vendor = await this.findById(id);
    Object.assign(vendor, data);
    return this.vendorRepository.save(vendor);
  }

  async getLedger(id: string) {
    const vendor = await this.findById(id);
    return {
      vendor,
      // Will attach bills and payments when requested
    };
  }
}
