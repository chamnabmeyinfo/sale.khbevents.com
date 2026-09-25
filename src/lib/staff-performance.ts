/**
 * How each salesperson is doing, from the lead records (owner, button taps,
 * response times, hand-overs, CRM status) and the daily Telegram click counts.
 * Pure functions, client-safe; used by Team performance and the daily summary.
 */
import type { Lead, RoundRobinStaff, StaffClickStats } from './types';
import { dayRange, phnomPenhDay } from './popup-analytics';
import { escapeHtml } from './round-robin';
import { formatWait } from './lead-response';

export interface StaffRow {
  staffId: string;
  name: string;
  active: boolean;
  /** Form leads this person ended up with. */
  formLeads: number;
  /** Telegram clicks sent to this person. */
  clicks: number;
  /** Form leads with a button tap. */
  tapped: number;
  /** tapped ÷ formLeads, percent. */
  responseRate: number;
  /** Average seconds to the first tap, or null. */
  avgResponseSeconds: number | null;
  contacted: number;
  noAnswer: number;
  notInterested: number;
  won: number;
  lost: number;
  /** Still NEW with no tap. */
  waiting: number;
  /** Leads passed to this person / away from this person. */
  receivedFromHandover: number;
  passedAway: number;
  /** Share of all new contacts (forms + clicks), percent. */
  share: number;
}

