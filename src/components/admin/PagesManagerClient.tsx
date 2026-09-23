'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit, 
  Trash2, 
  CopyCheck, 
  Eye, 
  Users, 
  FileText,
  Activity,
  Sliders,
  Upload
} from 'lucide-react';
import { LandingPage } from '@/lib/types';

interface PagesManagerClientProps {
  initialPages: LandingPage[];
}

export default function PagesManagerClient({ initialPages }: PagesManagerClientProps) {
  const [pages, setPages] = useState<LandingPage[]>(initialPages);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<string>('ALL');

  const publishedCount = pages.filter(p => p.status === 'published').length;
  const draftCount = pages.filter(p => p.status === 'draft').length;
  const corporateCount = pages.filter(p => p.category?.toLowerCase().includes('corporate')).length;
  const delegationCount = pages.filter(p => p.category?.toLowerCase().includes('delegation') || p.category?.toLowerCase().includes('trade')).length;

  const filteredPages = pages.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    if (activeTab === 'ALL') return matchesSearch;
    if (activeTab === 'published') return matchesSearch && p.status === 'published';
    if (activeTab === 'draft') return matchesSearch && p.status === 'draft';
    if (activeTab === 'corporate') return matchesSearch && p.category?.toLowerCase().includes('corporate');
    if (activeTab === 'delegations') return matchesSearch && (p.category?.toLowerCase().includes('delegation') || p.category?.toLowerCase().includes('trade'));
    return matchesSearch;
  });

  const handleCopyLink = (slug: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sale.khbevents.com';
    const url = `${origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the landing page "${title}"?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPages(pages.filter((p) => p.id !== id));
      } else {
        alert('Failed to delete page');
      }
    } catch {
      alert('Error occurred while deleting');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (sourcePage: LandingPage) => {
    const newTitle = `${sourcePage.title} (Copy)`;
    const baseSlug = sourcePage.slug.replace(/(-copy-[a-z0-9]+)+$/, '');
    const newSlug = `${baseSlug}-copy-${Date.now().toString(36)}`;

    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sourcePage,
          id: undefined,
          title: newTitle,
          slug: newSlug,
          viewsCount: 0,
          leadsCount: 0,
          status: 'draft'
        })
      });

      const data = await res.json();
      if (res.ok && data.page) {
        setPages([data.page, ...pages]);
        alert(`Page duplicated as "${newTitle}"!`);
      } else {
        alert(data.error || 'Failed to duplicate page');
      }
    } catch {
      alert('Error duplicating page');
    }
  };

  /**
   * Import a content pack (content/pages/*.json). Fields in the file are merged over the
   * existing page with the same slug, so settings the file leaves out (Telegram token,
   * tracking IDs, counters) are kept. A new slug creates a draft page.
   */
  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      let pack: Partial<LandingPage>;
      try {
        pack = JSON.parse(text);
      } catch {
        alert('That file is not valid JSON.');
        return;
      }
      if (!pack || typeof pack !== 'object' || !pack.slug) {
        alert('The file needs at least a "slug" field.');
        return;
      }
      // Never let a file overwrite identity or counters.
      const { id: _id, viewsCount: _v, leadsCount: _l, createdAt: _c, updatedAt: _u, ...fields } = pack;
      void _id; void _v; void _l; void _c; void _u;

      const existing = pages.find(p => p.slug === fields.slug);
      if (existing) {
        if (!confirm(`Update "${existing.title}" (/${existing.slug}) with the content in ${file.name}?\nFields not in the file are kept.`)) return;
        const current = await fetch(`/api/pages/${existing.id}`).then(r => r.json()).catch(() => null);
        const base: LandingPage = current?.page || existing;
        const res = await fetch(`/api/pages/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...base, ...fields, id: existing.id, slug: existing.slug, title: fields.title || base.title }),
        });
        const data = await res.json();
        if (!res.ok || !data.page) { alert(data.error || 'Import failed'); return; }
        setPages(pages.map(p => (p.id === existing.id ? data.page : p)));
        alert(`"${data.page.title}" updated from ${file.name}. The live page refreshes within a minute.`);
      } else {
        if (!fields.title) { alert('A new page needs a "title" field.'); return; }
        const res = await fetch('/api/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...fields, status: 'draft' }),
        });
        const data = await res.json();
        if (!res.ok || !data.page) { alert(data.error || 'Import failed'); return; }
        setPages([data.page, ...pages]);
        alert(`Created draft "${data.page.title}" from ${file.name}.`);
      }
    } catch {
      alert('Error importing file');
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <span>Landing Pages CMS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Build, publish, and track campaign pages at sale.khbevents.com/[slug]
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }}
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            title="Import a page content pack (JSON) — updates the page with the same slug"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-800 bg-white dark:bg-[#0A1610] text-slate-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-all cursor-pointer disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            <span>{importing ? 'Importing…' : 'Import JSON'}</span>
          </button>
          <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-black stroke-[3]" />
          <span>+ Create New Landing Page</span>
          </Link>
        </div>
      </div>

      {/* Sub Menu Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-emerald-900/40 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'All Campaigns', count: pages.length },
            { id: 'published', label: 'Published (Live)', count: publishedCount, badge: 'bg-emerald-500 text-black' },
            { id: 'draft', label: 'Drafts', count: draftCount, badge: 'bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-300' },
            { id: 'corporate', label: 'Corporate Events', count: corporateCount },
            { id: 'delegations', label: 'Trade & Delegations', count: delegationCount }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search pages by title, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#08150E] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Pages */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPages.map((page) => {
          const conv = page.viewsCount > 0 ? ((page.leadsCount / page.viewsCount) * 100).toFixed(1) : '0.0';
          const isCopied = copiedId === page.id;

          return (
            <div
              key={page.id}
              className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 overflow-hidden flex flex-col justify-between hover:border-emerald-500/50 dark:hover:border-emerald-600/50 transition-all shadow-sm dark:shadow-lg"
            >
              <div>
                <div className="relative h-36 overflow-hidden bg-emerald-950">
                  <img
                    src={page.heroImage || '/images/events/photo_2026-09-16_22-01-09.jpg'}
                    alt={page.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 dark:from-[#0A1610] via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      page.status === 'published'
                        ? 'bg-emerald-500 text-black'
                        : 'bg-amber-400 text-black'
                    }`}>
                      {page.status}
                    </span>
                    <span className="text-[10px] font-medium bg-black/70 backdrop-blur-sm text-gray-200 px-2 py-0.5 rounded-md">
                      {page.category}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-3 right-3 text-[11px] font-mono text-amber-600 dark:text-amber-300 font-semibold truncate">
                    /{page.slug}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {page.title}
                  </h3>
                  
                  <p className="text-xs text-slate-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {page.heroSubheadline || page.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-900/40 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-gray-300">
                      <Users className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span><strong>{page.leadsCount}</strong> Leads</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-gray-300">
                      <Eye className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      <span><strong>{page.viewsCount}</strong> Views ({conv}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 dark:border-emerald-950/80 mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(page.slug, page.id)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-gray-300 hover:text-black dark:hover:text-white border border-slate-200 dark:border-emerald-800/60 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    title="Copy Public URL"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <Link
                    href={`/${page.slug}`}
                    target="_blank"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-gray-300 hover:text-black dark:hover:text-white border border-slate-200 dark:border-emerald-800/60 transition-colors"
                    title="Preview Live"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(page)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-gray-300 hover:text-black dark:hover:text-white border border-slate-200 dark:border-emerald-800/60 cursor-pointer transition-colors"
                    title="Duplicate this page"
                  >
                    <CopyCheck className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/admin/pages/${page.id}?tab=tracking`}
                    className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center transition-colors"
                    title="View Tracking & Pixels"
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/admin/pages/${page.id}?tab=isolatedSettings`}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-emerald-950/60 text-slate-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-emerald-900 border border-slate-200 dark:border-emerald-800 text-xs font-semibold flex items-center transition-colors"
                    title="Dedicated Page Settings"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/admin/pages/${page.id}`}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/30 border border-amber-300 dark:border-amber-500/40 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </Link>

                  <button
                    type="button"
                    disabled={deletingId === page.id}
                    onClick={() => handleDelete(page.id, page.title)}
                    className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 disabled:opacity-50 cursor-pointer transition-colors"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
