'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { History, Image as ImageIcon, LayoutList, RotateCcw, X } from 'lucide-react';
import type { LandingPage } from '@/lib/types';
import { normalizeBuilderDoc } from '@/lib/builder';
import { useLanguage } from '@/context/LanguageContext';

interface Version {
  savedAt: string;
  page: LandingPage;
  kind: 'save' | 'pack' | 'auto';
}

/** Photos and videos a version holds (uploads and site images), to tell versions apart. */
function mediaCount(page: LandingPage): number {
  const json = JSON.stringify({ b: page.builder, s: page.isolatedSettings, o: page.ogImage });
  const found = json.match(/(?:\/api\/uploads\/|https:\/\/[^"]+\/storage\/v1\/object\/public\/|\/images\/)[^"]+/g) || [];
  return new Set(found).size;
}

/**
 * Earlier versions of the page: one is kept on every save (last 15) plus the copy kept
 * before an automatic content update. "Load into editor" puts a version in the editor
 * as unsaved changes; the owner checks it and presses Save (Undo also works).
 */
export default function BuilderVersions({ pageId, onLoad, onClose }: { pageId: string; onLoad: (page: LandingPage, label: string) => void; onClose: () => void }) {
  const { t, lang } = useLanguage();
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetch(`/api/pages/${pageId}/history`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { versions?: Array<{ savedAt: string; page: LandingPage }>; autosaves?: Array<{ savedAt: string; page: LandingPage }>; packBackup?: LandingPage | null }) => {
        if (!alive) return;
        const list: Version[] = [
          ...(data.versions || []).map((v) => ({ ...v, kind: 'save' as const })),
          ...(data.autosaves || []).map((v) => ({ ...v, kind: 'auto' as const })),
        ];
        if (data.packBackup) list.push({ savedAt: data.packBackup.updatedAt || '', page: data.packBackup, kind: 'pack' });
        list.sort((a, b) => Date.parse(b.savedAt || '0') - Date.parse(a.savedAt || '0'));
        setVersions(list);
      })
      .catch(() => alive && setError(t('builder.versions.error')));
    return () => {
      alive = false;
    };
  }, [pageId, t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const when = (iso: string) =>
    iso
      ? new Date(iso).toLocaleString(lang === 'kh' ? 'km-KH' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Phnom_Penh' })
      : '–';

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 bg-black/60" role="dialog" aria-modal="true" aria-label={t('builder.versions')} onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 shadow-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()} data-versions="">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><History className="w-4 h-4 text-amber-500" />{t('builder.versions')}</div>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">{t('builder.versions.intro')}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer" aria-label={t('common.close')}><X className="w-4 h-4" /></button>
        </div>
        {error && <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
        {!versions && !error && <p className="text-xs text-slate-500">{t('common.loading')}</p>}
        {versions && versions.length === 0 && <p className="text-xs text-slate-500">{t('builder.versions.none')}</p>}
        <ul className="space-y-2">
          {versions?.map((v, i) => {
            const doc = v.page.builder ? normalizeBuilderDoc(v.page.builder) : null;
            const label = v.kind === 'pack' ? t('builder.versions.pack') : v.kind === 'auto' ? t('builder.versions.auto') : t('builder.versions.saved');
            return (
              <li key={`${v.kind}-${v.savedAt}-${i}`} className="p-3 rounded-xl border border-slate-200 dark:border-emerald-900/60 flex items-center justify-between gap-3" data-version={v.kind}>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">{when(v.savedAt)}</div>
                  <div className="text-[11px] text-slate-600 dark:text-gray-400">{label}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1"><LayoutList className="w-3.5 h-3.5" />{t('builder.versions.sections', { n: doc?.blocks.length ?? 0 })}</span>
                    <span className="inline-flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" />{t('builder.versions.media', { n: mediaCount(v.page) })}</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!doc}
                  onClick={() => onLoad(v.page, `${when(v.savedAt)} · ${label}`)}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-extrabold cursor-pointer disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />{t('builder.versions.load')}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
