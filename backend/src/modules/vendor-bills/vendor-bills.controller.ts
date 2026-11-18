import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { VendorBillsService } from './vendor-bills.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendor-bills')
export class VendorBillsController {
  constructor(private readonly billsService: VendorBillsService) {}

  @Get()
  findAll() {
    return this.billsService.findAll();
  }

  @Post()
  createBill(@Body() dto: any, @CurrentUser() user: any) {
    return this.billsService.createBill(dto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billsService.findById(id);
  }
}
