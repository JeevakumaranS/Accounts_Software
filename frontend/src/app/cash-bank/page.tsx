'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR, formatDate } from '../../lib/format';
import api from '../../lib/api';
import { Landmark, ArrowLeftRight, Building, CreditCard, PlusCircle, X } from 'lucide-react';

export default function CashBankPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Transfer form
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('20000');
  const [description, setDescription] = useState('Transfer for office liquidity');

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cash-bank/accounts');
      const data = res.data?.data || [];
      setAccounts(data);
      if (data.length > 0) {
        setFromAccountId(data[0].id);
        if (data.length > 1) setToAccountId(data[1].id);
        loadTransactions(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (accId: string) => {
    try {
      const res = await api.get(`/cash-bank/accounts/${accId}/transactions`);
      setSelectedAccount(res.data?.data?.account || null);
      setTransactions(res.data?.data?.transactions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) {
      alert('Cannot transfer to the same account');
      return;
    }
    try {
      await api.post('/cash-bank/transfer', {
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: Number(amount),
        date: new Date(),
        description,
      });
      alert('Internal funds transfer posted to accounting ledger!');
      setShowTransferModal(false);
      loadAccounts();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Transfer failed');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="TREASURY & LIQUIDITY"
          title="Cash & Bank Accounts Management"
          subtitle="Manage liquid assets, bank-to-bank transfers, cash deposits and withdrawals"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#17223a]">Accounts & Liquid Funds</h2>
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173e48] text-white text-xs font-semibold hover:bg-[#214e58] transition-colors shadow-xs"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>Internal Funds Transfer</span>
            </button>
          </div>

          {/* Account Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((acc) => {
              const isSelected = selectedAccount?.id === acc.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => loadTransactions(acc.id)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#173e48] shadow-md ring-2 ring-[#173e48]/15'
                      : 'bg-white border-[#e8edf3] hover:border-[#173e48]/40 shadow-[0_1px_2px_rgba(220,225,232,0.35)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[#758195] mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#f6f8fb] text-[#17223a] border border-[#e8edf3]">
                      {acc.account_type}
                    </span>
                    <span className="p-2 rounded-lg bg-[#edf6f4] text-[#173e48]">
                      {acc.account_type === 'CASH' ? (
                        <Building className="h-5 w-5" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#17223a]">{acc.account_name}</h3>
                  {acc.bank_name && (
                    <div className="text-xs text-[#758195] mt-0.5">
                      {acc.bank_name} • A/C: {acc.account_number} • IFSC: {acc.ifsc_code}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-[#e8edf3] flex items-center justify-between">
                    <span className="text-xs text-[#758195] font-medium">Current Balance:</span>
                    <span className="text-lg font-bold text-[#17223a]">
                      {formatINR(acc.current_balance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Account Transaction Statement */}
          {selectedAccount && (
            <div className="bg-white rounded-xl border border-[#e8edf3] overflow-hidden shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
              <div className="p-4 border-b border-[#e8edf3] flex items-center justify-between bg-[#f6f8fb]/50">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#17223a]">
                    Transaction Statement — {selectedAccount.account_name}
                  </h3>
                  <p className="text-[11px] text-[#758195]">
                    Running balance verified against general ledger control account
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f6f8fb] text-[#8993a5] uppercase tracking-wider text-[11px] font-semibold border-b border-[#e8edf3]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right font-bold">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8edf3]">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#758195]">
                          Opening balance: {formatINR(selectedAccount.opening_balance)}. No recent transfers.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#edf6f4]/40 transition-colors">
                          <td className="py-3 px-4 text-[#758195]">{formatDate(tx.transaction_date)}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#17223a]">
                            {tx.transaction_type}
                          </td>
                          <td className="py-3 px-4 text-[#17223a]">{tx.description || '-'}</td>
                          <td className="py-3 px-4 text-right font-bold text-[#17223a]">
                            {formatINR(tx.amount)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#173e48]">
                            {formatINR(tx.running_balance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 bg-[#0a2025]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#e8edf3]">
              <div className="flex items-center justify-between pb-3 border-b border-[#e8edf3]">
                <h3 className="font-bold text-sm text-[#17223a] flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-[#173e48]" />
                  Internal Funds Transfer
                </h3>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="text-[#758195] hover:text-[#17223a] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3 rounded-lg bg-[#edf6f4] border border-[#1b9e76]/20 text-[11px] text-[#173e48] font-medium">
                Note: An internal company transfer is strictly neither income nor expense. It creates a balanced journal between liquid asset accounts.
              </div>

              <form onSubmit={handleTransfer} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Transfer From *</label>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden text-[#17223a]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.account_name} ({formatINR(a.current_balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Transfer To *</label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden text-[#17223a]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.account_name} ({formatINR(a.current_balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden font-bold text-[#173e48]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Narration / Purpose</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden text-[#17223a]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-3.5 py-2 rounded-lg bg-[#f6f8fb] border border-[#e8edf3] text-[#758195] font-semibold hover:bg-[#edf6f4]/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#173e48] hover:bg-[#214e58] text-white font-bold transition-colors shadow-xs"
                  >
                    Post Transfer
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
