'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Users,
  ShoppingCart,
  Landmark,
  BookOpen,
  Calculator,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  ceoOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Sales & Invoices', href: '/invoices', icon: FileText },
  { name: 'Receivables', href: '/receivables', icon: ArrowDownToLine },
  { name: 'Payables', href: '/payables', icon: ArrowUpFromLine },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Employees & Payroll', href: '/payroll', icon: Users },
  { name: 'Purchases (Bills)', href: '/vendor-bills', icon: ShoppingCart },
  { name: 'Cash & Bank', href: '/cash-bank', icon: Landmark },
  { name: 'Accounting Ledger', href: '/accounting', icon: BookOpen },
  { name: 'GST Management', href: '/gst', icon: Calculator },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
          D
        </div>
        <div>
          <div className="font-extrabold text-white tracking-wider text-sm flex items-center gap-1.5">
            DUROZEN
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-1.5 py-0.5 rounded border border-blue-500/30">
              ACCOUNTS
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
            Durozen Technologies
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="flex-1 truncate">{item.name}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-blue-200 opacity-80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile & Session footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center gap-2.5 truncate">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold border border-slate-600 shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || 'Authorized User'}
              </div>
              <div className="text-[10px] text-blue-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3 w-3" />
                {user?.role || 'CEO'}
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
