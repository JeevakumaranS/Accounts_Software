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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Create Sales Invoice"
          subtitle="Indian GST invoice generation with automatic tax computation"
        />

        <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Invoices
            </button>
            <div className="flex items-center gap-3">
              <button
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 shadow-xs"
              >
                <Save className="h-4 w-4 text-slate-500" />
                <span>Save as Draft</span>
              </button>
              <button
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Send className="h-4 w-4" />
                <span>Post Invoice</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            {/* Top Customer & Date Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.state || 'Tamil Nadu'})
                    </option>
                  ))}
                </select>
                {selectedCustomer && (
                  <div className="text-[11px] text-slate-500 mt-1">
                    GSTIN: {selectedCustomer.gstin || 'B2C (Unregistered)'} • State Code: {selectedCustomer.state_code || '33'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* GST Treatment Banner */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-900 font-medium">
                <span className="font-bold">GST Supply Type:</span>
                {isInterState ? (
                  <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                    Inter-State Supply (IGST Applicable)
                  </span>
                ) : (
                  <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    Intra-State Supply (CGST + SGST Split Applicable)
                  </span>
                )}
              </div>
              <div className="text-slate-500 text-[11px]">
                Company Origin: Tamil Nadu (33)
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Invoice Line Items
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-4 w-4" /> Add Line
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
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
                  <tbody className="divide-y divide-slate-100">
                    {items.map((itm, idx) => {
                      const qty = Number(itm.quantity) || 0;
                      const rate = Number(itm.unit_price) || 0;
                      const amt = qty * rate;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={itm.description}
                              placeholder="Description..."
                              onChange={(e) => updateItem(idx, 'description', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={itm.hsn_sac}
                              placeholder="HSN"
                              onChange={(e) => updateItem(idx, 'hsn_sac', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={itm.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={itm.unit_price}
                              onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-right font-medium"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={itm.tax_rate}
                              onChange={(e) => updateItem(idx, 'tax_rate', Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                            >
                              <option value="18">18%</option>
                              <option value="12">12%</option>
                              <option value="5">5%</option>
                              <option value="28">28%</option>
                              <option value="0">0%</option>
                            </select>
                          </td>
                          <td className="p-2 text-right font-bold text-slate-800">
                            {formatINR(amt)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-500"
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
            <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200">
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="w-full sm:w-80 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-semibold text-slate-900">{formatINR(totalTaxable)}</span>
                </div>

                {isInterState ? (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST:</span>
                    <span className="font-semibold text-slate-900">{formatINR(totalIgst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Output CGST:</span>
                      <span className="font-semibold text-slate-900">{formatINR(totalCgst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Output SGST:</span>
                      <span className="font-semibold text-slate-900">{formatINR(totalSgst)}</span>
                    </div>
                  </>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between font-extrabold text-base text-slate-900">
                  <span>Invoice Total:</span>
                  <span className="text-blue-600">{formatINR(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
