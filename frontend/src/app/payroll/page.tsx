'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { formatINR, formatDate } from '../../lib/format';
import api from '../../lib/api';
import {
  Users,
  Play,
  CheckCircle,
  FileText,
  DollarSign,
  Send,
  Eye,
  PlusCircle,
  X,
  CreditCard,
} from 'lucide-react';

export default function PayrollPage() {
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);

  // New employee modal
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empDept, setEmpDept] = useState('Engineering');
  const [empDesignation, setEmpDesignation] = useState('Software Engineer');
  const [basicSalary, setBasicSalary] = useState('50000');
  const [hra, setHra] = useState('20000');
  const [allowances, setAllowances] = useState('10000');

  // Disburse salary modal
  const [payingItem, setPayingItem] = useState<any | null>(null);
  const [disburseAccountId, setDisburseAccountId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [runRes, empRes, bankRes] = await Promise.all([
        api.get('/payroll'),
        api.get('/employees'),
        api.get('/cash-bank/accounts'),
      ]);
      setPayrollRuns(runRes.data.data || []);
      setEmployees(empRes.data.data || []);
      const banks = bankRes.data.data || [];
      setBankAccounts(banks);
      if (banks.length > 0) setDisburseAccountId(banks[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculatePayroll = async () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    if (!confirm(`Calculate payroll for Month ${month} / ${year}?`)) return;

    try {
      await api.post('/payroll/calculate', { month, year });
      alert('Payroll calculated successfully!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to calculate payroll');
    }
  };

  const handlePostPayroll = async (runId: string) => {
    if (!confirm('Approve and post payroll journal entry to General Ledger?')) return;
    try {
      await api.post(`/payroll/${runId}/post`);
      alert('Payroll journal posted to ledger! Salary liability created.');
      loadData();
      if (selectedRun && selectedRun.id === runId) {
        const updated = await api.get(`/payroll/${runId}`);
        setSelectedRun(updated.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to post payroll');
    }
  };

  const handleDisburseSalary = async () => {
    if (!payingItem || !disburseAccountId) return;
    try {
      await api.post(`/payroll/${payingItem.payroll_run_id}/payments`, {
        item_id: payingItem.id,
        bank_account_id: disburseAccountId,
        payment_mode: 'BANK_TRANSFER',
      });
      alert('Salary payment disbursed and debited from bank account!');
      setPayingItem(null);
      loadData();
      if (selectedRun) {
        const updated = await api.get(`/payroll/${selectedRun.id}`);
        setSelectedRun(updated.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to disburse salary');
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/employees', {
        name: empName,
        department: empDept,
        designation: empDesignation,
        basic_salary: Number(basicSalary),
        hra: Number(hra),
        allowances: Number(allowances),
        joining_date: new Date(),
      });
      alert('Employee created successfully!');
      setShowEmpModal(false);
      setEmpName('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create employee');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          eyebrow="HUMAN CAPITAL & PAYROLL"
          title="Employees & Monthly Payroll"
          subtitle="Manage salary structures, monthly payroll runs & statutory deduction journals"
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-[#17223a]">Monthly Payroll Runs</h2>
              <p className="text-xs text-[#758195]">Gross salary, PF deductions & net payout control</p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowEmpModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#e8edf3] text-[#17223a] text-xs font-semibold hover:bg-[#f6f8fb] shadow-xs"
              >
                <PlusCircle className="h-4 w-4 text-[#2769d7]" />
                <span>Add Employee</span>
              </button>
              <button
                onClick={handleCalculatePayroll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173e48] text-white text-xs font-bold hover:bg-[#214e58] shadow-xs"
              >
                <Play className="h-4 w-4 text-[#d5ad78]" />
                <span>Calculate Current Month</span>
              </button>
            </div>
          </div>

          {/* Payroll Runs List */}
          <div className="bg-white rounded-lg border border-[#e8edf3] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fb] text-[#8993a5] text-[11px] font-bold uppercase tracking-wider border-b border-[#e8edf3]">
                  <tr>
                    <th className="py-3.5 px-4">Period</th>
                    <th className="py-3.5 px-4">Total Employees</th>
                    <th className="py-3.5 px-4 text-right">Total Gross Salary</th>
                    <th className="py-3.5 px-4 text-right">PF & Deductions</th>
                    <th className="py-3.5 px-4 text-right">Net Payable</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollRuns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No payroll runs calculated yet. Click "Calculate Current Month" to generate.
                      </td>
                    </tr>
                  ) : (
                    payrollRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          Month {run.payroll_month} / {run.payroll_year}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {run.items?.length || 0} Employees
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                          {formatINR(run.total_gross)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-rose-600">
                          {formatINR(run.total_deductions)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-blue-600">
                          {formatINR(run.total_net_pay)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              run.status === 'POSTED' || run.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedRun(run)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold text-[10px] flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" /> View Items
                            </button>
                            {run.status === 'CALCULATED' && (
                              <button
                                onClick={() => handlePostPayroll(run.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] flex items-center gap-1"
                              >
                                <Send className="h-3 w-3" /> Post Journal
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Employee Directory Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Employee Master Directory ({employees.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-blue-600">
                      {emp.employee_code}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {emp.status}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900 mt-1">{emp.name}</div>
                  <div className="text-xs text-slate-500">
                    {emp.designation} • {emp.department}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between text-xs">
                    <span className="text-slate-500">Gross Monthly:</span>
                    <span className="font-bold text-slate-900">
                      {formatINR(Number(emp.basic_salary) + Number(emp.hra) + Number(emp.allowances))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View Payroll Run Details Modal */}
        {selectedRun && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Payroll Sheet: Month {selectedRun.payroll_month} / {selectedRun.payroll_year}
                  </h3>
                  <p className="text-xs text-slate-500">Status: {selectedRun.status}</p>
                </div>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Employee</th>
                      <th className="p-3 text-right">Basic</th>
                      <th className="p-3 text-right">HRA & Allowances</th>
                      <th className="p-3 text-right">Gross Earnings</th>
                      <th className="p-3 text-right">PF Deduction (12%)</th>
                      <th className="p-3 text-right font-bold text-blue-600">Net Pay</th>
                      <th className="p-3 text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedRun.items || []).map((itm: any) => (
                      <tr key={itm.id}>
                        <td className="p-3 font-medium text-slate-900">
                          {itm.employee?.name}
                          <div className="text-[10px] text-slate-400 font-mono">
                            {itm.employee?.employee_code}
                          </div>
                        </td>
                        <td className="p-3 text-right">{formatINR(itm.basic)}</td>
                        <td className="p-3 text-right">
                          {formatINR(Number(itm.hra) + Number(itm.allowances))}
                        </td>
                        <td className="p-3 text-right font-medium">{formatINR(itm.gross_earnings)}</td>
                        <td className="p-3 text-right text-rose-600">-{formatINR(itm.pf_deduction)}</td>
                        <td className="p-3 text-right font-bold text-blue-600">
                          {formatINR(itm.net_pay)}
                        </td>
                        <td className="p-3 text-center">
                          {itm.payment_status === 'PAID' ? (
                            <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded">
                              Disbursed
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setPayingItem(itm);
                              }}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700"
                            >
                              Disburse
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Disburse Salary Payment Modal */}
        {payingItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                Disburse Salary to {payingItem.employee?.name}
              </h3>
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-semibold text-slate-900">{payingItem.employee?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Account:</span>
                  <span className="font-mono text-slate-700">
                    {payingItem.employee?.bank_name} - {payingItem.employee?.bank_account_number}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-blue-600 pt-1 border-t border-slate-200">
                  <span>Net Salary Amount:</span>
                  <span>{formatINR(payingItem.net_pay)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pay From Company Account *
                </label>
                <select
                  value={disburseAccountId}
                  onChange={(e) => setDisburseAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.account_name} ({formatINR(b.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingItem(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDisburseSalary}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Confirm Payout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Employee Modal */}
        {showEmpModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="font-bold text-sm text-slate-900">Add New Employee</h3>
                <button onClick={() => setShowEmpModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={empDept}
                      onChange={(e) => setEmpDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={empDesignation}
                      onChange={(e) => setEmpDesignation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Basic (₹)</label>
                    <input
                      type="number"
                      required
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">HRA (₹)</label>
                    <input
                      type="number"
                      value={hra}
                      onChange={(e) => setHra(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Allowances (₹)</label>
                    <input
                      type="number"
                      value={allowances}
                      onChange={(e) => setAllowances(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmpModal(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Save Employee
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
