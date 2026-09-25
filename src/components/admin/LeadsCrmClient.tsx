'use client';

import { formatWait, OUTCOME_LABEL } from '@/lib/lead-response';
import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  MessageCircle, 
  Phone, 
  Building, 
  Trash2, 
  ChevronRight,
  X,
  Send,
  Tag
} from 'lucide-react';
import { Lead, LeadStatus, LandingPage } from '@/lib/types';
import { errorMessage } from '@/lib/errors';
import { toWhatsAppNumber } from '@/lib/phone';
import { toCsv } from '@/lib/csv';
import { useLanguage } from '@/context/LanguageContext';

const STATUS_FILTERS = ['ALL', 'NEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'WON', 'LOST'];

interface LeadsCrmClientProps {
  initialLeads: Lead[];
  initialStatus?: string;
  initialLeadId?: string;
  pages: LandingPage[];
}

function getLeadTags(lead: Lead): string[] {
  if (Array.isArray(lead.tags) && lead.tags.length > 0) {
    return lead.tags;
  }
  if (lead.customFields?.campaignTags) {
    return String(lead.customFields.campaignTags)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

const statusColors: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  NEW: { bg: 'bg-amber-400', text: 'text-black font-extrabold', border: 'border-amber-400' },
  CONTACTED: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-800 dark:text-blue-300 font-bold', border: 'border-blue-300 dark:border-blue-500/40' },
  PROPOSAL_SENT: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-800 dark:text-purple-300 font-bold', border: 'border-purple-300 dark:border-purple-500/40' },
  NEGOTIATING: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-800 dark:text-orange-300 font-bold', border: 'border-orange-300 dark:border-orange-500/40' },
  WON: { bg: 'bg-emerald-500', text: 'text-black font-extrabold', border: 'border-emerald-500' },
  LOST: { bg: 'bg-slate-200 dark:bg-gray-800', text: 'text-slate-700 dark:text-gray-400 font-bold', border: 'border-slate-300 dark:border-gray-700' }
};

export default function LeadsCrmClient({ initialLeads, pages, initialStatus, initialLeadId }: LeadsCrmClientProps) {
  const { t, lang } = useLanguage();
  const locale = lang === 'kh' ? 'km-KH' : 'en-GB';
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState('');
  // ?status=NEW (e.g. from the dashboard) sets the starting filter until the user picks one.
  const [chosenStatus, setSelectedStatus] = useState<string | null>(null);
  // Sidebar links (?status=WON) re-render this page with a new initialStatus;
  // let the link win over an earlier manual choice.
  const [linkedStatus, setLinkedStatus] = useState(initialStatus);
  if (linkedStatus !== initialStatus) {
    setLinkedStatus(initialStatus);
    setSelectedStatus(null);
  }
  const selectedStatus = chosenStatus ?? (initialStatus && STATUS_FILTERS.includes(initialStatus) ? initialStatus : 'ALL');
  const [selectedPage, setSelectedPage] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // Telegram alerts link to /admin/leads?id=…; open that lead until the user closes it.
  const [chosenLead, setSelectedLead] = useState<Lead | null | undefined>(undefined);
  const selectedLead = chosenLead === undefined ? (leads.find((l) => l.id === initialLeadId) ?? null) : chosenLead;
  const [newNoteText, setNewNoteText] = useState('');

  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      getLeadTags(l).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [leads]);

  const filteredLeads = leads.filter((lead) => {
    const tags = getLeadTags(lead);
    const searchLower = search.toLowerCase();
    const matchesSearch =
      lead.fullName.toLowerCase().includes(searchLower) ||
      lead.phone.includes(search) ||
      lead.email.toLowerCase().includes(searchLower) ||
      (lead.company && lead.company.toLowerCase().includes(searchLower)) ||
      (lead.message && lead.message.toLowerCase().includes(searchLower)) ||
      lead.eventType.toLowerCase().includes(searchLower) ||
      tags.some((t) => t.toLowerCase().includes(searchLower));

    const matchesStatus = selectedStatus === 'ALL' || lead.status === selectedStatus;
    const matchesPage = selectedPage === 'ALL' || lead.landingPageSlug === selectedPage;
    const matchesTag = selectedTag === 'ALL' || tags.includes(selectedTag);

    return matchesSearch && matchesStatus && matchesPage && matchesTag;
  });

  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: `Status updated to ${newStatus}` })
      });

      const data = await res.json();
      if (res.ok && data.lead) {
        setLeads(leads.map((l) => (l.id === leadId ? data.lead : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead(data.lead);
        }
      } else {
        alert(data.error || t('leads.err.updateStatus'));
      }
    } catch {
      alert(t('leads.err.updateStatusShort'));
    }
  };

  const handleAddNote = async () => {
    if (!selectedLead || !newNoteText.trim()) return;

    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNoteText.trim(), author: 'Admin' })
      });

      const data = await res.json();
      if (res.ok && data.lead) {
        setLeads(leads.map((l) => (l.id === selectedLead.id ? data.lead : l)));
        setSelectedLead(data.lead);
        setNewNoteText('');
      } else {
        alert(data.error || t('leads.err.saveNote'));
      }
    } catch {
      alert(t('leads.err.saveNoteShort'));
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm(t('leads.confirmDelete'))) return;

    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        if (selectedLead?.id === leadId) setSelectedLead(null);
      } else {
        alert(data.error || t('leads.err.delete', { status: res.status }));
      }
    } catch (err) {
      alert(t('leads.err.network', { error: errorMessage(err, String(err)) }));
    }
  };

  const handleExportCsv = () => {
    const headers = [
      t('leads.csv.id'),
      t('leads.csv.createdAt'),
      t('leads.csv.status'),
      t('leads.csv.clientName'),
      t('leads.csv.phone'),
      t('leads.csv.whatsapp'),
      t('leads.csv.email'),
      t('leads.csv.company'),
      t('leads.csv.tags'),
      t('leads.csv.assignedStaff'),
      t('leads.csv.routingStatus'),
      t('leads.csv.routingShare'),
      t('leads.csv.eventType'),
      t('leads.csv.estimatedDate'),
      t('leads.csv.guestCount'),
      t('leads.csv.budgetRange'),
      t('leads.csv.packageInterest'),
      t('leads.csv.landingPage'),
      t('leads.csv.utmSource'),
      t('leads.csv.utmCampaign'),
      t('leads.csv.visitorLocation'),
      t('leads.csv.message')
    ];

    const rows = filteredLeads.map((l) => [
      l.id,
      new Date(l.createdAt).toLocaleString(locale),
      l.status,
      l.fullName,
      l.phone,
      toWhatsAppNumber(l.phone),
      l.email,
      l.company || '',
      getLeadTags(l).join(', '),
      l.routing?.staffName || t('leads.csv.unassigned'),
      l.routing?.status || t('leads.na'),
      l.routing?.percentageWeight ? `${l.routing.percentageWeight}%` : t('leads.na'),
      l.eventType,
      l.estimatedDate || '',
      l.guestCount || '',
      l.budgetRange || '',
      l.packageInterest || '',
      l.landingPageTitle || l.landingPageSlug,
      l.utmSource || t('leads.direct'),
      l.utmCampaign || '',
      [l.customFields?.visitorCity, l.customFields?.visitorCountry].filter(Boolean).join(', '),
      l.message || ''
    ]);

    const csvContent = toCsv(headers, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KHB_Events_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <span>{t('leads.title')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            {t('leads.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 border border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>{t('leads.exportCsv', { n: filteredLeads.length })}</span>
        </button>
      </div>

      {/* Sub Menu Tabs: Status Filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-emerald-900/40 pb-3">
        {[
          { id: 'ALL', label: t('leads.tab.all'), count: leads.length },
          { id: 'NEW', label: t('leads.tab.new'), count: leads.filter(l => l.status === 'NEW').length, badge: 'bg-amber-400 text-black' },
          { id: 'CONTACTED', label: t('leads.tab.contacted'), count: leads.filter(l => l.status === 'CONTACTED').length, badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300' },
          { id: 'PROPOSAL_SENT', label: t('leads.tab.proposals'), count: leads.filter(l => l.status === 'PROPOSAL_SENT').length, badge: 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300' },
          { id: 'NEGOTIATING', label: t('leads.tab.negotiating'), count: leads.filter(l => l.status === 'NEGOTIATING').length, badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300' },
          { id: 'WON', label: t('leads.tab.won'), count: leads.filter(l => l.status === 'WON').length, badge: 'bg-emerald-500 text-black' },
          { id: 'LOST', label: t('leads.tab.lost'), count: leads.filter(l => l.status === 'LOST').length, badge: 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400' }
        ].map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-white dark:bg-[#0A1610] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-emerald-900/40'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold ${
                isActive ? 'bg-black/20 text-black' : (tab.badge || 'bg-slate-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-slate-200 dark:border-emerald-800')
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub Filter Bar: Search, Campaign, Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="relative sm:col-span-6">
          <Search className="w-4 h-4 text-slate-400 dark:text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={t('leads.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#0A1811] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-white dark:bg-[#0A1811] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
          >
            <option value="ALL">{t('leads.allCampaigns', { n: pages.length + 1 })}</option>
            <option value="main-sales">{t('leads.mainPortal')}</option>
            {pages.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3 flex items-center gap-1.5">
          <div className="relative flex-1">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-[#0A1811] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="ALL">{t('leads.allTags', { n: allTags.length })}</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>
          {selectedTag !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedTag('ALL')}
              className="px-2.5 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title={t('leads.clearTagFilter')}
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('leads.clear')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 overflow-hidden shadow-sm dark:shadow-xl transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-gray-300">
            <thead className="bg-slate-50 dark:bg-[#06100B] text-slate-600 dark:text-gray-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-emerald-950">
              <tr>
                <th className="p-4">{t('leads.th.client')}</th>
                <th className="p-4">{t('leads.th.contact')}</th>
                <th className="p-4">{t('leads.th.event')}</th>
                <th className="p-4">{t('leads.th.source')}</th>
                <th className="p-4">{t('common.status')}</th>
                <th className="p-4">{t('common.date')}</th>
                <th className="p-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/80">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-gray-400 text-xs">
                    {t('leads.noMatch')}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const style = statusColors[lead.status] || statusColors.NEW;
                  const leadTags = getLeadTags(lead);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                          {lead.fullName}
                        </div>
                        {lead.company ? (
                          <div className="text-[11px] text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{lead.company}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-gray-400">{t('leads.privateIndividual')}</span>
                        )}

                        {leadTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                            {leadTags.map((tag) => {
                              const isTagActive = selectedTag === tag;
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => setSelectedTag(isTagActive ? 'ALL' : tag)}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                                    isTagActive
                                      ? 'bg-amber-400 text-black shadow-xs'
                                      : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 hover:text-amber-900 dark:hover:text-amber-200 border border-emerald-200 dark:border-emerald-800/60'
                                  }`}
                                  title={t('leads.filterByTag', { tag })}
                                >
                                  <Tag className="w-2.5 h-2.5 opacity-70" />
                                  <span>{tag}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-mono font-medium text-emerald-700 dark:text-emerald-300">{lead.phone}</div>
                        {lead.email && <div className="text-[11px] text-slate-500 dark:text-gray-400">{lead.email}</div>}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{lead.eventType}</div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                          {lead.budgetRange || lead.packageInterest || lead.guestCount || t('leads.noBudget')}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="line-clamp-1 text-slate-800 dark:text-gray-200 text-[11px]">
                          {lead.landingPageTitle}
                        </div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                          {t('leads.utm', { source: lead.utmSource || t('leads.direct') })}
                        </div>
                        {lead.routing && (
                          <div className="flex items-center gap-1 mt-1 text-[10px]">
                            <span className="font-semibold text-slate-700 dark:text-gray-300">
                              {t('leads.rep', { name: lead.routing.staffName })}
                            </span>
                            {lead.routing.status === 'DELIVERED' ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold" title={t('leads.telegramDelivered')}>✓</span>
                            ) : lead.routing.status === 'FALLBACK' ? (
                              <span className="text-amber-700 dark:text-amber-400 font-bold" title={t('leads.fallbackSent')}>⚠️</span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-bold" title={lead.routing.deliveryError || t('leads.failed')}>✕</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value as LeadStatus)}
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${style.bg} ${style.text} ${style.border}`}
                        >
                          <option value="NEW">{t('leads.status.NEW')}</option>
                          <option value="CONTACTED">{t('leads.status.CONTACTED')}</option>
                          <option value="PROPOSAL_SENT">{t('leads.status.PROPOSAL_SENT')}</option>
                          <option value="NEGOTIATING">{t('leads.status.NEGOTIATING')}</option>
                          <option value="WON">{t('leads.status.WON')}</option>
                          <option value="LOST">{t('leads.status.LOST')}</option>
                        </select>
                      </td>

                      <td className="p-4 text-[11px] text-slate-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString(locale)}
                      </td>

                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.phone && (
                            <a
                              href={`https://wa.me/${toWhatsAppNumber(lead.phone)}?text=Hello%20${encodeURIComponent(lead.fullName)},%20this%20is%20KHB%20Events%20regarding%20your%20inquiry.`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 transition-colors"
                              title={t('leads.whatsappTitle')}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-gray-300 hover:text-black dark:hover:text-white border border-slate-200 dark:border-emerald-800/60 cursor-pointer transition-colors"
                            title={t('leads.viewDetails')}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 cursor-pointer transition-colors"
                            title={t('leads.deleteLead')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl h-full bg-white dark:bg-[#09150E] border-l border-slate-200 dark:border-emerald-800/60 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl space-y-6 transition-colors">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-emerald-950">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400 uppercase">{t('leads.leadNo', { id: selectedLead.id })}</span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{selectedLead.fullName}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-200 dark:border-rose-900/60 cursor-pointer transition-colors"
                    title={t('leads.deleteLead')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLead(null)}
                    className="p-2 rounded-lg text-slate-600 dark:text-gray-400 hover:text-black dark:hover:text-white bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800/60 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0C1B13] border border-slate-200 dark:border-emerald-900/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">{t('leads.pipelineStatus')}</span>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value as LeadStatus)}
                  className="text-xs font-bold uppercase px-3 py-1.5 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-emerald-700 text-amber-800 dark:text-amber-300 focus:outline-none cursor-pointer"
                >
                  <option value="NEW">{t('leads.status.NEW')}</option>
                  <option value="CONTACTED">{t('leads.status.CONTACTED')}</option>
                  <option value="PROPOSAL_SENT">{t('leads.status.PROPOSAL_SENT')}</option>
                  <option value="NEGOTIATING">{t('leads.status.NEGOTIATING')}</option>
                  <option value="WON">{t('leads.status.WON_CLOSED')}</option>
                  <option value="LOST">{t('leads.status.LOST')}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/${toWhatsAppNumber(selectedLead.phone)}?text=Hello%20${encodeURIComponent(selectedLead.fullName)},%20this%20is%20KHB%20Events%20regarding%20your%20inquiry.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t('leads.whatsappChat')}</span>
                </a>
                <a
                  href={`tel:${selectedLead.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 border border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <Phone className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>{t('leads.directCall')}</span>
                </a>
              </div>

              <div className="space-y-3 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 text-[11px]">
                  {t('leads.eventParams')}
                </h3>
                
                <div className="grid grid-cols-2 gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-[#06100B] border border-slate-200 dark:border-emerald-950 text-slate-700 dark:text-gray-300">
                  <div>
                    <span className="text-slate-500 dark:text-gray-400 block text-[10px]">{t('common.company')}:</span>
                    <strong className="text-slate-900 dark:text-white">{selectedLead.company || t('leads.na')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-gray-400 block text-[10px]">{t('common.email')}:</span>
                    <strong className="text-slate-900 dark:text-white">{selectedLead.email || t('leads.na')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-gray-400 block text-[10px]">{t('leads.field.eventCategory')}</span>
                    <strong className="text-slate-900 dark:text-white">{selectedLead.eventType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-gray-400 block text-[10px]">{t('leads.field.targetDate')}</span>
                    <strong className="text-slate-900 dark:text-white">{selectedLead.estimatedDate || t('leads.tbd')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-gray-400 block text-[10px]">{t('leads.field.audience')}</span>
                    <strong className="text-slate-900 dark:text-white">{selectedLead.guestCount || t('leads.tbd')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-gray-400 block text-[10px]">{t('leads.field.budget')}</span>
                    <strong className="text-amber-700 dark:text-amber-400 font-bold">{selectedLead.budgetRange || selectedLead.packageInterest || t('leads.tbd')}</strong>
                  </div>
                </div>

                {selectedLead.message && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#06100B] border border-slate-200 dark:border-emerald-950 space-y-1">
                    <span className="text-slate-500 dark:text-gray-400 block text-[10px]">{t('leads.clientMessage')}</span>
                    <p className="text-slate-800 dark:text-gray-200 text-xs leading-relaxed whitespace-pre-wrap">
                      {selectedLead.message}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-emerald-950/30 border border-slate-200 dark:border-emerald-900/40 text-[11px] text-slate-600 dark:text-gray-400 space-y-1">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">{t('leads.attribution')}</div>
                <div>{t('leads.sourceCampaign')} <strong className="text-slate-900 dark:text-white">{selectedLead.landingPageTitle}</strong></div>
                <div>{t('leads.utmSource')} <strong className="text-slate-900 dark:text-white">{selectedLead.utmSource || t('leads.directTraffic')}</strong></div>
                {selectedLead.utmCampaign && <div>{t('leads.campaignName')} <strong className="text-slate-900 dark:text-white">{selectedLead.utmCampaign}</strong></div>}
              </div>

              {getLeadTags(selectedLead).length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-[11px]">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{t('leads.autoTags', { n: getLeadTags(selectedLead).length })}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {getLeadTags(selectedLead).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-400 text-black shadow-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Round Robin Staff Assignment */}
              {selectedLead.routing && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300 text-[11px]">
                      <Users className="w-3.5 h-3.5" />
                      <span>{t('leads.roundRobin')}</span>
                    </div>
                    {selectedLead.routing.status === 'DELIVERED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                        {t('leads.tgDelivered')} {selectedLead.routing.telegramMessageId ? `(#${selectedLead.routing.telegramMessageId})` : ''}
                      </span>
                    ) : selectedLead.routing.status === 'FALLBACK' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                        {t('leads.fallbackManager')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                        {t('leads.tgFailed')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-700 dark:text-gray-300">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t('leads.assignedRep')}</span>
                      <strong className="text-slate-900 dark:text-white">{selectedLead.routing.staffName}</strong>
                      {selectedLead.routing.assignmentReason && selectedLead.routing.assignmentReason !== 'rotation' && (
                        <span className="block text-[10px] font-bold text-sky-700 dark:text-sky-300">
                          🔁 {selectedLead.routing.assignmentReason === 'returning_customer' ? t('leads.returningCustomer') : selectedLead.routing.assignmentReason === 'handover' ? t('leads.handedOver') : t('leads.returningVisitor')}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t('leads.telegramHandle')}</span>
                      <strong className="text-emerald-700 dark:text-emerald-300">@{selectedLead.routing.staffTelegram.replace(/^@/, '')}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t('leads.allocationShare')}</span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{selectedLead.routing.percentageWeight}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t('leads.assignedAt')}</span>
                      <span>{new Date(selectedLead.routing.routedAt).toLocaleTimeString(locale)}</span>
                    </div>
                  </div>

                  {(selectedLead.routing.claim || selectedLead.routing.handovers?.length) && (
                    <div className="text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-900/60 space-y-1 text-slate-700 dark:text-gray-300">
                      {selectedLead.routing.claim ? (
                        <div>
                          <strong className="text-slate-900 dark:text-white">{OUTCOME_LABEL[selectedLead.routing.claim.outcome]}</strong>
                          {' · '}{t('leads.claimBy', { name: selectedLead.routing.claim.staffName, wait: formatWait(selectedLead.routing.claim.seconds) })}
                        </div>
                      ) : (
                        <div className="font-bold text-amber-700 dark:text-amber-400">{t('leads.noTapYet')}</div>
                      )}
                      {(selectedLead.routing.handovers || []).map((h, i) => (
                        <div key={i} className="text-[10px]">➡️ {t('leads.passedOn', { from: h.fromName, to: h.toName, time: new Date(h.at).toLocaleString(locale, { timeZone: 'Asia/Phnom_Penh', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) })}</div>
                      ))}
                    </div>
                  )}

                  {selectedLead.routing.deliveryError && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                      <strong>{t('leads.deliveryError')}</strong> {selectedLead.routing.deliveryError}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 text-[11px]">
                  {t('leads.notesTitle')}
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder={t('leads.notePlaceholder')}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400 transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNote();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
                  {selectedLead.notes && selectedLead.notes.length > 0 ? (
                    selectedLead.notes.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#06100B] border border-slate-200 dark:border-emerald-950 text-xs space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-gray-400">
                          <span className="font-semibold text-amber-700 dark:text-amber-400">{n.author}</span>
                          <span>{new Date(n.createdAt).toLocaleString(locale)}</span>
                        </div>
                        <p className="text-slate-800 dark:text-gray-200">{n.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-gray-400 italic py-2">
                      {t('leads.noNotes')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
