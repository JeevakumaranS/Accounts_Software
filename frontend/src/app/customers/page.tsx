'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR } from '../../lib/format';
import api from '../../lib/api';
import { PlusCircle, Search, Users, X } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [stateCode, setStateCode] = useState('33');

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

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', {
        name,
        business_name: businessName,
        mobile,
        email,
        gstin,
        billing_address: address,
        city,
        state,
        state_code: stateCode,
      });
      alert('Customer created successfully!');
      setShowModal(false);
      setName('');
      setMobile('');
      setGstin('');
      loadCustomers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create customer');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="CLIENT DIRECTORY"
          title="Customer Management"
          subtitle="Customer directory, GSTIN details, state codes & billing profiles"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#17223a]">Customers ({customers.length})</h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2769d7] text-white text-xs font-bold hover:bg-[#2059bd] transition-all shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Customer</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border border-[#e8edf3] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f8fb] text-[#8993a5] text-[11px] font-bold uppercase tracking-wider border-b border-[#e8edf3]">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Contact / Mobile</th>
                  <th className="p-3.5">GSTIN</th>
                  <th className="p-3.5">State & Code</th>
                  <th className="p-3.5">City</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1f5]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f6f8fb] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#173e48]">{c.customer_code}</td>
                    <td className="p-3.5 font-bold text-[#17223a]">{c.name}</td>
                    <td className="p-3.5 text-[#758195] font-mono">{c.mobile}</td>
                    <td className="p-3.5 font-mono text-[#17223a] font-medium">
                      {c.gstin || 'Unregistered'}
                    </td>
                    <td className="p-3.5 text-[#17223a] font-medium">
                      {c.state} ({c.state_code})
                    </td>
                    <td className="p-3.5 text-[#758195]">{c.city}</td>
                    <td className="p-3.5 text-center">
                      <span className="text-[#1b9e76] font-bold text-[10px] bg-[#edf6f4] border border-[#dfe5e4] px-2 py-0.5 rounded">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-[#0a2025]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl border border-[#e8edf3]">
              <div className="flex items-center justify-between pb-2 border-b border-[#e8edf3]">
                <h3 className="font-bold text-sm text-[#17223a]">Add New Customer</h3>
                <button onClick={() => setShowModal(false)} className="text-[#8993a5] hover:text-[#17223a]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Customer / Entity Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-[#d5e0dd] focus:ring-2 focus:ring-[#2769d7]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-[#d5e0dd] focus:ring-2 focus:ring-[#2769d7]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-[#d5e0dd] focus:ring-2 focus:ring-[#2769d7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Customer GSTIN</label>
                  <input
                    type="text"
                    placeholder="e.g. 33AABCD1234E1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-md border border-[#d5e0dd] font-mono focus:ring-2 focus:ring-[#2769d7]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">Billing State *</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-[#d5e0dd] focus:ring-2 focus:ring-[#2769d7]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">State Code (GST)</label>
                    <input
                      type="text"
                      value={stateCode}
                      onChange={(e) => setStateCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-[#d5e0dd] font-mono focus:ring-2 focus:ring-[#2769d7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Billing Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-[#d5e0dd] focus:ring-2 focus:ring-[#2769d7]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-1.5 rounded-md bg-[#f6f8fb] border border-[#e8edf3] text-[#758195] font-semibold hover:bg-[#edf1f7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-md bg-[#2769d7] hover:bg-[#2059bd] text-white font-bold shadow-xs"
                  >
                    Save Customer
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
