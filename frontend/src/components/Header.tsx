'use client';

import React from 'react';
import {
  Calendar,
  Clock,
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
    <header className="h-16 border-b border-[#e8edf3] bg-white px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div>
        {eyebrow && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8993a5]">
            {eyebrow}
          </div>
        )}
        <h1 className="text-base font-bold text-[#17223a] tracking-tight">
          {title || 'Financial Management Dashboard'}
        </h1>
        {subtitle && <p className="text-xs text-[#758195] font-normal">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Financial Year Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf6f4] border border-[#dfe5e4] text-[#173e48] text-xs font-semibold shadow-2xs">
          <Calendar className="h-3.5 w-3.5 text-[#28606a]" />
          <span>FY 2026-27</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#1b9e76] animate-pulse"></span>
        </div>

        {/* Currency & Timezone */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f6f8fb] border border-[#e8edf3] text-[#758195] text-[11px] font-medium">
          <Clock className="h-3 w-3 text-[#8993a5]" />
          <span>INR (₹) • Asia/Kolkata</span>
        </div>

        {/* Role Quick Switcher */}
        <div className="flex items-center bg-[#f6f8fb] p-1 rounded-lg border border-[#e8edf3]">
          <button
            onClick={() => switchRole('CEO')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              user?.role === 'CEO'
                ? 'bg-[#173e48] text-white shadow-xs font-bold'
                : 'text-[#758195] hover:text-[#17223a]'
            }`}
          >
            CEO View
          </button>
          <button
            onClick={() => switchRole('ACCOUNTANT')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              user?.role === 'ACCOUNTANT'
                ? 'bg-[#173e48] text-white shadow-xs font-bold'
                : 'text-[#758195] hover:text-[#17223a]'
            }`}
          >
            Accountant View
          </button>
        </div>
      </div>
    </header>
  );
}
