import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { CreditNote } from './entities/credit-note.entity';
import { Customer } from '../customers/entities/customer.entity';
import { AccountingService } from '../accounting/accounting.service';
import { CompanyService } from '../company/company.service';
import { AuditService } from '../audit/audit.service';
import { ReceivablesService } from '../receivables/receivables.service';
import { InvoiceStatus } from '../../shared/enums/invoice-status.enum';
import { JournalSourceType } from '../../shared/enums/journal-source-type.enum';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly itemRepository: Repository<InvoiceItem>,
    @InjectRepository(CreditNote)
    private readonly creditNoteRepository: Repository<CreditNote>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly accountingService: AccountingService,
    private readonly companyService: CompanyService,
    private readonly auditService: AuditService,
    @Inject(forwardRef(() => ReceivablesService))
    private readonly receivablesService: ReceivablesService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Helper to dynamically calculate and return effective invoice status.
   * "Overdue must be calculated from due date and remaining balance."
   */
  private computeEffectiveStatus(invoice: Invoice): Invoice {
    if (invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.DRAFT) {
      return invoice;
    }
    const balance = Number(invoice.balance_due) || 0;
    if (balance <= 0.01) {
      invoice.status = InvoiceStatus.PAID;
      invoice.balance_due = 0;
      return invoice;
    }

    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today && balance > 0) {
      invoice.status = InvoiceStatus.OVERDUE;
    } else if (Number(invoice.amount_paid) > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    } else {
      invoice.status = InvoiceStatus.POSTED;
    }
    return invoice;
  }

  async findAll(): Promise<Invoice[]> {
    const invoices = await this.invoiceRepository.find({
      relations: ['customer', 'items', 'credit_notes'],
      order: { created_at: 'DESC' },
    });
    return invoices.map((inv) => this.computeEffectiveStatus(inv));
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: [
        'customer',
        'items',
        'journal_entry',
        'journal_entry.lines',
        'payment_allocations',
        'payment_allocations.payment',
        'credit_notes',
      ],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return this.computeEffectiveStatus(invoice);
  }

  /**
   * Calculate invoice totals with defined calculation order:
   * 1. Line subtotal = quantity * unit_price
   * 2. Line discount = percent or fixed amount
   * 3. Line taxable value = line subtotal - line discount
   * 4. Taxes (CGST/SGST or IGST) + Cess per line; RCM taxes are excluded from payable total
   * 5. Invoice-level discount (applied across taxable amount)
   * 6. Configured rounding to nearest whole rupee
   */
  private calculateTotals(dto: any, isInterState: boolean) {
    const isReverseCharge = !!dto.is_reverse_charge;
    let subtotal = 0;
    let totalLineDiscount = 0;
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCess = 0;
    let unroundedInvoiceTotal = 0;

    const itemsToSave: Partial<InvoiceItem>[] = [];

    const rawItems = dto.items || [];
    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.unit_price) || 0;
      const lineSubtotal = Number((qty * rate).toFixed(2));

      // Defined calculation order for discounts
      const discountPct = Number(item.discount_percent) || 0;
      let lineDiscount = 0;
      if (discountPct > 0) {
        lineDiscount = Number(((lineSubtotal * discountPct) / 100).toFixed(2));
      } else if (Number(item.discount_amount) > 0) {
        lineDiscount = Number(Number(item.discount_amount).toFixed(2));
      }

      const taxableVal = Math.max(0, Number((lineSubtotal - lineDiscount).toFixed(2)));
      const taxRate = Number(item.tax_rate) !== undefined ? Number(item.tax_rate) : 18;
      const cessRate = Number(item.cess_rate) || 0;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let cess = 0;

      if (isInterState) {
        igst = Number(((taxableVal * taxRate) / 100).toFixed(2));
      } else {
        const halfRate = taxRate / 2;
        cgst = Number(((taxableVal * halfRate) / 100).toFixed(2));
        sgst = Number(((taxableVal * halfRate) / 100).toFixed(2));
      }

      if (cessRate > 0) {
        cess = Number(((taxableVal * cessRate) / 100).toFixed(2));
      }

      const lineTotal = Number(
        (taxableVal + (isReverseCharge ? 0 : cgst + sgst + igst + cess)).toFixed(2),
      );

      subtotal += lineSubtotal;
      totalLineDiscount += lineDiscount;
      totalTaxable += taxableVal;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      totalCess += cess;
      unroundedInvoiceTotal += lineTotal;

      itemsToSave.push({
        description: item.description || item.item_description || 'Item',
        hsn_sac: item.hsn_sac || item.hsn_sac_code || '',
        quantity: qty,
        unit: item.unit || 'NOS',
        unit_price: rate,
        discount_percent: discountPct,
        discount_amount: lineDiscount,
        taxable_value: taxableVal,
        tax_rate: taxRate,
        cess_rate: cessRate,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        cess_amount: cess,
        total_amount: lineTotal,
        sort_order: i + 1,
      });
    }

    // Invoice-level discount (if any)
    const invoiceDiscount = Number(dto.discount_amount) || 0;
    const finalTaxable = Math.max(0, Number((totalTaxable - invoiceDiscount).toFixed(2)));
    const netBeforeRounding = Math.max(0, Number((unroundedInvoiceTotal - invoiceDiscount).toFixed(2)));

    // Configured Rounding (Round to nearest integer)
    const roundedTotal = Math.round(netBeforeRounding);
    const roundingAdjustment = Number((roundedTotal - netBeforeRounding).toFixed(2));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number((totalLineDiscount + invoiceDiscount).toFixed(2)),
      taxableAmount: finalTaxable,
      cgstAmount: Number(totalCgst.toFixed(2)),
      sgstAmount: Number(totalSgst.toFixed(2)),
      igstAmount: Number(totalIgst.toFixed(2)),
      cessAmount: Number(totalCess.toFixed(2)),
      totalAmount: roundedTotal,
      roundingAdjustment,
      itemsToSave,
    };
  }

  async createDraft(dto: any, userId: string): Promise<Invoice> {
    const activeFy = await this.companyService.getActiveFinancialYear();
    if (!activeFy) throw new BadRequestException('No active financial year found');

    const customer = await this.customerRepository.findOne({ where: { id: dto.customer_id } });
    if (!customer) throw new BadRequestException('Customer not found');

    const companySettings = await this.companyService.getSettings();
    const isInterState =
      (dto.place_of_supply && companySettings.state_code && dto.place_of_supply !== companySettings.state) ||
      (customer.state_code && companySettings.state_code && customer.state_code !== companySettings.state_code);

    const calculated = this.calculateTotals(dto, !!isInterState);

    // Temporary draft invoice number - Drafts do NOT consume statutory final invoice numbers
    const draftNumber = `DRAFT-${Date.now().toString().slice(-6)}`;

    const invoice = this.invoiceRepository.create({
      invoice_number: draftNumber,
      customer_id: customer.id,
      invoice_date: dto.invoice_date || new Date(),
      due_date: dto.due_date || new Date(Date.now() + 15 * 86400000),
      supply_date: dto.supply_date || dto.invoice_date || new Date(),
      place_of_supply: dto.place_of_supply || customer.state || 'Tamil Nadu',
      is_reverse_charge: !!dto.is_reverse_charge,
      subtotal: calculated.subtotal,
      discount_amount: calculated.discountAmount,
      taxable_amount: calculated.taxableAmount,
      cgst_amount: calculated.cgstAmount,
      sgst_amount: calculated.sgstAmount,
      igst_amount: calculated.igstAmount,
      cess_amount: calculated.cessAmount,
      total_amount: calculated.totalAmount,
      rounding_adjustment: calculated.roundingAdjustment,
      amount_paid: 0,
      balance_due: calculated.totalAmount,
      notes: dto.notes,
      terms: dto.terms,
      status: InvoiceStatus.DRAFT,
      financial_year_id: activeFy.id,
      created_by_id: userId,
    });

    const saved = await this.invoiceRepository.save(invoice);
    const createdItems = calculated.itemsToSave.map((itm) =>
      this.itemRepository.create({
        ...itm,
        invoice_id: saved.id,
      }),
    );
    await this.itemRepository.save(createdItems);

    await this.auditService.log({
      user_id: userId,
      action: 'INVOICE_DRAFT_CREATED',
      entity_type: 'INVOICE',
      entity_id: saved.id,
      new_values: {
        invoice_number: draftNumber,
        customer_id: customer.id,
        total_amount: calculated.totalAmount,
      },
    });

    return this.findById(saved.id);
  }

  /**
   * Update draft invoice.
   * Rule: Posted invoice numbers cannot be edited; only drafts can be updated.
   */
  async updateDraft(id: string, dto: any, userId: string): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Posted or cancelled invoices cannot be edited. Issued invoices are statutory documents.');
    }

    const customer = await this.customerRepository.findOne({ where: { id: dto.customer_id || invoice.customer_id } });
    if (!customer) throw new BadRequestException('Customer not found');

    const companySettings = await this.companyService.getSettings();
    const isInterState =
      (dto.place_of_supply && companySettings.state_code && dto.place_of_supply !== companySettings.state) ||
      (customer.state_code && companySettings.state_code && customer.state_code !== companySettings.state_code);

    const normalizedDto = {
      ...dto,
      is_reverse_charge:
        dto.is_reverse_charge !== undefined ? !!dto.is_reverse_charge : invoice.is_reverse_charge,
    };
    const calculated = this.calculateTotals(normalizedDto, !!isInterState);

    // Delete existing items and insert updated items
    await this.itemRepository.delete({ invoice_id: invoice.id });

    invoice.customer_id = customer.id;
    invoice.invoice_date = dto.invoice_date || invoice.invoice_date;
    invoice.due_date = dto.due_date || invoice.due_date;
    invoice.supply_date = dto.supply_date || invoice.supply_date;
    invoice.place_of_supply = dto.place_of_supply || customer.state || invoice.place_of_supply;
    invoice.is_reverse_charge = normalizedDto.is_reverse_charge;
    invoice.subtotal = calculated.subtotal;
    invoice.discount_amount = calculated.discountAmount;
    invoice.taxable_amount = calculated.taxableAmount;
    invoice.cgst_amount = calculated.cgstAmount;
    invoice.sgst_amount = calculated.sgstAmount;
    invoice.igst_amount = calculated.igstAmount;
    invoice.cess_amount = calculated.cessAmount;
    invoice.total_amount = calculated.totalAmount;
    invoice.rounding_adjustment = calculated.roundingAdjustment;
    invoice.balance_due = calculated.totalAmount;
    invoice.notes = dto.notes !== undefined ? dto.notes : invoice.notes;
    invoice.terms = dto.terms !== undefined ? dto.terms : invoice.terms;

    const saved = await this.invoiceRepository.save(invoice);
    const createdItems = calculated.itemsToSave.map((itm) =>
      this.itemRepository.create({
        ...itm,
        invoice_id: saved.id,
      }),
    );
    await this.itemRepository.save(createdItems);

    await this.auditService.log({
      user_id: userId,
      action: 'INVOICE_DRAFT_UPDATED',
      entity_type: 'INVOICE',
      entity_id: saved.id,
      new_values: {
        total_amount: calculated.totalAmount,
        item_count: createdItems.length,
      },
    });

    return this.findById(saved.id);
  }

  async deleteDraft(id: string, userId: string): Promise<{ success: boolean }> {
    const invoice = await this.findById(id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT invoices can be deleted');
    }

    await this.auditService.log({
      user_id: userId,
      action: 'INVOICE_DRAFT_DELETED',
      entity_type: 'INVOICE',
      entity_id: invoice.id,
      old_values: { invoice_number: invoice.invoice_number, total: invoice.total_amount },
    });

    await this.itemRepository.delete({ invoice_id: invoice.id });
    await this.invoiceRepository.delete({ id: invoice.id });

    return { success: true };
  }

  /**
   * Post Invoice -> Assign official unique statutory financial-year number (DZT/INV/2026-27/0001)
   * and post balanced double-entry Journal Entry into ledger.
   */
  async postInvoice(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT invoices can be posted');
    }

    const activeFy = await this.companyService.getActiveFinancialYear();
    const fyName = activeFy ? activeFy.name : '2026-27';

    return this.dataSource.transaction(async (manager) => {
      // 1. Generate sequential official invoice number e.g. DZT/INV/2026-27/0001
      const count = await manager
        .createQueryBuilder(Invoice, 'inv')
        .where('inv.status != :status', { status: InvoiceStatus.DRAFT })
        .andWhere('inv.financial_year_id = :fyId', { fyId: invoice.financial_year_id })
        .getCount();

      const statutoryNumber = `DZT/INV/${fyName}/${String(count + 1).padStart(4, '0')}`;

      // 2. Fetch Control Accounts
      const arAccount = await this.accountingService.getAccountByCode('1100'); // Accounts Receivable
      const revenueAccount = await this.accountingService.getAccountByCode('4000'); // Service Revenue
      const cgstAccount = invoice.is_reverse_charge
        ? null
        : await this.accountingService.getAccountByCode('2100'); // Output CGST
      const sgstAccount = invoice.is_reverse_charge
        ? null
        : await this.accountingService.getAccountByCode('2101'); // Output SGST
      const igstAccount = invoice.is_reverse_charge
        ? null
        : await this.accountingService.getAccountByCode('2102'); // Output IGST

      if (!arAccount || !revenueAccount) {
        throw new BadRequestException('Essential chart of accounts (1100, 4000) not configured');
      }

      // Build balanced journal lines
      const journalLines: { account_id: string; debit: number; credit: number }[] = [];

      // Debit AR for invoice total
      journalLines.push({
        account_id: arAccount.id,
        debit: Number(invoice.total_amount),
        credit: 0,
      });

      // Credit Service Revenue for taxable amount
      journalLines.push({
        account_id: revenueAccount.id,
        debit: 0,
        credit: invoice.is_reverse_charge
          ? Number(invoice.total_amount)
          : Number(invoice.taxable_amount),
      });

      // Credit Output GST
      if (Number(invoice.cgst_amount) > 0 && cgstAccount) {
        journalLines.push({
          account_id: cgstAccount.id,
          debit: 0,
          credit: Number(invoice.cgst_amount),
        });
      }
      if (Number(invoice.sgst_amount) > 0 && sgstAccount) {
        journalLines.push({
          account_id: sgstAccount.id,
          debit: 0,
          credit: Number(invoice.sgst_amount),
        });
      }
      if (Number(invoice.igst_amount) > 0 && igstAccount) {
        journalLines.push({
          account_id: igstAccount.id,
          debit: 0,
          credit: Number(invoice.igst_amount),
        });
      }

      // Post Journal Entry through accounting engine
      const journalEntry = await this.accountingService.postJournalEntry({
        narration: `Sales Invoice ${statutoryNumber} to ${invoice.customer?.name || 'Customer'}`,
        posting_date: invoice.invoice_date,
        source_type: JournalSourceType.INVOICE,
        source_id: invoice.id,
        financial_year_id: invoice.financial_year_id,
        created_by_id: userId,
        lines: journalLines,
      });

      // Update invoice to POSTED
      const oldDraftNumber = invoice.invoice_number;
      invoice.invoice_number = statutoryNumber;
      invoice.status = InvoiceStatus.POSTED;
      invoice.journal_entry_id = journalEntry?.id || null;
      await manager.save(invoice);

      await this.auditService.log({
        user_id: userId,
        action: 'INVOICE_POSTED',
        entity_type: 'INVOICE',
        entity_id: invoice.id,
        old_values: { invoice_number: oldDraftNumber, status: InvoiceStatus.DRAFT },
        new_values: {
          statutory_invoice_number: statutoryNumber,
          journal_entry_id: journalEntry?.id || null,
          total_amount: invoice.total_amount,
        },
      });

      return invoice;
    });
  }

  /**
   * Cancel Invoice through controlled accounting entries.
   * Cancelling reverses the journal entry so cancelled invoices do not count as revenue.
   * Cancellations remain in the audit trail.
   */
  async cancelInvoice(id: string, reason: string, userId: string): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Invoice is already cancelled');
    }
    if (Number(invoice.amount_paid) > 0) {
      throw new BadRequestException('Cannot cancel invoice with recorded payments. Reverse payments or issue a Credit Note first.');
    }

    if (invoice.journal_entry_id) {
      await this.accountingService.reverseJournalEntry(invoice.journal_entry_id, userId, `Invoice cancelled: ${reason}`);
    }

    invoice.status = InvoiceStatus.CANCELLED;
    const saved = await this.invoiceRepository.save(invoice);

    await this.auditService.log({
      user_id: userId,
      action: 'INVOICE_CANCELLED',
      entity_type: 'INVOICE',
      entity_id: invoice.id,
      old_values: { status: InvoiceStatus.POSTED },
      new_values: { status: InvoiceStatus.CANCELLED, cancellation_reason: reason },
    });

    return saved;
  }

  /**
   * Issue Credit Note against invoice through controlled accounting entries.
   * Standard format: DZT/CN/2026-27/0001
   * Controlled entries:
   * Debit: Revenue / Sales Return (4000)
   * Debit: Output CGST (2100) / SGST (2101) / IGST (2102)
   * Credit: Accounts Receivable (1100)
   */
  async createCreditNote(invoiceId: string, dto: any, userId: string): Promise<CreditNote> {
    const invoice = await this.findById(invoiceId);
    if (invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Credit notes can only be issued against posted invoices');
    }

    const activeFy = await this.companyService.getActiveFinancialYear();
    const fyName = activeFy ? activeFy.name : '2026-27';

    const taxableAmount = Number(dto.taxable_amount) || 0;
    const cgstAmount = Number(dto.cgst_amount) || 0;
    const sgstAmount = Number(dto.sgst_amount) || 0;
    const igstAmount = Number(dto.igst_amount) || 0;
    const cessAmount = Number(dto.cess_amount) || 0;
    const totalAmount = Number(dto.total_amount) || Number((taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount).toFixed(2));

    if (totalAmount <= 0) {
      throw new BadRequestException('Credit note total must be greater than zero');
    }

    console.log('[DEBUG createCreditNote] invoiceId:', invoiceId, 'invoice.id:', invoice?.id);
    return this.dataSource.transaction(async (manager) => {
      // 1. Generate sequential Credit Note statutory number
      const cnCount = await manager
        .createQueryBuilder(CreditNote, 'cn')
        .where('cn.financial_year_id = :fyId', { fyId: invoice.financial_year_id })
        .getCount();

      const creditNoteNumber = `DZT/CN/${fyName}/${String(cnCount + 1).padStart(4, '0')}`;

      // 2. Controlled accounting entries
      const arAccount = await this.accountingService.getAccountByCode('1100'); // Accounts Receivable
      const revenueAccount = await this.accountingService.getAccountByCode('4000'); // Service Revenue
      const cgstAccount = await this.accountingService.getAccountByCode('2100');
      const sgstAccount = await this.accountingService.getAccountByCode('2101');
      const igstAccount = await this.accountingService.getAccountByCode('2102');

      const journalLines: { account_id: string; debit: number; credit: number }[] = [];

      // Debit Revenue / Sales Return for taxable portion
      journalLines.push({
        account_id: revenueAccount.id,
        debit: taxableAmount,
        credit: 0,
      });

      // Debit GST accounts
      if (cgstAmount > 0 && cgstAccount) {
        journalLines.push({
          account_id: cgstAccount.id,
          debit: cgstAmount,
          credit: 0,
        });
      }
      if (sgstAmount > 0 && sgstAccount) {
        journalLines.push({
          account_id: sgstAccount.id,
          debit: sgstAmount,
          credit: 0,
        });
      }
      if (igstAmount > 0 && igstAccount) {
        journalLines.push({
          account_id: igstAccount.id,
          debit: igstAmount,
          credit: 0,
        });
      }

      // Credit Accounts Receivable
      journalLines.push({
        account_id: arAccount.id,
        debit: 0,
        credit: totalAmount,
      });

      const journalEntry = await this.accountingService.postJournalEntry({
        narration: `Credit Note ${creditNoteNumber} against ${invoice.invoice_number}: ${dto.reason || 'Sales Adjustment'}`,
        posting_date: dto.credit_note_date || new Date(),
        source_type: JournalSourceType.CREDIT_NOTE,
        source_id: invoice.id,
        financial_year_id: invoice.financial_year_id,
        created_by_id: userId,
        lines: journalLines,
      });

      // 3. Save Credit Note
      const creditNote = new CreditNote();
      creditNote.credit_note_number = creditNoteNumber;
      creditNote.invoice_id = invoice.id;
      creditNote.invoice = { id: invoice.id } as any;
      creditNote.customer_id = invoice.customer_id;
      creditNote.customer = { id: invoice.customer_id } as any;
      creditNote.credit_note_date = dto.credit_note_date || new Date();
      creditNote.reason = dto.reason || 'Sales Return / Rate Adjustment';
      creditNote.taxable_amount = taxableAmount;
      creditNote.cgst_amount = cgstAmount;
      creditNote.sgst_amount = sgstAmount;
      creditNote.igst_amount = igstAmount;
      creditNote.cess_amount = cessAmount;
      creditNote.total_amount = totalAmount;
      creditNote.status = 'POSTED';
      creditNote.financial_year_id = invoice.financial_year_id;
      creditNote.financial_year = { id: invoice.financial_year_id } as any;
      creditNote.journal_entry_id = journalEntry?.id || null;
      if (journalEntry) creditNote.journal_entry = { id: journalEntry.id } as any;
      creditNote.created_by_id = userId;
      creditNote.created_by = { id: userId } as any;

      const savedCn = await manager.save(CreditNote, creditNote);

      // 4. Update Invoice Balance Due using direct update to avoid relation cascade
      const newBalance = Math.max(0, Number((Number(invoice.balance_due) - totalAmount).toFixed(2)));
      const newStatus = newBalance <= 0.01 ? InvoiceStatus.PAID : invoice.status;
      await manager.update(Invoice, invoice.id, {
        balance_due: newBalance,
        status: newStatus,
      });

      await this.auditService.log({
        user_id: userId,
        action: 'CREDIT_NOTE_ISSUED',
        entity_type: 'INVOICE',
        entity_id: invoice.id,
        new_values: {
          credit_note_number: creditNoteNumber,
          credit_note_id: creditNote.id,
          amount: totalAmount,
          reason: dto.reason,
        },
      });

      return creditNote;
    });
  }

  async getCreditNotes(invoiceId: string): Promise<CreditNote[]> {
    return this.creditNoteRepository.find({
      where: { invoice_id: invoiceId },
      relations: ['journal_entry'],
      order: { credit_note_date: 'DESC' },
    });
  }

  /**
   * Record payment directly against this invoice (advance, partial or full payment),
   * updating receivables and invoice balance.
   */
  async recordPayment(invoiceId: string, dto: any, userId: string) {
    const invoice = await this.findById(invoiceId);
    if (invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Payments can only be recorded on posted invoices');
    }

    const amount = Number(dto.amount);
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const receipt = await this.receivablesService.createReceipt(
      {
        customer_id: invoice.customer_id,
        payment_date: dto.payment_date || new Date(),
        amount,
        payment_mode: dto.payment_mode || 'BANK_TRANSFER',
        receiving_account_id: dto.receiving_account_id,
        reference_number: dto.reference_number,
        remarks: dto.remarks || `Payment for Invoice ${invoice.invoice_number}`,
        allocations: [
          {
            invoice_id: invoice.id,
            allocated_amount: amount,
          },
        ],
      },
      userId,
    );

    await this.auditService.log({
      user_id: userId,
      action: 'INVOICE_PAYMENT_RECORDED',
      entity_type: 'INVOICE',
      entity_id: invoice.id,
      new_values: {
        receipt_number: receipt.receipt_number,
        amount_paid: amount,
        payment_mode: dto.payment_mode,
      },
    });

    return this.findById(invoice.id);
  }

  /**
   * Full change and posting audit history
   */
  async getInvoiceHistory(id: string) {
    return this.auditService.findByEntity('INVOICE', id);
  }
}
