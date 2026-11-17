import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { ReceivablesService } from '../receivables/receivables.service';
import { PayablesService } from '../payables/payables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly receivablesService: ReceivablesService,
    private readonly payablesService: PayablesService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Financial KPIs summary' })
  getSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.dashboardService.getSummary(startDate, endDate);
  }

  @Get('income-expenses')
  @ApiOperation({ summary: 'Monthly Income vs Expense trend' })
  getIncomeExpenses() {
    return this.dashboardService.getIncomeExpensesTrend();
  }

  @Get('receivables-ageing')
  @ApiOperation({ summary: 'Receivables ageing breakdown' })
  getReceivablesAgeing() {
    return this.receivablesService.getAgeingReport();
  }

  @Get('payables-ageing')
  @ApiOperation({ summary: 'Payables ageing breakdown' })
  getPayablesAgeing() {
    return this.payablesService.getAgeingReport();
  }

  @Get('recent-transactions')
  @ApiOperation({ summary: 'Recent posted accounting transactions' })
  getRecentTransactions() {
    return this.dashboardService.getRecentTransactions();
  }
}
