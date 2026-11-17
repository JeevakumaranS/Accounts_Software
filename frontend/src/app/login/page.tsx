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
    <div className="min-h-screen flex items-center justify-center bg-[#174955] p-4 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#214e58]/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#173e48] rounded-2xl border border-[#42636b] p-8 shadow-2xl relative z-10 text-white">
        {/* Brand header */}
        <div className="text-center space-y-2 mb-8">
          <div className="h-12 w-12 rounded-xl bg-[#d5ad78] mx-auto flex items-center justify-center text-[#3d3022] font-black text-2xl shadow-lg">
            D
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
            DUROZEN <span className="text-[#d5ad78]">ACCOUNTS</span>
          </h1>
          <p className="text-xs text-[#c8d8d8]">
            Internal Financial Management & Statutory Accounting
          </p>
          <div className="text-[11px] text-[#8993a5] font-mono">
            Durozen Technologies Pvt. Ltd.
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[#feecef] border border-[#d75a67]/30 text-[#d75a67] text-xs text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#c8d8d8] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#8993a5]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#214e58] border border-[#52747a] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#d5ad78]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#c8d8d8] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#8993a5]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#214e58] border border-[#52747a] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#d5ad78]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#2769d7] hover:bg-[#2059bd] text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Accounts'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Login Presets for Instant Role Access */}
        <div className="mt-8 pt-6 border-t border-[#42636b]">
          <div className="text-[10px] font-bold text-[#8993a5] uppercase tracking-wider text-center mb-3">
            Quick One-Click Test Logins
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => quickLogin('admin@durozen.com', 'Admin@123')}
              className="p-2.5 rounded-lg bg-[#214e58] border border-[#52747a] hover:border-[#d5ad78] text-left transition-colors"
            >
              <div className="text-xs font-bold text-[#d5ad78] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> CEO Role
              </div>
              <div className="text-[10px] text-[#c8d8d8] truncate">admin@durozen.com</div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('accountant@durozen.com', 'Accountant@123')}
              className="p-2.5 rounded-lg bg-[#214e58] border border-[#52747a] hover:border-[#1b9e76] text-left transition-colors"
            >
              <div className="text-xs font-bold text-[#1b9e76] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Accountant
              </div>
              <div className="text-[10px] text-[#c8d8d8] truncate">accountant@durozen.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
