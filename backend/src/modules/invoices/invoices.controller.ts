import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all invoices' })
  findAll() {
    return this.invoicesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create draft invoice' })
  createDraft(@Body() data: any, @CurrentUser() user: any) {
    return this.invoicesService.createDraft(data, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice details' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post invoice to generate statutory number & ledger journal' })
  postInvoice(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invoicesService.postInvoice(id, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel invoice and reverse journal' })
  cancelInvoice(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.cancelInvoice(id, reason || 'Cancelled by user', user.id);
  }
}
