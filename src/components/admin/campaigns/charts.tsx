'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Small charts for the campaign report. Colours come from the popup analytics palette
 * (src/styles/popup-analytics.css, validated on the light and dark cards): slot 1 blue
 * for visits, slot 2 orange for leads. One measure per chart (never two axes); every
 * mark has a hover and keyboard tooltip; the numbers are also in the tables below.
 */

export const fmt = (n: number) => n.toLocaleString('en-US');

function niceMax(v: number): number {
  if (v <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => setW(Math.max(240, Math.round(entries[0].contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export interface ColumnPoint {
  key: string;
  /** Axis label (shown for some columns only). */
  tick: string;
  value: number;
  /** Tooltip title and extra lines. */
  title: string;
  lines: Array<{ label: string; value: string }>;
}

/** Columns over time or hours: one measure, rounded data ends, tooltip on hover or arrow keys. */
export function Columns({ points, series, valueLabel, ariaLabel, height = 170, tickEvery }: {
  points: ColumnPoint[];
  series: 'views' | 'clicks';
  valueLabel: string;
  ariaLabel: string;
  height?: number;
  tickEvery?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = height;
  const pad = { l: 34, r: 8, t: 10, b: 24 };
  const n = Math.max(1, points.length);
  const iw = width - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const band = iw / n;
  const bw = Math.min(28, Math.max(3, band - 2));
  const max = niceMax(Math.max(1, ...points.map((p) => p.value)));
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const r = Math.min(4, bw / 2);
  const every = tickEvery || Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 56))));
  const col = (v: number, i: number) => {
    if (v <= 0) return '';
    const x0 = pad.l + i * band + (band - bw) / 2;
    const bottom = y(0);
    const ty = bottom - Math.max(bottom - y(v), r);
    return `M${x0},${bottom} L${x0},${ty + r} Q${x0},${ty} ${x0 + r},${ty} L${x0 + bw - r},${ty} Q${x0 + bw},${ty} ${x0 + bw},${ty + r} L${x0 + bw},${bottom} Z`;
  };
  const hp = hover !== null ? points[hover] : null;
  const tipLeft = hover !== null ? Math.min(Math.max(pad.l + hover * band + band + 6, 0), width - 170) : 0;
  const color = series === 'views' ? 'var(--pa-views)' : 'var(--pa-clicks)';
  return (
    <div
      ref={ref}
      className="pa-chart"
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerLeave={() => setHover(null)}
      onFocus={() => setHover(points.length - 1)}
      onBlur={() => setHover(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? points.length) - 1));
        if (e.key === 'ArrowRight') setHover((h) => Math.min(points.length - 1, (h ?? -1) + 1));
      }}
    >
      <svg height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden="true">
        <g className="pa-grid">{[max / 2, max].map((v) => <line key={v} x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} />)}</g>
        {[0, max / 2, max].map((v) => <text key={v} className="pa-tick" x={pad.l - 6} y={y(v) + 4} textAnchor="end">{fmt(Math.round(v))}</text>)}
        {points.map((p, i) => (
          <path key={p.key} d={col(p.value, i)} style={{ fill: color }} className={hover !== null && hover !== i ? 'pa-col--dim' : undefined} />
        ))}
        <line className="pa-axis-line" x1={pad.l} x2={width - pad.r} y1={y(0)} y2={y(0)} />
        {points.map((p, i) => (i % every === 0 || i === points.length - 1) && (i === points.length - 1 || (points.length - 1 - i) * band >= 40)
          ? <text key={p.key} className="pa-tick" x={pad.l + i * band + band / 2} y={H - 6} textAnchor="middle">{p.tick}</text>
          : null)}
        {points.map((p, i) => <rect key={p.key} className="pa-hit" x={pad.l + i * band} y={pad.t} width={band} height={ih} onPointerEnter={() => setHover(i)} />)}
      </svg>
      {hp && (
        <div className="pa-tip" style={{ left: tipLeft, top: 6 }}>
          <div className="pa-tip__title">{hp.title}</div>
          <div className="pa-tip__row"><i style={{ background: color }} /><b>{fmt(hp.value)}</b> {valueLabel}</div>
          {hp.lines.map((l) => <div key={l.label} className="pa-tip__row"><i /><b>{l.value}</b> {l.label}</div>)}
        </div>
      )}
    </div>
  );
}

/** Horizontal bars with the value and a share: funnel steps, how far readers get. */
export function Bars({ rows, series = 'views' }: {
  rows: Array<{ key: string; label: string; value: number; pct: number; note?: string; highlight?: boolean }>;
  series?: 'views' | 'clicks';
}) {
  const color = series === 'views' ? 'var(--pa-views)' : 'var(--pa-clicks)';
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.key} title={`${r.label}: ${fmt(r.value)} (${r.pct}%)`}>
          <div className="flex items-baseline justify-between gap-3 text-[12px]">
            <span className={`truncate ${r.highlight ? 'font-bold text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-gray-300'}`}>{r.label}</span>
            <span className="shrink-0 font-bold text-slate-900 dark:text-white pa-num">{fmt(r.value)} <span className="font-semibold text-slate-500 dark:text-gray-400">· {r.pct}%</span></span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[var(--pa-track)] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.max(r.value > 0 ? 2 : 0, Math.min(100, r.pct))}%`, background: color }} />
          </div>
          {r.note && <div className="mt-0.5 text-[11px] text-slate-500 dark:text-gray-400">{r.note}</div>}
        </li>
      ))}
    </ul>
  );
}
