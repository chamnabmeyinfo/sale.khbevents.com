/**
 * The campaign report: how each campaign performs and how its visitors behave,
 * built from visit records (visits.ts), real leads (CRM) and campaign spend.
 *
 * - Performance: visits, engaged visits, leads, customers (CRM "won"), conversion,
 *   spend, cost per lead and per customer.
 * - Behaviour: active time, how far they read, which section they left at, clicks,
 *   forms started but not sent, device, app browser, language, hour of day, new or returning.
 * - Findings: plain rules that flag what needs attention (the AI analyst starts from them).
 *
 * A visit is credited to the campaign it landed with (utm_campaign); a lead to its own
 * utm_campaign, else the first campaign that found the visitor, else its visit's campaign.
 * Pure: no storage access.
 */
import type { Lead } from './types';
import type { Campaign } from './campaigns';
import { spendBetween } from './campaigns';
import { mergeVisit, type VisitRecord } from './visits';
import { phnomPenhDay, phnomPenhHour } from './popup-analytics';

export const NO_CAMPAIGN = '(none)';
/** A visit counts as engaged after 15 active seconds, half the page read, or any click. */
export const ENGAGED_SECONDS = 15;

export interface Metrics {
  visits: number;
  visitors: number;
  engaged: number;
  readHalf: number;
  interested: number;
  telegram: number;
  formStarts: number;
  formLeads: number;
  returning: number;
  medianSeconds: number;
  avgScroll: number;
  leads: number;
  won: number;
  lost: number;
  contacted: number;
  spend: number;
  /** Rates 0–100, rounded to one decimal. */
  engagedRate: number;
  leadRate: number;
  winRate: number;
  cpl: number | null;
  cpw: number | null;
}

export interface Breakdown extends Metrics {
  key: string;
  label: string;
}

export interface SectionReach {
  id: string;
  type?: string;
  title?: string;
  reached: number;
  pct: number;
}

export interface CampaignRow extends Breakdown {
  campaign?: Campaign;
  pageSlug?: string;
  channel?: string;
  status?: string;
  budget?: number;
  /** Median minutes from the lead to the first answer by a salesperson. */
  responseMinutes: number | null;
  newLeadsWaiting: number;
}

export interface Finding {
  severity: 'high' | 'medium' | 'low' | 'good';
  area: 'ads' | 'page' | 'sales' | 'tracking' | 'offer';
  scope: string;
  en: string;
  kh: string;
}

export interface CampaignReport {
  range: { from: string; to: string; days: number };
  total: Metrics;
  campaigns: CampaignRow[];
  channels: Breakdown[];
  ads: Breakdown[];
  devices: Breakdown[];
  apps: Breakdown[];
  languages: Breakdown[];
  visitorType: Breakdown[];
  pages: Breakdown[];
  hours: Array<{ hour: number; visits: number; leads: number }>;
  days: Array<{ day: string; visits: number; engaged: number; leads: number; spend: number }>;
  sections: Record<string, SectionReach[]>;
  findings: Finding[];
}

