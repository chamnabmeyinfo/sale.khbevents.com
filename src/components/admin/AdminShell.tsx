'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isLoginPage = pathname === '/admin/login';

  const { t } = useLanguage();

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Generate breadcrumb info based on path
  const getBreadcrumb = () => {
    if (pathname === '/admin') return t('crumb.dashboard');
    if (pathname === '/admin/pages') return t('crumb.pages');
    if (pathname === '/admin/pages/new') return t('crumb.pagesNew');
    if (pathname.startsWith('/admin/pages/')) return t('crumb.pagesEdit');
    if (pathname.startsWith('/admin/leads')) return t('crumb.leads');
    if (pathname.startsWith('/admin/round-robin')) return t('crumb.roundRobin');
    if (pathname.startsWith('/admin/ads')) return t('crumb.ads');
    if (pathname.startsWith('/admin/settings')) return t('crumb.settings');
    if (pathname.startsWith('/admin/guide')) return t('crumb.guide');
    return t('crumb.admin');
  };

  const cleanEmail = (user?.email || '').toLowerCase().trim();
  const isSuperAdmin = cleanEmail === 'admin@khbevents.com';
  const roleName = isSuperAdmin ? `🛡️ ${t('nav.role.superAdmin')}` : `👑 ${t('nav.role.owner')}`;
  const userName = isSuperAdmin ? 'Admin KHB' : 'Chamnam Mey';

  return (
    <div className="admin-shell min-h-screen bg-[#F8FAFC] dark:bg-[#070E0A] text-slate-900 dark:text-gray-100 selection:bg-amber-400 selection:text-black transition-colors duration-200">
      {/* Left Aside Navigation (Fixed on desktop, sliding drawer on mobile) */}
      <AdminSidebar />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white/95 dark:bg-[#050D09]/95 backdrop-blur-md border-b border-slate-200 dark:border-emerald-900/30 sticky top-0 z-20 shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-slate-400 dark:text-zinc-500 font-mono">PORTAL</span>
              <span className="text-slate-300 dark:text-zinc-600">/</span>
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold tracking-wide">{getBreadcrumb()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>{t('shell.liveDb')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {/* Theme Switcher: Light / Dark / Auto */}
            <ThemeSwitcher />

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-emerald-950/60 hover:bg-slate-200 dark:hover:bg-emerald-900/60 border border-slate-200 dark:border-emerald-800/50 text-slate-700 dark:text-emerald-300 hover:text-black dark:hover:text-white text-xs font-semibold transition-all shadow-sm"
            >
              <span>{t('shell.viewSite')}</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            </Link>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-sm">
              <span>{roleName}</span>
              <span className="text-slate-400 dark:text-zinc-500 font-normal">|</span>
              <span className="text-slate-900 dark:text-white">{userName}</span>
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
