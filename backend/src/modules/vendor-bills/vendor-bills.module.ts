import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorBill } from './entities/vendor-bill.entity';
import { VendorBillItem } from './entities/vendor-bill-item.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { VendorBillsService } from './vendor-bills.service';
import { VendorBillsController } from './vendor-bills.controller';
import { AccountingModule } from '../accounting/accounting.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VendorBill, VendorBillItem, Vendor]),
    AccountingModule,
    CompanyModule,
  ],
  controllers: [VendorBillsController],
  providers: [VendorBillsService],
  exports: [VendorBillsService],
})
export class VendorBillsModule {}
