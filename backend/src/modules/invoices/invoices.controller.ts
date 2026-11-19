import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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

  @Put(':id')
  updateDraft(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.updateDraft(id, data, user.id);
  }

  @Delete(':id')
  deleteDraft(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invoicesService.deleteDraft(id, user.id);
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

  @Post(':id/payments')
  recordPayment(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.recordPayment(id, data, user.id);
  }

  @Post(':id/credit-notes')
  createCreditNote(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.createCreditNote(id, data, user.id);
  }

  @Get(':id/credit-notes')
  getCreditNotes(@Param('id') id: string) {
    return this.invoicesService.getCreditNotes(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.invoicesService.getInvoiceHistory(id);
  }
}
