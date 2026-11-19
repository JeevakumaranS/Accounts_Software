'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR, formatDate } from '../../lib/format';
import api from '../../lib/api';
import {
  PlusCircle,
  Eye,
  CheckCircle,
  XCircle,
  Printer,
  X,
  Search,
  CreditCard,
  RotateCcw,
  History,
  FileText,
  AlertTriangle,
  Building,
  Check,
} from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'INVOICE' | 'HISTORY' | 'CREDIT_NOTES'>('INVOICE');

  // Audit history state
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Credit notes state
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [loadingCreditNotes, setLoadingCreditNotes] = useState(false);

  // Payment Recording Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('2026-11-18');
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [receivingAccountId, setReceivingAccountId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Credit Note Modal State
  const [creditNoteModalOpen, setCreditNoteModalOpen] = useState(false);
  const [creditNoteInvoice, setCreditNoteInvoice] = useState<any | null>(null);
  const [creditNoteDate, setCreditNoteDate] = useState('2026-11-18');
  const [creditNoteReason, setCreditNoteReason] = useState('Sales Return / Deficiency in Service');
  const [creditTaxable, setCreditTaxable] = useState('');
  const [creditTax, setCreditTax] = useState('');
  const [creditTotal, setCreditTotal] = useState('');
  const [submittingCreditNote, setSubmittingCreditNote] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const res = await api.get('/cash-bank/accounts');
      const accounts = res.data.data || [];
      setBankAccounts(accounts);
      if (accounts.length > 0) {
        setReceivingAccountId(accounts[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadBankAccounts();
  }, []);

  const handleOpenView = async (inv: any) => {
    setSelectedInvoice(inv);
    setActiveModalTab('INVOICE');
    // Fetch fresh invoice with full relations
    try {
      const freshRes = await api.get(`/invoices/${inv.id}`);
      setSelectedInvoice(freshRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchHistory = async (invId: string) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/invoices/${invId}/history`);
      setHistoryLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFetchCreditNotes = async (invId: string) => {
    setLoadingCreditNotes(true);
    try {
      const res = await api.get(`/invoices/${invId}/credit-notes`);
      setCreditNotes(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCreditNotes(false);
    }
  };

  const handlePost = async (id: string) => {
    if (!confirm('Post this invoice? This assigns a unique statutory financial-year invoice number (DZT/INV/2026-27/XXXX) and posts double-entry journal transactions into the ledger.')) {
      return;
    }
    try {
      await api.post(`/invoices/${id}/post`);
      alert('Invoice posted successfully with official statutory number!');
      loadInvoices();
      if (selectedInvoice && selectedInvoice.id === id) {
        handleOpenView({ id });
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to post invoice');
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Reason for cancelling invoice:');
    if (!reason) return;
    try {
      await api.post(`/invoices/${id}/cancel`, { reason });
      alert('Invoice cancelled and ledger journal reversed. Cancellations remain in the audit trail and do not count as revenue.');
      loadInvoices();
      setSelectedInvoice(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel invoice');
    }
  };

  // Open Payment Modal
  const openPaymentModal = (inv: any) => {
    setPaymentInvoice(inv);
    setPaymentAmount(String(inv.balance_due || inv.total_amount));
    setPaymentRemarks(`Payment for Invoice ${inv.invoice_number}`);
    setPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    setSubmittingPayment(true);
    try {
      await api.post(`/invoices/${paymentInvoice.id}/payments`, {
        amount: Number(paymentAmount),
        payment_date: paymentDate,
        payment_mode: paymentMode,
        receiving_account_id: receivingAccountId,
        reference_number: referenceNumber,
        remarks: paymentRemarks,
      });
      alert('Payment recorded successfully! Receivables and invoice balance updated.');
      setPaymentModalOpen(false);
      loadInvoices();
      if (selectedInvoice && selectedInvoice.id === paymentInvoice.id) {
        handleOpenView(paymentInvoice);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Open Credit Note Modal
  const openCreditNoteModal = (inv: any) => {
    setCreditNoteInvoice(inv);
    setCreditTaxable(String(inv.taxable_amount || 0));
    const taxAmt = Number(inv.cgst_amount || 0) + Number(inv.sgst_amount || 0) + Number(inv.igst_amount || 0);
    setCreditTax(String(taxAmt));
    setCreditTotal(String(inv.total_amount || 0));
    setCreditNoteModalOpen(true);
  };

  const handleCreditNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditNoteInvoice) return;
    const total = Number(creditTotal);
    if (!total || total <= 0) {
      alert('Please enter a valid credit note amount');
      return;
    }
    setSubmittingCreditNote(true);
    try {
      const isInter = creditNoteInvoice.place_of_supply && creditNoteInvoice.place_of_supply !== 'Tamil Nadu';
      const taxVal = Number(creditTax) || 0;
      await api.post(`/invoices/${creditNoteInvoice.id}/credit-notes`, {
        credit_note_date: creditNoteDate,
        reason: creditNoteReason,
        taxable_amount: Number(creditTaxable) || 0,
        cgst_amount: isInter ? 0 : Number((taxVal / 2).toFixed(2)),
        sgst_amount: isInter ? 0 : Number((taxVal / 2).toFixed(2)),
        igst_amount: isInter ? taxVal : 0,
        total_amount: total,
      });
      alert('Credit note issued with controlled double-entry accounting entries (Debit Revenue/GST, Credit AR)!');
      setCreditNoteModalOpen(false);
      loadInvoices();
      if (selectedInvoice && selectedInvoice.id === creditNoteInvoice.id) {
        handleOpenView(creditNoteInvoice);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to issue credit note');
    } finally {
      setSubmittingCreditNote(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate top KPI totals
  const totalInvoiced = invoices.filter((i) => i.status !== 'DRAFT' && i.status !== 'CANCELLED').reduce((acc, i) => acc + Number(i.total_amount || 0), 0);
  const totalReceivable = invoices.filter((i) => i.status !== 'DRAFT' && i.status !== 'CANCELLED').reduce((acc, i) => acc + Number(i.balance_due || 0), 0);
  const totalOverdue = invoices.filter((i) => i.status === 'OVERDUE').reduce((acc, i) => acc + Number(i.balance_due || 0), 0);

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="SALES & RECEIVABLES"
          title="Sales & Invoices Management"
          subtitle="Statutory GST tax invoices, double-entry revenue posting, credit notes, and collection tracking"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#e8edf3] shadow-xs">
              <span className="text-[11px] font-bold text-[#8993a5] uppercase">Total Posted Sales</span>
              <div className="text-xl font-bold text-[#17223a] mt-1">{formatINR(totalInvoiced)}</div>
              <div className="text-[11px] text-[#758195] mt-0.5">Excludes drafts and cancelled invoices</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#e8edf3] shadow-xs">
              <span className="text-[11px] font-bold text-[#8993a5] uppercase">Outstanding Receivables</span>
              <div className="text-xl font-bold text-[#2769d7] mt-1">{formatINR(totalReceivable)}</div>
              <div className="text-[11px] text-[#758195] mt-0.5">Pending collection from customers</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#e8edf3] shadow-xs">
              <span className="text-[11px] font-bold text-[#d75a67] uppercase flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Overdue Invoices
              </span>
              <div className="text-xl font-bold text-[#d75a67] mt-1">{formatINR(totalOverdue)}</div>
              <div className="text-[11px] text-[#758195] mt-0.5">Calculated from past due date & remaining balance</div>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8993a5]" />
                <input
                  type="text"
                  placeholder="Search invoice number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-[#e8edf3] text-xs text-[#17223a] focus:outline-none focus:ring-2 focus:ring-[#367b80] shadow-xs"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white rounded-lg border border-[#e8edf3] text-xs font-semibold text-[#17223a] focus:outline-none shadow-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft (Unposted)</option>
                <option value="POSTED">Posted / Issued</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <Link
              href="/invoices/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173e48] text-white text-xs font-semibold hover:bg-[#214e58] transition-colors shadow-xs"
            >
              <PlusCircle className="h-4 w-4 text-[#d5ad78]" />
              <span>Create New Invoice</span>
            </Link>
          </div>

          {/* Invoices Data Table */}
          <div className="bg-white rounded-xl border border-[#e8edf3] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fb] text-[#8993a5] uppercase tracking-wider text-[11px] font-semibold border-b border-[#e8edf3]">
                  <tr>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4 text-right">Taxable</th>
                    <th className="py-3.5 px-4 text-right">GST</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf3]">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[#758195]">
                        Loading invoices...
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[#758195]">
                        No invoices found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#edf6f4]/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#173e48]">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#17223a]">
                          {inv.customer?.name || 'Walk-in Customer'}
                        </td>
                        <td className="py-3.5 px-4 text-[#758195]">
                          {formatDate(inv.invoice_date)}
                        </td>
                        <td className="py-3.5 px-4 text-[#758195]">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-[#17223a]">
                          {formatINR(inv.taxable_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#758195]">
                          {formatINR(
                            Number(inv.cgst_amount || 0) +
                              Number(inv.sgst_amount || 0) +
                              Number(inv.igst_amount || 0) +
                              Number(inv.cess_amount || 0),
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#17223a]">
                          {formatINR(inv.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#c18a2a]">
                          {formatINR(inv.balance_due)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID'
                                ? 'bg-[#edf6f4] text-[#1b9e76] border border-[#1b9e76]/20'
                                : inv.status === 'POSTED'
                                ? 'bg-[#e9f1ff] text-[#2769d7] border border-[#2769d7]/20'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-[#fff4df] text-[#c18a2a] border border-[#d49422]/20'
                                : inv.status === 'OVERDUE'
                                ? 'bg-[#feecef] text-[#d75a67] border border-[#d75a67]/30 font-extrabold animate-pulse'
                                : inv.status === 'DRAFT'
                                ? 'bg-[#f6f8fb] text-[#758195] border border-[#e8edf3]'
                                : 'bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb] line-through'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenView(inv)}
                              title="View Tax Invoice"
                              className="p-1.5 rounded-md hover:bg-[#edf6f4] text-[#758195] hover:text-[#17223a] transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {inv.status === 'DRAFT' && (
                              <button
                                onClick={() => handlePost(inv.id)}
                                title="Post & Assign Statutory #"
                                className="p-1.5 rounded-md hover:bg-[#edf6f4] text-[#1b9e76] transition-colors"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}

                            {(inv.status === 'POSTED' ||
                              inv.status === 'PARTIALLY_PAID' ||
                              inv.status === 'OVERDUE') && (
                              <button
                                onClick={() => openPaymentModal(inv)}
                                title="Record Payment"
                                className="p-1.5 rounded-md hover:bg-[#e9f1ff] text-[#2769d7] transition-colors"
                              >
                                <CreditCard className="h-4 w-4" />
                              </button>
                            )}

                            {(inv.status === 'POSTED' ||
                              inv.status === 'PARTIALLY_PAID' ||
                              inv.status === 'PAID') && (
                              <button
                                onClick={() => openCreditNoteModal(inv)}
                                title="Issue Credit Note"
                                className="p-1.5 rounded-md hover:bg-[#fff4df] text-[#c18a2a] transition-colors"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}

                            {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                              <button
                                onClick={() => handleCancel(inv.id)}
                                title="Cancel Invoice"
                                className="p-1.5 rounded-md hover:bg-[#feecef] text-[#d75a67] transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Invoice Detail / Printable Tax Invoice Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 bg-[#0a2025]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full p-6 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#e8edf3]">
              {/* Top Modal Controls */}
              <div className="flex items-center justify-between pb-3 border-b border-[#e8edf3]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveModalTab('INVOICE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeModalTab === 'INVOICE'
                        ? 'bg-[#173e48] text-white'
                        : 'bg-[#f6f8fb] text-[#758195] hover:text-[#17223a]'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" /> Tax Invoice
                  </button>
                  <button
                    onClick={() => {
                      setActiveModalTab('HISTORY');
                      handleFetchHistory(selectedInvoice.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeModalTab === 'HISTORY'
                        ? 'bg-[#173e48] text-white'
                        : 'bg-[#f6f8fb] text-[#758195] hover:text-[#17223a]'
                    }`}
                  >
                    <History className="h-3.5 w-3.5" /> Audit History
                  </button>
                  <button
                    onClick={() => {
                      setActiveModalTab('CREDIT_NOTES');
                      handleFetchCreditNotes(selectedInvoice.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeModalTab === 'CREDIT_NOTES'
                        ? 'bg-[#173e48] text-white'
                        : 'bg-[#f6f8fb] text-[#758195] hover:text-[#17223a]'
                    }`}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Credit Notes (
                    {selectedInvoice.credit_notes?.length || 0})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-[#f6f8fb] hover:bg-[#edf6f4] text-[#17223a] text-xs font-semibold flex items-center gap-1.5 border border-[#e8edf3]"
                  >
                    <Printer className="h-3.5 w-3.5 text-[#758195]" /> Print / Download PDF
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1.5 text-[#758195] hover:text-[#17223a] rounded-lg hover:bg-[#f6f8fb]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tab 1: Tax Invoice Printable Document */}
              {activeModalTab === 'INVOICE' && (
                <div id="printable-tax-invoice" className="p-6 bg-white border border-[#e8edf3] rounded-xl space-y-6 text-xs text-[#17223a]">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start border-b border-[#e8edf3] pb-4">
                    <div>
                      <div className="text-lg font-black tracking-tight text-[#173e48]">
                        DUROZEN TECHNOLOGIES PRIVATE LIMITED
                      </div>
                      <div className="text-[#758195] mt-1">123 Tech Park, Anna Salai, Chennai, Tamil Nadu - 600002</div>
                      <div className="font-semibold text-[#17223a] mt-0.5">
                        GSTIN: <span className="font-mono">33AABCD1234E1Z5</span> • State Code: 33 (Tamil Nadu)
                      </div>
                      <div className="text-[11px] text-[#758195]">CIN: U72200TN2026PTC123456 • Email: billing@durozen.com</div>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-1 rounded bg-[#173e48] text-white text-[11px] font-extrabold uppercase tracking-wider">
                        TAX INVOICE
                      </span>
                      <div className="font-mono font-bold text-base text-[#17223a] mt-2">
                        {selectedInvoice.invoice_number}
                      </div>
                      <div className="text-[#758195] mt-0.5">
                        Status:{' '}
                        <span className="font-bold uppercase text-[#173e48]">
                          {selectedInvoice.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Billing Info */}
                  <div className="grid grid-cols-2 gap-6 bg-[#fbfcfd] p-4 rounded-lg border border-[#e8edf3]">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-[#8993a5] uppercase">Billed To (Customer):</div>
                      <div className="font-bold text-sm text-[#17223a]">
                        {selectedInvoice.customer?.name}
                      </div>
                      <div className="text-[#758195]">
                        {selectedInvoice.customer?.billing_address || 'Address on file'}
                      </div>
                      <div className="font-semibold text-[#17223a]">
                        GSTIN: <span className="font-mono">{selectedInvoice.customer?.gstin || 'Unregistered / B2C'}</span>
                      </div>
                      <div className="text-[#758195]">
                        State: {selectedInvoice.customer?.state || 'Tamil Nadu'} (Code: {selectedInvoice.customer?.state_code || '33'})
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <div className="text-[10px] font-bold text-[#8993a5] uppercase">Invoice Details:</div>
                      <div>
                        <span className="text-[#758195]">Invoice Date:</span>{' '}
                        <span className="font-bold">{formatDate(selectedInvoice.invoice_date)}</span>
                      </div>
                      <div>
                        <span className="text-[#758195]">Due Date:</span>{' '}
                        <span className="font-bold text-[#d75a67]">{formatDate(selectedInvoice.due_date)}</span>
                      </div>
                      <div>
                        <span className="text-[#758195]">Supply Date:</span>{' '}
                        <span>{formatDate(selectedInvoice.supply_date || selectedInvoice.invoice_date)}</span>
                      </div>
                      <div>
                        <span className="text-[#758195]">Place of Supply:</span>{' '}
                        <span className="font-bold text-[#173e48]">{selectedInvoice.place_of_supply || 'Tamil Nadu'}</span>
                      </div>
                      <div>
                        <span className="text-[#758195]">Reverse Charge (RCM):</span>{' '}
                        <span className="font-bold">{selectedInvoice.is_reverse_charge ? 'YES' : 'NO'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedInvoice.is_reverse_charge && (
                    <div className="rounded-lg border border-[#f3e5c9] bg-[#fff9ed] p-3 text-xs text-[#694b14]">
                      <div className="font-bold uppercase tracking-wide text-[10px]">
                        Reverse Charge Declaration
                      </div>
                      <p className="mt-1">
                        Tax is payable on reverse charge basis by the recipient. GST of{' '}
                        <strong>
                          {formatINR(
                            Number(selectedInvoice.cgst_amount || 0) +
                              Number(selectedInvoice.sgst_amount || 0) +
                              Number(selectedInvoice.igst_amount || 0) +
                              Number(selectedInvoice.cess_amount || 0),
                          )}
                        </strong>{' '}
                        is payable directly by the recipient to the Government and is not included in the amount payable to the supplier.
                      </p>
                    </div>
                  )}

                  {/* Line Items Table */}
                  <div className="border border-[#e8edf3] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f6f8fb] text-[#8993a5] font-bold border-b border-[#e8edf3] text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Item Description</th>
                          <th className="p-2.5 font-mono">HSN/SAC</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5 text-right">Rate</th>
                          <th className="p-2.5 text-right">Disc</th>
                          <th className="p-2.5 text-right">Taxable</th>
                          <th className="p-2.5 text-right">Tax Rate</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8edf3]">
                        {(selectedInvoice.items || []).map((itm: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#edf6f4]/40">
                            <td className="p-2.5 text-[#758195]">{idx + 1}</td>
                            <td className="p-2.5 font-medium text-[#17223a]">{itm.description}</td>
                            <td className="p-2.5 text-[#758195] font-mono">{itm.hsn_sac || '-'}</td>
                            <td className="p-2.5 text-center">{itm.quantity}</td>
                            <td className="p-2.5 text-[#758195]">{itm.unit || 'NOS'}</td>
                            <td className="p-2.5 text-right">{formatINR(itm.unit_price)}</td>
                            <td className="p-2.5 text-right text-[#758195]">
                              {itm.discount_amount > 0 ? formatINR(itm.discount_amount) : '-'}
                            </td>
                            <td className="p-2.5 text-right font-medium">{formatINR(itm.taxable_value)}</td>
                            <td className="p-2.5 text-right text-[#758195]">{itm.tax_rate}%</td>
                            <td className="p-2.5 text-right font-bold text-[#17223a]">
                              {formatINR(itm.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary & Bank Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                      <div className="bg-[#fbfcfd] p-3 rounded-lg border border-[#e8edf3] space-y-1">
                        <div className="font-bold text-[#173e48] text-[11px] uppercase">
                          Bank Details for Payment
                        </div>
                        <div className="text-[11px]">
                          <span className="text-[#758195]">Bank Name:</span> HDFC Bank Ltd.
                        </div>
                        <div className="text-[11px]">
                          <span className="text-[#758195]">Account Name:</span> Durozen Technologies Pvt. Ltd.
                        </div>
                        <div className="text-[11px]">
                          <span className="text-[#758195]">Account Number:</span>{' '}
                          <span className="font-mono font-bold">50200012345678</span>
                        </div>
                        <div className="text-[11px]">
                          <span className="text-[#758195]">IFSC Code:</span>{' '}
                          <span className="font-mono font-bold">HDFC0001234</span>
                        </div>
                        <div className="text-[11px]">
                          <span className="text-[#758195]">Branch:</span> Anna Salai, Chennai
                        </div>
                      </div>

                      {selectedInvoice.notes && (
                        <div>
                          <span className="font-bold text-[10px] uppercase text-[#8993a5]">Customer Notes:</span>
                          <p className="text-[#758195] text-[11px] mt-0.5">{selectedInvoice.notes}</p>
                        </div>
                      )}

                      {selectedInvoice.terms && (
                        <div>
                          <span className="font-bold text-[10px] uppercase text-[#8993a5]">Terms & Conditions:</span>
                          <p className="text-[#758195] text-[11px] mt-0.5">{selectedInvoice.terms}</p>
                        </div>
                      )}
                    </div>

                    {/* Totals Breakdown */}
                    <div className="space-y-2 bg-[#f6f8fb] p-4 rounded-xl border border-[#e8edf3]">
                      <div className="flex justify-between text-[#758195]">
                        <span>Gross Subtotal:</span>
                        <span className="font-semibold text-[#17223a]">
                          {formatINR(selectedInvoice.subtotal)}
                        </span>
                      </div>

                      {Number(selectedInvoice.discount_amount) > 0 && (
                        <div className="flex justify-between text-[#758195]">
                          <span>Total Discounts:</span>
                          <span className="font-semibold text-[#d75a67]">
                            - {formatINR(selectedInvoice.discount_amount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-[#758195] pt-1 border-t border-[#e8edf3]">
                        <span>Taxable Amount:</span>
                        <span className="font-semibold text-[#17223a]">
                          {formatINR(selectedInvoice.taxable_amount)}
                        </span>
                      </div>

                      {Number(selectedInvoice.cgst_amount) > 0 && (
                        <div className="flex justify-between text-[#758195]">
                          <span>
                            {selectedInvoice.is_reverse_charge
                              ? 'CGST (recipient payable under RCM):'
                              : 'Central GST (CGST):'}
                          </span>
                          <span className="font-semibold text-[#17223a]">
                            {formatINR(selectedInvoice.cgst_amount)}
                          </span>
                        </div>
                      )}

                      {Number(selectedInvoice.sgst_amount) > 0 && (
                        <div className="flex justify-between text-[#758195]">
                          <span>
                            {selectedInvoice.is_reverse_charge
                              ? 'SGST (recipient payable under RCM):'
                              : 'State GST (SGST):'}
                          </span>
                          <span className="font-semibold text-[#17223a]">
                            {formatINR(selectedInvoice.sgst_amount)}
                          </span>
                        </div>
                      )}

                      {Number(selectedInvoice.igst_amount) > 0 && (
                        <div className="flex justify-between text-[#758195]">
                          <span>
                            {selectedInvoice.is_reverse_charge
                              ? 'IGST (recipient payable under RCM):'
                              : 'Integrated GST (IGST):'}
                          </span>
                          <span className="font-semibold text-[#17223a]">
                            {formatINR(selectedInvoice.igst_amount)}
                          </span>
                        </div>
                      )}

                      {Number(selectedInvoice.cess_amount) > 0 && (
                        <div className="flex justify-between text-[#758195]">
                          <span>
                            {selectedInvoice.is_reverse_charge
                              ? 'Cess (recipient payable under RCM):'
                              : 'GST Cess:'}
                          </span>
                          <span className="font-semibold text-[#17223a]">
                            {formatINR(selectedInvoice.cess_amount)}
                          </span>
                        </div>
                      )}

                      {Number(selectedInvoice.rounding_adjustment) !== 0 && (
                        <div className="flex justify-between text-[#758195]">
                          <span>Rounding Adjustment:</span>
                          <span>{Number(selectedInvoice.rounding_adjustment).toFixed(2)}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#e8edf3] flex justify-between font-extrabold text-sm text-[#17223a]">
                        <span>Invoice Total:</span>
                        <span className="text-[#173e48] text-base">{formatINR(selectedInvoice.total_amount)}</span>
                      </div>

                      <div className="flex justify-between text-xs text-[#1b9e76]">
                        <span>Amount Paid / Allocated:</span>
                        <span className="font-bold">{formatINR(selectedInvoice.amount_paid || 0)}</span>
                      </div>

                      <div className="flex justify-between font-bold text-xs text-[#c18a2a] pt-1 border-t border-[#e8edf3]">
                        <span>Balance Due:</span>
                        <span className="text-sm">{formatINR(selectedInvoice.balance_due)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Signatory Footer */}
                  <div className="pt-8 flex justify-between items-end border-t border-[#e8edf3] text-[11px] text-[#758195]">
                    <div>
                      <div>This is a computer-generated tax invoice.</div>
                      <div className="text-[10px] mt-0.5">Subject to Chennai jurisdiction.</div>
                    </div>
                    <div className="text-center space-y-8">
                      <div className="font-bold text-[#173e48]">For DUROZEN TECHNOLOGIES PVT. LTD.</div>
                      <div className="border-t border-[#758195]/40 pt-1 text-[10px]">Authorized Signatory</div>
                    </div>
                  </div>

                  {/* Modal Action Bar inside Invoice */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#e8edf3]">
                    {selectedInvoice.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePost(selectedInvoice.id)}
                        className="px-4 py-2 bg-[#173e48] text-white rounded-lg text-xs font-bold hover:bg-[#2059bd] flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle className="h-4 w-4 text-[#d5ad78]" />
                        <span>Post & Assign Statutory #</span>
                      </button>
                    )}

                    {(selectedInvoice.status === 'POSTED' ||
                      selectedInvoice.status === 'PARTIALLY_PAID' ||
                      selectedInvoice.status === 'OVERDUE') && (
                      <button
                        onClick={() => openPaymentModal(selectedInvoice)}
                        className="px-4 py-2 bg-[#2769d7] text-white rounded-lg text-xs font-bold hover:bg-[#2059bd] flex items-center gap-1.5 shadow-xs"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Record Payment</span>
                      </button>
                    )}

                    {(selectedInvoice.status === 'POSTED' ||
                      selectedInvoice.status === 'PARTIALLY_PAID' ||
                      selectedInvoice.status === 'PAID') && (
                      <button
                        onClick={() => openCreditNoteModal(selectedInvoice)}
                        className="px-4 py-2 bg-[#fff4df] text-[#c18a2a] border border-[#d49422]/20 rounded-lg text-xs font-bold hover:bg-[#ffecc7] flex items-center gap-1.5 shadow-xs"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Issue Credit Note</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Audit Trail & Posting History */}
              {activeModalTab === 'HISTORY' && (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-[#17223a] uppercase tracking-wider">
                    Full Change & Posting Audit Trail
                  </div>
                  {loadingHistory ? (
                    <div className="text-center py-8 text-xs text-[#758195]">Loading history...</div>
                  ) : historyLogs.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#758195]">
                      No audit events logged yet for this invoice.
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-[#e8edf3] space-y-6">
                      {historyLogs.map((log) => (
                        <div key={log.id} className="relative">
                          <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-[#173e48] border-2 border-white" />
                          <div className="text-xs">
                            <span className="font-bold text-[#17223a]">{log.action}</span>
                            <span className="text-[#8993a5] ml-2">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                            <div className="text-[#758195] mt-1">
                              By: {log.user?.name || log.user?.email || 'System'}
                            </div>
                            {log.new_values && (
                              <pre className="mt-1.5 p-2 bg-[#f6f8fb] rounded border border-[#e8edf3] text-[10px] text-[#17223a] font-mono overflow-x-auto">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Credit Notes List */}
              {activeModalTab === 'CREDIT_NOTES' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#17223a] uppercase tracking-wider">
                      Credit Notes Issued Against this Invoice
                    </span>
                    <button
                      onClick={() => openCreditNoteModal(selectedInvoice)}
                      className="px-3 py-1.5 bg-[#173e48] text-white rounded-lg text-xs font-bold hover:bg-[#2059bd] flex items-center gap-1.5 shadow-xs"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-[#d5ad78]" />
                      <span>Issue New Credit Note</span>
                    </button>
                  </div>

                  {loadingCreditNotes ? (
                    <div className="text-center py-8 text-xs text-[#758195]">Loading credit notes...</div>
                  ) : creditNotes.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#758195]">
                      No credit notes issued against this invoice.
                    </div>
                  ) : (
                    <div className="border border-[#e8edf3] rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f6f8fb] text-[#8993a5] uppercase text-[10px] font-bold border-b border-[#e8edf3]">
                          <tr>
                            <th className="p-3">Credit Note #</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Reason</th>
                            <th className="p-3 text-right">Taxable</th>
                            <th className="p-3 text-right">Credit Total</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e8edf3]">
                          {creditNotes.map((cn) => (
                            <tr key={cn.id} className="hover:bg-[#edf6f4]/40">
                              <td className="p-3 font-mono font-bold text-[#173e48]">
                                {cn.credit_note_number}
                              </td>
                              <td className="p-3 text-[#758195]">{formatDate(cn.credit_note_date)}</td>
                              <td className="p-3 font-medium text-[#17223a]">{cn.reason}</td>
                              <td className="p-3 text-right font-medium text-[#17223a]">
                                {formatINR(cn.taxable_amount)}
                              </td>
                              <td className="p-3 text-right font-bold text-[#d75a67]">
                                - {formatINR(cn.total_amount)}
                              </td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#edf6f4] text-[#1b9e76]">
                                  {cn.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Record Payment Direct Modal */}
        {paymentModalOpen && paymentInvoice && (
          <div className="fixed inset-0 z-50 bg-[#0a2025]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#e8edf3]">
              <div className="flex items-center justify-between pb-3 border-b border-[#e8edf3]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#8993a5]">
                    Receivables Collection
                  </span>
                  <h3 className="text-base font-bold text-[#17223a]">
                    Record Payment: {paymentInvoice.invoice_number}
                  </h3>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="p-1 text-[#758195] hover:text-[#17223a]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
                <div className="bg-[#f6f8fb] p-3 rounded-lg border border-[#e8edf3] flex justify-between items-center">
                  <div>
                    <span className="text-[#758195]">Customer:</span>{' '}
                    <span className="font-bold text-[#17223a]">{paymentInvoice.customer?.name}</span>
                  </div>
                  <div>
                    <span className="text-[#758195]">Remaining Due:</span>{' '}
                    <span className="font-bold text-[#c18a2a]">
                      {formatINR(paymentInvoice.balance_due)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#17223a] mb-1">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-medium focus:ring-1 focus:ring-[#367b80]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17223a] mb-1">
                      Amount to Pay (₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-bold text-[#17223a] focus:ring-1 focus:ring-[#367b80]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#17223a] mb-1">
                      Payment Mode *
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-semibold focus:ring-1 focus:ring-[#367b80]"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="UPI">UPI</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CASH">Cash</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17223a] mb-1">
                      Receiving Account *
                    </label>
                    <select
                      value={receivingAccountId}
                      onChange={(e) => setReceivingAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-medium focus:ring-1 focus:ring-[#367b80]"
                    >
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_name} ({acc.bank_name || 'Cash'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17223a] mb-1">
                    Reference / UTR / Cheque #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR123456789"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs focus:ring-1 focus:ring-[#367b80]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17223a] mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={paymentRemarks}
                    onChange={(e) => setPaymentRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs focus:ring-1 focus:ring-[#367b80]"
                  />
                </div>

                <div className="pt-3 border-t border-[#e8edf3] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#e8edf3] text-[#758195] font-semibold hover:bg-[#f6f8fb]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-5 py-2 rounded-lg bg-[#2769d7] text-white font-bold hover:bg-[#2059bd] shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>Confirm & Post Receipt</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Issue Credit Note Modal */}
        {creditNoteModalOpen && creditNoteInvoice && (
          <div className="fixed inset-0 z-50 bg-[#0a2025]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#e8edf3]">
              <div className="flex items-center justify-between pb-3 border-b border-[#e8edf3]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#c18a2a]">
                    Statutory Adjustment
                  </span>
                  <h3 className="text-base font-bold text-[#17223a]">
                    Issue Credit Note against {creditNoteInvoice.invoice_number}
                  </h3>
                </div>
                <button
                  onClick={() => setCreditNoteModalOpen(false)}
                  className="p-1 text-[#758195] hover:text-[#17223a]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreditNoteSubmit} className="space-y-4 text-xs">
                <div className="bg-[#fff4df] p-3 rounded-lg border border-[#f3e5c9] text-[#c18a2a]">
                  Controlled accounting entry: Automatically debits Service Revenue / Returns & Output GST, and credits Accounts Receivable.
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17223a] mb-1">
                    Credit Note Date *
                  </label>
                  <input
                    type="date"
                    value={creditNoteDate}
                    onChange={(e) => setCreditNoteDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-medium focus:ring-1 focus:ring-[#367b80]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17223a] mb-1">
                    Reason for Credit Note *
                  </label>
                  <select
                    value={creditNoteReason}
                    onChange={(e) => setCreditNoteReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-semibold focus:ring-1 focus:ring-[#367b80]"
                  >
                    <option value="Sales Return / Deficiency in Service">Sales Return / Deficiency in Service</option>
                    <option value="Correction in Invoice / Rate Difference">Correction in Invoice / Rate Difference</option>
                    <option value="Post-Sale Discount">Post-Sale Discount</option>
                    <option value="Cancellation / Order Short-Close">Cancellation / Order Short-Close</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#17223a] mb-1">
                      Taxable Credit (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={creditTaxable}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCreditTaxable(val);
                        const tax = Number(val) * 0.18;
                        setCreditTax(tax.toFixed(2));
                        setCreditTotal((Number(val) + tax).toFixed(2));
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-medium focus:ring-1 focus:ring-[#367b80]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17223a] mb-1">
                      GST Credit (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={creditTax}
                      onChange={(e) => {
                        setCreditTax(e.target.value);
                        setCreditTotal((Number(creditTaxable || 0) + Number(e.target.value)).toFixed(2));
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-medium focus:ring-1 focus:ring-[#367b80]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17223a] mb-1">
                      Total Credit (₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={creditTotal}
                      onChange={(e) => setCreditTotal(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-bold text-[#173e48] focus:ring-1 focus:ring-[#367b80]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e8edf3] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCreditNoteModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#e8edf3] text-[#758195] font-semibold hover:bg-[#f6f8fb]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCreditNote}
                    className="px-5 py-2 rounded-lg bg-[#c18a2a] text-white font-bold hover:bg-[#b07b22] shadow-sm flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Issue Credit Note</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
