import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReceivablesService, CreateReceiptDto } from './receivables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Receivables & Customer Receipts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('receipts')
export class ReceivablesController {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Get()
  @ApiOperation({ summary: 'List customer payment receipts' })
  findAll() {
    return this.receivablesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Record customer receipt and post double entry' })
  createReceipt(@Body() dto: CreateReceiptDto, @CurrentUser() user: any) {
    return this.receivablesService.createReceipt(dto, user.id);
  }

  @Get('ageing')
  @ApiOperation({ summary: 'Receivables ageing analysis' })
  getAgeing() {
    return this.receivablesService.getAgeingReport();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get receipt details' })
  findOne(@Param('id') id: string) {
    return this.receivablesService.findById(id);
  }
}
