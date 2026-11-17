import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeeStatus } from '../../shared/enums/employee-status.enum';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async findAll(): Promise<Employee[]> {
    return this.employeeRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findActive(): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { status: EmployeeStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(data: Partial<Employee>): Promise<Employee> {
    if (!data.employee_code) {
      const count = await this.employeeRepository.count();
      data.employee_code = `EMP-${String(count + 1).padStart(4, '0')}`;
    }
    const existing = await this.employeeRepository.findOne({
      where: { employee_code: data.employee_code },
    });
    if (existing) throw new ConflictException('Employee code already exists');

    const emp = this.employeeRepository.create(data);
    return this.employeeRepository.save(emp);
  }

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    const emp = await this.findById(id);
    Object.assign(emp, data);
    return this.employeeRepository.save(emp);
  }
}
