import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PayablesService, CreateVendorPaymentDto } from './payables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendor-payments')
export class PayablesController {
  constructor(private readonly payablesService: PayablesService) {}

  @Get()
  findAll() {
    return this.payablesService.findAll();
  }

  @Post()
  createPayment(@Body() dto: CreateVendorPaymentDto, @CurrentUser() user: any) {
    return this.payablesService.createPayment(dto, user.id);
  }

  @Get('ageing')
  getAgeing() {
    return this.payablesService.getAgeingReport();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payablesService.findById(id);
  }
}
