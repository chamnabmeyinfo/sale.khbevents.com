'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Save, 
  ArrowLeft, 
  ExternalLink, 
  Plus, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';
import { LandingPage, PackageTier, HighlightItem, FaqItem } from '@/lib/types';

interface PageEditorProps {
  initialData?: Partial<LandingPage>;
  isNew?: boolean;
}

export default function PageEditor({ initialData, isNew = false }: PageEditorProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<LandingPage>>({
    id: initialData?.id,
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    subtitle: initialData?.subtitle || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Corporate Events',
    badge: initialData?.badge || '',
    status: initialData?.status || 'published',
    heroHeadline: initialData?.heroHeadline || '',
    heroSubheadline: initialData?.heroSubheadline || '',
    heroCtaText: initialData?.heroCtaText || 'Register Now',
    heroCtaLink: initialData?.heroCtaLink || '#booking-form',
    heroImage: initialData?.heroImage || '/images/events/photo_2026-09-16_22-01-09.jpg',
    eventDate: initialData?.eventDate || '',
    eventTime: initialData?.eventTime || '',
    venue: initialData?.venue || '',
    venueAddress: initialData?.venueAddress || '',
    countdownEnabled: initialData?.countdownEnabled ?? true,
    highlights: initialData?.highlights || [
      { id: 'h1', title: 'Curated 1-on-1 Business Matching', description: 'Pre-arranged bilateral commercial meetings.' }
    ],
    packages: initialData?.packages || [
      {
        id: 'pkg-1',
        name: 'VIP Delegate Pass',
        price: '$1,500',
        period: 'per person',
        description: 'Full all-inclusive access',
        popular: true,
        features: ['5-Star Hotel Stay', 'VIP Seating', 'Networking Dinners'],
        ctaText: 'Select Pass'
      }
    ],
    faqs: initialData?.faqs || [
      { id: 'f1', question: 'How do I confirm my registration?', answer: 'Our team will contact you to finalize billing.' }
    ],
    formConfig: initialData?.formConfig || {
      headline: 'Reserve Your Registration',
      subheadline: 'Fill in your details below and our team will get in touch.',
      submitButtonText: 'Submit Registration',
      successMessage: 'Thank you! Your registration has been received.',
      fields: []
    },
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || ''
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'event' | 'packages' | 'highlights' | 'faqs' | 'seo'>('general');

  const addHighlight = () => {
    const newH: HighlightItem = {
      id: `h-${Date.now()}`,
      title: 'New Highlight',
      description: 'Description of key feature or selling point.'
    };
    setFormData({ ...formData, highlights: [...(formData.highlights || []), newH] });
  };

  const updateHighlight = (index: number, field: string, value: string) => {
    const arr = [...(formData.highlights || [])];
    arr[index] = { ...arr[index], [field]: value };
    setFormData({ ...formData, highlights: arr });
  };

  const removeHighlight = (index: number) => {
    const arr = (formData.highlights || []).filter((_, i) => i !== index);
    setFormData({ ...formData, highlights: arr });
  };

  const addPackage = () => {
    const newPkg: PackageTier = {
      id: `pkg-${Date.now()}`,
      name: 'Standard Package',
      price: '$1,000',
      period: 'per delegate',
      description: 'Standard event participation',
      popular: false,
      features: ['Event access', 'Lunch & refreshments'],
      ctaText: 'Choose Standard'
    };
    setFormData({ ...formData, packages: [...(formData.packages || []), newPkg] });
  };

  const updatePackage = (index: number, field: string, value: any) => {
    const arr = [...(formData.packages || [])];
    arr[index] = { ...arr[index], [field]: value };
    setFormData({ ...formData, packages: arr });
  };

  const removePackage = (index: number) => {
    const arr = (formData.packages || []).filter((_, i) => i !== index);
    setFormData({ ...formData, packages: arr });
  };

  const addFaq = () => {
    const newF: FaqItem = {
      id: `f-${Date.now()}`,
      question: 'New Question?',
      answer: 'Answer to this common inquiry.'
    };
    setFormData({ ...formData, faqs: [...(formData.faqs || []), newF] });
  };

  const updateFaq = (index: number, field: string, value: string) => {
    const arr = [...(formData.faqs || [])];
    arr[index] = { ...arr[index], [field]: value };
    setFormData({ ...formData, faqs: arr });
  };

  const removeFaq = (index: number) => {
    const arr = (formData.faqs || []).filter((_, i) => i !== index);
    setFormData({ ...formData, faqs: arr });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaveSuccess(false);

    if (!formData.title || !formData.slug) {
      setError('Title and Slug are required');
      setSaving(false);
      return;
    }

    try {
      const endpoint = isNew ? '/api/pages' : `/api/pages/${formData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save page');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (isNew && data.page?.id) {
        router.push(`/admin/pages/${data.page.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-emerald-900/40">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pages"
            className="p-2 rounded-lg bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-gray-300 hover:text-black dark:hover:text-white border border-slate-200 dark:border-emerald-800/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isNew ? 'Create New Landing Page' : `Edit: ${formData.title || 'Landing Page'}`}
            </h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-mono">
              URL: /{formData.slug || 'your-slug'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isNew && formData.slug && (
            <Link
              href={`/${formData.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 border border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-300 text-xs font-semibold transition-colors"
            >
              <span>Preview Live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4 text-black" />
            <span>{saving ? 'Saving...' : 'Save Page'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 shadow-sm dark:shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Landing page saved and published successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 shadow-sm dark:shadow-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-emerald-900/40 pb-2">
        {[
          { id: 'general', label: 'General & Slug' },
          { id: 'hero', label: 'Hero Section' },
          { id: 'event', label: 'Date & Venue' },
          { id: 'packages', label: `Pricing Tiers (${formData.packages?.length || 0})` },
          { id: 'highlights', label: `Highlights (${formData.highlights?.length || 0})` },
          { id: 'faqs', label: `FAQs (${formData.faqs?.length || 0})` },
          { id: 'seo', label: 'SEO & Metadata' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-400 text-black shadow-md'
                : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Body */}
      <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-xl transition-colors">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Page Title <span className="text-amber-500 dark:text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Vietnam Smart City, Tea & Cafe Delegation"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  URL Slug (sale.khbevents.com/...) <span className="text-amber-500 dark:text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') })}
                  placeholder="e.g. smart-city-tea-cafe"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-amber-700 dark:text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Trade Delegation, Corporate, Concert, Exhibition"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Badge / Pill Text
                </label>
                <input
                  type="text"
                  value={formData.badge || ''}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g. Exclusive 30 VIP Seats Only"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Publishing Status
                </label>
                <select
                  value={formData.status || 'published'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="published">Published (Active & Live)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Subtitle / Description Summary
              </label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief overview of what this event or sales campaign is about..."
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 resize-none transition-colors"
              />
            </div>
          </div>
        )}

        {activeTab === 'hero' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Hero Headline
              </label>
              <input
                type="text"
                value={formData.heroHeadline || ''}
                onChange={(e) => setFormData({ ...formData, heroHeadline: e.target.value })}
                placeholder="e.g. Vietnam Smart City, Tea & Cafe B2B Business Delegation 2026"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Hero Subheadline / Value Proposition
              </label>
              <textarea
                rows={2}
                value={formData.heroSubheadline || ''}
                onChange={(e) => setFormData({ ...formData, heroSubheadline: e.target.value })}
                placeholder="Expand on why delegates must attend..."
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 resize-none transition-colors"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Hero CTA Button Text
                </label>
                <input
                  type="text"
                  value={formData.heroCtaText || ''}
                  onChange={(e) => setFormData({ ...formData, heroCtaText: e.target.value })}
                  placeholder="e.g. Reserve Your VIP Seat"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Hero Image URL or Path
                </label>
                <input
                  type="text"
                  value={formData.heroImage || ''}
                  onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                  placeholder="/images/events/photo_2026-09-16_22-01-09.jpg"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'event' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Event Date
                </label>
                <input
                  type="text"
                  value={formData.eventDate || ''}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  placeholder="e.g. 2026-10-15 or Oct 15-20, 2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Duration / Time
                </label>
                <input
                  type="text"
                  value={formData.eventTime || ''}
                  onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                  placeholder="e.g. 5 Days / 4 Nights or 6:00 PM - 10:00 PM"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={formData.venue || ''}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. Diamond Island (Koh Pich) Hall G"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Venue Address / City
                </label>
                <input
                  type="text"
                  value={formData.venueAddress || ''}
                  onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                  placeholder="e.g. Phnom Penh, Cambodia or Ho Chi Minh City, Vietnam"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="countdownEnabled"
                checked={formData.countdownEnabled ?? false}
                onChange={(e) => setFormData({ ...formData, countdownEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 bg-white dark:bg-[#06100B] border-slate-300 dark:border-emerald-900 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="countdownEnabled" className="text-xs text-slate-700 dark:text-gray-200 font-semibold cursor-pointer">
                Enable live countdown timer in hero banner (targets event date)
              </label>
            </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ticket Passes & Package Tiers
              </h3>
              <button
                type="button"
                onClick={addPackage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-xs font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Package</span>
              </button>
            </div>

            <div className="space-y-4">
              {(formData.packages || []).map((pkg, idx) => (
                <div key={pkg.id || idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Tier #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removePackage(idx)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Package Name</label>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => updatePackage(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Price</label>
                      <input
                        type="text"
                        value={pkg.price}
                        onChange={(e) => updatePackage(idx, 'price', e.target.value)}
                        placeholder="e.g. $1,450 or From $4,500"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-amber-600 dark:text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Period / Unit</label>
                      <input
                        type="text"
                        value={pkg.period || ''}
                        onChange={(e) => updatePackage(idx, 'period', e.target.value)}
                        placeholder="e.g. per delegate"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id={`pop-${idx}`}
                      checked={pkg.popular || false}
                      onChange={(e) => updatePackage(idx, 'popular', e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-white dark:bg-[#050C08] border-slate-300 dark:border-emerald-900 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor={`pop-${idx}`} className="text-xs text-amber-700 dark:text-amber-300 font-semibold cursor-pointer">
                      Mark as "Most Popular / Recommended" (Gold Highlight)
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Features (One per line)</label>
                    <textarea
                      rows={3}
                      value={(pkg.features || []).join('\n')}
                      onChange={(e) => updatePackage(idx, 'features', e.target.value.split('\n').filter(Boolean))}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono resize-none focus:outline-none focus:border-amber-400 transition-colors"
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'highlights' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Program Selling Points</h3>
              <button
                type="button"
                onClick={addHighlight}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer transition-colors hover:bg-emerald-200 dark:hover:bg-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Highlight</span>
              </button>
            </div>

            <div className="space-y-3">
              {(formData.highlights || []).map((h, idx) => (
                <div key={h.id || idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Highlight #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(idx)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 text-xs cursor-pointer transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <input
                    type="text"
                    value={h.title}
                    onChange={(e) => updateHighlight(idx, 'title', e.target.value)}
                    placeholder="Title"
                    className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <textarea
                    rows={2}
                    value={h.description}
                    onChange={(e) => updateHighlight(idx, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
              <button
                type="button"
                onClick={addFaq}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer transition-colors hover:bg-emerald-200 dark:hover:bg-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-3">
              {(formData.faqs || []).map((faq, idx) => (
                <div key={faq.id || idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">FAQ #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeFaq(idx)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 text-xs cursor-pointer transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                    placeholder="Question"
                    className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                    placeholder="Answer"
                    className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Meta Title (Appears in Google search and browser tab)
              </label>
              <input
                type="text"
                value={formData.metaTitle || ''}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="Title | KHB EVENTS Cambodia"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={formData.metaDescription || ''}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="Brief snippet for search engines..."
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 resize-none transition-colors"
              />
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-emerald-950 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4 text-black" />
            <span>{saving ? 'Saving...' : 'Save & Publish Page'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
