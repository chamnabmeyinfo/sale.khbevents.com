/**
 * Did the visitor who clicked "Chat on Telegram" really start a chat?
 *
 * Two clues: a short reference code (#K7X2M) is put in the prefilled first message,
 * and a chat that begins shortly after a click to the same salesperson is a probable
 * match. The salesperson's own Telegram account (see telegram-account.ts) tells us
 * which chats began. Pure helpers here, client-safe.
 */
import type { ChatStats, ContactConfirmation, RoundRobinLog } from './types';

/** Letters and digits that are hard to confuse when read back. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REF_RE = /#K([A-Z2-9]{4})\b/;

/** A new reference code such as "#K7X2M". */
export function newRefCode(random: () => number = Math.random): string {
  let out = '#K';
  for (let i = 0; i < 4; i += 1) out += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length];
  return out;
}

/** The bot deep-link payload for a click: `k_7X2M` for the code #K7X2M (short, letters and digits only). */
export function botStartPayload(refCode: string): string {
  return `k_${refCode.replace(/^#K/i, '').toUpperCase()}`;
}

/** The reference code behind a bot start payload, or undefined when it is not one of ours. */
export function refCodeFromStartPayload(payload: string | undefined | null): string | undefined {
  const m = /^k_([A-Z2-9]{4})$/i.exec((payload || '').trim());
  return m ? `#K${m[1].toUpperCase()}` : undefined;
}

/** The reference code inside a message, or undefined. */
export function refCodeIn(text: string | undefined | null): string | undefined {
  const m = REF_RE.exec((text || '').toUpperCase());
  return m ? `#K${m[1]}` : undefined;
}

/**
 * The first message typed into the visitor's Telegram chat: a greeting only, in Khmer
 * for people in Cambodia or with a Khmer browser, in English otherwise (owner decision,
 * 2026-09-27: no service line and no code; customers did not like a template). The
 * chat is matched to the click by timing (30 minutes) and, since the same day, also
 * when the person was already known to the account.
 */
export function prefilledMessage(lang: 'en' | 'kh', country?: string): string {
  return lang === 'kh' || (country || '').toUpperCase() === 'KH' ? 'សួស្តី 👋' : 'Hello 👋';
}

/** Appends the code to a message the page already prefilled. */
export function withRefCode(text: string, refCode: string): string {
  return refCodeIn(text) ? text : `${text.trim()} ${refCode}`.trim();
}

/** 'kh' for a Khmer browser (Accept-Language km…), else 'en'. */
export function langFromAcceptLanguage(lang: string | undefined): 'en' | 'kh' {
  return /^km\b/i.test((lang || '').trim()) ? 'kh' : 'en';
}

/** A chat that began in the salesperson's Telegram account. */
export interface RecentContact {
  staffId: string;
  /** When the first (incoming) message arrived, ISO. */
  at: string;
  userId: string;
  username?: string;
  name?: string;
  text?: string;
  /** Set once matched to a log entry. */
  logId?: string;
}

/** Clicks within this long before the first message count as a probable match. */
export const TIME_MATCH_WINDOW_MS = 30 * 60 * 1000;

export interface ContactMatch {
  logId: string;
  contact: RecentContact;
  confirmation: ContactConfirmation;
}

/**
 * Pairs new chats with the clicks (or leads) that led to them. A reference code
 * in the message is a sure match; otherwise the latest unmatched click to the same
 * salesperson in the 30 minutes before the message is a probable one. Each log entry
 * and each chat is used at most once.
 */
