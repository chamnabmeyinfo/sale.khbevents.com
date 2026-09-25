'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Lead, RoundRobinStaff, StaffClickStats } from '@/lib/types';
import { lastDays, phnomPenhDay } from '@/lib/popup-analytics';
import { teamPerformance, waitingLeads } from '@/lib/staff-performance';
import { formatWait } from '@/lib/lead-response';
import { useLanguage } from '@/context/LanguageContext';
import StaffAvatar from './StaffAvatar';

export type PerfLead = Pick<Lead, 'id' | 'createdAt' | 'status' | 'landingPageTitle' | 'fullName' | 'routing'>;

const CARD = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs';
const SUB = 'text-[11px] text-slate-500 dark:text-gray-400';
const RANGES = [1, 7, 30, 90] as const;
const nf = new Intl.NumberFormat('en-US');

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{value}</div>
      {note && <div className="mt-0.5 text-[11px] text-slate-500 dark:text-gray-400">{note}</div>}
    </div>
  );
}

/** One column per day: new contacts (form leads + clicks), split in the tooltip. */
function DaysChart({ days, t }: { days: Array<{ day: string; formLeads: number; clicks: number }>; t: (k: string, v?: Record<string, string | number>) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.formLeads + d.clicks));
  const W = 100 / Math.max(1, days.length);
  const hd = hover !== null ? days[hover] : null;
  return (
    <div className="pa-chart" onPointerLeave={() => setHover(null)}>
      <div className="flex items-end gap-[2px] h-32 border-b border-slate-200 dark:border-emerald-900/60" role="img" aria-label={t('rr.perf.daysAria')}>
        {days.map((d, i) => {
          const total = d.formLeads + d.clicks;
          return (
            <div key={d.day} className="h-full flex items-end" style={{ width: `${W}%` }} onPointerEnter={() => setHover(i)}>
              <div className={`w-full max-w-[24px] mx-auto rounded-t ${hover !== null && hover !== i ? 'opacity-50' : ''}`} style={{ height: `${(total / max) * 100}%`, minHeight: total ? 2 : 0, background: 'var(--pa-views)' }} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 dark:text-gray-400 mt-1 pa-num">
        <span>{days[0] ? new Date(`${days[0].day}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : ''}</span>
        <span>{t('pa.today')}</span>
      </div>
      {hd && (
        <div className="pa-tip" style={{ left: `min(calc(${((hover! + 1) / days.length) * 100}% + 6px), calc(100% - 150px))`, top: 0 }}>
          <div className="pa-tip__title">{new Date(`${hd.day}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}</div>
          <div className="pa-tip__row"><b>{hd.formLeads}</b> {t('rr.perf.formLeads')}</div>
          <div className="pa-tip__row"><b>{hd.clicks}</b> {t('rr.perf.clicks')}</div>
        </div>
      )}
    </div>
  );
}

export default function TeamPerformanceClient({ leads, clickStats, staffList, nowMs }: { leads: PerfLead[]; clickStats: StaffClickStats; staffList: RoundRobinStaff[]; nowMs: number }) {
  const { t } = useLanguage();
  const [days, setDays] = useState<(typeof RANGES)[number]>(7);
  const range = useMemo(() => lastDays(days, nowMs), [days, nowMs]);
  const perf = useMemo(() => teamPerformance(leads as Lead[], clickStats, staffList, range), [leads, clickStats, staffList, range]);
  const waiting = useMemo(() => {
    const out: PerfLead[] = [];
    for (let i = 0; i < Math.min(days, 7); i += 1) out.push(...waitingLeads(leads as Lead[], phnomPenhDay(nowMs - i * 86400000)));
    return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [leads, days, nowMs]);
  const avatarOf = (id: string) => staffList.find((s) => s.id === id)?.avatar;
  const maxContacts = Math.max(1, ...perf.rows.map((r) => r.formLeads + r.clicks));
  const tt = perf.totals;

  return (
    <div className="pa-root space-y-5 max-w-7xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/admin/round-robin" className="p-2.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-slate-700 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-emerald-950" title={t('rr.perf.back')} aria-label={t('rr.perf.back')}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{t('rr.perf.title')}</h1>
          <p className={SUB}>{t('rr.perf.subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-emerald-950/60 border border-slate-200 dark:border-emerald-900/60" role="group" aria-label={t('pa.range')}>
          {RANGES.map((n) => (
            <button key={n} type="button" aria-pressed={days === n} onClick={() => setDays(n)} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${days === n ? 'bg-amber-400 text-black shadow-xs' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}>
              {n === 1 ? t('pa.today') : t('pa.lastDays', { n })}
            </button>
          ))}
        </div>
        <span className={SUB}>{t('pa.tz')}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Tile label={t('rr.perf.kpi.leads')} value={nf.format(tt.formLeads)} note={t('rr.perf.kpi.clicks', { n: nf.format(tt.clicks) })} />
        <Tile label={t('rr.perf.kpi.replied')} value={tt.formLeads ? `${tt.responseRate}%` : '–'} note={t('rr.perf.kpi.repliedNote', { n: tt.tapped, total: tt.formLeads })} />
        <Tile label={t('rr.perf.kpi.time')} value={tt.avgResponseSeconds !== null ? formatWait(tt.avgResponseSeconds) : '–'} note={t('rr.perf.kpi.timeNote')} />
        <Tile label={t('rr.perf.kpi.won')} value={nf.format(tt.won)} note={t('rr.perf.kpi.lost', { n: tt.lost })} />
        <Tile label={t('rr.perf.kpi.waiting')} value={nf.format(tt.waiting)} note={t('rr.perf.kpi.passed', { n: tt.passedAway })} />
      </div>

      <div className={`${CARD} p-4 overflow-x-auto`}>
        <div className="text-sm font-extrabold text-slate-900 dark:text-white">{t('rr.perf.people')}</div>
        <p className={SUB}>{t('rr.perf.peopleHint')}</p>
        {perf.rows.length === 0 ? <p className={`${SUB} mt-3`}>{t('pa.noData')}</p> : (
          <table className="w-full mt-3 text-xs min-w-[760px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-gray-400 text-right">
                <th className="text-left pb-2">{t('rr.perf.col.person')}</th>
                <th className="text-left pb-2 pl-3 w-40">{t('rr.perf.col.contacts')}</th>
                <th className="pb-2">{t('rr.perf.col.leads')}</th>
                <th className="pb-2">{t('rr.perf.col.clicks')}</th>
                <th className="pb-2">{t('rr.perf.col.replied')}</th>
                <th className="pb-2">{t('rr.perf.col.time')}</th>
                <th className="pb-2">✅</th>
                <th className="pb-2">📞</th>
                <th className="pb-2">❌</th>
                <th className="pb-2">{t('rr.perf.col.won')}</th>
                <th className="pb-2">⏳</th>
                <th className="pb-2">{t('rr.perf.col.passed')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/60 text-right pa-num text-slate-700 dark:text-gray-300">
              {perf.rows.map((r) => (
                <tr key={r.staffId}>
                  <td className="py-2 text-left">
                    <div className="flex items-center gap-2">
                      <StaffAvatar name={r.name} src={avatarOf(r.staffId)} size={28} />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{r.name}</div>
                        {!r.active && <div className="text-[10px] text-slate-400">{t('rr.perf.inactive')}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pl-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="pa-bar flex-1" aria-hidden="true"><span style={{ width: `${((r.formLeads + r.clicks) / maxContacts) * 100}%` }} /></div>
                      <span className="w-10 text-right">{r.share}%</span>
                    </div>
                  </td>
                  <td className="py-2 font-bold text-slate-900 dark:text-white">{r.formLeads}</td>
                  <td className="py-2">{r.clicks}</td>
                  <td className="py-2">{r.formLeads ? `${r.responseRate}%` : '–'}</td>
                  <td className="py-2">{r.avgResponseSeconds !== null ? formatWait(r.avgResponseSeconds) : '–'}</td>
                  <td className="py-2">{r.contacted}</td>
                  <td className="py-2">{r.noAnswer}</td>
                  <td className="py-2">{r.notInterested}</td>
                  <td className="py-2">{r.won}</td>
                  <td className={`py-2 ${r.waiting ? 'font-bold text-amber-700 dark:text-amber-400' : ''}`}>{r.waiting}</td>
                  <td className="py-2">{r.passedAway ? `${r.passedAway} → / ${r.receivedFromHandover} ←` : r.receivedFromHandover ? `${r.receivedFromHandover} ←` : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className={`${SUB} mt-2`}>{t('rr.perf.legend')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={`${CARD} p-4`}>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">{t('rr.perf.days')}</div>
          <p className={`${SUB} mb-3`}>{t('rr.perf.daysHint')}</p>
          <DaysChart days={perf.days} t={t} />
        </div>
        <div className={`${CARD} p-4`}>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">{t('rr.perf.waiting', { n: waiting.length })}</div>
          <p className={`${SUB} mb-2`}>{t('rr.perf.waitingHint')}</p>
          {waiting.length === 0 ? <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{t('rr.perf.noneWaiting')}</p> : (
            <ul className="divide-y divide-slate-100 dark:divide-emerald-950/60 text-xs">
              {waiting.slice(0, 12).map((l) => (
                <li key={l.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/leads?id=${encodeURIComponent(l.id)}`} className="font-bold text-slate-900 dark:text-white hover:underline truncate block">{l.fullName || l.id}</Link>
                    <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate">{l.landingPageTitle}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-slate-700 dark:text-gray-300">{l.routing?.staffName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-gray-400 pa-num">{new Date(l.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className={SUB}>{t('rr.perf.footnote')}</p>
    </div>
  );
}
