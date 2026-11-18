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
      setPayrollRuns(runRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
      const banks = bankRes.data?.data || [];
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
        setSelectedRun(updated.data?.data || null);
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
        setSelectedRun(updated.data?.data || null);
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
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#e8edf3] text-[#17223a] text-xs font-semibold hover:bg-[#f6f8fb] shadow-xs transition-colors"
              >
                <PlusCircle className="h-4 w-4 text-[#758195]" />
                <span>Add Employee</span>
              </button>
              <button
                onClick={handleCalculatePayroll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173e48] text-white text-xs font-semibold hover:bg-[#214e58] shadow-xs transition-colors"
              >
                <Play className="h-4 w-4" />
                <span>Calculate Current Month</span>
              </button>
            </div>
          </div>

          {/* Payroll Runs List */}
          <div className="bg-white rounded-xl border border-[#e8edf3] overflow-hidden shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fb] text-[#8993a5] uppercase tracking-wider text-[11px] font-semibold border-b border-[#e8edf3]">
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
                <tbody className="divide-y divide-[#e8edf3]">
                  {payrollRuns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#758195]">
                        No payroll runs calculated yet. Click "Calculate Current Month" to generate.
                      </td>
                    </tr>
                  ) : (
                    payrollRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-[#edf6f4]/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#17223a]">
                          Month {run.payroll_month} / {run.payroll_year}
                        </td>
                        <td className="py-3.5 px-4 text-[#758195] font-medium">
                          {run.items?.length || 0} Employees
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-[#17223a]">
                          {formatINR(run.total_gross)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-[#d75a67]">
                          {formatINR(run.total_deductions)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#173e48]">
                          {formatINR(run.total_net_pay)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              run.status === 'POSTED' || run.status === 'PAID'
                                ? 'bg-[#edf6f4] text-[#1b9e76] border border-[#1b9e76]/20'
                                : 'bg-[#fff4df] text-[#c18a2a] border border-[#d49422]/20'
                            }`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedRun(run)}
                              className="px-2.5 py-1 bg-[#f6f8fb] hover:bg-[#edf6f4] border border-[#e8edf3] rounded-md text-[#17223a] font-semibold text-[10px] flex items-center gap-1 transition-colors"
                            >
                              <Eye className="h-3 w-3" /> View Items
                            </button>
                            {run.status === 'CALCULATED' && (
                              <button
                                onClick={() => handlePostPayroll(run.id)}
                                className="px-2.5 py-1 bg-[#173e48] hover:bg-[#214e58] text-white rounded-md font-bold text-[10px] flex items-center gap-1 transition-colors"
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
          <div className="bg-white rounded-xl border border-[#e8edf3] p-5 shadow-[0_1px_2px_rgba(220,225,232,0.35)]">
            <h3 className="text-sm font-bold text-[#17223a] mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#173e48]" />
              Employee Master Directory ({employees.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-4 rounded-xl border border-[#e8edf3] bg-[#f6f8fb]/50 hover:bg-[#f6f8fb] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-[#173e48]">
                      {emp.employee_code}
                    </span>
                    <span className="text-[10px] font-semibold text-[#1b9e76] bg-[#edf6f4] border border-[#1b9e76]/20 px-2 py-0.5 rounded-full">
                      {emp.status}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-[#17223a] mt-1">{emp.name}</div>
                  <div className="text-xs text-[#758195]">
                    {emp.designation} • {emp.department}
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#e8edf3] flex justify-between text-xs">
                    <span className="text-[#758195]">Gross Monthly:</span>
                    <span className="font-bold text-[#17223a]">
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
          <div className="fixed inset-0 z-50 bg-[#0a2025]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#e8edf3]">
              <div className="flex items-center justify-between pb-3 border-b border-[#e8edf3]">
                <div>
                  <h3 className="text-base font-bold text-[#17223a]">
                    Payroll Sheet: Month {selectedRun.payroll_month} / {selectedRun.payroll_year}
                  </h3>
                  <p className="text-xs text-[#758195]">Status: {selectedRun.status}</p>
                </div>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="p-1 text-[#758195] hover:text-[#17223a] rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border border-[#e8edf3] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f6f8fb] text-[#8993a5] uppercase tracking-wider text-[11px] font-semibold border-b border-[#e8edf3]">
                    <tr>
                      <th className="p-3">Employee</th>
                      <th className="p-3 text-right">Basic</th>
                      <th className="p-3 text-right">HRA & Allowances</th>
                      <th className="p-3 text-right">Gross Earnings</th>
                      <th className="p-3 text-right">PF Deduction (12%)</th>
                      <th className="p-3 text-right font-bold text-[#173e48]">Net Pay</th>
                      <th className="p-3 text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8edf3]">
                    {(selectedRun.items || []).map((itm: any) => (
                      <tr key={itm.id} className="hover:bg-[#edf6f4]/40 transition-colors">
                        <td className="p-3 font-medium text-[#17223a]">
                          {itm.employee?.name}
                          <div className="text-[10px] text-[#758195] font-mono">
                            {itm.employee?.employee_code}
                          </div>
                        </td>
                        <td className="p-3 text-right text-[#17223a]">{formatINR(itm.basic)}</td>
                        <td className="p-3 text-right text-[#758195]">
                          {formatINR(Number(itm.hra) + Number(itm.allowances))}
                        </td>
                        <td className="p-3 text-right font-medium text-[#17223a]">{formatINR(itm.gross_earnings)}</td>
                        <td className="p-3 text-right text-[#d75a67]">-{formatINR(itm.pf_deduction)}</td>
                        <td className="p-3 text-right font-bold text-[#173e48]">
                          {formatINR(itm.net_pay)}
                        </td>
                        <td className="p-3 text-center">
                          {itm.payment_status === 'PAID' ? (
                            <span className="text-[#1b9e76] font-bold text-[10px] bg-[#edf6f4] border border-[#1b9e76]/20 px-2 py-0.5 rounded-full">
                              Disbursed
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setPayingItem(itm);
                              }}
                              className="px-2.5 py-1 bg-[#173e48] hover:bg-[#214e58] text-white rounded text-[10px] font-bold transition-colors"
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
          <div className="fixed inset-0 z-50 bg-[#0a2025]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#e8edf3]">
              <h3 className="font-bold text-sm text-[#17223a] flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#173e48]" />
                Disburse Salary to {payingItem.employee?.name}
              </h3>
              <div className="p-3 bg-[#f6f8fb] rounded-xl text-xs space-y-1.5 border border-[#e8edf3]">
                <div className="flex justify-between">
                  <span className="text-[#758195]">Employee:</span>
                  <span className="font-semibold text-[#17223a]">{payingItem.employee?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#758195]">Bank Account:</span>
                  <span className="font-mono text-[#17223a]">
                    {payingItem.employee?.bank_name} - {payingItem.employee?.bank_account_number}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[#173e48] pt-1.5 border-t border-[#e8edf3]">
                  <span>Net Salary Amount:</span>
                  <span>{formatINR(payingItem.net_pay)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17223a] mb-1">
                  Pay From Company Account *
                </label>
                <select
                  value={disburseAccountId}
                  onChange={(e) => setDisburseAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden text-xs font-medium text-[#17223a]"
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
                  className="px-3.5 py-1.5 rounded-lg bg-[#f6f8fb] border border-[#e8edf3] text-[#758195] text-xs font-semibold hover:bg-[#edf6f4]/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDisburseSalary}
                  className="px-4 py-1.5 rounded-lg bg-[#173e48] hover:bg-[#214e58] text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Confirm Payout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Employee Modal */}
        {showEmpModal && (
          <div className="fixed inset-0 z-50 bg-[#0a2025]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#e8edf3]">
              <div className="flex items-center justify-between pb-2 border-b border-[#e8edf3]">
                <h3 className="font-bold text-sm text-[#17223a]">Add New Employee</h3>
                <button onClick={() => setShowEmpModal(false)} className="text-[#758195] hover:text-[#17223a] transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#17223a] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden text-[#17223a]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">Department</label>
                    <input
                      type="text"
                      value={empDept}
                      onChange={(e) => setEmpDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden text-[#17223a]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">Designation</label>
                    <input
                      type="text"
                      value={empDesignation}
                      onChange={(e) => setEmpDesignation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden text-[#17223a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">Basic (₹)</label>
                    <input
                      type="number"
                      required
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden font-bold text-[#173e48]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">HRA (₹)</label>
                    <input
                      type="number"
                      value={hra}
                      onChange={(e) => setHra(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden text-[#17223a]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17223a] mb-1">Allowances (₹)</label>
                    <input
                      type="number"
                      value={allowances}
                      onChange={(e) => setAllowances(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8edf3] focus:border-[#173e48] focus:ring-1 focus:ring-[#173e48] outline-hidden text-[#17223a]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmpModal(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#f6f8fb] border border-[#e8edf3] text-[#758195] font-semibold hover:bg-[#edf6f4]/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#173e48] hover:bg-[#214e58] text-white font-bold transition-colors shadow-xs"
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
