'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Copy,
  Eye,
  Megaphone,
  Palette,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Sliders,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import type {
  BilingualText,
  PopupAd,
  PopupAdCtaAction,
  PopupAdFrequency,
  PopupAdStatsMap,
  PopupAdTemplate,
  PopupAdTriggerType,
  PopupAdsState,
} from '@/lib/types';
import {
  DEFAULT_ACCENT,
  POPUP_FREQUENCIES,
  POPUP_TEMPLATES,
  POPUP_TRIGGERS,
  newPopupAd,
  popupAdStatus,
  previewPath,
} from '@/lib/popup-ads';
import { PopupAdCard } from '@/components/common/PopupAds';
import ImageField from './ImageField';
import { errorMessage } from '@/lib/errors';

interface AdsManagerClientProps {
  initialState: PopupAdsState;
  initialStats: PopupAdStatsMap;
  pages: Array<{ slug: string; title: string }>;
  /** Server time at render, so status pills need no clock call during render. */
  nowMs: number;
}

type EditorTab = 'content' | 'design' | 'rules';

const INPUT = 'w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors';
const LABEL = 'block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1';
const HINT = 'text-[10px] text-slate-500 dark:text-gray-400 mt-1 block';
const CARD = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs';
const BTN_PRIMARY = 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50';
const BTN_SECONDARY = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 border border-slate-200 dark:border-emerald-800 text-[11px] font-bold text-slate-800 dark:text-emerald-300 cursor-pointer';

const TEMPLATE_INFO: Record<PopupAdTemplate, { label: string; detail: string }> = {
  card: { label: 'Centered card', detail: 'Classic popup in the middle of the screen with a dimmed page behind it.' },
  'bottom-sheet': { label: 'Bottom sheet', detail: 'Slides up from the bottom on phones, sits in the corner on desktop. Least intrusive.' },
  banner: { label: 'Bottom banner', detail: 'Slim bar along the bottom. The page stays usable, no dimming.' },
  image: { label: 'Image first', detail: 'Big photo on top, text under it. Best with a strong picture.' },
};

const TRIGGER_LABEL: Record<PopupAdTriggerType, string> = {
  immediate: 'As soon as the page loads',
  delay: 'After a few seconds',
  scroll: 'After scrolling down',
  exit_intent: 'When the visitor is about to leave',
};

const FREQUENCY_LABEL: Record<PopupAdFrequency, string> = {
  always: 'Every page view',
  session: 'Once per visit',
  day: 'Once a day',
  week: 'Once a week',
  month: 'Once a month',
  forever: 'Only once, ever',
};

const CTA_LABEL: Record<PopupAdCtaAction, string> = {
  telegram: 'Chat on Telegram (round-robin routed)',
  register: 'Go to the registration form',
  url: 'Open a link',
  close: 'Just close the popup',
};

const STATUS_PILL: Record<ReturnType<typeof popupAdStatus>, string> = {
  active: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30',
  scheduled: 'bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/30',
  expired: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
  paused: 'bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40',
};

