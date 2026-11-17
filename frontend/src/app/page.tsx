'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuthStore } from '../store/auth.store';
import api from '../lib/api';
import { formatINR } from '../lib/format';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Users,
  CreditCard,
  Building,
  RefreshCw,
  PlusCircle,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  DollarSign,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    available_funds: 0,
    receivables: 0,
    payables: 0,
    cash_balance: 0,
    bank_balance: 0,
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

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data.data || {});
      if (txRes.status === 'fulfilled') setRecentTx(txRes.value.data.data || []);
      if (recAgeing && recRes.status === 'fulfilled') setRecAgeing(recRes.value.data.data || {});
      if (payAgeing && payRes.status === 'fulfilled') setPayAgeing(payRes.value.data.data || {});
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
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="FINANCIAL CONTROL CENTER"
          title="CEO & Financial Overview"
          subtitle="Real-time double-entry bookkeeping ledgers & Indian GST compliance metrics"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Period Selector Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-[#e8edf3] shadow-2xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8993a5]">
                Reporting Entity
              </div>
              <div className="text-sm font-bold text-[#17223a] flex items-center gap-2">
                <span>Durozen Technologies Pvt. Ltd. (GSTIN: 33AABCD1234E1Z5)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {['Today', 'This Month', 'FY 2026-27'].map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    dateFilter === f
                      ? 'bg-[#173e48] text-white shadow-xs'
                      : 'bg-[#f6f8fb] text-[#758195] hover:bg-[#edf1f7]'
                  }`}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={loadData}
                title="Refresh Metrics"
                className="p-1.5 rounded-md border border-[#e8edf3] text-[#758195] hover:text-[#17223a] hover:bg-[#f6f8fb]"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#2769d7]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Dark Revenue & Financial Summary Strip (#173e48) */}
          <div className="bg-[#173e48] rounded-xl border border-[#42636b] text-white p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#d5ad78] mb-3">
              STATUTORY POSITION SUMMARY
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#42636b]">
              <div className="pt-2 md:pt-0 md:pr-4">
                <div className="text-[11px] text-[#c8d8d8] font-medium">Gross Revenue Recognized</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatINR(summary.total_revenue)}
                </div>
                <div className="text-[10px] text-[#d5ad78] mt-0.5">Accrual Revenue (4000)</div>
              </div>

              <div className="pt-2 md:pt-0 md:px-4">
                <div className="text-[11px] text-[#c8d8d8] font-medium">Liquid Available Funds</div>
                <div className="text-2xl font-bold text-[#d5ad78] mt-1">
                  {formatINR(summary.available_funds)}
                </div>
                <div className="text-[10px] text-[#c8d8d8] mt-0.5">Bank + Cash in Hand</div>
              </div>

              <div className="pt-2 md:pt-0 md:px-4">
                <div className="text-[11px] text-[#c8d8d8] font-medium">Accounts Receivable (1100)</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatINR(summary.receivables)}
                </div>
                <div className="text-[10px] text-[#c8d8d8] mt-0.5">Customer Balance Due</div>
              </div>

              <div className="pt-2 md:pt-0 md:pl-4">
                <div className="text-[11px] text-[#c8d8d8] font-medium">Accounts Payable (2000)</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatINR(summary.payables)}
                </div>
                <div className="text-[10px] text-[#c8d8d8] mt-0.5">Vendor Obligations Due</div>
              </div>
            </div>
          </div>

          {/* Quick Action Floating Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <Link
              href="/invoices/new"
              className="flex items-center gap-2.5 p-3 rounded-lg bg-[#2769d7] text-white font-semibold text-xs hover:bg-[#2059bd] transition-all shadow-xs"
            >
              <PlusCircle className="h-4 w-4 shrink-0 text-white" />
              <span>Create Invoice</span>
            </Link>

            <Link
              href="/receivables"
              className="flex items-center gap-2.5 p-3 rounded-lg bg-[#1b9e76] text-white font-semibold text-xs hover:bg-[#15805f] transition-all shadow-xs"
            >
              <ArrowDownRight className="h-4 w-4 shrink-0 text-white" />
              <span>Record Receipt</span>
            </Link>

            <Link
              href="/vendor-bills"
              className="flex items-center gap-2.5 p-3 rounded-lg bg-[#173e48] text-white font-semibold text-xs hover:bg-[#214e58] transition-all shadow-xs"
            >
              <FileText className="h-4 w-4 shrink-0 text-[#d5ad78]" />
              <span>Add Vendor Bill</span>
            </Link>

            <Link
              href="/expenses"
              className="flex items-center gap-2.5 p-3 rounded-lg bg-[#c18a2a] text-white font-semibold text-xs hover:bg-[#a67420] transition-all shadow-xs"
            >
              <Receipt className="h-4 w-4 shrink-0 text-white" />
              <span>Add Expense</span>
            </Link>

            <Link
              href="/payroll"
              className="flex items-center gap-2.5 p-3 rounded-lg bg-[#214e58] text-white font-semibold text-xs hover:bg-[#28606a] transition-all shadow-xs"
            >
              <Users className="h-4 w-4 shrink-0 text-[#d5ad78]" />
              <span>Run Payroll</span>
            </Link>
          </div>

          {/* Core Accounting KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white p-5 rounded-lg border border-[#e8edf3] shadow-xs">
              <div className="flex items-center justify-between text-[#758195] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8993a5]">Total Revenue</span>
                <span className="h-8 w-8 rounded-lg bg-[#edf6f4] text-[#1b9e76] flex items-center justify-center font-bold">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-[#17223a]">
                {formatINR(summary.total_revenue)}
              </div>
              <div className="text-[11px] text-[#1b9e76] font-semibold mt-1">
                Posted Sales & Income
              </div>
            </div>

            {/* Total Expenses */}
            <div className="bg-white p-5 rounded-lg border border-[#e8edf3] shadow-xs">
              <div className="flex items-center justify-between text-[#758195] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8993a5]">Total Expenses</span>
                <span className="h-8 w-8 rounded-lg bg-[#feecef] text-[#d75a67] flex items-center justify-center font-bold">
                  <TrendingDown className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-[#17223a]">
                {formatINR(summary.total_expenses)}
              </div>
              <div className="text-[11px] text-[#758195] font-medium mt-1">
                Operating, Salaries, Purchases
              </div>
            </div>

            {/* Net Profit / Loss */}
            <div className="bg-white p-5 rounded-lg border border-[#e8edf3] shadow-xs">
              <div className="flex items-center justify-between text-[#758195] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8993a5]">Net Profit / Loss</span>
                <span
                  className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                    summary.net_profit >= 0
                      ? 'bg-[#e9f1ff] text-[#2769d7]'
                      : 'bg-[#feecef] text-[#d75a67]'
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                </span>
              </div>
              <div
                className={`text-2xl font-bold ${
                  summary.net_profit >= 0 ? 'text-[#2769d7]' : 'text-[#d75a67]'
                }`}
              >
                {formatINR(summary.net_profit)}
              </div>
              <div className="text-[11px] text-[#758195] font-medium mt-1">
                Revenue less Recognized Expenses
              </div>
            </div>

            {/* Available Funds */}
            <div className="bg-white p-5 rounded-lg border border-[#e8edf3] shadow-xs">
              <div className="flex items-center justify-between text-[#758195] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8993a5]">Liquid Reserves</span>
                <span className="h-8 w-8 rounded-lg bg-[#edf6f4] text-[#173e48] flex items-center justify-center font-bold">
                  <Wallet className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-[#17223a]">
                {formatINR(summary.available_funds)}
              </div>
              <div className="text-[11px] text-[#173e48] font-semibold mt-1">
                Cash in Hand + Bank Accounts
              </div>
            </div>
          </div>

          {/* Attention & Working Capital Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Receivables Ageing Card */}
            <div className="bg-white p-5 rounded-lg border border-[#e8edf3] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#e8edf3]">
                <div>
                  <h3 className="font-bold text-sm text-[#17223a]">Customer Receivables Ageing</h3>
                  <p className="text-xs text-[#758195]">Uncollected customer balances by due date</p>
                </div>
                <Link
                  href="/receivables"
                  className="text-xs font-semibold text-[#2769d7] hover:text-[#173e48] flex items-center gap-1"
                >
                  View All <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                <div className="p-2.5 bg-[#f6f8fb] rounded-md border border-[#e8edf3]">
                  <div className="text-[10px] font-bold text-[#758195]">Current</div>
                  <div className="text-xs font-bold text-[#17223a] mt-1">
                    {formatINR(recAgeing.current || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-[#edf6f4] rounded-md border border-[#dfe5e4]">
                  <div className="text-[10px] font-bold text-[#1b9e76]">1-30 D</div>
                  <div className="text-xs font-bold text-[#1b9e76] mt-1">
                    {formatINR(recAgeing.days1_30 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-[#fff4df] rounded-md border border-[#f3e5c9]">
                  <div className="text-[10px] font-bold text-[#c18a2a]">31-60 D</div>
                  <div className="text-xs font-bold text-[#c18a2a] mt-1">
                    {formatINR(recAgeing.days31_60 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-[#fff0ed] rounded-md border border-[#fbdcd5]">
                  <div className="text-[10px] font-bold text-[#b76545]">61-90 D</div>
                  <div className="text-xs font-bold text-[#b76545] mt-1">
                    {formatINR(recAgeing.days61_90 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-[#feecef] rounded-md border border-[#fad2d8]">
                  <div className="text-[10px] font-bold text-[#d75a67]">&gt; 90 D</div>
                  <div className="text-xs font-bold text-[#d75a67] mt-1">
                    {formatINR(recAgeing.above90 || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payables Ageing Card */}
            <div className="bg-white p-5 rounded-lg border border-[#e8edf3] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#e8edf3]">
                <div>
                  <h3 className="font-bold text-sm text-[#17223a]">Vendor Payables Ageing</h3>
                  <p className="text-xs text-[#758195]">Outstanding vendor obligations by due date</p>
                </div>
                <Link
                  href="/payables"
                  className="text-xs font-semibold text-[#2769d7] hover:text-[#173e48] flex items-center gap-1"
                >
                  View All <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                <div className="p-2.5 bg-[#f6f8fb] rounded-md border border-[#e8edf3]">
                  <div className="text-[10px] font-bold text-[#758195]">Current</div>
                  <div className="text-xs font-bold text-[#17223a] mt-1">
                    {formatINR(payAgeing.current || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-[#edf6f4] rounded-md border border-[#dfe5e4]">
                  <div className="text-[10px] font-bold text-[#1b9e76]">1-30 D</div>
                  <div className="text-xs font-bold text-[#1b9e76] mt-1">
                    {formatINR(payAgeing.days1_30 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-[#fff4df] rounded-md border border-[#f3e5c9]">
                  <div className="text-[10px] font-bold text-[#c18a2a]">31-60 D</div>
                  <div className="text-xs font-bold text-[#c18a2a] mt-1">
                    {formatINR(payAgeing.days31_60 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-[#fff0ed] rounded-md border border-[#fbdcd5]">
                  <div className="text-[10px] font-bold text-[#b76545]">61-90 D</div>
                  <div className="text-xs font-bold text-[#b76545] mt-1">
                    {formatINR(payAgeing.days61_90 || 0)}
                  </div>
                </div>
                <div className="p-2.5 bg-[#feecef] rounded-md border border-[#fad2d8]">
                  <div className="text-[10px] font-bold text-[#d75a67]">&gt; 90 D</div>
                  <div className="text-xs font-bold text-[#d75a67] mt-1">
                    {formatINR(payAgeing.above90 || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Journal Transactions */}
          <div className="bg-white rounded-lg border border-[#e8edf3] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#e8edf3] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#17223a]">Recent Double-Entry Journal Postings</h3>
                <p className="text-xs text-[#758195]">Immutable audit trail of transactions</p>
              </div>
              <Link
                href="/accounting"
                className="text-xs font-semibold text-[#2769d7] hover:text-[#173e48] flex items-center gap-1"
              >
                Open General Ledger <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f6f8fb] text-[#8993a5] text-[11px] font-bold uppercase tracking-wider border-b border-[#e8edf3]">
                    <th className="p-3 pl-4">Entry Number</th>
                    <th className="p-3">Posting Date</th>
                    <th className="p-3">Source Type</th>
                    <th className="p-3">Narration</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef1f5] text-xs font-medium text-[#17223a]">
                  {recentTx.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#758195]">
                        No transactions recorded in this period
                      </td>
                    </tr>
                  ) : (
                    recentTx.slice(0, 8).map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#f6f8fb] transition-colors">
                        <td className="p-3 pl-4 font-bold text-[#173e48]">
                          {tx.entry_number}
                        </td>
                        <td className="p-3 text-[#758195]">
                          {new Date(tx.posting_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#edf6f4] text-[#173e48] border border-[#dfe5e4]">
                            {tx.source_type}
                          </span>
                        </td>
                        <td className="p-3 text-[#17223a] max-w-xs truncate">{tx.narration}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf6f4] text-[#1b9e76]">
                            <CheckCircle2 className="h-3 w-3" /> POSTED
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
      </main>
    </div>
  );
}
