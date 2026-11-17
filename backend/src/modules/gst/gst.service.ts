import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxRate } from './entities/tax-rate.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { VendorBill } from '../vendor-bills/entities/vendor-bill.entity';
import { InvoiceStatus } from '../../shared/enums/invoice-status.enum';
import { BillStatus } from '../../shared/enums/bill-status.enum';

@Injectable()
export class GstService {
  constructor(
    @InjectRepository(TaxRate)
    private readonly taxRateRepository: Repository<TaxRate>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(VendorBill)
    private readonly billRepository: Repository<VendorBill>,
  ) {}

  async getTaxRates(): Promise<TaxRate[]> {
    return this.taxRateRepository.find({ order: { rate: 'ASC' } });
  }

  async createTaxRate(data: Partial<TaxRate>): Promise<TaxRate> {
    const rate = this.taxRateRepository.create(data);
    return this.taxRateRepository.save(rate);
  }

  // GSTR-1 Sales Register Report
  async getGstr1Report(startDate?: string, endDate?: string) {
    const query = this.invoiceRepository
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.customer', 'customer')
      .leftJoinAndSelect('inv.items', 'items')
      .where('inv.status != :status', { status: InvoiceStatus.DRAFT })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED });

    if (startDate) query.andWhere('inv.invoice_date >= :startDate', { startDate });
    if (endDate) query.andWhere('inv.invoice_date <= :endDate', { endDate });

    const invoices = await query.getMany();

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalInvoiceValue = 0;

    const b2b = [];
    const b2c = [];

    for (const inv of invoices) {
      totalTaxable += Number(inv.taxable_amount) || 0;
      totalCgst += Number(inv.cgst_amount) || 0;
      totalSgst += Number(inv.sgst_amount) || 0;
      totalIgst += Number(inv.igst_amount) || 0;
      totalInvoiceValue += Number(inv.total_amount) || 0;

      const record = {
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        customer_name: inv.customer.name,
        customer_gstin: inv.customer.gstin || 'UNREGISTERED',
        place_of_supply: inv.place_of_supply,
        is_reverse_charge: inv.is_reverse_charge,
        taxable_value: Number(inv.taxable_amount),
        cgst: Number(inv.cgst_amount),
        sgst: Number(inv.sgst_amount),
        igst: Number(inv.igst_amount),
        total_value: Number(inv.total_amount),
      };

      if (inv.customer.gstin) {
        b2b.push(record);
      } else {
        b2c.push(record);
      }
    }

    return {
      summary: {
        total_invoices: invoices.length,
        total_taxable: Number(totalTaxable.toFixed(2)),
        total_cgst: Number(totalCgst.toFixed(2)),
        total_sgst: Number(totalSgst.toFixed(2)),
        total_igst: Number(totalIgst.toFixed(2)),
        total_tax: Number((totalCgst + totalSgst + totalIgst).toFixed(2)),
        total_invoice_value: Number(totalInvoiceValue.toFixed(2)),
      },
      b2b_invoices: b2b,
      b2c_invoices: b2c,
    };
  }

  // GSTR-3B Summary Report (Output Tax vs Eligible ITC)
  async getGstr3bReport(startDate?: string, endDate?: string) {
    const gstr1 = await this.getGstr1Report(startDate, endDate);

    // Eligible ITC from Vendor Bills
    const billQuery = this.billRepository
      .createQueryBuilder('bill')
      .where('bill.status != :status', { status: BillStatus.DRAFT })
      .andWhere('bill.status != :cancelled', { cancelled: BillStatus.CANCELLED });

    if (startDate) billQuery.andWhere('bill.bill_date >= :startDate', { startDate });
    if (endDate) billQuery.andWhere('bill.bill_date <= :endDate', { endDate });

    const bills = await billQuery.getMany();

    let itmCgst = 0;
    let itmSgst = 0;
    let itmIgst = 0;
    let itmTaxable = 0;

    for (const b of bills) {
      itmTaxable += Number(b.taxable_amount) || 0;
      itmCgst += Number(b.cgst_amount) || 0;
      itmSgst += Number(b.sgst_amount) || 0;
      itmIgst += Number(b.igst_amount) || 0;
    }

    const outputCgst = gstr1.summary.total_cgst;
    const outputSgst = gstr1.summary.total_sgst;
    const outputIgst = gstr1.summary.total_igst;

    const netCgst = Number((outputCgst - itmCgst).toFixed(2));
    const netSgst = Number((outputSgst - itmSgst).toFixed(2));
    const netIgst = Number((outputIgst - itmIgst).toFixed(2));

    return {
      output_tax: {
        taxable_value: gstr1.summary.total_taxable,
        cgst: outputCgst,
        sgst: outputSgst,
        igst: outputIgst,
        total_output_tax: gstr1.summary.total_tax,
      },
      eligible_itc: {
        taxable_value: Number(itmTaxable.toFixed(2)),
        cgst: Number(itmCgst.toFixed(2)),
        sgst: Number(itmSgst.toFixed(2)),
        igst: Number(itmIgst.toFixed(2)),
        total_itc: Number((itmCgst + itmSgst + itmIgst).toFixed(2)),
      },
      net_tax_position: {
        cgst_payable: netCgst > 0 ? netCgst : 0,
        cgst_credit: netCgst < 0 ? Math.abs(netCgst) : 0,
        sgst_payable: netSgst > 0 ? netSgst : 0,
        sgst_credit: netSgst < 0 ? Math.abs(netSgst) : 0,
        igst_payable: netIgst > 0 ? netIgst : 0,
        igst_credit: netIgst < 0 ? Math.abs(netIgst) : 0,
        total_net_payable: Number(
          ((netCgst > 0 ? netCgst : 0) + (netSgst > 0 ? netSgst : 0) + (netIgst > 0 ? netIgst : 0)).toFixed(2),
        ),
      },
    };
  }
}
