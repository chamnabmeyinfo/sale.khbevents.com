'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  ExternalLink, 
  LogOut, 
  ChevronDown, 
  ChevronRight, 
  PlusCircle, 
  Layers, 
  Sparkles,
  UserCheck, 
  Clock, 
  CheckCircle2, 
  Bell, 
  ShieldCheck,
  Building,
  Menu,
  X,
  Sun,
  Activity,
  Sliders
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';

interface SubItem {
  label: string;
  href: string;
  icon: any;
  isHighlight?: boolean;
  badge?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: any;
  href: string;
  isActive: boolean;
  subItems: SubItem[];
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Expanded sub-menus state (default: all expanded or auto-expanded based on pathname)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    dashboard: pathname === '/admin',
    pages: pathname.startsWith('/admin/pages'),
    leads: pathname.startsWith('/admin/leads'),
    roundRobin: pathname.startsWith('/admin/round-robin'),
    settings: pathname.startsWith('/admin/settings')
  });

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await signOut();
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  const navGroups: NavGroup[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin',
      isActive: pathname === '/admin',
      subItems: [
        { label: 'Key Performance Stats', href: '/admin', icon: LayoutDashboard },
        { label: 'Traffic & Page Views', href: '/admin#traffic', icon: Layers },
        { label: 'Recent Inquiries', href: '/admin#recent-leads', icon: Clock },
      ]
    },
    {
      id: 'pages',
      label: 'Landing Pages CMS',
      icon: FileText,
      href: '/admin/pages',
      isActive: pathname.startsWith('/admin/pages'),
      subItems: [
        { label: 'All Campaign Pages', href: '/admin/pages', icon: Layers },
        { label: '+ Create New Page', href: '/admin/pages/new', icon: PlusCircle, isHighlight: true },
        { label: 'Smart City B2B Delegation', href: '/admin/pages/page-smart-city', icon: Sparkles },
        { label: '📊 Page Tracking & Analytics', href: '/admin/pages/page-smart-city/analytics', icon: Activity },
      ]
    },
    {
      id: 'leads',
      label: 'Leads & CRM Pipeline',
      icon: Users,
      href: '/admin/leads',
      isActive: pathname.startsWith('/admin/leads'),
      subItems: [
        { label: 'All Inquiries Pipeline', href: '/admin/leads', icon: Users },
        { label: 'New Client Requests', href: '/admin/leads?status=NEW', icon: Clock, badge: 'NEW' },
        { label: 'In Negotiation', href: '/admin/leads?status=NEGOTIATING', icon: UserCheck },
        { label: 'Won Event Contracts', href: '/admin/leads?status=WON', icon: CheckCircle2 },
      ]
    },
    {
      id: 'roundRobin',
      label: 'Staff Round Robin',
      icon: Sliders,
      href: '/admin/round-robin',
      isActive: pathname.startsWith('/admin/round-robin'),
      subItems: [
        { label: 'Staff Allocations', href: '/admin/round-robin', icon: Users, badge: 'Routing' },
        { label: 'Real-Time Routing Log', href: '/admin/round-robin', icon: Activity },
      ]
    },
    {
      id: 'settings',
      label: 'Settings & Security',
      icon: Settings,
      href: '/admin/settings',
      isActive: pathname.startsWith('/admin/settings'),
      subItems: [
        { label: 'Company Profile & Contact', href: '/admin/settings#profile', icon: Building },
        { label: 'Theme & Appearance', href: '/admin/settings#appearance', icon: Sun },
        { label: 'Telegram Alert Bot', href: '/admin/settings#telegram', icon: Bell },
        { label: 'Owner & Super Admin', href: '/admin/settings#security', icon: ShieldCheck },
      ]
    }
  ];

  const cleanEmail = (user?.email || '').toLowerCase().trim();
  const isSuperAdmin = cleanEmail === 'admin@khbevents.com';
  const isOwner = cleanEmail === 'chamnabmey.info@gmail.com' || (!isSuperAdmin);
  const roleName = isSuperAdmin ? 'SUPER ADMIN' : 'OWNER';
  const roleBadge = isSuperAdmin ? '🛡️' : '👑';
  const displayName = isSuperAdmin
    ? 'Admin KHB'
    : (isOwner ? 'Chamnam Mey' : (user?.user_metadata?.full_name || 'Chamnam Mey'));
  const userDisplayEmail = cleanEmail || (isSuperAdmin ? 'admin@khbevents.com' : 'chamnabmey.info@gmail.com');

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#050D09] border-r border-slate-200 dark:border-emerald-900/30 text-slate-800 dark:text-gray-200 transition-colors duration-200">
      {/* 1. Brand & Header */}
      <div className="p-5 border-b border-slate-200 dark:border-emerald-950/80 bg-gradient-to-b from-slate-50 to-white dark:from-[#08170F] dark:to-[#050D09]">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-700/50 p-2 flex items-center justify-center shadow-lg shadow-emerald-950/80 group-hover:border-amber-400/60 transition-all">
            <Image
              src="/images/khb-logo.png"
              alt="KHB"
              width={30}
              height={30}
              className="object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-amber-400 font-bold text-sm pointer-events-none -z-10">
              KHB
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-wide font-sans">
                KHB <span className="text-amber-500 dark:text-amber-400">PORTAL</span>
              </span>
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400/80 font-mono tracking-wider truncate">
              sale.khbevents.com
            </p>
          </div>
        </Link>

        {/* Role Pill Banner */}
        <div className={`mt-3.5 flex items-center justify-between px-3 py-1.5 rounded-xl border ${
          isSuperAdmin 
            ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300' 
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span>{roleBadge}</span>
            <span>{roleName}</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">Full Access</span>
        </div>
      </div>

      {/* 2. Main Aside Feature Menu + Sub Aside Menus */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-emerald-950">
        <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-emerald-600/70">
          Main Features
        </div>

        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          const isGroupActive = group.isActive;
          const isGroupExpanded = expanded[group.id] ?? isGroupActive;

          return (
            <div key={group.id} className="rounded-xl overflow-hidden mb-1">
              {/* Main Feature Button */}
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  isGroupActive
                    ? 'bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-950 dark:to-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/30'
                }`}
              >
                <Link
                  href={group.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2.5 flex-1 min-w-0"
                >
                  <GroupIcon className={`w-4 h-4 shrink-0 ${isGroupActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                  <span className="text-xs tracking-wide truncate">{group.label}</span>
                </Link>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleExpand(group.id);
                  }}
                  className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white rounded-md transition-colors"
                  aria-label="Toggle Sub Menu"
                >
                  {isGroupExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400/80" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Sub Aside Menu */}
              {isGroupExpanded && (
                <div className="pl-6 pr-1 py-1.5 space-y-1 border-l-2 border-slate-200 dark:border-emerald-900/40 ml-4 my-1">
                  {group.subItems.map((sub, sIdx) => {
                    const SubIcon = sub.icon;
                    const isSubActive = pathname === sub.href;

                    return (
                      <Link
                        key={sIdx}
                        href={sub.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          isSubActive
                            ? 'bg-amber-100 dark:bg-amber-400/15 text-amber-900 dark:text-amber-300 font-bold'
                            : sub.isHighlight
                            ? 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                          <span className="truncate">{sub.label}</span>
                        </div>
                        {sub.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-400 text-black">
                            {sub.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Quick External Actions */}
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-emerald-950/80 px-1 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-emerald-600/70">
            Quick Links
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-emerald-300/80 hover:text-slate-900 dark:hover:text-emerald-200 bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-emerald-950/50 transition-all border border-slate-200 dark:border-emerald-900/30"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Live Public Site</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">↗</span>
          </Link>
          <Link
            href="/smart-city-tea-cafe"
            target="_blank"
            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-emerald-950/30 transition-all"
          >
            <span className="truncate">Smart City B2B</span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">↗</span>
          </Link>
        </div>
      </div>

      {/* 3. Aside Footer: Appearance, Profile & Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-emerald-950 bg-slate-50 dark:bg-[#06120B] space-y-3 transition-colors">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Theme</span>
          <ThemeSwitcher compact={true} />
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-emerald-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-zinc-950 flex items-center justify-center font-extrabold text-xs shrink-0 shadow-md">
              CM
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">{userDisplayEmail}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Left Aside (Fixed on Left, 280px) */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 left-0 z-30 shadow-2xl">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header with Hamburger */}
      <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-[#06120B] border-b border-slate-200 dark:border-emerald-900/40 px-4 py-3 flex items-center justify-between transition-colors">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800/60 text-slate-800 dark:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
            KHB <span className="text-amber-500 dark:text-amber-400">PORTAL</span>
          </span>
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-black">
            OWNER
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeSwitcher compact={true} />
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex-1 max-w-xs w-full h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute right-3 top-3 p-2 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-slate-200 dark:border-zinc-800 z-20"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