export interface PageInfo {
  slug: string;
  title: string;
  sections: Array<{ id: string; type: string; title?: string }>;
  /** Registration deadline of the page's offer (ISO), for the "deadline passed" check. */
  deadline?: string;
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

export const isEngaged = (v: VisitRecord) => (v.sec || 0) >= ENGAGED_SECONDS || (v.sc || 0) >= 50 || (v.cta || 0) > 0 || (v.tg || 0) > 0 || Boolean(v.fs);
const isInterested = (v: VisitRecord) => (v.cta || 0) > 0 || (v.tg || 0) > 0 || Boolean(v.fs);

/** Same visit reported on two days (it went past midnight): merged into one. */
export function dedupeVisits(visits: VisitRecord[]): VisitRecord[] {
  const map = new Map<string, VisitRecord>();
  for (const v of visits) {
    const key = `${v.p}|${v.s}`;
    const old = map.get(key);
    map.set(key, old ? mergeVisit(old, v) : v);
  }
  return Array.from(map.values());
}

export function leadCampaign(lead: Lead, visitsBySession?: Map<string, VisitRecord>): string {
  const own = (lead.utmCampaign || '').trim().toLowerCase();
  if (own) return own;
  const first = (lead.customFields?.firstCampaign || '').trim().toLowerCase();
  if (first) return first;
  const visit = lead.customFields?.visitSession ? visitsBySession?.get(lead.customFields.visitSession) : undefined;
  return visit?.cmp || NO_CAMPAIGN;
}

function metrics(visits: VisitRecord[], leads: Lead[], spend = 0): Metrics {
  const visitors = new Set(visits.map((v) => v.v || v.s)).size;
  const engaged = visits.filter(isEngaged).length;
  const secs = visits.filter((v) => typeof v.sec === 'number').map((v) => v.sec!);
  const scrolls = visits.filter((v) => typeof v.sc === 'number').map((v) => v.sc!);
  const won = leads.filter((l) => l.status === 'WON').length;
  const lost = leads.filter((l) => l.status === 'LOST').length;
  const contacted = leads.filter((l) => l.status !== 'NEW').length;
  return {
    visits: visits.length,
    visitors,
    engaged,
    readHalf: visits.filter((v) => (v.sc || 0) >= 50).length,
    interested: visits.filter(isInterested).length,
    telegram: visits.filter((v) => (v.tg || 0) > 0).length,
    formStarts: visits.filter((v) => v.fs).length,
    formLeads: visits.filter((v) => v.lead).length,
    returning: visits.filter((v) => v.ret).length,
    medianSeconds: median(secs),
    avgScroll: scrolls.length ? Math.round(scrolls.reduce((a, b) => a + b, 0) / scrolls.length) : 0,
    leads: leads.length,
    won,
    lost,
    contacted,
    spend,
    engagedRate: pct(engaged, visits.length),
    leadRate: pct(leads.length, visits.length),
    winRate: pct(won, leads.length),
    cpl: spend > 0 && leads.length ? Math.round((spend / leads.length) * 100) / 100 : null,
    cpw: spend > 0 && won ? Math.round((spend / won) * 100) / 100 : null,
  };
}

function groupBy(visits: VisitRecord[], leads: Lead[], visitKey: (v: VisitRecord) => string, leadKey: ((l: Lead) => string | null) | null, label: (k: string) => string = (k) => k): Breakdown[] {
  const vmap = new Map<string, VisitRecord[]>();
  for (const v of visits) {
    const k = visitKey(v);
    vmap.set(k, [...(vmap.get(k) || []), v]);
  }
  const lmap = new Map<string, Lead[]>();
  if (leadKey) {
    for (const l of leads) {
      const k = leadKey(l);
      if (k === null) continue;
      lmap.set(k, [...(lmap.get(k) || []), l]);
    }
  }
  const keys = new Set([...vmap.keys(), ...lmap.keys()]);
  return Array.from(keys)
    .map((k) => ({ key: k, label: label(k), ...metrics(vmap.get(k) || [], lmap.get(k) || []) }))
    .sort((a, b) => b.visits - a.visits || b.leads - a.leads);
}

function responseMinutes(leads: Lead[]): number | null {
  const mins = leads.map((l) => l.routing?.claim?.seconds).filter((s): s is number => typeof s === 'number').map((s) => s / 60);
  return mins.length ? Math.round(median(mins) * 10) / 10 : null;
}

export function buildCampaignReport(input: {
  visits: VisitRecord[];
  leads: Lead[];
  campaigns: Campaign[];
  pages: PageInfo[];
  days: number;
  nowMs: number;
  pageSlug?: string;
}): CampaignReport {
  const { days, nowMs } = input;
  const from = phnomPenhDay(nowMs - (days - 1) * 86_400_000);
  const to = phnomPenhDay(nowMs);
  const inRange = (ms: number) => {
    const d = phnomPenhDay(ms);
    return d >= from && d <= to;
  };
  let visits = dedupeVisits(input.visits).filter((v) => inRange(v.t0));
  if (input.pageSlug) visits = visits.filter((v) => v.p === input.pageSlug);
  const bySession = new Map(visits.map((v) => [v.s, v]));
  let leads = input.leads.filter((l) => inRange(new Date(l.createdAt).getTime()));
  if (input.pageSlug) leads = leads.filter((l) => l.landingPageSlug === input.pageSlug);
  const campaigns = input.pageSlug ? input.campaigns.filter((c) => c.pageSlug === input.pageSlug) : input.campaigns;
  const cmpOfLead = (l: Lead) => leadCampaign(l, bySession);
  const leadVisit = (l: Lead) => (l.customFields?.visitSession ? bySession.get(l.customFields.visitSession) : undefined);

  // ── Campaigns (registered ones first, then tracked names nobody registered, then none)
  const totalSpend = campaigns.reduce((s, c) => s + spendBetween(c, from, to), 0);
  const cmpKeys = new Set<string>([...campaigns.map((c) => c.slug), ...visits.map((v) => v.cmp || NO_CAMPAIGN), ...leads.map(cmpOfLead)]);
  const campaignRows: CampaignRow[] = Array.from(cmpKeys).map((key) => {
    const c = campaigns.find((x) => x.slug === key);
    const cv = visits.filter((v) => (v.cmp || NO_CAMPAIGN) === key);
    const cl = leads.filter((l) => cmpOfLead(l) === key);
    const spend = c ? spendBetween(c, from, to) : 0;
    return {
      key,
      label: c?.name || key,
      ...metrics(cv, cl, spend),
      campaign: c,
      pageSlug: c?.pageSlug,
      channel: c?.channel || cv[0]?.src,
      status: c?.status,
      budget: c?.budget,
      responseMinutes: responseMinutes(cl),
      newLeadsWaiting: cl.filter((l) => l.status === 'NEW').length,
    };
  }).sort((a, b) => Number(Boolean(b.campaign)) - Number(Boolean(a.campaign)) || b.leads - a.leads || b.visits - a.visits);

  // ── Breakdowns
  const channelOfLead = (l: Lead) => leadVisit(l)?.src || (l.utmSource || '').toLowerCase() || 'direct';
  const channels = groupBy(visits, leads, (v) => v.src, channelOfLead);
  const ads = groupBy(visits.filter((v) => v.cnt), leads.filter((l) => l.utmContent), (v) => `${v.cmp || NO_CAMPAIGN} · ${v.cnt}`, (l) => `${cmpOfLead(l)} · ${l.utmContent}`);
  const devices = groupBy(visits, leads, (v) => v.dev || 'unknown', (l) => leadVisit(l)?.dev || null);
  const apps = groupBy(visits, leads, (v) => v.app || 'Browser', (l) => (leadVisit(l) ? leadVisit(l)!.app || 'Browser' : null));
  const languages = groupBy(visits, leads, (v) => v.lang || 'en', (l) => leadVisit(l)?.lang || (l.customFields?.language === 'kh' ? 'kh' : l.customFields?.language === 'en' ? 'en' : null));
  const visitorType = groupBy(visits, leads, (v) => (v.ret ? 'returning' : 'new'), (l) => { const v = leadVisit(l); return v ? (v.ret ? 'returning' : 'new') : null; });
  const pageTitle = (slug: string) => input.pages.find((p) => p.slug === slug)?.title || slug;
  const pages = groupBy(visits, leads, (v) => v.p, (l) => l.landingPageSlug, pageTitle);
  for (const row of pages) row.spend = campaigns.filter((c) => c.pageSlug === row.key).reduce((s, c) => s + spendBetween(c, from, to), 0);

  // ── Time
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, visits: 0, leads: 0 }));
  for (const v of visits) hours[phnomPenhHour(v.t0)].visits++;
  for (const l of leads) hours[phnomPenhHour(new Date(l.createdAt).getTime())].leads++;
  const dayList: CampaignReport['days'] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = phnomPenhDay(nowMs - i * 86_400_000);
    const dv = visits.filter((v) => phnomPenhDay(v.t0) === day);
    dayList.push({
      day,
      visits: dv.length,
      engaged: dv.filter(isEngaged).length,
      leads: leads.filter((l) => phnomPenhDay(new Date(l.createdAt).getTime()) === day).length,
      spend: Math.round(campaigns.reduce((s, c) => s + spendBetween(c, day, day), 0) * 100) / 100,
    });
  }

  // ── How far visitors read, per page (visits that reported sections only)
  const sections: Record<string, SectionReach[]> = {};
  for (const page of input.pages) {
    const pv = visits.filter((v) => v.p === page.slug && typeof v.sn === 'number' && v.sn > 0);
    if (!pv.length || !page.sections.length) continue;
    sections[page.slug] = page.sections.map((s, i) => {
      const reached = pv.filter((v) => (v.seen || []).includes(s.id) || (v.sx ?? -1) >= i).length;
      return { id: s.id, type: s.type, title: s.title, reached, pct: pct(reached, pv.length) };
    });
  }

  const report: CampaignReport = {
    range: { from, to, days },
    total: metrics(visits, leads, Math.round(totalSpend * 100) / 100),
    campaigns: campaignRows,
    channels,
    ads,
    devices,
    apps,
    languages,
    visitorType,
    pages,
    hours,
    days: dayList,
    sections,
    findings: [],
  };
  report.findings = findings(report, input.pages, nowMs);
  return report;
}

