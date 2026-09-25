'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eraser, Loader2, RefreshCw } from 'lucide-react';
import type { ClearDemoResult, DemoScan } from '@/lib/demo-data';
import { useLanguage } from '@/context/LanguageContext';

const CARD = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6 shadow-sm';
const REASON_STYLE: Record<string, string> = {
  simulation: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900',
  sample: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900',
  test: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900',
};

/**
 * Admin → Settings & Security → Demo data. Scans for demo and test data,
 * shows every lead it would delete (each can be unticked), and deletes only
 * after the word DELETE is typed. Real leads are never matched: see demo-data.ts.
 */
export default function ClearDemoData() {
  const { t } = useLanguage();
  const [scan, setScan] = useState<DemoScan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removeSampleStaff, setRemoveSampleStaff] = useState(true);
  const [routingLog, setRoutingLog] = useState<'none' | 'demo' | 'all'>('demo');
  const [resetStats, setResetStats] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<ClearDemoResult | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/demo-data', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Scan failed');
      setScan(data.scan);
      setSelected(new Set((data.scan as DemoScan).leads.map((l) => l.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const nothingChosen = useMemo(
    () => selected.size === 0 && !(removeSampleStaff && scan?.sampleStaff.length) && routingLog !== 'all' && !resetStats,
    [selected, removeSampleStaff, scan, routingLog, resetStats]
  );

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/demo-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: Array.from(selected), removeSampleStaff, routingLog, resetStats, confirm }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Delete failed');
      setDone(data.result);
      setScan(data.scan);
      setSelected(new Set((data.scan as DemoScan).leads.map((l) => l.id)));
      setConfirm('');
      setResetStats(false);
      setRoutingLog('demo');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={CARD}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"><Eraser className="w-4 h-4 text-amber-500" /> {t('demo.title')}</h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-2xl">{t('demo.intro')}</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading || busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-[11px] font-bold text-slate-800 dark:text-emerald-300 cursor-pointer disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('demo.rescan')}
          </button>
        </div>

        {done && (
          <div role="status" className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {t('demo.done', { leads: done.leadsDeleted, staff: done.staffRemoved, logs: done.logEntriesRemoved })}{done.statsReset ? ` ${t('demo.doneStats')}` : ''}
          </div>
        )}
        {error && <div role="alert" className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">{error}</div>}
        {loading && !scan && <p className="mt-4 text-xs text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('demo.scanning')}</p>}
      </div>

      {scan && (
        <>
          <div className={CARD}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('demo.leads', { n: scan.leads.length })}</h3>
              {scan.leads.length > 0 && (
                <div className="flex gap-2 text-[11px] font-bold">
                  <button type="button" className="text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer" onClick={() => setSelected(new Set(scan.leads.map((l) => l.id)))}>{t('demo.all')}</button>
                  <button type="button" className="text-slate-500 hover:underline cursor-pointer" onClick={() => setSelected(new Set())}>{t('demo.none')}</button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">{t('demo.leadsHint')}</p>
            {scan.leads.length === 0 ? (
              <p className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t('demo.noLeads')}</p>
            ) : (
              <ul className="mt-3 max-h-80 overflow-auto divide-y divide-slate-100 dark:divide-emerald-950/60 border border-slate-100 dark:border-emerald-950/60 rounded-xl">
                {scan.leads.map((l) => (
                  <li key={l.id}>
                    <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-emerald-950/30">
                      <input type="checkbox" className="w-4 h-4 accent-amber-400" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">{l.fullName || l.id}</span>
                        <span className="block text-[10px] text-slate-500 dark:text-gray-400 truncate">/{l.landingPageSlug} · {new Date(l.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      <span className="flex flex-wrap gap-1 justify-end">
                        {l.reasons.map((r) => <span key={r} className={`px-1.5 py-0.5 rounded-full border text-[10px] font-bold ${REASON_STYLE[r]}`}>{t(`demo.reason.${r}`)}</span>)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`${CARD} space-y-3 text-xs text-slate-700 dark:text-gray-300`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('demo.more')}</h3>
            <label className={`flex items-start gap-2 ${scan.sampleStaff.length ? 'cursor-pointer' : 'opacity-60'}`}>
              <input type="checkbox" className="w-4 h-4 mt-0.5 accent-amber-400" disabled={!scan.sampleStaff.length} checked={removeSampleStaff && scan.sampleStaff.length > 0} onChange={(e) => setRemoveSampleStaff(e.target.checked)} />
              <span>
                <strong>{t('demo.sampleStaff', { n: scan.sampleStaff.length })}</strong>
                <span className="block text-[11px] text-slate-500 dark:text-gray-400">{scan.sampleStaff.length ? scan.sampleStaff.map((s) => `${s.name} (@${s.username})`).join(', ') : t('demo.sampleStaffNone')}</span>
              </span>
            </label>
            <fieldset className="space-y-1.5">
              <legend className="font-bold">{t('demo.log', { n: scan.routingLog.total })}</legend>
              {(['demo', 'all', 'none'] as const).map((v) => (
                <label key={v} className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="demo-log" className="mt-0.5 accent-amber-400" checked={routingLog === v} onChange={() => setRoutingLog(v)} />
                  <span>{t(`demo.log.${v}`, { n: scan.routingLog.linkedToDemoLeads })}</span>
                </label>
              ))}
            </fieldset>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 mt-0.5 accent-amber-400" checked={resetStats} onChange={(e) => setResetStats(e.target.checked)} />
              <span>
                <strong>{t('demo.stats')}</strong>
                <span className="block text-[11px] text-slate-500 dark:text-gray-400">{t('demo.statsHint', { views: scan.stats.pageViews, popups: scan.stats.popupsWithStats, staff: scan.stats.staffWithCounts })}</span>
              </span>
            </label>
          </div>

          <div className={`${CARD} border-rose-200 dark:border-rose-900/60`}>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {t('demo.warning')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label htmlFor="demo-confirm" className="text-xs font-bold text-slate-700 dark:text-gray-300">{t('demo.type')}</label>
              <input id="demo-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" placeholder="DELETE" className="w-32 px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono" />
              <button type="button" onClick={() => void run()} disabled={busy || confirm !== 'DELETE' || nothingChosen} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-[#fff] on-dark font-extrabold text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eraser className="w-4 h-4" />} {t(selected.size === 1 ? 'demo.run1' : 'demo.run', { n: selected.size })}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
