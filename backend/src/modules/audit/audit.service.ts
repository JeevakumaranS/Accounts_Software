import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(data: {
    user_id: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
  }) {
    const entry = this.auditRepository.create(data);
    return this.auditRepository.save(entry);
  }

  async findAll(limit = 100) {
    return this.auditRepository.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
