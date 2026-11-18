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
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Sales & Invoices', href: '/invoices', icon: FileText },
  { name: 'Receivables', href: '/receivables', icon: ArrowDownToLine },
  { name: 'Purchases (Bills)', href: '/vendor-bills', icon: ShoppingCart },
  { name: 'Payables', href: '/payables', icon: ArrowUpFromLine },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Employees & Payroll', href: '/payroll', icon: Users },
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
    <aside className="w-64 bg-[#173e48] text-[#c8d8d8] flex flex-col shrink-0 h-screen sticky top-0 border-r border-[#42636b]/40 z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#42636b]/50 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-[#d5ad78] text-[#3d3022] font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
          D
        </div>
        <div className="leading-tight">
          <div className="font-extrabold text-white tracking-wider text-sm flex items-center gap-1.5">
            DUROZEN
            <span className="text-[10px] text-[#c7d7d9] font-bold border-l border-[#668087] pl-1.5">
              ACCOUNTS
            </span>
          </div>
          <div className="text-[11px] text-[#a9bec0] truncate max-w-[140px] font-medium mt-0.5">
            Durozen Technologies
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-[#8faab0] uppercase tracking-wider">
          Financial Management
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
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors group ${
                isActive
                  ? 'bg-[#2a606b] text-white font-semibold shadow-xs'
                  : 'text-[#c8d8d8] hover:text-white hover:bg-[#28606a]'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-[#a9bec0] group-hover:text-white'
                }`}
              />
              <span className="flex-1 truncate">{item.name}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-[#d5ad78]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Card in Sidebar */}
      <div className="p-3 border-t border-[#42636b]/50 bg-[#173e48]">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#214e58] border border-[#52747a]">
          <div className="flex items-center gap-2.5 truncate">
            <div className="h-8 w-8 rounded-lg bg-[#d5ad78] text-[#3d3022] font-black text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AU'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name || 'Authorized User'}
              </div>
              <div className="text-[10px] text-[#b8ced0] flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3 w-3 text-[#d5ad78]" />
                {user?.role || 'CEO'}
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 text-[#c8d8d8] hover:text-white hover:bg-[#28606a] rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
