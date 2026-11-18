'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { Building2, Calendar, Users, Shield, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<any>({
    legal_name: 'Durozen Technologies Pvt. Ltd.',
    gstin: '33AABCD1234E1Z5',
    address: '123 Tech Park, Anna Salai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    state_code: '33',
    pincode: '600002',
    phone: '+91 98765 43210',
    email: 'accounts@durozen.com',
  });
  const [financialYears, setFinancialYears] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/company/settings').then((res) => {
      if (res.data?.data) setSettings(res.data.data);
    });
    api.get('/company/financial-years').then((res) => {
      setFinancialYears(res.data?.data || []);
    });
    if (user?.role === 'CEO') {
      api.get('/users').then((res) => {
        setUsersList(res.data?.data || []);
      });
    }
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'CEO') {
      alert('Restricted: Only CEO is authorized to modify company settings.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/company/settings', settings);
      alert('Company settings updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Company & System Settings"
          subtitle="Configure GST registration, accounting financial years and user access roles"
        />

        <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
          {/* Company Settings Form */}
          <div className="bg-white rounded-xl border border-[#e8edf3] p-6 shadow-[0_1px_2px_rgba(220,225,232,0.35)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8edf3]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#edf6f4] text-[#173e48]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17223a]">
                    Company GST & Legal Profile
                  </h3>
                  <p className="text-xs text-[#758195]">
                    Used for invoicing, statutory reporting & tax identification
                  </p>
                </div>
              </div>
              {user?.role !== 'CEO' && (
                <span className="text-[10px] font-bold text-[#c18a2a] bg-[#fff4df] border border-[#d49422]/30 px-2.5 py-1 rounded-full">
                  Read Only (Accountant View)
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'CEO'}
                    value={settings.legal_name || ''}
                    onChange={(e) => setSettings({ ...settings, legal_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden disabled:bg-[#f6f8fb] font-medium text-[#17223a]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Company GSTIN *</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'CEO'}
                    value={settings.gstin || ''}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden disabled:bg-[#f6f8fb] font-mono font-bold text-[#173e48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Registered Address</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'CEO'}
                    value={settings.address || ''}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden disabled:bg-[#f6f8fb] text-[#17223a]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17223a] mb-1">City</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'CEO'}
                    value={settings.city || ''}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden disabled:bg-[#f6f8fb] text-[#17223a]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17223a] mb-1">State & GST Code</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'CEO'}
                    value={`${settings.state || ''} (${settings.state_code || ''})`}
                    onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden disabled:bg-[#f6f8fb] font-semibold text-[#17223a]"
                  />
                </div>
              </div>

              {user?.role === 'CEO' && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#173e48] hover:bg-[#214e58] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    <Save className="h-4 w-4" /> Save Settings
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Financial Years */}
          <div className="bg-white rounded-xl border border-[#e8edf3] p-6 shadow-[0_1px_2px_rgba(220,225,232,0.35)] space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#e8edf3]">
              <div className="p-2 rounded-lg bg-[#edf6f4] text-[#1b9e76]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#17223a]">Financial Years</h3>
                <p className="text-xs text-[#758195]">
                  Fiscal period control for statutory invoice numbering and reporting
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#e8edf3] text-xs">
              {financialYears.map((fy) => (
                <div key={fy.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#17223a] text-sm">FY {fy.name}</span>
                    <span className="text-[#758195] ml-2">
                      ({fy.start_date} to {fy.end_date})
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#edf6f4] text-[#1b9e76] border border-[#1b9e76]/20">
                    {fy.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* User Roles & Access Control (SRS Section 2) */}
          <div className="bg-white rounded-xl border border-[#e8edf3] p-6 shadow-[0_1px_2px_rgba(220,225,232,0.35)] space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#e8edf3]">
              <div className="p-2 rounded-lg bg-[#edf6f4] text-[#173e48]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#17223a]">
                  User Roles & Access Permissions Matrix
                </h3>
                <p className="text-xs text-[#758195]">
                  Enforced across all REST API endpoints and user interfaces
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fb] font-semibold text-[#8993a5] uppercase tracking-wider text-[11px] border-b border-[#e8edf3]">
                  <tr>
                    <th className="p-3">System Function</th>
                    <th className="p-3 text-center">CEO</th>
                    <th className="p-3 text-center">Accountant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf3]">
                  {[
                    ['Dashboard & Financial Reports', 'Full Access', 'Full Access'],
                    ['Create & Post Invoices', 'Yes', 'Yes'],
                    ['Record Receipts & Payments', 'Yes', 'Yes'],
                    ['Purchase Bills & Expenses', 'Yes', 'Yes'],
                    ['Employee Payroll', 'Yes', 'Yes'],
                    ['Bank & Cash Accounts', 'Yes', 'Yes'],
                    ['Reverse Posted Transactions', 'Yes (Full)', 'Restricted'],
                    ['Manage Users & Passwords', 'Yes', 'No'],
                    ['Manage GST & Company Settings', 'Yes', 'Restricted (Read)'],
                    ['Permanent Delete of Posted Records', 'Prohibited (No)', 'Prohibited (No)'],
                  ].map(([fn, ceo, acc], idx) => (
                    <tr key={idx} className="hover:bg-[#edf6f4]/40 transition-colors">
                      <td className="p-3 font-medium text-[#17223a]">{fn}</td>
                      <td className="p-3 text-center font-bold text-[#173e48]">{ceo}</td>
                      <td className="p-3 text-center font-semibold text-[#758195]">{acc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
