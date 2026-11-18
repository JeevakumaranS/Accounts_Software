'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR } from '../../lib/format';
import api from '../../lib/api';
import { Calculator, FileSpreadsheet, CheckCircle2, ArrowRight } from 'lucide-react';

export default function GstPage() {
  const [activeTab, setActiveTab] = useState<'GSTR1' | 'GSTR3B' | 'RATES'>('GSTR3B');
  const [gstr1, setGstr1] = useState<any>(null);
  const [gstr3b, setGstr3b] = useState<any>(null);
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [g1, g3, rts] = await Promise.all([
        api.get('/reports/gstr1'),
        api.get('/reports/gstr3b'),
        api.get('/gst/rates'),
      ]);
      setGstr1(g1.data.data);
      setGstr3b(g3.data.data);
      setRates(rts.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="STATUTORY GST COMPLIANCE"
          title="GST Management & Statutory Reports"
          subtitle="Indian GST calculations, GSTR-1 sales register, and GSTR-3B ITC reconciliation"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'GSTR3B', label: 'GSTR-3B Summary (Net Tax & ITC)' },
              { id: 'GSTR1', label: 'GSTR-1 Outward Supplies (Sales)' },
              { id: 'RATES', label: 'GST Tax Rates Master' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: GSTR-3B */}
          {activeTab === 'GSTR3B' && gstr3b && (
            <div className="space-y-6">
              {/* Net Position Card */}
              <div className="bg-gradient-to-tr from-slate-900 to-blue-950 text-white p-6 rounded-2xl shadow-md">
                <div className="text-xs uppercase tracking-wider font-semibold text-blue-300">
                  Current Net GST Position
                </div>
                <div className="text-3xl font-extrabold mt-1">
                  {formatINR(gstr3b.net_tax_position?.total_net_payable)}
                </div>
                <div className="text-xs text-slate-300 mt-2 flex items-center gap-2">
                  <span>Output Tax Liability less Eligible Input Tax Credit (ITC)</span>
                </div>
              </div>

              {/* 3 Grid Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Outward Taxable Supplies */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
                    3.1 Outward Taxable Supplies (Sales)
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Taxable Value:</span>
                      <span className="font-bold text-slate-900">
                        {formatINR(gstr3b.output_tax?.taxable_value)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST:</span>
                      <span className="font-semibold text-slate-900">
                        {formatINR(gstr3b.output_tax?.cgst)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST:</span>
                      <span className="font-semibold text-slate-900">
                        {formatINR(gstr3b.output_tax?.sgst)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>IGST:</span>
                      <span className="font-semibold text-slate-900">
                        {formatINR(gstr3b.output_tax?.igst)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-blue-600">
                      <span>Total Output GST:</span>
                      <span>{formatINR(gstr3b.output_tax?.total_output_tax)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Eligible Input Tax Credit */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
                    4. Eligible Input Tax Credit (ITC) from Purchases
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Purchase Taxable Value:</span>
                      <span className="font-bold text-slate-900">
                        {formatINR(gstr3b.eligible_itc?.taxable_value)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Input CGST Credit:</span>
                      <span className="font-semibold text-slate-900">
                        {formatINR(gstr3b.eligible_itc?.cgst)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Input SGST Credit:</span>
                      <span className="font-semibold text-slate-900">
                        {formatINR(gstr3b.eligible_itc?.sgst)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Input IGST Credit:</span>
                      <span className="font-semibold text-slate-900">
                        {formatINR(gstr3b.eligible_itc?.igst)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-emerald-600">
                      <span>Total Eligible ITC:</span>
                      <span>{formatINR(gstr3b.eligible_itc?.total_itc)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GSTR-1 */}
          {activeTab === 'GSTR1' && gstr1 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-800">
                GSTR-1 Outward Supplies Register (B2B & B2C)
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">GSTIN</th>
                    <th className="p-3">Place of Supply</th>
                    <th className="p-3 text-right">Taxable (₹)</th>
                    <th className="p-3 text-right">CGST</th>
                    <th className="p-3 text-right">SGST</th>
                    <th className="p-3 text-right">IGST</th>
                    <th className="p-3 text-right font-bold">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...(gstr1.b2b_invoices || []), ...(gstr1.b2c_invoices || [])].map((inv: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-blue-600">{inv.invoice_number}</td>
                      <td className="p-3 text-slate-600">{inv.invoice_date}</td>
                      <td className="p-3 font-semibold text-slate-900">{inv.customer_name}</td>
                      <td className="p-3 font-mono text-slate-600">{inv.customer_gstin}</td>
                      <td className="p-3 text-slate-600">{inv.place_of_supply}</td>
                      <td className="p-3 text-right font-medium">{formatINR(inv.taxable_value)}</td>
                      <td className="p-3 text-right">{formatINR(inv.cgst)}</td>
                      <td className="p-3 text-right">{formatINR(inv.sgst)}</td>
                      <td className="p-3 text-right">{formatINR(inv.igst)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatINR(inv.total_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: TAX RATES */}
          {activeTab === 'RATES' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Tax Name</th>
                    <th className="p-3.5">Rate (%)</th>
                    <th className="p-3.5">Tax Type</th>
                    <th className="p-3.5">Effective From</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rates.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-bold text-slate-900">{r.tax_name}</td>
                      <td className="p-3.5 font-extrabold text-blue-600">{r.rate}%</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100">
                          {r.tax_type}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{r.effective_from}</td>
                      <td className="p-3.5 text-center">
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
