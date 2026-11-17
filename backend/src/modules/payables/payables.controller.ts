import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayablesService, CreateVendorPaymentDto } from './payables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Payables & Vendor Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendor-payments')
export class PayablesController {
  constructor(private readonly payablesService: PayablesService) {}

  @Get()
  @ApiOperation({ summary: 'List vendor payments' })
  findAll() {
    return this.payablesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Record vendor payment and post double entry' })
  createPayment(@Body() dto: CreateVendorPaymentDto, @CurrentUser() user: any) {
    return this.payablesService.createPayment(dto, user.id);
  }

  @Get('ageing')
  @ApiOperation({ summary: 'Payables ageing analysis' })
  getAgeing() {
    return this.payablesService.getAgeingReport();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor payment details' })
  findOne(@Param('id') id: string) {
    return this.payablesService.findById(id);
  }
}
