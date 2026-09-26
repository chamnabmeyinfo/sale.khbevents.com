'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { BuilderDoc, Lang } from '@/lib/builder';
import { BlockView, BuilderRoot, type RenderContext } from '@/components/builder/BuilderBlocks';
import { useLanguage } from '@/context/LanguageContext';

const WIDTHS = [1280, 1440, 1920] as const;
type Width = (typeof WIDTHS)[number];

/**
 * The page at a real desktop width, over the whole editor. Wider than the screen,
 * it is scaled down (CSS zoom) so the layout is the desktop one, not the phone one.
 */
export default function BuilderFullPreview({ doc, ctx, lang, onLang, onClose, slug }: {
  doc: BuilderDoc;
  ctx: RenderContext;
  lang: Lang;
  onLang: (l: Lang) => void;
  onClose: () => void;
  slug: string;
}) {
  const { t } = useLanguage();
  const [width, setWidth] = useState<Width>(1440);
  const [avail, setAvail] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => setAvail(el.clientWidth - 32);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      html.style.overflow = prev;
    };
  }, [onClose]);

  const zoom = avail > 0 ? Math.min(1, avail / width) : 1;
  const seg = (active: boolean) => `px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${active ? 'bg-amber-400 text-black shadow' : 'text-[#fff] on-dark opacity-70 hover:opacity-100'}`;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex flex-col bg-slate-950" role="dialog" aria-modal="true" aria-label={t('builder.fullPreview.title')}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-[#ffffff1a]">
        <div className="min-w-0">
          <div className="text-sm font-black text-[#fff] on-dark">{t('builder.fullPreview.title')}</div>
          <div className="text-[10px] text-[#94A3B8]">
            {zoom < 1 ? t('builder.fullPreview.scaled', { w: width, pct: Math.round(zoom * 100) }) : t('builder.fullPreview.actual', { w: width })} · {t('builder.fullPreview.esc')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-1 rounded-xl bg-white/10" role="group" aria-label={t('builder.fullPreview.width')}>
            {WIDTHS.map((w) => (
              <button key={w} type="button" aria-pressed={w === width} onClick={() => setWidth(w)} className={seg(w === width)}>
                {t(`builder.fullPreview.w${w}`)}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-white/10" role="group" aria-label="Language">
            {(['en', 'kh'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={l === lang} onClick={() => onLang(l)} className={seg(l === lang)}>{l === 'en' ? 'EN' : 'ខ្មែរ'}</button>
            ))}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-extrabold cursor-pointer hover:bg-amber-300">
            <X className="w-4 h-4" />{t('common.close')}
          </button>
        </div>
      </div>
      <div ref={areaRef} className="flex-1 overflow-auto p-4" data-full-preview="">
        <div className="mx-auto rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-white" style={{ width: Math.round(width * zoom) }}>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-600">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="flex-1 min-w-0 truncate text-center text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/80">sale.khbevents.com/{slug}</span>
          </div>
          <div style={{ width, zoom }}>
            <BuilderRoot brand={doc.brand} lang={lang}>
              {doc.blocks.map((block) => <BlockView key={block.id} block={block} ctx={ctx} />)}
            </BuilderRoot>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
