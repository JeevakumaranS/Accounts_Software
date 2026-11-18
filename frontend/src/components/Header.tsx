'use client';

import {
  Calendar,
  Clock,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

export default function Header({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  const { user, login } = useAuthStore();

  const switchRole = async (targetRole: 'CEO' | 'ACCOUNTANT') => {
    if (targetRole === 'CEO') {
      await login('admin@durozen.com', 'Admin@123');
    } else {
      await login('accountant@durozen.com', 'Accountant@123');
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
        {eyebrow && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8993a5]">
            {eyebrow}
          </div>
        )}
          {title || 'Financial Management Dashboard'}
        </h1>
        {subtitle && <p className="text-xs text-slate-500 font-normal">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Financial Year Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs">
          <Calendar className="h-3.5 w-3.5 text-blue-600" />
          <span>FY 2026-27</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {/* Currency & Timezone */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium">
          <Clock className="h-3 w-3 text-slate-400" />
          <span>INR (₹) • Asia/Kolkata</span>
        </div>

        {/* Role Quick Switcher for Easy Verification */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => switchRole('CEO')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              user?.role === 'CEO'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            CEO View
          </button>
          <button
            onClick={() => switchRole('ACCOUNTANT')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              user?.role === 'ACCOUNTANT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Accountant View
          </button>
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  );
}
