'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR, formatDate } from '../../lib/format';
import api from '../../lib/api';
import { PlusCircle, Search, ArrowDownRight, CheckCircle2, X } from 'lucide-react';

export default function ReceivablesPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, invRes, custRes, bankRes] = await Promise.all([
        api.get('/receipts'),
        api.get('/invoices'),
        api.get('/customers'),
        api.get('/cash-bank/accounts'),
      ]);
      setReceipts(recRes.data.data || []);
      setInvoices(invRes.data.data || []);
      setCustomers(custRes.data.data || []);
      const banks = bankRes.data.data || [];
      setBankAccounts(banks);
      if (banks.length > 0) setAccountId(banks[0].id);
      if (custRes.data.data?.length > 0) setCustomerId(custRes.data.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter invoices for selected customer that have balance_due > 0
  const customerUnpaidInvoices = invoices.filter(
    (inv) => inv.customer_id === customerId && Number(inv.balance_due) > 0,
  );

  const handleRecordReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Enter a valid amount');
      return;
    }
    try {
      const allocations = selectedInvoiceId
        ? [{ invoice_id: selectedInvoiceId, allocated_amount: Number(amount) }]
        : [];

      await api.post('/receipts', {
        customer_id: customerId,
        payment_date: new Date(),
        amount: Number(amount),
        payment_mode: paymentMode,
        receiving_account_id: accountId,
        reference_number: refNumber,
        remarks,
        allocations,
      });

      alert('Payment receipt recorded & posted to ledger!');
      setShowModal(false);
      setAmount('');
      setRefNumber('');
      setRemarks('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record receipt');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="ACCOUNTS RECEIVABLE"
          title="Receivables & Customer Receipts"
          subtitle="Track incoming cash/bank receipts and invoice settlement allocations"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Payment Receipts Register</h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Record Customer Payment</span>
            </button>
          </div>

          {/* Receipts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Receipt #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Deposited To</th>
                    <th className="py-3.5 px-4">Ref #</th>
                    <th className="py-3.5 px-4 text-right">Amount Received</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No customer payment receipts recorded yet.
                      </td>
                    </tr>
                  ) : (
                    receipts.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                          {r.receipt_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {r.customer?.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDate(r.payment_date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {r.payment_mode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {r.receiving_account?.account_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {r.reference_number || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                          {formatINR(r.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Record Receipt Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5 text-emerald-600" />
                  Record Customer Receipt
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRecordReceipt} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer *</label>
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      setSelectedInvoiceId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Mode *</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
                      <option value="UPI">UPI Payment</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CASH">Cash in Hand</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deposited To Account *</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.account_name} (Current: {formatINR(b.current_balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Allocate to Outstanding Invoice (Optional)
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => {
                      setSelectedInvoiceId(e.target.value);
                      const inv = invoices.find((i) => i.id === e.target.value);
                      if (inv && !amount) setAmount(inv.balance_due);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    <option value="">-- Unallocated / Customer Advance --</option>
                    {customerUnpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} (Due: {formatINR(inv.balance_due)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Reference / UTR #</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR12345678"
                      value={refNumber}
                      onChange={(e) => setRefNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Remarks</label>
                    <input
                      type="text"
                      placeholder="Notes..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Confirm & Post Receipt
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
