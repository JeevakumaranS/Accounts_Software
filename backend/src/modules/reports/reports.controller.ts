import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Financial Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('profit-loss')
  @ApiOperation({ summary: 'Generate Profit and Loss Statement' })
  getProfitLoss(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getProfitLoss(startDate, endDate);
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Generate Balance Sheet' })
  getBalanceSheet(@Query('asOfDate') asOfDate?: string) {
    return this.reportsService.getBalanceSheet(asOfDate);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Generate Cash Flow Statement' })
  getCashFlow(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getCashFlow(startDate, endDate);
  }
}