/** Ready-made popups the admin can start from. Copy is truthful: no invented numbers or dates. */
const STARTERS: Array<{ key: string; label: string; detail: string; build: (now: string) => PopupAd }> = [
  {
    key: 'telegram',
    label: 'Ask us on Telegram',
    detail: 'A friendly question card after 10 seconds. Sends the visitor to the next salesperson.',
    build: (now) => newPopupAd(now, {
      name: 'Ask us on Telegram',
      badge: { en: 'Questions?', kh: 'មានសំណួរ?' },
      title: { en: 'Have a question about the trip?', kh: 'លោកអ្នកមានសំណួរអំពីដំណើរនេះទេ?' },
      body: { en: 'Our coordinator replies on Telegram within minutes. No payment today.', kh: 'អ្នកសម្របសម្រួលឆ្លើយតាម Telegram ក្នុងពេលប៉ុន្មាននាទី។ មិនបង់ប្រាក់ថ្ងៃនេះ។' },
      cta: { label: { en: 'Chat on Telegram', kh: 'ជជែកតាម Telegram' }, action: 'telegram' },
      dismissLabel: { en: 'Not now', kh: 'មិនមែនឥឡូវ' },
      template: 'card',
      trigger: { type: 'delay', seconds: 10 },
      frequency: 'day',
    }),
  },
  {
    key: 'reserve',
    label: 'Reserve a seat',
    detail: 'Bottom sheet after the visitor scrolled half the page. Sends them to the form.',
    build: (now) => newPopupAd(now, {
      name: 'Reserve a seat',
      badge: { en: 'Seats are limited', kh: 'កៅអីមានកំណត់' },
      title: { en: 'Reserve your seat, no payment today', kh: 'កក់កៅអីរបស់លោកអ្នក មិនបង់ប្រាក់ថ្ងៃនេះ' },
      body: { en: 'Your name and phone are enough. We hold the seat and call you.', kh: 'គ្រាន់តែឈ្មោះ និងលេខទូរស័ព្ទ។ យើងរក្សាកៅអីទុក ហើយទូរស័ព្ទទៅលោកអ្នក។' },
      cta: { label: { en: 'Reserve my seat', kh: 'កក់កៅអីឥឡូវ' }, action: 'register' },
      dismissLabel: { en: 'Keep reading', kh: 'អានបន្ត' },
      template: 'bottom-sheet',
      trigger: { type: 'scroll', percent: 50 },
      frequency: 'day',
    }),
  },
  {
    key: 'exit',
    label: 'Before you go',
    detail: 'Light card when the pointer leaves the page (on phones: after 15 seconds). Once a week.',
    build: (now) => newPopupAd(now, {
      name: 'Before you go',
      title: { en: 'Leaving already?', kh: 'ចាកចេញហើយឬ?' },
      body: { en: 'Get the itinerary and price on Telegram. One message, no commitment.', kh: 'ទទួលកម្មវិធី និងតម្លៃតាម Telegram។ សារមួយ គ្មានការប្តេជ្ញា។' },
      cta: { label: { en: 'Send me the details', kh: 'ផ្ញើព័ត៌មានមកខ្ញុំ' }, action: 'telegram' },
      dismissLabel: { en: 'No thanks', kh: 'អត់ទេ អរគុណ' },
      template: 'card',
      theme: 'light',
      trigger: { type: 'exit_intent' },
      frequency: 'week',
    }),
  },
];

const toLocalInput = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (value: string): string | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : undefined;
};
const fmtPhnomPenh = (iso?: string): string =>
  iso ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

function BiField({ label, value, onChange, required, multiline, placeholderEn, placeholderKh, max = 200 }: {
  label: string;
  value?: BilingualText;
  onChange: (next: BilingualText | undefined) => void;
  required?: boolean;
  multiline?: boolean;
  placeholderEn?: string;
  placeholderKh?: string;
  max?: number;
}) {
  const en = value?.en || '';
  const kh = value?.kh || '';
  const set = (nextEn: string, nextKh: string) => {
    if (!nextEn.trim() && !nextKh.trim()) onChange(undefined);
    else onChange({ en: nextEn, kh: nextKh || undefined });
  };
  const Tag = multiline ? 'textarea' : 'input';
  const common = `${INPUT}${multiline ? ' min-h-[76px] resize-y' : ''}`;
  return (
    <div>
      <label className={LABEL}>{label}{required && <span className="text-rose-500"> *</span>}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Tag className={common} value={en} maxLength={max} placeholder={placeholderEn || 'English'} onChange={(e) => set(e.target.value, kh)} />
          <span className={HINT}>EN</span>
        </div>
        <div>
          <Tag className={common} value={kh} maxLength={max} placeholder={placeholderKh || 'ភាសាខ្មែរ (optional, falls back to English)'} onChange={(e) => set(en, e.target.value)} lang="km" />
          <span className={HINT}>KH</span>
        </div>
      </div>
    </div>
  );
}

