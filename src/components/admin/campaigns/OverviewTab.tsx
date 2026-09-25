'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { Breakdown, CampaignReport, CampaignRow, Finding, PageInfo } from '@/lib/campaign-analytics';
import { NO_CAMPAIGN } from '@/lib/campaign-analytics';
import { Bars, Columns, fmt } from './charts';
import { CARD, H2, SEVERITY_ICON, SEVERITY_STYLE, SUB, Seg, Tile, money } from './ui';
import type { PageOption } from './CampaignsClient';

const RANGES = [7, 14, 30, 90] as const;
const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export default function OverviewTab({ pages }: { pages: PageOption[] }) {
  const { t, lang } = useLanguage();
  const [days, setDays] = useState<number>(30);
  const [page, setPage] = useState('');
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams({ days: String(days) });
      if (page) q.set('page', page);
      const res = await fetch(`/api/campaigns/report?${q}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t('cp.failed'));
      setReport(data.report);
      setPageInfos(data.pages || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('cp.failed'));
    } finally {
      setLoading(false);
    }
  }, [days, page, t]);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const keyLabel = useCallback((k: string) => {
    const known = t(`cp.k.${k}`);
    return known !== `cp.k.${k}` ? known : k;
  }, [t]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Seg label={t('cp.ai.days')} value={days} onChange={setDays} options={RANGES.map((n) => ({ value: n, label: t('cp.range', { n }) }))} />
        <select value={page} onChange={(e) => setPage(e.target.value)} aria-label={t('cp.ai.page')} className="px-3 py-2 rounded-lg bg-white dark:bg-[#06100B] border border-slate-300 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white max-w-[260px]">
          <option value="">{t('cp.allPages')}</option>
          {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
        </select>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-xs font-bold text-slate-800 dark:text-emerald-300 cursor-pointer disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('cp.refresh')}
        </button>
      </div>

      {error && <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">{error}</div>}
      {!report && loading && <p className={`${SUB} flex items-center gap-2`}><Loader2 className="w-4 h-4 animate-spin" /> {t('cp.loading')}</p>}

      {report && (
        <>
          {report.total.visits === 0 && report.total.leads === 0 && (
            <div className={`${CARD} p-4 text-xs text-slate-600 dark:text-gray-300`}>{t('cp.empty')}</div>
          )}
          <div className="grid [&>*]:min-w-0 grid-cols-2 lg:grid-cols-6 gap-3">
            <Tile label={t('cp.kpi.visits')} value={fmt(report.total.visits)} note={t('cp.kpi.visitsNote', { n: fmt(report.total.visitors) })} />
            <Tile label={t('cp.kpi.engaged')} value={`${report.total.engagedRate}%`} note={t('cp.kpi.engagedNote', { s: report.total.medianSeconds })} />
            <Tile label={t('cp.kpi.leads')} value={fmt(report.total.leads)} note={t('cp.kpi.leadRate', { p: report.total.leadRate })} />
            <Tile label={t('cp.kpi.won')} value={fmt(report.total.won)} note={t('cp.kpi.winNote', { p: report.total.winRate })} />
            <Tile label={t('cp.kpi.spend')} value={money(report.total.spend)} note={report.total.spend ? undefined : t('cp.kpi.noSpend')} />
            <Tile label={t('cp.kpi.cpl')} value={money(report.total.cpl)} note={report.total.cpw ? t('cp.kpi.cpw', { v: money(report.total.cpw) }) : undefined} />
          </div>

          <Findings findings={report.findings} lang={lang} t={t} />
          <CampaignTable rows={report.campaigns} t={t} />

          <div className="grid [&>*]:min-w-0 lg:grid-cols-2 gap-4">
            <div className={`${CARD} p-5`}>
              <h2 className={H2}>{t('cp.funnel')}</h2>
              <div className="mt-3"><Funnel report={report} t={t} /></div>
            </div>
            <SectionsCard report={report} pages={pageInfos} selected={page} t={t} />
          </div>

          <div className="grid [&>*]:min-w-0 lg:grid-cols-2 gap-4">
            <div className={`${CARD} p-5`}>
              <h2 className={H2}>{t('cp.daily')}</h2>
              <div className="mt-3">
                <Columns
                  series="views"
                  valueLabel={t('cp.tip.visits')}
                  ariaLabel={t('cp.dailyAria')}
                  points={report.days.map((d) => ({
                    key: d.day,
                    tick: shortDay(d.day),
                    value: d.visits,
                    title: shortDay(d.day),
                    lines: [
                      { label: t('cp.tip.engaged'), value: fmt(d.engaged) },
                      { label: t('cp.tip.leads'), value: fmt(d.leads) },
                      ...(d.spend ? [{ label: t('cp.tip.spend'), value: money(d.spend) }] : []),
                    ],
                  }))}
                />
              </div>
            </div>
            <div className={`${CARD} p-5`}>
              <h2 className={H2}>{t('cp.dailyLeads')}</h2>
              <div className="mt-3">
                <Columns
                  series="clicks"
                  valueLabel={t('cp.tip.leads')}
                  ariaLabel={t('cp.dailyLeadsAria')}
                  points={report.days.map((d) => ({
                    key: d.day,
                    tick: shortDay(d.day),
                    value: d.leads,
                    title: shortDay(d.day),
                    lines: [{ label: t('cp.tip.visits'), value: fmt(d.visits) }],
                  }))}
                />
              </div>
            </div>
          </div>

          <div className={`${CARD} p-5`}>
            <h2 className={H2}>{t('cp.hours')}</h2>
            <div className="mt-3">
              <Columns
                series="views"
                valueLabel={t('cp.tip.visits')}
                ariaLabel={t('cp.hoursAria')}
                tickEvery={3}
                points={report.hours.map((h) => ({
                  key: String(h.hour),
                  tick: String(h.hour).padStart(2, '0'),
                  value: h.visits,
                  title: `${String(h.hour).padStart(2, '0')}:00–${String((h.hour + 1) % 24).padStart(2, '0')}:00`,
                  lines: [{ label: t('cp.tip.leads'), value: fmt(h.leads) }],
                }))}
              />
            </div>
          </div>

          <div className="grid [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <BreakdownTable title={t('cp.b.channels')} rows={report.channels} label={keyLabel} t={t} />
            <BreakdownTable title={t('cp.b.apps')} rows={report.apps} label={keyLabel} t={t} />
            <BreakdownTable title={t('cp.b.devices')} rows={report.devices} label={keyLabel} t={t} />
            <BreakdownTable title={t('cp.b.languages')} rows={report.languages} label={keyLabel} t={t} />
            <BreakdownTable title={t('cp.b.visitorType')} rows={report.visitorType} label={keyLabel} t={t} />
            {!page && <BreakdownTable title={t('cp.b.pages')} rows={report.pages} t={t} />}
            {report.ads.length > 0 && <BreakdownTable title={t('cp.b.ads')} rows={report.ads} label={(k) => k.replace(NO_CAMPAIGN, t('cp.none'))} t={t} />}
          </div>
        </>
      )}
    </div>
  );
}

type T = (key: string, vars?: Record<string, string | number>) => string;

function Findings({ findings, lang, t }: { findings: Finding[]; lang: string; t: T }) {
  return (
    <div className={`${CARD} p-5`}>
      <h2 className={H2}>{t('cp.findings')}</h2>
      <p className={`${SUB} mt-0.5`}>{t('cp.findingsHint')}</p>
      {findings.length === 0 ? (
        <p className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t('cp.findingsNone')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {findings.map((f, i) => (
            <li key={i} className={`p-3 rounded-xl border text-xs leading-relaxed ${SEVERITY_STYLE[f.severity]}`}>
              <span className="inline-flex items-center gap-1 font-extrabold mr-2"><span aria-hidden="true">{SEVERITY_ICON[f.severity]}</span>{t(`cp.sev.${f.severity}`)} · {t(`cp.area.${f.area}`)}</span>
              {lang === 'kh' ? f.kh : f.en}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CampaignTable({ rows, t }: { rows: CampaignRow[]; t: T }) {
  const th = 'px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-gray-400 whitespace-nowrap';
  const td = 'px-3 py-2 text-xs text-slate-800 dark:text-gray-200 whitespace-nowrap pa-num';
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-black/20">
            <tr>
              <th className={th}>{t('cp.t.campaign')}</th>
              <th className={`${th} text-right`}>{t('cp.t.visits')}</th>
              <th className={`${th} text-right`}>{t('cp.t.engaged')}</th>
              <th className={`${th} text-right`}>{t('cp.t.time')}</th>
              <th className={`${th} text-right`}>{t('cp.t.leads')}</th>
              <th className={`${th} text-right`}>{t('cp.t.rate')}</th>
              <th className={`${th} text-right`}>{t('cp.t.won')}</th>
              <th className={`${th} text-right`}>{t('cp.t.spend')}</th>
              <th className={`${th} text-right`}>{t('cp.t.cpl')}</th>
              <th className={`${th} text-right`}>{t('cp.t.response')}</th>
              <th className={`${th} text-right`}>{t('cp.t.waiting')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/60">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className={`${td} max-w-[260px]`}>
                  <div className="font-bold truncate">{r.key === NO_CAMPAIGN ? t('cp.none') : r.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate">
                    {r.campaign ? `${r.key}${r.channel ? ` · ${r.channel}` : ''}${r.status ? ` · ${t(`cp.status.${r.status}`)}` : ''}` : r.key !== NO_CAMPAIGN ? t('cp.unregistered') : ''}
                  </div>
                </td>
                <td className={`${td} text-right`}>{fmt(r.visits)}</td>
                <td className={`${td} text-right`}>{r.visits ? `${r.engagedRate}%` : '–'}</td>
                <td className={`${td} text-right`}>{r.visits ? `${r.medianSeconds}s` : '–'}</td>
                <td className={`${td} text-right font-bold`}>{fmt(r.leads)}</td>
                <td className={`${td} text-right`}>{r.visits ? `${r.leadRate}%` : '–'}</td>
                <td className={`${td} text-right`}>{fmt(r.won)}</td>
                <td className={`${td} text-right`}>{r.spend ? money(r.spend) : '–'}</td>
                <td className={`${td} text-right`}>{money(r.cpl)}</td>
                <td className={`${td} text-right`}>{r.responseMinutes !== null ? t('cp.minutes', { n: r.responseMinutes }) : '–'}</td>
                <td className={`${td} text-right ${r.newLeadsWaiting ? 'text-rose-700 dark:text-rose-300 font-bold' : ''}`}>{r.newLeadsWaiting || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Funnel({ report, t }: { report: CampaignReport; t: T }) {
  const m = report.total;
  const base = Math.max(1, m.visits);
  const steps = [
    { key: 'visits', value: m.visits },
    { key: 'engaged', value: m.engaged },
    { key: 'read', value: m.readHalf },
    { key: 'clicked', value: m.interested },
    { key: 'formStarted', value: m.formStarts },
    { key: 'leads', value: m.leads },
    { key: 'won', value: m.won },
  ];
  return (
    <>
      <Bars rows={steps.map((s) => ({ key: s.key, label: t(`cp.f.${s.key}`), value: s.value, pct: Math.round((s.value / base) * 1000) / 10 }))} />
      {m.formStarts > m.formLeads && <p className="mt-3 text-[11px] font-semibold text-rose-700 dark:text-rose-300">{t('cp.formLost', { n: m.formStarts - m.formLeads })}</p>}
      {m.telegram > 0 && <p className={`${SUB} mt-1`}>{t('cp.telegramNote', { n: m.telegram })}</p>}
    </>
  );
}

function SectionsCard({ report, pages, selected, t }: { report: CampaignReport; pages: PageInfo[]; selected: string; t: T }) {
  const available = useMemo(() => pages.filter((p) => report.sections[p.slug]), [pages, report]);
  const [chosen, setChosen] = useState('');
  const slug = selected || (available.some((p) => p.slug === chosen) ? chosen : available[0]?.slug) || '';
  const reach = slug ? report.sections[slug] : undefined;
  let worst = -1;
  if (reach) {
    let drop = 0;
    for (let i = 1; i < reach.length; i++) {
      const d = reach[i - 1].pct - reach[i].pct;
      if (d > drop) { drop = d; worst = i; }
    }
    if (drop < 15) worst = -1;
  }
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={H2}>{t('cp.sections')}</h2>
        {!selected && available.length > 1 && (
          <select value={slug} onChange={(e) => setChosen(e.target.value)} aria-label={t('cp.ai.page')} className="px-2 py-1 rounded-lg bg-white dark:bg-[#06100B] border border-slate-300 dark:border-emerald-900/60 text-[11px] text-slate-900 dark:text-white max-w-[200px]">
            {available.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
          </select>
        )}
      </div>
      <p className={`${SUB} mt-0.5`}>{t('cp.sectionsHint')}</p>
      <div className="mt-3">
        {reach ? (
          <Bars rows={reach.map((s, i) => ({ key: s.id, label: `${i + 1}. ${s.title || s.type}`, value: s.reached, pct: s.pct, highlight: i === worst }))} />
        ) : (
          <p className={SUB}>{t('cp.sectionsEmpty')}</p>
        )}
      </div>
    </div>
  );
}

function BreakdownTable({ title, rows, label, t }: { title: string; rows: Breakdown[]; label?: (k: string) => string; t: T }) {
  const total = Math.max(1, rows.reduce((s, r) => s + r.visits, 0));
  return (
    <div className={`${CARD} p-5`}>
      <h2 className={H2}>{title}</h2>
      {rows.length === 0 ? <p className={`${SUB} mt-2`}>–</p> : (
        <div className="overflow-x-auto">
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-[10px] text-slate-500 dark:text-gray-400">
              <th className="text-left font-bold py-1">{t('cp.t.name')}</th>
              <th className="text-right font-bold py-1 pl-2 whitespace-nowrap">{t('cp.t.visits')}</th>
              <th className="text-right font-bold py-1 pl-2 whitespace-nowrap">{t('cp.t.engaged')}</th>
              <th className="text-right font-bold py-1 pl-2 whitespace-nowrap">{t('cp.t.leads')}</th>
              <th className="text-right font-bold py-1 pl-2 whitespace-nowrap">{t('cp.t.rate')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((r) => (
              <tr key={r.key} className="border-t border-slate-100 dark:border-emerald-950/60">
                <td className="py-1.5 pr-2 max-w-[140px]">
                  <div className="truncate font-semibold text-slate-800 dark:text-gray-200" title={label ? label(r.key) : r.label}>{label ? label(r.key) : r.label}</div>
                  <div className="h-1 mt-1 rounded-full bg-[var(--pa-track)] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.round((r.visits / total) * 100)}%`, background: 'var(--pa-views)' }} /></div>
                </td>
                <td className="py-1.5 pl-2 text-right pa-num text-slate-800 dark:text-gray-200">{fmt(r.visits)}</td>
                <td className="py-1.5 pl-2 text-right pa-num text-slate-600 dark:text-gray-400">{r.visits ? `${r.engagedRate}%` : '–'}</td>
                <td className="py-1.5 pl-2 text-right pa-num font-bold text-slate-900 dark:text-white">{fmt(r.leads)}</td>
                <td className="py-1.5 pl-2 text-right pa-num text-slate-600 dark:text-gray-400">{r.visits ? `${r.leadRate}%` : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
