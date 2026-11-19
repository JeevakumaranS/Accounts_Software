'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR } from '../../lib/format';
import api from '../../lib/api';

export default function GSTPage() {
  const [activeTab, setActiveTab] = useState<'GSTR3B' | 'GSTR1' | 'RATES'>('GSTR3B');
  const [gstr3b, setGstr3b] = useState<any>(null);
  const [gstr1, setGstr1] = useState<any>(null);
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/reports/gstr3b'),
      api.get('/reports/gstr1'),
      api.get('/gst/rates'),
    ])
      .then(([r3b, r1, rRates]) => {
        setGstr3b(r3b.data?.data || null);
        setGstr1(r1.data?.data || null);
        setRates(rRates.data?.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="STATUTORY COMPLIANCE"
          title="Indian GST & Tax Management"
          subtitle="Generate GSTR-3B monthly liabilities, GSTR-1 outward supplies & track input tax credits"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-[#e8edf3] pb-2">
            {[
              { id: 'GSTR3B', label: 'GSTR-3B Summary (Net Tax & ITC)' },
              { id: 'GSTR1', label: 'GSTR-1 Outward Supplies (Sales)' },
              { id: 'RATES', label: 'GST Tax Rates Master' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#173e48] text-white shadow-xs'
                    : 'text-[#758195] hover:text-[#17223a] hover:bg-[#edf6f4]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: GSTR-3B */}
          {activeTab === 'GSTR3B' && gstr3b && (
            <div className="space-y-6">
              {/* Net Position Banner */}
              <div className="bg-[#173e48] text-white p-6 rounded-xl border border-[#42636b] shadow-sm">
                <div className="text-[11px] uppercase tracking-wider font-bold text-[#bfd1d1]">
                  Current Net GST Position
                </div>
                <div className="text-3xl font-bold mt-1 text-white">
                  {formatINR(gstr3b.net_tax_position?.total_net_payable)}
                </div>
                <div className="text-xs text-[#a9bec0] mt-2 flex items-center gap-2">
                  <span>Output Tax Liability less Eligible Input Tax Credit (ITC)</span>
                </div>
              </div>

              {/* 2 Grid Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Outward Taxable Supplies */}
                <div className="bg-white p-5 rounded-xl border border-[#e8edf3] shadow-[0_1px_2px_rgba(220,225,232,0.35)] space-y-4">
                  <h3 className="font-bold text-sm text-[#17223a] pb-2 border-b border-[#e8edf3]">
                    3.1 Outward Taxable Supplies (Sales)
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#758195]">
                      <span>Total Taxable Value:</span>
                      <span className="font-bold text-[#17223a]">
                        {formatINR(gstr3b.output_tax?.taxable_value)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#758195]">
                      <span>CGST:</span>
                      <span className="font-semibold text-[#17223a]">
                        {formatINR(gstr3b.output_tax?.cgst)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#758195]">
                      <span>SGST:</span>
                      <span className="font-semibold text-[#17223a]">
                        {formatINR(gstr3b.output_tax?.sgst)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#758195]">
                      <span>IGST:</span>
                      <span className="font-semibold text-[#17223a]">
                        {formatINR(gstr3b.output_tax?.igst)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#e8edf3] flex justify-between font-bold text-[#173e48]">
                      <span>Total Output GST:</span>
                      <span>{formatINR(gstr3b.output_tax?.total_output_tax)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Eligible Input Tax Credit */}
                <div className="bg-white p-5 rounded-xl border border-[#e8edf3] shadow-[0_1px_2px_rgba(220,225,232,0.35)] space-y-4">
                  <h3 className="font-bold text-sm text-[#17223a] pb-2 border-b border-[#e8edf3]">
                    4. Eligible Input Tax Credit (ITC) from Purchases
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#758195]">
                      <span>Purchase Taxable Value:</span>
                      <span className="font-bold text-[#17223a]">
                        {formatINR(gstr3b.eligible_itc?.taxable_value)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#758195]">
                      <span>Input CGST Credit:</span>
                      <span className="font-semibold text-[#17223a]">
                        {formatINR(gstr3b.eligible_itc?.cgst)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#758195]">
                      <span>Input SGST Credit:</span>
                      <span className="font-semibold text-[#17223a]">
                        {formatINR(gstr3b.eligible_itc?.sgst)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#758195]">
                      <span>Input IGST Credit:</span>
                      <span className="font-semibold text-[#17223a]">
                        {formatINR(gstr3b.eligible_itc?.igst)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#e8edf3] flex justify-between font-bold text-[#1b9e76]">
                      <span>Total Eligible ITC:</span>
                      <span>{formatINR(gstr3b.eligible_itc?.total_itc)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#f3e5c9] shadow-[0_1px_2px_rgba(220,225,232,0.35)] space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-[#694b14]">
                    Reverse Charge GST Payable by Recipients
                  </h3>
                  <p className="text-[11px] text-[#758195] mt-1">
                    Tracked separately from your output tax; this GST is payable by recipients and is not collected by your company.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div><span className="block text-[#8993a5]">Invoices</span><strong>{gstr3b.recipient_reverse_charge_liability?.invoice_count || 0}</strong></div>
                  <div><span className="block text-[#8993a5]">CGST</span><strong>{formatINR(gstr3b.recipient_reverse_charge_liability?.cgst)}</strong></div>
                  <div><span className="block text-[#8993a5]">SGST</span><strong>{formatINR(gstr3b.recipient_reverse_charge_liability?.sgst)}</strong></div>
                  <div><span className="block text-[#8993a5]">IGST</span><strong>{formatINR(gstr3b.recipient_reverse_charge_liability?.igst)}</strong></div>
                  <div><span className="block text-[#8993a5]">Cess</span><strong>{formatINR(gstr3b.recipient_reverse_charge_liability?.cess)}</strong></div>
                  <div><span className="block text-[#8993a5]">Total Recipient Liability</span><strong className="text-[#694b14]">{formatINR(gstr3b.recipient_reverse_charge_liability?.total_tax)}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GSTR-1 */}
          {activeTab === 'GSTR1' && gstr1 && (
            <div className="bg-white rounded-xl border border-[#e8edf3] overflow-hidden shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
              <div className="p-4 border-b border-[#e8edf3] font-bold text-sm text-[#17223a]">
                GSTR-1 Outward Supplies Register (B2B & B2C)
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fb] text-[#8993a5] uppercase tracking-wider text-[11px] font-semibold border-b border-[#e8edf3]">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">GSTIN</th>
                    <th className="p-3">Place of Supply</th>
                    <th className="p-3">Tax Treatment</th>
                    <th className="p-3 text-right">Taxable (₹)</th>
                    <th className="p-3 text-right">CGST</th>
                    <th className="p-3 text-right">SGST</th>
                    <th className="p-3 text-right">IGST</th>
                    <th className="p-3 text-right font-bold">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf3]">
                  {[...(gstr1.b2b_invoices || []), ...(gstr1.b2c_invoices || [])].map((inv: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#edf6f4]/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#173e48]">{inv.invoice_number}</td>
                      <td className="p-3 text-[#758195]">{inv.invoice_date}</td>
                      <td className="p-3 font-semibold text-[#17223a]">{inv.customer_name}</td>
                      <td className="p-3 font-mono text-[#758195]">{inv.customer_gstin}</td>
                      <td className="p-3 text-[#758195]">{inv.place_of_supply}</td>
                      <td className="p-3">
                        {inv.is_reverse_charge ? (
                          <span className="px-2 py-1 rounded bg-[#fff4df] text-[#694b14] font-bold text-[10px]">
                            RCM - Recipient pays
                          </span>
                        ) : (
                          <span className="text-[#758195]">Supplier collects</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium text-[#17223a]">{formatINR(inv.taxable_value)}</td>
                      <td className="p-3 text-right text-[#758195]">{formatINR(inv.cgst)}</td>
                      <td className="p-3 text-right text-[#758195]">{formatINR(inv.sgst)}</td>
                      <td className="p-3 text-right text-[#758195]">{formatINR(inv.igst)}</td>
                      <td className="p-3 text-right font-bold text-[#17223a]">{formatINR(inv.total_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: TAX RATES */}
          {activeTab === 'RATES' && (
            <div className="bg-white rounded-xl border border-[#e8edf3] overflow-hidden shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fb] text-[#8993a5] uppercase tracking-wider text-[11px] font-semibold border-b border-[#e8edf3]">
                  <tr>
                    <th className="p-3.5">Tax Name</th>
                    <th className="p-3.5">Rate (%)</th>
                    <th className="p-3.5">Tax Type</th>
                    <th className="p-3.5">Effective From</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf3]">
                  {rates.map((r) => (
                    <tr key={r.id} className="hover:bg-[#edf6f4]/40 transition-colors">
                      <td className="p-3.5 font-bold text-[#17223a]">{r.tax_name}</td>
                      <td className="p-3.5 font-bold text-[#173e48]">{r.rate}%</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f6f8fb] text-[#758195] border border-[#e8edf3]">
                          {r.tax_type}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#758195]">{r.effective_from}</td>
                      <td className="p-3.5 text-center">
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
