import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('settings')
  getSettings() {
    return this.companyService.getSettings();
  }

  @Put('settings')
  @Roles(Role.CEO)
  updateSettings(@Body() data: any) {
    return this.companyService.updateSettings(data);
  }

  @Get('financial-years')
  getFinancialYears() {
    return this.companyService.getFinancialYears();
  }

  @Get('financial-years/active')
  getActiveFinancialYear() {
    return this.companyService.getActiveFinancialYear();
  }

  @Post('financial-years')
  @Roles(Role.CEO)
  createFinancialYear(@Body() data: any) {
    return this.companyService.createFinancialYear(data);
  }
}
