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
  Megaphone,
  type LucideIcon
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { translate } from '@/lib/i18n';
import { guide } from '@/lib/i18n/dict/guide';

type GuideTab = 'all' | 'quickstart' | 'pages' | 'leads' | 'roundrobin' | 'settings' | 'ads' | 'faqs';

/**
 * Searchable text of one guide section: every 'guide.<section>.*' string in
 * both English and Khmer, so the search box matches whichever language the
 * operator types in (and the legacy keyword lists, kept as '.keywords').
 */
const SECTION_TEXT: Record<string, string> = {};
function sectionText(section: string): string {
  if (!SECTION_TEXT[section]) {
    const prefix = `guide.${section}.`;
    SECTION_TEXT[section] = Object.keys(guide.en)
      .filter((key) => key.startsWith(prefix))
      .map((key) => `${translate('en', key)} ${translate('kh', key)}`)
      .join(' ');
  }
  return SECTION_TEXT[section];
}

const CODE_CLASS = 'bg-slate-200 dark:bg-black px-2 py-0.5 rounded font-mono';

export default function UserGuideClient() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<GuideTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navTabs: { id: GuideTab; label: string; icon: LucideIcon; badge?: string }[] = [
    { id: 'all', label: t('guide.tab.all'), icon: BookOpen },
    { id: 'quickstart', label: t('guide.tab.quickstart'), icon: Clock },
    { id: 'pages', label: t('guide.tab.pages'), icon: FileText, badge: t('guide.tab.badgeCore') },
    { id: 'leads', label: t('guide.tab.leads'), icon: Users, badge: t('guide.tab.badgeSales') },
    { id: 'roundrobin', label: t('guide.tab.roundrobin'), icon: Sliders },
    { id: 'settings', label: t('guide.tab.settings'), icon: Settings },
    { id: 'ads', label: t('guide.tab.ads'), icon: Megaphone },
    { id: 'faqs', label: t('guide.tab.faqs'), icon: HelpCircle },
  ];

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const showSection = (tab: GuideTab) => (activeTab === 'all' || activeTab === tab) && matchesSearch(sectionText(tab));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-[#071F14] to-[#0A2619] border border-emerald-800/40 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('guide.header.badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {t('guide.header.title')}
            </h1>
            <p className="text-emerald-100/80 text-sm leading-relaxed">
              {t('guide.header.intro')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href="/admin/pages/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-300 shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('guide.header.createPage')}</span>
            </Link>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/60 border border-emerald-600/50 text-emerald-100 font-semibold text-xs hover:bg-emerald-800/60 transition"
            >
              <Users className="w-4 h-4" />
              <span>{t('guide.header.viewLeads')}</span>
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
            placeholder={t('guide.search.placeholder')}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#0B1711] border border-slate-200 dark:border-emerald-900/40 text-xs text-slate-800 dark:text-gray-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 text-xs"
            >
              {t('guide.search.clear')}
            </button>
          )}
        </div>
      </div>

      {/* 3. Guide Sections */}
      <div className="space-y-8">
        
        {/* SECTION 1: QUICK START */}
        {showSection('quickstart') && (
          <section id="quickstart" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {t('guide.quickstart.title')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {t('guide.quickstart.subtitle')}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-emerald-950/60 font-semibold text-slate-600 dark:text-emerald-300 border border-slate-200 dark:border-emerald-900/40">
                {t('guide.quickstart.badge')}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{t('guide.quickstart.credentials')}</span>
                </h3>
                <div className="text-xs space-y-2 text-slate-600 dark:text-gray-300">
                  <p><strong>{t('guide.quickstart.portalUrl')}</strong> <code className={`${CODE_CLASS} text-emerald-700 dark:text-emerald-300`}>https://sale.khbevents.com/admin/login</code></p>
                  <p><strong>{t('guide.quickstart.defaultEmail')}</strong> <code className={CODE_CLASS}>admin@khbevents.com</code></p>
                  <p><strong>{t('guide.quickstart.defaultPassword')}</strong> <code className={CODE_CLASS}>khbevents2026</code></p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    {t('guide.quickstart.passwordTip')}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>{t('guide.quickstart.sections')}</span>
                </h3>
                <ul className="text-xs space-y-1.5 text-slate-600 dark:text-gray-300">
                  <li><strong>{t('guide.quickstart.dashboardLabel')}</strong> {t('guide.quickstart.dashboardText')}</li>
                  <li><strong>{t('guide.quickstart.pagesLabel')}</strong> {t('guide.quickstart.pagesText')}</li>
                  <li><strong>{t('guide.quickstart.leadsLabel')}</strong> {t('guide.quickstart.leadsText')}</li>
                  <li><strong>{t('guide.quickstart.roundRobinLabel')}</strong> {t('guide.quickstart.roundRobinText')}</li>
                  <li><strong>{t('guide.quickstart.settingsLabel')}</strong> {t('guide.quickstart.settingsText')}</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: LANDING PAGES CMS */}
        {showSection('pages') && (
          <section id="landing-pages" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {t('guide.pages.title')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {t('guide.pages.subtitle')}
                  </p>
                </div>
              </div>
              <Link
                href="/admin/pages/new"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{t('guide.pages.open')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 mb-1">
                  {t('guide.pages.step1')}
                </h4>
                <p>{t('guide.pages.step1Before')}<strong>{t('guide.pages.step1Button')}</strong>{t('guide.pages.step1After')}</p>
                <div className="grid sm:grid-cols-3 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#060D09] border border-emerald-900/30">
                    <strong className="text-slate-900 dark:text-white block">{t('guide.pages.tplB2b')}</strong>
                    <span className="text-[11px] text-slate-500 dark:text-gray-400">{t('guide.pages.tplB2bDesc')}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#060D09] border border-emerald-900/30">
                    <strong className="text-slate-900 dark:text-white block">{t('guide.pages.tplExpo')}</strong>
                    <span className="text-[11px] text-slate-500 dark:text-gray-400">{t('guide.pages.tplExpoDesc')}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#060D09] border border-emerald-900/30">
                    <strong className="text-slate-900 dark:text-white block">{t('guide.pages.tplConcert')}</strong>
                    <span className="text-[11px] text-slate-500 dark:text-gray-400">{t('guide.pages.tplConcertDesc')}</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('guide.pages.step2')}</h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li><strong>{t('guide.pages.titleLabel')}</strong> {t('guide.common.eg')}<em>{t('guide.pages.titleExample')}</em></li>
                    <li><strong>{t('guide.pages.slugLabel')}</strong> {t('guide.common.eg')}<code>korea-b2b-trip-2026</code>{t('guide.pages.slugBecomes')}<code>sale.khbevents.com/korea-b2b-trip-2026</code>{t('guide.common.period')}</li>
                    <li><strong>{t('guide.pages.statusLabel')}</strong> {t('guide.pages.statusBefore')}<strong>{t('guide.pages.statusPublished')}</strong>{t('guide.pages.statusAfter')}</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('guide.pages.step3')}</h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li><strong>{t('guide.pages.datesLabel')}</strong> {t('guide.common.eg')}<code>2026-11-25</code>{t('guide.pages.datesAfter')}</li>
                    <li><strong>{t('guide.pages.countdownLabel')}</strong> {t('guide.pages.countdownText')}</li>
                    <li><strong>{t('guide.pages.seatsLabel')}</strong> {t('guide.pages.seatsBefore')}<code>30</code>{t('guide.pages.seatsMid')}<code>19</code>{t('guide.pages.seatsAfter')}<em>{t('guide.pages.seatsExample')}</em></li>
                    <li><strong>{t('guide.pages.earlyLabel')}</strong> {t('guide.pages.earlyBefore')}<code>$750</code>{t('guide.pages.earlyMid')}<code>$799</code>{t('guide.pages.earlyAfter')}</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('guide.pages.step4')}</h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li><strong>{t('guide.pages.itineraryLabel')}</strong> {t('guide.pages.itineraryText')}</li>
                    <li><strong>{t('guide.pages.packagesLabel')}</strong> {t('guide.pages.packagesText')}</li>
                    <li><strong>{t('guide.pages.valueLabel')}</strong> {t('guide.pages.valueText')}</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('guide.pages.step5')}</h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li>{t('guide.pages.khmerBefore')}<strong>{t('guide.pages.khmerTab')}</strong>{t('guide.pages.khmerAfter')}</li>
                    <li>{t('guide.pages.fontsBefore')}<code>Hanuman</code>{t('guide.pages.fontsMid')}<code>Kantumruy Pro</code>{t('guide.pages.fontsAfter')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: LEADS CRM */}
        {showSection('leads') && (
          <section id="leads-crm" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {t('guide.leads.title')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {t('guide.leads.subtitle')}
                  </p>
                </div>
              </div>
              <Link
                href="/admin/leads"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>{t('guide.leads.open')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="p-3 rounded-2xl bg-amber-400 text-black font-bold text-center text-xs">
                  <span className="block font-black text-sm">{t('guide.leads.statusNew')}</span>
                  <span className="text-[10px] opacity-80">{t('guide.leads.statusNewDesc')}</span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-center text-xs border border-blue-300 dark:border-blue-800">
                  <span className="block font-black text-sm">{t('guide.leads.statusContacted')}</span>
                  <span className="text-[10px] opacity-80">{t('guide.leads.statusContactedDesc')}</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold text-center text-xs border border-purple-300 dark:border-purple-800">
                  <span className="block font-black text-sm">{t('guide.leads.statusProposal')}</span>
                  <span className="text-[10px] opacity-80">{t('guide.leads.statusProposalDesc')}</span>
                </div>
                <div className="p-3 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-bold text-center text-xs border border-orange-300 dark:border-orange-800">
                  <span className="block font-black text-sm">{t('guide.leads.statusNegotiating')}</span>
                  <span className="text-[10px] opacity-80">{t('guide.leads.statusNegotiatingDesc')}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500 text-black font-bold text-center text-xs">
                  <span className="block font-black text-sm">{t('guide.leads.statusWon')}</span>
                  <span className="text-[10px] opacity-80">{t('guide.leads.statusWonDesc')}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-gray-400 font-bold text-center text-xs">
                  <span className="block font-black text-sm">{t('guide.leads.statusLost')}</span>
                  <span className="text-[10px] opacity-80">{t('guide.leads.statusLostDesc')}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-gray-300">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-500" />
                    <span>{t('guide.leads.contactActions')}</span>
                  </h4>
                  <ul className="space-y-1.5 text-[11px]">
                    <li><strong>{t('guide.leads.whatsappLabel')}</strong> {t('guide.leads.whatsappText')}</li>
                    <li><strong>{t('guide.leads.callLabel')}</strong> {t('guide.leads.callText')}</li>
                    <li><strong>{t('guide.leads.demoLabel')}</strong> {t('guide.leads.demoText')}</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-500" />
                    <span>{t('guide.leads.notesExport')}</span>
                  </h4>
                  <ul className="space-y-1.5 text-[11px]">
                    <li><strong>{t('guide.leads.notesLabel')}</strong> {t('guide.leads.notesText')}</li>
                    <li><strong>{t('guide.leads.deleteLabel')}</strong> {t('guide.leads.deleteText')}</li>
                    <li><strong>{t('guide.leads.exportLabel')}</strong> {t('guide.leads.exportText')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: ROUND ROBIN */}
        {showSection('roundrobin') && (
          <section id="round-robin" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {t('guide.roundrobin.title')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {t('guide.roundrobin.subtitle')}
                  </p>
                </div>
              </div>
              <Link
                href="/admin/round-robin"
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>{t('guide.roundrobin.open')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-gray-300">
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
                <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">
                  {t('guide.roundrobin.howTitle')}
                </h4>
                <p>
                  {t('guide.roundrobin.howBefore')}<strong>{t('guide.roundrobin.howTelegram')}</strong>{t('guide.roundrobin.howAfter')}
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px]">
                  <li>{t('guide.roundrobin.step1')}</li>
                  <li><strong>{t('guide.roundrobin.step2Label')}</strong> {t('guide.roundrobin.step2Before')}<code>https://t.me/&lt;staff_telegram&gt;</code>{t('guide.roundrobin.step2After')}</li>
                  <li><strong>{t('guide.roundrobin.step3Label')}</strong> <code>@khb_sale_admin_bot</code>{t('guide.roundrobin.step3Mid')}{t('guide.roundrobin.step3After')}</li>
                </ol>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('guide.roundrobin.addTitle')}</h4>
                  <ul className="space-y-1 text-[11px]">
                    <li><strong>{t('guide.roundrobin.nameLabel')}</strong> {t('guide.common.eg')}<em>{t('guide.roundrobin.nameExample')}</em></li>
                    <li><strong>{t('guide.roundrobin.usernameLabel')}</strong> {t('guide.roundrobin.usernameBefore')}<strong>{t('guide.roundrobin.usernameWithout')}</strong>{t('guide.roundrobin.usernameMid')}<code>@</code>{t('guide.roundrobin.usernameAfter')}<code>your_telegram_name</code>{t('guide.roundrobin.usernameEnd')}</li>
                    <li><strong>{t('guide.roundrobin.weightLabel')}</strong> {t('guide.roundrobin.weightBefore')}<strong>{t('guide.roundrobin.rebalance')}</strong>{t('guide.roundrobin.weightAfter')}</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('guide.roundrobin.leaveTitle')}</h4>
                  <p className="text-[11px]">
                    {t('guide.roundrobin.leaveIntro')}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px]">
                    <li>{t('guide.roundrobin.leave1Before')}<code>/admin/round-robin</code>{t('guide.common.period')}</li>
                    <li>{t('guide.roundrobin.leave2Before')}<strong>{t('guide.roundrobin.leaveOff')}</strong>{t('guide.common.period')}</li>
                    <li>{t('guide.roundrobin.leave3Before')}<strong>{t('guide.roundrobin.rebalance')}</strong>{t('guide.roundrobin.leave3After')}</li>
                    <li>{t('guide.roundrobin.leave4Before')}<strong>{t('guide.roundrobin.leaveOn')}</strong>{t('guide.common.period')}</li>
                  </ol>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: SETTINGS & BOT */}
        {showSection('settings') && (
          <section id="settings" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  5
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {t('guide.settings.title')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {t('guide.settings.subtitle')}
                  </p>
                </div>
              </div>
              <Link
                href="/admin/settings"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{t('guide.settings.open')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-gray-300">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>{t('guide.settings.botTitle')}</span>
                </h4>
                <div className="space-y-2 text-[11px]">
                  <p><strong>{t('guide.settings.botUsername')}</strong> <code className="bg-slate-200 dark:bg-black px-2 py-0.5 rounded text-amber-600 dark:text-amber-400">@khb_sale_admin_bot</code></p>
                  <p><strong>{t('guide.settings.managerChatId')}</strong> <span>{t('guide.settings.chatIdWhere')}</span></p>
                  <p><strong>{t('guide.settings.botToken')}</strong> <span>{t('guide.settings.secretWhere')}</span></p>
                  <p className="text-slate-500 dark:text-gray-400 pt-1">
                    {t('guide.settings.botHelpBefore')}<code>@khb_sale_admin_bot</code>{t('guide.settings.botHelpMid')}<strong>{t('guide.settings.botStart')}</strong>{t('guide.common.period')}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span>{t('guide.settings.hotlinesTitle')}</span>
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  <p><strong>{t('guide.settings.hotline')}</strong> <code>+855 12 888 999</code></p>
                  <p><strong>{t('guide.settings.whatsapp')}</strong> <code>85512888999</code> {t('guide.settings.whatsappNote')}</p>
                  <p><strong>{t('guide.settings.email')}</strong> <code>sale@khbevents.com</code></p>
                  <p><strong>{t('guide.settings.address')}</strong> {t('guide.settings.addressValue')}</p>
                  <p className="text-amber-600 dark:text-amber-400 pt-1">
                    {t('guide.settings.updateNote')}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 6: ADS & POPUPS */}
        {showSection('ads') && (
          <section id="ads" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-emerald-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-500 dark:text-amber-400"><Megaphone className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{t('guide.ads.title')}</h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{t('guide.ads.subtitle')}</p>
                </div>
              </div>
              <Link href="/admin/ads" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs shadow-md"><span>{t('guide.ads.open')}</span></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 dark:text-gray-300">
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('guide.ads.createTitle')}</h3>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li><strong>{t('guide.ads.s1Strong')}</strong>{t('guide.ads.s1After')}</li>
                  <li><strong>{t('guide.ads.s2Strong')}</strong>{t('guide.ads.s2After')}</li>
                  <li><strong>{t('guide.ads.s3Strong')}</strong>{t('guide.ads.s3After')}</li>
                  <li><strong>{t('guide.ads.s4Strong')}</strong>{t('guide.ads.s4After')}</li>
                  <li>{t('guide.ads.s5Before')}<strong>{t('guide.ads.s5Done')}</strong>{t('guide.ads.s5Mid')}<strong>{t('guide.ads.s5SaveAll')}</strong>{t('guide.ads.s5After')}</li>
                </ol>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('guide.ads.rulesTitle')}</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>{t('guide.ads.r1Before')}<strong>{t('guide.ads.r1Strong')}</strong>{t('guide.ads.r1After')}</li>
                  <li>{t('guide.ads.r2Before')}<strong>{t('guide.ads.r2Strong')}</strong>{t('guide.ads.r2After')}</li>
                  <li>{t('guide.ads.r3')}</li>
                  <li>{t('guide.ads.r4')}</li>
                  <li>{t('guide.ads.r5')}</li>
                </ul>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white pt-2">{t('guide.ads.tipsTitle')}</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>{t('guide.ads.tip1')}</li>
                  <li>{t('guide.ads.tip2')}</li>
                  <li>{t('guide.ads.tip3')}</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 7: FAQS & TROUBLESHOOTING */}
        {showSection('faqs') && (
          <section id="faqs" className="rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  6
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {t('guide.faqs.title')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {t('guide.faqs.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{t('guide.faqs.q1')}</span>
                </h4>
                <p className="text-slate-600 dark:text-gray-300 text-[11px]">
                  {t('guide.faqs.a1')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{t('guide.faqs.q2')}</span>
                </h4>
                <p className="text-slate-600 dark:text-gray-300 text-[11px]">
                  {t('guide.faqs.a2')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{t('guide.faqs.q3')}</span>
                </h4>
                <p className="text-slate-600 dark:text-gray-300 text-[11px]">
                  {t('guide.faqs.a3s1')}<br />
                  {t('guide.faqs.a3s2')}<br />
                  {t('guide.faqs.a3s3')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#07120C] border border-slate-200 dark:border-emerald-950 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{t('guide.faqs.q4')}</span>
                </h4>
                <p className="text-slate-600 dark:text-gray-300 text-[11px]">
                  {t('guide.faqs.a4')}
                </p>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
