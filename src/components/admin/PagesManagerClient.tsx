'use client';

import React, { useState } from 'react';
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
  FileText
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
    const newSlug = `${sourcePage.slug}-copy-${Math.floor(Math.random() * 1000)}`;

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

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>Landing Pages CMS</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Build, publish, and track campaign pages at sale.khbevents.com/[slug]
          </p>
        </div>

        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-black stroke-[3]" />
          <span>+ Create New Landing Page</span>
        </Link>
      </div>

      {/* Sub Menu Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/40 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'All Campaigns', count: pages.length },
            { id: 'published', label: 'Published (Live)', count: publishedCount, badge: 'bg-emerald-500 text-black' },
            { id: 'draft', label: 'Drafts', count: draftCount, badge: 'bg-zinc-800 text-zinc-300' },
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

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search pages by title, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#08150E] border border-emerald-900/60 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
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
              className="rounded-2xl bg-[#0A1610] border border-emerald-900/50 overflow-hidden flex flex-col justify-between hover:border-emerald-600/50 transition-all shadow-lg"
            >
              <div>
                <div className="relative h-36 overflow-hidden bg-emerald-950">
                  <img
                    src={page.heroImage || '/images/events/photo_2026-09-16_22-01-09.jpg'}
                    alt={page.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1610] via-transparent to-transparent" />
                  
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

                  <div className="absolute bottom-2 left-3 right-3 text-[11px] font-mono text-amber-300 truncate">
                    /{page.slug}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                    {page.title}
                  </h3>
                  
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {page.heroSubheadline || page.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span><strong>{page.leadsCount}</strong> Leads</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span><strong>{page.viewsCount}</strong> Views ({conv}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-emerald-950/80 mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(page.slug, page.id)}
                    className="p-2 rounded-lg bg-emerald-950 text-gray-300 hover:text-white border border-emerald-800/60 text-xs flex items-center gap-1 cursor-pointer"
                    title="Copy Public URL"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <Link
                    href={`/${page.slug}`}
                    target="_blank"
                    className="p-2 rounded-lg bg-emerald-950 text-gray-300 hover:text-white border border-emerald-800/60"
                    title="Preview Live"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(page)}
                    className="p-2 rounded-lg bg-emerald-950 text-gray-300 hover:text-white border border-emerald-800/60 cursor-pointer"
                    title="Duplicate this page"
                  >
                    <CopyCheck className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/admin/pages/${page.id}`}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </Link>

                  <button
                    type="button"
                    disabled={deletingId === page.id}
                    onClick={() => handleDelete(page.id, page.title)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 border border-transparent hover:border-rose-900/60 disabled:opacity-50 cursor-pointer"
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
