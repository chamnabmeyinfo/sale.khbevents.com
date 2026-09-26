'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, DatabaseBackup, Download, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import type { BackupEntry, DataHealth, RestoreRequest } from '@/lib/backups';
import { useLanguage } from '@/context/LanguageContext';

const CARD = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6 shadow-sm';
const BTN = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const KIND_STYLE: Record<string, string> = {
  deploy: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-900',
  daily: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  before: 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  manual: 'bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-900',
};

/**
 * Admin → Settings & Security → Backups. Data health (now vs the last snapshot), the
 * list of snapshots, Back up now, Download and Restore (RESTORE must be typed; a
 * snapshot is taken before restoring, so a restore can be undone).
 */
export default function BackupsPanel() {
  const { t, lang } = useLanguage();
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [health, setHealth] = useState<DataHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  const [notice, setNotice] = useState('');
  const [restoring, setRestoring] = useState<BackupEntry | null>(null);
  const [parts, setParts] = useState<RestoreRequest['parts']>({ pages: true, leads: true, settings: false });
  const [mode, setMode] = useState<RestoreRequest['mode']>('add-missing');
  const [confirm, setConfirm] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/backups', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t('backups.err.load'));
      setBackups(data.backups);
      setHealth(data.health);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const backupNow = async () => {
    setBusy('backup');
    setNotice('');
    setError('');
    try {
      const res = await fetch('/api/backups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: 'manual' }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t('backups.err.create'));
      setNotice(t('backups.created'));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    if (!restoring || confirm !== 'RESTORE') return;
    setBusy('restore');
    setNotice('');
    setError('');
    try {
      const res = await fetch(`/api/backups/${encodeURIComponent(restoring.name)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm, parts, mode }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t('backups.err.restore'));
      const r = data.restored as Record<string, number>;
      setNotice(t('backups.restored', { pages: r.landing_pages, leads: r.leads, settings: r.system_settings }));
      setRestoring(null);
      setConfirm('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const when = (iso: string) => new Date(iso).toLocaleString(lang === 'kh' ? 'km-KH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Phnom_Penh' });
  const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

  return (
    <div className="space-y-5" data-backups="">
      <div className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"><DatabaseBackup className="w-4 h-4 text-amber-500" />{t('backups.title')}</h2>
            <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 max-w-2xl">{t('backups.intro')}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()} disabled={loading} className={`${BTN} bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300`}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />{t('backups.refresh')}</button>
            <button type="button" onClick={() => void backupNow()} disabled={busy !== null} className={`${BTN} bg-amber-400 hover:bg-amber-300 text-black`} data-backup-now="">{busy === 'backup' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DatabaseBackup className="w-3.5 h-3.5" />}{t('backups.now')}</button>
          </div>
        </div>

        {health && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex flex-wrap items-center gap-3 ${health.ok ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'}`} data-health={health.ok ? 'ok' : 'drop'}>
            {health.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span className="font-bold">{health.ok ? t('backups.health.ok') : t('backups.health.drop')}</span>
            <span>{t('backups.health.now', { pages: health.now.pages, leads: health.now.leads })}</span>
            {health.last && <span>{t('backups.health.last', { when: when(health.last.takenAt), pages: health.last.counts.pages, leads: health.last.counts.leads })}</span>}
            {health.drop && health.drop.missingPages.length > 0 && <span>{t('backups.health.missing', { pages: health.drop.missingPages.join(', ') })}</span>}
          </div>
        )}
        {notice && <p className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{notice}</p>}
        {error && <p className="mt-3 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</p>}
      </div>

      <div className={CARD}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('backups.list')}</h3>
        <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">{t('backups.listHint')}</p>
        {loading && backups.length === 0 && <p className="mt-3 text-xs text-slate-500">{t('common.loading')}</p>}
        {!loading && backups.length === 0 && <p className="mt-3 text-xs text-slate-500">{t('backups.none')}</p>}
        <ul className="mt-3 space-y-2">
          {backups.map((b) => (
            <li key={b.name} className="p-3 rounded-xl border border-slate-200 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-3" data-backup={b.kind}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${KIND_STYLE[b.kind] || ''}`}>{t(`backups.kind.${b.kind}`)}</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">{when(b.takenAt)}</span>
                  {b.drop && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">{t('backups.dropTag')}</span>}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-gray-400 mt-1">
                  {b.label} · {t('backups.counts', { pages: b.counts.pages, leads: b.counts.leads, rows: b.counts.settingsRows })} · {size(b.bytes)}
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`/api/backups/${encodeURIComponent(b.name)}`} className={`${BTN} bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300`}><Download className="w-3.5 h-3.5" />{t('backups.download')}</a>
                <button type="button" onClick={() => { setRestoring(b); setConfirm(''); }} className={`${BTN} bg-white dark:bg-black/30 border border-amber-400 text-amber-800 dark:text-amber-300`}><RotateCcw className="w-3.5 h-3.5" />{t('backups.restore')}</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {restoring && (
        <div className={`${CARD} border-amber-300 dark:border-amber-700`} data-restore-box="">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><RotateCcw className="w-4 h-4 text-amber-500" />{t('backups.restoreTitle', { when: when(restoring.takenAt) })}</h3>
          <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">{t('backups.restoreIntro')}</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t('backups.what')}</div>
              {([['pages', t('backups.part.pages', { n: restoring.counts.pages })], ['leads', t('backups.part.leads', { n: restoring.counts.leads })], ['settings', t('backups.part.settings', { n: restoring.counts.settingsRows })]] as const).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-xs text-slate-800 dark:text-gray-200 py-1 cursor-pointer">
                  <input type="checkbox" checked={parts[k]} onChange={(e) => setParts({ ...parts, [k]: e.target.checked })} className="accent-amber-500" />{label}
                </label>
              ))}
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t('backups.how')}</div>
              {(['add-missing', 'overwrite'] as const).map((m) => (
                <label key={m} className="flex items-start gap-2 text-xs text-slate-800 dark:text-gray-200 py-1 cursor-pointer">
                  <input type="radio" name="restore-mode" checked={mode === m} onChange={() => setMode(m)} className="mt-0.5 accent-amber-500" />
                  <span><strong>{t(`backups.mode.${m}`)}</strong><br /><span className="text-slate-500 dark:text-gray-400">{t(`backups.mode.${m}.hint`)}</span></span>
                </label>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-gray-400">{t('backups.undoNote')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor="restore-confirm" className="text-xs text-slate-700 dark:text-gray-300">{t('backups.typeRestore')}</label>
            <input id="restore-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" placeholder="RESTORE" className="w-32 px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono" />
            <button type="button" onClick={() => void restore()} disabled={busy !== null || confirm !== 'RESTORE' || (!parts.pages && !parts.leads && !parts.settings)} className={`${BTN} bg-amber-400 hover:bg-amber-300 text-black`} data-restore-go="">
              {busy === 'restore' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}{t('backups.restoreGo')}
            </button>
            <button type="button" onClick={() => setRestoring(null)} className={`${BTN} bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300`}>{t('common.cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
