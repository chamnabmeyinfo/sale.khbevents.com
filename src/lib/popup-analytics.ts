/**
 * Popup analytics: how each popup performs, day by day.
 *
 * Every popup event (view, click, close, lead) updates a small per-day record
 * on the popup's stats (see PopupDayStats), broken down by page, device, where
 * the visit came from, app browser, language and hour. The admin dashboard
 * sums those records over a date range. Pure functions, client-safe.
 */
import type { PopupAd, PopupAdStats, PopupAdStatsMap, PopupCounts, PopupDayStats } from './types';

export type PopupEventKind = 'view' | 'click' | 'close' | 'lead';

export interface PopupEventDetail {
  kind: PopupEventKind;
  nowMs: number;
  page?: string;
  device?: string;
  lang?: string;
  /** telegram, facebook, google… or direct. */
  source?: string;
  /** Facebook, Telegram… for app browsers, Browser otherwise. */
  app?: string;
  /** Seconds the popup was open before a click or close. */
  secondsOpen?: number;
  /** Seconds on the page before the popup appeared (views). */
  secondsOnPage?: number;
  /** Lead from a visitor who had clicked the popup. */
  clicked?: boolean;
}

/** How many days of detail are kept. */
export const KEEP_DAYS = 120;
/** At most this many different values per breakdown per day; the rest count as "other". */
const MAX_KEYS = 40;
const PP_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Phnom Penh calendar day, YYYY-MM-DD. */
export function phnomPenhDay(ms: number): string {
  return new Date(ms + PP_OFFSET_MS).toISOString().slice(0, 10);
}

export function phnomPenhHour(ms: number): number {
  return new Date(ms + PP_OFFSET_MS).getUTCHours();
}

const INDEX: Record<PopupEventKind, number> = { view: 0, click: 1, close: 2, lead: 3 };
const zero = (): PopupCounts => [0, 0, 0, 0];

function bump(map: Record<string, PopupCounts>, key: string, i: number) {
  const k = key && (key in map || Object.keys(map).length < MAX_KEYS) ? key : 'other';
  const row = map[k] || zero();
  row[i] += 1;
  map[k] = row;
}

function addTime(pair: [number, number] | undefined, seconds: number | undefined): [number, number] | undefined {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return pair;
  const s = Math.min(seconds, 3600);
  return [Math.round(((pair?.[0] || 0) + s) * 10) / 10, (pair?.[1] || 0) + 1];
}

const cleanKey = (value: string | undefined, fallback: string) => {
  const v = (value || '').trim().slice(0, 60);
  return v || fallback;
};

/** Adds one event to a popup's daily detail, and drops days older than KEEP_DAYS. */
export function applyPopupEvent(stats: PopupAdStats, e: PopupEventDetail): PopupAdStats {
  const i = INDEX[e.kind];
  const dayKey = phnomPenhDay(e.nowMs);
  const daily = stats.daily || {};
  const day: PopupDayStats = daily[dayKey] || { t: zero() };
  day.t[i] += 1;
  bump((day.h = day.h || {}), String(phnomPenhHour(e.nowMs)), i);
  bump((day.p = day.p || {}), cleanKey(e.page, 'unknown'), i);
  bump((day.d = day.d || {}), cleanKey(e.device, 'unknown'), i);
  bump((day.s = day.s || {}), cleanKey(e.source, 'direct'), i);
  bump((day.a = day.a || {}), cleanKey(e.app, 'Browser'), i);
  bump((day.g = day.g || {}), cleanKey(e.lang, 'unknown'), i);
  if (e.kind === 'click') day.ck = addTime(day.ck, e.secondsOpen);
  if (e.kind === 'close') day.cl = addTime(day.cl, e.secondsOpen);
  if (e.kind === 'view') day.sp = addTime(day.sp, e.secondsOnPage);
  if (e.kind === 'lead' && e.clicked) day.lc = (day.lc || 0) + 1;
  daily[dayKey] = day;

  const oldest = phnomPenhDay(e.nowMs - (KEEP_DAYS - 1) * DAY_MS);
  for (const key of Object.keys(daily)) if (key < oldest) delete daily[key];
  stats.daily = daily;
  return stats;
}

// ─── Summaries for the dashboard ───────────────────────────────────────────

export interface CountsRow {
  key: string;
  views: number;
  clicks: number;
  closes: number;
  leads: number;
  /** Clicks ÷ views, percent (0 when no views). */
  ctr: number;
}

export interface PopupRow extends CountsRow {
  name: string;
  enabled: boolean;
  closeRate: number;
  leadRate: number;
  avgSecondsToClick: number | null;
}

export interface DayPoint {
  day: string;
  views: number;
  clicks: number;
  closes: number;
  leads: number;
}

