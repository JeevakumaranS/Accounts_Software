import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  findAll() {
    return this.payrollService.findAll();
  }

  @Post('calculate')
  calculate(
    @Body('month') month: number,
    @Body('year') year: number,
    @CurrentUser() user: any,
  ) {
    return this.payrollService.calculatePayroll(Number(month), Number(year), user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollService.findById(id);
  }

  @Post(':id/post')
  postPayroll(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payrollService.postPayroll(id, user.id);
  }

  @Post(':id/payments')
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
  getPayslips(@Param('id') id: string) {
    return this.payrollService.getPayslips(id);
  }
}
