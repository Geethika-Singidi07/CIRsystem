import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  FilePlus2,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AppShellProps {
  mode: 'citizen' | 'admin';
  breadcrumb: string;
  children: React.ReactNode;
}

export function AppShell({ mode, breadcrumb, children }: AppShellProps) {
  const { user, userProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(mode === 'admin' ? '/admin/login' : '/login');
  };

  const navItems =
    mode === 'admin'
      ? [
          { to: '/admin', label: 'All Complaints', icon: ClipboardList, end: true },
          { to: '/admin/staff', label: 'Admin Access', icon: Users, end: false },
          { to: '/dashboard', label: 'Citizen View', icon: UserCircle2, end: false },
        ]
      : [
          { to: '/dashboard', label: 'My Complaints', icon: ClipboardList, end: true },
          { to: '/submit', label: 'Submit Issue', icon: FilePlus2, end: false },
          { to: '/profile', label: 'Account Profile', icon: UserCircle2, end: false },
          ...(isAdmin ? [{ to: '/admin', label: 'Admin Console', icon: ShieldCheck, end: false }] : []),
        ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col bg-civic-navy text-white shrink-0 border-r border-slate-800">
        <div className="h-16 px-6 flex items-center border-b border-white/10">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            CIRS Portal
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5" aria-label="Workspace navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-civic-royal text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-3 py-2.5 mb-2 rounded-lg bg-white/5">
            <p className="text-xs font-semibold text-white truncate">
              {userProfile?.fullName || user?.displayName || 'Verified Account'}
            </p>
            <p className="text-xs text-slate-300 truncate">{user?.email}</p>
            <p className="text-[11px] text-emerald-300 mt-1 font-medium">
              {mode === 'admin' ? 'Administrator Access' : userProfile?.communityName || 'Citizen'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-full bg-civic-navy text-white flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-bold text-white whitespace-nowrap shrink-0"
              >
                CIRS Portal
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-slate-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-5 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-civic-royal text-white'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
              <span className="font-medium text-civic-navy whitespace-nowrap shrink-0">
                {mode === 'admin' ? 'Admin Console' : 'Citizen Portal'}
              </span>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-slate-900 truncate">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {mode === 'citizen' ? (
              <Link
                to="/submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-civic-royal hover:bg-civic-royal-hover rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Report Issue
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign Out
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1200px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