export interface PopupSummary {
  from: string;
  to: string;
  views: number;
  clicks: number;
  closes: number;
  leads: number;
  leadsAfterClick: number;
  ctr: number;
  closeRate: number;
  leadRate: number;
  avgSecondsToClick: number | null;
  avgSecondsToClose: number | null;
  avgSecondsOnPage: number | null;
  days: DayPoint[];
  popups: PopupRow[];
  pages: CountsRow[];
  devices: CountsRow[];
  sources: CountsRow[];
  apps: CountsRow[];
  langs: CountsRow[];
  /** 24 rows, hour "0" to "23" in Phnom Penh time. */
  hours: CountsRow[];
  /** First day with detailed data, over all popups, or null when none yet. */
  detailSince: string | null;
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);
const avg = (pair: [number, number]) => (pair[1] > 0 ? Math.round((pair[0] / pair[1]) * 10) / 10 : null);

function addCounts(target: Map<string, PopupCounts>, src: Record<string, PopupCounts> | undefined) {
  if (!src) return;
  for (const [k, c] of Object.entries(src)) {
    const row = target.get(k) || zero();
    for (let i = 0; i < 4; i += 1) row[i] += c[i] || 0;
    target.set(k, row);
  }
}

const toRows = (map: Map<string, PopupCounts>): CountsRow[] =>
  Array.from(map.entries())
    .map(([key, c]) => ({ key, views: c[0], clicks: c[1], closes: c[2], leads: c[3], ctr: pct(c[1], c[0]) }))
    .sort((a, b) => b.views - a.views || b.clicks - a.clicks || a.key.localeCompare(b.key));

/** Every day from `from` to `to` inclusive, YYYY-MM-DD. */
export function dayRange(from: string, to: string): string[] {
  const out: string[] = [];
  let t = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  while (t <= end && out.length < 400) {
    out.push(new Date(t).toISOString().slice(0, 10));
    t += DAY_MS;
  }
  return out;
}

/** The last `n` days up to today, Phnom Penh time. */
export function lastDays(n: number, nowMs: number): { from: string; to: string } {
  return { from: phnomPenhDay(nowMs - (n - 1) * DAY_MS), to: phnomPenhDay(nowMs) };
}

/** Sums the daily detail of the chosen popups (all when adId is empty) between two days. */
export function summarizePopups(
  statsMap: PopupAdStatsMap,
  ads: Pick<PopupAd, 'id' | 'name' | 'enabled'>[],
  range: { from: string; to: string; adId?: string }
): PopupSummary {
  const chosen = ads.filter((a) => !range.adId || a.id === range.adId);
  const days = dayRange(range.from, range.to);
  const dayTotals = new Map(days.map((d) => [d, zero()]));
  const maps = { p: new Map<string, PopupCounts>(), d: new Map<string, PopupCounts>(), s: new Map<string, PopupCounts>(), a: new Map<string, PopupCounts>(), g: new Map<string, PopupCounts>(), h: new Map<string, PopupCounts>() };
  const ck: [number, number] = [0, 0];
  const cl: [number, number] = [0, 0];
  const sp: [number, number] = [0, 0];
  let leadsAfterClick = 0;
  let detailSince: string | null = null;

  const popups: PopupRow[] = chosen.map((ad) => {
    const daily = statsMap[ad.id]?.daily || {};
    const total = zero();
    const adCk: [number, number] = [0, 0];
    for (const [day, s] of Object.entries(daily)) {
      if (!detailSince || day < detailSince) detailSince = day;
      if (day < range.from || day > range.to) continue;
      for (let i = 0; i < 4; i += 1) total[i] += s.t[i] || 0;
      const dt = dayTotals.get(day);
      if (dt) for (let i = 0; i < 4; i += 1) dt[i] += s.t[i] || 0;
      addCounts(maps.p, s.p);
      addCounts(maps.d, s.d);
      addCounts(maps.s, s.s);
      addCounts(maps.a, s.a);
      addCounts(maps.g, s.g);
      addCounts(maps.h, s.h);
      if (s.ck) { ck[0] += s.ck[0]; ck[1] += s.ck[1]; adCk[0] += s.ck[0]; adCk[1] += s.ck[1]; }
      if (s.cl) { cl[0] += s.cl[0]; cl[1] += s.cl[1]; }
      if (s.sp) { sp[0] += s.sp[0]; sp[1] += s.sp[1]; }
      leadsAfterClick += s.lc || 0;
    }
    return {
      key: ad.id,
      name: ad.name,
      enabled: ad.enabled,
      views: total[0],
      clicks: total[1],
      closes: total[2],
      leads: total[3],
      ctr: pct(total[1], total[0]),
      closeRate: pct(total[2], total[0]),
      leadRate: pct(total[3], total[0]),
      avgSecondsToClick: avg(adCk),
    };
  }).sort((a, b) => b.views - a.views || b.clicks - a.clicks);

  const sum = popups.reduce((acc, r) => { acc[0] += r.views; acc[1] += r.clicks; acc[2] += r.closes; acc[3] += r.leads; return acc; }, zero());
  const hourRows = toRows(maps.h);
  const hours: CountsRow[] = Array.from({ length: 24 }, (_, h) => hourRows.find((r) => r.key === String(h)) || { key: String(h), views: 0, clicks: 0, closes: 0, leads: 0, ctr: 0 });

  return {
    from: range.from,
    to: range.to,
    views: sum[0],
    clicks: sum[1],
    closes: sum[2],
    leads: sum[3],
    leadsAfterClick,
    ctr: pct(sum[1], sum[0]),
    closeRate: pct(sum[2], sum[0]),
    leadRate: pct(sum[3], sum[0]),
    avgSecondsToClick: avg(ck),
    avgSecondsToClose: avg(cl),
    avgSecondsOnPage: avg(sp),
    days: days.map((day) => { const c = dayTotals.get(day) || zero(); return { day, views: c[0], clicks: c[1], closes: c[2], leads: c[3] }; }),
    popups,
    pages: toRows(maps.p),
    devices: toRows(maps.d),
    sources: toRows(maps.s),
    apps: toRows(maps.a),
    langs: toRows(maps.g),
    hours,
    detailSince,
  };
}