export default function AdsManagerClient({ initialState, initialStats, pages, nowMs }: AdsManagerClientProps) {
  const [state, setState] = useState<PopupAdsState>(initialState);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialState));
  const [stats, setStats] = useState<PopupAdStatsMap>(initialStats);
  const [editing, setEditing] = useState<PopupAd | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>('content');
  const [previewLang, setPreviewLang] = useState<'en' | 'kh'>('en');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const dirty = JSON.stringify(state) !== savedJson;

  const totals = useMemo(() => {
    let views = 0;
    let clicks = 0;
    for (const ad of state.ads) {
      const s = stats[ad.id];
      if (s) { views += s.views; clicks += s.clicks; }
    }
    return { views, clicks, ctr: views ? Math.round((clicks / views) * 1000) / 10 : 0 };
  }, [state.ads, stats]);
  const activeCount = state.ads.filter((a) => popupAdStatus(a, nowMs) === 'active').length;

  const updateSettings = (patch: Partial<PopupAdsState['settings']>) =>
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  const updateAd = (id: string, patch: Partial<PopupAd>) =>
    setState((prev) => ({ ...prev, ads: prev.ads.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)) }));

  const openNew = (build?: (now: string) => PopupAd) => {
    const now = new Date().toISOString();
    setEditing(build ? build(now) : newPopupAd(now));
    setEditorTab('content');
  };
  const duplicate = (ad: PopupAd) => {
    const now = new Date().toISOString();
    const copy = newPopupAd(now, { ...ad, id: undefined, name: `${ad.name} copy`, enabled: false, createdAt: now, updatedAt: now });
    setState((prev) => ({ ...prev, ads: [...prev.ads, copy] }));
  };
  const remove = (ad: PopupAd) => {
    if (!confirm(`Delete the popup "${ad.name}"? This cannot be undone after you save.`)) return;
    setState((prev) => ({ ...prev, ads: prev.ads.filter((a) => a.id !== ad.id) }));
  };
  const applyDraft = () => {
    if (!editing) return;
    setState((prev) => {
      const exists = prev.ads.some((a) => a.id === editing.id);
      const stamped = { ...editing, updatedAt: new Date().toISOString() };
      return { ...prev, ads: exists ? prev.ads.map((a) => (a.id === editing.id ? stamped : a)) : [...prev.ads, stamped] };
    });
    setEditing(null);
  };

  const saveAll = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/popup-ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save popups');
      const dropped = state.ads.length - data.state.ads.length;
      setState(data.state);
      setSavedJson(JSON.stringify(data.state));
      setSuccess(dropped > 0 ? `Saved. ${dropped} popup${dropped > 1 ? 's were' : ' was'} dropped because it had no title or button text.` : 'Popups saved. Live pages update within a minute.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(errorMessage(err, 'Error saving popups'));
    } finally {
      setSaving(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/popup-ads/stats');
      const data = await res.json();
      if (res.ok && data.success) setStats(data.stats);
    } catch {
      // Keep the numbers we have.
    } finally {
      setRefreshing(false);
    }
  };

  const draftValid = Boolean(editing?.title.en.trim() && editing?.cta.label.en.trim());
  const draftReason = !editing ? '' : !editing.title.en.trim() ? 'Add an English title.' : !editing.cta.label.en.trim() ? 'Add English button text.' : '';
  const previewSlugFor = (ad: PopupAd) => (ad.pages === 'all' || ad.pages.length === 0 ? 'smart-city-tea-cafe' : ad.pages[0]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-emerald-950 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-400/20 text-amber-500 dark:text-amber-400">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Ads &amp; Popups</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                {activeCount} live
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Promotional popups on the landing pages. One popup per visit at most, easy to close, and it never shows again to someone who already sent the form.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 cursor-pointer shadow-xs">
            <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Popups enabled:</span>
            <input type="checkbox" checked={state.settings.enabled} onChange={(e) => updateSettings({ enabled: e.target.checked })} className="w-4 h-4 accent-amber-400 cursor-pointer" />
            <span className={`text-xs font-black ${state.settings.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{state.settings.enabled ? 'ON' : 'OFF'}</span>
          </label>
          <button type="button" onClick={() => openNew()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-md">
            <Plus className="w-4 h-4" /><span>New popup</span>
          </button>
          <button type="button" onClick={saveAll} disabled={saving} className={BTN_PRIMARY}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving…' : 'Save all'}</span>
            {dirty && !saving && <span className="w-2 h-2 rounded-full bg-rose-500" title="Unsaved changes" />}
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 shadow-sm dark:shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 shadow-sm dark:shadow-lg">{error}</div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[
          { label: 'Popup views', value: totals.views, note: 'Times a popup was shown' },
          { label: 'Button clicks', value: totals.clicks, note: 'Visitors who tapped the button' },
          { label: 'Click rate', value: `${totals.ctr}%`, note: 'Clicks ÷ views' },
          { label: 'Live now', value: `${activeCount} / ${state.ads.length}`, note: 'Enabled and inside their dates' },
        ].map((kpi) => (
          <div key={kpi.label} className={`p-4 ${CARD}`}>
            <div className="text-xs text-slate-500 dark:text-gray-400 font-semibold">{kpi.label}</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{kpi.value}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{kpi.note}</div>
          </div>
        ))}
      </div>

      {/* Global rules */}
      <div className={`p-5 ${CARD} flex flex-col sm:flex-row sm:items-end gap-4`}>
        <div className="flex-1">
          <label className={LABEL}>Cooldown between popups (hours)</label>
          <input type="number" min={0} max={720} value={state.settings.globalCooldownHours} onChange={(e) => updateSettings({ globalCooldownHours: Math.max(0, Math.min(720, Number(e.target.value) || 0)) })} className={`${INPUT} max-w-[160px]`} />
          <span className={HINT}>After a visitor saw any popup, no other popup for this long. 0 turns it off.</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-gray-400 max-w-xl">
          Each popup also has its own frequency (once a day, once a week…). Views and clicks are counted from the visitor&apos;s browser, so treat them as close estimates, not exact figures.
        </p>
      </div>

      {/* List */}
      <div id="performance" className={`${CARD} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-slate-200 dark:border-emerald-950">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" /><span>Popups &amp; performance</span>
          </h2>
          <button type="button" onClick={refreshStats} disabled={refreshing} className={BTN_SECONDARY}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /><span>Refresh stats</span>
          </button>
        </div>

        {state.ads.length === 0 ? (
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-600 dark:text-gray-300">No popups yet. Start from a ready-made one, then change the words, picture and rules:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STARTERS.map((s) => (
                <button key={s.key} type="button" onClick={() => openNew(s.build)} className="text-left p-4 rounded-2xl border border-dashed border-slate-300 dark:border-emerald-800 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-400/5 cursor-pointer transition-colors">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{s.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">{s.detail}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-[#06100B] text-slate-600 dark:text-gray-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-emerald-950">
                <tr>
                  <th className="text-left py-2.5 px-3">Popup</th>
                  <th className="text-left py-2.5 px-3">Status</th>
                  <th className="text-left py-2.5 px-3">Where &amp; when</th>
                  <th className="text-right py-2.5 px-3">Views</th>
                  <th className="text-right py-2.5 px-3">Clicks</th>
                  <th className="text-right py-2.5 px-3">Rate</th>
                  <th className="text-right py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/60">
                {state.ads.map((ad) => {
                  const status = popupAdStatus(ad, nowMs);
                  const s = stats[ad.id] || { views: 0, clicks: 0, closes: 0 };
                  const rate = s.views ? Math.round((s.clicks / s.views) * 1000) / 10 : 0;
                  return (
                    <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/30">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{ad.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-gray-400 truncate max-w-[260px]">{ad.title.en}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{TEMPLATE_INFO[ad.template].label} · {ad.theme}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${STATUS_PILL[status]}`}>{status}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-gray-300">
                        <div>{ad.pages === 'all' ? 'All pages' : `${ad.pages.length} page${ad.pages.length > 1 ? 's' : ''}`} · {ad.devices === 'all' ? 'all devices' : ad.devices}</div>
                        <div className="text-[11px]">{TRIGGER_LABEL[ad.trigger.type]}{ad.trigger.type === 'delay' ? ` (${ad.trigger.seconds ?? 8}s)` : ad.trigger.type === 'scroll' ? ` (${ad.trigger.percent ?? 40}%)` : ''} · {FREQUENCY_LABEL[ad.frequency]}</div>
                        {(ad.startAt || ad.endAt) && (
                          <div className="text-[10px] text-slate-400">{ad.startAt ? `from ${fmtPhnomPenh(ad.startAt)}` : ''}{ad.startAt && ad.endAt ? ' ' : ''}{ad.endAt ? `until ${fmtPhnomPenh(ad.endAt)}` : ''} (Phnom Penh)</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{s.views}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{s.clicks}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{rate}%</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => { setEditing(ad); setEditorTab('content'); }} className={BTN_SECONDARY}>Edit</button>
                          <a href={previewPath(ad)} target="_blank" rel="noreferrer" title="Preview on the live page (works even when paused)" className={BTN_SECONDARY}><Eye className="w-3.5 h-3.5" /></a>
                          <button type="button" onClick={() => updateAd(ad.id, { enabled: !ad.enabled })} title={ad.enabled ? 'Pause' : 'Enable'} className={BTN_SECONDARY}>{ad.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</button>
                          <button type="button" onClick={() => duplicate(ad)} title="Duplicate" className={BTN_SECONDARY}><Copy className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => remove(ad)} title="Delete" className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {state.ads.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-gray-400">
          <span>Start from a template:</span>
          {STARTERS.map((s) => (
            <button key={s.key} type="button" onClick={() => openNew(s.build)} className={BTN_SECONDARY}>{s.label}</button>
          ))}
        </div>
      )}

      {/* Editor */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-800/70 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-emerald-950">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{state.ads.some((a) => a.id === editing.id) ? 'Edit popup' : 'New popup'}</h3>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">Changes go live after you press Done and then Save all.</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer" aria-label="Close editor"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-[1fr_420px]">
              {/* Form */}
              <div className="p-5 space-y-5">
                <div className="flex items-center gap-2">
                  {([['content', 'Content', Type], ['design', 'Design', Palette], ['rules', 'Rules', Sliders]] as const).map(([id, label, Icon]) => (
                    <button key={id} type="button" onClick={() => setEditorTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${editorTab === id ? 'bg-amber-400 text-black shadow-md shadow-amber-500/10' : 'bg-white dark:bg-[#0A1610] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-emerald-900/40'}`}>
                      <Icon className="w-4 h-4" /><span>{label}</span>
                    </button>
                  ))}
                </div>

                {editorTab === 'content' && (
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL}>Internal name</label>
                      <input className={INPUT} value={editing.name} maxLength={80} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                      <span className={HINT}>Only you see this.</span>
                    </div>
                    <BiField label="Small badge" value={editing.badge} max={40} placeholderEn="e.g. Seats are limited" onChange={(v) => setEditing({ ...editing, badge: v })} />
                    <BiField label="Title" required value={editing.title} max={120} placeholderEn="Under 12 words" onChange={(v) => setEditing({ ...editing, title: v || { en: '' } })} />
                    <BiField label="Text" multiline value={editing.body} max={400} placeholderEn="One to three short sentences" onChange={(v) => setEditing({ ...editing, body: v })} />
                    <ImageField label="Picture (optional)" value={editing.imageUrl || ''} onChange={(url) => setEditing({ ...editing, imageUrl: url || undefined })} maxEdge={1600} preview="wide" hint="1200×800 works best. Keep words out of the picture; the title carries the message." />
                    <BiField label="Button text" required value={editing.cta.label} max={60} placeholderEn="Say what happens next" onChange={(v) => setEditing({ ...editing, cta: { ...editing.cta, label: v || { en: '' } } })} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL}>Button does</label>
                        <select className={INPUT} value={editing.cta.action} onChange={(e) => setEditing({ ...editing, cta: { ...editing.cta, action: e.target.value as PopupAdCtaAction } })}>
                          {(Object.keys(CTA_LABEL) as PopupAdCtaAction[]).map((a) => <option key={a} value={a}>{CTA_LABEL[a]}</option>)}
                        </select>
                      </div>
                      {editing.cta.action === 'url' && (
                        <div>
                          <label className={LABEL}>Link</label>
                          <input className={INPUT} value={editing.cta.url || ''} placeholder="https://… or /page" onChange={(e) => setEditing({ ...editing, cta: { ...editing.cta, url: e.target.value } })} />
                          <label className="flex items-center gap-2 mt-2 text-[11px] text-slate-600 dark:text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={Boolean(editing.cta.newTab)} onChange={(e) => setEditing({ ...editing, cta: { ...editing.cta, newTab: e.target.checked } })} className="w-4 h-4 accent-amber-400" />
                            Open in a new tab
                          </label>
                        </div>
                      )}
                    </div>
                    <BiField label="Dismiss link" value={editing.dismissLabel} max={40} placeholderEn="e.g. Not now" onChange={(v) => setEditing({ ...editing, dismissLabel: v })} />
                  </div>
                )}

                {editorTab === 'design' && (
                  <div className="space-y-5">
                    <div>
                      <label className={LABEL}>Layout</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {POPUP_TEMPLATES.map((t) => (
                          <button key={t} type="button" onClick={() => setEditing({ ...editing, template: t })} className={`text-left p-3 rounded-xl border cursor-pointer transition-colors ${editing.template === t ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-400/10' : 'border-slate-200 dark:border-emerald-900/60 hover:border-amber-300'}`}>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{TEMPLATE_INFO[t].label}</div>
                            <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">{TEMPLATE_INFO[t].detail}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL}>Colours</label>
                        <select className={INPUT} value={editing.theme} onChange={(e) => setEditing({ ...editing, theme: e.target.value === 'light' ? 'light' : 'dark' })}>
                          <option value="dark">Dark green (matches the page)</option>
                          <option value="light">Light</option>
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>Button colour</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={editing.accent || DEFAULT_ACCENT} onChange={(e) => setEditing({ ...editing, accent: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-emerald-900/60 bg-transparent cursor-pointer" aria-label="Button colour" />
                          <input className={`${INPUT} font-mono`} value={editing.accent || DEFAULT_ACCENT} maxLength={7} onChange={(e) => setEditing({ ...editing, accent: e.target.value })} />
                          <button type="button" onClick={() => setEditing({ ...editing, accent: DEFAULT_ACCENT })} className={BTN_SECONDARY}>Gold</button>
                        </div>
                        <span className={HINT}>Gold is the site&apos;s primary button colour. Keep it unless the offer needs its own colour.</span>
                      </div>
                    </div>
                  </div>
                )}

                {editorTab === 'rules' && (
                  <div className="space-y-5">
                    <div>
                      <label className={LABEL}>Show on</label>
                      <label className="flex items-center gap-2 text-xs text-slate-800 dark:text-gray-200 cursor-pointer mb-2">
                        <input type="checkbox" checked={editing.pages === 'all'} onChange={(e) => setEditing({ ...editing, pages: e.target.checked ? 'all' : [] })} className="w-4 h-4 accent-amber-400" />
                        All pages
                      </label>
                      {editing.pages !== 'all' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1">
                          {pages.map((p) => {
                            const list = editing.pages as string[];
                            const checked = list.includes(p.slug);
                            return (
                              <label key={p.slug} className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-gray-300 cursor-pointer">
                                <input type="checkbox" checked={checked} onChange={(e) => setEditing({ ...editing, pages: e.target.checked ? [...list, p.slug] : list.filter((s) => s !== p.slug) })} className="w-4 h-4 accent-amber-400" />
                                {p.title}
                              </label>
                            );
                          })}
                          {(editing.pages as string[]).length === 0 && <span className="text-[10px] text-rose-500">Pick at least one page, or the popup shows everywhere.</span>}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL}>Devices</label>
                        <select className={INPUT} value={editing.devices} onChange={(e) => setEditing({ ...editing, devices: e.target.value as PopupAd['devices'] })}>
                          <option value="all">Phones and desktop</option><option value="mobile">Phones only</option><option value="desktop">Desktop only</option>
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>Language</label>
                        <select className={INPUT} value={editing.languages} onChange={(e) => setEditing({ ...editing, languages: e.target.value as PopupAd['languages'] })}>
                          <option value="all">Both languages</option><option value="en">English readers only</option><option value="kh">Khmer readers only</option>
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>Show it</label>
                        <select className={INPUT} value={editing.trigger.type} onChange={(e) => setEditing({ ...editing, trigger: { type: e.target.value as PopupAdTriggerType, seconds: editing.trigger.seconds ?? 8, percent: editing.trigger.percent ?? 40 } })}>
                          {POPUP_TRIGGERS.map((t) => <option key={t} value={t}>{TRIGGER_LABEL[t]}</option>)}
                        </select>
                        {editing.trigger.type === 'delay' && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-gray-300">
                            <input type="number" min={0} max={600} className={`${INPUT} max-w-[100px]`} value={editing.trigger.seconds ?? 8} onChange={(e) => setEditing({ ...editing, trigger: { ...editing.trigger, seconds: Number(e.target.value) || 0 } })} /> seconds after the page loads
                          </div>
                        )}
                        {editing.trigger.type === 'scroll' && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-gray-300">
                            <input type="number" min={1} max={100} className={`${INPUT} max-w-[100px]`} value={editing.trigger.percent ?? 40} onChange={(e) => setEditing({ ...editing, trigger: { ...editing.trigger, percent: Number(e.target.value) || 40 } })} /> % of the page scrolled
                          </div>
                        )}
                        {editing.trigger.type === 'exit_intent' && <span className={HINT}>On phones there is no pointer to leave, so it shows after 15 seconds or 60% scrolled.</span>}
                      </div>
                      <div>
                        <label className={LABEL}>How often per visitor</label>
                        <select className={INPUT} value={editing.frequency} onChange={(e) => setEditing({ ...editing, frequency: e.target.value as PopupAdFrequency })}>
                          {POPUP_FREQUENCIES.map((f) => <option key={f} value={f}>{FREQUENCY_LABEL[f]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>Start (your local time)</label>
                        <input type="datetime-local" className={INPUT} value={toLocalInput(editing.startAt)} onChange={(e) => setEditing({ ...editing, startAt: fromLocalInput(e.target.value) })} />
                        <span className={HINT}>Leave empty to start right away.</span>
                      </div>
                      <div>
                        <label className={LABEL}>End</label>
                        <input type="datetime-local" className={INPUT} value={toLocalInput(editing.endAt)} onChange={(e) => setEditing({ ...editing, endAt: fromLocalInput(e.target.value) })} />
                        <span className={HINT}>Leave empty to run until you pause it.</span>
                      </div>
                      <div>
                        <label className={LABEL}>Priority</label>
                        <input type="number" min={0} max={1000} className={INPUT} value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) || 0 })} />
                        <span className={HINT}>When two popups could show, the higher number wins.</span>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                      <label className="flex items-center gap-2 text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={editing.hideAfterLead} onChange={(e) => setEditing({ ...editing, hideAfterLead: e.target.checked })} className="w-4 h-4 accent-amber-400" />
                        Hide from visitors who already sent the form
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} className="w-4 h-4 accent-amber-400" />
                        Enabled <span className="text-[10px] text-slate-500 dark:text-gray-400">(a paused popup can still be previewed)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Live preview */}
              <div className="p-5 bg-slate-100 dark:bg-[#06100B] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-emerald-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">Live preview</div>
                  <div className="flex items-center gap-1">
                    {(['en', 'kh'] as const).map((l) => (
                      <button key={l} type="button" onClick={() => setPreviewLang(l)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${previewLang === l ? 'bg-amber-400 text-black' : 'bg-white dark:bg-[#0A1610] text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-emerald-900/60'}`}>{l.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <div className={`rounded-[28px] border-8 border-slate-800 dark:border-black bg-[#FBF9F5] dark:bg-[#070E0A] p-3 w-full max-w-[390px] mx-auto min-h-[520px] flex ${editing.template === 'card' || editing.template === 'image' ? 'items-center' : 'items-end'}`}>
                  <div className="w-full">
                    <PopupAdCard ad={editing} lang={previewLang} pageSlug={previewSlugFor(editing)} inline onClose={() => {}} onCta={() => {}} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-gray-400">Shows the card only. Timing, frequency and the dimmed background apply on the live page. Use Preview on the list for the real thing.</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 dark:border-emerald-950">
              <span className="text-[11px] text-rose-600 dark:text-rose-400">{draftReason}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setEditing(null)} className={BTN_SECONDARY}>Cancel</button>
                <button type="button" onClick={applyDraft} disabled={!draftValid} className={BTN_PRIMARY}><CheckCircle2 className="w-4 h-4" /><span>Done</span></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
