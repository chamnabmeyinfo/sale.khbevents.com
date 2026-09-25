/**
 * Recognising demo and test data, so the owner can clear it before going live
 * without touching real customers. Pure rules; the scan and the deletion are
 * in storage.ts, the screen is Admin → Settings & Security → Clear demo data.
 *
 * A lead counts as demo only for a clear reason:
 * - simulation: made by Round Robin → Simulation Studio ("[SIMULATION TEST]",
 *   the simulation flag, or utm_source simulation_tool);
 * - sample: one of the sample leads that ship with the code (data/db.json);
 * - test: the name or e-mail says test, demo or sample, or uses example.com.
 * The owner still sees every match and can untick any before deleting.
 */
import type { Lead } from './types';

export type DemoReason = 'simulation' | 'sample' | 'test';

export interface DemoLeadMatch {
  id: string;
  fullName: string;
  landingPageSlug: string;
  createdAt: string;
  reasons: DemoReason[];
}

const TEST_WORDS = /\b(test|tester|testing|demo|sample|dummy)\b/i;
const TEST_EMAIL = /(^|[@.])(example\.(com|org|net)|test\.com)$|^test[^@]*@/i;

export function demoReasons(lead: Lead, sampleIds: Set<string>): DemoReason[] {
  const reasons: DemoReason[] = [];
  const cf = (lead.customFields || {}) as Record<string, unknown>;
  if ((lead.message || '').includes('[SIMULATION TEST]') || cf.simulation === 'true' || cf.simulation === true || lead.utmSource === 'simulation_tool') {
    reasons.push('simulation');
  }
  if (sampleIds.has(lead.id)) reasons.push('sample');
  if (TEST_WORDS.test(lead.fullName || '') || TEST_EMAIL.test((lead.email || '').trim())) reasons.push('test');
  return reasons;
}

/** Every lead with at least one demo reason, newest first. */
export function findDemoLeads(leads: Lead[], sampleIds: Set<string>): DemoLeadMatch[] {
  return leads
    .map((l) => ({ lead: l, reasons: demoReasons(l, sampleIds) }))
    .filter((x) => x.reasons.length > 0)
    .sort((a, b) => b.lead.createdAt.localeCompare(a.lead.createdAt))
    .map(({ lead, reasons }) => ({ id: lead.id, fullName: lead.fullName, landingPageSlug: lead.landingPageSlug, createdAt: lead.createdAt, reasons }));
}

export interface DemoScan {
  leads: DemoLeadMatch[];
  /** Sample staff accounts from earlier builds (they reach nobody). */
  sampleStaff: Array<{ id: string; name: string; username: string }>;
  routingLog: { total: number; linkedToDemoLeads: number };
  stats: { pageViews: number; popupsWithStats: number; staffWithCounts: number };
}

export interface ClearDemoRequest {
  /** Leads to delete; only ids that are demo by the rules above are accepted. */
  leadIds: string[];
  removeSampleStaff: boolean;
  /** 'demo' removes log entries of deleted leads; 'all' empties the routing log. */
  routingLog: 'none' | 'demo' | 'all';
  /** Sets views, popup and click statistics and staff counters back to zero. */
  resetStats: boolean;
  /** Must be the word DELETE. */
  confirm: string;
}

export interface ClearDemoResult {
  leadsDeleted: number;
  staffRemoved: number;
  logEntriesRemoved: number;
  statsReset: boolean;
}

/** Cleans a request from the browser. Returns null when it is not confirmed. */
export function parseClearRequest(body: unknown): ClearDemoRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (b.confirm !== 'DELETE') return null;
  const ids = Array.isArray(b.leadIds) ? b.leadIds.filter((x): x is string => typeof x === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(x)) : [];
  return {
    leadIds: Array.from(new Set(ids)).slice(0, 5000),
    removeSampleStaff: b.removeSampleStaff === true,
    routingLog: b.routingLog === 'all' ? 'all' : b.routingLog === 'demo' ? 'demo' : 'none',
    resetStats: b.resetStats === true,
    confirm: 'DELETE',
  };
}
