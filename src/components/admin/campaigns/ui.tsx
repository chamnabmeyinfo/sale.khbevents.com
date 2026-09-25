'use client';

import React from 'react';

export const CARD = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs';
export const SUB = 'text-[11px] text-slate-500 dark:text-gray-400';
export const H2 = 'text-sm font-bold text-slate-900 dark:text-white';
export const INPUT = 'w-full px-3 py-2 rounded-lg bg-white dark:bg-[#06100B] border border-slate-300 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400';
export const LABEL = 'block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1';
export const BTN = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
export const BTN_PRIMARY = `${BTN} bg-amber-400 hover:bg-amber-300 text-black`;
export const BTN_SOFT = `${BTN} bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-300`;

export function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 dark:bg-emerald-950/60">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${o.value === value ? 'bg-amber-400 shadow text-black' : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tile({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: 'good' | 'bad' }) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-black pa-num ${tone === 'bad' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-white'}`}>{value}</div>
      {note && <div className="mt-0.5 text-[11px] text-slate-500 dark:text-gray-400">{note}</div>}
    </div>
  );
}

export const SEVERITY_STYLE: Record<string, string> = {
  high: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200',
  medium: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200',
  low: 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-emerald-900/60 text-slate-700 dark:text-gray-300',
  good: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
};

export const SEVERITY_ICON: Record<string, string> = { high: '●', medium: '▲', low: '◆', good: '✓' };

export const money = (v: number | null | undefined) => (v === null || v === undefined ? '–' : `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