export interface TeamPerformance {
  from: string;
  to: string;
  rows: StaffRow[];
  totals: Omit<StaffRow, 'staffId' | 'name' | 'active' | 'share'>;
  /** Form leads per day for the whole team (for a small trend). */
  days: Array<{ day: string; formLeads: number; clicks: number }>;
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

function emptyRow(staffId: string, name: string, active: boolean): StaffRow {
  return { staffId, name, active, formLeads: 0, clicks: 0, tapped: 0, responseRate: 0, avgResponseSeconds: null, contacted: 0, noAnswer: 0, notInterested: 0, won: 0, lost: 0, waiting: 0, receivedFromHandover: 0, passedAway: 0, share: 0 };
}

/** Sums the team's work between two Phnom Penh days (inclusive). */
export function teamPerformance(
  leads: Lead[],
  clickStats: StaffClickStats,
  staffList: RoundRobinStaff[],
  range: { from: string; to: string }
): TeamPerformance {
  const rows = new Map<string, StaffRow>();
  const secs = new Map<string, [number, number]>();
  for (const s of staffList) rows.set(s.id, emptyRow(s.id, s.name, s.isActive));
  const row = (id: string, name: string) => {
    if (!rows.has(id)) rows.set(id, emptyRow(id, name, false));
    return rows.get(id)!;
  };
  const inRange = (iso: string) => {
    const d = phnomPenhDay(Date.parse(iso));
    return d >= range.from && d <= range.to;
  };
  const days = new Map(dayRange(range.from, range.to).map((d) => [d, { day: d, formLeads: 0, clicks: 0 }]));

  for (const lead of leads) {
    const r = lead.routing;
    if (!r || r.routeType !== 'FORM_SUBMISSION' || !inRange(lead.createdAt)) continue;
    const owner = row(r.staffId, r.staffName);
    owner.formLeads += 1;
    const d = days.get(phnomPenhDay(Date.parse(lead.createdAt)));
    if (d) d.formLeads += 1;
    if (r.claim) {
      const by = row(r.claim.staffId, r.claim.staffName);
      by.tapped += 1;
      if (r.claim.outcome === 'CONTACTED') by.contacted += 1;
      else if (r.claim.outcome === 'NO_ANSWER') by.noAnswer += 1;
      else by.notInterested += 1;
      const pair = secs.get(by.staffId) || [0, 0];
      secs.set(by.staffId, [pair[0] + r.claim.seconds, pair[1] + 1]);
    } else if (lead.status === 'NEW') {
      owner.waiting += 1;
    }
    if (lead.status === 'WON') owner.won += 1;
    if (lead.status === 'LOST') owner.lost += 1;
    for (const h of r.handovers || []) {
      row(h.fromStaffId, h.fromName).passedAway += 1;
      row(h.toStaffId, h.toName).receivedFromHandover += 1;
    }
  }

  for (const [staffId, perDay] of Object.entries(clickStats || {})) {
    for (const [day, n] of Object.entries(perDay)) {
      if (day < range.from || day > range.to) continue;
      const known = staffList.find((s) => s.id === staffId);
      row(staffId, known?.name || staffId).clicks += n;
      const d = days.get(day);
      if (d) d.clicks += n;
    }
  }

  const list = Array.from(rows.values()).filter((r) => r.active || r.formLeads || r.clicks || r.tapped);
  const allContacts = list.reduce((sum, r) => sum + r.formLeads + r.clicks, 0);
  for (const r of list) {
    // Response rate: taps on the leads this person holds (a lead passed on counts for the final owner).
    r.responseRate = pct(Math.min(r.tapped, r.formLeads), r.formLeads);
    const pair = secs.get(r.staffId);
    r.avgResponseSeconds = pair && pair[1] ? Math.round(pair[0] / pair[1]) : null;
    r.share = pct(r.formLeads + r.clicks, allContacts);
  }
  list.sort((a, b) => b.formLeads + b.clicks - (a.formLeads + a.clicks) || a.name.localeCompare(b.name));

  const sum = <K extends keyof StaffRow>(k: K) => list.reduce((acc, r) => acc + (r[k] as number), 0);
  const allSecs = Array.from(secs.values()).reduce((acc, [s, n]) => [acc[0] + s, acc[1] + n], [0, 0]);
  const formLeads = sum('formLeads');
  const tapped = sum('tapped');
  return {
    from: range.from,
    to: range.to,
    rows: list,
    totals: {
      formLeads,
      clicks: sum('clicks'),
      tapped,
      responseRate: pct(Math.min(tapped, formLeads), formLeads),
      avgResponseSeconds: allSecs[1] ? Math.round(allSecs[0] / allSecs[1]) : null,
      contacted: sum('contacted'),
      noAnswer: sum('noAnswer'),
      notInterested: sum('notInterested'),
      won: sum('won'),
      lost: sum('lost'),
      waiting: sum('waiting'),
      receivedFromHandover: sum('receivedFromHandover'),
      passedAway: sum('passedAway'),
    },
    days: Array.from(days.values()),
  };
}

/** Leads from a day still NEW with no tap, oldest first (for the summary). */
export function waitingLeads(leads: Lead[], day: string): Lead[] {
  return leads
    .filter((l) => l.routing?.routeType === 'FORM_SUBMISSION' && l.status === 'NEW' && !l.routing.claim && phnomPenhDay(Date.parse(l.createdAt)) === day)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ─── Daily summary message ─────────────────────────────────────────────────

const PP_OFFSET_MS = 7 * 60 * 60 * 1000;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const ppTime = (iso: string) => new Date(Date.parse(iso) + PP_OFFSET_MS).toISOString().slice(11, 16);

/** The text of the day's summary (HTML for Telegram). */
export function dailySummaryText(leads: Lead[], clickStats: StaffClickStats, staffList: RoundRobinStaff[], day: string): string {
  const perf = teamPerformance(leads, clickStats, staffList, { from: day, to: day });
  const t = perf.totals;
  const dateLabel = new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const lines = [
    `📊 <b>សង្ខេបការលក់ប្រចាំថ្ងៃ · Daily sales summary</b> · ${escapeHtml(dateLabel)}`,
    '━━━━━━━━━━━━━━━━━━━━',
    `🆕 <b>${t.formLeads}</b> form ${t.formLeads === 1 ? 'lead' : 'leads'} · <b>${t.clicks}</b> Telegram ${t.clicks === 1 ? 'click' : 'clicks'}`,
    t.formLeads ? `✅ Buttons tapped: <b>${t.tapped}</b> of ${t.formLeads} (${t.responseRate}%)${t.avgResponseSeconds !== null ? ` · average reply <b>${formatWait(t.avgResponseSeconds)}</b>` : ''}` : '',
    t.won || t.lost ? `🏆 Won ${t.won} · Lost ${t.lost}` : '',
    t.passedAway ? `🔁 Passed on for no reply: ${t.passedAway}` : '',
    '',
  ];
  for (const r of perf.rows.filter((x) => x.formLeads || x.clicks || x.tapped)) {
    lines.push(`👤 <b>${escapeHtml(r.name)}</b>: ${plural(r.formLeads, 'lead')} · ${plural(r.clicks, 'click')} · ${r.tapped} tapped${r.avgResponseSeconds !== null ? ` · avg ${formatWait(r.avgResponseSeconds)}` : ''}${r.waiting ? ` · ⏳ ${r.waiting} waiting` : ''}`);
  }
  const waiting = waitingLeads(leads, day);
  if (waiting.length) {
    lines.push('', `⏳ <b>Still no reply (${waiting.length})</b>`);
    for (const l of waiting.slice(0, 8)) {
      lines.push(`• ${escapeHtml(l.fullName)} · ${escapeHtml(l.landingPageTitle)} · ${escapeHtml(l.routing?.staffName || '')} · since ${ppTime(l.createdAt)}`);
    }
    if (waiting.length > 8) lines.push(`… and ${waiting.length - 8} more`);
  }
  const fastest = perf.rows.filter((r) => r.avgResponseSeconds !== null && r.tapped >= 2).sort((a, b) => a.avgResponseSeconds! - b.avgResponseSeconds!)[0];
  if (fastest) lines.push('', `⚡ Fastest reply: <b>${escapeHtml(fastest.name)}</b> (${formatWait(fastest.avgResponseSeconds!)})`);
  lines.push('', '👉 <a href="https://sale.khbevents.com/admin/round-robin/performance">Team performance</a>');
  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n').replace(/\n{3,}/g, '\n\n');
}

