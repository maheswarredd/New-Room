import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  CheckSquare,
  FileSpreadsheet,
  Settings,
  UserCheck,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { isAdmin } = useAuth();

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/members', label: 'Room Members', icon: Users },
    { to: '/admin/expenses', label: 'All Expenses', icon: Receipt },
    { to: '/admin/payments', label: 'Payments & Dues', icon: CreditCard },
    { to: '/admin/tasks', label: 'Pending Work', icon: CheckSquare },
    { to: '/admin/ledger', label: 'Monthly Ledger', icon: FileSpreadsheet },
    { to: '/admin/settings', label: 'Room Settings', icon: Settings },
  ];

  const memberLinks = [
    { to: '/member/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/member/expenses', label: 'Room Expenses', icon: Receipt },
    { to: '/member/payments', label: 'My Payments', icon: CreditCard },
    { to: '/member/tasks', label: 'My Assigned Work', icon: CheckSquare },
    { to: '/member/profile', label: 'My Profile', icon: User },
  ];

  const links = isAdmin ? adminLinks : memberLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-slate-100">
          <span className="font-bold text-slate-800 text-sm">Navigation Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Admin Console' : 'Member Portal'}
            </p>
            <p className="text-xs font-medium text-slate-600 mt-0.5 truncate">
              {isAdmin ? 'Full Room Controller' : 'Personal Room View'}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 mt-auto">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 via-slate-50 to-emerald-50 border border-indigo-100/60 p-3">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Room Management Live
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Expenses, splits, bills & tasks kept up to date.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
