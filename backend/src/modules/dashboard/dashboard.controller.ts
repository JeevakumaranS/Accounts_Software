import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ReceivablesService } from '../receivables/receivables.service';
import { PayablesService } from '../payables/payables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly receivablesService: ReceivablesService,
    private readonly payablesService: PayablesService,
  ) {}

  @Get('summary')
  getSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.dashboardService.getSummary(startDate, endDate);
  }

  @Get('income-expenses')
  getIncomeExpenses() {
    return this.dashboardService.getIncomeExpensesTrend();
  }

  @Get('receivables-ageing')
  getReceivablesAgeing() {
    return this.receivablesService.getAgeingReport();
  }

  @Get('payables-ageing')
  getPayablesAgeing() {
    return this.payablesService.getAgeingReport();
  }

  @Get('recent-transactions')
  getRecentTransactions() {
    return this.dashboardService.getRecentTransactions();
  }
}
