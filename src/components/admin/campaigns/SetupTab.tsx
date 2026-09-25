'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { ConversionResult, ConversionSettings } from '@/lib/conversions';
import { BTN_PRIMARY, CARD, H2, INPUT, LABEL, SUB } from './ui';

interface SetupData {
  tokens: { meta: boolean; tiktok: boolean; anthropic: boolean };
  settings: ConversionSettings;
  log: ConversionResult[];
  pixels: Array<{ slug: string; title: string; id: string; meta: string; tiktok: string }>;
}

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Phnom_Penh' });

export default function SetupTab() {
  const { t } = useLanguage();
  const [data, setData] = useState<SetupData | null>(null);
  const [codes, setCodes] = useState<ConversionSettings>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/campaigns/conversions', { cache: 'no-store' });
    const json = await res.json().catch(() => null);
    if (json?.success) {
      setData(json);
      setCodes(json.settings || {});
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/campaigns/conversions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: codes }) });
    const json = await res.json().catch(() => null);
    if (json?.settings) setCodes(json.settings);
    setSaving(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  if (!data) return <p className={`${SUB} flex items-center gap-2`}><Loader2 className="w-4 h-4 animate-spin" /> {t('cp.loading')}</p>;

  const keyRow = (ok: boolean, title: string, how: string) => (
    <li className="flex gap-3 items-start">
      {ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-slate-400 shrink-0" />}
      <div className="text-xs">
        <p className="font-bold text-slate-900 dark:text-white">{title} · <span className={ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}>{ok ? t('cp.setup.set') : t('cp.setup.missing')}</span></p>
        {!ok && <p className="text-slate-600 dark:text-gray-300 mt-0.5">{how}</p>}
      </div>
    </li>
  );

  return (
    <div className="space-y-4">
      <div className={`${CARD} p-5`}>
        <p className="text-xs text-slate-700 dark:text-gray-300 max-w-3xl">{t('cp.setup.intro')}</p>
        <h2 className={`${H2} mt-4`}>{t('cp.setup.tokens')}</h2>
        <ul className="mt-3 space-y-3">
          {keyRow(data.tokens.meta, t('cp.setup.meta'), t('cp.setup.howMeta'))}
          {keyRow(data.tokens.tiktok, t('cp.setup.tiktok'), t('cp.setup.howTiktok'))}
          {keyRow(data.tokens.anthropic, t('cp.setup.ai'), t('cp.setup.howAi'))}
        </ul>
        <p className={`${SUB} mt-3`}>{t('cp.setup.redeploy')}</p>
      </div>

      <div className={`${CARD} p-5`}>
        <h2 className={H2}>{t('cp.setup.pixels')}</h2>
        <div className="overflow-x-auto">
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-[10px] text-slate-500 dark:text-gray-400 text-left">
              <th className="py-1 font-bold">{t('cp.ai.page')}</th>
              <th className="py-1 font-bold">Meta</th>
              <th className="py-1 font-bold">TikTok</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.pixels.map((p) => (
              <tr key={p.slug} className="border-t border-slate-100 dark:border-emerald-950/60">
                <td className="py-1.5 pr-2 font-semibold text-slate-800 dark:text-gray-200 max-w-[220px] truncate">{p.title}</td>
                <td className="py-1.5 font-mono text-slate-600 dark:text-gray-300">{p.meta || <span className="text-slate-400">{t('cp.setup.pixelNone')}</span>}</td>
                <td className="py-1.5 font-mono text-slate-600 dark:text-gray-300">{p.tiktok || <span className="text-slate-400">{t('cp.setup.pixelNone')}</span>}</td>
                <td className="py-1.5 text-right"><Link href={`/admin/pages/${p.id}?tab=tracking`} className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline">{t('cp.setup.editPixels')}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className={`${CARD} p-5 space-y-3`}>
        <h2 className={H2}>{t('cp.setup.test')}</h2>
        <p className={SUB}>{t('cp.setup.testHint')}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor="meta-test">{t('cp.setup.metaTest')}</label>
            <input id="meta-test" className={`${INPUT} font-mono`} value={codes.metaTestCode || ''} onChange={(e) => setCodes({ ...codes, metaTestCode: e.target.value.trim() || undefined })} placeholder="TEST12345" />
          </div>
          <div>
            <label className={LABEL} htmlFor="tt-test">{t('cp.setup.tiktokTest')}</label>
            <input id="tt-test" className={`${INPUT} font-mono`} value={codes.tiktokTestCode || ''} onChange={(e) => setCodes({ ...codes, tiktokTestCode: e.target.value.trim() || undefined })} placeholder="TEST12345" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={BTN_PRIMARY} onClick={() => void save()} disabled={saving}>{t('cp.setup.save')}</button>
          {saved && <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{t('cp.setup.saved')}</span>}
        </div>
      </div>

      <div className={`${CARD} p-5`}>
        <h2 className={H2}>{t('cp.setup.log')}</h2>
        {data.log.length === 0 ? <p className={`${SUB} mt-2`}>{t('cp.setup.logEmpty')}</p> : (
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-emerald-950/60">
            {data.log.map((l, i) => (
              <li key={i} className="py-1.5 text-xs flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className={`font-bold ${l.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-300'}`}>{l.ok ? t('cp.setup.ok') : t('cp.setup.fail')}</span>
                <span className="font-semibold text-slate-800 dark:text-gray-200">{l.platform === 'meta' ? 'Meta' : 'TikTok'}</span>
                {l.test && <span className="px-1.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-[10px] font-bold">{t('cp.setup.testTag')}</span>}
                <span className="text-slate-500 dark:text-gray-400">/{l.page} · {when(l.at)}{l.status ? ` · HTTP ${l.status}` : ''}</span>
                {l.message && <span className="w-full text-[11px] text-slate-500 dark:text-gray-400 break-words">{l.message}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
