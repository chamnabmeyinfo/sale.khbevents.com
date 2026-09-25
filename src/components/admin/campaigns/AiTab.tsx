'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Bot, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { StoredAiReport } from '@/lib/ai-analyst';
import type { AiSettings } from '@/lib/ai-store';
import { BTN_PRIMARY, CARD, H2, SUB, Seg } from './ui';
import type { PageOption } from './CampaignsClient';

type HistoryItem = { generatedAt: string; days: number; headline: string; actions: string[]; basis: StoredAiReport['basis'] };

const VERDICT_STYLE: Record<string, string> = {
  scale: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
  keep: 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200',
  fix: 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200',
  pause: 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200',
  too_early: 'bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-gray-300',
};
const IMPACT_STYLE: Record<string, string> = {
  high: 'text-rose-700 dark:text-rose-300',
  medium: 'text-amber-700 dark:text-amber-300',
  low: 'text-slate-600 dark:text-gray-400',
};

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Phnom_Penh' });

export default function AiTab({ pages }: { pages: PageOption[] }) {
  const { t, lang: uiLang } = useLanguage();
  const [configured, setConfigured] = useState(true);
  const [latest, setLatest] = useState<StoredAiReport | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [days, setDays] = useState(14);
  const [lang, setLang] = useState<'en' | 'kh'>(uiLang === 'kh' ? 'kh' : 'en');
  const [page, setPage] = useState('');
  const [savedSettings, setSavedSettings] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns/ai', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t('cp.failed'));
      setConfigured(data.configured);
      setLatest(data.latest);
      setHistory(data.history || []);
      setSettings(data.settings);
      if (data.settings) {
        setDays(data.settings.days);
        setLang(data.settings.lang);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('cp.failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const run = async () => {
    setRunning(true);
    setError('');
    try {
      const res = await fetch('/api/campaigns/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'run', days, lang, page: page || undefined }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || t('cp.failed'));
      setLatest(data.latest);
      setHistory(data.history || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('cp.failed'));
    } finally {
      setRunning(false);
    }
  };

  const saveSettings = async (next: AiSettings) => {
    setSettings(next);
    const res = await fetch('/api/campaigns/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'settings', settings: next }) });
    const data = await res.json().catch(() => ({}));
    if (data.settings) setSettings(data.settings);
    setSavedSettings(true);
    window.setTimeout(() => setSavedSettings(false), 2000);
  };

  const r = latest?.report;

  return (
    <div className="space-y-4">
      <div className={`${CARD} p-5`}>
        <h2 className={`${H2} flex items-center gap-2`}><Bot className="w-4 h-4 text-amber-500" /> {t('cp.ai.title')}</h2>
        <p className="text-xs text-slate-600 dark:text-gray-300 mt-1 max-w-3xl">{t('cp.ai.intro')}</p>
        {!configured && !loading && (
          <p className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {t('cp.ai.noKey')}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Seg label={t('cp.ai.days')} value={days} onChange={setDays} options={[7, 14, 30, 90].map((n) => ({ value: n, label: t('cp.range', { n }) }))} />
          <Seg label={t('cp.ai.lang')} value={lang} onChange={setLang} options={[{ value: 'kh', label: 'ខ្មែរ' }, { value: 'en', label: 'EN' }]} />
          <select value={page} onChange={(e) => setPage(e.target.value)} aria-label={t('cp.ai.page')} className="px-3 py-2 rounded-lg bg-white dark:bg-[#06100B] border border-slate-300 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white max-w-[240px]">
            <option value="">{t('cp.allPages')}</option>
            {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
          </select>
          <button type="button" className={BTN_PRIMARY} onClick={() => void run()} disabled={running || !configured}>
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {running ? t('cp.ai.running') : t('cp.ai.run')}
          </button>
        </div>
        <p className={`${SUB} mt-2`}>{t('cp.ai.cost')}</p>
        {error && <p role="alert" className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">{error}</p>}
      </div>

      {loading && !latest && <p className={`${SUB} flex items-center gap-2`}><Loader2 className="w-4 h-4 animate-spin" /> {t('cp.loading')}</p>}
      {!loading && !r && <div className={`${CARD} p-5 text-xs text-slate-600 dark:text-gray-300`}>{t('cp.ai.none')}</div>}

      {r && latest && (
        <>
          <div className={`${CARD} p-5`}>
            <p className={SUB}>
              {t('cp.ai.generated', { when: when(latest.generatedAt), days: latest.days, visits: latest.basis.visits, leads: latest.basis.leads, won: latest.basis.won })} · {latest.trigger === 'daily' ? t('cp.ai.daily') : t('cp.ai.manual')}
            </p>
            <p className="mt-2 text-base font-bold text-slate-900 dark:text-white leading-snug">{r.headline}</p>
            <p className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold ${r.dataQuality.level === 'good' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'}`}>
              {t(`cp.ai.dq.${r.dataQuality.level}`)}
            </p>
            {r.dataQuality.note && <p className="mt-1 text-xs text-slate-600 dark:text-gray-300">{r.dataQuality.note}</p>}
          </div>

          {r.actions.length > 0 && (
            <div className={`${CARD} p-5`}>
              <h2 className={H2}>{t('cp.ai.actions')}</h2>
              <ol className="mt-3 space-y-3">
                {r.actions.map((a, i) => (
                  <li key={i} className="p-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/60 dark:bg-black/10">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-amber-400 text-black text-xs font-black shrink-0">{i + 1}</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{a.title}</span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400">{t(`cp.area.${a.area}`)}</span>
                      <span className={`text-[11px] font-bold ${IMPACT_STYLE[a.impact]}`}>{t('cp.ai.impact')}: {t(`cp.ai.lv.${a.impact}`)}</span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400">{t('cp.ai.effort')}: {t(`cp.ai.lv.${a.effort}`)}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-700 dark:text-gray-300">{a.why}</p>
                    {a.how.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-slate-800 dark:text-gray-200 list-disc pl-5">
                        {a.how.map((h, j) => <li key={j}>{h}</li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="grid [&>*]:min-w-0 lg:grid-cols-2 gap-4">
            {r.campaigns.length > 0 && (
              <div className={`${CARD} p-5`}>
                <h2 className={H2}>{t('cp.ai.verdicts')}</h2>
                <ul className="mt-3 space-y-2">
                  {r.campaigns.map((c, i) => (
                    <li key={i} className="text-xs">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold mr-2 ${VERDICT_STYLE[c.verdict]}`}>{t(`cp.ai.v.${c.verdict}`)}</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{c.key}</span>
                      <p className="mt-0.5 text-slate-600 dark:text-gray-300">{c.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.insights.length > 0 && (
              <div className={`${CARD} p-5`}>
                <h2 className={H2}>{t('cp.ai.insights')}</h2>
                <ul className="mt-3 space-y-2">
                  {r.insights.map((x, i) => (
                    <li key={i} className="text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">{x.title} <span className="font-semibold text-slate-500 dark:text-gray-400">· {t(`cp.area.${x.area}`)}</span></p>
                      <p className="text-slate-600 dark:text-gray-300">{x.evidence}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid [&>*]:min-w-0 lg:grid-cols-2 gap-4">
            {r.experiments.length > 0 && (
              <div className={`${CARD} p-5`}>
                <h2 className={H2}>{t('cp.ai.experiments')}</h2>
                <ul className="mt-3 space-y-3">
                  {r.experiments.map((x, i) => (
                    <li key={i} className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-white">{x.name} <span className="font-semibold text-slate-500 dark:text-gray-400">· {t('cp.ai.exp.days', { n: x.days })}</span></p>
                      <p className="text-slate-700 dark:text-gray-300"><b>{t('cp.ai.exp.hypothesis')}:</b> {x.hypothesis}</p>
                      <p className="text-slate-700 dark:text-gray-300"><b>{t('cp.ai.exp.change')}:</b> {x.change}</p>
                      <p className="text-slate-700 dark:text-gray-300"><b>{t('cp.ai.exp.metric')}:</b> {x.metric}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.adIdeas.length > 0 && (
              <div className={`${CARD} p-5`}>
                <h2 className={H2}>{t('cp.ai.adIdeas')}</h2>
                <ul className="mt-3 space-y-3">
                  {r.adIdeas.map((x, i) => (
                    <li key={i} className="text-xs p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-emerald-900/60">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400">{x.channel} · {x.angle}</p>
                      <p className="mt-1 font-bold text-slate-900 dark:text-white">{x.headline}</p>
                      <p className="mt-1 whitespace-pre-line text-slate-700 dark:text-gray-300">{x.primaryText}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {r.salesFollowUp && (
            <div className={`${CARD} p-5`}>
              <h2 className={H2}>{t('cp.ai.sales')}</h2>
              <p className="mt-2 text-xs text-slate-700 dark:text-gray-300 whitespace-pre-line">{r.salesFollowUp}</p>
            </div>
          )}
        </>
      )}

      {settings && (
        <div className={`${CARD} p-5 space-y-3`}>
          <h2 className={H2}>{t('cp.ai.settings')}</h2>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-amber-400" checked={settings.daily} onChange={(e) => void saveSettings({ ...settings, daily: e.target.checked })} /> {t('cp.ai.setDaily')}
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-amber-400" checked={settings.telegram} onChange={(e) => void saveSettings({ ...settings, telegram: e.target.checked })} /> {t('cp.ai.setTelegram')}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-gray-400">{t('cp.ai.setLang')}</span>
            <Seg label={t('cp.ai.setLang')} value={settings.lang} onChange={(v) => void saveSettings({ ...settings, lang: v })} options={[{ value: 'kh', label: 'ខ្មែរ' }, { value: 'en', label: 'EN' }]} />
            <span className="text-xs font-semibold text-slate-600 dark:text-gray-400">{t('cp.ai.setDays')}</span>
            <Seg label={t('cp.ai.setDays')} value={settings.days} onChange={(v) => void saveSettings({ ...settings, days: v })} options={[7, 14, 30].map((n) => ({ value: n, label: t('cp.range', { n }) }))} />
            {savedSettings && <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">✓</span>}
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div className={`${CARD} p-5`}>
          <h2 className={H2}>{t('cp.ai.history')}</h2>
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-emerald-950/60">
            {history.slice(1).map((h) => (
              <li key={h.generatedAt} className="py-2 text-xs">
                <p className={SUB}>{when(h.generatedAt)} · {t('cp.range', { n: h.days })} · {h.basis.visits} / {h.basis.leads}</p>
                <p className="text-slate-800 dark:text-gray-200">{h.headline}</p>
                {h.actions.length > 0 && <p className="text-slate-500 dark:text-gray-400">→ {h.actions.join(' · ')}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
