'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR, formatDate } from '../../lib/format';
import api from '../../lib/api';
import { PlusCircle, ArrowUpRight, X } from 'lucide-react';

export default function PayablesPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [vendorId, setVendorId] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [selectedBillId, setSelectedBillId] = useState('');
  const [refNumber, setRefNumber] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [payRes, billRes, vendRes, bankRes] = await Promise.all([
        api.get('/vendor-payments'),
        api.get('/vendor-bills'),
        api.get('/vendors'),
        api.get('/cash-bank/accounts'),
      ]);
      setPayments(payRes.data.data || []);
      setBills(billRes.data.data || []);
      const vends = vendRes.data.data || [];
      setVendors(vends);
      const banks = bankRes.data.data || [];
      setBankAccounts(banks);
      if (banks.length > 0) setAccountId(banks[0].id);
      if (vends.length > 0) setVendorId(vends[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const vendorUnpaidBills = bills.filter(
    (b) => b.vendor_id === vendorId && Number(b.balance_due) > 0,
  );

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Enter a valid amount');
      return;
    }
    try {
      const allocations = selectedBillId
        ? [{ bill_id: selectedBillId, allocated_amount: Number(amount) }]
        : [];

      await api.post('/vendor-payments', {
        vendor_id: vendorId,
        payment_date: new Date(),
        amount: Number(amount),
        payment_mode: paymentMode,
        paying_account_id: accountId,
        reference_number: refNumber,
        allocations,
      });

      alert('Vendor payment recorded & posted to ledger!');
      setShowModal(false);
      setAmount('');
      setRefNumber('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record payment');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Vendor Payables & Disbursements"
          subtitle="Record outgoing bank transfers to settle vendor bills"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Vendor Payment Register</h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all shadow-md shadow-purple-600/20"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Record Vendor Payment</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Payment #</th>
                    <th className="py-3.5 px-4">Vendor</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Paid From</th>
                    <th className="py-3.5 px-4">Ref #</th>
                    <th className="py-3.5 px-4 text-right">Amount Paid</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No vendor payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-600">
                          {p.payment_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {p.vendor?.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDate(p.payment_date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {p.payment_mode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {p.paying_account?.account_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {p.reference_number || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-purple-600">
                          {formatINR(p.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {p.status}
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-purple-600" />
                  Record Vendor Payment
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vendor *</label>
                  <select
                    value={vendorId}
                    onChange={(e) => {
                      setVendorId(e.target.value);
                      setSelectedBillId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
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
                      placeholder="e.g. 5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Mode *</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                      <option value="UPI">UPI</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CASH">Cash in Hand</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paid From Account *</label>
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
                    Allocate to Outstanding Vendor Bill
                  </label>
                  <select
                    value={selectedBillId}
                    onChange={(e) => {
                      setSelectedBillId(e.target.value);
                      const bill = bills.find((b) => b.id === e.target.value);
                      if (bill && !amount) setAmount(bill.balance_due);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    <option value="">-- Unallocated / Advance to Vendor --</option>
                    {vendorUnpaidBills.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bill_number} - {b.vendor_bill_number} (Due: {formatINR(b.balance_due)})
                      </option>
                    ))}
                  </select>
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
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Confirm & Post Payment
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
