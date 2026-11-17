'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { formatINR, formatDate } from '../lib/format';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Building,
  CreditCard,
  PlusCircle,
  Receipt,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    receivables: 0,
    payables: 0,
    cash_balance: 25000,
    bank_balance: 550000,
    available_funds: 575000,
    salary_payable: 0,
    net_gst_payable: 0,
  });
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [recAgeing, setRecAgeing] = useState<any>({});
  const [payAgeing, setPayAgeing] = useState<any>({});
  const [dateFilter, setDateFilter] = useState('FY 2026-27');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, txRes, recRes, payRes] = await Promise.allSettled([
        api.get('/dashboard/summary'),
        api.get('/dashboard/recent-transactions'),
        api.get('/dashboard/receivables-ageing'),
        api.get('/dashboard/payables-ageing'),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data.data);
      if (txRes.status === 'fulfilled') setRecentTx(txRes.value.data.data || []);
      if (recRes.status === 'fulfilled') setRecAgeing(recRes.value.data.data || {});
      if (payRes.status === 'fulfilled') setPayAgeing(payRes.value.data.data || {});
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="CEO & Financial Overview"
          subtitle="Real-time double-entry bookkeeping ledgers & Indian GST metrics"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Period Selector Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Reporting Period
              </div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Durozen Technologies Pvt. Ltd. (GSTIN: 33AABCD1234E1Z5)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {['Today', 'This Month', 'FY 2026-27'].map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    dateFilter === f
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={loadData}
                title="Refresh Metrics"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Action Floating Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <Link
              href="/invoices/new"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              <PlusCircle className="h-4 w-4 shrink-0" />
              <span>Create Invoice</span>
            </Link>

            <Link
              href="/receivables"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
            >
              <ArrowDownRight className="h-4 w-4 shrink-0" />
              <span>Record Receipt</span>
            </Link>

            <Link
              href="/vendor-bills"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-600 text-white font-medium text-xs hover:bg-purple-700 transition-all shadow-sm hover:shadow-md"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>Add Vendor Bill</span>
            </Link>

            <Link
              href="/expenses"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-600 text-white font-medium text-xs hover:bg-amber-700 transition-all shadow-sm hover:shadow-md"
            >
              <Receipt className="h-4 w-4 shrink-0" />
              <span>Add Expense</span>
            </Link>

            <Link
              href="/payroll"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800 text-white font-medium text-xs hover:bg-slate-900 transition-all shadow-sm hover:shadow-md"
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Run Payroll</span>
            </Link>
          </div>

          {/* Core Accounting KPIs Grid (SRS Section 4.1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                <span className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {formatINR(summary.total_revenue)}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                Posted Sales Invoices & Income
              </div>
            </div>

            {/* Total Expenses */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
                <span className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <TrendingDown className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {formatINR(summary.total_expenses)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Operating, Rent, Utilities, Subscriptions
              </div>
            </div>

            {/* Net Profit / Loss */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Net Profit / Loss</span>
                <span
                  className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                    summary.net_profit >= 0
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                </span>
              </div>
              <div
                className={`text-2xl font-extrabold ${
                  summary.net_profit >= 0 ? 'text-blue-600' : 'text-rose-600'
                }`}
              >
                {formatINR(summary.net_profit)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Income less Expenses recognized
              </div>
            </div>

            {/* Available Funds */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Available Funds</span>
                <span className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Wallet className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {formatINR(summary.available_funds)}
              </div>
              <div className="text-[11px] text-indigo-600 font-medium mt-1">
                Cash in Hand + Bank Accounts
              </div>
            </div>
          </div>

          {/* Secondary KPIs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Receivables */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Receivables Due
                </div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatINR(summary.receivables)}
                </div>
                <div className="text-[10px] text-amber-600 font-medium">Customer Unpaid Invoices</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            </div>

            {/* Payables */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Vendor Payables
                </div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatINR(summary.payables)}
                </div>
                <div className="text-[10px] text-purple-600 font-medium">Outstanding Vendor Bills</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>

            {/* Cash in Hand */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Cash in Hand
                </div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatINR(summary.cash_balance)}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Petty & Office Cash</div>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                <Building className="h-5 w-5" />
              </div>
            </div>

            {/* Bank Accounts */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Bank Balance
                </div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatINR(summary.bank_balance)}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">HDFC Current Account</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Ageing & Working Capital Breakdown (SRS Section 4.4 & 4.5) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Receivables Ageing Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Customer Receivables Ageing</h3>
                  <p className="text-xs text-slate-500">Uncollected customer balances by due date</p>
                </div>
                <Link
                  href="/receivables"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  View All <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-500">Current</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {formatINR(recAgeing.current || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-[10px] font-semibold text-emerald-700">1-30 D</div>
                  <div className="text-xs font-bold text-emerald-800 mt-1">
                    {formatINR(recAgeing.days1_30 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-[10px] font-semibold text-amber-700">31-60 D</div>
                  <div className="text-xs font-bold text-amber-800 mt-1">
                    {formatINR(recAgeing.days31_60 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="text-[10px] font-semibold text-orange-700">61-90 D</div>
                  <div className="text-xs font-bold text-orange-800 mt-1">
                    {formatINR(recAgeing.days61_90 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                  <div className="text-[10px] font-semibold text-rose-700">&gt; 90 D</div>
                  <div className="text-xs font-bold text-rose-800 mt-1">
                    {formatINR(recAgeing.above90 || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payables Ageing Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Vendor Payables Ageing</h3>
                  <p className="text-xs text-slate-500">Upcoming and overdue supplier payments</p>
                </div>
                <Link
                  href="/payables"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  View All <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-500">Current</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {formatINR(payAgeing.current || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="text-[10px] font-semibold text-purple-700">1-30 D</div>
                  <div className="text-xs font-bold text-purple-800 mt-1">
                    {formatINR(payAgeing.days1_30 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-[10px] font-semibold text-amber-700">31-60 D</div>
                  <div className="text-xs font-bold text-amber-800 mt-1">
                    {formatINR(payAgeing.days31_60 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="text-[10px] font-semibold text-orange-700">61-90 D</div>
                  <div className="text-xs font-bold text-orange-800 mt-1">
                    {formatINR(payAgeing.days61_90 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                  <div className="text-[10px] font-semibold text-rose-700">&gt; 90 D</div>
                  <div className="text-xs font-bold text-rose-800 mt-1">
                    {formatINR(payAgeing.above90 || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Posted Double-Entry Journal Register (SRS Section 4.11) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Recent Posted Journal Entries
                </h3>
                <p className="text-xs text-slate-500">
                  Double-entry bookkeeping audit trail (Debits = Credits)
                </p>
              </div>
              <Link
                href="/accounting"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Full General Ledger <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {recentTx.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <div className="text-sm font-semibold text-slate-700">
                  Double-Entry Engine Initialized
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Every posted invoice, customer receipt, vendor bill, expense, or payroll run
                  generates balanced debit and credit entries automatically.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Link
                    href="/invoices/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                  >
                    Create First Sales Invoice
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Entry #</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Narration</th>
                      <th className="py-3 px-4">Debits</th>
                      <th className="py-3 px-4">Credits</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTx.map((tx) => {
                      const totalDebit = (tx.lines || []).reduce(
                        (sum: number, l: any) => sum + Number(l.debit || 0),
                        0,
                      );
                      const totalCredit = (tx.lines || []).reduce(
                        (sum: number, l: any) => sum + Number(l.credit || 0),
                        0,
                      );
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                            {formatDate(tx.posting_date)}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">
                            {tx.entry_number}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {tx.source_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-slate-700">
                            {tx.narration || '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {formatINR(totalDebit)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {formatINR(totalCredit)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                tx.status === 'POSTED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
