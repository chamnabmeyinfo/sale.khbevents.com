'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, GripVertical, Wand2 } from 'lucide-react';
import type { BuilderBlock, BuilderDoc, Lang } from '@/lib/builder';
import { BLOCK_DEFINITIONS, pick } from '@/lib/builder';
import { FLOW, STAGE_OF, blockLabel, orderIssues, sameOrder, suggestedOrder, type FlowStage, type OrderIssue } from '@/lib/page-order';
import { BlockView, BuilderRoot, type RenderContext } from '@/components/builder/BuilderBlocks';
import { useLanguage } from '@/context/LanguageContext';

const STAGE_STYLE: Record<FlowStage, { bar: string; chip: string }> = {
  attention: { bar: 'bg-amber-400', chip: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300' },
  why: { bar: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-300' },
  details: { bar: 'bg-sky-500', chip: 'bg-sky-100 text-sky-900 dark:bg-sky-400/15 dark:text-sky-300' },
  price: { bar: 'bg-violet-500', chip: 'bg-violet-100 text-violet-900 dark:bg-violet-400/15 dark:text-violet-300' },
  action: { bar: 'bg-rose-500', chip: 'bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-300' },
  doubts: { bar: 'bg-teal-500', chip: 'bg-teal-100 text-teal-900 dark:bg-teal-400/15 dark:text-teal-300' },
  rules: { bar: 'bg-slate-500', chip: 'bg-slate-200 text-slate-800 dark:bg-slate-400/15 dark:text-slate-300' },
  close: { bar: 'bg-orange-500', chip: 'bg-orange-100 text-orange-900 dark:bg-orange-400/15 dark:text-orange-300' },
  footer: { bar: 'bg-stone-500', chip: 'bg-stone-200 text-stone-800 dark:bg-stone-400/15 dark:text-stone-300' },
};

const SEVERITY_STYLE: Record<OrderIssue['severity'], string> = {
  high: 'text-rose-700 dark:text-rose-300',
  medium: 'text-amber-800 dark:text-amber-300',
  tip: 'text-slate-500 dark:text-gray-400',
};

const THUMB_W = 168;
const THUMB_SOURCE_W = 1280;

/** A small, still picture of one section at desktop width. */
function Thumb({ block, doc, ctx, lang }: { block: BuilderBlock; doc: BuilderDoc; ctx: RenderContext; lang: Lang }) {
  const still = useMemo(() => ({ ...block, style: { ...block.style, animation: 'none', bgVideo: undefined } }) as BuilderBlock, [block]);
  return (
    <div className="relative shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-emerald-900/60 bg-white" style={{ width: THUMB_W, height: 96 }} aria-hidden="true" inert>
      <div className="pointer-events-none select-none" style={{ width: THUMB_SOURCE_W, zoom: THUMB_W / THUMB_SOURCE_W }}>
        <BuilderRoot brand={doc.brand} lang={lang}>
          <BlockView block={still} ctx={ctx} />
        </BuilderRoot>
      </div>
    </div>
  );
}

/**
 * The page as a list of small pictures in order, with the buyer's journey beside each
 * section, advice on what is out of place, and a suggested order to apply in one click.
 */
export default function BuilderPageMap({ doc, ctx, lang, selectedId, onSelect, onMove, onApply }: {
  doc: BuilderDoc;
  ctx: RenderContext;
  lang: Lang;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onApply: (blocks: BuilderBlock[]) => void;
}) {
  const { t, lang: uiLang } = useLanguage();
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const blocks = doc.blocks;
  const issues = useMemo(() => orderIssues(blocks), [blocks]);
  const suggestion = useMemo(() => suggestedOrder(blocks), [blocks]);
  const inOrder = sameOrder(blocks, suggestion);
  const pageIssues = issues.filter((i) => !i.blockId);
  const present = new Set(blocks.map((b) => STAGE_OF[b.type]));
  const name = (b: BuilderBlock) => pick(BLOCK_DEFINITIONS[b.type].name, uiLang);

  const drop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const target = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
    const from = dragFrom;
    setDragFrom(null);
    setDropAt(null);
    if (from === null) return;
    const to = target > from ? target - 1 : target;
    if (to !== from) onMove(from, to);
  };

  if (!blocks.length) return <p className="p-6 text-center text-sm text-slate-500">{t('builder.map.empty')}</p>;

  return (
    <div className="space-y-4" data-page-map="">
      {/* The journey */}
      <div className="p-3 rounded-xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-emerald-500/80">{t('builder.map.flowTitle')}</div>
        <ol className="mt-2 flex flex-wrap items-center gap-1">
          {FLOW.map((s, i) => (
            <li key={s} className="flex items-center gap-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STAGE_STYLE[s].chip} ${present.has(s) ? '' : 'opacity-40'}`} title={t(`builder.stage.${s}.hint`)}>
                {i + 1}. {t(`builder.stage.${s}`)}
              </span>
              {i < FLOW.length - 1 && <span className="text-slate-300 text-[10px]" aria-hidden="true">→</span>}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[10px] text-slate-500 dark:text-gray-400">{t('builder.map.flowHint')}</p>
      </div>

      {/* Verdict and suggestion */}
      {inOrder ? (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{t('builder.map.good')}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/30 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">{t('builder.map.suggested')}</div>
            <button type="button" onClick={() => onApply(suggestion)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-extrabold cursor-pointer">
              <Wand2 className="w-3.5 h-3.5" />{t('builder.map.apply')}
            </button>
          </div>
          <ol className="flex flex-wrap gap-1">
            {suggestion.map((b, i) => (
              <li key={b.id} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${blocks[i]?.id === b.id ? 'border-transparent bg-white/70 dark:bg-black/20 text-slate-600 dark:text-gray-300' : 'border-amber-400 bg-white dark:bg-black/30 text-slate-900 dark:text-white'}`}>
                {i + 1}. {name(b)}
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-slate-600 dark:text-gray-400">{t('builder.map.applyHint')}</p>
        </div>
      )}
      {pageIssues.length > 0 && (
        <ul className="space-y-1">
          {pageIssues.map((i) => <li key={i.key} className={`text-[11px] font-semibold ${SEVERITY_STYLE[i.severity]}`}>• {t(`builder.order.${i.key}`)}</li>)}
        </ul>
      )}

      {/* Sections in order */}
      <ol className="space-y-2">
        {blocks.map((b, index) => {
          const stage = STAGE_OF[b.type];
          const mine = issues.filter((i) => i.blockId === b.id);
          const label = blockLabel(b, lang);
          const sel = b.id === selectedId;
          return (
            <li
              key={b.id}
              draggable
              onDragStart={(e) => { setDragFrom(index); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', `map:${index}`); }}
              onDragEnd={() => { setDragFrom(null); setDropAt(null); }}
              onDragOver={(e) => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setDropAt(e.clientY < r.top + r.height / 2 ? index : index + 1); }}
              onDrop={(e) => drop(e, index)}
              onClick={() => onSelect(b.id)}
              className={`relative flex gap-3 p-2 pl-3 rounded-xl border bg-white dark:bg-[#0A1610] cursor-pointer transition-colors ${sel ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-200 dark:border-emerald-900/50 hover:border-amber-300'} ${dragFrom === index ? 'opacity-40' : ''}`}
              data-map-item={b.id}
            >
              {dropAt === index && <span className="absolute -top-1.5 left-0 right-0 h-1 rounded-full bg-amber-400" />}
              {dropAt === index + 1 && index === blocks.length - 1 && <span className="absolute -bottom-1.5 left-0 right-0 h-1 rounded-full bg-amber-400" />}
              <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${STAGE_STYLE[stage].bar}`} aria-hidden="true" />
              <div className="flex flex-col items-center justify-between gap-1 pt-0.5 text-slate-400">
                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{index + 1}</span>
                <GripVertical className="w-4 h-4 cursor-grab" aria-hidden="true" />
              </div>
              <Thumb block={b} doc={doc} ctx={ctx} lang={lang} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">{name(b)}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${STAGE_STYLE[stage].chip}`}>{t(`builder.stage.${stage}`)}</span>
                </div>
                {label && <p className="text-[11px] text-slate-600 dark:text-gray-300 truncate">{label}</p>}
                {mine.map((i) => <p key={i.key} className={`text-[10px] font-semibold leading-snug ${SEVERITY_STYLE[i.severity]}`}>{i.severity === 'tip' ? '💡 ' : '⚠ '}{t(`builder.order.${i.key}`)}</p>)}
              </div>
              <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                <button type="button" disabled={index === 0} onClick={() => onMove(index, index - 1)} className="p-1 rounded-md border border-slate-200 dark:border-emerald-800 text-slate-600 dark:text-gray-300 hover:text-black dark:hover:text-white cursor-pointer disabled:opacity-30" aria-label={t('builder.moveUp')} title={t('builder.moveUp')}><ArrowUp className="w-3.5 h-3.5" /></button>
                <button type="button" disabled={index === blocks.length - 1} onClick={() => onMove(index, index + 1)} className="p-1 rounded-md border border-slate-200 dark:border-emerald-800 text-slate-600 dark:text-gray-300 hover:text-black dark:hover:text-white cursor-pointer disabled:opacity-30" aria-label={t('builder.moveDown')} title={t('builder.moveDown')}><ArrowDown className="w-3.5 h-3.5" /></button>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-[10px] text-slate-500 dark:text-gray-400 text-center">{t('builder.map.dragHint')}</p>
    </div>
  );
}
