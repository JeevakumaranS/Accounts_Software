import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all vendors' })
  findAll() {
    return this.vendorsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create vendor' })
  create(@Body() data: any) {
    return this.vendorsService.create(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor details' })
  findOne(@Param('id') id: string) {
    return this.vendorsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vendor' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.vendorsService.update(id, data);
  }

  @Get(':id/ledger')
  @ApiOperation({ summary: 'Get vendor sub-ledger and transaction history' })
  getLedger(@Param('id') id: string) {
    return this.vendorsService.getLedger(id);
  }
}
