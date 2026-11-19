"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { formatINR } from "../../../lib/format";
import api from "../../../lib/api";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Send,
  AlertCircle,
  Percent,
} from "lucide-react";

interface LineItem {
  description: string;
  hsn_sac: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  cess_rate: number;
}

const INDIAN_STATES = [
  { code: "33", name: "Tamil Nadu" },
  { code: "29", name: "Karnataka" },
  { code: "27", name: "Maharashtra" },
  { code: "07", name: "Delhi" },
  { code: "36", name: "Telangana" },
  { code: "32", name: "Kerala" },
  { code: "24", name: "Gujarat" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "19", name: "West Bengal" },
  { code: "08", name: "Rajasthan" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "06", name: "Haryana" },
  { code: "03", name: "Punjab" },
  { code: "21", name: "Odisha" },
  { code: "37", name: "Andhra Pradesh" },
];

const GST_UNITS = [
  { code: "NOS", label: "NOS - Numbers" },
  { code: "PCS", label: "PCS - Pieces" },
  { code: "MONTH", label: "MONTH - Months" },
  { code: "HRS", label: "HRS - Hours" },
  { code: "SET", label: "SET - Sets" },
  { code: "KGS", label: "KGS - Kilograms" },
  { code: "BOX", label: "BOX - Boxes" },
  { code: "MTR", label: "MTR - Meters" },
];

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("2026-11-18");
  const [dueDate, setDueDate] = useState("2026-12-03");
  const [supplyDate, setSupplyDate] = useState("2026-11-18");
  const [placeOfSupply, setPlaceOfSupply] = useState("Tamil Nadu");
  const [isReverseCharge, setIsReverseCharge] = useState(false);
  const [notes, setNotes] = useState(
    "Thank you for your business. Payment is due within 15 days.",
  );
  const [terms, setTerms] = useState(
    "Payment via NEFT/RTGS/IMPS to Company account. Interest @ 18% p.a. applicable on overdue balance.",
  );

  const [items, setItems] = useState<LineItem[]>([
    {
      description: "Cloud Infrastructure & Enterprise Software Services",
      hsn_sac: "998314",
      quantity: 1,
      unit: "MONTH",
      unit_price: 50000,
      discount_percent: 0,
      discount_amount: 0,
      tax_rate: 18,
      cess_rate: 0,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/customers").then((res) => {
      const custs = res.data.data || [];
      setCustomers(custs);
      if (custs.length > 0) {
        setSelectedCustomerId(custs[0].id);
        if (custs[0].state) {
          setPlaceOfSupply(custs[0].state);
        }
      }
    });
  }, []);

  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    if (cust && cust.state) {
      setPlaceOfSupply(cust.state);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  // Inter-state supply if Place of Supply is not Tamil Nadu (Code 33)
  const isInterState = placeOfSupply !== "Tamil Nadu";

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        hsn_sac: "998314",
        quantity: 1,
        unit: "NOS",
        unit_price: 0,
        discount_percent: 0,
        discount_amount: 0,
        tax_rate: 18,
        cess_rate: 0,
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

  // Defined Calculation Order:
  // 1. Line subtotal = Qty * Unit Price
  // 2. Line discount = percent or amount
  // 3. Line Taxable Value = Line subtotal - Line discount
  // 4. GST & Cess calculated on Line Taxable Value
  // 5. Rounding adjustment to nearest integer
  let grossSubtotal = 0;
  let totalLineDiscounts = 0;
  let lineTaxableSum = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;

  items.forEach((itm) => {
    const qty = Number(itm.quantity) || 0;
    const rate = Number(itm.unit_price) || 0;
    const lineSub = qty * rate;
    const discPct = Number(itm.discount_percent) || 0;
    const lineDisc =
      discPct > 0
        ? (lineSub * discPct) / 100
        : Number(itm.discount_amount) || 0;
    const taxable = Math.max(0, lineSub - lineDisc);
    const taxRate = Number(itm.tax_rate) || 0;
    const cessRate = Number(itm.cess_rate) || 0;

    grossSubtotal += lineSub;
    totalLineDiscounts += lineDisc;
    lineTaxableSum += taxable;

    if (isInterState) {
      totalIgst += (taxable * taxRate) / 100;
    } else {
      totalCgst += (taxable * (taxRate / 2)) / 100;
      totalSgst += (taxable * (taxRate / 2)) / 100;
    }

    if (cessRate > 0) {
      totalCess += (taxable * cessRate) / 100;
    }
  });

  const finalTaxableSubtotal = lineTaxableSum;
  const recipientReverseChargeLiability =
    totalCgst + totalSgst + totalIgst + totalCess;
  const rawTotal =
    finalTaxableSubtotal +
    (isReverseCharge ? 0 : totalCgst + totalSgst + totalIgst + totalCess);
  const roundedTotal = Math.round(rawTotal);
  const roundingAdjustment = Number((roundedTotal - rawTotal).toFixed(2));

  const handleSubmit = async (postImmediately: boolean) => {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }
    if (!invoiceDate || !dueDate) {
      alert("Invoice Date and Due Date are mandatory");
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      alert("All line items must have a description");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create draft invoice
      const res = await api.post("/invoices", {
        customer_id: selectedCustomerId,
        invoice_date: invoiceDate,
        due_date: dueDate,
        supply_date: supplyDate,
        place_of_supply: placeOfSupply,
        is_reverse_charge: isReverseCharge,
        notes,
        terms,
        items,
      });

      const invoiceId = res.data.data.id;

      // 2. If post immediately, post to accounting engine with statutory number
      if (postImmediately) {
        await api.post(`/invoices/${invoiceId}/post`);
        alert(
          "Invoice created & posted successfully with unique financial-year statutory number!",
        );
      } else {
        alert(
          "Draft invoice saved successfully! (Drafts do not consume statutory numbers)",
        );
      }

      router.push("/invoices");
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to save invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="SALES & INVOICE WORKFLOW"
          title="Create GST Sales Invoice"
          subtitle="Compliant Indian GST invoicing with reverse charge, multi-rate tax, and double-entry ledger integration"
        />

        <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
          {/* Top Actions Bar */}
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
                <span>Save Draft (No Statutory #)</span>
              </button>
              <button
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="px-5 py-2 rounded-lg bg-[#173e48] hover:bg-[#2059bd] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Send className="h-4 w-4 text-[#d5ad78]" />
                <span>Post & Assign Statutory #</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e8edf3] p-6 shadow-xs space-y-6">
            {/* Header Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#17223a] mb-1.5">
                  Customer Record *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-medium text-[#17223a] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} —{" "}
                      {c.gstin ? `GSTIN: ${c.gstin}` : "Unregistered (B2C)"} (
                      {c.state || "Tamil Nadu"})
                    </option>
                  ))}
                </select>
                {selectedCustomer && (
                  <div className="text-[11px] text-[#758195] mt-1.5 bg-[#f6f8fb] p-2 rounded border border-[#e8edf3]">
                    <div className="font-semibold text-[#17223a]">
                      {selectedCustomer.name}
                    </div>
                    <div>
                      {selectedCustomer.billing_address ||
                        "No billing address specified"}
                    </div>
                    <div className="text-[10px] text-[#8993a5] mt-0.5">
                      GSTIN: {selectedCustomer.gstin || "Unregistered"} • State
                      Code: {selectedCustomer.state_code || "33"}
                    </div>
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
                  onChange={(e) => {
                    setInvoiceDate(e.target.value);
                    if (!supplyDate) setSupplyDate(e.target.value);
                  }}
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

            {/* GST Supply Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#fbfcfd] rounded-lg border border-[#e8edf3]">
              <div>
                <label className="block text-xs font-bold text-[#17223a] mb-1.5">
                  Supply Date
                </label>
                <input
                  type="date"
                  value={supplyDate}
                  onChange={(e) => setSupplyDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-medium text-[#17223a] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                />
                <span className="text-[10px] text-[#8993a5]">
                  Date when services/goods were delivered
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17223a] mb-1.5">
                  Place of Supply (GST) *
                </label>
                <select
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] text-xs font-medium text-[#17223a] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st.code} value={st.name}>
                      {st.name} (Code: {st.code})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#8993a5]">
                  Determines CGST+SGST vs IGST applicability
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={isReverseCharge}
                    onChange={(e) => setIsReverseCharge(e.target.checked)}
                    className="h-4 w-4 rounded border-[#e8edf3] text-[#173e48] focus:ring-[#367b80]"
                  />
                  <span className="text-xs font-bold text-[#17223a]">
                    Reverse Charge (RCM)
                  </span>
                </label>
                <span className="text-[10px] text-[#8993a5] ml-6">
                  Check if tax is payable by recipient under Section 9(3)/9(4)
                </span>
              </div>
            </div>

            {/* GST Treatment Banner */}
            <div className="p-3 bg-[#edf6f4] border border-[#dfe5e4] rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#173e48] font-medium">
                <span className="font-bold">GST Classification:</span>
                {isInterState ? (
                  <span className="text-[#c18a2a] font-bold bg-[#fff4df] px-2.5 py-0.5 rounded border border-[#f3e5c9]">
                    Inter-State Supply (IGST Applicable)
                  </span>
                ) : (
                  <span className="text-[#1b9e76] font-bold bg-[#e3f7f0] px-2.5 py-0.5 rounded border border-[#c4ebdb]">
                    Intra-State Supply (CGST + SGST 50/50 Split)
                  </span>
                )}
                {isReverseCharge && (
                  <span className="text-[#d75a67] font-bold bg-[#feecef] px-2 py-0.5 rounded border border-[#f5c6cb]">
                    RCM Applicable
                  </span>
                )}
              </div>
              <div className="text-[#758195] text-[11px]">
                Origin: Tamil Nadu (33) → Destination: {placeOfSupply}
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8993a5]">
                    Line Items & Tax Computation
                  </h3>
                  <p className="mt-1 text-[11px] text-[#758195]">
                    All item fields are arranged in one row. Scroll horizontally
                    on smaller screens.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#dfe5e4] bg-white px-3 py-2 text-xs font-bold text-[#173e48] shadow-xs transition-colors hover:bg-[#edf6f4]"
                >
                  <Plus className="h-4 w-4" /> Add Line Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((itm, idx) => {
                  const qty = Number(itm.quantity) || 0;
                  const rate = Number(itm.unit_price) || 0;
                  const lineSub = qty * rate;
                  const disc =
                    (lineSub * (Number(itm.discount_percent) || 0)) / 100;
                  const taxable = Math.max(0, lineSub - disc);
                  const taxRate = Number(itm.tax_rate) || 0;
                  const cessRate = Number(itm.cess_rate) || 0;
                  const taxAmt = (taxable * taxRate) / 100;
                  const cessAmt = (taxable * cessRate) / 100;
                  const lineTotal =
                    taxable + (isReverseCharge ? 0 : taxAmt + cessAmt);
                  const labelClass =
                    "mb-1 block whitespace-nowrap text-[10px] font-semibold text-[#758195]";
                  const inputClass =
                    "h-8 min-w-0 w-full rounded-lg border border-[#dfe5e4] bg-white px-1.5 text-[11px] text-[#17223a] outline-none transition focus:border-[#367b80] focus:ring-2 focus:ring-[#367b80]/15";

                  return (
                    <section
                      key={idx}
                      className="space-y-3 rounded-xl border border-[#e8edf3] bg-white p-3 shadow-xs sm:p-4"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#8993a5]">
                        Line item {idx + 1}
                      </div>

                      <div className="overflow-x-auto pb-1">
                        <div className="grid w-full min-w-[610px] grid-cols-[minmax(120px,1.2fr)_minmax(64px,0.85fr)_minmax(48px,0.65fr)_minmax(64px,0.85fr)_minmax(76px,0.95fr)_minmax(52px,0.65fr)_minmax(54px,0.7fr)_minmax(52px,0.65fr)_28px] items-end gap-1.5">
                          <div className="min-w-0">
                            <label
                              htmlFor={`invoice-item-${idx}-description`}
                              className={labelClass}
                            >
                              Description
                            </label>
                            <input
                              id={`invoice-item-${idx}-description`}
                              type="text"
                              value={itm.description}
                              placeholder="Service or product..."
                              onChange={(e) =>
                                updateItem(idx, "description", e.target.value)
                              }
                              className={`${inputClass} px-2 font-medium`}
                            />
                          </div>
                          <div className="min-w-0">
                            <label
                              htmlFor={`invoice-item-${idx}-hsn`}
                              className={labelClass}
                            >
                              HSN/SAC
                            </label>
                            <input
                              id={`invoice-item-${idx}-hsn`}
                              type="text"
                              value={itm.hsn_sac}
                              placeholder="998314"
                              onChange={(e) =>
                                updateItem(idx, "hsn_sac", e.target.value)
                              }
                              className={`${inputClass} font-mono`}
                            />
                          </div>
                          <div className="min-w-0">
                            <label
                              htmlFor={`invoice-item-${idx}-quantity`}
                              className={labelClass}
                            >
                              Qty
                            </label>
                            <input
                              id={`invoice-item-${idx}-quantity`}
                              type="number"
                              min="1"
                              step="any"
                              value={itm.quantity}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                              className={inputClass}
                            />
                          </div>
                          <div className="min-w-0">
                            <label
                              htmlFor={`invoice-item-${idx}-unit`}
                              className={labelClass}
                            >
                              Unit
                            </label>
                            <select
                              id={`invoice-item-${idx}-unit`}
                              value={itm.unit}
                              onChange={(e) =>
                                updateItem(idx, "unit", e.target.value)
                              }
                              className={`${inputClass} px-0.5`}
                            >
                              {GST_UNITS.map((u) => (
                                <option key={u.code} value={u.code}>
                                  {u.code}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="min-w-0">
                            <label
                              htmlFor={`invoice-item-${idx}-unit-price`}
                              className={labelClass}
                            >
                              Rate (₹)
                            </label>
                            <input
                              id={`invoice-item-${idx}-unit-price`}
                              type="number"
                              min="0"
                              step="any"
                              value={itm.unit_price}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "unit_price",
                                  Number(e.target.value),
                                )
                              }
                              className={`${inputClass} text-right font-medium`}
                            />
                          </div>
                          <div className="min-w-0">
                            <label
                              htmlFor={`invoice-item-${idx}-discount`}
                              className={labelClass}
                            >
                              Disc %
                            </label>
                            <input
                              id={`invoice-item-${idx}-discount`}
                              type="number"
                              min="0"
                              max="100"
                              value={itm.discount_percent}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "discount_percent",
                                  Number(e.target.value),
                                )
                              }
                              className={inputClass}
                            />
                          </div>
                          <div className="min-w-0">
                            <label
                              htmlFor={`invoice-item-${idx}-tax-rate`}
                              className={labelClass}
                            >
                              GST %
                            </label>
                            <select
                              id={`invoice-item-${idx}-tax-rate`}
                              value={itm.tax_rate}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "tax_rate",
                                  Number(e.target.value),
                                )
                              }
                              className={`${inputClass} px-0.5 font-semibold`}
                            >
                              <option value="18">18%</option>
                              <option value="12">12%</option>
                              <option value="5">5%</option>
                              <option value="28">28%</option>
                              <option value="0">0%</option>
                            </select>
                          </div>
                          <div className="min-w-0">
                            <label
                              htmlFor={`invoice-item-${idx}-cess-rate`}
                              className={labelClass}
                            >
                              Cess %
                            </label>
                            <input
                              id={`invoice-item-${idx}-cess-rate`}
                              type="number"
                              min="0"
                              step="any"
                              value={itm.cess_rate}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "cess_rate",
                                  Number(e.target.value),
                                )
                              }
                              className={inputClass}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                            aria-label={`Remove line item ${idx + 1}`}
                            title="Remove line item"
                            className="inline-flex h-8 w-7 items-center justify-center rounded-lg border border-[#e8edf3] text-[#8993a5] transition-colors hover:border-[#f5c6cb] hover:bg-[#feecef] hover:text-[#d75a67] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-t border-[#e8edf3] pt-3">
                        <div className="rounded-lg bg-[#f6f8fb] px-3 py-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#8993a5]">
                            Taxable Value
                          </div>
                          <div className="mt-1 text-sm font-semibold text-[#17223a]">
                            {formatINR(taxable)}
                          </div>
                        </div>
                        <div className="rounded-lg bg-[#edf6f4] px-3 py-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#758195]">
                            {isReverseCharge ? "Supplier Payable" : "Total"}
                          </div>
                          <div className="mt-1 text-sm font-bold text-[#173e48]">
                            {formatINR(lineTotal)}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            {/* Calculations Breakdown & Notes */}
            <div className="flex flex-col lg:flex-row justify-between gap-6 pt-4 border-t border-[#e8edf3]">
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#17223a] mb-1">
                    Customer Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#e8edf3] text-xs focus:ring-1 focus:ring-[#367b80]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17223a] mb-1">
                    Payment Terms & Statutory Conditions
                  </label>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#e8edf3] text-xs focus:ring-1 focus:ring-[#367b80]"
                  />
                </div>
              </div>

              {/* Order of Calculation Breakdown Card */}
              <div className="w-full lg:w-96 bg-[#173e48] p-5 rounded-xl border border-[#42636b] text-white space-y-2.5 text-xs shadow-md">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#d5ad78] pb-1 border-b border-[#42636b]">
                  Defined Calculation Order
                </div>

                <div className="flex justify-between text-[#c8d8d8]">
                  <span>Gross Items Subtotal:</span>
                  <span className="font-semibold text-white">
                    {formatINR(grossSubtotal)}
                  </span>
                </div>

                {totalLineDiscounts > 0 && (
                  <div className="flex justify-between text-[#c8d8d8]">
                    <span>Discounts:</span>
                    <span className="font-semibold text-[#f5c6cb]">
                      - {formatINR(totalLineDiscounts)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-[#c8d8d8] pt-1 border-t border-[#42636b]/60">
                  <span>Net Taxable Value:</span>
                  <span className="font-bold text-white">
                    {formatINR(finalTaxableSubtotal)}
                  </span>
                </div>

                {isInterState ? (
                  <div className="flex justify-between text-[#c8d8d8]">
                    <span>
                      {isReverseCharge
                        ? "IGST (recipient RCM liability):"
                        : "IGST (Integrated Tax):"}
                    </span>
                    <span className="font-semibold text-white">
                      {formatINR(totalIgst)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[#c8d8d8]">
                      <span>
                        {isReverseCharge
                          ? "CGST (recipient RCM liability):"
                          : "Central GST (CGST):"}
                      </span>
                      <span className="font-semibold text-white">
                        {formatINR(totalCgst)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#c8d8d8]">
                      <span>
                        {isReverseCharge
                          ? "SGST (recipient RCM liability):"
                          : "State GST (SGST):"}
                      </span>
                      <span className="font-semibold text-white">
                        {formatINR(totalSgst)}
                      </span>
                    </div>
                  </>
                )}

                {totalCess > 0 && (
                  <div className="flex justify-between text-[#c8d8d8]">
                    <span>
                      {isReverseCharge
                        ? "Cess (recipient RCM liability):"
                        : "GST Cess:"}
                    </span>
                    <span className="font-semibold text-white">
                      {formatINR(totalCess)}
                    </span>
                  </div>
                )}

                {isReverseCharge && (
                  <div className="rounded-lg border border-[#668087] bg-[#214e58] p-3 space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>Total RCM GST payable by recipient:</span>
                      <span>{formatINR(recipientReverseChargeLiability)}</span>
                    </div>
                    <p className="text-[10px] text-[#c8d8d8]">
                      Payable directly by the recipient to the Government;
                      excluded from the amount payable to the supplier.
                    </p>
                  </div>
                )}

                <div className="flex justify-between text-[#c8d8d8]">
                  <span>Rounding Adjustment:</span>
                  <span className="font-medium text-[#c8d8d8]">
                    {roundingAdjustment >= 0
                      ? `+${roundingAdjustment.toFixed(2)}`
                      : roundingAdjustment.toFixed(2)}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#42636b] flex justify-between items-baseline font-extrabold text-base text-white">
                  <span>Invoice Total:</span>
                  <span className="text-[#d5ad78] text-lg">
                    {formatINR(roundedTotal)}
                  </span>
                </div>

                <div className="text-[10px] text-[#a5bfbf] pt-1">
                  Drafts do not consume statutory final numbers. Posted invoices
                  post double-entry ledger entries to Accounts Receivable &
                  Revenue.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
