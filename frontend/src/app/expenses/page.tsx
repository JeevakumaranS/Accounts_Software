'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR, formatDate } from '../../lib/format';
import api from '../../lib/api';
import { PlusCircle, Receipt, X } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [taxableAmount, setTaxableAmount] = useState('15000');
  const [taxRate, setTaxRate] = useState('0');
  const [accountId, setAccountId] = useState('');
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [billNumber, setBillNumber] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, catRes, bankRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/expenses/categories'),
        api.get('/cash-bank/accounts'),
      ]);
      setExpenses(expRes.data.data || []);
      const cats = catRes.data.data || [];
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);

      const banks = bankRes.data.data || [];
      setBankAccounts(banks);
      if (banks.length > 0) setAccountId(banks[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taxable = Number(taxableAmount);
      const rate = Number(taxRate);
      const halfRate = rate / 2;
      const cgst = (taxable * halfRate) / 100;
      const sgst = (taxable * halfRate) / 100;

      await api.post('/expenses', {
        category_id: categoryId,
        description,
        taxable_amount: taxable,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: 0,
        total_amount: taxable + cgst + sgst,
        payment_account_id: accountId,
        payment_mode: paymentMode,
        bill_number: billNumber,
      });

      alert('Expense recorded & posted to accounting ledger!');
      setShowModal(false);
      setDescription('');
      setBillNumber('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record expense');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="EXPENSE TRACKING"
          title="Operating Expenses Management"
          subtitle="Record and classify direct, administrative and utility expenses"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Expense Transactions</h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Record Expense</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Expense #</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Paid Via</th>
                    <th className="py-3.5 px-4">Bill #</th>
                    <th className="py-3.5 px-4 text-right">Taxable</th>
                    <th className="py-3.5 px-4 text-right">Total Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No expenses recorded yet. Click "Record Expense" to add.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-600">
                          {e.expense_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {e.category?.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                          {e.description}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDate(e.expense_date)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {e.payment_account?.account_name} ({e.payment_mode})
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {e.bill_number || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                          {formatINR(e.taxable_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                          {formatINR(e.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {e.status}
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
                  <Receipt className="h-5 w-5 text-amber-600" />
                  Record Expense
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Rent for current month"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Taxable Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={taxableAmount}
                      onChange={(e) => setTaxableAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GST Rate</label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    >
                      <option value="0">0% (Nil / Exempt)</option>
                      <option value="18">18% (Standard GST)</option>
                      <option value="12">12%</option>
                      <option value="5">5%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Paid From *</label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    >
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.account_name} ({formatINR(b.current_balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="CASH">Cash in Hand</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bill / Voucher Number</label>
                  <input
                    type="text"
                    placeholder="e.g. VCH-0042"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
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
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  >
                    Confirm & Post Expense
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
