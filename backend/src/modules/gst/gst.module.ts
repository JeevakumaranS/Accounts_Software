import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxRate } from './entities/tax-rate.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { VendorBill } from '../vendor-bills/entities/vendor-bill.entity';
import { GstService } from './gst.service';
import { GstController } from './gst.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaxRate, Invoice, VendorBill])],
  controllers: [GstController],
  providers: [GstService],
  exports: [GstService],
})
export class GstModule {}
