'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR, formatDate } from '../../lib/format';
import api from '../../lib/api';
import {
  Scale,
  BookOpen,
  FileCheck2,
  ListTree,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<
    'TRIAL_BALANCE' | 'LEDGER' | 'JOURNALS' | 'COA'
  >('TRIAL_BALANCE');

  const [trialBalance, setTrialBalance] = useState<any>({ accounts: [], is_balanced: true, total_debit: 0, total_credit: 0 });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrialBalance = async () => {
    try {
      const res = await api.get('/accounting/trial-balance');
      setTrialBalance(res.data?.data || {});
    } catch (err) {
      console.error(err);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      const data = res.data?.data || [];
      setAccounts(data);
      if (data.length > 0) {
        setSelectedAccountId(data[0].id);
        loadLedger(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadLedger = async (accId: string) => {
    try {
      const res = await api.get(`/accounting/ledger/${accId}`);
      setLedgerData(res.data?.data || null);
    } catch (err) {
      console.error(err);
    }
  };

  const loadJournals = async () => {
    try {
      const res = await api.get('/accounting/journals');
      setJournals(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTrialBalance(), loadAccounts(), loadJournals()]).finally(() =>
      setLoading(false),
    );
  }, []);

  const handleReverseJournal = async (id: string) => {
    const reason = prompt('Reason for reversing this journal:');
    if (!reason) return;
    try {
      await api.post(`/accounting/journals/${id}/reverse`, { reason });
      alert('Journal entry reversed and adjusting entries posted!');
      loadJournals();
      loadTrialBalance();
      if (selectedAccountId) loadLedger(selectedAccountId);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to reverse journal');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="DOUBLE-ENTRY BOOKKEEPING"
          title="Accounting Engine & General Ledger"
          subtitle="Single source of truth double-entry bookkeeping engine & Chart of Accounts"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-[#e8edf3] pb-2">
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#173e48] text-white shadow-xs'
                      : 'text-[#758195] hover:text-[#17223a] hover:bg-[#edf6f4]'
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
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#e8edf3] shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
                <div>
                  <h3 className="text-sm font-bold text-[#17223a]">Trial Balance Reconciliation</h3>
                  <p className="text-xs text-[#758195]">
                    Debit balances must equal Credit balances as of today
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {trialBalance.is_balanced ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#edf6f4] border border-[#1b9e76]/25 text-[#1b9e76] text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4 text-[#1b9e76]" />
                      <span>Ledgers Balanced</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#feecef] border border-[#d75a67]/25 text-[#d75a67] text-xs font-bold">
                      <AlertCircle className="h-4 w-4 text-[#d75a67]" />
                      <span>Unbalanced Trial Balance</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#e8edf3] overflow-hidden shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f6f8fb] text-[#8993a5] uppercase tracking-wider text-[11px] font-semibold border-b border-[#e8edf3]">
                    <tr>
                      <th className="py-3 px-4 w-24">Code</th>
                      <th className="py-3 px-4">Account Name</th>
                      <th className="py-3 px-4 w-28">Type</th>
                      <th className="py-3 px-4 text-right w-36">Debit Balance (₹)</th>
                      <th className="py-3 px-4 text-right w-36">Credit Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8edf3]">
                    {trialBalance.accounts?.map((acc: any) => (
                      <tr key={acc.code} className="hover:bg-[#edf6f4]/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#173e48]">{acc.code}</td>
                        <td className="py-3 px-4 font-semibold text-[#17223a]">{acc.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f6f8fb] text-[#758195] border border-[#e8edf3]">
                            {acc.account_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#17223a]">
                          {acc.debit > 0 ? formatINR(acc.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#17223a]">
                          {acc.credit > 0 ? formatINR(acc.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#edf6f4] font-bold text-xs border-t border-[#e8edf3]">
                    <tr>
                      <td colSpan={3} className="py-3.5 px-4 text-[#17223a] uppercase font-bold text-[11px]">
                        Total General Ledger Balance:
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#173e48] font-bold text-sm">
                        {formatINR(trialBalance.total_debit)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#173e48] font-bold text-sm">
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
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-[#e8edf3] shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
                <label className="text-xs font-bold text-[#17223a]">Select Account:</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    loadLedger(e.target.value);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#e8edf3] text-xs font-semibold text-[#17223a] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name} ({a.account_type})
                    </option>
                  ))}
                </select>

                {ledgerData && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-[#758195] font-medium">Closing Balance:</span>
                    <span className="text-sm font-bold text-[#173e48]">
                      {formatINR(ledgerData.closing_balance)}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-[#e8edf3] overflow-hidden shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f6f8fb] text-[#8993a5] uppercase tracking-wider text-[11px] font-semibold border-b border-[#e8edf3]">
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
                  <tbody className="divide-y divide-[#e8edf3]">
                    {ledgerData?.transactions?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#758195]">
                          No posted transactions for this account yet.
                        </td>
                      </tr>
                    ) : (
                      ledgerData?.transactions?.map((t: any) => (
                        <tr key={t.id} className="hover:bg-[#edf6f4]/40 transition-colors">
                          <td className="py-3 px-4 text-[#758195]">{formatDate(t.posting_date)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#173e48]">
                            {t.entry_number}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f6f8fb] text-[#758195] border border-[#e8edf3]">
                              {t.source_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#17223a] max-w-xs truncate">
                            {t.narration || '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[#17223a]">
                            {t.debit > 0 ? formatINR(t.debit) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[#17223a]">
                            {t.credit > 0 ? formatINR(t.credit) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#173e48]">
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
            <div className="bg-white rounded-xl border border-[#e8edf3] overflow-hidden shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fb] text-[#8993a5] uppercase tracking-wider text-[11px] font-semibold border-b border-[#e8edf3]">
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
                <tbody className="divide-y divide-[#e8edf3]">
                  {journals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[#758195]">
                        No journals recorded yet.
                      </td>
                    </tr>
                  ) : (
                    journals.map((j) => (
                      <tr key={j.id} className="hover:bg-[#edf6f4]/40 transition-colors">
                        <td className="py-3.5 px-4 text-[#758195]">{formatDate(j.posting_date)}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#173e48]">
                          {j.entry_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f6f8fb] text-[#758195] border border-[#e8edf3]">
                            {j.source_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#17223a] max-w-xs">{j.narration || '-'}</td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {j.lines?.map((l: any) => (
                              <div
                                key={l.id}
                                className="flex items-center justify-between text-[11px] gap-3"
                              >
                                <span className="text-[#758195] truncate max-w-[160px]">
                                  {l.account?.code} {l.account?.name}
                                </span>
                                <span className="font-mono font-bold text-[#17223a]">
                                  {Number(l.debit) > 0 ? `Dr ${formatINR(l.debit)}` : `Cr ${formatINR(l.credit)}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              j.status === 'POSTED'
                                ? 'bg-[#edf6f4] text-[#1b9e76] border border-[#1b9e76]/20'
                                : 'bg-[#feecef] text-[#d75a67] border border-[#d75a67]/20'
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
                              className="px-2 py-1 bg-[#feecef] hover:bg-[#fed7db] text-[#d75a67] border border-[#d75a67]/20 rounded text-[10px] font-bold flex items-center gap-1 mx-auto transition-colors"
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
            <div className="bg-white rounded-xl border border-[#e8edf3] overflow-hidden shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fb] text-[#8993a5] uppercase tracking-wider text-[11px] font-semibold border-b border-[#e8edf3]">
                  <tr>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Account Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">System Tag</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf3]">
                  {accounts.map((a) => (
                    <tr key={a.id} className="hover:bg-[#edf6f4]/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#173e48]">{a.code}</td>
                      <td className="py-3 px-4 font-semibold text-[#17223a]">{a.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            a.account_type === 'ASSET'
                              ? 'bg-[#e9f1ff] text-[#2769d7] border border-[#2769d7]/20'
                              : a.account_type === 'LIABILITY'
                              ? 'bg-[#feecef] text-[#d75a67] border border-[#d75a67]/20'
                              : a.account_type === 'EQUITY'
                              ? 'bg-[#fff4df] text-[#c18a2a] border border-[#d49422]/20'
                              : a.account_type === 'INCOME'
                              ? 'bg-[#edf6f4] text-[#1b9e76] border border-[#1b9e76]/20'
                              : 'bg-[#f6f8fb] text-[#758195] border border-[#e8edf3]'
                          }`}
                        >
                          {a.account_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#758195] font-medium">
                        {a.is_system_account ? 'Core Control Account' : 'Custom'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[#1b9e76] font-bold text-[10px] bg-[#edf6f4] px-2 py-0.5 rounded-full border border-[#1b9e76]/20">Active</span>
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