// ─── Plain-language findings ───────────────────────────────────────────────

/** Fewer views than this and a comparison is not worth reading. */
export const MIN_VIEWS_TO_COMPARE = 20;

export type Insight =
  | { kind: 'notEnough'; views: number }
  | { kind: 'bestPopup'; name: string; ctr: number; views: number }
  | { kind: 'best'; dimension: 'page' | 'device' | 'source' | 'app'; key: string; ctr: number; views: number; overall: number }
  | { kind: 'bestHours'; from: number; to: number; share: number }
  | { kind: 'quickClose'; seconds: number; closeRate: number }
  | { kind: 'leads'; leads: number; afterClick: number };

/** A few findings that follow from the numbers; nothing is claimed below MIN_VIEWS_TO_COMPARE views. */
export function popupInsights(s: PopupSummary): Insight[] {
  if (s.views < MIN_VIEWS_TO_COMPARE) return [{ kind: 'notEnough', views: s.views }];
  const out: Insight[] = [];
  const enough = (r: CountsRow) => r.views >= MIN_VIEWS_TO_COMPARE;
  const top = (rows: CountsRow[]) => rows.filter(enough).sort((a, b) => b.ctr - a.ctr)[0];

  const popupsCompared = s.popups.filter(enough);
  if (popupsCompared.length >= 2) {
    const best = popupsCompared.sort((a, b) => b.ctr - a.ctr)[0];
    out.push({ kind: 'bestPopup', name: best.name, ctr: best.ctr, views: best.views });
  }
  for (const [dimension, rows] of [['page', s.pages], ['device', s.devices], ['source', s.sources], ['app', s.apps]] as const) {
    const compared = rows.filter(enough);
    if (compared.length < 2) continue;
    const best = top(compared);
    if (best && best.ctr > s.ctr) out.push({ kind: 'best', dimension, key: best.key, ctr: best.ctr, views: best.views, overall: s.ctr });
  }
  // Busiest 3-hour window by views.
  let bestStart = 0;
  let bestViews = -1;
  for (let h = 0; h < 24; h += 1) {
    const v = s.hours[h].views + s.hours[(h + 1) % 24].views + s.hours[(h + 2) % 24].views;
    if (v > bestViews) { bestViews = v; bestStart = h; }
  }
  if (bestViews > 0) out.push({ kind: 'bestHours', from: bestStart, to: (bestStart + 3) % 24, share: pct(bestViews, s.views) });
  if (s.avgSecondsToClose !== null && s.avgSecondsToClose < 3 && s.closeRate >= 50) {
    out.push({ kind: 'quickClose', seconds: s.avgSecondsToClose, closeRate: s.closeRate });
  }
  if (s.leads > 0) out.push({ kind: 'leads', leads: s.leads, afterClick: s.leadsAfterClick });
  return out;
}

/** Daily detail as CSV rows, one per popup per day, for a spreadsheet. */
export function popupDailyCsv(statsMap: PopupAdStatsMap, ads: Pick<PopupAd, 'id' | 'name'>[], from: string, to: string): string {
  const esc = (v: string | number) => {
    const s = String(v);
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = [['date', 'popup', 'views', 'clicks', 'click_rate_percent', 'closes', 'leads'].join(',')];
  for (const day of dayRange(from, to)) {
    for (const ad of ads) {
      const s = statsMap[ad.id]?.daily?.[day];
      if (!s) continue;
      lines.push([day, ad.name, s.t[0], s.t[1], pct(s.t[1], s.t[0]), s.t[2], s.t[3]].map(esc).join(','));
    }
  }
  return lines.join('\n') + '\n';
}
