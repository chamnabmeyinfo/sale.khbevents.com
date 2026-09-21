'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  Eye, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  ExternalLink, 
  MessageCircle, 
  Sparkles,
  LayoutDashboard,
  Layers,
  Clock,
  CheckCircle2,
  PhoneCall,
  Search,
  Filter
} from 'lucide-react';
import { LandingPage, Lead } from '@/lib/types';

interface DashboardOverviewClientProps {
  pages: LandingPage[];
  leads: Lead[];
}

type DashboardTab = 'all' | 'kpis' | 'campaigns' | 'inquiries';

export default function DashboardOverviewClient({ pages, leads }: DashboardOverviewClientProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync activeTab with URL hash
  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'traffic' || hash === 'kpis') setActiveTab('kpis');
      else if (hash === 'recent-leads' || hash === 'inquiries') setActiveTab('inquiries');
      else if (hash === 'campaigns') setActiveTab('campaigns');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'NEW').length;
  const wonLeads = leads.filter((l) => l.status === 'WON').length;
  const publishedPages = pages.filter((p) => p.status === 'published').length;
  const totalViews = pages.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0';

  const recentLeads = leads.slice(0, 8);

  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Top Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-[#0C1F16] dark:via-[#091710] dark:to-[#0A1D14] border border-emerald-200 dark:border-emerald-800/50 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors duration-200">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800/50 px-3 py-1 rounded-full shadow-sm">
              KHB EVENTS PORTAL
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">sale.khbevents.com</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Sales & Events Operations Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 max-w-2xl">
            Real-time control center for high-converting landing pages, delegate acquisitions, and corporate event pipelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            href="/admin/pages/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>+ New Landing Page</span>
          </Link>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-emerald-950 hover:bg-slate-50 dark:hover:bg-emerald-900 border border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-300 text-xs font-bold transition-all shadow-sm"
          >
            <Users className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>CRM Pipeline ({newLeads} New)</span>
          </Link>
        </div>
      </div>

      {/* 2. Sub Menu Tabs (Feature Navigation) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-900/40 pb-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Overview', icon: LayoutDashboard, count: null },
            { id: 'kpis', label: 'Performance Metrics', icon: TrendingUp, count: `${conversionRate}% Conv` },
            { id: 'campaigns', label: 'Campaign Pages', icon: Layers, count: pages.length },
            { id: 'inquiries', label: 'Recent Inquiries', icon: Clock, count: totalLeads, badgeColor: 'bg-amber-400 text-black' }
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-500/10'
                    : 'bg-white dark:bg-[#0A1610] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-emerald-900/40'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isActive ? 'bg-black/20 text-black' : (tab.badgeColor || 'bg-slate-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-slate-200 dark:border-emerald-800')
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {(activeTab === 'all' || activeTab === 'campaigns') && (
          <div className="hidden sm:flex items-center relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 absolute left-3" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#08150E] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        )}
      </div>

      {/* 3. Tab: KPIs & Metrics */}
      {(activeTab === 'all' || activeTab === 'kpis') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="rounded-2xl bg-white dark:bg-[#0A1711] border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6 space-y-2 shadow-sm dark:shadow-lg transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Total Inquiries</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{totalLeads}</div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              <span>{newLeads} awaiting contact</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0A1711] border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6 space-y-2 shadow-sm dark:shadow-lg transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Active Pages</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{publishedPages}</div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400 font-semibold">
              {pages.length} total pages in CMS
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0A1711] border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6 space-y-2 shadow-sm dark:shadow-lg transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Tracked Views</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-emerald-950 border border-blue-200 dark:border-emerald-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{totalViews.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400 font-semibold">
              Across all live campaigns
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0A1711] border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6 space-y-2 shadow-sm dark:shadow-lg transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Conversion Rate</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-emerald-950 border border-amber-200 dark:border-emerald-800 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{conversionRate}%</div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
              {wonLeads} deals won / finalized
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab: Campaign Pages & Recent Inquiries (2-col or tab-isolated) */}
      <div className={`grid ${activeTab === 'all' ? 'lg:grid-cols-12 gap-8' : 'grid-cols-1 gap-6'}`}>
        {/* Campaign Pages Section */}
        {(activeTab === 'all' || activeTab === 'campaigns') && (
          <div className={`${activeTab === 'all' ? 'lg:col-span-7' : 'w-full'} space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Landing Pages Performance ({filteredPages.length})</span>
              </h2>
              <Link href="/admin/pages" className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold">
                <span>Manage CMS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 overflow-hidden shadow-sm dark:shadow-xl transition-colors">
              <div className="divide-y divide-slate-100 dark:divide-emerald-950/80">
                {filteredPages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 dark:text-gray-400">No campaigns found.</div>
                ) : (
                  filteredPages.map((page) => {
                    const conv = page.viewsCount > 0 ? ((page.leadsCount / page.viewsCount) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={page.id} className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-emerald-950/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${page.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-gray-500'}`} />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {page.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400">
                            <span className="text-amber-600 dark:text-amber-400 font-mono">/{page.slug}</span>
                            <span>•</span>
                            <span>{page.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs shrink-0">
                          <div className="text-right">
                            <div className="font-bold text-slate-900 dark:text-white">{page.leadsCount} leads</div>
                            <div className="text-[11px] text-slate-500 dark:text-gray-400">{page.viewsCount} views ({conv}%)</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/${page.slug}`}
                              target="_blank"
                              className="p-2 rounded-lg bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-gray-300 hover:text-black dark:hover:text-white border border-slate-200 dark:border-emerald-800/60 transition-colors"
                              title="View Live Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                              href={`/admin/pages/${page.id}`}
                              className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/30 border border-amber-300 dark:border-amber-500/40 text-xs font-bold transition-colors"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Inquiries Section */}
        {(activeTab === 'all' || activeTab === 'inquiries') && (
          <div className={`${activeTab === 'all' ? 'lg:col-span-5' : 'w-full'} space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Recent Inquiries</span>
              </h2>
              <Link href="/admin/leads" className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold">
                <span>View Full CRM</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-4 divide-y divide-slate-100 dark:divide-emerald-950/80 shadow-sm dark:shadow-xl transition-colors">
              {recentLeads.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-gray-400">
                  No inquiries received yet.
                </div>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{lead.fullName}</span>
                        {lead.company && (
                          <span className="text-xs text-slate-500 dark:text-gray-400 ml-1.5">({lead.company})</span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lead.status === 'NEW'
                          ? 'bg-amber-400 text-black'
                          : lead.status === 'WON'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-slate-100 dark:bg-emerald-950 text-slate-800 dark:text-emerald-300 border border-slate-200 dark:border-emerald-800'
                      }`}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-gray-300 flex items-center justify-between">
                      <span>{lead.eventType}</span>
                      {lead.budgetRange && <span className="text-amber-700 dark:text-amber-300 font-semibold">{lead.budgetRange}</span>}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-400 pt-1">
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                      
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(lead.fullName)},%20this%20is%20KHB%20Events%20regarding%20your%20inquiry.`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