export function matchContactsToLogs(
  logs: Array<Pick<RoundRobinLog, 'id' | 'timestamp' | 'staffId' | 'refCode' | 'contact' | 'routeType' | 'demo'>>,
  contacts: RecentContact[],
  nowIso: string = new Date().toISOString(),
  windowMs: number = TIME_MATCH_WINDOW_MS
): ContactMatch[] {
  const out: ContactMatch[] = [];
  const used = new Set<string>(logs.filter((l) => l.contact).map((l) => l.id));
  const open = logs.filter((l) => !l.contact && !l.demo);
  const pending = contacts.filter((c) => !c.logId);

  const take = (log: (typeof logs)[number], c: RecentContact, match: 'ref' | 'time') => {
    used.add(log.id);
    const confirmation: ContactConfirmation = { at: c.at, userId: c.userId, username: c.username, name: c.name, text: c.text, match, checkedAt: nowIso };
    out.push({ logId: log.id, contact: c, confirmation });
  };

  // 1. Reference codes.
  const byRef = new Map<string, (typeof logs)[number][]>();
  for (const l of open) if (l.refCode) byRef.set(l.refCode, [...(byRef.get(l.refCode) || []), l]);
  const rest: RecentContact[] = [];
  for (const c of pending) {
    const code = refCodeIn(c.text);
    const candidates = code ? (byRef.get(code) || []).filter((l) => !used.has(l.id)) : [];
    // The same code can exist on more than one page over time: prefer the same salesperson, then the newest.
    const pick = candidates.sort((a, b) => Number(b.staffId === c.staffId) - Number(a.staffId === c.staffId) || b.timestamp.localeCompare(a.timestamp))[0];
    if (pick) take(pick, c, 'ref');
    else rest.push(c);
  }

  // 2. Time: the latest click to the same person shortly before the message.
  for (const c of rest.sort((a, b) => a.at.localeCompare(b.at))) {
    const atMs = Date.parse(c.at);
    const pick = open
      .filter((l) => !used.has(l.id) && l.staffId === c.staffId && l.routeType === 'DIRECT_CONTACT_CLICK')
      .filter((l) => {
        const t = Date.parse(l.timestamp);
        return t <= atMs + 60_000 && atMs - t <= windowMs;
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
    if (pick) take(pick, c, 'time');
  }
  return out;
}

// ─── Conversation counts ───────────────────────────────────────────────────

export interface ChatMessagePeek {
  /** True for a message we sent. */
  out: boolean;
  atMs: number;
}

/** Counts and times from a chat's messages (newest or oldest first, any order). */
export function chatStatsFrom(messages: ChatMessagePeek[], unread?: number, nowIso: string = new Date().toISOString()): ChatStats {
  const sorted = [...messages].filter((m) => Number.isFinite(m.atMs) && m.atMs > 0).sort((a, b) => a.atMs - b.atMs);
  const stats: ChatStats = { fromCustomer: 0, fromUs: 0, updatedAt: nowIso };
  if (unread !== undefined) stats.unread = unread;
  for (const m of sorted) {
    if (m.out) {
      stats.fromUs += 1;
      if (stats.firstCustomerAt && !stats.firstReplyAt) {
        stats.firstReplyAt = new Date(m.atMs).toISOString();
        stats.firstReplySeconds = Math.max(0, Math.round((m.atMs - Date.parse(stats.firstCustomerAt)) / 1000));
      }
    } else {
      stats.fromCustomer += 1;
      if (!stats.firstCustomerAt) stats.firstCustomerAt = new Date(m.atMs).toISOString();
    }
  }
  const last = sorted[sorted.length - 1];
  if (last) {
    stats.lastAt = new Date(last.atMs).toISOString();
    stats.lastFrom = last.out ? 'us' : 'customer';
    if (!last.out) {
      // The wait for our reply starts at the customer's first message after our last one.
      let i = sorted.length - 1;
      while (i > 0 && !sorted[i - 1].out) i -= 1;
      stats.waitingSince = new Date(sorted[i].atMs).toISOString();
    }
  }
  return stats;
}

/** True when the customer wrote last and nobody has answered. */
export function awaitingOurReply(stats: ChatStats | undefined): boolean {
  return Boolean(stats && stats.lastFrom === 'customer');
}

/** A name for the CRM when the customer has not given one. */
export function telegramDisplayName(c: { name?: string; username?: string; userId: string }): string {
  return c.name?.trim() || (c.username ? `@${c.username}` : `Telegram ${c.userId}`);
}
