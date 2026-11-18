'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { formatINR } from '../../../lib/format';
import api from '../../../lib/api';
import { Plus, Trash2, ArrowLeft, Save, Send } from 'lucide-react';

interface LineItem {
  description: string;
  hsn_sac: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('2026-11-17');
  const [dueDate, setDueDate] = useState('2026-12-02');
  const [isReverseCharge, setIsReverseCharge] = useState(false);
  const [notes, setNotes] = useState('Thank you for your business. Payment is due within 15 days.');
  const [terms, setTerms] = useState('Standard payment terms apply. Interest @ 18% p.a. on delayed payment.');

  const [items, setItems] = useState<LineItem[]>([
    {
      description: 'Cloud Infrastructure & Development Services',
      hsn_sac: '998314',
      quantity: 1,
      unit: 'MONTH',
      unit_price: 50000,
      tax_rate: 18,
      discount_percent: 0,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/customers').then((res) => {
      const custs = res.data.data || [];
      setCustomers(custs);
      if (custs.length > 0) setSelectedCustomerId(custs[0].id);
    });
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const isInterState = selectedCustomer?.state_code && selectedCustomer.state_code !== '33';

  const addItem = () => {
    setItems([
      ...items,
      {
        description: '',
        hsn_sac: '998314',
        quantity: 1,
        unit: 'NOS',
        unit_price: 0,
        tax_rate: 18,
        discount_percent: 0,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof LineItem, val: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = val;
    setItems(updated);
  };

  // Calculations
  let subtotal = 0;
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  items.forEach((itm) => {
    const qty = Number(itm.quantity) || 0;
    const rate = Number(itm.unit_price) || 0;
    const lineSubtotal = qty * rate;
    const discount = (lineSubtotal * (Number(itm.discount_percent) || 0)) / 100;
    const taxable = lineSubtotal - discount;
    const taxRate = Number(itm.tax_rate) || 0;

    subtotal += lineSubtotal;
    totalTaxable += taxable;

    if (isInterState) {
      totalIgst += (taxable * taxRate) / 100;
    } else {
      totalCgst += (taxable * (taxRate / 2)) / 100;
      totalSgst += (taxable * (taxRate / 2)) / 100;
    }
  });

  const totalAmount = totalTaxable + totalCgst + totalSgst + totalIgst;

  const handleSubmit = async (postImmediately: boolean) => {
    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create draft invoice
      const res = await api.post('/invoices', {
        customer_id: selectedCustomerId,
        invoice_date: invoiceDate,
        due_date: dueDate,
        is_reverse_charge: isReverseCharge,
        notes,
        terms,
        items,
      });

      const invoiceId = res.data.data.id;

      // 2. If post immediately, post to accounting engine
      if (postImmediately) {
        await api.post(`/invoices/${invoiceId}/post`);
        alert('Invoice created & posted to double-entry ledger successfully!');
      } else {
        alert('Draft invoice saved successfully!');
      }

      router.push('/invoices');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="INVOICE GENERATION"
          title="Create Sales Invoice"
          subtitle="Indian GST invoice generation with automatic tax computation"
        />

        <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-xs font-semibold text-[#758195] hover:text-[#17223a]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Invoices
            </button>
            <div className="flex items-center gap-3">
              <button
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="px-4 py-2 rounded-lg bg-white border border-[#e8edf3] text-[#17223a] text-xs font-semibold hover:bg-[#f6f8fb] flex items-center gap-1.5 shadow-xs"
              >
                <Save className="h-4 w-4 text-[#758195]" />
                <span>Save as Draft</span>
              </button>
              <button
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="px-5 py-2 rounded-lg bg-[#2769d7] hover:bg-[#2059bd] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Send className="h-4 w-4" />
                <span>Post Invoice</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#e8edf3] p-6 shadow-xs space-y-6">
            {/* Top Customer & Date Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#17223a] mb-1.5">
                  Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-medium text-[#17223a] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.state || 'Tamil Nadu'})
                    </option>
                  ))}
                </select>
                {selectedCustomer && (
                  <div className="text-[11px] text-[#758195] mt-1">
                    GSTIN: {selectedCustomer.gstin || 'B2C (Unregistered)'} • State Code: {selectedCustomer.state_code || '33'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17223a] mb-1.5">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-medium text-[#17223a] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17223a] mb-1.5">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-medium text-[#17223a] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                />
              </div>
            </div>

            {/* GST Treatment Banner */}
            <div className="p-3 bg-[#edf6f4] border border-[#dfe5e4] rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#173e48] font-medium">
                <span className="font-bold">GST Supply Type:</span>
                {isInterState ? (
                  <span className="text-[#c18a2a] font-bold bg-[#fff4df] px-2 py-0.5 rounded border border-[#f3e5c9]">
                    Inter-State Supply (IGST Applicable)
                  </span>
                ) : (
                  <span className="text-[#1b9e76] font-bold bg-[#e3f7f0] px-2 py-0.5 rounded border border-[#c4ebdb]">
                    Intra-State Supply (CGST + SGST Split Applicable)
                  </span>
                )}
              </div>
              <div className="text-[#758195] text-[11px]">
                Company Origin: Tamil Nadu (33)
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8993a5]">
                  Invoice Line Items
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs font-bold text-[#2769d7] hover:text-[#173e48]"
                >
                  <Plus className="h-4 w-4" /> Add Line
                </button>
              </div>

              <div className="border border-[#e8edf3] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f6f8fb] text-[#8993a5] text-[11px] font-bold uppercase tracking-wider border-b border-[#e8edf3]">
                    <tr>
                      <th className="p-3 w-5/12">Item / Description</th>
                      <th className="p-3 w-24">HSN/SAC</th>
                      <th className="p-3 w-16 text-center">Qty</th>
                      <th className="p-3 w-28 text-right">Unit Price</th>
                      <th className="p-3 w-24 text-center">Tax %</th>
                      <th className="p-3 w-28 text-right">Amount</th>
                      <th className="p-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8edf3]">
                    {items.map((itm, idx) => {
                      const qty = Number(itm.quantity) || 0;
                      const rate = Number(itm.unit_price) || 0;
                      const amt = qty * rate;
                      return (
                        <tr key={idx} className="hover:bg-[#edf6f4]/40 transition-colors">
                          <td className="p-2">
                            <input
                              type="text"
                              value={itm.description}
                              placeholder="Description..."
                              onChange={(e) => updateItem(idx, 'description', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8edf3] text-xs font-medium text-[#17223a] focus:ring-1 focus:ring-[#367b80]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={itm.hsn_sac}
                              placeholder="HSN"
                              onChange={(e) => updateItem(idx, 'hsn_sac', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-[#e8edf3] text-xs font-mono text-[#17223a]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={itm.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg border border-[#e8edf3] text-xs text-center text-[#17223a]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={itm.unit_price}
                              onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg border border-[#e8edf3] text-xs text-right font-medium text-[#17223a]"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={itm.tax_rate}
                              onChange={(e) => updateItem(idx, 'tax_rate', Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg border border-[#e8edf3] text-xs font-semibold text-[#17223a]"
                            >
                              <option value="18">18%</option>
                              <option value="12">12%</option>
                              <option value="5">5%</option>
                              <option value="28">28%</option>
                              <option value="0">0%</option>
                            </select>
                          </td>
                          <td className="p-2 text-right font-bold text-[#17223a]">
                            {formatINR(amt)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="p-1 text-[#8993a5] hover:text-[#d75a67]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-[#e8edf3]">
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#17223a] mb-1">
                    Customer Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#e8edf3] text-xs focus:ring-2 focus:ring-[#2769d7]"
                  />
                </div>
              </div>

              <div className="w-full sm:w-80 bg-[#173e48] p-5 rounded-lg border border-[#42636b] text-white space-y-2.5 text-xs shadow-sm">
                <div className="flex justify-between text-[#c8d8d8]">
                  <span>Taxable Subtotal:</span>
                  <span className="font-semibold text-white">{formatINR(totalTaxable)}</span>
                </div>

                {isInterState ? (
                  <div className="flex justify-between text-[#c8d8d8]">
                    <span>IGST:</span>
                    <span className="font-semibold text-white">{formatINR(totalIgst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[#c8d8d8]">
                      <span>Output CGST:</span>
                      <span className="font-semibold text-white">{formatINR(totalCgst)}</span>
                    </div>
                    <div className="flex justify-between text-[#c8d8d8]">
                      <span>Output SGST:</span>
                      <span className="font-semibold text-white">{formatINR(totalSgst)}</span>
                    </div>
                  </>
                )}

                <div className="pt-3 border-t border-[#42636b] flex justify-between font-extrabold text-base text-white">
                  <span>Invoice Total:</span>
                  <span className="text-[#d5ad78]">{formatINR(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
