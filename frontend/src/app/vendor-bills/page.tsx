'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR, formatDate } from '../../lib/format';
import api from '../../lib/api';
import { PlusCircle, Search, ShoppingCart, X, FileText } from 'lucide-react';

export default function VendorBillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [vendorId, setVendorId] = useState('');
  const [vendorBillNumber, setVendorBillNumber] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('AWS Cloud Servers Monthly Hosting');
  const [unitPrice, setUnitPrice] = useState('10000');
  const [taxRate, setTaxRate] = useState('18');

  const loadData = async () => {
    setLoading(true);
    try {
      const [billRes, vendRes, accRes] = await Promise.all([
        api.get('/vendor-bills'),
        api.get('/vendors'),
        api.get('/accounts'),
      ]);
      setBills(billRes.data.data || []);
      const vends = vendRes.data.data || [];
      setVendors(vends);
      if (vends.length > 0) setVendorId(vends[0].id);

      // Filter expense & asset accounts for purchase classification
      const expAccs = (accRes.data.data || []).filter(
        (a: any) => a.account_type === 'EXPENSE' || a.account_type === 'ASSET',
      );
      setAccounts(expAccs);
      if (expAccs.length > 0) setAccountId(expAccs[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vendor-bills', {
        vendor_id: vendorId,
        vendor_bill_number: vendorBillNumber,
        bill_date: new Date(),
        items: [
          {
            account_id: accountId,
            description,
            quantity: 1,
            unit_price: Number(unitPrice),
            tax_rate: Number(taxRate),
          },
        ],
      });

      alert('Vendor purchase bill posted and added to Accounts Payable!');
      setShowModal(false);
      setVendorBillNumber('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record bill');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="ACCOUNTS PAYABLE & ITC"
          title="Purchases & Vendor Bills"
          subtitle="Record vendor invoices, classify input tax credits (ITC) & manage payables"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#17223a]">Purchase Bills Register</h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#173e48] hover:bg-[#214e58] text-white text-xs font-bold transition-all shadow-xs"
            >
              <PlusCircle className="h-4 w-4 text-[#d5ad78]" />
              <span>Record Purchase Bill</span>
            </button>
          </div>

          {/* Bills Table */}
          <div className="bg-white rounded-lg border border-[#e8edf3] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fb] text-[#8993a5] text-[11px] font-bold uppercase tracking-wider border-b border-[#e8edf3]">
                  <tr>
                    <th className="py-3.5 px-4">Internal Bill #</th>
                    <th className="py-3.5 px-4">Vendor Bill #</th>
                    <th className="py-3.5 px-4">Vendor</th>
                    <th className="py-3.5 px-4">Bill Date</th>
                    <th className="py-3.5 px-4 text-right">Taxable</th>
                    <th className="py-3.5 px-4 text-right">Input GST</th>
                    <th className="py-3.5 px-4 text-right">Bill Total</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No purchase bills recorded yet. Click "Record Purchase Bill" to add one.
                      </td>
                    </tr>
                  ) : (
                    bills.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-600">
                          {b.bill_number}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {b.vendor_bill_number || '-'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {b.vendor?.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDate(b.bill_date)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                          {formatINR(b.taxable_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600">
                          {formatINR(Number(b.cgst_amount || 0) + Number(b.sgst_amount || 0) + Number(b.igst_amount || 0))}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {formatINR(b.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-purple-600">
                          {formatINR(b.balance_due)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {b.status}
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

        {/* Record Vendor Bill Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                  Record Vendor Purchase Bill
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRecordBill} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supplier / Vendor *</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.state || 'Maharashtra'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Supplier Invoice / Bill #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. INV-98765"
                      value={vendorBillNumber}
                      onChange={(e) => setVendorBillNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Expense / Asset Account *
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Item Description *</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Taxable Value (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GST Tax Rate *</label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    >
                      <option value="18">18% (Eligible ITC)</option>
                      <option value="12">12%</option>
                      <option value="5">5%</option>
                      <option value="28">28%</option>
                      <option value="0">0% (Nil)</option>
                    </select>
                  </div>
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
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Post Vendor Bill
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
