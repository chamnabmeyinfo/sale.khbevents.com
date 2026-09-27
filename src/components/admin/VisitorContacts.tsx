'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Bot, ChevronDown, ChevronUp, ExternalLink, Monitor, Search, ShieldAlert, ShieldCheck, ShieldX, Smartphone, Tablet, HelpCircle } from 'lucide-react';
import type { RoundRobinLog, RoundRobinStaff } from '@/lib/types';
import type { VisitRecord } from '@/lib/visits';
import { phnomPenhDay } from '@/lib/popup-analytics';
import { clickCheck, countryFlag, countryName, parseUserAgent, secondsOnPageBeforeClick, sourceLabel, type ClickVerdict, type DeviceKind } from '@/lib/visitor-detail';
import { useLanguage } from '@/context/LanguageContext';
import StaffAvatar from './StaffAvatar';

/** One contact (Telegram click or form lead) with what we know about the visitor. */
export type ContactEntry = Pick<RoundRobinLog, 'id' | 'timestamp' | 'routeType' | 'pageSlug' | 'pageTitle' | 'staffId' | 'staffName' | 'status' | 'assignmentReason' | 'demo' | 'visitorIp' | 'userAgent' | 'visitor' | 'leadId' | 'clientName' | 'targetTelegramUrl' | 'deliveryError'> & {
  /** The landing-page visit with the same session id, when tracked. */
  visit?: Pick<VisitRecord, 'sec' | 'sc' | 'ret' | 'cta' | 'tg' | 'src' | 'cmp' | 'ref' | 'dev' | 'app' | 'lang' | 't0' | 'fs' | 'lead'> | null;
};

const CARD = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs';
const SUB = 'text-[11px] text-slate-500 dark:text-gray-400';
const SELECT = 'px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-medium focus:outline-none';
const PAGE_SIZE = 40;

const ppTime = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const ppFull = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

function DeviceIcon({ kind }: { kind: DeviceKind }) {
  const cls = 'w-4 h-4 shrink-0';
  if (kind === 'mobile') return <Smartphone className={cls} />;
  if (kind === 'tablet') return <Tablet className={cls} />;
  if (kind === 'desktop') return <Monitor className={cls} />;
  if (kind === 'bot') return <Bot className={cls} />;
  return <HelpCircle className={cls} />;
}

