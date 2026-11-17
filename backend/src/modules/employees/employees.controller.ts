import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List all employees' })
  findAll() {
    return this.employeesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create new employee' })
  create(@Body() data: any) {
    return this.employeesService.create(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee details' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update employee details' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.employeesService.update(id, data);
  }
}
