/**
 * Rules that keep the Telegram chat view safe for the salesperson's account.
 * Pure functions, client-safe; the Telegram layer and the browser both use them.
 */

/** How the browser polls while the chat is on screen. Milliseconds. */
export const POLL_FAST_MS = 8_000;
export const POLL_NORMAL_MS = 20_000;
export const POLL_SLOW_MS = 60_000;
/** Never faster than this, whatever the state. */
export const POLL_FLOOR_MS = 5_000;
/** Back-off steps after a network or server error. */
export const POLL_BACKOFF_MS = [10_000, 20_000, 40_000, 60_000];
/** After "busy" (another request holds the account), try again after this long. */
export const BUSY_RETRY_MS = 3_000;

/** Sends from the portal: at least this gap, at most this many per minute, per account. */
export const SEND_MIN_GAP_MS = 1_500;
export const SEND_PER_MINUTE = 20;

/** "Check now" cannot run more often than this. */
export const FORCE_CHECK_COOLDOWN_MS = 30_000;

export type TelegramErrorKind = 'flood' | 'terminal' | 'other';

export interface TelegramErrorInfo {
  kind: TelegramErrorKind;
  /** For a flood wait: how long Telegram asked us to wait. */
  seconds?: number;
  code: string;
}

/** Error names that mean the stored session is dead; reconnecting is a human decision. */
const TERMINAL = ['AUTH_KEY_UNREGISTERED', 'AUTH_KEY_INVALID', 'AUTH_KEY_DUPLICATED', 'SESSION_REVOKED', 'SESSION_EXPIRED', 'USER_DEACTIVATED', 'USER_DEACTIVATED_BAN'];

/** Flood wait, dead session, or something else, from a GramJS/RPC error. */
export function classifyTelegramError(err: unknown): TelegramErrorInfo {
  const e = (err || {}) as { errorMessage?: string; message?: string; seconds?: number; code?: number; className?: string };
  const text = String(e.errorMessage || e.message || '').toUpperCase();
  const flood = /FLOOD_WAIT_(\d+)/.exec(text) || /A WAIT OF (\d+) SECONDS IS REQUIRED/.exec(text);
  if (flood || typeof e.seconds === 'number' && /FLOOD/.test(text)) {
    const seconds = flood ? Number(flood[1]) : Number(e.seconds || 0);
    return { kind: 'flood', seconds: Number.isFinite(seconds) ? seconds : 60, code: `FLOOD_WAIT_${seconds}` };
  }
  const code = (text.match(/[A-Z][A-Z_]+/g) || []).find((w) => TERMINAL.includes(w) || w.startsWith('AUTH_KEY_') || w.startsWith('SESSION_'));
  if (code && !code.startsWith('SESSION_PASSWORD')) return { kind: 'terminal', code };
  return { kind: 'other', code: (text.match(/[A-Z][A-Z_]{4,}/) || [''])[0] || 'ERROR' };
}

/** A probe of one chat: the cheap numbers Telegram gives without the messages. */
export interface DialogProbe {
  topMessageId: number;
  unreadCount: number;
  readInboxMaxId: number;
  readOutboxMaxId: number;
}

/** Nothing new since the browser's last look: same top message and same unread count. */
export function dialogUnchanged(probe: DialogProbe, since: number | undefined, unread: number | undefined): boolean {
  return since !== undefined && probe.topMessageId === since && (unread === undefined || probe.unreadCount === unread);
}

export interface MarkReadInput {
  /** The salesperson switched "Auto seen" on. */
  autoSeen: boolean;
  /** The browser says a person is looking at the chat right now (tab visible, window focused). */
  viewing: boolean;
  unreadCount: number;
  topMessageId: number;
  /** The last message we already marked read for this lead. */
  markedMaxId: number | undefined;
}

/**
 * Mark the customer's messages as read on Telegram only when every condition holds:
 * the option is on, a human is actually looking, there is something unread, and we
 * have not already marked this message. At most one read receipt per new message.
 */
export function shouldMarkRead(i: MarkReadInput): boolean {
  return i.autoSeen && i.viewing && i.unreadCount > 0 && i.topMessageId > (i.markedMaxId ?? 0);
}

/** Human pace for replies sent from the portal. */
export function sendGuard(sendTimesIso: string[] | undefined, nowMs: number): { ok: boolean; retryInMs: number } {
  const times = (sendTimesIso || []).map((t) => Date.parse(t)).filter((t) => Number.isFinite(t) && nowMs - t < 60_000);
  const last = Math.max(0, ...times);
  if (last && nowMs - last < SEND_MIN_GAP_MS) return { ok: false, retryInMs: SEND_MIN_GAP_MS - (nowMs - last) };
  if (times.length >= SEND_PER_MINUTE) return { ok: false, retryInMs: 60_000 - (nowMs - Math.min(...times)) };
  return { ok: true, retryInMs: 0 };
}

/** The browser's next poll delay while the chat is visible. */
export function pollDelayMs(input: { nowMs: number; lastMessageAtMs?: number; typedAtMs?: number }): number {
  const sinceMessage = input.lastMessageAtMs ? input.nowMs - input.lastMessageAtMs : Infinity;
  const sinceTyped = input.typedAtMs ? input.nowMs - input.typedAtMs : Infinity;
  if (sinceMessage < 10 * 60_000 || sinceTyped < 2 * 60_000) return Math.max(POLL_FLOOR_MS, POLL_FAST_MS);
  if (sinceMessage < 60 * 60_000) return POLL_NORMAL_MS;
  return POLL_SLOW_MS;
}
