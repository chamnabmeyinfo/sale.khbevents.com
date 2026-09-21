'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Generate breadcrumb info based on path
  const getBreadcrumb = () => {
    if (pathname === '/admin') return 'Dashboard Overview';
    if (pathname === '/admin/pages') return 'Landing Pages CMS';
    if (pathname === '/admin/pages/new') return 'Landing Pages CMS / Create New Page';
    if (pathname.startsWith('/admin/pages/')) return 'Landing Pages CMS / Edit Campaign';
    if (pathname.startsWith('/admin/leads')) return 'Leads & CRM Pipeline';
    if (pathname.startsWith('/admin/settings')) return 'Settings & Security';
    return 'Admin';
  };

  const cleanEmail = (user?.email || '').toLowerCase().trim();
  const isSuperAdmin = cleanEmail === 'admin@khbevents.com';
  const roleName = isSuperAdmin ? '🛡️ SUPER ADMIN' : '👑 OWNER';
  const userName = isSuperAdmin ? 'Admin KHB' : 'Chamnam Mey';

  return (
    <div className="min-h-screen bg-[#070E0A] text-gray-100 selection:bg-amber-400 selection:text-black">
      {/* Left Aside Navigation (Fixed on desktop, sliding drawer on mobile) */}
      <AdminSidebar />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-[#050D09]/95 backdrop-blur-md border-b border-emerald-900/30 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <span className="text-zinc-500 font-mono">PORTAL</span>
              <span className="text-zinc-600">/</span>
              <span className="text-emerald-300 font-semibold tracking-wide">{getBreadcrumb()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live DB Online</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Switcher: Light / Dark / Auto */}
            <ThemeSwitcher />

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
            >
              <span>View Public Site</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </Link>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
              <span>{roleName}</span>
              <span className="text-zinc-500 font-normal">|</span>
              <span className="text-white">{userName}</span>
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
