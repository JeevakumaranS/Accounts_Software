'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR, formatDate } from '../../lib/format';
import api from '../../lib/api';
import {
  PlusCircle,
  FileText,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Ban,
  Send,
  Eye,
  X,
  Printer,
} from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  useEffect(() => {
    loadInvoices();
  }, []);

  const handlePost = async (id: string) => {
    if (!confirm('Post this invoice? This will generate the official statutory invoice number and post balanced double-entry journals to Accounts Receivable and Revenue.')) return;
    try {
      await api.post(`/invoices/${id}/post`);
      alert('Invoice posted successfully!');
      loadInvoices();
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice(null);
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
      alert('Invoice cancelled and journal reversed.');
      loadInvoices();
      setSelectedInvoice(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel invoice');
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="INVOICING & SALES"
          title="Sales & Invoices Management"
          subtitle="Generate GST invoices, post double-entry receivables & track collections"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none shadow-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="POSTED">Posted</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <Link
              href="/invoices/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2769d7] hover:bg-[#2059bd] text-white text-xs font-bold transition-all shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create New Invoice</span>
            </Link>
          </div>

          {/* Invoices Data Table */}
          <div className="bg-white rounded-lg border border-[#e8edf3] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fb] text-[#8993a5] text-[11px] font-bold uppercase tracking-wider border-b border-[#e8edf3]">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Taxable</th>
                    <th className="py-3 px-4 text-right">GST</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef1f5]">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[#758195]">
                        No invoices found. Click "Create New Invoice" to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#f6f8fb] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#173e48]">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#17223a]">
                          {inv.customer?.name || 'Walk-in Customer'}
                        </td>
                        <td className="py-3 px-4 text-[#758195]">
                          {formatDate(inv.invoice_date)}
                        </td>
                        <td className="py-3 px-4 text-[#758195]">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#17223a]">
                          {formatINR(inv.taxable_amount)}
                        </td>
                        <td className="py-3 px-4 text-right text-[#758195]">
                          {formatINR(Number(inv.cgst_amount || 0) + Number(inv.sgst_amount || 0) + Number(inv.igst_amount || 0))}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#17223a]">
                          {formatINR(inv.total_amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#c18a2a]">
                          {formatINR(inv.balance_due)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.status === 'PAID'
                                ? 'bg-[#edf6f4] text-[#1b9e76] border border-[#dfe5e4]'
                                : inv.status === 'POSTED'
                                ? 'bg-[#e9f1ff] text-[#2769d7] border border-[#d6e4ff]'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-[#fff4df] text-[#c18a2a] border border-[#f3e5c9]'
                                : inv.status === 'DRAFT'
                                ? 'bg-[#f6f8fb] text-[#758195] border border-[#e8edf3]'
                                : 'bg-[#feecef] text-[#d75a67] border border-[#fad2d8]'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              title="View Invoice"
                              className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {inv.status === 'DRAFT' && (
                              <button
                                onClick={() => handlePost(inv.id)}
                                title="Post Invoice"
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1"
                              >
                                <Send className="h-3 w-3" /> Post
                              </button>
                            )}
                            {inv.status === 'POSTED' && Number(inv.amount_paid) === 0 && (
                              <button
                                onClick={() => handleCancel(inv.id)}
                                title="Cancel Invoice"
                                className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                              >
                                <Ban className="h-3.5 w-3.5" />
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

        {/* Invoice Preview Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Tax Invoice
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {selectedInvoice.invoice_number}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Printer className="h-4 w-4" /> Print
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Company & Customer Details */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <div className="font-bold text-slate-900 text-sm">Durozen Technologies Pvt. Ltd.</div>
                  <div className="text-slate-600 mt-1">123 Tech Park, Anna Salai, Chennai</div>
                  <div className="font-semibold text-slate-800 mt-1">GSTIN: 33AABCD1234E1Z5</div>
                  <div className="text-slate-600">State: Tamil Nadu (Code: 33)</div>
                </div>

                <div className="text-right">
                  <div className="text-slate-500 font-semibold uppercase text-[10px]">Billed To:</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {selectedInvoice.customer?.name}
                  </div>
                  <div className="text-slate-600 mt-1">
                    {selectedInvoice.customer?.billing_address}, {selectedInvoice.customer?.city}
                  </div>
                  <div className="font-semibold text-slate-800 mt-1">
                    GSTIN: {selectedInvoice.customer?.gstin || 'Unregistered / B2C'}
                  </div>
                  <div className="text-slate-600">
                    Place of Supply: {selectedInvoice.place_of_supply}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5">HSN/SAC</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Rate</th>
                      <th className="p-2.5 text-right">Taxable</th>
                      <th className="p-2.5 text-right">Tax</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedInvoice.items || []).map((itm: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-slate-900">{itm.description}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{itm.hsn_sac || '-'}</td>
                        <td className="p-2.5 text-center text-slate-700">{itm.quantity}</td>
                        <td className="p-2.5 text-right">{formatINR(itm.unit_price)}</td>
                        <td className="p-2.5 text-right font-medium">{formatINR(itm.taxable_value)}</td>
                        <td className="p-2.5 text-right text-slate-600">{itm.tax_rate}%</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatINR(itm.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Amount:</span>
                    <span className="font-semibold text-slate-900">{formatINR(selectedInvoice.taxable_amount)}</span>
                  </div>
                  {Number(selectedInvoice.cgst_amount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>CGST:</span>
                      <span className="font-semibold text-slate-900">{formatINR(selectedInvoice.cgst_amount)}</span>
                    </div>
                  )}
                  {Number(selectedInvoice.sgst_amount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>SGST:</span>
                      <span className="font-semibold text-slate-900">{formatINR(selectedInvoice.sgst_amount)}</span>
                    </div>
                  )}
                  {Number(selectedInvoice.igst_amount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST:</span>
                      <span className="font-semibold text-slate-900">{formatINR(selectedInvoice.igst_amount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                    <span>Total Invoice:</span>
                    <span className="text-blue-600">{formatINR(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs text-amber-700">
                    <span>Balance Due:</span>
                    <span>{formatINR(selectedInvoice.balance_due)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
