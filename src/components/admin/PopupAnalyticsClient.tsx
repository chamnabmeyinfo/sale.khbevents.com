'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Lightbulb, Table2 } from 'lucide-react';
import type { PopupAd, PopupAdStatsMap } from '@/lib/types';
import {
  lastDays,
  popupDailyCsv,
  popupInsights,
  summarizePopups,
  type CountsRow,
  type DayPoint,
  type Insight,
  type PopupSummary,
} from '@/lib/popup-analytics';
import { useLanguage } from '@/context/LanguageContext';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

interface Props {
  ads: Pick<PopupAd, 'id' | 'name' | 'enabled'>[];
  stats: PopupAdStatsMap;
  pages: Array<{ slug: string; title: string }>;
  nowMs: number;
}

const RANGES = [7, 30, 90] as const;
const CARD = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs';
const H2 = 'text-sm font-extrabold text-slate-900 dark:text-white';
const SUB = 'text-[11px] text-slate-500 dark:text-gray-400';
const SEG = 'px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors';
const nf = new Intl.NumberFormat('en-US');
const fmt = (n: number) => nf.format(n);
const shortDay = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};
const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

/** Round an axis maximum up to a clean number (1, 2, 5 × 10ⁿ). */
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
    const ro = new ResizeObserver((entries) => setW(Math.max(260, Math.round(entries[0].contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

// ─── Stat tile ─────────────────────────────────────────────────────────────

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{value}</div>
      {note && <div className="mt-0.5 text-[11px] text-slate-500 dark:text-gray-400">{note}</div>}
    </div>
  );
}

// ─── Trend: views and clicks per day (one axis, two lines) ────────────────

function TrendChart({ days, t, today }: { days: DayPoint[]; t: Translate; today: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 220;
  const pad = { l: 40, r: 16, t: 12, b: 26 };
  const iw = width - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...days.map((d) => d.views)));
  const x = (i: number) => pad.l + (days.length <= 1 ? iw / 2 : (i / (days.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const path = (key: 'views' | 'clicks') => days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
  const area = `${path('views')} L${x(days.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const ticks = [0, max / 2, max];
  const every = Math.max(1, Math.ceil(days.length / Math.max(2, Math.floor(iw / 70))));
  const last = days.length - 1;

  const pick = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || !days.length) return;
    const rel = clientX - rect.left - pad.l;
    const i = Math.round((rel / Math.max(1, iw)) * (days.length - 1));
    setHover(Math.max(0, Math.min(last, i)));
  };
  const hd = hover !== null ? days[hover] : null;
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover) + 12, 0), width - 150) : 0;

  return (
    <div
      ref={ref}
      className="pa-chart"
      tabIndex={0}
      role="img"
      aria-label={t('pa.trendAria')}
      onPointerMove={(e) => pick(e.clientX)}
      onPointerLeave={() => setHover(null)}
      onFocus={() => setHover(last)}
      onBlur={() => setHover(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? last) - 1));
        if (e.key === 'ArrowRight') setHover((h) => Math.min(last, (h ?? 0) + 1));
      }}
    >
      <svg height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden="true">
        <g className="pa-grid">
          {ticks.map((v) => <line key={v} x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} />)}
        </g>
        {ticks.map((v) => <text key={v} className="pa-tick" x={pad.l - 8} y={y(v) + 4} textAnchor="end">{fmt(Math.round(v))}</text>)}
        <line className="pa-axis-line" x1={pad.l} x2={width - pad.r} y1={y(0)} y2={y(0)} />
        {days.map((d, i) => (i % every === 0 || i === last) && (i === last || x(last) - x(i) >= 64) ? (
          <text key={d.day} className="pa-tick" x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}>{i === last && d.day === today ? t('pa.today') : shortDay(d.day)}</text>
        ) : null)}
        <path className="pa-area" d={area} />
        <path className="pa-line pa-line--views" d={path('views')} />
        <path className="pa-line pa-line--clicks" d={path('clicks')} />
        {last >= 0 && <circle className="pa-dot pa-dot--views" cx={x(last)} cy={y(days[last].views)} r={4} />}
        {last >= 0 && <circle className="pa-dot pa-dot--clicks" cx={x(last)} cy={y(days[last].clicks)} r={4} />}
        {hover !== null && hd && (
          <g>
            <line className="pa-cross" x1={x(hover)} x2={x(hover)} y1={pad.t} y2={y(0)} />
            <circle className="pa-dot pa-dot--views" cx={x(hover)} cy={y(hd.views)} r={4} />
            <circle className="pa-dot pa-dot--clicks" cx={x(hover)} cy={y(hd.clicks)} r={4} />
          </g>
        )}
      </svg>
      {hd && (
        <div className="pa-tip" style={{ left: tipLeft, top: 8 }}>
          <div className="pa-tip__title">{shortDay(hd.day)}{hd.day === today ? ` · ${t('pa.soFar')}` : ''}</div>
          <div className="pa-tip__row"><i style={{ background: 'var(--pa-views)' }} /><b>{fmt(hd.views)}</b> {t('pa.views')}</div>
          <div className="pa-tip__row"><i style={{ background: 'var(--pa-clicks)' }} /><b>{fmt(hd.clicks)}</b> {t('pa.clicks')}</div>
          <div className="pa-tip__row"><i /><b>{hd.views ? `${Math.round((hd.clicks / hd.views) * 1000) / 10}%` : '–'}</b> {t('pa.clickRate')}</div>
          {hd.leads > 0 && <div className="pa-tip__row"><i /><b>{fmt(hd.leads)}</b> {t('pa.leads')}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Hour of day: one column per hour (views), clicks in the tooltip ──────

function HoursChart({ hours, t }: { hours: CountsRow[]; t: Translate }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 170;
  const pad = { l: 34, r: 8, t: 10, b: 24 };
  const iw = width - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const band = iw / 24;
  const bw = Math.min(24, Math.max(4, band - 2));
  const max = niceMax(Math.max(1, ...hours.map((h) => h.views)));
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const r = Math.min(4, bw / 2);
  const col = (h: CountsRow, i: number) => {
    const x0 = pad.l + i * band + (band - bw) / 2;
    const top = y(h.views);
    const bottom = y(0);
    if (h.views <= 0) return '';
    const hgt = Math.max(bottom - top, r);
    const ty = bottom - hgt;
    // Rounded data end (top), square at the baseline.
    return `M${x0},${bottom} L${x0},${ty + r} Q${x0},${ty} ${x0 + r},${ty} L${x0 + bw - r},${ty} Q${x0 + bw},${ty} ${x0 + bw},${ty + r} L${x0 + bw},${bottom} Z`;
  };
  const hd = hover !== null ? hours[hover] : null;
  const tipLeft = hover !== null ? Math.min(Math.max(pad.l + hover * band + band + 6, 0), width - 150) : 0;
  return (
    <div
      ref={ref}
      className="pa-chart"
      tabIndex={0}
      role="img"
      aria-label={t('pa.hoursAria')}
      onPointerLeave={() => setHover(null)}
      onBlur={() => setHover(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? 12) - 1));
        if (e.key === 'ArrowRight') setHover((h) => Math.min(23, (h ?? 11) + 1));
      }}
    >
      <svg height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden="true">
        <g className="pa-grid">{[max / 2, max].map((v) => <line key={v} x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} />)}</g>
        {[0, max / 2, max].map((v) => <text key={v} className="pa-tick" x={pad.l - 6} y={y(v) + 4} textAnchor="end">{fmt(Math.round(v))}</text>)}
        {hours.map((h, i) => (
          <path key={h.key} className={`pa-col${hover !== null && hover !== i ? ' pa-col--dim' : ''}`} d={col(h, i)} />
        ))}
        <line className="pa-axis-line" x1={pad.l} x2={width - pad.r} y1={y(0)} y2={y(0)} />
        {hours.map((h, i) => (i % 3 === 0 ? <text key={h.key} className="pa-tick" x={pad.l + i * band + band / 2} y={H - 6} textAnchor="middle">{String(i).padStart(2, '0')}</text> : null))}
        {hours.map((h, i) => (
          <rect key={h.key} className="pa-hit" x={pad.l + i * band} y={pad.t} width={band} height={ih} onPointerEnter={() => setHover(i)} />
        ))}
      </svg>
      {hd && (
        <div className="pa-tip" style={{ left: tipLeft, top: 6 }}>
          <div className="pa-tip__title">{hourLabel(Number(hd.key))}–{hourLabel((Number(hd.key) + 1) % 24)}</div>
          <div className="pa-tip__row"><i style={{ background: 'var(--pa-views)' }} /><b>{fmt(hd.views)}</b> {t('pa.views')}</div>
          <div className="pa-tip__row"><i /><b>{fmt(hd.clicks)}</b> {t('pa.clicks')}</div>
          <div className="pa-tip__row"><i /><b>{hd.views ? `${hd.ctr}%` : '–'}</b> {t('pa.clickRate')}</div>
        </div>
      )}
    </div>
  );
}

// ─── Breakdown list: label, views bar, numbers ────────────────────────────

function Breakdown({ title, rows, label, t, limit = 8 }: { title: string; rows: CountsRow[]; label: (key: string) => string; t: Translate; limit?: number }) {
  const shown = rows.slice(0, limit);
  const max = Math.max(1, ...shown.map((r) => r.views));
  return (
    <div className={`${CARD} p-4`}>
      <div className={H2}>{title}</div>
      {shown.length === 0 ? (
        <p className={`${SUB} mt-3`}>{t('pa.noData')}</p>
      ) : (
        <table className="w-full mt-3 text-xs table-fixed">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-gray-400">
              <th className="text-left font-bold pb-1.5">{t('pa.col.name')}</th>
              <th className="text-right font-bold pb-1.5 w-14">{t('pa.views')}</th>
              <th className="text-right font-bold pb-1.5 w-12">{t('pa.clicks')}</th>
              <th className="text-right font-bold pb-1.5 w-14">{t('pa.rate')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.key} className="align-top">
                <td className="py-1.5 pr-3">
                  <div className="font-semibold text-slate-800 dark:text-gray-200 truncate" title={label(r.key)}>{label(r.key)}</div>
                  <div className="pa-bar mt-1" aria-hidden="true"><span style={{ width: `${(r.views / max) * 100}%` }} /></div>
                </td>
                <td className="py-1.5 text-right pa-num text-slate-900 dark:text-white font-bold">{fmt(r.views)}</td>
                <td className="py-1.5 text-right pa-num text-slate-700 dark:text-gray-300">{fmt(r.clicks)}</td>
                <td className="py-1.5 text-right pa-num text-slate-700 dark:text-gray-300">{r.views ? `${r.ctr}%` : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {rows.length > limit && <p className={`${SUB} mt-2`}>{t('pa.more', { n: rows.length - limit })}</p>}
    </div>
  );
}

// ─── Findings in plain words ──────────────────────────────────────────────

function insightText(i: Insight, t: Translate, label: (dim: 'page' | 'device' | 'source' | 'app', key: string) => string): string {
  switch (i.kind) {
    case 'notEnough': return t('pa.ins.notEnough', { n: i.views });
    case 'bestPopup': return t('pa.ins.bestPopup', { name: i.name, rate: i.ctr, n: i.views });
    case 'best': return t(`pa.ins.best.${i.dimension}`, { name: label(i.dimension, i.key), rate: i.ctr, overall: i.overall, n: i.views });
    case 'bestHours': return t('pa.ins.bestHours', { from: hourLabel(i.from), to: hourLabel(i.to), share: i.share });
    case 'quickClose': return t('pa.ins.quickClose', { s: i.seconds, rate: i.closeRate });
    case 'leads': return t('pa.ins.leads', { n: i.leads, clicked: i.afterClick });
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function PopupAnalyticsClient({ ads, stats, pages, nowMs }: Props) {
  const { t } = useLanguage();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [adId, setAdId] = useState('');
  const [showTable, setShowTable] = useState(false);

  const range = useMemo(() => lastDays(days, nowMs), [days, nowMs]);
  const s: PopupSummary = useMemo(() => summarizePopups(stats, ads, { ...range, adId }), [stats, ads, range, adId]);
  const insights = useMemo(() => popupInsights(s), [s]);

  const pageTitle = (slug: string) => pages.find((p) => p.slug === slug)?.title || `/${slug}`;
  const known = (prefix: string, key: string) => {
    const text = t(`${prefix}.${key}`);
    return text === `${prefix}.${key}` ? key : text;
  };
  const sourceLabel = (k: string) => known('pa.src', k);
  const deviceLabel = (k: string) => known('pa.device', k);
  const appLabel = (k: string) => (k === 'Browser' ? t('pa.app.browser') : k === 'other' ? t('pa.other') : k);
  const langLabel = (k: string) => known('pa.lang', k);
  const dimLabel = (dim: 'page' | 'device' | 'source' | 'app', key: string) =>
    dim === 'page' ? pageTitle(key) : dim === 'device' ? deviceLabel(key) : dim === 'source' ? sourceLabel(key) : appLabel(key);

  const downloadCsv = () => {
    const chosen = ads.filter((a) => !adId || a.id === adId);
    const blob = new Blob([popupDailyCsv(stats, chosen, range.from, range.to)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `popup-analytics-${range.from}-to-${range.to}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const smart = useMemo(() => {
    const acc = new Map<string, { views: number; clicks: number }>();
    for (const ad of ads) {
      if (adId && ad.id !== adId) continue;
      for (const [r, c] of Object.entries(stats[ad.id]?.smart || {})) {
        if (!c) continue;
        const row = acc.get(r) || { views: 0, clicks: 0 };
        row.views += c.views;
        row.clicks += c.clicks;
        acc.set(r, row);
      }
    }
    return Array.from(acc.entries()).map(([key, c]) => ({ key, views: c.views, clicks: c.clicks, closes: 0, leads: 0, ctr: c.views ? Math.round((c.clicks / c.views) * 1000) / 10 : 0 })).sort((a, b) => b.views - a.views);
  }, [ads, stats, adId]);

  const startedLate = s.detailSince && s.detailSince > range.from;

  return (
    <div className="pa-root space-y-5 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/ads" className="p-2.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-slate-700 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-emerald-950" title={t('pa.back')} aria-label={t('pa.back')}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{t('pa.title')}</h1>
            <p className={SUB}>{t('pa.subtitle')}</p>
          </div>
        </div>
        <button type="button" onClick={downloadCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-emerald-800 bg-white dark:bg-emerald-950/60 text-slate-800 dark:text-emerald-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-emerald-900 cursor-pointer self-start">
          <Download className="w-4 h-4" /> {t('pa.csv')}
        </button>
      </div>

      {/* Filters: one row, scopes everything below */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-emerald-950/60 border border-slate-200 dark:border-emerald-900/60" role="group" aria-label={t('pa.range')}>
          {RANGES.map((n) => (
            <button key={n} type="button" aria-pressed={days === n} onClick={() => setDays(n)} className={`${SEG} ${days === n ? 'bg-amber-400 text-black shadow-xs' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}>
              {t('pa.lastDays', { n })}
            </button>
          ))}
        </div>
        <select aria-label={t('pa.popup')} value={adId} onChange={(e) => setAdId(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-semibold">
          <option value="">{t('pa.allPopups')}</option>
          {ads.map((a) => <option key={a.id} value={a.id}>{a.name}{a.enabled ? '' : ` (${t('pa.paused')})`}</option>)}
        </select>
        <span className={SUB}>{shortDay(range.from)} – {shortDay(range.to)} · {t('pa.tz')}</span>
      </div>

      {(startedLate || !s.detailSince) && (
        <p className="text-[11px] text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-900/50 rounded-xl px-3 py-2">
          {s.detailSince ? t('pa.since', { date: shortDay(s.detailSince) }) : t('pa.noneYet')}
        </p>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Tile label={t('pa.kpi.views')} value={fmt(s.views)} note={t('pa.kpi.viewsNote')} />
        <Tile label={t('pa.kpi.clicks')} value={fmt(s.clicks)} note={t('pa.kpi.rateNote', { rate: s.ctr })} />
        <Tile label={t('pa.kpi.closes')} value={fmt(s.closes)} note={t('pa.kpi.closeNote', { rate: s.closeRate })} />
        <Tile label={t('pa.kpi.leads')} value={fmt(s.leads)} note={t('pa.kpi.leadsNote', { n: s.leadsAfterClick })} />
        <Tile label={t('pa.kpi.time')} value={s.avgSecondsToClick !== null ? `${s.avgSecondsToClick} s` : '–'} note={s.avgSecondsToClose !== null ? t('pa.kpi.timeNote', { s: s.avgSecondsToClose }) : t('pa.kpi.timeNone')} />
      </div>

      {/* Findings */}
      <div className={`${CARD} p-4`}>
        <div className={`${H2} flex items-center gap-2`}><Lightbulb className="w-4 h-4 text-amber-500" /> {t('pa.findings')}</div>
        <ul className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-gray-300 list-disc pl-5">
          {insights.map((i, n) => <li key={n}>{insightText(i, t, dimLabel)}</li>)}
        </ul>
      </div>

      {/* Trend */}
      <div className={`${CARD} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <div className={H2}>{t('pa.trend')}</div>
            <div className="pa-legend mt-1">
              <span className="pa-key"><i className="pa-key--views" /> {t('pa.views')}</span>
              <span className="pa-key"><i className="pa-key--clicks" /> {t('pa.clicks')}</span>
            </div>
          </div>
          <button type="button" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-[11px] font-bold text-slate-800 dark:text-emerald-300 cursor-pointer">
            <Table2 className="w-3.5 h-3.5" /> {showTable ? t('pa.showChart') : t('pa.showTable')}
          </button>
        </div>
        {showTable ? (
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white dark:bg-[#0A1610]">
                <tr className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-gray-400">
                  <th className="text-left py-1.5">{t('pa.col.day')}</th><th className="text-right">{t('pa.views')}</th><th className="text-right">{t('pa.clicks')}</th><th className="text-right">{t('pa.rate')}</th><th className="text-right">{t('pa.closes')}</th><th className="text-right">{t('pa.leads')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/60">
                {s.days.slice().reverse().map((d) => (
                  <tr key={d.day} className="pa-num text-slate-700 dark:text-gray-300">
                    <td className="py-1.5">{shortDay(d.day)}</td><td className="text-right font-bold text-slate-900 dark:text-white">{fmt(d.views)}</td><td className="text-right">{fmt(d.clicks)}</td><td className="text-right">{d.views ? `${Math.round((d.clicks / d.views) * 1000) / 10}%` : '–'}</td><td className="text-right">{fmt(d.closes)}</td><td className="text-right">{fmt(d.leads)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <TrendChart days={s.days} t={t} today={range.to} />
        )}
      </div>

      {/* Popup comparison */}
      <div className={`${CARD} p-4`}>
        <div className={H2}>{t('pa.compare')}</div>
        <p className={SUB}>{t('pa.compareHint')}</p>
        {s.popups.length === 0 ? <p className={`${SUB} mt-3`}>{t('pa.noPopups')}</p> : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-gray-400">
                  <th className="text-left pb-2">{t('pa.popup')}</th>
                  <th className="text-right pb-2">{t('pa.views')}</th>
                  <th className="text-right pb-2">{t('pa.clicks')}</th>
                  <th className="text-left pb-2 pl-4 w-40">{t('pa.clickRate')}</th>
                  <th className="text-right pb-2">{t('pa.closedPct')}</th>
                  <th className="text-right pb-2">{t('pa.leads')}</th>
                  <th className="text-right pb-2">{t('pa.timeToClick')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/60">
                {(() => {
                  const maxCtr = Math.max(1, ...s.popups.map((p) => p.ctr));
                  return s.popups.map((p) => (
                    <tr key={p.key} className={`text-slate-700 dark:text-gray-300 ${adId === p.key ? 'bg-amber-50/60 dark:bg-emerald-950/40' : ''}`}>
                      <td className="py-2 pr-3">
                        <button type="button" onClick={() => setAdId(adId === p.key ? '' : p.key)} className="font-bold text-slate-900 dark:text-white hover:underline cursor-pointer text-left" title={t('pa.filterTo')}>{p.name}</button>
                        {!p.enabled && <span className="ml-2 text-[10px] font-bold text-slate-400">{t('pa.paused')}</span>}
                      </td>
                      <td className="py-2 text-right pa-num font-bold text-slate-900 dark:text-white">{fmt(p.views)}</td>
                      <td className="py-2 text-right pa-num">{fmt(p.clicks)}</td>
                      <td className="py-2 pl-4">
                        <div className="flex items-center gap-2">
                          <div className="pa-bar pa-bar--clicks flex-1" aria-hidden="true"><span style={{ width: `${(p.ctr / maxCtr) * 100}%` }} /></div>
                          <span className="pa-num w-11 text-right">{p.views ? `${p.ctr}%` : '–'}</span>
                        </div>
                      </td>
                      <td className="py-2 text-right pa-num">{p.views ? `${p.closeRate}%` : '–'}</td>
                      <td className="py-2 text-right pa-num">{fmt(p.leads)}</td>
                      <td className="py-2 text-right pa-num">{p.avgSecondsToClick !== null ? `${p.avgSecondsToClick} s` : '–'}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Breakdown title={t('pa.byPage')} rows={s.pages} label={pageTitle} t={t} />
        <Breakdown title={t('pa.bySource')} rows={s.sources} label={sourceLabel} t={t} />
        <Breakdown title={t('pa.byDevice')} rows={s.devices} label={deviceLabel} t={t} />
        <Breakdown title={t('pa.byApp')} rows={s.apps} label={appLabel} t={t} />
        <Breakdown title={t('pa.byLang')} rows={s.langs} label={langLabel} t={t} />
        <div className={`${CARD} p-4`}>
          <div className={H2}>{t('pa.byHour')}</div>
          <p className={`${SUB} mb-2`}>{t('pa.byHourHint')}</p>
          <HoursChart hours={s.hours} t={t} />
        </div>
      </div>

      {smart.length > 0 && (
        <Breakdown title={t('pa.smart')} rows={smart} label={(k) => t(`ads.reason.${k}`)} t={t} />
      )}

      <p className={SUB}>{t('pa.footnote')}</p>
    </div>
  );
}
