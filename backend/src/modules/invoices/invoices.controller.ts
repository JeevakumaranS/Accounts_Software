import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll() {
    return this.invoicesService.findAll();
  }

  @Post()
  createDraft(@Body() data: any, @CurrentUser() user: any) {
    return this.invoicesService.createDraft(data, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Post(':id/post')
  postInvoice(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invoicesService.postInvoice(id, user.id);
  }

  @Post(':id/cancel')
  cancelInvoice(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.cancelInvoice(id, reason || 'Cancelled by user', user.id);
  }
}
