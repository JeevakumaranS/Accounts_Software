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
      if (res.data.data) setSettings(res.data.data);
    });
    api.get('/company/financial-years').then((res) => {
      setFinancialYears(res.data.data || []);
    });
    if (user?.role === 'CEO') {
      api.get('/users').then((res) => {
        setUsersList(res.data.data || []);
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Company & System Settings"
          subtitle="Configure GST registration, accounting financial years and user access roles"
        />

        <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
          {/* Company Settings Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Company GST & Legal Profile
                  </h3>
                  <p className="text-xs text-slate-500">
                    Used for invoicing, statutory reporting & tax identification
                  </p>
                </div>
              </div>
              {user?.role !== 'CEO' && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  Read Only (Accountant View)
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'CEO'}
                    value={settings.legal_name || ''}
                    onChange={(e) => setSettings({ ...settings, legal_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company GSTIN *</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'CEO'}
                    value={settings.gstin || ''}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 font-mono font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registered Address</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'CEO'}
                    value={settings.address || ''}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'CEO'}
                    value={settings.city || ''}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State & GST Code</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'CEO'}
                    value={`${settings.state || ''} (${settings.state_code || ''})`}
                    onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              {user?.role === 'CEO' && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    <Save className="h-4 w-4" /> Save Settings
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Financial Years */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Financial Years</h3>
                <p className="text-xs text-slate-500">
                  Fiscal period control for statutory invoice numbering and reporting
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {financialYears.map((fy) => (
                <div key={fy.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">FY {fy.name}</span>
                    <span className="text-slate-500 ml-2">
                      ({fy.start_date} to {fy.end_date})
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {fy.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* User Roles & Access Control (SRS Section 2) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <Shield className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  User Roles & Access Permissions Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Enforced across all REST API endpoints and user interfaces
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">System Function</th>
                    <th className="p-2.5 text-center">CEO</th>
                    <th className="p-2.5 text-center">Accountant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-medium text-slate-900">{fn}</td>
                      <td className="p-2.5 text-center font-bold text-blue-600">{ceo}</td>
                      <td className="p-2.5 text-center font-semibold text-slate-700">{acc}</td>
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
