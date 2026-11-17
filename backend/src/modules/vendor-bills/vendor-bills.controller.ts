import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorBillsService } from './vendor-bills.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Vendor Bills & Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendor-bills')
export class VendorBillsController {
  constructor(private readonly billsService: VendorBillsService) {}

  @Get()
  @ApiOperation({ summary: 'List all vendor bills' })
  findAll() {
    return this.billsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Record and post vendor bill' })
  createBill(@Body() dto: any, @CurrentUser() user: any) {
    return this.billsService.createBill(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor bill details' })
  findOne(@Param('id') id: string) {
    return this.billsService.findById(id);
  }
}
