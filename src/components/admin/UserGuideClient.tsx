'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  FileText,
  Users,
  Sliders,
  Settings,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Bell,
  MessageCircle,
  Phone,
  Download,
  ShieldCheck,
  PlusCircle,
  Clock,
  Layers,
  type LucideIcon
} from 'lucide-react';

type GuideTab = 'all' | 'quickstart' | 'pages' | 'leads' | 'roundrobin' | 'settings' | 'faqs';

export default function UserGuideClient() {
  const [activeTab, setActiveTab] = useState<GuideTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navTabs: { id: GuideTab; label: string; icon: LucideIcon; badge?: string }[] = [
    { id: 'all', label: 'Complete Blueprint', icon: BookOpen },
    { id: 'quickstart', label: '1. Quick Start & Login', icon: Clock },
    { id: 'pages', label: '2. Landing Pages CMS', icon: FileText, badge: 'Core' },
    { id: 'leads', label: '3. Leads CRM Pipeline', icon: Users, badge: 'Sales' },
    { id: 'roundrobin', label: '4. Round-Robin & Bot', icon: Sliders },
    { id: 'settings', label: '5. Settings & Alerts', icon: Settings },
    { id: 'faqs', label: '6. Operator FAQs', icon: HelpCircle },
  ];

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-[#071F14] to-[#0A2619] border border-emerald-800/40 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official System Operator Guide • KHB EVENTS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Platform User Guide &amp; Blueprint
            </h1>
            <p className="text-emerald-100/80 text-sm leading-relaxed">
              Step-by-step instructions for event directors, marketing managers, and sales representatives on launching landing pages, managing inbound buyer leads, and configuring sales team routing.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href="/admin/pages/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-300 shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Page</span>
            </Link>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/60 border border-emerald-600/50 text-emerald-100 font-semibold text-xs hover:bg-emerald-800/60 transition"
            >
              <Users className="w-4 h-4" />
              <span>View Leads CRM</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                    : 'bg-white dark:bg-[#0B1711] text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-emerald-900/40 hover:border-emerald-500/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md uppercase font-extrabold ${
                    isActive ? 'bg-black/30 text-amber-300' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides or FAQs..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#0B1711] border border-slate-200 dark:border-emerald-900/40 text-xs text-slate-800 dark:text-gray-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 3. Guide Sections */}
      <div className="space-y-8">
        
        {/* SECTION 1: QUICK START */}
        {(activeTab === 'all' || activeTab === 'quickstart') && matchesSearch('quick start login password admin navigation') && (
          <section id="quickstart" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    Quick Start: Logging In &amp; Navigation
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Access credentials and main portal sections
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-emerald-950/60 font-semibold text-slate-600 dark:text-emerald-300 border border-slate-200 dark:border-emerald-900/40">
                Setup
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Admin Login Credentials</span>
                </h3>
                <div className="text-xs space-y-2 text-slate-600 dark:text-gray-300">
                  <p><strong>Portal URL:</strong> <code className="bg-slate-200 dark:bg-black px-2 py-0.5 rounded text-emerald-700 dark:text-emerald-300 font-mono">https://sale.khbevents.com/admin/login</code></p>
                  <p><strong>Default Email:</strong> <code className="bg-slate-200 dark:bg-black px-2 py-0.5 rounded font-mono">admin@khbevents.com</code></p>
                  <p><strong>Default Password:</strong> <code className="bg-slate-200 dark:bg-black px-2 py-0.5 rounded font-mono">khbevents2026</code></p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    💡 You can change the password anytime in Settings &rarr; Security.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Portal Sections Overview</span>
                </h3>
                <ul className="text-xs space-y-1.5 text-slate-600 dark:text-gray-300">
                  <li><strong>Dashboard (`/admin`):</strong> High-level stats, conversion rates, and recent client requests.</li>
                  <li><strong>Landing Pages (`/admin/pages`):</strong> Create, duplicate, and publish campaigns.</li>
                  <li><strong>Leads CRM (`/admin/leads`):</strong> Process buyer inquiries, 1-click WhatsApp chat, and team notes.</li>
                  <li><strong>Round Robin (`/admin/round-robin`):</strong> Distribute leads fairly among your sales team.</li>
                  <li><strong>Settings (`/admin/settings`):</strong> Hotline phone, Telegram bot, and manager notifications.</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: LANDING PAGES CMS */}
        {(activeTab === 'all' || activeTab === 'pages') && matchesSearch('landing page create campaign template itinerary value stack packages pricing') && (
          <section id="landing-pages" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    How to Create &amp; Launch a New Landing Page
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Step-by-step guide to publishing high-ticket business delegations and event campaigns
                  </p>
                </div>
              </div>
              <Link
                href="/admin/pages/new"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Open Page Creator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 mb-1">
                  Step 1: Choose an Industry Template
                </h4>
                <p>When you click <strong>&quot;+ New Page&quot;</strong>, choose from 5 built-in presets:</p>
                <div className="grid sm:grid-cols-3 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#060D09] border border-emerald-900/30">
                    <strong className="text-slate-900 dark:text-white block">B2B Trade Delegation</strong>
                    <span className="text-[11px] text-slate-500 dark:text-gray-400">For foreign business trips (Vietnam, Korea). Includes 4D3N itinerary, value stack &amp; 1-on-1 matchmaking.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#060D09] border border-emerald-900/30">
                    <strong className="text-slate-900 dark:text-white block">Trade Expo &amp; Exhibition</strong>
                    <span className="text-[11px] text-slate-500 dark:text-gray-400">For expos with booth tiers (Corner, Island, Shell Scheme) and exhibitor registration.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#060D09] border border-emerald-900/30">
                    <strong className="text-slate-900 dark:text-white block">Concert &amp; Festival</strong>
                    <span className="text-[11px] text-slate-500 dark:text-gray-400">For mega-events with artist/DJ lineups, set times, VIP pit passes, and party tables.</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">Step 2: Core Info &amp; Slug</h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li><strong>Title:</strong> e.g., <em>Korea B2B Business Delegation 2026 (Seoul)</em></li>
                    <li><strong>URL Slug:</strong> e.g., <code>korea-b2b-trip-2026</code> becomes <code>sale.khbevents.com/korea-b2b-trip-2026</code>.</li>
                    <li><strong>Status:</strong> Set to <strong>Published</strong> when ready to go live.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">Step 3: Dates, Venue &amp; Urgency</h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li><strong>Event Dates:</strong> e.g., <code>2026-11-25</code> (4 Days / 3 Nights).</li>
                    <li><strong>Countdown Timer:</strong> Enable to show live ticking countdown.</li>
                    <li><strong>Seats Scarcity:</strong> Set Total <code>30</code> and Claimed <code>19</code> to show <em>&quot;Only 11 seats remaining!&quot;</em></li>
                    <li><strong>Early Bird Pricing:</strong> Enter discount price (e.g. <code>$750</code> vs <code>$799</code> regular).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">Step 4: Itinerary &amp; Packages</h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li><strong>Itinerary Tab:</strong> Add Day 1, Day 2, Day 3 with times and activities (factory visits, B2B dinners).</li>
                    <li><strong>Packages Tab:</strong> Add pass tiers (Executive Pass, VIP Chairman Pass).</li>
                    <li><strong>Value Stack Tab:</strong> Checklist of inclusions with dollar values (Flights $450, Hotel $300, Badges $150).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">Step 5: Khmer Translation (ខ្មែរ)</h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li>Click the <strong>Khmer Tab</strong> in the editor to enter Khmer headlines and itinerary.</li>
                    <li>The system renders with native Khmer typography (<code>Hanuman</code> / <code>Kantumruy Pro</code>) with custom 1.8 line spacing.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: LEADS CRM */}
        {(activeTab === 'all' || activeTab === 'leads') && matchesSearch('leads crm pipeline status won contacted whatsapp notes csv export') && (
          <section id="leads-crm" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    How to Manage Inbound Leads in the CRM
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Qualify prospects, message on WhatsApp, record notes, and close deals
                  </p>
                </div>
              </div>
              <Link
                href="/admin/leads"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Open Leads CRM</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="p-3 rounded-2xl bg-amber-400 text-black font-bold text-center text-xs">
                  <span className="block font-black text-sm">NEW</span>
                  <span className="text-[10px] opacity-80">Call in 15 mins</span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-center text-xs border border-blue-300 dark:border-blue-800">
                  <span className="block font-black text-sm">CONTACTED</span>
                  <span className="text-[10px] opacity-80">First call made</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold text-center text-xs border border-purple-300 dark:border-purple-800">
                  <span className="block font-black text-sm">PROPOSAL</span>
                  <span className="text-[10px] opacity-80">Invoice sent</span>
                </div>
                <div className="p-3 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-bold text-center text-xs border border-orange-300 dark:border-orange-800">
                  <span className="block font-black text-sm">NEGOTIATING</span>
                  <span className="text-[10px] opacity-80">Discussing terms</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500 text-black font-bold text-center text-xs">
                  <span className="block font-black text-sm">WON</span>
                  <span className="text-[10px] opacity-80">Deposit paid!</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-gray-400 font-bold text-center text-xs">
                  <span className="block font-black text-sm">LOST</span>
                  <span className="text-[10px] opacity-80">Declined / deferred</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-gray-300">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-500" />
                    <span>1-Click Contact Actions</span>
                  </h4>
                  <ul className="space-y-1.5 text-[11px]">
                    <li><strong>WhatsApp Chat:</strong> Click to immediately open a pre-filled chat with the client with a personalized greeting.</li>
                    <li><strong>Call Dialer:</strong> Click the phone icon to dial their phone directly from your smartphone or Mac.</li>
                    <li><strong>Visitor Demographics:</strong> View country flags (🇰🇭 Cambodia, 🇻🇳 Vietnam, 🇰🇷 South Korea, 🇺🇸 USA) and detected city to tailor your pitch.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-500" />
                    <span>Notes &amp; CSV Export</span>
                  </h4>
                  <ul className="space-y-1.5 text-[11px]">
                    <li><strong>Team Notes:</strong> Type updates in the note box (e.g., *&quot;Client wants 2 VIP passes and invoice by Friday&quot;*). Every note records the author and timestamp.</li>
                    <li><strong>Delete Lead:</strong> Click the red trash button to remove test or spam submissions safely.</li>
                    <li><strong>Export CSV:</strong> Click &quot;Export CSV&quot; to download an instant spreadsheet for weekly executive meetings.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: ROUND ROBIN */}
        {(activeTab === 'all' || activeTab === 'roundrobin') && matchesSearch('round robin sales team staff allocation telegram bot routing direct chat') && (
          <section id="round-robin" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    How to Manage the Round-Robin Sales Team
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Automated lead rotation, staff quotas, and direct Telegram redirection
                  </p>
                </div>
              </div>
              <Link
                href="/admin/round-robin"
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>Open Round Robin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-gray-300">
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
                <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">
                  How Inbound Lead Routing Works
                </h4>
                <p>
                  When a client clicks the floating <strong>Telegram</strong> button or submits a booking form on any landing page:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px]">
                  <li>The Round-Robin algorithm selects the next eligible sales representative according to configured weights.</li>
                  <li><strong>Instant Direct Redirect:</strong> The visitor&apos;s Telegram app opens immediately to chat with the assigned sales rep (<code>https://t.me/&lt;staff_telegram&gt;</code>).</li>
                  <li><strong>Silent Bot Notification:</strong> <code>@khb_sale_admin_bot</code> simultaneously sends lead details to the rep and to the Event Director (Chat ID: <code>5746705393</code>).</li>
                </ol>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">Adding or Editing Sales Reps</h4>
                  <ul className="space-y-1 text-[11px]">
                    <li><strong>Full Name &amp; Title:</strong> e.g., <em>Your Name - Sales Consultant</em></li>
                    <li><strong>Telegram Username:</strong> Enter username <strong>WITHOUT</strong> the <code>@</code> symbol (e.g. <code>your_telegram_name</code>).</li>
                    <li><strong>Percentage Weight:</strong> Set their share (e.g. 20% each for 5 reps). Click <strong>&quot;Rebalance Weights&quot;</strong> to sum to 100%.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">Handling Staff on Leave / Vacation</h4>
                  <p className="text-[11px]">
                    If a sales consultant is out of the office or on leave:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px]">
                    <li>Find their card in <code>/admin/round-robin</code>.</li>
                    <li>Toggle their status to <strong>OFF (Idle)</strong>.</li>
                    <li>Click <strong>&quot;Rebalance Weights&quot;</strong> so their leads are automatically redirected to active reps.</li>
                    <li>When they return, toggle them back <strong>ON (Active)</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: SETTINGS & BOT */}
        {(activeTab === 'all' || activeTab === 'settings') && matchesSearch('settings telegram bot token chat id password hotline address') && (
          <section id="settings" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  5
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    How to Configure Settings &amp; Telegram Bot Alerts
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Official hotlines, bot API tokens, and real-time manager alerts
                  </p>
                </div>
              </div>
              <Link
                href="/admin/settings"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Open Settings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-gray-300">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Official Telegram Alert Bot</span>
                </h4>
                <div className="space-y-2 text-[11px]">
                  <p><strong>Bot Username:</strong> <code className="bg-slate-200 dark:bg-black px-2 py-0.5 rounded text-amber-600 dark:text-amber-400">@khb_sale_admin_bot</code></p>
                  <p><strong>Manager Chat ID:</strong> <code className="bg-slate-200 dark:bg-black px-2 py-0.5 rounded font-mono">5746705393</code></p>
                  <p><strong>Bot Token:</strong> <code className="bg-slate-200 dark:bg-black px-2 py-0.5 rounded font-mono text-[10px]">8808252369:AAH-avDR3sXatJoHx6qOFfsN2p9lpNyXqkw</code></p>
                  <p className="text-slate-500 dark:text-gray-400 pt-1">
                    To receive alerts on your phone, open Telegram, search for <code>@khb_sale_admin_bot</code>, and tap <strong>Start</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span>Company Hotlines &amp; Location</span>
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  <p><strong>Hotline:</strong> <code>+855 12 888 999</code></p>
                  <p><strong>WhatsApp:</strong> <code>85512888999</code> (without + sign)</p>
                  <p><strong>Email:</strong> <code>sale@khbevents.com</code></p>
                  <p><strong>Address:</strong> Diamond Island (Koh Pich), Phnom Penh, Cambodia</p>
                  <p className="text-amber-600 dark:text-amber-400 pt-1">
                    Updating these fields automatically updates the navbar and footer on all landing pages.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 6: FAQS & TROUBLESHOOTING */}
        {(activeTab === 'all' || activeTab === 'faqs') && matchesSearch('faq troubleshooting sold out early bird duplicate export') && (
          <section id="faqs" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  6
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    Operator &quot;How Do I...&quot; Cheat Sheet
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Quick answers to common questions and operational tasks
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>How do I change the Early Bird price or extend the deadline?</span>
                </h4>
                <p className="text-slate-600 dark:text-gray-300 text-[11px]">
                  Go to <strong>Landing Pages</strong> &rarr; Click <strong>Edit</strong> on the campaign &rarr; Open the <strong>Event &amp; Urgency</strong> tab &rarr; Update <em>Early Bird Price</em> and <em>Early Bird Deadline</em> &rarr; Click <strong>Save Landing Page</strong>. Changes are live immediately.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>How do I mark a campaign as &quot;Sold Out&quot;?</span>
                </h4>
                <p className="text-slate-600 dark:text-gray-300 text-[11px]">
                  Edit the landing page &rarr; Go to the <strong>Isolated Settings</strong> tab &rarr; Toggle <strong>&quot;Mark as Sold Out&quot;</strong> to ON &rarr; Enter your custom message (e.g. <em>&quot;All 30 seats booked! Join the waitlist&quot;</em>) &rarr; Save. The booking form will disable or show a waitlist button.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>A sales rep is not receiving Telegram alerts. What should I check?</span>
                </h4>
                <p className="text-slate-600 dark:text-gray-300 text-[11px]">
                  1. Have the rep open Telegram, search for <code>@khb_sale_admin_bot</code>, and tap <strong>Start</strong>.<br />
                  2. Check that their <strong>Telegram Username</strong> in <code>/admin/round-robin</code> is spelled correctly without <code>@</code>.<br />
                  3. Verify that their status is toggled <strong>Active (ON)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>How do I create a new business trip for Japan or Europe?</span>
                </h4>
                <p className="text-slate-600 dark:text-gray-300 text-[11px]">
                  Go to <strong>Landing Pages</strong> &rarr; Click <strong>Duplicate</strong> on the Korea trip card &rarr; Change the title, slug (e.g. <code>japan-b2b-trip-2026</code>), dates, venue, and itinerary &rarr; Save. Your new page is live at <code>sale.khbevents.com/japan-b2b-trip-2026</code>!
                </p>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
