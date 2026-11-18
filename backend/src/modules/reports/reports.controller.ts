import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('profit-loss')
  getProfitLoss(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getProfitLoss(startDate, endDate);
  }

  @Get('balance-sheet')
  getBalanceSheet(@Query('asOfDate') asOfDate?: string) {
    return this.reportsService.getBalanceSheet(asOfDate);
  }

  @Get('cash-flow')
  getCashFlow(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getCashFlow(startDate, endDate);
  }
}
