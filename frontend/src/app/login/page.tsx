'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('admin@durozen.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const quickLogin = async (eUser: string, ePass: string) => {
    setEmail(eUser);
    setPassword(ePass);
    setLoading(true);
    setError('');
    const res = await login(eUser, ePass);
    setLoading(false);
    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundColor: '#174955',
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 16px)',
      }}
    >
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#d5e0dd] p-8 shadow-2xl relative z-10 text-[#203a3f]">
        {/* Brand Header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="h-12 w-12 rounded-xl bg-[#d5ad78] text-[#3d3022] mx-auto flex items-center justify-center font-black text-xl shadow-md">
            D
          </div>
          <div className="text-lg font-extrabold tracking-tight text-[#174955] flex items-center justify-center gap-1.5 pt-2">
            DUROZEN
            <span className="text-xs text-[#648084] font-bold border-l border-[#bdcbca] pl-2">
              ACCOUNTS
            </span>
          </div>
          <p className="eyebrow text-[10px] text-[#8993a5] tracking-widest uppercase">
            FINANCIAL OPERATIONS & LEDGER
          </p>
          <p className="text-xs text-[#768689]">
            Sign in to your financial control workspace.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-[#feecef] border border-[#d75a67]/30 text-[#d75a67] text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#52676b] mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#8993a5]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d5e0dd] rounded-lg text-xs text-[#203a3f] font-medium focus:outline-none focus:ring-2 focus:ring-[#287c78]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#52676b] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#8993a5]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d5e0dd] rounded-lg text-xs text-[#203a3f] font-medium focus:outline-none focus:ring-2 focus:ring-[#287c78]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#287c78] hover:bg-[#206562] text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Accounts'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Login Presets */}
        <div className="mt-6 pt-5 border-t border-[#e8edf3]">
          <div className="text-[10px] font-bold text-[#8993a5] uppercase tracking-wider text-center mb-3">
            Quick One-Click Test Logins
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => quickLogin('admin@durozen.com', 'Admin@123')}
              className="p-2.5 rounded-lg bg-[#f7faf9] border border-[#d9e5e2] hover:border-[#287c78] text-left transition-colors"
            >
              <div className="text-xs font-bold text-[#287c78] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> CEO Role
              </div>
              <div className="text-[10px] text-[#768689] truncate">admin@durozen.com</div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('accountant@durozen.com', 'Accountant@123')}
              className="p-2.5 rounded-lg bg-[#f7faf9] border border-[#d9e5e2] hover:border-[#1b9e76] text-left transition-colors"
            >
              <div className="text-xs font-bold text-[#1b9e76] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Accountant
              </div>
              <div className="text-[10px] text-[#768689] truncate">accountant@durozen.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
