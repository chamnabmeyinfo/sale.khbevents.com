'use client';

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
  Send
} from 'lucide-react';
import { Lead, LeadStatus, LandingPage } from '@/lib/types';

interface LeadsCrmClientProps {
  initialLeads: Lead[];
  pages: LandingPage[];
}

const statusColors: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  NEW: { bg: 'bg-amber-400', text: 'text-black', border: 'border-amber-400' },
  CONTACTED: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' },
  PROPOSAL_SENT: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  NEGOTIATING: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40' },
  WON: { bg: 'bg-emerald-500', text: 'text-black', border: 'border-emerald-500' },
  LOST: { bg: 'bg-gray-800', text: 'text-gray-400', border: 'border-gray-700' }
};

export default function LeadsCrmClient({ initialLeads, pages }: LeadsCrmClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPage, setSelectedPage] = useState<string>('ALL');

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Sync status filter with URL search param
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlStatus = params.get('status');
      if (urlStatus && ['ALL', 'NEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'WON', 'LOST'].includes(urlStatus)) {
        setSelectedStatus(urlStatus);
      }
    }
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.fullName.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(search.toLowerCase())) ||
      (lead.message && lead.message.toLowerCase().includes(search.toLowerCase())) ||
      lead.eventType.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || lead.status === selectedStatus;
    const matchesPage = selectedPage === 'ALL' || lead.landingPageSlug === selectedPage;

    return matchesSearch && matchesStatus && matchesPage;
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
      }
    } catch {
      alert('Failed to update lead status');
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
      }
    } catch {
      alert('Failed to save note');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads(leads.filter((l) => l.id !== leadId));
        if (selectedLead?.id === leadId) setSelectedLead(null);
      }
    } catch {
      alert('Failed to delete lead');
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Created At',
      'Status',
      'Client Name',
      'Phone',
      'Email',
      'Company',
      'Event Type',
      'Estimated Date',
      'Guest Count',
      'Budget Range',
      'Package Interest',
      'Landing Page',
      'UTM Source',
      'Message'
    ];

    const rows = filteredLeads.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.createdAt).toLocaleString()}"`,
      `"${l.status}"`,
      `"${l.fullName.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${l.eventType}"`,
      `"${l.estimatedDate || ''}"`,
      `"${l.guestCount || ''}"`,
      `"${l.budgetRange || ''}"`,
      `"${(l.packageInterest || '').replace(/"/g, '""')}"`,
      `"${l.landingPageTitle || l.landingPageSlug}"`,
      `"${l.utmSource || 'Direct'}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
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
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Leads CRM & Inquiries Pipeline</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time inquiries captured from sale.khbevents.com and campaigns
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export {filteredLeads.length} Leads to CSV</span>
        </button>
      </div>

      {/* Sub Menu Tabs: Status Filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-900/40 pb-3">
        {[
          { id: 'ALL', label: 'All Inquiries', count: leads.length },
          { id: 'NEW', label: '🔥 NEW Requests', count: leads.filter(l => l.status === 'NEW').length, badge: 'bg-amber-400 text-black' },
          { id: 'CONTACTED', label: '📞 Contacted', count: leads.filter(l => l.status === 'CONTACTED').length, badge: 'bg-blue-500/20 text-blue-300' },
          { id: 'PROPOSAL_SENT', label: '📝 Proposals', count: leads.filter(l => l.status === 'PROPOSAL_SENT').length, badge: 'bg-purple-500/20 text-purple-300' },
          { id: 'NEGOTIATING', label: '💼 In Negotiation', count: leads.filter(l => l.status === 'NEGOTIATING').length, badge: 'bg-orange-500/20 text-orange-300' },
          { id: 'WON', label: '🏆 Won Deals', count: leads.filter(l => l.status === 'WON').length, badge: 'bg-emerald-500 text-black' },
          { id: 'LOST', label: '📁 Closed / Lost', count: leads.filter(l => l.status === 'LOST').length, badge: 'bg-zinc-800 text-zinc-400' }
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
                  : 'bg-[#0A1610] text-zinc-400 hover:text-white hover:bg-emerald-950/60 border border-emerald-900/40'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold ${
                isActive ? 'bg-black/20 text-black' : (tab.badge || 'bg-emerald-950 text-emerald-300 border border-emerald-800')
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub Filter Bar: Search, Campaign, CSV */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="relative sm:col-span-7">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by client name, phone, company, inquiry message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0A1811] border border-emerald-900/60 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="sm:col-span-5">
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-[#0A1811] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Campaigns ({pages.length + 1} Sources)</option>
            <option value="main-sales">Main Portal (sale.khbevents.com)</option>
            {pages.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0A1610] border border-emerald-900/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#06100B] text-gray-400 uppercase tracking-wider text-[10px] border-b border-emerald-950">
              <tr>
                <th className="p-4">Client & Company</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Event & Specs</th>
                <th className="p-4">Campaign Source</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/80">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 text-xs">
                    No leads matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const style = statusColors[lead.status] || statusColors.NEW;

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-emerald-950/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-white group-hover:text-amber-300 transition-colors">
                          {lead.fullName}
                        </div>
                        {lead.company ? (
                          <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-emerald-400" />
                            <span>{lead.company}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400">Private Individual</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-mono font-medium text-emerald-300">{lead.phone}</div>
                        {lead.email && <div className="text-[11px] text-gray-400">{lead.email}</div>}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-white">{lead.eventType}</div>
                        <div className="text-[11px] text-amber-300">
                          {lead.budgetRange || lead.packageInterest || lead.guestCount || 'No budget stated'}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="line-clamp-1 text-gray-200 text-[11px]">
                          {lead.landingPageTitle}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          UTM: {lead.utmSource || 'Direct'}
                        </div>
                      </td>

                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value as LeadStatus)}
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${style.bg} ${style.text} ${style.border}`}
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="PROPOSAL_SENT">PROPOSAL SENT</option>
                          <option value="NEGOTIATING">NEGOTIATING</option>
                          <option value="WON">WON</option>
                          <option value="LOST">LOST</option>
                        </select>
                      </td>

                      <td className="p-4 text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.phone && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(lead.fullName)},%20this%20is%20KHB%20Events%20regarding%20your%20inquiry.`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg bg-emerald-950 text-emerald-400 hover:text-emerald-200 border border-emerald-800/60"
                              title="Direct WhatsApp Message"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="p-2 rounded-lg bg-emerald-950 text-gray-300 hover:text-white border border-emerald-800/60 cursor-pointer"
                            title="View Details & Notes"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/60 border border-transparent hover:border-rose-900/60 cursor-pointer"
                            title="Delete Lead"
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
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl h-full bg-[#09150E] border-l border-emerald-800/60 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-950">
                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Lead #{selectedLead.id}</span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{selectedLead.fullName}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white bg-emerald-950 border border-emerald-800/60 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#0C1B13] border border-emerald-900/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Pipeline Status:</span>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value as LeadStatus)}
                  className="text-xs font-bold uppercase px-3 py-1.5 rounded-lg bg-black border border-emerald-700 text-amber-300 focus:outline-none cursor-pointer"
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="PROPOSAL_SENT">PROPOSAL SENT</option>
                  <option value="NEGOTIATING">NEGOTIATING</option>
                  <option value="WON">WON (Closed)</option>
                  <option value="LOST">LOST</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedLead.fullName)},%20this%20is%20KHB%20Events%20regarding%20your%20inquiry.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Chat</span>
                </a>
                <a
                  href={`tel:${selectedLead.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>Direct Call</span>
                </a>
              </div>

              <div className="space-y-3 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-emerald-400 text-[11px]">
                  Event & Inquired Parameters
                </h3>
                
                <div className="grid grid-cols-2 gap-2.5 p-4 rounded-xl bg-[#06100B] border border-emerald-950 text-gray-300">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Company:</span>
                    <strong className="text-white">{selectedLead.company || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Email:</span>
                    <strong className="text-white">{selectedLead.email || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Event Category:</span>
                    <strong className="text-white">{selectedLead.eventType}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Target Date:</span>
                    <strong className="text-white">{selectedLead.estimatedDate || 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Audience Scale:</span>
                    <strong className="text-white">{selectedLead.guestCount || 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Budget / Package:</span>
                    <strong className="text-amber-400">{selectedLead.budgetRange || selectedLead.packageInterest || 'TBD'}</strong>
                  </div>
                </div>

                {selectedLead.message && (
                  <div className="p-4 rounded-xl bg-[#06100B] border border-emerald-950 space-y-1">
                    <span className="text-gray-400 block text-[10px]">Client Special Message:</span>
                    <p className="text-gray-200 text-xs leading-relaxed whitespace-pre-wrap">
                      {selectedLead.message}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-gray-400 space-y-1">
                <div className="font-semibold text-emerald-300">Marketing Attribution:</div>
                <div>Source Campaign: <strong>{selectedLead.landingPageTitle}</strong></div>
                <div>UTM Source: <strong>{selectedLead.utmSource || 'Direct Traffic'}</strong></div>
                {selectedLead.utmCampaign && <div>Campaign Name: <strong>{selectedLead.utmCampaign}</strong></div>}
              </div>

              <div className="space-y-3">
                <h3 className="font-bold uppercase tracking-wider text-emerald-400 text-[11px]">
                  Internal Organizer Notes
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add note (e.g. Sent 3D stage deck on WhatsApp)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
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
                      <div key={n.id} className="p-2.5 rounded-lg bg-[#06100B] border border-emerald-950 text-xs space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span className="font-semibold text-amber-400">{n.author}</span>
                          <span>{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-200">{n.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-gray-400 italic py-2">
                      No organizer notes added yet.
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
