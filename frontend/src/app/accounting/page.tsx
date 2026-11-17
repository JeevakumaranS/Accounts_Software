'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR, formatDate } from '../../lib/format';
import api from '../../lib/api';
import {
  BookOpen,
  FileCheck2,
  Scale,
  ListTree,
  PlusCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<'COA' | 'JOURNALS' | 'LEDGER' | 'TRIAL_BALANCE'>('TRIAL_BALANCE');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>({ accounts: [], total_debit: 0, total_credit: 0 });
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accRes, jrnRes, tbRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/journals'),
        api.get('/reports/trial-balance'),
      ]);
      const accs = accRes.data.data || [];
      setAccounts(accs);
      setJournals(jrnRes.data.data?.items || []);
      setTrialBalance(tbRes.data.data || { accounts: [], total_debit: 0, total_credit: 0 });

      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
        loadLedger(accs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async (accId: string) => {
    try {
      const res = await api.get(`/ledger/${accId}`);
      setLedgerData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReverseJournal = async (id: string) => {
    const reason = prompt('Reason for reversing journal entry:');
    if (!reason) return;
    try {
      await api.post(`/journals/${id}/reverse`, { reason });
      alert('Journal reversed successfully with an immutable reversal entry!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to reverse journal');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Accounting Engine & General Ledger"
          subtitle="Single source of truth double-entry bookkeeping engine & Chart of Accounts"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'TRIAL_BALANCE', label: 'Trial Balance', icon: Scale },
              { id: 'LEDGER', label: 'General Ledger', icon: BookOpen },
              { id: 'JOURNALS', label: 'Journal Register', icon: FileCheck2 },
              { id: 'COA', label: 'Chart of Accounts', icon: ListTree },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: TRIAL BALANCE */}
          {activeTab === 'TRIAL_BALANCE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Trial Balance Reconciliation</h3>
                  <p className="text-xs text-slate-500">
                    Debit balances must equal Credit balances as of today
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {trialBalance.is_balanced ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Ledgers Balanced</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold">
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                      <span>Unbalanced Trial Balance</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-24">Code</th>
                      <th className="py-3 px-4">Account Name</th>
                      <th className="py-3 px-4 w-28">Type</th>
                      <th className="py-3 px-4 text-right w-36">Debit Balance (₹)</th>
                      <th className="py-3 px-4 text-right w-36">Credit Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trialBalance.accounts?.map((acc: any) => (
                      <tr key={acc.code} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{acc.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{acc.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {acc.account_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-900">
                          {acc.debit > 0 ? formatINR(acc.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-900">
                          {acc.credit > 0 ? formatINR(acc.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100/80 font-black text-xs border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="py-3.5 px-4 text-slate-900 uppercase">
                        Total General Ledger Balance:
                      </td>
                      <td className="py-3.5 px-4 text-right text-blue-700 font-extrabold">
                        {formatINR(trialBalance.total_debit)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-blue-700 font-extrabold">
                        {formatINR(trialBalance.total_credit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL LEDGER */}
          {activeTab === 'LEDGER' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700">Select Account:</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    loadLedger(e.target.value);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name} ({a.account_type})
                    </option>
                  ))}
                </select>

                {ledgerData && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Closing Balance:</span>
                    <span className="text-sm font-extrabold text-blue-700">
                      {formatINR(ledgerData.closing_balance)}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Entry #</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Narration</th>
                      <th className="py-3 px-4 text-right">Debit</th>
                      <th className="py-3 px-4 text-right">Credit</th>
                      <th className="py-3 px-4 text-right font-bold">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerData?.transactions?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No posted transactions for this account yet.
                        </td>
                      </tr>
                    ) : (
                      ledgerData?.transactions?.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 text-slate-600">{formatDate(t.posting_date)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">
                            {t.entry_number}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100">
                              {t.source_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                            {t.narration || '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">
                            {t.debit > 0 ? formatINR(t.debit) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">
                            {t.credit > 0 ? formatINR(t.credit) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-blue-600">
                            {formatINR(t.running_balance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: JOURNAL REGISTER */}
          {activeTab === 'JOURNALS' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Journal #</th>
                    <th className="py-3.5 px-4">Source</th>
                    <th className="py-3.5 px-4">Narration</th>
                    <th className="py-3.5 px-4">Journal Lines (Debits / Credits)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {journals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No journals recorded yet.
                      </td>
                    </tr>
                  ) : (
                    journals.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 text-slate-600">{formatDate(j.posting_date)}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                          {j.entry_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100">
                            {j.source_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 max-w-xs">{j.narration || '-'}</td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {j.lines?.map((l: any) => (
                              <div
                                key={l.id}
                                className="flex items-center justify-between text-[11px] gap-3"
                              >
                                <span className="text-slate-600 truncate max-w-[160px]">
                                  {l.account?.code} {l.account?.name}
                                </span>
                                <span className="font-mono font-bold">
                                  {Number(l.debit) > 0 ? `Dr ${formatINR(l.debit)}` : `Cr ${formatINR(l.credit)}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              j.status === 'POSTED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {j.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {j.status === 'POSTED' && (
                            <button
                              onClick={() => handleReverseJournal(j.id)}
                              title="Reverse Journal"
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold flex items-center gap-1 mx-auto"
                            >
                              <RotateCcw className="h-3 w-3" /> Reverse
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: CHART OF ACCOUNTS */}
          {activeTab === 'COA' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Account Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">System Tag</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{a.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{a.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            a.account_type === 'ASSET'
                              ? 'bg-blue-50 text-blue-700'
                              : a.account_type === 'LIABILITY'
                              ? 'bg-purple-50 text-purple-700'
                              : a.account_type === 'EQUITY'
                              ? 'bg-amber-50 text-amber-700'
                              : a.account_type === 'INCOME'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {a.account_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {a.is_system_account ? 'Core Control Account' : 'Custom'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-emerald-600 font-bold text-[10px]">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
