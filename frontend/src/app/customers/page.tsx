'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR, formatDate } from '../../lib/format';
import api from '../../lib/api';
import {
  PlusCircle,
  Search,
  Users,
  Eye,
  X,
  Building,
  Phone,
  Mail,
  FileText,
  ArrowDownToLine,
  Calendar,
  CreditCard,
  Printer,
  ExternalLink,
} from 'lucide-react';

const INDIAN_STATES = [
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Karnataka', code: '29' },
  { name: 'Delhi', code: '07' },
  { name: 'Telangana', code: '36' },
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Kerala', code: '32' },
  { name: 'Gujarat', code: '24' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'West Bengal', code: '19' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Haryana', code: '06' },
  { name: 'Punjab', code: '03' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Bihar', code: '10' },
  { name: 'Odisha', code: '21' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gstinFilter, setGstinFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Profile & Ledger State
  const [profileCustomer, setProfileCustomer] = useState<any | null>(null);
  const [customerLedger, setCustomerLedger] = useState<any | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [profileTab, setProfileTab] = useState<'LEDGER' | 'INVOICES' | 'RECEIPTS'>('LEDGER');

  // Form states (Section 4.2 Requirements)
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [stateCode, setStateCode] = useState('33');
  const [openingBalance, setOpeningBalance] = useState('0');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleStateChange = (selectedStateName: string) => {
    const found = INDIAN_STATES.find((s) => s.name === selectedStateName);
    setState(selectedStateName);
    if (found) setStateCode(found.code);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations
    if (!name.trim()) {
      alert('Customer Name is mandatory.');
      return;
    }
    if (!mobile.trim() || !/^[+0-9() -]{7,20}$/.test(mobile.trim())) {
      alert('Please enter a valid mobile number (min 7 digits).');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }
    if (gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim())) {
      alert('Invalid Indian GSTIN format. Expected 15 alphanumeric characters (e.g. 33AABCD1234E1Z5).');
      return;
    }
    if (!address.trim()) {
      alert('Billing Address is mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/customers', {
        name: name.trim(),
        business_name: businessName.trim() || undefined,
        contact_person: contactPerson.trim() || undefined,
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        gstin: gstin.trim() || undefined,
        billing_address: address.trim(),
        city: city.trim() || 'Chennai',
        state,
        state_code: stateCode,
        opening_balance: Number(openingBalance) || 0,
      });

      alert('Customer created successfully!');
      setShowCreateModal(false);
      // Reset form
      setName('');
      setBusinessName('');
      setContactPerson('');
      setMobile('');
      setEmail('');
      setGstin('');
      setAddress('');
      setCity('');
      setOpeningBalance('0');
      loadCustomers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const openCustomerProfile = async (cust: any) => {
    setProfileCustomer(cust);
    setLedgerLoading(true);
    setProfileTab('LEDGER');
    try {
      const res = await api.get(`/customers/${cust.id}/ledger`);
      setCustomerLedger(res.data.data || null);
    } catch (err) {
      console.error(err);
      alert('Failed to load customer profile ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.name?.toLowerCase().includes(q) ||
      c.customer_code?.toLowerCase().includes(q) ||
      c.mobile?.includes(q) ||
      c.gstin?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q);

    const matchesGstin =
      gstinFilter === 'ALL'
        ? true
        : gstinFilter === 'B2B'
        ? Boolean(c.gstin && c.gstin.trim())
        : !c.gstin || !c.gstin.trim();

    return matchesSearch && matchesGstin;
  });

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="CLIENT DIRECTORY & ACCOUNTS"
          title="Customer Management"
          subtitle="Section 4.2 Customer profiles, GSTIN validation, derived ledger balances & ageing"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8993a5]" />
                <input
                  type="text"
                  placeholder="Search by name, code, mobile, GSTIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-[#e8edf3] text-xs text-[#17223a] focus:outline-none focus:ring-2 focus:ring-[#367b80] shadow-xs"
                />
              </div>

              <select
                value={gstinFilter}
                onChange={(e) => setGstinFilter(e.target.value)}
                className="px-3 py-2 bg-white rounded-lg border border-[#e8edf3] text-xs font-semibold text-[#17223a] focus:outline-none shadow-xs"
              >
                <option value="ALL">All Tax Treatments</option>
                <option value="B2B">Registered (GSTIN / B2B)</option>
                <option value="B2C">Unregistered (B2C)</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173e48] text-white text-xs font-semibold hover:bg-[#214e58] transition-colors shadow-xs"
            >
              <PlusCircle className="h-4 w-4 text-[#d5ad78]" />
              <span>Add Customer</span>
            </button>
          </div>

          {/* Customers Data Table */}
          <div className="bg-white rounded-xl border border-[#e8edf3] overflow-hidden shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fb] text-[#8993a5] text-[11px] font-bold uppercase tracking-wider border-b border-[#e8edf3]">
                  <tr>
                    <th className="py-3.5 px-4">Customer ID</th>
                    <th className="py-3.5 px-4">Customer Name & Business</th>
                    <th className="py-3.5 px-4">Mobile & Contact</th>
                    <th className="py-3.5 px-4">GSTIN & Treatment</th>
                    <th className="py-3.5 px-4">State & Place of Supply</th>
                    <th className="py-3.5 px-4 text-right">Invoiced Total</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Profile & Ledger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf3]">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#758195]">
                        {loading
                          ? 'Loading customer directory...'
                          : 'No customers found matching the search criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => {
                      const totalInvoiced = (c.invoices || [])
                        .filter((inv: any) => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED')
                        .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

                      return (
                        <tr key={c.id} className="hover:bg-[#edf6f4]/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#173e48]">
                            {c.customer_code}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#17223a]">{c.name}</div>
                            {c.business_name && (
                              <div className="text-[11px] text-[#758195] flex items-center gap-1 mt-0.5">
                                <Building className="h-3 w-3 text-[#8993a5]" />
                                {c.business_name}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-[#17223a] font-medium flex items-center gap-1">
                              <Phone className="h-3 w-3 text-[#8993a5]" />
                              {c.mobile}
                            </div>
                            {c.email && (
                              <div className="text-[11px] text-[#758195] flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3 text-[#8993a5]" />
                                {c.email}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {c.gstin ? (
                              <div>
                                <span className="font-mono font-bold text-[#173e48] bg-[#edf6f4] px-1.5 py-0.5 rounded border border-[#1b9e76]/20">
                                  {c.gstin}
                                </span>
                                <span className="block text-[10px] text-[#1b9e76] font-bold mt-0.5">
                                  Registered (B2B)
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-[#758195] font-medium">B2C Unregistered</span>
                                <span className="block text-[10px] text-[#8993a5]">Consumer</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[#17223a] font-medium">
                            <div>{c.state} ({c.state_code})</div>
                            <div className="text-[11px] text-[#758195]">{c.city}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#17223a]">
                            {formatINR(totalInvoiced)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[#1b9e76] font-bold text-[10px] bg-[#edf6f4] border border-[#1b9e76]/20 px-2.5 py-1 rounded-full">
                              {c.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => openCustomerProfile(c)}
                              className="px-3 py-1.5 rounded-md bg-[#f6f8fb] hover:bg-[#edf6f4] text-[#173e48] border border-[#e8edf3] font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View Statement</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 4.2 CUSTOMER PROFILE, LEDGER & AGEING DRAWER/MODAL */}
        {profileCustomer && (
          <div className="fixed inset-0 z-50 bg-[#0a2025]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#e8edf3]">
              {/* Profile Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#e8edf3]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#173e48] bg-[#edf6f4] px-2 py-0.5 rounded border border-[#173e48]/20">
                      {profileCustomer.customer_code}
                    </span>
                    <span className="text-xs text-[#758195] font-semibold">
                      {profileCustomer.state} (Code: {profileCustomer.state_code})
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#17223a] mt-1">
                    {profileCustomer.name}
                  </h2>
                  <div className="text-xs text-[#758195] flex flex-wrap items-center gap-3 mt-1">
                    {profileCustomer.business_name && (
                      <span><strong>Business:</strong> {profileCustomer.business_name}</span>
                    )}
                    <span><strong>Phone:</strong> {profileCustomer.mobile}</span>
                    {profileCustomer.email && <span><strong>Email:</strong> {profileCustomer.email}</span>}
                    {profileCustomer.gstin && (
                      <span className="font-mono text-[#173e48]">
                        <strong>GSTIN:</strong> {profileCustomer.gstin}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#758195] mt-0.5">
                    <strong>Address:</strong> {profileCustomer.billing_address}, {profileCustomer.city}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-lg bg-[#f6f8fb] hover:bg-[#edf6f4] text-[#17223a] text-xs font-semibold flex items-center gap-1.5 border border-[#e8edf3]"
                  >
                    <Printer className="h-4 w-4 text-[#758195]" /> Print Statement
                  </button>
                  <button
                    onClick={() => {
                      setProfileCustomer(null);
                      setCustomerLedger(null);
                    }}
                    className="p-1.5 text-[#758195] hover:text-[#17223a] rounded-lg hover:bg-[#f6f8fb]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {ledgerLoading ? (
                <div className="py-12 text-center text-xs text-[#758195]">
                  Loading ledger statements and ageing calculation...
                </div>
              ) : customerLedger ? (
                <div className="space-y-5">
                  {/* Financial Balance Summary Strip (Derived Balances) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#173e48] text-white rounded-xl border border-[#42636b] overflow-hidden">
                    <div className="p-3.5 border-r border-[#42636b]">
                      <span className="text-[10px] text-[#bfd1d1] uppercase font-bold block">Opening Balance</span>
                      <strong className="text-lg font-bold text-white block mt-0.5">
                        {formatINR(customerLedger.summary?.opening_balance)}
                      </strong>
                    </div>
                    <div className="p-3.5 border-r border-[#42636b]">
                      <span className="text-[10px] text-[#bfd1d1] uppercase font-bold block">Total Invoiced</span>
                      <strong className="text-lg font-bold text-white block mt-0.5">
                        {formatINR(customerLedger.summary?.total_invoiced)}
                      </strong>
                    </div>
                    <div className="p-3.5 border-r border-[#42636b]">
                      <span className="text-[10px] text-[#bfd1d1] uppercase font-bold block">Total Receipts</span>
                      <strong className="text-lg font-bold text-[#85e3c8] block mt-0.5">
                        {formatINR(customerLedger.summary?.total_paid)}
                      </strong>
                    </div>
                    <div className="p-3.5">
                      <span className="text-[10px] text-[#bfd1d1] uppercase font-bold block">Net Outstanding Balance</span>
                      <strong className="text-lg font-bold text-[#d5ad78] block mt-0.5">
                        {formatINR(customerLedger.summary?.outstanding_balance)}
                      </strong>
                    </div>
                  </div>

                  {/* Customer Receivables Ageing Strip (SRS 4.2 Requirement) */}
                  <div className="bg-[#f6f8fb] rounded-xl border border-[#e8edf3] p-4 space-y-2">
                    <div className="text-[11px] font-bold text-[#8993a5] uppercase tracking-wider">
                      Overdue Ageing Analysis (Derived from posted invoices)
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      <div className="bg-white p-2 rounded-lg border border-[#e8edf3]">
                        <div className="text-[10px] font-bold text-[#173e48]">Current</div>
                        <div className="font-bold text-[#17223a] mt-0.5">{formatINR(customerLedger.ageing?.current)}</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-[#e8edf3]">
                        <div className="text-[10px] font-bold text-[#1b9e76]">1–30 Days</div>
                        <div className="font-bold text-[#1b9e76] mt-0.5">{formatINR(customerLedger.ageing?.days1_30)}</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-[#e8edf3]">
                        <div className="text-[10px] font-bold text-[#c18a2a]">31–60 Days</div>
                        <div className="font-bold text-[#c18a2a] mt-0.5">{formatINR(customerLedger.ageing?.days31_60)}</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-[#e8edf3]">
                        <div className="text-[10px] font-bold text-[#d49422]">61–90 Days</div>
                        <div className="font-bold text-[#d49422] mt-0.5">{formatINR(customerLedger.ageing?.days61_90)}</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-[#e8edf3]">
                        <div className="text-[10px] font-bold text-[#d75a67]">Over 90 Days</div>
                        <div className="font-bold text-[#d75a67] mt-0.5">{formatINR(customerLedger.ageing?.above90)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs: Statement Ledger vs Invoices vs Receipts */}
                  <div className="flex items-center gap-2 border-b border-[#e8edf3] pb-2">
                    <button
                      onClick={() => setProfileTab('LEDGER')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        profileTab === 'LEDGER'
                          ? 'bg-[#173e48] text-white'
                          : 'text-[#758195] hover:text-[#17223a]'
                      }`}
                    >
                      Account Statement (Ledger)
                    </button>
                    <button
                      onClick={() => setProfileTab('INVOICES')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        profileTab === 'INVOICES'
                          ? 'bg-[#173e48] text-white'
                          : 'text-[#758195] hover:text-[#17223a]'
                      }`}
                    >
                      Invoices ({customerLedger.invoices?.length || 0})
                    </button>
                    <button
                      onClick={() => setProfileTab('RECEIPTS')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        profileTab === 'RECEIPTS'
                          ? 'bg-[#173e48] text-white'
                          : 'text-[#758195] hover:text-[#17223a]'
                      }`}
                    >
                      Payment Receipts ({customerLedger.payments?.length || 0})
                    </button>
                  </div>

                  {/* TAB 1: Chronological Ledger */}
                  {profileTab === 'LEDGER' && (
                    <div className="border border-[#e8edf3] rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f6f8fb] text-[#8993a5] text-[11px] font-bold uppercase border-b border-[#e8edf3]">
                          <tr>
                            <th className="p-3">Posting Date</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Ref #</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Debit (₹)</th>
                            <th className="p-3 text-right">Credit (₹)</th>
                            <th className="p-3 text-right font-bold">Running Balance (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e8edf3]">
                          {customerLedger.ledger?.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-[#758195]">
                                No transactions posted for this customer yet.
                              </td>
                            </tr>
                          ) : (
                            customerLedger.ledger?.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[#edf6f4]/40">
                                <td className="p-3 text-[#758195]">{formatDate(row.date)}</td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      row.type === 'INVOICE'
                                        ? 'bg-[#e9f1ff] text-[#2769d7]'
                                        : 'bg-[#edf6f4] text-[#1b9e76]'
                                    }`}
                                  >
                                    {row.type}
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-bold text-[#173e48]">{row.ref_number}</td>
                                <td className="p-3 text-[#17223a]">{row.description}</td>
                                <td className="p-3 text-right font-medium text-[#17223a]">
                                  {row.debit > 0 ? formatINR(row.debit) : '-'}
                                </td>
                                <td className="p-3 text-right font-medium text-[#1b9e76]">
                                  {row.credit > 0 ? formatINR(row.credit) : '-'}
                                </td>
                                <td className="p-3 text-right font-bold text-[#173e48]">
                                  {formatINR(row.running_balance)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB 2: Invoices List */}
                  {profileTab === 'INVOICES' && (
                    <div className="border border-[#e8edf3] rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f6f8fb] text-[#8993a5] text-[11px] font-bold uppercase border-b border-[#e8edf3]">
                          <tr>
                            <th className="p-3">Invoice #</th>
                            <th className="p-3">Invoice Date</th>
                            <th className="p-3">Due Date</th>
                            <th className="p-3 text-right">Taxable</th>
                            <th className="p-3 text-right">Total Invoice</th>
                            <th className="p-3 text-right">Balance Due</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e8edf3]">
                          {(customerLedger.invoices || []).map((inv: any) => (
                            <tr key={inv.id} className="hover:bg-[#edf6f4]/40">
                              <td className="p-3 font-mono font-bold text-[#173e48]">{inv.invoice_number}</td>
                              <td className="p-3 text-[#758195]">{formatDate(inv.invoice_date)}</td>
                              <td className="p-3 text-[#758195]">{formatDate(inv.due_date)}</td>
                              <td className="p-3 text-right font-medium text-[#17223a]">{formatINR(inv.taxable_amount)}</td>
                              <td className="p-3 text-right font-bold text-[#17223a]">{formatINR(inv.total_amount)}</td>
                              <td className="p-3 text-right font-bold text-[#c18a2a]">{formatINR(inv.balance_due)}</td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf6f4] text-[#1b9e76]">
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB 3: Receipts List */}
                  {profileTab === 'RECEIPTS' && (
                    <div className="border border-[#e8edf3] rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f6f8fb] text-[#8993a5] text-[11px] font-bold uppercase border-b border-[#e8edf3]">
                          <tr>
                            <th className="p-3">Receipt #</th>
                            <th className="p-3">Payment Date</th>
                            <th className="p-3">Mode</th>
                            <th className="p-3">Deposited Account</th>
                            <th className="p-3">Ref #</th>
                            <th className="p-3 text-right font-bold">Amount Received</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e8edf3]">
                          {(customerLedger.payments || []).map((p: any) => (
                            <tr key={p.id} className="hover:bg-[#edf6f4]/40">
                              <td className="p-3 font-mono font-bold text-[#173e48]">{p.receipt_number}</td>
                              <td className="p-3 text-[#758195]">{formatDate(p.payment_date)}</td>
                              <td className="p-3 font-semibold text-[#17223a]">{p.payment_mode}</td>
                              <td className="p-3 text-[#17223a]">{p.receiving_account?.account_name || 'Bank'}</td>
                              <td className="p-3 text-[#758195] font-mono">{p.reference_number || '-'}</td>
                              <td className="p-3 text-right font-bold text-[#1b9e76]">{formatINR(p.amount)}</td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf6f4] text-[#1b9e76]">
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* SECTION 4.2 CUSTOMER CREATION MODAL WITH COMPLETE FIELDS */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-[#0a2025]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-[#e8edf3]">
              <div className="flex items-center justify-between pb-3 border-b border-[#e8edf3]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8993a5]">
                    SRS 4.2 Specification
                  </span>
                  <h3 className="font-bold text-sm text-[#17223a]">Add New Customer Entity</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-[#8993a5] hover:text-[#17223a] rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
                {/* System Generated Customer ID preview */}
                <div className="p-2.5 bg-[#edf6f4] rounded-lg border border-[#dfe5e4] flex items-center justify-between">
                  <span className="text-[#173e48] font-bold">Customer ID:</span>
                  <span className="font-mono font-bold text-[#173e48] text-xs">
                    CUST-XXXX (System-generated unique identifier)
                  </span>
                </div>

                {/* Customer Name (Mandatory) */}
                <div>
                  <label className="block font-bold text-[#17223a] mb-1">
                    Customer Name * <span className="text-[11px] text-[#758195] font-normal">(Mandatory)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Legal or Trading Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#d5e0dd] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                  />
                </div>

                {/* Business Name / Contact Person (Optional) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">
                      Business Name <span className="text-[10px] text-[#758195] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Enterprises"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#d5e0dd] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">
                      Contact Person <span className="text-[10px] text-[#758195] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#d5e0dd] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                    />
                  </div>
                </div>

                {/* Mobile Number & Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">
                      Mobile Number * <span className="text-[10px] text-[#758195] font-normal">(Mandatory, Duplicate check)</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#d5e0dd] font-mono focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">
                      Email <span className="text-[10px] text-[#758195] font-normal">(Optional, Format check)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="billing@customer.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#d5e0dd] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                    />
                  </div>
                </div>

                {/* GSTIN (Optional, validated when supplied) */}
                <div>
                  <label className="block font-bold text-[#17223a] mb-1">
                    GSTIN <span className="text-[10px] text-[#758195] font-normal">(Optional; 15-char format & duplicate check)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 33AABCD1234E1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg border border-[#d5e0dd] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                  />
                </div>

                {/* Billing Address & City (Mandatory) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-[#17223a] mb-1">
                      Billing Address * <span className="text-[10px] text-[#758195] font-normal">(Mandatory)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Street address, building, floor"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#d5e0dd] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#d5e0dd] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                    />
                  </div>
                </div>

                {/* State & State Code for GST treatment (Mandatory) & Opening Balance */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">
                      Billing State * <span className="text-[10px] text-[#758195] font-normal">(GST treatment)</span>
                    </label>
                    <select
                      value={state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-[#d5e0dd] font-medium text-[#17223a] focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">State Code *</label>
                    <input
                      type="text"
                      readOnly
                      value={stateCode}
                      className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] bg-[#f6f8fb] text-[#173e48] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">
                      Opening Balance (₹) <span className="text-[10px] text-[#758195] font-normal">(Controlled)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#d5e0dd] text-right font-medium focus:outline-none focus:ring-2 focus:ring-[#367b80]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e8edf3] flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg bg-[#f6f8fb] border border-[#e8edf3] text-[#758195] font-semibold hover:bg-[#edf1f7] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-[#173e48] hover:bg-[#214e58] text-white font-bold transition-colors shadow-xs"
                  >
                    {submitting ? 'Creating Customer...' : 'Save Customer Entity'}
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
