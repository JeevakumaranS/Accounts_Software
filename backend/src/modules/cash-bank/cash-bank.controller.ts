import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CashBankService } from './cash-bank.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Cash & Bank Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash-bank')
export class CashBankController {
  constructor(private readonly cashBankService: CashBankService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'List all cash and bank accounts' })
  findAll() {
    return this.cashBankService.findAll();
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create new cash/bank account' })
  createAccount(@Body() data: any) {
    return this.cashBankService.create(data);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Internal transfer between accounts' })
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
  @ApiOperation({ summary: 'Get transaction history for account' })
  getTransactions(@Param('id') id: string) {
    return this.cashBankService.getTransactions(id);
  }
}
