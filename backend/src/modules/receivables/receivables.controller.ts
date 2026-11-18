import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReceivablesService, CreateReceiptDto } from './receivables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('receipts')
export class ReceivablesController {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Get()
  findAll() {
    return this.receivablesService.findAll();
  }

  @Post()
  createReceipt(@Body() dto: CreateReceiptDto, @CurrentUser() user: any) {
    return this.receivablesService.createReceipt(dto, user.id);
  }

  @Get('ageing')
  getAgeing() {
    return this.receivablesService.getAgeingReport();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.receivablesService.findById(id);
  }
}
