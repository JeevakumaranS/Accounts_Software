'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR } from '../../lib/format';
import api from '../../lib/api';
import { Printer, CheckCircle2 } from 'lucide-react';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<
    'PNL' | 'BALANCE_SHEET' | 'CASH_FLOW'
  >('PNL');
  const [pnl, setPnl] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/reports/profit-and-loss'),
      api.get('/reports/balance-sheet'),
      api.get('/reports/cash-flow'),
    ])
      .then(([pnlRes, bsRes, cfRes]) => {
        setPnl(pnlRes.data?.data || null);
        setBalanceSheet(bsRes.data?.data || null);
        setCashFlow(cfRes.data?.data || null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="FINANCIAL STATEMENTS"
          title="Executive Financial Reports"
          subtitle="Generate IFRS & Ind AS compliant Income Statement, Balance Sheet & Cash Flow"
        />

        <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
          {/* Controls */}
          <div className="flex items-center justify-between border-b border-[#e8edf3] pb-3">
            <div className="flex items-center gap-2">
              {[
                { id: 'PNL', label: 'Profit & Loss' },
                { id: 'BALANCE_SHEET', label: 'Balance Sheet' },
                { id: 'CASH_FLOW', label: 'Cash Flow' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id as any)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeReport === r.id
                      ? 'bg-[#173e48] text-white shadow-xs'
                      : 'text-[#758195] hover:text-[#17223a] hover:bg-[#edf6f4]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e8edf3] text-[#17223a] text-xs font-semibold hover:bg-[#f6f8fb] shadow-xs"
            >
              <Printer className="h-4 w-4 text-[#758195]" /> Print / Export
            </button>
          </div>

          {/* 1. PROFIT & LOSS */}
          {activeReport === 'PNL' && pnl && (
            <div className="bg-white rounded-xl border border-[#e8edf3] p-8 shadow-[0_1px_2px_rgba(220,225,232,0.35)] space-y-6">
              <div className="text-center pb-4 border-b border-[#e8edf3]">
                <h2 className="text-lg font-bold text-[#17223a]">Durozen Technologies Pvt. Ltd.</h2>
                <div className="text-xs font-bold text-[#173e48] uppercase tracking-wider mt-0.5">
                  Statement of Profit and Loss
                </div>
                <div className="text-xs text-[#758195] mt-1">
                  For Financial Year 2026-27 (Amounts in INR ₹)
                </div>
              </div>

              {/* Income */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase text-[#17223a] tracking-wider">
                  Revenue / Operating Income
                </h3>
                <div className="divide-y divide-[#e8edf3] text-xs">
                  {pnl.income?.accounts?.map((acc: any) => (
                    <div key={acc.code} className="py-2.5 flex justify-between">
                      <span className="text-[#17223a] font-medium">{acc.name}</span>
                      <span className="font-bold text-[#17223a]">{formatINR(acc.amount)}</span>
                    </div>
                  ))}
                  <div className="py-2.5 flex justify-between font-bold text-[#17223a] bg-[#edf6f4] px-3 rounded-lg border border-[#1b9e76]/20">
                    <span>Total Income (A):</span>
                    <span className="text-[#1b9e76]">{formatINR(pnl.income?.total_income)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase text-[#17223a] tracking-wider">
                  Operating Expenses
                </h3>
                <div className="divide-y divide-[#e8edf3] text-xs">
                  {pnl.expenses?.accounts?.map((acc: any) => (
                    <div key={acc.code} className="py-2.5 flex justify-between">
                      <span className="text-[#17223a] font-medium">{acc.name}</span>
                      <span className="font-bold text-[#17223a]">{formatINR(acc.amount)}</span>
                    </div>
                  ))}
                  <div className="py-2.5 flex justify-between font-bold text-[#17223a] bg-[#feecef] px-3 rounded-lg border border-[#d75a67]/20">
                    <span>Total Expenses (B):</span>
                    <span className="text-[#d75a67]">{formatINR(pnl.expenses?.total_expense)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className="p-4 rounded-xl bg-[#173e48] text-white border border-[#42636b] flex items-center justify-between shadow-sm">
                <div>
                  <div className="font-bold text-sm text-white">
                    Net Profit / (Loss) for the Period (A - B)
                  </div>
                  <div className="text-[11px] text-[#bfd1d1]">Reconciled to Retained Earnings</div>
                </div>
                <div className="text-2xl font-bold text-[#85e3c8]">
                  {formatINR(pnl.net_profit)}
                </div>
              </div>
            </div>
          )}

          {/* 2. BALANCE SHEET */}
          {activeReport === 'BALANCE_SHEET' && balanceSheet && (
            <div className="bg-white rounded-xl border border-[#e8edf3] p-8 shadow-[0_1px_2px_rgba(220,225,232,0.35)] space-y-6">
              <div className="text-center pb-4 border-b border-[#e8edf3]">
                <h2 className="text-lg font-bold text-[#17223a]">Durozen Technologies Pvt. Ltd.</h2>
                <div className="text-xs font-bold text-[#173e48] uppercase tracking-wider mt-0.5">
                  Balance Sheet
                </div>
                <div className="text-xs text-[#758195] mt-1">
                  As of {balanceSheet.as_of_date} (Double-entry reconciled)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                {/* Assets */}
                <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase text-[#173e48] tracking-wider pb-1 border-b border-[#e8edf3]">
                    I. Assets
                  </h3>
                  <div className="divide-y divide-[#e8edf3]">
                    {balanceSheet.assets?.accounts?.map((acc: any) => (
                      <div key={acc.code} className="py-2 flex justify-between">
                        <span className="text-[#17223a]">{acc.name}</span>
                        <span className="font-semibold text-[#17223a]">{formatINR(acc.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-[#edf6f4] border border-[#d5e0dd] rounded-lg flex justify-between font-bold text-[#173e48]">
                    <span>Total Assets:</span>
                    <span>{formatINR(balanceSheet.assets?.total_assets)}</span>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase text-[#17223a] tracking-wider pb-1 border-b border-[#e8edf3]">
                    II. Liabilities & Equity
                  </h3>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-[#8993a5] uppercase">Liabilities</div>
                    <div className="divide-y divide-[#e8edf3]">
                      {balanceSheet.liabilities?.accounts?.map((acc: any) => (
                        <div key={acc.code} className="py-2 flex justify-between">
                          <span className="text-[#17223a]">{acc.name}</span>
                          <span className="font-semibold text-[#17223a]">{formatINR(acc.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#e8edf3]">
                    <div className="text-[11px] font-bold text-[#8993a5] uppercase">Equity</div>
                    <div className="divide-y divide-[#e8edf3]">
                      {balanceSheet.equity?.accounts?.map((acc: any) => (
                        <div key={acc.code} className="py-2 flex justify-between">
                          <span className="text-[#17223a]">{acc.name}</span>
                          <span className="font-semibold text-[#17223a]">{formatINR(acc.amount)}</span>
                        </div>
                      ))}
                      <div className="py-2 flex justify-between text-[#173e48] font-semibold">
                        <span>Current Year Earnings (P&L):</span>
                        <span>{formatINR(balanceSheet.equity?.current_year_earnings)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#f6f8fb] border border-[#e8edf3] rounded-lg flex justify-between font-bold text-[#17223a]">
                    <span>Total Liabilities & Equity:</span>
                    <span>{formatINR(balanceSheet.total_liabilities_and_equity)}</span>
                  </div>
                </div>
              </div>

              {/* Accounting Equation Verification Banner */}
              <div
                className={`p-4 rounded-xl flex items-center justify-between border ${
                  balanceSheet.is_balanced
                    ? 'bg-[#edf6f4] border-[#1b9e76]/30 text-[#1b9e76]'
                    : 'bg-[#feecef] border-[#d75a67]/30 text-[#d75a67]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#1b9e76]" />
                  <span className="font-bold text-xs">
                    Accounting Equation Verified: Assets = Liabilities + Equity
                  </span>
                </div>
                <span className="text-xs font-bold font-mono">
                  {formatINR(balanceSheet.assets?.total_assets)} = {formatINR(balanceSheet.total_liabilities_and_equity)}
                </span>
              </div>
            </div>
          )}

          {/* 3. CASH FLOW */}
          {activeReport === 'CASH_FLOW' && cashFlow && (
            <div className="bg-white rounded-xl border border-[#e8edf3] p-8 shadow-[0_1px_2px_rgba(220,225,232,0.35)] space-y-6">
              <div className="text-center pb-4 border-b border-[#e8edf3]">
                <h2 className="text-lg font-bold text-[#17223a]">Durozen Technologies Pvt. Ltd.</h2>
                <div className="text-xs font-bold text-[#173e48] uppercase tracking-wider mt-0.5">
                  Cash Flow Statement
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 bg-[#f6f8fb] border border-[#e8edf3] rounded-lg flex justify-between font-bold text-[#17223a]">
                  <span>Cash Flow from Operating Activities:</span>
                  <span className="text-[#173e48]">{formatINR(cashFlow.operating_activities?.net_cash_from_operations)}</span>
                </div>
                <div className="p-4 bg-[#f6f8fb] border border-[#e8edf3] rounded-lg flex justify-between font-bold text-[#17223a]">
                  <span>Cash Flow from Investing Activities:</span>
                  <span className="text-[#17223a]">{formatINR(cashFlow.investing_activities?.net_cash_from_investing)}</span>
                </div>
                <div className="p-4 bg-[#f6f8fb] border border-[#e8edf3] rounded-lg flex justify-between font-bold text-[#17223a]">
                  <span>Cash Flow from Financing Activities:</span>
                  <span className="text-[#17223a]">{formatINR(cashFlow.financing_activities?.net_cash_from_financing)}</span>
                </div>
                <div className="p-4 bg-[#173e48] text-white border border-[#42636b] rounded-lg flex justify-between font-bold text-sm shadow-sm">
                  <span>Net Change in Cash & Cash Equivalents:</span>
                  <span className="text-[#d5ad78]">{formatINR(cashFlow.net_change_in_cash)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