// ─── Findings: what needs attention, in plain words ───────────────────────

const MIN_VISITS = 30;

export function findings(r: CampaignReport, pages: PageInfo[], nowMs: number = Date.now()): Finding[] {
  const out: Finding[] = [];
  const t = r.total;
  if (t.visits === 0 && t.leads === 0) {
    out.push({ severity: 'low', area: 'tracking', scope: 'all', en: 'No visits recorded in this period yet. Share a campaign link to start measuring.', kh: 'មិនទាន់មានអ្នកចូលមើលក្នុងរយៈពេលនេះ។ ចែករំលែកតំណយុទ្ធនាការ ដើម្បីចាប់ផ្តើមវាស់វែង។' });
    return out;
  }

  // Tracking: much traffic without a campaign tag.
  const none = r.campaigns.find((c) => c.key === NO_CAMPAIGN);
  if (none && t.visits >= MIN_VISITS && none.visits / t.visits > 0.5) {
    out.push({ severity: 'medium', area: 'tracking', scope: 'all', en: `${pct(none.visits, t.visits)}% of visits carry no campaign tag, so they cannot be credited to an ad or post. Use the campaign links for every ad, post and Telegram message.`, kh: `${pct(none.visits, t.visits)}% នៃការចូលមើល គ្មានស្លាកយុទ្ធនាការ ដូច្នេះមិនអាចដឹងថាមកពីការផ្សាយណា។ ប្រើតំណយុទ្ធនាការសម្រាប់គ្រប់ការផ្សាយ ប៉ុស្តិ៍ និងសារ Telegram។` });
  }
  const unregistered = r.campaigns.filter((c) => !c.campaign && c.key !== NO_CAMPAIGN && c.visits >= 5);
  if (unregistered.length) {
    out.push({ severity: 'low', area: 'tracking', scope: unregistered.map((c) => c.key).join(', '), en: `Tracked campaign names that are not registered: ${unregistered.map((c) => c.key).join(', ')}. Add them in Campaigns to record their spend.`, kh: `ឈ្មោះយុទ្ធនាការដែលមិនទាន់ចុះបញ្ជី៖ ${unregistered.map((c) => c.key).join(', ')}។ បន្ថែមវានៅ Campaigns ដើម្បីកត់ត្រាការចំណាយ។` });
  }

  for (const c of r.campaigns) {
    if (c.key === NO_CAMPAIGN) continue;
    const name = c.label;
    if (c.visits >= MIN_VISITS && c.leads === 0) {
      out.push({ severity: 'high', area: c.engagedRate < 35 ? 'ads' : 'page', scope: c.key, en: `"${name}": ${c.visits} visits and no lead. ${c.engagedRate < 35 ? `Only ${c.engagedRate}% stay engaged: the ad likely reaches the wrong people or promises something the page does not show.` : `${c.engagedRate}% are engaged but nobody registers: check the offer, the price and the form.`}`, kh: `"${name}"៖ ចូលមើល ${c.visits} ដង តែគ្មានអ្នកចុះឈ្មោះ។ ${c.engagedRate < 35 ? `មានតែ ${c.engagedRate}% ដែលចាប់អារម្មណ៍៖ ការផ្សាយប្រហែលជាទៅដល់មនុស្សខុស ឬសន្យាអ្វីដែលទំព័រមិនបង្ហាញ។` : `${c.engagedRate}% ចាប់អារម្មណ៍ តែគ្មាននរណាចុះឈ្មោះ៖ ពិនិត្យការផ្តល់ជូន តម្លៃ និងទម្រង់។`}` });
    }
    if (c.spend > 0 && c.leads === 0 && c.visits < MIN_VISITS) {
      out.push({ severity: 'medium', area: 'ads', scope: c.key, en: `"${name}": $${c.spend} spent, ${c.visits} visits, no lead yet. Check that the ad uses this campaign's link.`, kh: `"${name}"៖ ចំណាយ $${c.spend} ចូលមើល ${c.visits} តែមិនទាន់មានអ្នកចុះឈ្មោះ។ ពិនិត្យថាការផ្សាយប្រើតំណរបស់យុទ្ធនាការនេះ។` });
    }
    if (c.newLeadsWaiting >= 3) {
      out.push({ severity: 'high', area: 'sales', scope: c.key, en: `"${name}": ${c.newLeadsWaiting} leads are still "New" (not contacted). Leads go cold within hours; call them today.`, kh: `"${name}"៖ មានអ្នកចុះឈ្មោះ ${c.newLeadsWaiting} នាក់ នៅតែ "New" (មិនទាន់ទាក់ទង)។ ទាក់ទងពួកគេថ្ងៃនេះ។` });
    }
    if (c.responseMinutes !== null && c.responseMinutes > 30) {
      out.push({ severity: 'medium', area: 'sales', scope: c.key, en: `"${name}": salespeople answer new leads after ${c.responseMinutes} minutes (median). Answering within 5 minutes converts far more.`, kh: `"${name}"៖ អ្នកលក់ឆ្លើយតបអ្នកចុះឈ្មោះថ្មីក្រោយ ${c.responseMinutes} នាទី។ ការឆ្លើយតបក្នុង ៥ នាទី នាំមកអតិថិជនច្រើនជាង។` });
    }
  }

  // Best and worst cost per lead among campaigns with spend.
  const paid = r.campaigns.filter((c) => c.cpl !== null);
  if (paid.length >= 2) {
    const sorted = [...paid].sort((a, b) => a.cpl! - b.cpl!);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (worst.cpl! >= best.cpl! * 2) {
      out.push({ severity: 'medium', area: 'ads', scope: `${best.key}, ${worst.key}`, en: `Cost per lead: "${best.label}" $${best.cpl} vs "${worst.label}" $${worst.cpl}. Move budget toward "${best.label}".`, kh: `តម្លៃក្នុងមួយអ្នកចុះឈ្មោះ៖ "${best.label}" $${best.cpl} ធៀបនឹង "${worst.label}" $${worst.cpl}។ ផ្ទេរថវិកាទៅ "${best.label}"។` });
    }
  }

  // Page: forms started but not sent.
  if (t.formStarts >= 5 && t.formLeads / t.formStarts < 0.6) {
    const lostForms = t.formStarts - t.formLeads;
    out.push({ severity: 'high', area: 'page', scope: 'form', en: `${lostForms} of ${t.formStarts} visitors who started the form did not send it. Ask for fewer fields (name and phone), and offer "Chat on Telegram" next to the form.`, kh: `${lostForms} ក្នុងចំណោម ${t.formStarts} នាក់ដែលចាប់ផ្តើមបំពេញទម្រង់ មិនបានផ្ញើ។ សុំព័ត៌មានតិច (ឈ្មោះ និងលេខទូរស័ព្ទ) ហើយដាក់ "ជជែកតាម Telegram" ក្បែរទម្រង់។` });
  }

  // Page: where readers leave.
  for (const page of pages) {
    const reach = r.sections[page.slug];
    if (!reach || reach.length < 3) continue;
    const pv = r.pages.find((p) => p.key === page.slug);
    if (!pv || pv.visits < MIN_VISITS) continue;
    let worst = { i: -1, drop: 0 };
    for (let i = 1; i < reach.length; i++) {
      const drop = reach[i - 1].pct - reach[i].pct;
      if (drop > worst.drop) worst = { i, drop };
    }
    if (worst.i > 0 && worst.drop >= 20) {
      const before = reach[worst.i - 1];
      const after = reach[worst.i];
      const formIndex = page.sections.findIndex((s) => s.type === 'form');
      const formReach = formIndex >= 0 ? reach[formIndex]?.pct : undefined;
      out.push({ severity: worst.drop >= 30 ? 'high' : 'medium', area: 'page', scope: page.slug, en: `${page.title}: ${Math.round(worst.drop)}% of readers leave between "${before.title || before.type}" and "${after.title || after.type}".${formReach !== undefined ? ` Only ${formReach}% reach the form: move the form or a "Register" button higher.` : ''}`, kh: `${page.title}៖ អ្នកអាន ${Math.round(worst.drop)}% ចាកចេញរវាង "${before.title || before.type}" និង "${after.title || after.type}"។${formReach !== undefined ? ` មានតែ ${formReach}% ដែលមកដល់ទម្រង់៖ ដាក់ទម្រង់ ឬប៊ូតុង "ចុះឈ្មោះ" ឲ្យខ្ពស់ជាងនេះ។` : ''}` });
    }
  }

  // Page: very short visits overall.
  if (t.visits >= MIN_VISITS && t.engagedRate < 30) {
    out.push({ severity: 'high', area: 'page', scope: 'all', en: `Only ${t.engagedRate}% of visits are engaged (median ${t.medianSeconds}s). The first screen must say in one line what the trip is, the date and the price, with a clear button.`, kh: `មានតែ ${t.engagedRate}% នៃការចូលមើលដែលចាប់អារម្មណ៍ (មធ្យម ${t.medianSeconds} វិនាទី)។ អេក្រង់ទីមួយត្រូវប្រាប់ក្នុងមួយបន្ទាត់ថាដំណើរអ្វី ថ្ងៃណា តម្លៃប៉ុន្មាន ជាមួយប៊ូតុងច្បាស់។` });
  }

  // In-app browsers vs normal browsers.
  const inApp = r.apps.filter((a) => a.key !== 'Browser');
  const normal = r.apps.find((a) => a.key === 'Browser');
  const inAppVisits = inApp.reduce((s, a) => s + a.visits, 0);
  const inAppLeads = inApp.reduce((s, a) => s + a.leads, 0);
  if (normal && inAppVisits >= MIN_VISITS && normal.visits >= 10) {
    const a = pct(inAppLeads, inAppVisits);
    if (a < normal.leadRate / 2) {
      out.push({ severity: 'medium', area: 'page', scope: 'in-app', en: `Visitors inside Facebook/Telegram apps convert at ${a}% vs ${normal.leadRate}% in normal browsers. Make the Telegram button the main action for app visitors; forms are harder there.`, kh: `អ្នកចូលមើលក្នុងកម្មវិធី Facebook/Telegram ចុះឈ្មោះ ${a}% ធៀបនឹង ${normal.leadRate}% ក្នុងកម្មវិធីរុករកធម្មតា។ ធ្វើឲ្យប៊ូតុង Telegram ជាសកម្មភាពចម្បងសម្រាប់ពួកគេ។` });
    }
  }

  // Language gap.
  const kh = r.languages.find((l) => l.key === 'kh');
  const en = r.languages.find((l) => l.key === 'en');
  if (kh && en && kh.visits >= 20 && en.visits >= 20) {
    const [lo, hi] = kh.leadRate < en.leadRate ? [kh, en] : [en, kh];
    if (hi.leadRate >= lo.leadRate * 2 && hi.leadRate - lo.leadRate >= 1) {
      out.push({ severity: 'low', area: 'page', scope: 'language', en: `${lo.key === 'kh' ? 'Khmer' : 'English'} readers convert at ${lo.leadRate}% vs ${hi.leadRate}% in ${hi.key === 'kh' ? 'Khmer' : 'English'}. Review the ${lo.key === 'kh' ? 'Khmer' : 'English'} text of the page.`, kh: `អ្នកអានភាសា${lo.key === 'kh' ? 'ខ្មែរ' : 'អង់គ្លេស'} ចុះឈ្មោះ ${lo.leadRate}% ធៀបនឹង ${hi.leadRate}%។ ពិនិត្យអត្ថបទភាសា${lo.key === 'kh' ? 'ខ្មែរ' : 'អង់គ្លេស'}។` });
    }
  }

  // Offer: campaigns still running for a page whose registration deadline has passed.
  for (const page of pages) {
    if (!page.deadline || new Date(page.deadline).getTime() > nowMs) continue;
    const running = r.campaigns.filter((c) => c.campaign && c.pageSlug === page.slug && c.status === 'active');
    if (running.length) {
      out.push({ severity: 'high', area: 'offer', scope: page.slug, en: `${page.title}: the registration deadline on the page has passed, but ${running.length} campaign(s) still send visitors there. Set a new deadline in the builder or pause the ads.`, kh: `${page.title}៖ ថ្ងៃផុតកំណត់ចុះឈ្មោះលើទំព័របានកន្លងផុត តែនៅមានយុទ្ធនាការ ${running.length} កំពុងបញ្ជូនអ្នកចូលមើល។ កំណត់ថ្ងៃថ្មីក្នុង Builder ឬផ្អាកការផ្សាយ។` });
    }
  }

  // Good news worth repeating.
  const star = r.campaigns.filter((c) => c.key !== NO_CAMPAIGN && c.visits >= 20 && c.leads >= 3).sort((a, b) => b.leadRate - a.leadRate)[0];
  if (star && star.leadRate >= Math.max(3, t.leadRate * 1.5)) {
    out.push({ severity: 'good', area: 'ads', scope: star.key, en: `"${star.label}" converts at ${star.leadRate}% (average ${t.leadRate}%). Make more ads like it.`, kh: `"${star.label}" ចុះឈ្មោះ ${star.leadRate}% (មធ្យម ${t.leadRate}%)។ បង្កើតការផ្សាយបែបនេះបន្ថែម។` });
  }

  const order = { high: 0, medium: 1, low: 2, good: 3 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}
