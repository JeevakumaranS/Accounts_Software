import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { CashBankService } from './cash-bank.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash-bank')
export class CashBankController {
  constructor(private readonly cashBankService: CashBankService) {}

  @Get('accounts')
  findAll() {
    return this.cashBankService.findAll();
  }

  @Post('accounts')
  createAccount(@Body() data: any) {
    return this.cashBankService.create(data);
  }

  @Post('transfer')
  transfer(
    @Body('from_account_id') fromAccountId: string,
    @Body('to_account_id') toAccountId: string,
    @Body('amount') amount: number,
    @Body('date') date: Date,
    @Body('description') description: string,
    @CurrentUser() user: any,
  ) {
    return this.cashBankService.transfer(
      fromAccountId,
      toAccountId,
      amount,
      date,
      description,
      user.id,
    );
  }

  @Get('accounts/:id/transactions')
  getTransactions(@Param('id') id: string) {
    return this.cashBankService.getTransactions(id);
  }
}
