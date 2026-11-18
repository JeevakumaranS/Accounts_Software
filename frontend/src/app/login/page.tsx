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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/80 p-8 shadow-2xl relative z-10 text-slate-100">
        {/* Brand header */}
        <div className="text-center space-y-2 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/30">
            D
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
            DUROZEN <span className="text-blue-400">ACCOUNTS</span>
          </h1>
          <p className="text-xs text-slate-400">
            Internal Accounting & Financial Control Platform
          </p>
          <div className="text-[11px] text-slate-500 font-mono">
            Durozen Technologies Pvt. Ltd.
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Accounts'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Login Presets for Instant Role Access */}
        <div className="mt-8 pt-6 border-t border-slate-700/60">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick One-Click Test Logins
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => quickLogin('admin@durozen.com', 'Admin@123')}
              className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-700 hover:border-blue-500/50 text-left transition-colors"
            >
              <div className="text-xs font-bold text-blue-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> CEO Role
              </div>
              <div className="text-[10px] text-slate-400 truncate">admin@durozen.com</div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('accountant@durozen.com', 'Accountant@123')}
              className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-700 hover:border-emerald-500/50 text-left transition-colors"
            >
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Accountant
              </div>
              <div className="text-[10px] text-slate-400 truncate">accountant@durozen.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
