import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GstService } from './gst.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';

@ApiTags('GST Management & Statutory Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class GstController {
  constructor(private readonly gstService: GstService) {}

  @Get('gst/rates')
  @ApiOperation({ summary: 'Get configured GST tax rates' })
  getTaxRates() {
    return this.gstService.getTaxRates();
  }

  @Post('gst/rates')
  @Roles(Role.CEO)
  @ApiOperation({ summary: 'Add tax rate (CEO only)' })
  createTaxRate(@Body() data: any) {
    return this.gstService.createTaxRate(data);
  }

  @Get('reports/gstr1')
  @ApiOperation({ summary: 'GSTR-1 Preparation Report (Sales Register)' })
  getGstr1(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.gstService.getGstr1Report(startDate, endDate);
  }

  @Get('reports/gstr3b')
  @ApiOperation({ summary: 'GSTR-3B Preparation Report (ITC vs Output Tax)' })
  getGstr3b(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.gstService.getGstr3bReport(startDate, endDate);
  }

  @Get('reports/gst-summary')
  @ApiOperation({ summary: 'Comprehensive GST Summary' })
  getGstSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.gstService.getGstr3bReport(startDate, endDate);
  }
}
