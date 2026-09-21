import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import { getPages, getLeads } from '@/lib/storage';
import { 
  Users, 
  FileText, 
  Eye, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  ExternalLink, 
  MessageCircle, 
  Sparkles
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect('/admin/login');
  }

  const [pages, leads] = await Promise.all([getPages(), getLeads()]);

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'NEW').length;
  const publishedPages = pages.filter((p) => p.status === 'published').length;
  const totalViews = pages.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0';

  const recentLeads = leads.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0C1F16] via-[#091710] to-[#0A1D14] border border-emerald-800/50 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/50 px-3 py-0.5 rounded-full">
              KHB EVENTS CAMBODIA
            </span>
            <span className="text-xs text-emerald-400 font-medium">sale.khbevents.com</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to the Sales & Landing Portal
          </h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Manage campaigns, create high-converting landing pages, and convert event inquiries in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/pages/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>New Landing Page</span>
          </Link>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-semibold transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Leads CRM ({newLeads} New)</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl bg-[#0A1711] border border-emerald-900/50 p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{totalLeads}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{newLeads} awaiting contact</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0A1711] border border-emerald-900/50 p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Pages</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{publishedPages}</div>
          <div className="text-[11px] text-gray-400">
            {pages.length} total pages in CMS
          </div>
        </div>

        <div className="rounded-2xl bg-[#0A1711] border border-emerald-900/50 p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tracked Views</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{totalViews.toLocaleString()}</div>
          <div className="text-[11px] text-gray-400">
            Across all campaigns
          </div>
        </div>

        <div className="rounded-2xl bg-[#0A1711] border border-emerald-900/50 p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conversion Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400">{conversionRate}%</div>
          <div className="text-[11px] text-emerald-400">
            High conversion sales funnel
          </div>
        </div>
      </div>

      {/* Two Column Layout: Pages Performance & Recent Leads */}
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Landing Pages Performance</span>
            </h2>
            <Link href="/admin/pages" className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold">
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl bg-[#0A1610] border border-emerald-900/50 overflow-hidden shadow-lg">
            <div className="divide-y divide-emerald-950/80">
              {pages.map((page) => {
                const conv = page.viewsCount > 0 ? ((page.leadsCount / page.viewsCount) * 100).toFixed(1) : '0.0';
                return (
                  <div key={page.id} className="p-4 sm:p-5 hover:bg-emerald-950/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${page.status === 'published' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                        <h3 className="text-sm font-bold text-white line-clamp-1">
                          {page.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="text-amber-400 font-mono">/{page.slug}</span>
                        <span>•</span>
                        <span>{page.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-white">{page.leadsCount} leads</div>
                        <div className="text-[11px] text-gray-400">{page.viewsCount} views ({conv}%)</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${page.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg bg-emerald-950 text-gray-300 hover:text-white border border-emerald-800/60"
                          title="View Live"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/admin/pages/${page.id}`}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Recent Inquiries</span>
            </h2>
            <Link href="/admin/leads" className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold">
              <span>View CRM Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl bg-[#0A1610] border border-emerald-900/50 p-4 divide-y divide-emerald-950/80 shadow-lg">
            {recentLeads.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No inquiries received yet.
              </div>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{lead.fullName}</span>
                      {lead.company && (
                        <span className="text-xs text-gray-400 ml-1.5">({lead.company})</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      lead.status === 'NEW'
                        ? 'bg-amber-400 text-black'
                        : lead.status === 'WON'
                        ? 'bg-emerald-500 text-black'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-300 flex items-center justify-between">
                    <span>{lead.eventType}</span>
                    {lead.budgetRange && <span className="text-amber-300 font-semibold">{lead.budgetRange}</span>}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(lead.fullName)},%20this%20is%20KHB%20Events%20regarding%20your%20inquiry.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
