import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Employees & Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  @ApiOperation({ summary: 'List all payroll runs' })
  findAll() {
    return this.payrollService.findAll();
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate monthly payroll' })
  calculate(
    @Body('month') month: number,
    @Body('year') year: number,
    @CurrentUser() user: any,
  ) {
    return this.payrollService.calculatePayroll(Number(month), Number(year), user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payroll run details' })
  findOne(@Param('id') id: string) {
    return this.payrollService.findById(id);
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Approve and post payroll journal entry' })
  postPayroll(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payrollService.postPayroll(id, user.id);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record individual salary payment' })
  recordSalaryPayment(
    @Body('item_id') itemId: string,
    @Body('bank_account_id') bankAccountId: string,
    @Body('payment_mode') paymentMode: any,
    @CurrentUser() user: any,
  ) {
    return this.payrollService.recordSalaryPayment(
      itemId,
      bankAccountId,
      paymentMode,
      user.id,
    );
  }

  @Get(':id/payslips')
  @ApiOperation({ summary: 'Generate payslips for payroll run' })
  getPayslips(@Param('id') id: string) {
    return this.payrollService.getPayslips(id);
  }
}
