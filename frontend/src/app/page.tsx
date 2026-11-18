'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building,
  CreditCard,
  DollarSign,
  ExternalLink,
  FileText,
  PlusCircle,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { formatDate, formatINR } from '../lib/format';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

type DashboardSummary = Record<string, number | string>;
type AgeingSummary = Record<string, number | string>;

const initialSummary: DashboardSummary = {
  total_revenue: 0,
  total_expenses: 0,
  net_profit: 0,
  available_funds: 0,
  receivables: 0,
  payables: 0,
  cash_balance: 0,
  bank_balance: 0,
};

const ageingBuckets = [
  { key: 'current', label: 'Current', color: 'bg-slate-50 text-slate-700' },
  { key: 'days1_30', label: '1-30 days', color: 'bg-emerald-50 text-emerald-700' },
  { key: 'days31_60', label: '31-60 days', color: 'bg-amber-50 text-amber-700' },
  { key: 'days61_90', label: '61-90 days', color: 'bg-orange-50 text-orange-700' },
  { key: 'above90', label: 'Over 90 days', color: 'bg-rose-50 text-rose-700' },
] as const;

export default function DashboardPage() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>(initialSummary);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [recAgeing, setRecAgeing] = useState<AgeingSummary>({});
  const [payAgeing, setPayAgeing] = useState<AgeingSummary>({});
  const [dateFilter, setDateFilter] = useState('FY 2026-27');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, txRes, recRes, payRes] = await Promise.allSettled([
        api.get('/dashboard/summary'),
        api.get('/dashboard/recent-transactions'),
        api.get('/dashboard/receivables-ageing'),
        api.get('/dashboard/payables-ageing'),
      ]);

      if (sumRes.status === 'fulfilled') {
        setSummary({ ...initialSummary, ...(sumRes.value.data.data || {}) });
      }
      if (txRes.status === 'fulfilled') {
        setRecentTx(txRes.value.data.data || []);
      }
      if (recRes.status === 'fulfilled') {
        setRecAgeing(recRes.value.data.data || {});
      }
      if (payRes.status === 'fulfilled') {
        setPayAgeing(payRes.value.data.data || {});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    void loadData();
  }, [checkAuth, loadData]);

  const primaryMetrics = [
    { label: 'Total Revenue', value: summary.total_revenue, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Expenses', value: summary.total_expenses, icon: TrendingDown, color: 'text-rose-600 bg-rose-50' },
    { label: 'Net Profit / Loss', value: summary.net_profit, icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
    { label: 'Available Funds', value: summary.available_funds, icon: Wallet, color: 'text-indigo-600 bg-indigo-50' },
  ];

  const secondaryMetrics = [
    { label: 'Receivables Due', value: summary.receivables, icon: ArrowDownRight, color: 'text-amber-600 bg-amber-50' },
    { label: 'Vendor Payables', value: summary.payables, icon: ArrowUpRight, color: 'text-purple-600 bg-purple-50' },
    { label: 'Cash in Hand', value: summary.cash_balance, icon: Building, color: 'text-slate-600 bg-slate-100' },
    { label: 'Bank Balance', value: summary.bank_balance, icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
  ];

  const ageingCards = [
    { title: 'Customer Receivables Ageing', href: '/receivables', values: recAgeing },
    { title: 'Vendor Payables Ageing', href: '/payables', values: payAgeing },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Header
          eyebrow="FINANCIAL CONTROL CENTER"
          title="CEO & Financial Overview"
          subtitle="Real-time double-entry bookkeeping ledgers and GST metrics"
        />

        <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
          <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Reporting Entity
              </div>
              <div className="text-sm font-bold text-slate-800">
                Durozen Technologies Pvt. Ltd.
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['Today', 'This Month', 'FY 2026-27'].map((period) => (
                <button
                  key={period}
                  onClick={() => setDateFilter(period)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    dateFilter === period
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {period}
                </button>
              ))}
              <button
                onClick={() => void loadData()}
                title="Refresh metrics"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {primaryMetrics.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                  </span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatINR(value)}</div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {secondaryMetrics.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-900">{formatINR(value)}</div>
                </div>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Link
              href="/invoices/new"
              className="flex items-center gap-2 rounded-lg bg-blue-600 p-3 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4" /> Create Invoice
            </Link>
            <Link
              href="/receivables"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 p-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <ArrowDownRight className="h-4 w-4" /> Record Receipt
            </Link>
            <Link
              href="/vendor-bills"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 p-3 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <FileText className="h-4 w-4" /> Add Vendor Bill
            </Link>
            <Link
              href="/expenses"
              className="flex items-center gap-2 rounded-lg bg-amber-600 p-3 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
            >
              <Receipt className="h-4 w-4" /> Add Expense
            </Link>
            <Link
              href="/payroll"
              className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 text-xs font-semibold text-white transition-colors hover:bg-slate-900"
            >
              <Users className="h-4 w-4" /> Run Payroll
            </Link>
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {ageingCards.map(({ title, href, values }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-800">{title}</h2>
                  <Link
                    href={href}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View all <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {ageingBuckets.map(({ key, label, color }) => (
                    <div key={key} className={`rounded-lg p-2.5 text-center ${color}`}>
                      <div className="text-[10px] font-semibold">{label}</div>
                      <div className="mt-1 text-xs font-bold">
                        {formatINR(values[key] || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Recent Journal Transactions</h2>
                <p className="text-xs text-slate-500">Latest posted double-entry records</p>
              </div>
              <Link
                href="/accounting"
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                General ledger <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            {recentTx.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {loading ? 'Loading transactions...' : 'No transactions recorded yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Entry #</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Narration</th>
                      <th className="px-4 py-3 text-right">Debits</th>
                      <th className="px-4 py-3 text-right">Credits</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTx.map((tx) => {
                      const totalDebit = (tx.lines || []).reduce(
                        (sum: number, line: any) => sum + Number(line.debit || 0),
                        0,
                      );
                      const totalCredit = (tx.lines || []).reduce(
                        (sum: number, line: any) => sum + Number(line.credit || 0),
                        0,
                      );
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80">
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {formatDate(tx.posting_date)}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-blue-600">
                            {tx.entry_number}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{tx.source_type}</td>
                          <td className="max-w-xs truncate px-4 py-3 text-slate-700">
                            {tx.narration || '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {formatINR(totalDebit)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {formatINR(totalCredit)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                tx.status === 'POSTED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
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
          </section>
        </div>
      </main>
    </div>
  );
}
