import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { GstService } from './gst.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class GstController {
  constructor(private readonly gstService: GstService) {}

  @Get('gst/rates')
  getTaxRates() {
    return this.gstService.getTaxRates();
  }

  @Post('gst/rates')
  @Roles(Role.CEO)
  createTaxRate(@Body() data: any) {
    return this.gstService.createTaxRate(data);
  }

  @Get('reports/gstr1')
  getGstr1(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.gstService.getGstr1Report(startDate, endDate);
  }

  @Get('reports/gstr3b')
  getGstr3b(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.gstService.getGstr3bReport(startDate, endDate);
  }

  @Get('reports/gst-summary')
  getGstSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.gstService.getGstr3bReport(startDate, endDate);
  }
}
