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
  POPUP_ANIMATIONS,
  POPUP_FREQUENCIES,
  POPUP_OVERLAYS,
  POPUP_POSITIONS,
  POPUP_RADII,
  POPUP_SIZES,
  POPUP_TEMPLATES,
  POPUP_TRIGGERS,
  SMART_RULES,
  SMART_SENSITIVITIES,
  newPopupAd,
  popupAdStatus,
  previewPath,
  nextOpening,
  withinHours,
} from '@/lib/popup-ads';
import { PopupAdCard, popupDefaults } from '@/components/common/PopupAds';
import ImageField from './ImageField';
import { errorMessage } from '@/lib/errors';
import { useLanguage } from '@/context/LanguageContext';

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

/** Translation keys for the option maps; the labels come from t(). */
const TEMPLATE_INFO: Record<PopupAdTemplate, { label: string; detail: string }> = {
  chat: { label: 'ads.template.chat', detail: 'ads.template.chatDetail' },
  card: { label: 'ads.template.card', detail: 'ads.template.cardDetail' },
  'bottom-sheet': { label: 'ads.template.bottomSheet', detail: 'ads.template.bottomSheetDetail' },
  banner: { label: 'ads.template.banner', detail: 'ads.template.bannerDetail' },
  image: { label: 'ads.template.image', detail: 'ads.template.imageDetail' },
};

const TRIGGER_LABEL: Record<PopupAdTriggerType, string> = {
  immediate: 'ads.trigger.immediate',
  delay: 'ads.trigger.delay',
  scroll: 'ads.trigger.scroll',
  exit_intent: 'ads.trigger.exitIntent',
  idle: 'ads.trigger.idle',
  smart: 'ads.trigger.smart',
};

const DAY_KEYS = ['ads.day.sun', 'ads.day.mon', 'ads.day.tue', 'ads.day.wed', 'ads.day.thu', 'ads.day.fri', 'ads.day.sat'];

const FREQUENCY_LABEL: Record<PopupAdFrequency, string> = {
  always: 'ads.freq.always',
  session: 'ads.freq.session',
  day: 'ads.freq.day',
  week: 'ads.freq.week',
  month: 'ads.freq.month',
  forever: 'ads.freq.forever',
};

const CTA_LABEL: Record<PopupAdCtaAction, string> = {
  telegram: 'ads.cta.telegram',
  register: 'ads.cta.register',
  url: 'ads.cta.url',
  close: 'ads.cta.close',
};

const STATUS_LABEL: Record<ReturnType<typeof popupAdStatus>, string> = {
  active: 'ads.status.active',
  scheduled: 'ads.status.scheduled',
  expired: 'ads.status.expired',
  paused: 'ads.status.paused',
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
    key: 'chat',
    label: 'ads.starter.chat',
    detail: 'ads.starter.chatDetail',
    build: (now) => newPopupAd(now, {
      name: 'Telegram quick chat',
      title: { en: 'Hi! Any question about the trip?', kh: 'សួស្តី! មានសំណួរអំពីដំណើរនេះទេ?' },
      body: { en: 'Message us on Telegram for a faster answer about the price, dates and what is included.', kh: 'ផ្ញើសារមកយើងតាម Telegram ដើម្បីទទួលចម្លើយលឿនអំពីតម្លៃ កាលបរិច្ឆេទ និងអ្វីដែលរួមបញ្ចូល។' },
      cta: { label: { en: 'Chat on Telegram', kh: 'ជជែកតាម Telegram' }, action: 'telegram' },
      dismissLabel: { en: 'Maybe later', kh: 'ពេលក្រោយ' },
      template: 'chat',
      position: 'bottom-right',
      overlay: 'none',
      animation: 'slide',
      launcher: true,
      agentName: 'KHB Events',
      agentRole: { en: 'Sales team · usually replies in minutes', kh: 'ក្រុមលក់ · ជាធម្មតាឆ្លើយក្នុងពេលប៉ុន្មាននាទី' },
      trigger: { type: 'smart', sensitivity: 'balanced' },
      frequency: 'session',
    }),
  },
  {
    key: 'telegram',
    label: 'ads.starter.telegram',
    detail: 'ads.starter.telegramDetail',
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
    label: 'ads.starter.reserve',
    detail: 'ads.starter.reserveDetail',
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
    label: 'ads.starter.exit',
    detail: 'ads.starter.exitDetail',
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
  const { t } = useLanguage();
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
          <Tag className={common} value={en} maxLength={max} placeholder={placeholderEn || t('ads.bi.en')} onChange={(e) => set(e.target.value, kh)} />
          <span className={HINT}>EN</span>
        </div>
        <div>
          <Tag className={common} value={kh} maxLength={max} placeholder={placeholderKh || t('ads.bi.kh')} onChange={(e) => set(en, e.target.value)} lang="km" />
          <span className={HINT}>KH</span>
        </div>
      </div>
    </div>
  );
}

