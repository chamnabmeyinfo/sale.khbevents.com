'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Check, 
  Copy, 
  ExternalLink, 
  Globe, 
  ShieldCheck, 
  Sparkles, 
  Code, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Smartphone, 
  Monitor,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { LandingPage, PageAnalyticsSummary } from '@/lib/types';

interface TrackingAndPixelsEditorProps {
  formData: Partial<LandingPage>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<LandingPage>>>;
}

export default function TrackingAndPixelsEditor({ formData, setFormData }: TrackingAndPixelsEditorProps) {
  const tracking = formData.tracking || {};

  // UTM Builder state
  const [utmSource, setUtmSource] = useState('facebook');
  const [utmMedium, setUtmMedium] = useState('cpc');
  const [utmCampaign, setUtmCampaign] = useState('vietnam_b2b_sep');
  const [utmContent, setUtmContent] = useState('');
  const [copied, setCopied] = useState(false);

  // Analytics Snapshot state
  const [analytics, setAnalytics] = useState<PageAnalyticsSummary | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const updateTracking = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      tracking: {
        ...(prev.tracking || {}),
        [key]: value,
      },
    }));
  };

  // Build full campaign URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sale.khbevents.com';
  const pagePath = `/${formData.slug || 'campaign'}`;
  const queryParams = new URLSearchParams();
  if (utmSource) queryParams.set('utm_source', utmSource);
  if (utmMedium) queryParams.set('utm_medium', utmMedium);
  if (utmCampaign) queryParams.set('utm_campaign', utmCampaign);
  if (utmContent) queryParams.set('utm_content', utmContent);

  const fullCampaignUrl = `${baseUrl}${pagePath}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCampaignUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch real-time analytics summary
  const fetchAnalytics = async () => {
    if (!formData.id && !formData.slug) return;
    setLoadingAnalytics(true);
    try {
      const pageKey = formData.id || formData.slug;
      const res = await fetch(`/api/pages/${pageKey}/analytics`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
        }
      }
    } catch {
      // silent fallback
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [formData.id, formData.slug]);

  return (
    <div className="space-y-8">
      {/* ── Header Banner ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-[#0B1E14] dark:via-[#091810] dark:to-[#08150E] border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <Activity className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Independent Tracking & Marketing Pixels
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300">
              Each landing page maintains its own isolated ad pixels and first-party internal tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              1st-Party Engine: Active
            </span>
            {tracking.facebookPixelId && tracking.facebookPixelEnabled !== false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                Meta Pixel
              </span>
            )}
            {tracking.ga4MeasurementId && tracking.ga4Enabled !== false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                GA4
              </span>
            )}
            {tracking.gtmContainerId && tracking.gtmEnabled !== false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300">
                GTM
              </span>
            )}
            {tracking.tiktokPixelId && tracking.tiktokPixelEnabled !== false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                TikTok
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 1: THIRD-PARTY ADVERTISING PIXELS ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-emerald-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Third-Party Pixels (Meta, Google & TikTok)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Meta Pixel */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm">
                  f
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Meta (Facebook) Pixel</h4>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400">Tracks PageView, ViewContent, InitiateCheckout & Lead</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tracking.facebookPixelEnabled !== false}
                  onChange={(e) => updateTracking('facebookPixelEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-emerald-950 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Pixel ID
              </label>
              <input
                type="text"
                value={tracking.facebookPixelId || ''}
                onChange={(e) => updateTracking('facebookPixelId', e.target.value.trim())}
                placeholder="e.g. 102938475610293"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-[10px] text-slate-400 dark:text-gray-400 flex items-center gap-1">
              <span>⚡ Auto fires <code>fbq(&apos;track&apos;, &apos;Lead&apos;)</code> when a reservation is confirmed.</span>
            </div>
          </div>

          {/* 2. Google Analytics 4 (GA4) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-sm">
                  G
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Google Analytics 4 (GA4)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400">Measurement ID with generate_lead conversion tracking</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tracking.ga4Enabled !== false}
                  onChange={(e) => updateTracking('ga4Enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-emerald-950 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Measurement ID
              </label>
              <input
                type="text"
                value={tracking.ga4MeasurementId || ''}
                onChange={(e) => updateTracking('ga4MeasurementId', e.target.value.trim())}
                placeholder="e.g. G-ABC123DEF4"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="text-[10px] text-slate-400 dark:text-gray-400 flex items-center gap-1">
              <span>⚡ Auto fires <code>generate_lead</code> on booking inquiry.</span>
            </div>
          </div>

          {/* 3. Google Tag Manager (GTM) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-sm">
                  T
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Google Tag Manager</h4>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400">Head and noscript container with custom dataLayer</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tracking.gtmEnabled !== false}
                  onChange={(e) => updateTracking('gtmEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-emerald-950 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-gray-300 mb-1">
                GTM Container ID
              </label>
              <input
                type="text"
                value={tracking.gtmContainerId || ''}
                onChange={(e) => updateTracking('gtmContainerId', e.target.value.trim())}
                placeholder="e.g. GTM-N8X7XYZ"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-purple-400"
              />
            </div>
            <div className="text-[10px] text-slate-400 dark:text-gray-400 flex items-center gap-1">
              <span>⚡ Pushes events directly to <code>window.dataLayer</code>.</span>
            </div>
          </div>

          {/* 4. TikTok Pixel */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 font-black text-sm">
                  TT
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">TikTok Pixel</h4>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400">Tracks ViewContent, ClickButton & SubmitForm</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tracking.tiktokPixelEnabled !== false}
                  onChange={(e) => updateTracking('tiktokPixelEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-emerald-950 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-gray-300 mb-1">
                TikTok Pixel ID
              </label>
              <input
                type="text"
                value={tracking.tiktokPixelId || ''}
                onChange={(e) => updateTracking('tiktokPixelId', e.target.value.trim())}
                placeholder="e.g. C1234567890ABC"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-rose-400"
              />
            </div>
            <div className="text-[10px] text-slate-400 dark:text-gray-400 flex items-center gap-1">
              <span>⚡ Auto fires <code>ttq.track(&apos;SubmitForm&apos;)</code> on lead registration.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: CUSTOM CODE INJECTION (HEAD & BODY) ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-emerald-400 flex items-center gap-2">
          <Code className="w-4 h-4 text-emerald-500" />
          <span>Custom Code Injection (Hotjar, Microsoft Clarity, Chat Widgets)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Custom Head */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 space-y-2 shadow-sm">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              Custom &lt;head&gt; Scripts / Tracking Snippet
            </label>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">
              Injected into document head. Paste JavaScript or tracking tags without <code>&lt;script&gt;</code> wrappers.
            </p>
            <textarea
              rows={5}
              value={tracking.customHeadScript || ''}
              onChange={(e) => updateTracking('customHeadScript', e.target.value)}
              placeholder="// e.g. Microsoft Clarity, Hotjar, or custom analytics code..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-emerald-300 text-xs font-mono resize-none focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Custom Body */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 space-y-2 shadow-sm">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              Custom &lt;body&gt; HTML / Widgets
            </label>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">
              Rendered inside page body. Ideal for Live Chat embeds (Crisp, Tawk.to) or noscript tags.
            </p>
            <textarea
              rows={5}
              value={tracking.customBodyScript || ''}
              onChange={(e) => updateTracking('customBodyScript', e.target.value)}
              placeholder="<!-- Live chat iframe, verification badge, or noscript fallback -->"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-emerald-300 text-xs font-mono resize-none focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 3: UTM CAMPAIGN LINK GENERATOR ── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              <span>UTM Campaign Link Builder</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Generate tracked URLs for Facebook Ads, Telegram Broadcasts, TikTok Videos, and Email Blasts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-gray-300 mb-1">
              Source (utm_source)
            </label>
            <input
              type="text"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              placeholder="facebook, telegram, tiktok"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            />
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {['facebook', 'telegram', 'tiktok', 'google'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setUtmSource(s)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border ${
                    utmSource === s
                      ? 'bg-amber-400 text-black border-amber-400 font-bold'
                      : 'bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-emerald-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-gray-300 mb-1">
              Medium (utm_medium)
            </label>
            <input
              type="text"
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              placeholder="cpc, post, bio, message"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            />
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {['cpc', 'post', 'bio', 'chat'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setUtmMedium(m)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border ${
                    utmMedium === m
                      ? 'bg-amber-400 text-black border-amber-400 font-bold'
                      : 'bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-emerald-900'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-gray-300 mb-1">
              Campaign (utm_campaign)
            </label>
            <input
              type="text"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              placeholder="vietnam_trip_promo"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-gray-300 mb-1">
              Content / Ad Variant (utm_content)
            </label>
            <input
              type="text"
              value={utmContent}
              onChange={(e) => setUtmContent(e.target.value)}
              placeholder="video_v1, carousel_roasters"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Ready Tracking Link Output */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="truncate text-xs font-mono text-emerald-700 dark:text-emerald-400">
            {fullCampaignUrl}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <a
              href={fullCampaignUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-slate-700 dark:text-emerald-300 hover:text-amber-500 transition-colors"
              title="Test Tracked Link in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: FIRST-PARTY ANALYTICS PERFORMANCE SNAPSHOT ── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Internal Performance Snapshot</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Live first-party analytics captured directly on your domain.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loadingAnalytics}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-900 text-[11px] font-bold text-slate-700 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-emerald-950 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {analytics ? (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">Total Page Views</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {analytics.totalViews.toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">Unique Visitors</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {analytics.uniqueVisitors.toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">Leads Captured</div>
                <div className="text-2xl font-black text-amber-500 mt-1">
                  {analytics.totalLeads.toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">Conversion Rate</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {analytics.conversionRate}%
                </div>
              </div>
            </div>

            {/* Funnel & Traffic Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Funnel Progression */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Conversion Funnel Drop-off</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-gray-400 mb-1">
                      <span>1. Page Views</span>
                      <span className="font-bold text-slate-900 dark:text-white">{analytics.funnel.views}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-emerald-950 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-gray-400 mb-1">
                      <span>2. Scrolled &gt; 50%</span>
                      <span className="font-bold text-slate-900 dark:text-white">{analytics.funnel.scrolled50}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-emerald-950 overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((analytics.funnel.scrolled50 / (analytics.funnel.views || 1)) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-gray-400 mb-1">
                      <span>3. Clicked CTA / Seat Picker</span>
                      <span className="font-bold text-slate-900 dark:text-white">{analytics.funnel.clickedCta}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-emerald-950 overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((analytics.funnel.clickedCta / (analytics.funnel.views || 1)) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-gray-400 mb-1">
                      <span>4. Lead Form Submitted</span>
                      <span className="font-bold text-slate-900 dark:text-white">{analytics.funnel.leadsSubmitted}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-emerald-950 overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((analytics.funnel.leadsSubmitted / (analytics.funnel.views || 1)) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traffic Sources */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1A12] border border-slate-200 dark:border-emerald-900/60 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>Top Acquisition Channels</span>
                </h4>
                <div className="space-y-2">
                  {analytics.topSources.slice(0, 5).map((src, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="capitalize font-medium text-slate-700 dark:text-gray-300 truncate max-w-[200px]">
                        {src.source}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 dark:text-gray-500">{src.count} visits</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{src.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-emerald-950 flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mobile: {analytics.deviceBreakdown.mobile}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-slate-400" />
                    <span>Desktop: {analytics.deviceBreakdown.desktop}</span>
                  </div>
                  <div>
                    <span>ខ្មែរ: {analytics.languageBreakdown.kh} | EN: {analytics.languageBreakdown.en}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-gray-400">
            {loadingAnalytics ? 'Loading analytics snapshot...' : 'No visitor interactions recorded yet for this page.'}
          </div>
        )}
      </div>
    </div>
  );
}
