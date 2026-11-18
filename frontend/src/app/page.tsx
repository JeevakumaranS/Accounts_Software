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
  { key: 'current', label: 'Current', color: 'bg-[#edf6f4] text-[#173e48] border border-[#d5e0dd]' },
  { key: 'days1_30', label: '1-30 days', color: 'bg-[#edf6f4] text-[#1b9e76] border border-[#1b9e76]/20' },
  { key: 'days31_60', label: '31-60 days', color: 'bg-[#fff4df] text-[#c18a2a] border border-[#d49422]/20' },
  { key: 'days61_90', label: '61-90 days', color: 'bg-[#fff1d9] text-[#94600f] border border-[#d49422]/30' },
  { key: 'above90', label: 'Over 90 days', color: 'bg-[#feecef] text-[#d75a67] border border-[#d75a67]/20' },
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

  const secondaryMetrics = [
    { label: 'Receivables Due', value: summary.receivables, icon: ArrowDownRight, color: 'text-[#c18a2a] bg-[#fff4df]' },
    { label: 'Vendor Payables', value: summary.payables, icon: ArrowUpRight, color: 'text-[#d75a67] bg-[#feecef]' },
    { label: 'Cash in Hand', value: summary.cash_balance, icon: Building, color: 'text-[#173e48] bg-[#edf6f4]' },
    { label: 'Bank Balance', value: summary.bank_balance, icon: CreditCard, color: 'text-[#2769d7] bg-[#e9f1ff]' },
  ];

  const ageingCards = [
    { title: 'Customer Receivables Ageing', href: '/receivables', values: recAgeing },
    { title: 'Vendor Payables Ageing', href: '/payables', values: payAgeing },
  ];

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Header
          eyebrow="FINANCIAL CONTROL CENTER"
          title="CEO & Financial Overview"
          subtitle="Real-time double-entry bookkeeping ledgers and GST metrics"
        />

        <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
          {/* Controls Bar */}
          <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#e8edf3] bg-white p-4 shadow-[0_1px_2px_rgba(220,225,232,0.35)] sm:flex-row sm:items-center">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8993a5]">
                Reporting Entity
              </div>
              <div className="text-sm font-bold text-[#17223a]">
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
                      ? 'bg-[#173e48] text-white shadow-xs'
                      : 'bg-[#f6f8fb] text-[#758195] hover:text-[#17223a] border border-[#e8edf3]'
                  }`}
                >
                  {period}
                </button>
              ))}
              <button
                onClick={() => void loadData()}
                title="Refresh metrics"
                className="rounded-lg border border-[#e8edf3] p-1.5 text-[#758195] hover:bg-[#f6f8fb] hover:text-[#17223a] transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </section>

          {/* Revenue & Financial Summary Strip */}
          <section aria-label="Financial summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#173e48] text-white rounded-xl border border-[#42636b] overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-[#42636b]">
              <span className="block text-[11px] text-[#bfd1d1] font-medium">Total Revenue</span>
              <strong className="block text-2xl font-bold mt-1 text-white">{formatINR(summary.total_revenue)}</strong>
              <small className="text-[11px] text-[#8faab0] mt-0.5 block">Earned this fiscal</small>
            </div>
            <div className="p-4 sm:p-5 border-b sm:border-b-0 lg:border-r border-[#42636b]">
              <span className="block text-[11px] text-[#bfd1d1] font-medium">Total Expenses</span>
              <strong className="block text-2xl font-bold mt-1 text-white">{formatINR(summary.total_expenses)}</strong>
              <small className="text-[11px] text-[#8faab0] mt-0.5 block">Operating & Admin</small>
            </div>
            <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-[#42636b]">
              <span className="block text-[11px] text-[#bfd1d1] font-medium">Net Profit / Loss</span>
              <strong className={`block text-2xl font-bold mt-1 ${Number(summary.net_profit) >= 0 ? 'text-[#85e3c8]' : 'text-[#fca5a5]'}`}>
                {formatINR(summary.net_profit)}
              </strong>
              <small className="text-[11px] text-[#8faab0] mt-0.5 block">Bottom line profit</small>
            </div>
            <div className="p-4 sm:p-5">
              <span className="block text-[11px] text-[#bfd1d1] font-medium">Available Funds</span>
              <strong className="block text-2xl font-bold mt-1 text-white">{formatINR(summary.available_funds)}</strong>
              <small className="text-[11px] text-[#8faab0] mt-0.5 block">Cash + Bank liquidity</small>
            </div>
          </section>

          {/* Secondary KPI Cards */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {secondaryMetrics.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-[#e8edf3] bg-white p-4 shadow-[0_1px_2px_rgba(220,225,232,0.35)]"
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#8993a5]">
                    {label}
                  </div>
                  <div className="mt-1 text-lg font-bold text-[#17223a]">{formatINR(value)}</div>
                </div>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            ))}
          </section>

          {/* Quick Action Navigation */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Link
              href="/invoices/new"
              className="flex items-center gap-2 rounded-lg bg-[#173e48] p-3 text-xs font-semibold text-white transition-colors hover:bg-[#214e58]"
            >
              <PlusCircle className="h-4 w-4 text-[#d5ad78]" /> Create Invoice
            </Link>
            <Link
              href="/receivables"
              className="flex items-center gap-2 rounded-lg bg-[#28606a] p-3 text-xs font-semibold text-white transition-colors hover:bg-[#2a606b]"
            >
              <ArrowDownRight className="h-4 w-4 text-[#85e3c8]" /> Record Receipt
            </Link>
            <Link
              href="/vendor-bills"
              className="flex items-center gap-2 rounded-lg bg-[#173e48] p-3 text-xs font-semibold text-white transition-colors hover:bg-[#214e58]"
            >
              <FileText className="h-4 w-4 text-[#d5ad78]" /> Add Vendor Bill
            </Link>
            <Link
              href="/expenses"
              className="flex items-center gap-2 rounded-lg bg-[#28606a] p-3 text-xs font-semibold text-white transition-colors hover:bg-[#2a606b]"
            >
              <Receipt className="h-4 w-4 text-[#fff4df]" /> Add Expense
            </Link>
            <Link
              href="/payroll"
              className="flex items-center gap-2 rounded-lg bg-[#214e58] p-3 text-xs font-semibold text-white transition-colors hover:bg-[#173e48]"
            >
              <Users className="h-4 w-4 text-[#c8d8d8]" /> Run Payroll
            </Link>
          </section>

          {/* Ageing Summary Cards */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {ageingCards.map(({ title, href, values }) => (
              <div key={title} className="rounded-xl border border-[#e8edf3] bg-white p-5 shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
                <div className="mb-4 flex items-center justify-between border-b border-[#e8edf3] pb-3">
                  <h2 className="text-sm font-bold text-[#17223a]">{title}</h2>
                  <Link
                    href={href}
                    className="flex items-center gap-1 text-xs font-semibold text-[#2769d7] hover:text-[#1d4ed8]"
                  >
                    View all <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {ageingBuckets.map(({ key, label, color }) => (
                    <div key={key} className={`rounded-lg p-2.5 text-center ${color}`}>
                      <div className="text-[10px] font-bold">{label}</div>
                      <div className="mt-1 text-xs font-bold">
                        {formatINR(values[key] || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Recent Journal Transactions */}
          <section className="overflow-hidden rounded-xl border border-[#e8edf3] bg-white shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
            <div className="flex items-center justify-between border-b border-[#e8edf3] p-5">
              <div>
                <h2 className="text-sm font-bold text-[#17223a]">Recent Journal Transactions</h2>
                <p className="text-xs text-[#758195]">Latest posted double-entry records</p>
              </div>
              <Link
                href="/accounting"
                className="flex items-center gap-1 text-xs font-semibold text-[#2769d7] hover:text-[#1d4ed8]"
              >
                General ledger <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            {recentTx.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#758195]">
                {loading ? 'Loading transactions...' : 'No transactions recorded yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#e8edf3] bg-[#f6f8fb] text-[11px] uppercase tracking-wider font-semibold text-[#8993a5]">
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
                  <tbody className="divide-y divide-[#e8edf3]">
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
                        <tr key={tx.id} className="hover:bg-[#edf6f4]/40 transition-colors">
                          <td className="whitespace-nowrap px-4 py-3 text-[#758195]">
                            {formatDate(tx.posting_date)}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#173e48]">
                            {tx.entry_number}
                          </td>
                          <td className="px-4 py-3 text-[#17223a] font-medium">{tx.source_type}</td>
                          <td className="max-w-xs truncate px-4 py-3 text-[#17223a]">
                            {tx.narration || '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-[#17223a]">
                            {formatINR(totalDebit)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-[#17223a]">
                            {formatINR(totalCredit)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                tx.status === 'POSTED'
                                  ? 'bg-[#edf6f4] text-[#1b9e76] border border-[#1b9e76]/20'
                                  : 'bg-[#f6f8fb] text-[#758195] border border-[#e8edf3]'
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
