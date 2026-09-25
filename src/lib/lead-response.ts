/**
 * After a form lead is assigned: the buttons under the Telegram lead card
 * (Contacted / No answer / Not interested), and the hand-over to a colleague
 * when nobody taps a button in time. Pure rules, no I/O; storage.ts and the
 * Telegram webhook do the reading, writing and sending.
 */
import type { Lead, LeadClaim, LeadClaimOutcome, LeadStatus, RoundRobinSettings, RoundRobinStaff } from './types';

/** Minutes a salesperson may take before the lead moves on. 0 = off. */
export const RESPONSE_MINUTE_CHOICES = [0, 5, 10, 15, 30, 60] as const;
/** A lead is passed on at most this many times; after that only the manager is told. */
export const MAX_HANDOVERS = 2;
/** Leads older than this are never passed on (a lead from yesterday is the manager's call). */
export const HANDOVER_WINDOW_MS = 24 * 60 * 60 * 1000;

const CODES: Record<string, LeadClaimOutcome> = { c: 'CONTACTED', n: 'NO_ANSWER', x: 'NOT_INTERESTED' };
const CODE_OF: Record<LeadClaimOutcome, string> = { CONTACTED: 'c', NO_ANSWER: 'n', NOT_INTERESTED: 'x' };

export const OUTCOME_LABEL: Record<LeadClaimOutcome, string> = {
  CONTACTED: '✅ បានទាក់ទង · Contacted',
  NO_ANSWER: '📞 មិនលើក · No answer',
  NOT_INTERESTED: '❌ មិនចាប់អារម្មណ៍ · Not interested',
};

type InlineButton = { text: string; callback_data?: string; url?: string };
export type InlineKeyboard = { inline_keyboard: InlineButton[][] };

/** Buttons under a new lead card. Telegram allows 64 bytes of callback data; lead ids are ~26. */
export function claimKeyboard(leadId: string): InlineKeyboard {
  const b = (o: LeadClaimOutcome) => ({ text: OUTCOME_LABEL[o], callback_data: `rr:${CODE_OF[o]}:${leadId}`.slice(0, 64) });
  return { inline_keyboard: [[b('CONTACTED')], [b('NO_ANSWER'), b('NOT_INTERESTED')]] };
}

/**
 * What replaces the buttons after a tap: a status line that does nothing. After
 * "No answer" the salesperson can still report a later call, so Contacted and
 * Not interested stay.
 */
export function claimedKeyboard(claim: LeadClaim, leadId: string): InlineKeyboard {
  const line = [{ text: `${OUTCOME_LABEL[claim.outcome]} · ${formatWait(claim.seconds)}`, callback_data: 'rr:done' }];
  if (claim.outcome !== 'NO_ANSWER') return { inline_keyboard: [line] };
  const b = (o: LeadClaimOutcome) => ({ text: OUTCOME_LABEL[o], callback_data: `rr:${CODE_OF[o]}:${leadId}`.slice(0, 64) });
  return { inline_keyboard: [line, [b('CONTACTED'), b('NOT_INTERESTED')]] };
}

/** Replaces the old salesperson's buttons after a hand-over. */
export function passedKeyboard(toName: string): InlineKeyboard {
  return { inline_keyboard: [[{ text: `➡️ ផ្ទេរទៅ · Passed to ${toName}`.slice(0, 60), callback_data: 'rr:done' }]] };
}

/** Reads a button tap. Null for anything that is not a claim button. */
export function parseClaimData(data: unknown): { outcome: LeadClaimOutcome; leadId: string } | null {
  if (typeof data !== 'string') return null;
  const m = data.match(/^rr:([cnx]):([A-Za-z0-9_-]{4,60})$/);
  return m ? { outcome: CODES[m[1]], leadId: m[2] } : null;
}

/** CRM status after a tap. "No answer" keeps the lead open for another try. */
export function statusAfterClaim(outcome: LeadClaimOutcome, current: LeadStatus): LeadStatus {
  if (outcome === 'CONTACTED') return current === 'NEW' ? 'CONTACTED' : current;
  if (outcome === 'NOT_INTERESTED') return 'LOST';
  return current;
}

export function formatWait(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}

export function responseMinutes(settings: Pick<RoundRobinSettings, 'responseMinutes'>): number {
  const n = Number(settings.responseMinutes);
  return Number.isFinite(n) && n > 0 ? Math.min(240, Math.round(n)) : 0;
}

/** When the current salesperson received the lead. */
export const assignedAtMs = (lead: Lead): number => Date.parse(lead.routing?.assignedAt || lead.routing?.routedAt || lead.createdAt);

/**
 * Whether a form lead has waited too long without a button tap. Only new,
 * untouched, recent leads; at most MAX_HANDOVERS times.
 */
export function leadIsOverdue(lead: Lead, settings: Pick<RoundRobinSettings, 'responseMinutes'>, nowMs: number, clockStartMs?: number): boolean {
  const minutes = responseMinutes(settings);
  const r = lead.routing;
  if (!minutes || !r || r.routeType !== 'FORM_SUBMISSION' || r.claim) return false;
  if (lead.status !== 'NEW') return false;
  if (nowMs - Date.parse(lead.createdAt) > HANDOVER_WINDOW_MS) return false;
  if ((r.handovers?.length || 0) >= MAX_HANDOVERS && r.managerAlerted) return false;
  // The clock starts at the assignment, or when the salesperson's shift opens if they got it off shift.
  return nowMs - (clockStartMs ?? assignedAtMs(lead)) >= minutes * 60 * 1000;
}

/** Everyone who already had this lead. */
export function staffWhoHadLead(lead: Lead): Set<string> {
  const ids = new Set<string>();
  if (lead.routing?.staffId) ids.add(lead.routing.staffId);
  for (const h of lead.routing?.handovers || []) { ids.add(h.fromStaffId); ids.add(h.toStaffId); }
  return ids;
}

/**
 * The colleague to pass an overdue lead to: active, reachable by the bot, and
 * not someone who already had it. `canTake` lets working hours, page teams and
 * daily limits have their say. Least-recently assigned first, so the lead goes
 * to whoever is most likely free.
 */
export function handoverCandidate(
  settings: RoundRobinSettings,
  lead: Lead,
  canTake: (s: RoundRobinStaff) => boolean = () => true
): RoundRobinStaff | null {
  if ((lead.routing?.handovers?.length || 0) >= MAX_HANDOVERS) return null;
  const had = staffWhoHadLead(lead);
  const pool = (settings.staffList || []).filter((s) => s.isActive && (s.telegramChatId || '').trim() && !had.has(s.id) && canTake(s));
  if (!pool.length) return null;
  return pool.sort((a, b) => (a.lastAssignedAt || '').localeCompare(b.lastAssignedAt || '') || (a.name || '').localeCompare(b.name || ''))[0];
}