export default function AdsManagerClient({ initialState, initialStats, pages, nowMs }: AdsManagerClientProps) {
  const { t } = useLanguage();
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
    const copy = newPopupAd(now, { ...ad, id: undefined, name: t('ads.copySuffix', { name: ad.name }), enabled: false, createdAt: now, updatedAt: now });
    setState((prev) => ({ ...prev, ads: [...prev.ads, copy] }));
  };
  const remove = (ad: PopupAd) => {
    if (!confirm(t('ads.confirmDelete', { name: ad.name }))) return;
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
      if (!res.ok || !data.success) throw new Error(data.error || t('ads.saveFailed'));
      const dropped = state.ads.length - data.state.ads.length;
      setState(data.state);
      setSavedJson(JSON.stringify(data.state));
      setSuccess(dropped > 0 ? t(dropped > 1 ? 'ads.savedDroppedMany' : 'ads.savedDroppedOne', { n: dropped }) : t('ads.savedLive'));
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(errorMessage(err, t('ads.saveError')));
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
  const draftReason = !editing ? '' : !editing.title.en.trim() ? t('ads.needTitle') : !editing.cta.label.en.trim() ? t('ads.needButton') : '';
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
              <span>{t('ads.title')}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                {t('ads.live', { n: activeCount })}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              {t('ads.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 cursor-pointer shadow-xs">
            <span className="text-xs font-bold text-slate-700 dark:text-gray-300">{t('ads.popupsEnabled')}</span>
            <input type="checkbox" checked={state.settings.enabled} onChange={(e) => updateSettings({ enabled: e.target.checked })} className="w-4 h-4 accent-amber-400 cursor-pointer" />
            <span className={`text-xs font-black ${state.settings.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{state.settings.enabled ? t('common.on') : t('common.off')}</span>
          </label>
          <button type="button" onClick={() => openNew()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-md">
            <Plus className="w-4 h-4" /><span>{t('ads.newPopup')}</span>
          </button>
          <button type="button" onClick={saveAll} disabled={saving} className={BTN_PRIMARY}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? t('common.saving') : t('common.saveAll')}</span>
            {dirty && !saving && <span className="w-2 h-2 rounded-full bg-rose-500" title={t('common.unsavedChanges')} />}
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
          { label: t('ads.kpi.views'), value: totals.views, note: t('ads.kpi.viewsNote') },
          { label: t('ads.kpi.clicks'), value: totals.clicks, note: t('ads.kpi.clicksNote') },
          { label: t('ads.kpi.rate'), value: `${totals.ctr}%`, note: t('ads.kpi.rateNote') },
          { label: t('ads.kpi.liveNow'), value: `${activeCount} / ${state.ads.length}`, note: t('ads.kpi.liveNowNote') },
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
          <label className={LABEL}>{t('ads.cooldown')}</label>
          <input type="number" min={0} max={720} value={state.settings.globalCooldownHours} onChange={(e) => updateSettings({ globalCooldownHours: Math.max(0, Math.min(720, Number(e.target.value) || 0)) })} className={`${INPUT} max-w-[160px]`} />
          <span className={HINT}>{t('ads.cooldownHint')}</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-gray-400 max-w-xl">
          {t('ads.globalNote')}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-gray-400 max-w-xl">
          {t('ads.debugTip')}
        </p>
      </div>

      {/* List */}
      <div id="performance" className={`${CARD} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-slate-200 dark:border-emerald-950">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" /><span>{t('ads.listTitle')}</span>
          </h2>
          <button type="button" onClick={refreshStats} disabled={refreshing} className={BTN_SECONDARY}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /><span>{t('ads.refreshStats')}</span>
          </button>
        </div>

        {state.ads.length === 0 ? (
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-600 dark:text-gray-300">{t('ads.empty')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STARTERS.map((s) => (
                <button key={s.key} type="button" onClick={() => openNew(s.build)} className="text-left p-4 rounded-2xl border border-dashed border-slate-300 dark:border-emerald-800 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-400/5 cursor-pointer transition-colors">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{t(s.label)}</div>
                  <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">{t(s.detail)}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-[#06100B] text-slate-600 dark:text-gray-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-emerald-950">
                <tr>
                  <th className="text-left py-2.5 px-3">{t('ads.th.popup')}</th>
                  <th className="text-left py-2.5 px-3">{t('common.status')}</th>
                  <th className="text-left py-2.5 px-3">{t('ads.th.where')}</th>
                  <th className="text-right py-2.5 px-3">{t('ads.th.views')}</th>
                  <th className="text-right py-2.5 px-3">{t('ads.th.clicks')}</th>
                  <th className="text-right py-2.5 px-3">{t('ads.th.rate')}</th>
                  <th className="text-right py-2.5 px-3">{t('common.actions')}</th>
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
                        <div className="text-[10px] text-slate-400 mt-0.5">{t(TEMPLATE_INFO[ad.template].label)} · {ad.theme}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${STATUS_PILL[status]}`}>{t(STATUS_LABEL[status])}</span>
                        {status === 'active' && ad.hours && !withinHours(ad.hours, nowMs) && (
                          <div className="mt-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">{t('ads.outsideHours', { when: nextOpening(ad.hours, nowMs) || '—' })}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-gray-300">
                        <div>{ad.pages === 'all' ? t('ads.allPages') : t(ad.pages.length > 1 ? 'ads.pagesCount' : 'ads.pageCount', { n: ad.pages.length })} · {ad.devices === 'all' ? t('ads.allDevices') : t(`ads.device.${ad.devices}`)}</div>
                        <div className="text-[11px]">{t(TRIGGER_LABEL[ad.trigger.type])}{ad.trigger.type === 'delay' ? ` (${ad.trigger.seconds ?? 8}s)` : ad.trigger.type === 'scroll' ? ` (${ad.trigger.percent ?? 40}%)` : ''} · {t(FREQUENCY_LABEL[ad.frequency])}</div>
                        {s.smart && Object.keys(s.smart).length > 0 && (
                          <div className="text-[10px] text-slate-500 dark:text-gray-400" title={t('ads.smartReasonsTitle')}>
                            {t('ads.smartReasons')}{' '}
                            {(Object.entries(s.smart) as Array<[string, { views: number; clicks: number }]>)
                              .sort((a, b) => b[1].views - a[1].views)
                              .slice(0, 3)
                              .map(([r, c]) => `${t(`ads.reason.${r}`)} ${c.clicks}/${c.views}`)
                              .join(' · ')}
                          </div>
                        )}
                        {(ad.startAt || ad.endAt) && (
                          <div className="text-[10px] text-slate-400">{ad.startAt ? t('ads.from', { date: fmtPhnomPenh(ad.startAt) }) : ''}{ad.startAt && ad.endAt ? ' ' : ''}{ad.endAt ? t('ads.until', { date: fmtPhnomPenh(ad.endAt) }) : ''} {t('ads.phnomPenh')}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{s.views}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{s.clicks}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{rate}%</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => { setEditing(ad); setEditorTab('content'); }} className={BTN_SECONDARY}>{t('common.edit')}</button>
                          <a href={previewPath(ad)} target="_blank" rel="noreferrer" title={t('ads.previewTitle')} className={BTN_SECONDARY}><Eye className="w-3.5 h-3.5" /></a>
                          <button type="button" onClick={() => updateAd(ad.id, { enabled: !ad.enabled })} title={ad.enabled ? t('ads.pause') : t('ads.enable')} className={BTN_SECONDARY}>{ad.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</button>
                          <button type="button" onClick={() => duplicate(ad)} title={t('common.duplicate')} className={BTN_SECONDARY}><Copy className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => remove(ad)} title={t('common.delete')} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
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
          <span>{t('ads.startFromTemplate')}</span>
          {STARTERS.map((s) => (
            <button key={s.key} type="button" onClick={() => openNew(s.build)} className={BTN_SECONDARY}>{t(s.label)}</button>
          ))}
        </div>
      )}

      {/* Editor */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-800/70 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-emerald-950">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{state.ads.some((a) => a.id === editing.id) ? t('ads.editPopup') : t('ads.newPopup')}</h3>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">{t('ads.editorNote')}</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer" aria-label={t('ads.closeEditor')}><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-[1fr_420px]">
              {/* Form */}
              <div className="p-5 space-y-5">
                <div className="flex items-center gap-2">
                  {([['content', 'ads.tab.content', Type], ['design', 'ads.tab.design', Palette], ['rules', 'ads.tab.rules', Sliders]] as const).map(([id, label, Icon]) => (
                    <button key={id} type="button" onClick={() => setEditorTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${editorTab === id ? 'bg-amber-400 text-black shadow-md shadow-amber-500/10' : 'bg-white dark:bg-[#0A1610] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-emerald-900/40'}`}>
                      <Icon className="w-4 h-4" /><span>{t(label)}</span>
                    </button>
                  ))}
                </div>

                {editorTab === 'content' && (
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL}>{t('ads.internalName')}</label>
                      <input className={INPUT} value={editing.name} maxLength={80} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                      <span className={HINT}>{t('ads.internalNameHint')}</span>
                    </div>
                    <BiField label={t('ads.badge')} value={editing.badge} max={40} placeholderEn={t('ads.badgePh')} onChange={(v) => setEditing({ ...editing, badge: v })} />
                    <BiField label={t('ads.popupTitle')} required value={editing.title} max={120} placeholderEn={t('ads.popupTitlePh')} onChange={(v) => setEditing({ ...editing, title: v || { en: '' } })} />
                    <BiField label={t('ads.text')} multiline value={editing.body} max={400} placeholderEn={t('ads.textPh')} onChange={(v) => setEditing({ ...editing, body: v })} />
                    <ImageField label={t('ads.picture')} value={editing.imageUrl || ''} onChange={(url) => setEditing({ ...editing, imageUrl: url || undefined })} maxEdge={1600} preview="wide" hint={t('ads.pictureHint')} />
                    <BiField label={t('ads.buttonText')} required value={editing.cta.label} max={60} placeholderEn={t('ads.buttonTextPh')} onChange={(v) => setEditing({ ...editing, cta: { ...editing.cta, label: v || { en: '' } } })} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL}>{t('ads.buttonDoes')}</label>
                        <select className={INPUT} value={editing.cta.action} onChange={(e) => setEditing({ ...editing, cta: { ...editing.cta, action: e.target.value as PopupAdCtaAction } })}>
                          {(Object.keys(CTA_LABEL) as PopupAdCtaAction[]).map((a) => <option key={a} value={a}>{t(CTA_LABEL[a])}</option>)}
                        </select>
                      </div>
                      {editing.cta.action === 'url' && (
                        <div>
                          <label className={LABEL}>{t('ads.link')}</label>
                          <input className={INPUT} value={editing.cta.url || ''} placeholder={t('ads.linkPh')} onChange={(e) => setEditing({ ...editing, cta: { ...editing.cta, url: e.target.value } })} />
                          <label className="flex items-center gap-2 mt-2 text-[11px] text-slate-600 dark:text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={Boolean(editing.cta.newTab)} onChange={(e) => setEditing({ ...editing, cta: { ...editing.cta, newTab: e.target.checked } })} className="w-4 h-4 accent-amber-400" />
                            {t('ads.openNewTab')}
                          </label>
                        </div>
                      )}
                    </div>
                    <BiField label={t('ads.dismissLink')} value={editing.dismissLabel} max={40} placeholderEn={t('ads.dismissPh')} onChange={(v) => setEditing({ ...editing, dismissLabel: v })} />
                    {editing.template === 'chat' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900">
                        <div>
                          <label className={LABEL}>{t('ads.agentName')}</label>
                          <input className={INPUT} value={editing.agentName || ''} maxLength={60} placeholder="KHB Events" onChange={(e) => setEditing({ ...editing, agentName: e.target.value || undefined })} />
                          <span className={HINT}>{t('ads.agentNameHint')}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <BiField label={t('ads.agentRole')} value={editing.agentRole} max={60} placeholderEn={t('ads.agentRolePh')} onChange={(v) => setEditing({ ...editing, agentRole: v })} />
                        </div>
                      </div>
                    )}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-emerald-900/60 space-y-3">
                      <div className="text-xs font-bold text-slate-800 dark:text-gray-200">{t('ads.secondary')}</div>
                      <BiField label={t('ads.secondaryLabel')} value={editing.secondary?.label} max={40} placeholderEn={t('ads.secondaryLabelPh')} onChange={(v) => setEditing({ ...editing, secondary: v ? { label: v, href: editing.secondary?.href || '' } : undefined })} />
                      <div>
                        <label className={LABEL}>{t('ads.secondaryHref')}</label>
                        <input className={INPUT} value={editing.secondary?.href || ''} placeholder="tel:+85560815515 or https://…" onChange={(e) => setEditing({ ...editing, secondary: { label: editing.secondary?.label || { en: '' }, href: e.target.value } })} />
                        <span className={HINT}>{t('ads.secondaryHint')}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-slate-200 dark:border-emerald-900/60">
                      <div>
                        <label className={LABEL}>{t('ads.countdownTo')}</label>
                        <input type="datetime-local" className={INPUT} value={toLocalInput(editing.countdownTo)} onChange={(e) => setEditing({ ...editing, countdownTo: fromLocalInput(e.target.value) })} />
                        <span className={HINT}>{t('ads.countdownHint')}</span>
                      </div>
                      <div>
                        <BiField label={t('ads.countdownLabel')} value={editing.countdownLabel} max={60} placeholderEn={t('ads.countdownLabelPh')} onChange={(v) => setEditing({ ...editing, countdownLabel: v })} />
                      </div>
                    </div>
                  </div>
                )}

                {editorTab === 'design' && (
                  <div className="space-y-5">
                    <div>
                      <label className={LABEL}>{t('ads.layout')}</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {POPUP_TEMPLATES.map((tpl) => (
                          <button key={tpl} type="button" onClick={() => setEditing({ ...editing, template: tpl })} className={`text-left p-3 rounded-xl border cursor-pointer transition-colors ${editing.template === tpl ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-400/10' : 'border-slate-200 dark:border-emerald-900/60 hover:border-amber-300'}`}>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{t(TEMPLATE_INFO[tpl].label)}</div>
                            <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">{t(TEMPLATE_INFO[tpl].detail)}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL}>{t('ads.colours')}</label>
                        <select className={INPUT} value={editing.theme} onChange={(e) => setEditing({ ...editing, theme: e.target.value as PopupAd['theme'] })}>
                          <option value="dark">{t('ads.theme.dark')}</option>
                          <option value="light">{t('ads.theme.light')}</option>
                          <option value="brand">{t('ads.theme.brand')}</option>
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.buttonColour')}</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={editing.accent || DEFAULT_ACCENT} onChange={(e) => setEditing({ ...editing, accent: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-emerald-900/60 bg-transparent cursor-pointer" aria-label={t('ads.buttonColour')} />
                          <input className={`${INPUT} font-mono`} value={editing.accent || DEFAULT_ACCENT} maxLength={7} onChange={(e) => setEditing({ ...editing, accent: e.target.value })} />
                          <button type="button" onClick={() => setEditing({ ...editing, accent: DEFAULT_ACCENT })} className={BTN_SECONDARY}>{t('ads.gold')}</button>
                        </div>
                        <span className={HINT}>{t('ads.goldHint')}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editing.template !== 'banner' && editing.template !== 'bottom-sheet' && (
                        <div>
                          <label className={LABEL}>{t('ads.position')}</label>
                          <select className={INPUT} value={popupDefaults(editing).position} onChange={(e) => setEditing({ ...editing, position: e.target.value as PopupAd['position'] })}>
                            {POPUP_POSITIONS.map((v) => <option key={v} value={v}>{t(`ads.position.${v}`)}</option>)}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className={LABEL}>{t('ads.size')}</label>
                        <select className={INPUT} value={popupDefaults(editing).size} onChange={(e) => setEditing({ ...editing, size: e.target.value as PopupAd['size'] })}>
                          {POPUP_SIZES.map((v) => <option key={v} value={v}>{t(`ads.size.${v}`)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.animation')}</label>
                        <select className={INPUT} value={popupDefaults(editing).animation} onChange={(e) => setEditing({ ...editing, animation: e.target.value as PopupAd['animation'] })}>
                          {POPUP_ANIMATIONS.map((v) => <option key={v} value={v}>{t(`ads.animation.${v}`)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.corners')}</label>
                        <select className={INPUT} value={popupDefaults(editing).radius} onChange={(e) => setEditing({ ...editing, radius: e.target.value as PopupAd['radius'] })}>
                          {POPUP_RADII.map((v) => <option key={v} value={v}>{t(`ads.corners.${v}`)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.overlay')}</label>
                        <select className={INPUT} value={popupDefaults(editing).overlay} onChange={(e) => setEditing({ ...editing, overlay: e.target.value as PopupAd['overlay'] })}>
                          {POPUP_OVERLAYS.map((v) => <option key={v} value={v}>{t(`ads.overlay.${v}`)}</option>)}
                        </select>
                        <span className={HINT}>{t('ads.overlayHint')}</span>
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.autoClose')}</label>
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-gray-300">
                          <input type="number" min={0} max={600} className={`${INPUT} max-w-[100px]`} value={editing.autoCloseSeconds ?? 0} onChange={(e) => setEditing({ ...editing, autoCloseSeconds: Math.max(0, Number(e.target.value) || 0) || undefined })} /> {t('ads.autoCloseUnit')}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                      <label className="flex items-center gap-2 text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={popupDefaults(editing).closeOnBackdrop} onChange={(e) => setEditing({ ...editing, closeOnBackdrop: e.target.checked })} className="w-4 h-4 accent-amber-400" />
                        {t('ads.closeOnBackdrop')}
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={Boolean(editing.launcher)} onChange={(e) => setEditing({ ...editing, launcher: e.target.checked || undefined })} className="w-4 h-4 accent-amber-400" />
                        {t('ads.launcher')} <span className="text-[10px] text-slate-500 dark:text-gray-400">{t('ads.launcherHint')}</span>
                      </label>
                    </div>
                  </div>
                )}

                {editorTab === 'rules' && (
                  <div className="space-y-5">
                    <div>
                      <label className={LABEL}>{t('ads.showOn')}</label>
                      <label className="flex items-center gap-2 text-xs text-slate-800 dark:text-gray-200 cursor-pointer mb-2">
                        <input type="checkbox" checked={editing.pages === 'all'} onChange={(e) => setEditing({ ...editing, pages: e.target.checked ? 'all' : [] })} className="w-4 h-4 accent-amber-400" />
                        {t('ads.allPages')}
                      </label>
                      {editing.pages === 'all' && (
                        <details className="pl-1">
                          <summary className="text-[11px] font-bold text-slate-600 dark:text-gray-300 cursor-pointer">{t('ads.exceptPages', { n: editing.excludePages?.length || 0 })}</summary>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                            {pages.map((p) => {
                              const list = editing.excludePages || [];
                              return (
                                <label key={p.slug} className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-gray-300 cursor-pointer">
                                  <input type="checkbox" checked={list.includes(p.slug)} onChange={(e) => setEditing({ ...editing, excludePages: e.target.checked ? [...list, p.slug] : list.filter((x) => x !== p.slug) })} className="w-4 h-4 accent-rose-500" />
                                  {p.title}
                                </label>
                              );
                            })}
                          </div>
                        </details>
                      )}
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
                          {(editing.pages as string[]).length === 0 && <span className="text-[10px] text-rose-500">{t('ads.pickPage')}</span>}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL}>{t('ads.devices')}</label>
                        <select className={INPUT} value={editing.devices} onChange={(e) => setEditing({ ...editing, devices: e.target.value as PopupAd['devices'] })}>
                          <option value="all">{t('ads.devices.all')}</option><option value="mobile">{t('ads.devices.mobile')}</option><option value="desktop">{t('ads.devices.desktop')}</option>
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.language')}</label>
                        <select className={INPUT} value={editing.languages} onChange={(e) => setEditing({ ...editing, languages: e.target.value as PopupAd['languages'] })}>
                          <option value="all">{t('ads.lang.all')}</option><option value="en">{t('ads.lang.en')}</option><option value="kh">{t('ads.lang.kh')}</option>
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.showIt')}</label>
                        <select className={INPUT} value={editing.trigger.type} onChange={(e) => { const type = e.target.value as PopupAdTriggerType; setEditing({ ...editing, trigger: { type, seconds: editing.trigger.seconds ?? 8, percent: editing.trigger.percent ?? 40, ...(type === 'smart' ? { sensitivity: editing.trigger.sensitivity ?? 'balanced' } : {}) } }); }}>
                          {POPUP_TRIGGERS.map((tr) => <option key={tr} value={tr}>{t(TRIGGER_LABEL[tr])}</option>)}
                        </select>
                        {editing.trigger.type === 'delay' && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-gray-300">
                            <input type="number" min={0} max={600} className={`${INPUT} max-w-[100px]`} value={editing.trigger.seconds ?? 8} onChange={(e) => setEditing({ ...editing, trigger: { ...editing.trigger, seconds: Number(e.target.value) || 0 } })} /> {t('ads.secondsAfterLoad')}
                          </div>
                        )}
                        {editing.trigger.type === 'scroll' && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-gray-300">
                            <input type="number" min={1} max={100} className={`${INPUT} max-w-[100px]`} value={editing.trigger.percent ?? 40} onChange={(e) => setEditing({ ...editing, trigger: { ...editing.trigger, percent: Number(e.target.value) || 40 } })} /> {t('ads.percentScrolled')}
                          </div>
                        )}
                        {editing.trigger.type === 'exit_intent' && <span className={HINT}>{t('ads.exitHint')}</span>}
                        {editing.trigger.type === 'smart' && (
                          <div className="mt-2 space-y-1.5">
                            <select aria-label={t('ads.smartSensitivity')} className={INPUT} value={editing.trigger.sensitivity ?? 'balanced'} onChange={(e) => setEditing({ ...editing, trigger: { ...editing.trigger, sensitivity: e.target.value as (typeof SMART_SENSITIVITIES)[number] } })}>
                              {SMART_SENSITIVITIES.map((v) => <option key={v} value={v}>{t(`ads.smart.${v}`, { s: SMART_RULES[v].minSeconds })}</option>)}
                            </select>
                            <span className={HINT}>{t('ads.smartHint')}</span>
                          </div>
                        )}
                        {editing.trigger.type === 'idle' && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-gray-300">
                            <input type="number" min={3} max={600} className={`${INPUT} max-w-[100px]`} value={editing.trigger.idleSeconds ?? 20} onChange={(e) => setEditing({ ...editing, trigger: { ...editing.trigger, idleSeconds: Number(e.target.value) || 20 } })} /> {t('ads.idleSeconds')}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.howOften')}</label>
                        <select className={INPUT} value={editing.frequency} onChange={(e) => setEditing({ ...editing, frequency: e.target.value as PopupAdFrequency })}>
                          {POPUP_FREQUENCIES.map((f) => <option key={f} value={f}>{t(FREQUENCY_LABEL[f])}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.start')}</label>
                        <input type="datetime-local" className={INPUT} value={toLocalInput(editing.startAt)} onChange={(e) => setEditing({ ...editing, startAt: fromLocalInput(e.target.value) })} />
                        <span className={HINT}>{t('ads.startHint')}</span>
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.end')}</label>
                        <input type="datetime-local" className={INPUT} value={toLocalInput(editing.endAt)} onChange={(e) => setEditing({ ...editing, endAt: fromLocalInput(e.target.value) })} />
                        <span className={HINT}>{t('ads.endHint')}</span>
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.priority')}</label>
                        <input type="number" min={0} max={1000} className={INPUT} value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) || 0 })} />
                        <span className={HINT}>{t('ads.priorityHint')}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                      <div>
                        <label className={LABEL}>{t('ads.visitors')}</label>
                        <select className={INPUT} value={editing.visitors || 'all'} onChange={(e) => setEditing({ ...editing, visitors: e.target.value as PopupAd['visitors'] })}>
                          <option value="all">{t('ads.visitors.all')}</option><option value="new">{t('ads.visitors.new')}</option><option value="returning">{t('ads.visitors.returning')}</option>
                        </select>
                        <span className={HINT}>{t('ads.visitorsHint')}</span>
                      </div>
                      <div>
                        <label className={LABEL}>{t('ads.utm')}</label>
                        <input className={INPUT} value={(editing.utmSources || []).join(', ')} placeholder="facebook, tiktok" onChange={(e) => setEditing({ ...editing, utmSources: e.target.value.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) })} />
                        <span className={HINT}>{t('ads.utmHint')}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-gray-200 cursor-pointer">
                          <input type="checkbox" checked={Boolean(editing.hours)} onChange={(e) => setEditing({ ...editing, hours: e.target.checked ? { days: [1, 2, 3, 4, 5, 6], from: '08:00', to: '18:00' } : undefined })} className="w-4 h-4 accent-amber-400" />
                          {t('ads.hours')}
                        </label>
                        {editing.hours && (
                          <div className="mt-2 space-y-2 pl-6">
                            <div className="flex flex-wrap gap-1">
                              {DAY_KEYS.map((k, d) => {
                                const on = editing.hours!.days.includes(d);
                                return (
                                  <button key={k} type="button" onClick={() => setEditing({ ...editing, hours: { ...editing.hours!, days: on ? editing.hours!.days.filter((x) => x !== d) : [...editing.hours!.days, d].sort() } })} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${on ? 'bg-amber-400 text-black' : 'bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-gray-300'}`}>{t(k)}</button>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-gray-300">
                              <input type="time" className={`${INPUT} max-w-[120px]`} value={editing.hours.from} onChange={(e) => setEditing({ ...editing, hours: { ...editing.hours!, from: e.target.value } })} />
                              <span>–</span>
                              <input type="time" className={`${INPUT} max-w-[120px]`} value={editing.hours.to} onChange={(e) => setEditing({ ...editing, hours: { ...editing.hours!, to: e.target.value } })} />
                              <span>{t('ads.phnomPenh')}</span>
                            </div>
                            <span className={HINT}>{t('ads.hoursHint')}</span>
                            {!withinHours(editing.hours, nowMs) && (
                              <span className="block text-[11px] font-semibold text-amber-700 dark:text-amber-400">{t('ads.outsideHours', { when: nextOpening(editing.hours, nowMs) || '—' })}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                      <label className="flex items-center gap-2 text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={editing.hideAfterLead} onChange={(e) => setEditing({ ...editing, hideAfterLead: e.target.checked })} className="w-4 h-4 accent-amber-400" />
                        {t('ads.hideAfterLead')}
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} className="w-4 h-4 accent-amber-400" />
                        {t('common.enabled')} <span className="text-[10px] text-slate-500 dark:text-gray-400">{t('ads.enabledNote')}</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Live preview */}
              <div className="p-5 bg-slate-100 dark:bg-[#06100B] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-emerald-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">{t('ads.livePreview')}</div>
                  <div className="flex items-center gap-1">
                    {(['en', 'kh'] as const).map((l) => (
                      <button key={l} type="button" onClick={() => setPreviewLang(l)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${previewLang === l ? 'bg-amber-400 text-black' : 'bg-white dark:bg-[#0A1610] text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-emerald-900/60'}`}>{l.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <div className={`rounded-[28px] border-8 border-slate-800 dark:border-black bg-[#FBF9F5] dark:bg-[#070E0A] p-3 w-full max-w-[390px] mx-auto min-h-[520px] flex ${(editing.template === 'card' || editing.template === 'image') && popupDefaults(editing).position === 'center' ? 'items-center' : 'items-end'} ${popupDefaults(editing).position === 'bottom-left' ? 'justify-start' : popupDefaults(editing).position === 'bottom-right' ? 'justify-end' : 'justify-center'}`}>
                  <div className={editing.template === 'chat' || popupDefaults(editing).size === 'sm' ? 'w-[88%]' : 'w-full'}>
                    <PopupAdCard ad={editing} lang={previewLang} pageSlug={previewSlugFor(editing)} inline onClose={() => {}} onCta={() => {}} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-gray-400">{t('ads.previewNote')}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 dark:border-emerald-950">
              <span className="text-[11px] text-rose-600 dark:text-rose-400">{draftReason}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setEditing(null)} className={BTN_SECONDARY}>{t('common.cancel')}</button>
                <button type="button" onClick={applyDraft} disabled={!draftValid} className={BTN_PRIMARY}><CheckCircle2 className="w-4 h-4" /><span>{t('common.done')}</span></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
