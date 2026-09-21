import { redirect, notFound } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getPageById, getPageAnalytics } from '@/lib/storage';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ExternalLink, 
  Activity, 
  Users, 
  Eye, 
  TrendingUp, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Clock, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PageAnalyticsDashboard({ params }: PageProps) {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  const { id } = await params;
  const page = await getPageById(id);

  if (!page) {
    notFound();
  }

  const analytics = await getPageAnalytics(page.slug);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-emerald-900/40">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/pages/${page.id}`}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-slate-700 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-emerald-950 transition-colors"
            title="Back to Page Editor"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                <span>FIRST-PARTY ANALYTICS</span>
              </span>
              <span className="text-xs text-slate-400 dark:text-gray-500 font-mono">/{page.slug}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {page.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/pages/${page.id}?tab=tracking`}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-800 bg-white dark:bg-emerald-950/60 text-slate-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-emerald-900 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Pixels &amp; UTM Setup</span>
          </Link>
          <a
            href={`/${page.slug}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Live Page</span>
          </a>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs font-semibold">
            <span>Total Page Views</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {analytics.totalViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-gray-500">
            Ad-blocker proof first-party views
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs font-semibold">
            <span>Unique Visitors</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {analytics.uniqueVisitors.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-gray-500">
            Deduplicated session fingerprints
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs font-semibold">
            <span>Leads Captured</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-500">
            {analytics.totalLeads.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-gray-500">
            Verified inquiries in CRM
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs font-semibold">
            <span>Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-3xl font-black text-teal-600 dark:text-teal-400">
            {analytics.conversionRate}%
          </div>
          <div className="text-[11px] text-slate-400 dark:text-gray-500">
            Leads / Total Page Views
          </div>
        </div>
      </div>

      {/* ── Conversion Funnel & Traffic Acquisition ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funnel Progress */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Conversion Funnel Drop-off</span>
            </h3>
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400">Milestone Drop</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                <span>1. Landed on Page</span>
                <span className="font-bold text-slate-900 dark:text-white">{analytics.funnel.views} (100%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-emerald-950 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                <span>2. Read &gt; 50% of Page</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {analytics.funnel.scrolled50} ({Math.min(100, Math.round((analytics.funnel.scrolled50 / (analytics.funnel.views || 1)) * 100))}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-emerald-950 overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full" 
                  style={{ width: `${Math.min(100, Math.round((analytics.funnel.scrolled50 / (analytics.funnel.views || 1)) * 100))}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                <span>3. Clicked CTA / Picked Seat</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {analytics.funnel.clickedCta} ({Math.min(100, Math.round((analytics.funnel.clickedCta / (analytics.funnel.views || 1)) * 100))}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-emerald-950 overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full" 
                  style={{ width: `${Math.min(100, Math.round((analytics.funnel.clickedCta / (analytics.funnel.views || 1)) * 100))}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                <span>4. Submitted Delegation Lead</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {analytics.funnel.leadsSubmitted} ({analytics.conversionRate}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-emerald-950 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${Math.min(100, Math.round((analytics.funnel.leadsSubmitted / (analytics.funnel.views || 1)) * 100))}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Channels */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Traffic Sources Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 dark:text-gray-500">UTMs &amp; Referrers</span>
          </div>

          <div className="space-y-3">
            {analytics.topSources.map((src, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/40 text-xs">
                <span className="font-bold capitalize text-slate-800 dark:text-white">{src.source}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 dark:text-gray-400">{src.count} views</span>
                  <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[11px]">
                    {src.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Device & Language summary */}
          <div className="pt-3 border-t border-slate-200 dark:border-emerald-900/40 grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-gray-500">Devices</span>
              <div className="flex items-center gap-3 text-slate-700 dark:text-gray-300">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" /> {analytics.deviceBreakdown.mobile} Mobile
                </span>
                <span className="flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5 text-slate-400" /> {analytics.deviceBreakdown.desktop} Desktop
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-gray-500">Language Engagement</span>
              <div className="flex items-center gap-3 text-slate-700 dark:text-gray-300">
                <span>🇰🇭 ខ្មែរ: <strong>{analytics.languageBreakdown.kh}</strong></span>
                <span>🇬🇧 English: <strong>{analytics.languageBreakdown.en}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Visitor Events Stream ── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Recent Visitor Activity Stream</span>
          </h3>
          <span className="text-xs text-slate-400 dark:text-gray-500">Real-time interactions</span>
        </div>

        {analytics.recentEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-emerald-900/60 text-slate-500 dark:text-gray-400">
                  <th className="py-2.5 px-3 font-semibold">Event Type</th>
                  <th className="py-2.5 px-3 font-semibold">Source / UTM</th>
                  <th className="py-2.5 px-3 font-semibold">Device</th>
                  <th className="py-2.5 px-3 font-semibold">Language</th>
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/60">
                {analytics.recentEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-emerald-950/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        evt.eventType === 'form_submit'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : evt.eventType === 'telegram_click'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : evt.eventType === 'seat_select'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                          : evt.eventType === 'scroll_depth'
                          ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                          : 'bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-400'
                      }`}>
                        {evt.eventType}
                        {evt.eventData?.depth ? ` (${evt.eventData.depth}%)` : ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-gray-300 truncate max-w-[200px]">
                      {evt.utmSource || evt.referrer || 'Direct'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-gray-400 capitalize">
                      {evt.deviceType || 'mobile'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-gray-400 uppercase font-mono text-[11px]">
                      {evt.lang || 'en'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-gray-400 font-mono text-[11px]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-gray-400">
            No visitor events recorded yet. Open the live page to test event tracking!
          </div>
        )}
      </div>
    </div>
  );
}
