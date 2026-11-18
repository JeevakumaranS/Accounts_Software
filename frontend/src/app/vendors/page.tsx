'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../lib/api';
import { PlusCircle, Building, X } from 'lucide-react';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [stateCode, setStateCode] = useState('27');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  const loadVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vendors', {
        name,
        mobile,
        email,
        gstin,
        address: 'Commercial Complex',
        city: 'Mumbai',
        state,
        state_code: stateCode,
        bank_name: bankName,
        bank_account_number: bankAccount,
        bank_ifsc: bankIfsc,
      });
      alert('Vendor created successfully!');
      setShowModal(false);
      setName('');
      setMobile('');
      setGstin('');
      loadVendors();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create vendor');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="SUPPLIER DIRECTORY"
          title="Vendor & Supplier Management"
          subtitle="Directory of vendors, tax details and bank settlement information"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#17223a]">Vendors ({vendors.length})</h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#173e48] hover:bg-[#214e58] text-white text-xs font-bold transition-all shadow-xs"
            >
              <PlusCircle className="h-4 w-4 text-[#d5ad78]" />
              <span>Add Vendor</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border border-[#e8edf3] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f8fb] text-[#8993a5] text-[11px] font-bold uppercase tracking-wider border-b border-[#e8edf3]">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Vendor Name</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">GSTIN</th>
                  <th className="p-3.5">State</th>
                  <th className="p-3.5">Bank Information</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1f5]">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-[#f6f8fb] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#173e48]">{v.vendor_code}</td>
                    <td className="p-3.5 font-bold text-[#17223a]">{v.name}</td>
                    <td className="p-3.5 text-[#758195]">{v.mobile || v.email}</td>
                    <td className="p-3.5 font-mono text-[#17223a]">{v.gstin || '-'}</td>
                    <td className="p-3.5 text-[#17223a] font-medium">
                      {v.state} ({v.state_code})
                    </td>
                    <td className="p-3.5 text-[#758195]">
                      {v.bank_name ? `${v.bank_name} - ${v.bank_account_number || ''}` : '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="text-[#1b9e76] font-bold text-[10px] bg-[#edf6f4] border border-[#dfe5e4] px-2 py-0.5 rounded">
                        Active
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
                <h3 className="font-bold text-sm text-[#17223a]">Add New Vendor</h3>
                <button onClick={() => setShowModal(false)} className="text-[#8993a5] hover:text-[#17223a]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Vendor / Business Name *</label>
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
                    <label className="block font-bold text-[#17223a] mb-1">Mobile / Phone</label>
                    <input
                      type="text"
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
                  <label className="block font-bold text-[#17223a] mb-1">Vendor GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-md border border-[#d5e0dd] font-mono focus:ring-2 focus:ring-[#2769d7]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-[#d5e0dd] focus:ring-2 focus:ring-[#2769d7]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">State Code</label>
                    <input
                      type="text"
                      value={stateCode}
                      onChange={(e) => setStateCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-[#d5e0dd] font-mono focus:ring-2 focus:ring-[#2769d7]"
                    />
                  </div>
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
                    className="px-4 py-1.5 rounded-md bg-[#173e48] hover:bg-[#214e58] text-white font-bold shadow-xs"
                  >
                    Save Vendor
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