function VerdictBadge({ verdict, label }: { verdict: ClickVerdict; label: string }) {
  const style = verdict === 'real'
    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
    : verdict === 'check'
      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
      : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30';
  const Icon = verdict === 'real' ? ShieldCheck : verdict === 'check' ? ShieldAlert : ShieldX;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function Detail({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-gray-400">{label}</div>
      <div className={`text-xs text-slate-900 dark:text-white break-words ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

/**
 * Every visitor who reached the sales team through Round Robin in the chosen period:
 * device, browser, location, IP address, where they came from, and whether the
 * contact looks like a real person.
 */
export default function VisitorContacts({ entries, staffList, range }: { entries: ContactEntry[]; staffList: RoundRobinStaff[]; range: { from: string; to: string } }) {
  const { t } = useLanguage();
  const [type, setType] = useState<'ALL' | 'DIRECT_CONTACT_CLICK' | 'FORM_SUBMISSION'>('ALL');
  const [staff, setStaff] = useState('ALL');
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | ClickVerdict>('ALL');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);

  const inRange = useMemo(() => entries.filter((e) => {
    const d = phnomPenhDay(Date.parse(e.timestamp));
    return d >= range.from && d <= range.to;
  }), [entries, range]);

  const rows = useMemo(() => {
    const ipCount = new Map<string, number>();
    for (const e of inRange) if (e.visitorIp && e.visitorIp !== 'unknown') ipCount.set(e.visitorIp, (ipCount.get(e.visitorIp) || 0) + 1);
    return inRange.map((e) => {
      const agent = parseUserAgent(e.userAgent);
      const check = clickCheck(e, { sameIpCount: e.visitorIp ? ipCount.get(e.visitorIp) : 0, visit: e.visit, clickMs: Date.parse(e.timestamp) });
      return { e, agent, check, source: sourceLabel(e, e.visit), sameIp: e.visitorIp ? ipCount.get(e.visitorIp) || 0 : 0 };
    });
  }, [inRange]);

  const summary = useMemo(() => {
    const s = { total: rows.length, real: 0, check: 0, bot: 0, clicks: 0, forms: 0, returning: 0, devices: new Map<string, number>(), countries: new Map<string, number>(), sources: new Map<string, number>() };
    for (const r of rows) {
      s[r.check.verdict] += 1;
      if (r.e.routeType === 'DIRECT_CONTACT_CLICK') s.clicks += 1; else s.forms += 1;
      if (r.check.reasons.includes('returning')) s.returning += 1;
      s.devices.set(r.agent.device, (s.devices.get(r.agent.device) || 0) + 1);
      const c = r.e.visitor?.country || '?';
      s.countries.set(c, (s.countries.get(c) || 0) + 1);
      s.sources.set(r.source, (s.sources.get(r.source) || 0) + 1);
    }
    const top = (m: Map<string, number>, n: number) => Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
    return { ...s, topDevices: top(s.devices, 4), topCountries: top(s.countries, 4), topSources: top(s.sources, 4) };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (type !== 'ALL' && r.e.routeType !== type) return false;
      if (staff !== 'ALL' && r.e.staffId !== staff) return false;
      if (verdictFilter !== 'ALL' && r.check.verdict !== verdictFilter) return false;
      if (!q) return true;
      const hay = [r.e.visitorIp, r.e.pageTitle, r.e.pageSlug, r.e.staffName, r.e.clientName, r.e.visitor?.city, r.e.visitor?.country, countryName(r.e.visitor?.country), r.agent.os, r.agent.browser, r.agent.app, r.source, r.e.visitor?.utmCampaign]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [rows, type, staff, verdictFilter, search]);

  const avatarOf = (id: string) => staffList.find((s) => s.id === id)?.avatar;
  const deviceLabel = (k: string) => t(`rr.vis.device.${k}`);
  const verdictLabel = (v: ClickVerdict) => t(`rr.vis.verdict.${v}`);
  const visible = filtered.slice(0, shown);

  return (
    <div className={`${CARD} p-4 relative overflow-hidden min-w-0`} data-visitor-contacts="">
      <div className="text-sm font-extrabold text-slate-900 dark:text-white">{t('rr.vis.title', { n: summary.total })}</div>
      <p className={SUB}>{t('rr.vis.hint')}</p>

      {summary.total > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-xs">
          <div className="rounded-xl border border-slate-200 dark:border-emerald-900/50 p-3">
            <div className={SUB}>{t('rr.vis.sum.real')}</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <VerdictBadge verdict="real" label={`${summary.real} ${verdictLabel('real')}`} />
              <VerdictBadge verdict="check" label={`${summary.check} ${verdictLabel('check')}`} />
              <VerdictBadge verdict="bot" label={`${summary.bot} ${verdictLabel('bot')}`} />
            </div>
            <div className={`${SUB} mt-1`}>{t('rr.vis.sum.split', { clicks: summary.clicks, forms: summary.forms, ret: summary.returning })}</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-emerald-900/50 p-3">
            <div className={SUB}>{t('rr.vis.sum.devices')}</div>
            <ul className="mt-1 space-y-0.5 text-slate-800 dark:text-gray-200">
              {summary.topDevices.map(([k, n]) => <li key={k} className="flex items-center gap-1.5"><DeviceIcon kind={k as DeviceKind} /><span className="flex-1">{deviceLabel(k)}</span><b className="pa-num">{n}</b></li>)}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-emerald-900/50 p-3">
            <div className={SUB}>{t('rr.vis.sum.countries')}</div>
            <ul className="mt-1 space-y-0.5 text-slate-800 dark:text-gray-200">
              {summary.topCountries.map(([k, n]) => <li key={k} className="flex items-center gap-1.5"><span className="flex-1 truncate">{k === '?' ? t('rr.vis.unknownPlace') : `${countryFlag(k)} ${countryName(k)}`}</span><b className="pa-num">{n}</b></li>)}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-emerald-900/50 p-3">
            <div className={SUB}>{t('rr.vis.sum.sources')}</div>
            <ul className="mt-1 space-y-0.5 text-slate-800 dark:text-gray-200">
              {summary.topSources.map(([k, n]) => <li key={k} className="flex items-center gap-1.5"><span className="flex-1 truncate">{k}</span><b className="pa-num">{n}</b></li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setShown(PAGE_SIZE); }} placeholder={t('rr.vis.searchPh')} aria-label={t('rr.vis.searchPh')} className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:border-amber-400 focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={SELECT} aria-label={t('rr.log.allTouchpoints')}>
            <option value="ALL">{t('rr.log.allTouchpoints')}</option>
            <option value="DIRECT_CONTACT_CLICK">{t('rr.log.telegramClicks')}</option>
            <option value="FORM_SUBMISSION">{t('rr.log.formSubmissions')}</option>
          </select>
          <select value={staff} onChange={(e) => setStaff(e.target.value)} className={SELECT} aria-label={t('rr.log.allStaff')}>
            <option value="ALL">{t('rr.log.allStaff')}</option>
            {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={verdictFilter} onChange={(e) => setVerdictFilter(e.target.value as typeof verdictFilter)} className={SELECT} aria-label={t('rr.vis.col.check')}>
            <option value="ALL">{t('rr.vis.allVerdicts')}</option>
            <option value="real">{verdictLabel('real')}</option>
            <option value="check">{verdictLabel('check')}</option>
            <option value="bot">{verdictLabel('bot')}</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? <p className={`${SUB} mt-3`}>{summary.total === 0 ? t('rr.vis.empty') : t('rr.log.empty')}</p> : (
        <div className="overflow-x-auto mt-3 max-w-full">
          <table className="w-full text-xs min-w-[860px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-gray-400 text-left">
                <th className="pb-2 pr-3">{t('rr.vis.col.time')}</th>
                <th className="pb-2 pr-3">{t('rr.vis.col.visitor')}</th>
                <th className="pb-2 pr-3">{t('rr.vis.col.where')}</th>
                <th className="pb-2 pr-3">{t('rr.vis.col.from')}</th>
                <th className="pb-2 pr-3">{t('rr.vis.col.page')}</th>
                <th className="pb-2 pr-3">{t('rr.vis.col.staff')}</th>
                <th className="pb-2 pr-3">{t('rr.vis.col.check')}</th>
                <th className="pb-2 w-8" aria-label={t('rr.log.th.details')} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/60 text-slate-700 dark:text-gray-300">
              {visible.map(({ e, agent, check, source, sameIp }) => {
                const isOpen = open === e.id;
                const v = e.visitor;
                const place = v?.country ? `${countryFlag(v.country)} ${[v.city, v.region && v.region !== v.city ? v.region : '', countryName(v.country)].filter(Boolean).join(', ')}` : t('rr.vis.unknownPlace');
                return (
                  <React.Fragment key={e.id}>
                    <tr className={`align-top ${isOpen ? 'bg-slate-50 dark:bg-emerald-950/30' : ''}`} data-contact-row="">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white pa-num">{ppTime(e.timestamp)}</div>
                        <div className="text-[10px] mt-0.5 flex flex-wrap gap-1">
                          <span className="font-bold text-amber-600 dark:text-amber-400">{e.routeType === 'FORM_SUBMISSION' ? t('rr.log.form') : t('rr.log.click')}</span>
                          {e.assignmentReason && e.assignmentReason !== 'rotation' && <span className="font-bold text-sky-700 dark:text-sky-300">🔁 {e.assignmentReason === 'returning_customer' ? t('rr.log.returningCustomer') : e.assignmentReason === 'handover' ? t('rr.log.handover') : t('rr.log.returningVisitor')}</span>}
                          {e.demo && <span className="px-1.5 rounded-full border text-[9px] font-black bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900">🧪 DEMO</span>}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-semibold">
                          <DeviceIcon kind={agent.device} />
                          <span>{agent.device === 'bot' ? agent.browser : [agent.browser, agent.os].filter(Boolean).join(' · ') || t('rr.vis.noAgent')}</span>
                        </div>
                        {agent.app && <div className="text-[10px] text-slate-500 dark:text-gray-400">{t('rr.vis.inApp', { app: agent.app })}</div>}
                        {e.clientName && <div className="text-[10px] font-bold text-slate-700 dark:text-gray-200">{e.clientName}</div>}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="text-slate-900 dark:text-white">{place}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-gray-400">
                          {e.visitorIp && e.visitorIp !== 'unknown' ? e.visitorIp : t('rr.vis.noIp')}
                          {sameIp > 1 && <span className="ml-1 text-amber-700 dark:text-amber-400 font-sans font-bold">×{sameIp}</span>}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="text-slate-900 dark:text-white break-all">{source}</div>
                        {e.visit && <div className="text-[10px] text-slate-500 dark:text-gray-400 pa-num">{t('rr.vis.visitLine', { sec: Math.round(secondsOnPageBeforeClick(e.visit, Date.parse(e.timestamp))), sc: e.visit.sc || 0 })}</div>}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="text-slate-900 dark:text-white line-clamp-1 max-w-[180px]">{e.pageTitle || e.pageSlug}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-gray-400">/{e.pageSlug}</div>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <StaffAvatar name={e.staffName} src={avatarOf(e.staffId)} size={22} />
                          <span className="font-semibold text-slate-900 dark:text-white">{e.staffName}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <VerdictBadge verdict={check.verdict} label={verdictLabel(check.verdict)} />
                      </td>
                      <td className="py-2 text-right">
                        <button type="button" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen} aria-label={t('rr.log.th.details')} className="p-1 rounded-lg border border-slate-200 dark:border-emerald-800 text-slate-600 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950 cursor-pointer">
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-slate-50 dark:bg-emerald-950/30" data-contact-detail="">
                        <td colSpan={8} className="p-3">
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {check.reasons.map((r) => (
                              <span key={r} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${r === 'readPage' || r === 'returning' || r === 'sameSession' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : r === 'demo' ? 'bg-violet-500/10 border-violet-500/30 text-violet-800 dark:text-violet-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'}`}>
                                {t(`rr.vis.reason.${r}`)}
                              </span>
                            ))}
                            {check.reasons.length === 0 && <span className={SUB}>{t('rr.vis.noSignals')}</span>}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            <Detail label={t('rr.vis.d.time')} value={ppFull(e.timestamp)} />
                            <Detail label={t('rr.vis.d.ip')} value={e.visitorIp && e.visitorIp !== 'unknown' ? e.visitorIp : undefined} mono />
                            <Detail label={t('rr.vis.d.place')} value={v?.country ? `${countryName(v.country)} (${v.country})${v.region ? ` · ${v.region}` : ''}${v.city ? ` · ${v.city}` : ''}` : undefined} />
                            <Detail label={t('rr.vis.d.device')} value={`${deviceLabel(agent.device)}${agent.os ? ` · ${agent.os}` : ''}${agent.browser ? ` · ${agent.browser}` : ''}${agent.app ? ` · ${agent.app}` : ''}`} />
                            <Detail label={t('rr.vis.d.lang')} value={v?.lang} />
                            <Detail label={t('rr.vis.d.campaign')} value={[v?.utmSource, v?.utmMedium, v?.utmCampaign, v?.utmContent].filter(Boolean).join(' / ') || undefined} />
                            <Detail label={t('rr.vis.d.referrer')} value={v?.referrer} mono />
                            {e.visit && <Detail label={t('rr.vis.d.visit')} value={t('rr.vis.d.visitValue', { sec: Math.round(secondsOnPageBeforeClick(e.visit, Date.parse(e.timestamp))), sc: e.visit.sc || 0, cta: e.visit.cta || 0, tg: e.visit.tg || 0, src: e.visit.src, dev: e.visit.dev || '?' })} />}
                            {e.visit === null && <Detail label={t('rr.vis.d.visit')} value={t('rr.vis.d.noVisit')} />}
                            <Detail label={t('rr.vis.d.session')} value={v?.sessionId ? `${v.sessionId}${v.visitorId ? ` · ${v.visitorId}` : ''}` : undefined} mono />
                            <Detail label={t('rr.vis.d.agent')} value={e.userAgent} mono />
                            <Detail label={t('rr.vis.d.delivery')} value={`${e.status}${e.deliveryError ? ` · ${e.deliveryError}` : ''}`} />
                            <Detail label={t('rr.vis.d.log')} value={e.id} mono />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {e.targetTelegramUrl && <a href={e.targetTelegramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 border border-slate-200 dark:border-emerald-800/60 text-[10px] font-bold">{t('rr.log.link')} <ExternalLink className="w-3 h-3" /></a>}
                            {e.leadId && <Link href={`/admin/leads?id=${encodeURIComponent(e.leadId)}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 border border-slate-200 dark:border-emerald-800/60 text-[10px] font-bold">{t('rr.log.viewLead')}</Link>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length > shown && (
            <button type="button" onClick={() => setShown((n) => n + PAGE_SIZE)} className="mt-3 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-xs font-bold text-slate-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950 cursor-pointer">
              {t('rr.vis.more', { n: filtered.length - shown })}
            </button>
          )}
        </div>
      )}
      <p className={`${SUB} mt-3`}>{t('rr.vis.footnote')}</p>
    </div>
  );
}
