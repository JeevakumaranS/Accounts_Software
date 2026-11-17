import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountingService, PostJournalDto } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../../shared/enums/role.enum';

@ApiTags('Accounting & General Ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'List Chart of Accounts' })
  getAccounts() {
    return this.accountingService.getAccounts();
  }

  @Post('accounts')
  @Roles(Role.CEO)
  @ApiOperation({ summary: 'Create Account in Chart of Accounts (CEO only)' })
  createAccount(@Body() data: any) {
    return this.accountingService.createAccount(data);
  }

  @Get('journals')
  @ApiOperation({ summary: 'List Journal Entries' })
  getJournals(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.accountingService.getJournals(Number(page), Number(limit));
  }

  @Post('journals')
  @ApiOperation({ summary: 'Post Manual Journal Entry' })
  postJournal(@Body() dto: PostJournalDto, @CurrentUser() user: any) {
    return this.accountingService.postJournalEntry({
      ...dto,
      created_by_id: user.id,
    });
  }

  @Post('journals/:id/reverse')
  @Roles(Role.CEO)
  @ApiOperation({ summary: 'Reverse Journal Entry (CEO only)' })
  reverseJournal(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.accountingService.reverseJournalEntry(id, user.id, reason || 'Manual reversal');
  }

  @Get('ledger/:accountId')
  @ApiOperation({ summary: 'Get General Ledger for an Account' })
  getLedger(
    @Param('accountId') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.getLedger(accountId, startDate, endDate);
  }

  @Get('reports/trial-balance')
  @ApiOperation({ summary: 'Generate Trial Balance' })
  getTrialBalance(@Query('asOfDate') asOfDate?: string) {
    return this.accountingService.getTrialBalance(asOfDate);
  }
}
