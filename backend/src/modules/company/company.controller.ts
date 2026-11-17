import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';

@ApiTags('Company Settings & Financial Years')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get company settings' })
  getSettings() {
    return this.companyService.getSettings();
  }

  @Put('settings')
  @Roles(Role.CEO)
  @ApiOperation({ summary: 'Update company settings (CEO only)' })
  updateSettings(@Body() data: any) {
    return this.companyService.updateSettings(data);
  }

  @Get('financial-years')
  @ApiOperation({ summary: 'List all financial years' })
  getFinancialYears() {
    return this.companyService.getFinancialYears();
  }

  @Get('financial-years/active')
  @ApiOperation({ summary: 'Get current active financial year' })
  getActiveFinancialYear() {
    return this.companyService.getActiveFinancialYear();
  }

  @Post('financial-years')
  @Roles(Role.CEO)
  @ApiOperation({ summary: 'Create financial year (CEO only)' })
  createFinancialYear(@Body() data: any) {
    return this.companyService.createFinancialYear(data);
  }
}
