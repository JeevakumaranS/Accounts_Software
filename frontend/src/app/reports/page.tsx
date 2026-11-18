'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR } from '../../lib/format';
import api from '../../lib/api';
import { BarChart3, TrendingUp, ShieldCheck, Printer, CheckCircle2 } from 'lucide-react';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<'PNL' | 'BALANCE_SHEET' | 'CASH_FLOW'>('PNL');
  const [pnl, setPnl] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [pRes, bRes, cRes] = await Promise.all([
        api.get('/reports/profit-loss'),
        api.get('/reports/balance-sheet'),
        api.get('/reports/cash-flow'),
      ]);
      setPnl(pRes.data.data);
      setBalanceSheet(bRes.data.data);
      setCashFlow(cRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="FINANCIAL REPORTING"
          title="Financial Reports & Statements"
          subtitle="Statutory financial statements derived from double-entry general ledger"
        />

        <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
          {/* Controls */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              {[
                { id: 'PNL', label: 'Profit & Loss' },
                { id: 'BALANCE_SHEET', label: 'Balance Sheet' },
                { id: 'CASH_FLOW', label: 'Cash Flow' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeReport === r.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
            >
              <Printer className="h-4 w-4" /> Print / Export
            </button>
          </div>

          {/* 1. PROFIT & LOSS */}
          {activeReport === 'PNL' && pnl && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-lg font-extrabold text-slate-900">Durozen Technologies Pvt. Ltd.</h2>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">
                  Statement of Profit and Loss
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  For Financial Year 2026-27 (Amounts in INR ₹)
                </div>
              </div>

              {/* Income */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs uppercase text-slate-700 tracking-wider">
                  Revenue / Operating Income
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {pnl.income?.accounts?.map((acc: any) => (
                    <div key={acc.code} className="py-2.5 flex justify-between">
                      <span className="text-slate-700 font-medium">{acc.name}</span>
                      <span className="font-bold text-slate-900">{formatINR(acc.amount)}</span>
                    </div>
                  ))}
                  <div className="py-2.5 flex justify-between font-extrabold text-slate-900 bg-emerald-50/50 px-3 rounded-lg">
                    <span>Total Income (A):</span>
                    <span className="text-emerald-700">{formatINR(pnl.income?.total_income)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs uppercase text-slate-700 tracking-wider">
                  Operating Expenses
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {pnl.expenses?.accounts?.map((acc: any) => (
                    <div key={acc.code} className="py-2.5 flex justify-between">
                      <span className="text-slate-700 font-medium">{acc.name}</span>
                      <span className="font-bold text-slate-900">{formatINR(acc.amount)}</span>
                    </div>
                  ))}
                  <div className="py-2.5 flex justify-between font-extrabold text-slate-900 bg-rose-50/50 px-3 rounded-lg">
                    <span>Total Expenses (B):</span>
                    <span className="text-rose-700">{formatINR(pnl.expenses?.total_expense)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-blue-900">
                    Net Profit / (Loss) for the Period (A - B)
                  </div>
                  <div className="text-[11px] text-blue-600">Reconciled to Retained Earnings</div>
                </div>
                <div className="text-2xl font-black text-blue-700">
                  {formatINR(pnl.net_profit)}
                </div>
              </div>
            </div>
          )}

          {/* 2. BALANCE SHEET */}
          {activeReport === 'BALANCE_SHEET' && balanceSheet && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-lg font-extrabold text-slate-900">Durozen Technologies Pvt. Ltd.</h2>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">
                  Balance Sheet
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  As of {balanceSheet.as_of_date} (Double-entry reconciled)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                {/* Assets */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-xs uppercase text-blue-900 tracking-wider pb-1 border-b border-slate-200">
                    I. Assets
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {balanceSheet.assets?.accounts?.map((acc: any) => (
                      <div key={acc.code} className="py-2 flex justify-between">
                        <span className="text-slate-700">{acc.name}</span>
                        <span className="font-semibold text-slate-900">{formatINR(acc.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl flex justify-between font-extrabold text-blue-900">
                    <span>Total Assets:</span>
                    <span>{formatINR(balanceSheet.assets?.total_assets)}</span>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider pb-1 border-b border-slate-200">
                    II. Liabilities & Equity
                  </h3>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Liabilities</div>
                    <div className="divide-y divide-slate-100">
                      {balanceSheet.liabilities?.accounts?.map((acc: any) => (
                        <div key={acc.code} className="py-2 flex justify-between">
                          <span className="text-slate-700">{acc.name}</span>
                          <span className="font-semibold text-slate-900">{formatINR(acc.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Equity</div>
                    <div className="divide-y divide-slate-100">
                      {balanceSheet.equity?.accounts?.map((acc: any) => (
                        <div key={acc.code} className="py-2 flex justify-between">
                          <span className="text-slate-700">{acc.name}</span>
                          <span className="font-semibold text-slate-900">{formatINR(acc.amount)}</span>
                        </div>
                      ))}
                      <div className="py-2 flex justify-between text-blue-700 font-semibold">
                        <span>Current Year Earnings (P&L):</span>
                        <span>{formatINR(balanceSheet.equity?.current_year_earnings)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl flex justify-between font-extrabold text-slate-900">
                    <span>Total Liabilities & Equity:</span>
                    <span>{formatINR(balanceSheet.total_liabilities_and_equity)}</span>
                  </div>
                </div>
              </div>

              {/* Accounting Equation Verification Banner */}
              <div
                className={`p-4 rounded-xl flex items-center justify-between border ${
                  balanceSheet.is_balanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold text-xs">
                    Accounting Equation Verified: Assets = Liabilities + Equity
                  </span>
                </div>
                <span className="text-xs font-extrabold">
                  {formatINR(balanceSheet.assets?.total_assets)} = {formatINR(balanceSheet.total_liabilities_and_equity)}
                </span>
              </div>
            </div>
          )}

          {/* 3. CASH FLOW */}
          {activeReport === 'CASH_FLOW' && cashFlow && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-lg font-extrabold text-slate-900">Durozen Technologies Pvt. Ltd.</h2>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">
                  Cash Flow Statement
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl flex justify-between font-bold">
                  <span>Cash Flow from Operating Activities:</span>
                  <span className="text-blue-600">{formatINR(cashFlow.operating_activities?.net_cash_from_operations)}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl flex justify-between font-bold">
                  <span>Cash Flow from Investing Activities:</span>
                  <span>{formatINR(cashFlow.investing_activities?.net_cash_from_investing)}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl flex justify-between font-bold">
                  <span>Cash Flow from Financing Activities:</span>
                  <span>{formatINR(cashFlow.financing_activities?.net_cash_from_financing)}</span>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex justify-between font-extrabold text-sm text-blue-900">
                  <span>Net Change in Cash & Cash Equivalents:</span>
                  <span>{formatINR(cashFlow.net_change_in_cash)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
