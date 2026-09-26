/**
 * Page numbers for the admin lists, computed from real data instead of the counters
 * stored on each page (those counted every page load, demo leads and test visits).
 *  - leads: real leads of the page, all time (demo, test and sample leads excluded);
 *  - visits: visitor sessions recorded by the page tracking in the window;
 *  - conversion: leads in the window ÷ visits in the window.
 * The window is the last `days` days, or since tracking began when that is later.
 */
import type { Lead } from './types';
import type { VisitRecord } from './visits';

export interface PageStat {
  leads: number;
  visits: number;
  windowLeads: number;
  /** Percent, one decimal; null without visits. */
  conversion: number | null;
}

export interface PageStats {
  bySlug: Record<string, PageStat>;
  total: PageStat;
  /** Start of the window (epoch ms): the later of now − days and the first recorded visit. */
  sinceMs: number;
  days: number;
  /** When the numbers were computed. */
  nowMs: number;
}

const DAY = 86_400_000;
const pct = (leads: number, visits: number) => (visits > 0 ? Math.round((leads / visits) * 1000) / 10 : null);

export function computePageStats(leads: Lead[], visits: VisitRecord[], nowMs: number, days = 30): PageStats {
  const windowStart = nowMs - days * DAY;
  const inWindow = visits.filter((v) => v.t0 >= windowStart);
  const firstVisit = inWindow.reduce((m, v) => Math.min(m, v.t0), Infinity);
  const sinceMs = Number.isFinite(firstVisit) ? Math.max(windowStart, firstVisit) : windowStart;

  const bySlug: Record<string, PageStat> = {};
  const stat = (slug: string) => (bySlug[slug] ||= { leads: 0, visits: 0, windowLeads: 0, conversion: null });
  // One visit per session and page (a session that spans midnight is stored twice).
  const seen = new Set<string>();
  for (const v of inWindow) {
    const key = `${v.p}\n${v.s}`;
    if (seen.has(key)) continue;
    seen.add(key);
    stat(v.p).visits++;
  }
  for (const l of leads) {
    if (!l.landingPageSlug) continue;
    const s = stat(l.landingPageSlug);
    s.leads++;
    if (Date.parse(l.createdAt) >= sinceMs) s.windowLeads++;
  }
  const total: PageStat = { leads: 0, visits: 0, windowLeads: 0, conversion: null };
  for (const s of Object.values(bySlug)) {
    s.conversion = pct(s.windowLeads, s.visits);
    total.leads += s.leads;
    total.visits += s.visits;
    total.windowLeads += s.windowLeads;
  }
  total.conversion = pct(total.windowLeads, total.visits);
  return { bySlug, total, sinceMs, days, nowMs };
}

export const EMPTY_PAGE_STAT: PageStat = { leads: 0, visits: 0, windowLeads: 0, conversion: null };
