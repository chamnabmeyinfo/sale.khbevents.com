/**
 * The salesperson's own Telegram account, connected once, gives the portal the
 * chats behind the leads: who really wrote after clicking "Chat on Telegram", the
 * reply numbers, the live conversation in the inbox, and replies typed there.
 *
 * How it works
 * - The admin enters the API ID and API hash from my.telegram.org and the phone
 *   number; Telegram sends a login code to the phone; the code (and the two-step
 *   password, if any) completes the login. The login session is stored in the
 *   `tg_account:<staffId>` row of system_settings (the same protection as the bot token).
 * - A check lists the account's recent private chats. A chat with a person we have
 *   not seen before is a new contact; its first message is matched to the click that
 *   led to it (timing and the typed greeting; old messages may carry a reference code).
 *   See contact-verify.ts.
 * - The inbox reads one chat at a time: a cheap probe of its counters, the messages
 *   only when something changed, and, with "Auto seen" on, one read receipt per new
 *   customer message while a person is looking. Replies are sent from the account
 *   only when a person types them.
 *
 * Keeping the account safe
 * - One connection per account at a time (telegram-lease.ts): two servers using the
 *   same session at once would make Telegram end it. No lease, no connection.
 * - Every connection is short: connect, a few calls, disconnect.
 * - FLOOD_WAIT stops all calls for the account until the time Telegram gave; a dead
 *   session (AUTH_KEY_*, SESSION_*) disconnects the account so a person reconnects.
 * - Replies keep a human pace: 1.5 s apart, at most 20 a minute.
 *
 * Server only. `TELEGRAM_ACCOUNT_MOCK=1` swaps Telegram for a file-backed double
 * so the flow can be tested where Telegram is unreachable.
 */
import { getLeaseStore, getMarker, getRoundRobinLogs, getRoundRobinSettings, getSettings, phnomPenhStamp, setMarker, updateRoundRobinLogs } from './storage';
import { escapeHtml, readTelegramResponse, shiftStartMs, staffOnShift } from './round-robin';
import { formatWait } from './lead-response';
import type { ChatStats, Lead, RoundRobinLog, RoundRobinStaff } from './types';
import { chatStatsFrom, matchContactsToLogs, startsWithGreeting, type ChatMessagePeek, type RecentContact } from './contact-verify';
import { createLeadFromTelegramChat, findLeadByTelegramUserId, getLeadById, getRealLeads, addLeadNote } from './storage';
import { saveLeadChanges } from './lead-followup';
import type { Api as TgApi } from 'telegram';
import { AccountBusyError, withAccountLease } from './telegram-lease';
import { classifyTelegramError, dialogUnchanged, FORCE_CHECK_COOLDOWN_MS, sendGuard, shouldMarkRead, type DialogProbe } from './telegram-chat-rules';
import { getStoredChat, pendingTranscripts, recordChatMessages, saveStoredChat, type StoredChat } from './chat-store';
import { externalTranscriber } from './transcribe';

export { AccountBusyError };

export const CHECK_EVERY_MS = 2 * 60 * 1000;
/** While the Telegram inbox is open, new chats are looked for this often instead. */
export const INBOX_CHECK_EVERY_MS = 30 * 1000;
/** Chats read per check (Telegram lists pinned chats, groups and bots in the same list, so 100 leaves room). */
const RECENT_DIALOGS = 100;
/** Messages stored the first time a chat is opened. */
const CHAT_BACKFILL = 200;
const KNOWN_USERS_KEPT = 3000;
const CONTACTS_KEPT = 300;
const PEERS_KEPT = 400;
/** How long a request waits for the account when another one is using it. */
const LEASE_WAIT_LOGIN_MS = 8_000;
const LEASE_WAIT_SEND_MS = 8_000;
const LEASE_WAIT_FORCE_CHECK_MS = 4_000;

export interface TelegramAccountRecord {
  staffId: string;
  apiId?: number;
  /** Secret. Never sent to the browser. */
  apiHash?: string;
  phone?: string;
  /** Secret: the login session (GramJS StringSession). Never sent to the browser. */
  session?: string;
  /** The account we are logged in as. */
  user?: { id: string; username?: string; name?: string };
  /** A login in progress: the code was sent, waiting for it. */
  pending?: { session: string; phoneCodeHash: string; at: string; needsPassword?: boolean };
  /** Telegram user ids of chats already seen (so old customers are not "new contacts"). */
  knownUserIds?: string[];
  contacts?: RecentContact[];
  lastCheckAt?: string;
  lastForceCheckAt?: string;
  lastError?: string;
  connectedAt?: string;
  /** Also make leads for customers who write directly, not only after a landing-page click. */
  trackAll?: boolean;
  /** Mark the customer's messages as read on Telegram while someone looks at the chat in the portal. Off unless the salesperson turns it on. */
  autoSeen?: boolean;
  /** Telegram asked us to wait (FLOOD_WAIT): no connection for this account until then. */
  floodUntil?: string;
  /** When replies were sent from the portal in the last minute, for the human-pace guard. */
  sendTimes?: string[];
  /** Access hashes of customer chats already opened, so a poll needs no dialog list. Useless without the session. */
  peers?: Record<string, string>;
  /** What the last check saw, for the settings screen (names and times, no message text). */
  lastCheckSummary?: CheckSummary;
}

export interface CheckSummary {
  at: string;
  /** Private chats read, how many had the customer speaking last, new people, known people who wrote since the last check. */
  dialogs: number;
  incoming: number;
  newPeople: number;
  knownRecent: number;
  matched: number;
  leadsMade: number;
  /** The most recent incoming chats: who, when, whether the portal already knew them. */
  newest: Array<{ name: string; username?: string; atMs: number; known: boolean; leadId?: string }>;
}

/** What the admin screen sees: no secrets. */
export interface TelegramAccountStatus {
  staffId: string;
  staffName: string;
  connected: boolean;
  pending: boolean;
  needsPassword: boolean;
  apiId?: number;
  hasApiHash: boolean;
  phoneMasked?: string;
  user?: TelegramAccountRecord['user'];
  connectedAt?: string;
  lastCheckAt?: string;
  lastError?: string;
  contactsFound: number;
  matched: number;
  trackAll: boolean;
  autoSeen: boolean;
  /** Set while Telegram has asked this account to wait. */
  floodUntil?: string;
  lastCheckSummary?: CheckSummary;
}

const rowId = (staffId: string) => `tg_account:${staffId}`;

export async function getAccountRecord(staffId: string): Promise<TelegramAccountRecord> {
  const raw = await getMarker(rowId(staffId));
  if (!raw) return { staffId };
  try {
    const parsed = JSON.parse(raw) as TelegramAccountRecord;
    return { ...parsed, staffId };
  } catch {
    return { staffId };
  }
}

async function saveAccountRecord(rec: TelegramAccountRecord): Promise<void> {
  await setMarker(rowId(rec.staffId), JSON.stringify(rec));
}

/**
 * Writes only the given fields (undefined removes one) on top of the record as it is
 * stored now, so a slow Telegram call never overwrites what another request saved.
 */
const patchQueues: Map<string, Promise<unknown>> = ((globalThis as { __khbTgPatches?: Map<string, Promise<unknown>> }).__khbTgPatches ||= new Map());

async function patchAccountRecord(staffId: string, patch: Partial<TelegramAccountRecord>): Promise<TelegramAccountRecord> {
  // Patches on this server take turns, so two of them never read the same old copy.
  const previous = patchQueues.get(staffId) || Promise.resolve();
  const run = previous.catch(() => undefined).then(async () => {
    const current = await getAccountRecord(staffId);
    const next: TelegramAccountRecord = { ...current, ...patch, staffId };
    for (const k of Object.keys(next) as Array<keyof TelegramAccountRecord>) if (next[k] === undefined) delete next[k];
    await saveAccountRecord(next);
    return next;
  });
  patchQueues.set(staffId, run);
  try {
    return await run;
  } finally {
    if (patchQueues.get(staffId) === run) patchQueues.delete(staffId);
  }
}

/** The time Telegram asked us to wait until, when it is still ahead. */
function floodActive(rec: TelegramAccountRecord, nowMs: number): string | undefined {
  return rec.floodUntil && Date.parse(rec.floodUntil) > nowMs ? rec.floodUntil : undefined;
}

export function maskPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '••••';
  return `${phone.startsWith('+') ? '+' : ''}${digits.slice(0, 3)}••••${digits.slice(-3)}`;
}

export function statusOf(rec: TelegramAccountRecord, staffName: string, nowMs = Date.now()): TelegramAccountStatus {
  const contacts = rec.contacts || [];
  return {
    staffId: rec.staffId,
    staffName,
    connected: Boolean(rec.session && rec.user),
    pending: Boolean(rec.pending),
    needsPassword: Boolean(rec.pending?.needsPassword),
    apiId: rec.apiId,
    hasApiHash: Boolean(rec.apiHash),
    phoneMasked: maskPhone(rec.phone),
    user: rec.user,
    connectedAt: rec.connectedAt,
    lastCheckAt: rec.lastCheckAt,
    lastError: rec.lastError,
    contactsFound: contacts.length,
    // Chats matched to a click (leads from "Track every new chat" carry a direct: id and are not clicks).
    matched: contacts.filter((c) => c.logId && !c.logId.startsWith('direct:')).length,
    trackAll: Boolean(rec.trackAll),
    autoSeen: Boolean(rec.autoSeen),
    floodUntil: floodActive(rec, nowMs),
    lastCheckSummary: rec.lastCheckSummary,
  };
}

/** Per-account options the admin can change without reconnecting. Only the keys given change. */
export async function updateAccountOptions(staffId: string, options: { trackAll?: boolean; autoSeen?: boolean }): Promise<TelegramAccountStatus> {
  const patch: Partial<TelegramAccountRecord> = {};
  if (options.trackAll !== undefined) patch.trackAll = Boolean(options.trackAll);
  if (options.autoSeen !== undefined) patch.autoSeen = Boolean(options.autoSeen);
  const rec = Object.keys(patch).length ? await patchAccountRecord(staffId, patch) : await getAccountRecord(staffId);
  return statusOf(rec, '');
}

/** Status for every salesperson in the Round Robin team. */
export async function listAccountStatuses(): Promise<TelegramAccountStatus[]> {
  const rr = await getRoundRobinSettings();
  return Promise.all(rr.staffList.map(async (s) => statusOf(await getAccountRecord(s.id), s.name)));
}

/** True when at least one salesperson's account is connected (then each click gets a reference code, kept on its log). */
export async function contactCheckEnabled(): Promise<boolean> {
  const rr = await getRoundRobinSettings();
  for (const s of rr.staffList) {
    const rec = await getAccountRecord(s.id);
    if (rec.session && rec.user) return true;
  }
  return false;
}

// ─── The Telegram client, real or double ───────────────────────────────────

/** One private chat as the check sees it. */
export interface DialogPeek {
  userId: string;
  username?: string;
  name?: string;
  isBot: boolean;
  isSelf: boolean;
  /** Latest message: incoming or ours, when (ms), text. */
  lastIncoming: boolean;
  lastAtMs: number;
  lastText: string;
  /** Unread messages from this person. */
  unread?: number;
}

/** A customer chat the client can talk to: the user id and the access hash Telegram wants with it. */
export interface PeerRef {
  userId: string;
  accessHash?: string;
  /** The library's own input peer. */
  input: unknown;
}

export interface AccountClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  saveSession(): string;
  sendCode(phone: string): Promise<{ phoneCodeHash: string }>;
  /** Throws NeedsPasswordError when the account has two-step verification. */
  signIn(phone: string, phoneCodeHash: string, code: string): Promise<void>;
  checkPassword(password: string): Promise<void>;
  getMe(): Promise<{ id: string; username?: string; name?: string }>;
  recentDialogs(limit: number): Promise<DialogPeek[]>;
  /** The latest messages of one private chat (after recentDialogs), newest first. */
  history(userId: string, limit: number): Promise<ChatMessage[]>;
  /** Telegram's own transcription of a voice message; null when Telegram has none (yet) or the account may not use it. */
  transcribe(peer: PeerRef, messageId: number): Promise<string | null>;
  /** The voice file itself, for an outside transcriber. Null when it cannot be fetched. */
  downloadVoice(peer: PeerRef, messageId: number): Promise<{ data: Buffer; mimeType: string } | null>;
  /**
   * Finds one customer's chat: among the dialogs already listed, from a stored access
   * hash (no list needed), further down the dialog list, or by @username. Null when
   * the account has no such chat.
   */
  resolvePeer(userId: string, username: string | undefined, accessHash?: string): Promise<PeerRef | null>;
  /** Drops what the client remembers about that chat (a stored access hash Telegram refused). */
  forgetPeer(userId: string): void;
  /** The chat's counters without its messages: one cheap call. Null when the chat has no dialog yet. */
  probe(peer: PeerRef): Promise<DialogProbe | null>;
  /** Tells Telegram the customer's messages up to maxId were read (the customer sees "seen"). */
  markRead(peer: PeerRef, maxId: number): Promise<void>;
  /** The latest messages with their text, newest first. */
  messages(peer: PeerRef, limit: number): Promise<ChatMessage[]>;
  /** Sends a text message to that customer from the connected account. */
  sendTo(peer: PeerRef, text: string): Promise<void>;
  logOut(): Promise<void>;
}

/** One message as the chat view shows it. */
export interface ChatMessage {
  id: number;
  out: boolean;
  atMs: number;
  text: string;
  /** Attachment kind, when the message is not plain text. */
  media?: 'photo' | 'video' | 'voice' | 'audio' | 'sticker' | 'file' | 'other';
  /** Seconds, for voice and audio. */
  duration?: number;
  /** What a voice message said, once turned into text (from the stored chat). */
  transcript?: string;
  tstatus?: 'pending' | 'done' | 'failed';
}

export class NeedsPasswordError extends Error {
  constructor() {
    super('SESSION_PASSWORD_NEEDED');
    this.name = 'NeedsPasswordError';
  }
}

/** The salesperson's account has no chat with this customer (never written, or deleted). Not an account problem. */
export class ChatNotFoundError extends Error {
  constructor() {
    super('Chat not found on this account');
    this.name = 'ChatNotFoundError';
  }
}

/** A reply was asked for faster than a person types: wait this long. */
export class SendPaceError extends Error {
  retryInMs: number;
  constructor(retryInMs: number) {
    super(`Please wait ${Math.max(1, Math.ceil(retryInMs / 1000))} s before sending again`);
    this.name = 'SendPaceError';
    this.retryInMs = retryInMs;
  }
}

/** Telegram asked this account to wait; nothing is sent or read until then. */
export class FloodBlockedError extends Error {
  floodUntil: string;
  retryInMs: number;
  constructor(floodUntil: string, nowMs = Date.now()) {
    super(`Telegram asked this account to wait until ${phnomPenhStamp(Date.parse(floodUntil))}`);
    this.name = 'FloodBlockedError';
    this.floodUntil = floodUntil;
    this.retryInMs = Math.max(1000, Date.parse(floodUntil) - nowMs);
  }
}

async function realClient(apiId: number, apiHash: string, session: string): Promise<AccountClient> {
  // Everything comes from the package's main export: a sub-path import ('telegram/sessions')
  // can load a second copy of the library, whose classes fail the client's own checks
  // ("Only StringSession and StoreSessions are supported").
  const tg = await import('telegram');
  const { TelegramClient, Api, sessions, password, helpers } = tg;
  const computeCheck = password.computeCheck;
  // No automatic waiting on a flood: floodSleepThreshold 0 makes the library throw it at
  // once, and the account is blocked for as long as Telegram asked (see noteTelegramError).
  // requestRetries stays at 3: a login to a phone on another Telegram data centre is
  // answered "go to DC n" and needs a second attempt there (PHONE_MIGRATE). With 1, the
  // library gave up with "Request was unsuccessful 1 time(s)". Flood waits never retry.
  const client = new TelegramClient(new sessions.StringSession(session), apiId, apiHash, { connectionRetries: 2, requestRetries: 3, floodSleepThreshold: 0, useWSS: false });
  client.setLogLevel('none' as Parameters<typeof client.setLogLevel>[0]);
  const fullName = (u: { firstName?: string; lastName?: string }) => [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || undefined;
  type InputPeer = NonNullable<Parameters<typeof client.getMessages>[0]>;
  const peers = new Map<string, unknown>();
  const refOf = (userId: string, input: unknown): PeerRef => {
    const ip = input as { className?: string; accessHash?: { toString(): string } | null };
    return { userId, accessHash: ip?.className === 'InputPeerUser' && ip.accessHash ? ip.accessHash.toString() : undefined, input };
  };
  type RawMedia = { className?: string; document?: { mimeType?: string; attributes?: Array<{ className?: string; voice?: boolean; duration?: number }> } } | undefined;
  const kind = (m: { media?: unknown }): ChatMessage['media'] => {
    const media = m.media as RawMedia;
    if (!media) return undefined;
    if (media.className === 'MessageMediaPhoto') return 'photo';
    if (media.className === 'MessageMediaDocument') {
      const mime = media.document?.mimeType || '';
      const attrs = media.document?.attributes || [];
      if (attrs.some((a) => a.className === 'DocumentAttributeSticker')) return 'sticker';
      const audio = attrs.find((a) => a.className === 'DocumentAttributeAudio');
      if (audio) return audio.voice || mime.startsWith('audio/ogg') ? 'voice' : 'audio';
      if (mime.startsWith('video/')) return 'video';
      return 'file';
    }
    return 'other';
  };
  const durationOf = (m: { media?: unknown }): number | undefined => {
    const audio = ((m.media as RawMedia)?.document?.attributes || []).find((a) => a.className === 'DocumentAttributeAudio');
    return audio && typeof audio.duration === 'number' ? Math.round(audio.duration) : undefined;
  };
  const toMessage = (m: { id: number; out?: boolean; date: number; message?: string; media?: unknown }): ChatMessage => {
    const out: ChatMessage = { id: Number(m.id), out: Boolean(m.out), atMs: Number(m.date) * 1000, text: m.message || '', media: kind(m) };
    const duration = durationOf(m);
    if (duration !== undefined) out.duration = duration;
    return out;
  };
  return {
    connect: () => client.connect().then(() => undefined),
    disconnect: () => client.disconnect().catch(() => undefined),
    saveSession: () => String(client.session.save()),
    sendCode: async (phone) => {
      const r = await client.sendCode({ apiId, apiHash }, phone);
      return { phoneCodeHash: r.phoneCodeHash };
    },
    signIn: async (phone, phoneCodeHash, code) => {
      try {
        await client.invoke(new Api.auth.SignIn({ phoneNumber: phone, phoneCodeHash, phoneCode: code }));
      } catch (err) {
        const msg = (err as { errorMessage?: string; message?: string }).errorMessage || (err as Error).message || '';
        if (msg.includes('SESSION_PASSWORD_NEEDED')) throw new NeedsPasswordError();
        throw err;
      }
    },
    checkPassword: async (password) => {
      const pw = await client.invoke(new Api.account.GetPassword());
      await client.invoke(new Api.auth.CheckPassword({ password: await computeCheck(pw, password) }));
    },
    getMe: async () => {
      const me = (await client.getMe()) as { id: { toString(): string }; username?: string; firstName?: string; lastName?: string };
      return { id: me.id.toString(), username: me.username || undefined, name: fullName(me) };
    },
    recentDialogs: async (limit) => {
      const dialogs = await client.getDialogs({ limit });
      const out: DialogPeek[] = [];
      for (const d of dialogs) {
        if (!d.isUser || !d.entity || !(d.entity instanceof Api.User)) continue;
        const u = d.entity;
        if (u.deleted) continue;
        const m = d.message;
        peers.set(u.id.toString(), d.inputEntity);
        out.push({
          userId: u.id.toString(),
          username: u.username || undefined,
          name: fullName(u),
          isBot: Boolean(u.bot),
          isSelf: Boolean(u.self),
          lastIncoming: Boolean(m) && !m!.out,
          lastAtMs: m ? Number(m.date) * 1000 : 0,
          lastText: m?.message || '',
          unread: d.unreadCount,
        });
      }
      return out;
    },
    history: async (userId, limit) => {
      const peer = peers.get(userId);
      if (!peer) return [];
      const msgs = await client.getMessages(peer as InputPeer, { limit });
      return msgs.map(toMessage);
    },
    transcribe: async (peer, messageId) => {
      try {
        const r = await client.invoke(new Api.messages.TranscribeAudio({ peer: peer.input as TgApi.TypeInputPeer, msgId: messageId }));
        if (r.pending || !r.text) return null;
        return String(r.text).slice(0, 4000);
      } catch (err) {
        // A flood wait or a dead session matters everywhere; anything else means Telegram will not
        // transcribe for this account (no Premium, trial used up) and the outside transcriber takes over.
        if (classifyTelegramError(err).kind !== 'other') throw err;
        return null;
      }
    },
    downloadVoice: async (peer, messageId) => {
      const [msg] = await client.getMessages(peer.input as InputPeer, { ids: [messageId] } as Parameters<typeof client.getMessages>[1]);
      if (!msg || !msg.media) return null;
      const media = msg.media as RawMedia;
      const mimeType = media?.document?.mimeType || 'audio/ogg';
      const data = await client.downloadMedia(msg, {});
      if (!data || !(data instanceof Buffer) || !data.length) return null;
      return { data, mimeType };
    },
    resolvePeer: async (userId, username, accessHash) => {
      const cached = peers.get(userId);
      if (cached) return refOf(userId, cached);
      if (accessHash && /^-?\d+$/.test(accessHash) && /^\d+$/.test(userId)) {
        // The hash saved when this chat was first opened: no dialog list needed.
        const input = new Api.InputPeerUser({ userId: helpers.returnBigInt(userId), accessHash: helpers.returnBigInt(accessHash) });
        peers.set(userId, input);
        return refOf(userId, input);
      }
      // Not opened before: look down the chat list, then by @username.
      try {
        for await (const d of client.iterDialogs({ limit: 300 })) {
          if (d.isUser && d.entity && d.entity instanceof Api.User) peers.set(d.entity.id.toString(), d.inputEntity);
          if (peers.has(userId)) break;
        }
      } catch {}
      let input = peers.get(userId);
      if (!input && username) input = await client.getInputEntity(username).catch(() => undefined);
      if (!input) return null;
      peers.set(userId, input);
      return refOf(userId, input);
    },
    forgetPeer: (userId) => { peers.delete(userId); },
    probe: async (peer) => {
      const res = await client.invoke(new Api.messages.GetPeerDialogs({ peers: [new Api.InputDialogPeer({ peer: peer.input as TgApi.TypeInputPeer })] }));
      const d = res.dialogs[0];
      if (!d || !(d instanceof Api.Dialog)) return null;
      return { topMessageId: Number(d.topMessage) || 0, unreadCount: Number(d.unreadCount) || 0, readInboxMaxId: Number(d.readInboxMaxId) || 0, readOutboxMaxId: Number(d.readOutboxMaxId) || 0 };
    },
    markRead: async (peer, maxId) => {
      await client.invoke(new Api.messages.ReadHistory({ peer: peer.input as TgApi.TypeInputPeer, maxId }));
    },
    messages: async (peer, limit) => {
      const msgs = await client.getMessages(peer.input as InputPeer, { limit });
      return msgs.map(toMessage);
    },
    sendTo: async (peer, text) => {
      await client.sendMessage(peer.input as InputPeer, { message: text });
    },
    logOut: async () => {
      await client.invoke(new Api.auth.LogOut());
    },
  };
}

/**
 * Test double: the "account" lives in a JSON file (TELEGRAM_ACCOUNT_MOCK_FILE) that a
 * test writes chats into. Code 12345 logs in; 22222 asks for the password "secret".
 * `failWith` in the file makes every connection throw that error text (FLOOD_WAIT_30,
 * AUTH_KEY_UNREGISTERED…); `calls` records what the portal asked for.
 */
async function mockClient(session: string): Promise<AccountClient> {
  const fs = await import('node:fs/promises');
  const file = process.env.TELEGRAM_ACCOUNT_MOCK_FILE || '';
  type MockHistory = Array<ChatMessagePeek & { text?: string; media?: ChatMessage['media']; duration?: number }>;
  interface MockFile {
    me?: { id: string; username?: string; name?: string };
    dialogs?: DialogPeek[];
    /** Newest first. */
    history?: Record<string, MockHistory>;
    readInbox?: Record<string, number>;
    failWith?: string;
    calls?: string[];
    /** Telegram's transcription per "userId:messageId". */
    transcripts?: Record<string, string>;
  }
  const read = async (): Promise<MockFile> => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      return {};
    }
  };
  const write = (data: MockFile) => fs.writeFile(file, JSON.stringify(data));
  const note = async (data: MockFile, call: string) => { data.calls = [...(data.calls || []), call].slice(-200); };
  // Ids count up from the oldest message, like Telegram's.
  const chronological = (list: MockHistory): ChatMessage[] => list.map((m, i) => ({ id: list.length - i, out: m.out, atMs: m.atMs, text: m.text || '', media: m.media, ...(m.duration ? { duration: m.duration } : {}) }));
  const fail = (data: MockFile) => {
    if (data.failWith) {
      const m = /FLOOD_WAIT_(\d+)/.exec(data.failWith);
      throw Object.assign(new Error(data.failWith), { errorMessage: data.failWith, seconds: m ? Number(m[1]) : undefined });
    }
  };
  let state = session || 'fresh';
  return {
    connect: async () => { const data = await read(); await note(data, 'connect'); await write(data); fail(data); },
    disconnect: async () => undefined,
    saveSession: () => state,
    sendCode: async () => ({ phoneCodeHash: 'mock-hash' }),
    signIn: async (_phone, hash, code) => {
      if (hash !== 'mock-hash') throw new Error('PHONE_CODE_EXPIRED');
      if (code === '22222') throw new NeedsPasswordError();
      if (code !== '12345') throw new Error('PHONE_CODE_INVALID');
      state = 'mock-session';
    },
    checkPassword: async (password) => {
      if (password !== 'secret') throw new Error('PASSWORD_HASH_INVALID');
      state = 'mock-session';
    },
    getMe: async () => (await read()).me || { id: '1', username: 'mockowner', name: 'Mock Owner' },
    recentDialogs: async () => { const data = await read(); await note(data, 'getDialogs'); await write(data); return data.dialogs || []; },
    history: async (userId, limit) => chronological((await read()).history?.[userId] || []).slice(0, limit),
    transcribe: async (peer, messageId) => {
      const data = await read();
      await note(data, `transcribe:${peer.userId}:${messageId}`);
      await write(data);
      return data.transcripts?.[`${peer.userId}:${messageId}`] ?? null;
    },
    downloadVoice: async () => null,
    resolvePeer: async (userId) => {
      const data = await read();
      const known = (data.dialogs || []).some((d) => d.userId === userId) || Boolean(data.history?.[userId]);
      return known ? { userId, accessHash: `hash-${userId}`, input: userId } : null;
    },
    forgetPeer: () => undefined,
    probe: async (peer) => {
      const data = await read();
      await note(data, `probe:${peer.userId}`);
      await write(data);
      const h = data.history?.[peer.userId] || [];
      const d = (data.dialogs || []).find((x) => x.userId === peer.userId);
      if (!d && !h.length) return null;
      return { topMessageId: h.length, unreadCount: d?.unread ?? 0, readInboxMaxId: data.readInbox?.[peer.userId] ?? 0, readOutboxMaxId: 0 };
    },
    markRead: async (peer, maxId) => {
      const data = await read();
      const d = (data.dialogs || []).find((x) => x.userId === peer.userId);
      if (d) d.unread = 0;
      data.readInbox = { ...(data.readInbox || {}), [peer.userId]: maxId };
      await note(data, `readHistory:${peer.userId}:${maxId}`);
      await write(data);
    },
    messages: async (peer, limit) => {
      const data = await read();
      await note(data, `getHistory:${peer.userId}`);
      await write(data);
      return chronological(data.history?.[peer.userId] || []).slice(0, limit);
    },
    sendTo: async (peer, text) => {
      const data = await read();
      const history = data.history || {};
      history[peer.userId] = [{ out: true, atMs: Date.now(), text }, ...(history[peer.userId] || [])];
      const d = (data.dialogs || []).find((x) => x.userId === peer.userId);
      if (d) { d.lastIncoming = false; d.lastAtMs = Date.now(); d.lastText = text; d.unread = 0; }
      await note(data, `sendMessage:${peer.userId}`);
      await write({ ...data, history });
    },
    logOut: async () => undefined,
  };
}

/** Closes the client's connection when the lease's time limit aborts the work (see telegram-lease.ts). */
function closeOnAbort(signal: AbortSignal | undefined, client: AccountClient): void {
  if (!signal) return;
  if (signal.aborted) void client.disconnect();
  else signal.addEventListener('abort', () => { void client.disconnect(); }, { once: true });
}

async function clientFor(rec: TelegramAccountRecord, session: string): Promise<AccountClient> {
  if (process.env.TELEGRAM_ACCOUNT_MOCK === '1') return mockClient(session);
  if (!rec.apiId || !rec.apiHash) throw new Error('API ID and API hash are missing');
  return realClient(rec.apiId, rec.apiHash, session);
}

/** Telegram's refusal of a login step, in words the admin can act on. */
export function loginErrorHelp(raw: string): string {
  const t = raw.toUpperCase();
  const flood = /FLOOD_WAIT_(\d+)|A WAIT OF (\d+) SECONDS/.exec(t);
  if (flood) {
    const sec = Number(flood[1] || flood[2]);
    return `Telegram asked to wait ${sec >= 3600 ? `${Math.ceil(sec / 3600)} h` : `${Math.ceil(sec / 60)} min`} before sending another code to this number (too many code requests). Try again after that.`;
  }
  if (t.includes('PHONE_NUMBER_INVALID')) return 'Telegram does not know this phone number. Type it with the country code, e.g. +855 12 345 678, exactly as in that person\'s Telegram (Settings → My number).';
  if (t.includes('PHONE_NUMBER_BANNED')) return 'Telegram has banned this phone number. It cannot be connected.';
  if (t.includes('PHONE_NUMBER_FLOOD') || t.includes('PHONE_PASSWORD_FLOOD')) return 'Too many login codes were asked for this number recently. Wait about 24 hours and try again.';
  if (t.includes('API_ID_INVALID') || t.includes('API_ID_PUBLISHED_FLOOD')) return 'Telegram rejected the App api_id / api_hash pair. Copy both again from my.telegram.org → API development tools (same app, no spaces). A brand-new app can take a few minutes to work.';
  if (t.includes('PHONE_CODE_INVALID')) return 'The login code is wrong. Type the code from the Telegram app again.';
  if (t.includes('PHONE_CODE_EXPIRED')) return 'The login code expired. Press Send login code again.';
  if (t.includes('PASSWORD_HASH_INVALID')) return 'The two-step password is wrong.';
  if (t.includes('AUTH_RESTART')) return 'Telegram asked to start the login again. Press Send login code again.';
  if (t.includes('REQUEST WAS UNSUCCESSFUL')) return 'Telegram did not answer in time (network or data-centre switch). Wait a minute and press Send login code once more.';
  return raw;
}

const errText = (err: unknown): string => {
  const e = err as { errorMessage?: string; message?: string };
  return (e?.errorMessage || e?.message || String(err)).slice(0, 200);
};

/**
 * After a failed Telegram call. A flood wait blocks the account for as long as
 * Telegram asked (plus a margin); a dead session disconnects the account, so a
 * person connects it again; anything else is noted on the account.
 */
async function noteTelegramError(staffId: string, err: unknown, nowMs = Date.now()): Promise<{ kind: 'flood' | 'terminal' | 'other'; message: string; floodUntil?: string }> {
  const info = classifyTelegramError(err);
  const message = errText(err);
  if (info.kind === 'flood') {
    const seconds = Math.max(1, info.seconds || 60);
    const floodUntil = new Date(nowMs + (seconds + 2) * 1000).toISOString();
    await patchAccountRecord(staffId, { floodUntil, lastError: `Telegram asked to wait ${seconds} s (until ${phnomPenhStamp(Date.parse(floodUntil))})` }).catch(() => undefined);
    return { kind: 'flood', message, floodUntil };
  }
  if (info.kind === 'terminal') {
    const before = await getAccountRecord(staffId).catch(() => null);
    await patchAccountRecord(staffId, { session: undefined, user: undefined, pending: undefined, peers: undefined, lastError: `Telegram ended the session (${info.code}). Connect the account again.` }).catch(() => undefined);
    // Tracking must never stop silently: tell the manager (and the salesperson) once, when the session goes.
    if (before?.session) await alertAccountDisconnected(staffId, info.code).catch(() => undefined);
    return { kind: 'terminal', message };
  }
  await patchAccountRecord(staffId, { lastError: message }).catch(() => undefined);
  return { kind: 'other', message };
}

/** Telegram refused the peer we built from a stored access hash: forget it and look the chat up again. */
const STALE_PEER = /PEER_ID_INVALID|USER_ID_INVALID|INPUT_USER_DEACTIVATED|CHAT_ID_INVALID/;
const EMPTY_PROBE: DialogProbe = { topMessageId: 0, unreadCount: 0, readInboxMaxId: 0, readOutboxMaxId: 0 };

/**
 * Finds the customer's chat and probes its counters on the open connection. A stored
 * access hash saves the dialog list; when Telegram rejects it, the hash is dropped and
 * the chat looked up the long way once. Null when the account has no such chat.
 */
async function locateChat(client: AccountClient, rec: TelegramAccountRecord, userId: string, username: string | undefined): Promise<{ peer: PeerRef; probe: DialogProbe; peers?: Record<string, string> } | null> {
  const stored = rec.peers?.[userId];
  let peer = await client.resolvePeer(userId, username, stored);
  if (!peer) return null;
  let probe: DialogProbe | null;
  try {
    probe = await client.probe(peer);
  } catch (err) {
    if (!stored || !STALE_PEER.test(errText(err))) throw err;
    client.forgetPeer(userId);
    peer = await client.resolvePeer(userId, username);
    if (!peer) return null;
    probe = await client.probe(peer);
  }
  return { peer, probe: probe || { ...EMPTY_PROBE }, peers: peersWith(rec, peer) };
}

/** One bot message to the manager and the salesperson when Telegram ends a connected account's session. */
async function alertAccountDisconnected(staffId: string, code: string): Promise<void> {
  const [rr, settings] = await Promise.all([getRoundRobinSettings(), getSettings()]);
  const token = settings.telegramBotToken;
  if (!token) return;
  const staff = rr.staffList.find((s) => s.id === staffId);
  const name = staff?.name || staffId;
  const settingsLink = 'https://sale.khbevents.com/admin/settings#tgaccount';
  const send = (chatId: string, text: string) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    }).then(readTelegramResponse).catch(() => undefined);
  const manager = (rr.managerChatId || rr.fallbackChatId || settings.telegramChatId || '').trim();
  const tasks: Promise<unknown>[] = [];
  if (manager) {
    tasks.push(send(manager, [
      `⚠️ <b>Telegram account disconnected</b>: ${escapeHtml(name)}`,
      `Telegram ended the portal's session (${escapeHtml(code)}), for example because the "khbportal" device was removed in Telegram.`,
      'Until it is connected again, this person\'s new chats are not tracked, not matched to clicks and cannot be answered from the portal.',
      `👉 Settings → Telegram account check: ${settingsLink}`,
    ].join('\n')));
  }
  if (staff?.telegramChatId && String(staff.telegramChatId).trim() !== manager) {
    tasks.push(send(staff.telegramChatId, [
      '⚠️ <b>គណនី Telegram របស់អ្នកត្រូវបានផ្តាច់ពីប្រព័ន្ធ</b>',
      `Telegram បានបញ្ចប់វគ្គ (${escapeHtml(code)})។ ការជជែកថ្មីរបស់អ្នកមិនត្រូវបានតាមដានទេ រហូតដល់ភ្ជាប់ម្តងទៀត។`,
      '👉 សូមប្រាប់អ្នកគ្រប់គ្រងដើម្បីភ្ជាប់ម្តងទៀត (ការកំណត់ → ពិនិត្យគណនី Telegram)។',
    ].join('\n')));
  }
  await Promise.allSettled(tasks);
}

/** The saved access hashes plus this chat's, capped. Undefined when nothing changes. */
function peersWith(rec: TelegramAccountRecord, peer: PeerRef): Record<string, string> | undefined {
  if (!peer.accessHash || rec.peers?.[peer.userId] === peer.accessHash) return undefined;
  const entries = Object.entries(rec.peers || {}).filter(([k]) => k !== peer.userId).slice(-(PEERS_KEPT - 1));
  return Object.fromEntries([...entries, [peer.userId, peer.accessHash]]);
}

// ─── Login ─────────────────────────────────────────────────────────────────

export interface LoginInput {
  apiId: number;
  apiHash: string;
  phone: string;
}

/** Step 1: Telegram sends a code to the phone. */
export async function startLogin(staffId: string, input: LoginInput): Promise<TelegramAccountStatus> {
  const phone = input.phone.replace(/[^\d+]/g, '');
  if (!/^\+?\d{8,15}$/.test(phone)) throw new Error('Enter the phone number with the country code, for example +855 12 345 678');
  if (!Number.isInteger(input.apiId) || input.apiId <= 0) throw new Error('The API ID is a number from my.telegram.org');
  return withAccountLease(staffId, async (signal) => {
    // Read inside the lease: the copy is current when it is written back.
    const rec = await getAccountRecord(staffId);
    // An empty hash keeps the one saved earlier (it is never sent back to the browser).
    const apiHash = input.apiHash.trim() || rec.apiHash || '';
    if (!/^[a-f0-9]{32}$/i.test(apiHash)) throw new Error('The API hash is 32 letters and digits from my.telegram.org');
    const next: TelegramAccountRecord = { ...rec, apiId: input.apiId, apiHash, phone, pending: undefined, lastError: undefined };
    const client = await clientFor(next, '');
    closeOnAbort(signal, client);
    try {
      await client.connect();
      const { phoneCodeHash } = await client.sendCode(phone);
      next.pending = { session: client.saveSession(), phoneCodeHash, at: new Date().toISOString() };
    } catch (err) {
      const raw = errText(err);
      // Telegram's reason, for the server log (no secrets: the code name only).
      console.error(`Telegram sendCode refused for ${staffId}: ${raw}`);
      next.lastError = loginErrorHelp(raw);
      await saveAccountRecord(next);
      throw new Error(`Telegram did not send the code: ${next.lastError}${next.lastError !== raw ? ` (${raw.slice(0, 60)})` : ''}`);
    } finally {
      await client.disconnect();
    }
    await saveAccountRecord(next);
    return statusOf(next, '');
  }, { waitMs: LEASE_WAIT_LOGIN_MS, store: getLeaseStore() });
}

/** Step 2: the code from the phone (and the two-step password when the account has one). */
export async function finishLogin(staffId: string, code: string, password?: string): Promise<TelegramAccountStatus> {
  return withAccountLease(staffId, async (signal) => {
    const rec = await getAccountRecord(staffId);
    if (!rec.pending || !rec.phone) throw new Error('Ask for a code first');
    if (Date.now() - Date.parse(rec.pending.at) > 15 * 60 * 1000) {
      await patchAccountRecord(staffId, { pending: undefined });
      throw new Error('The code has expired. Ask for a new one.');
    }
    const client = await clientFor(rec, rec.pending!.session);
    closeOnAbort(signal, client);
    try {
      await client.connect();
      if (!rec.pending!.needsPassword) {
        try {
          await client.signIn(rec.phone!, rec.pending!.phoneCodeHash, code.replace(/\D/g, ''));
        } catch (err) {
          if (err instanceof NeedsPasswordError) {
            rec.pending = { ...rec.pending!, session: client.saveSession(), needsPassword: true };
            if (!password) {
              await saveAccountRecord(rec);
              return statusOf(rec, '');
            }
          } else {
            throw err;
          }
        }
      }
      if (rec.pending!.needsPassword) {
        if (!password) return statusOf(rec, '');
        await client.checkPassword(password);
      }
      const me = await client.getMe();
      // Everyone already in the chat list is an existing customer, not a new contact.
      const known = (await client.recentDialogs(200)).map((d) => d.userId);
      const now = new Date().toISOString();
      const next: TelegramAccountRecord = {
        ...rec,
        session: client.saveSession(),
        user: me,
        pending: undefined,
        knownUserIds: Array.from(new Set([...(rec.knownUserIds || []), ...known])).slice(-KNOWN_USERS_KEPT),
        connectedAt: now,
        lastCheckAt: now,
        lastError: undefined,
        floodUntil: undefined,
        sendTimes: undefined,
        peers: undefined,
      };
      await saveAccountRecord(next);
      return statusOf(next, '');
    } catch (err) {
      const raw = errText(err);
      console.error(`Telegram login refused for ${staffId}: ${raw}`);
      rec.lastError = loginErrorHelp(raw);
      await saveAccountRecord(rec);
      throw new Error(`Login failed: ${rec.lastError}`);
    } finally {
      await client.disconnect();
    }
  }, { waitMs: LEASE_WAIT_LOGIN_MS, store: getLeaseStore() });
}

/** Logs the portal out of the account and forgets the session. The chats already matched stay. */
export async function disconnectAccount(staffId: string): Promise<TelegramAccountStatus> {
  const rec = await getAccountRecord(staffId);
  if (rec.session) {
    await withAccountLease(staffId, async (signal) => {
      try {
        const client = await clientFor(rec, rec.session!);
        closeOnAbort(signal, client);
        await client.connect();
        await client.logOut().catch(() => undefined);
        await client.disconnect();
      } catch {
        // Already gone: forgetting the session is what matters.
      }
    }, { waitMs: LEASE_WAIT_LOGIN_MS, store: getLeaseStore() }).catch(() => undefined);
  }
  const next = await patchAccountRecord(staffId, { session: undefined, user: undefined, pending: undefined, lastError: undefined, floodUntil: undefined, sendTimes: undefined, peers: undefined });
  return statusOf(next, '');
}

// ─── Diagnosis ─────────────────────────────────────────────────────────────

export interface AccountDiagnosis {
  connected: boolean;
  /** The per-account lock: could this server take and give back the lease right now? */
  lock: 'ok' | 'busy' | 'error';
  lockDetail?: string;
  /** Where the lock lives: the shared database, or this server's memory (local file mode). */
  lockStore: 'database' | 'memory';
  floodUntil?: string;
  lastCheckAt?: string;
  lastError?: string;
  lastCheckSummary?: CheckSummary;
  knownPeople: number;
  contactsFound: number;
  trackAll: boolean;
}

/** Why a chat may not be showing: the lock, a wait, the last error and what the last check saw. Reads only. */
export async function diagnoseAccount(staffId: string): Promise<AccountDiagnosis> {
  const rec = await getAccountRecord(staffId);
  const store = getLeaseStore();
  const raw = await store.get(`tg_lease:${staffId}`).catch(() => null);
  let lock: AccountDiagnosis['lock'] = 'ok';
  let lockDetail: string | undefined;
  try {
    await withAccountLease(staffId, async () => undefined, { waitMs: 3_000, store });
  } catch (err) {
    lock = err instanceof AccountBusyError ? 'busy' : 'error';
    lockDetail = `${errText(err)}${raw ? ` · row: ${raw.slice(0, 120)}` : ''}`;
  }
  return {
    connected: Boolean(rec.session && rec.user),
    lock,
    lockDetail,
    lockStore: 'rows' in store ? 'memory' : 'database',
    floodUntil: floodActive(rec, Date.now()),
    lastCheckAt: rec.lastCheckAt,
    lastError: rec.lastError,
    lastCheckSummary: rec.lastCheckSummary,
    knownPeople: (rec.knownUserIds || []).length,
    contactsFound: (rec.contacts || []).length,
    trackAll: Boolean(rec.trackAll),
  };
}

// ─── The check ─────────────────────────────────────────────────────────────

export interface CheckResult {
  staffId: string;
  skipped?: boolean;
  /** Skipped because another request was using the account. */
  busy?: boolean;
  floodUntil?: string;
  newContacts: number;
  matched: number;
  /** Chat leads whose conversation numbers were refreshed. */
  statsUpdated?: number;
  error?: string;
}

/** Reads the account's recent chats, records new contacts and matches them to clicks. */
export async function checkAccount(staffId: string, options: { force?: boolean; nowMs?: number; everyMs?: number } = {}): Promise<CheckResult> {
  const rec = await getAccountRecord(staffId);
  const skipped: CheckResult = { staffId, skipped: true, newContacts: 0, matched: 0 };
  if (!rec.session || !rec.user) return skipped;
  const nowMs = options.nowMs ?? Date.now();
  const everyMs = options.everyMs ?? CHECK_EVERY_MS;
  const flood = floodActive(rec, nowMs);
  if (flood) return { ...skipped, floodUntil: flood, error: `Telegram asked this account to wait until ${phnomPenhStamp(Date.parse(flood))}` };
  if (!options.force && rec.lastCheckAt && nowMs - Date.parse(rec.lastCheckAt) < everyMs) return skipped;
  if (options.force && rec.lastForceCheckAt && nowMs - Date.parse(rec.lastForceCheckAt) < FORCE_CHECK_COOLDOWN_MS) {
    return { ...skipped, error: `Check now can run again in ${Math.ceil((FORCE_CHECK_COOLDOWN_MS - (nowMs - Date.parse(rec.lastForceCheckAt))) / 1000)} s` };
  }
  try {
    return await withAccountLease(staffId, async (signal) => {
      // Another server may have checked while we waited for the lease.
      const fresh = await getAccountRecord(staffId);
      if (!fresh.session || !fresh.user) return skipped;
      const blocked = floodActive(fresh, nowMs);
      if (blocked) return { ...skipped, floodUntil: blocked, error: `Telegram asked this account to wait until ${phnomPenhStamp(Date.parse(blocked))}` };
      if (!options.force && fresh.lastCheckAt && nowMs - Date.parse(fresh.lastCheckAt) < everyMs) return skipped;
      const since = fresh.lastCheckAt ? Date.parse(fresh.lastCheckAt) : nowMs - CHECK_EVERY_MS;
      const stamp = new Date(nowMs).toISOString();
      await patchAccountRecord(staffId, { lastCheckAt: stamp, ...(options.force ? { lastForceCheckAt: stamp } : {}) });
      const client = await clientFor(fresh, fresh.session);
      closeOnAbort(signal, client);
      let dialogs: DialogPeek[];
      try {
        await client.connect();
        dialogs = await client.recentDialogs(RECENT_DIALOGS);
        const session = client.saveSession();
        if (session !== fresh.session) await patchAccountRecord(staffId, { session });
      } catch (err) {
        await client.disconnect();
        const noted = await noteTelegramError(staffId, err, nowMs);
        return { staffId, newContacts: 0, matched: 0, error: noted.message, floodUntil: noted.floodUntil };
      }
      try {
        return await finishCheck(fresh, client, dialogs, since, nowMs);
      } finally {
        await client.disconnect();
      }
    }, { waitMs: options.force ? LEASE_WAIT_FORCE_CHECK_MS : 0, store: getLeaseStore() });
  } catch (err) {
    if (err instanceof AccountBusyError) return { ...skipped, busy: true };
    throw err;
  }
}

async function finishCheck(rec: TelegramAccountRecord, client: AccountClient, dialogs: DialogPeek[], since: number, nowMs: number): Promise<CheckResult> {
  const staffId = rec.staffId;

  const known = new Set(rec.knownUserIds || []);
  const contacts = [...(rec.contacts || [])];
  const seenKey = new Set(contacts.map((c) => `${c.userId}:${c.at}`));
  // Known people who wrote since the last check: they count only if a click explains the message.
  const provisional = new Set<string>();
  // Contacts found by this check (older ones were seen before).
  const foundNow = new Set<string>();
  const summary: CheckSummary = { at: new Date(nowMs).toISOString(), dialogs: dialogs.length, incoming: 0, newPeople: 0, knownRecent: 0, matched: 0, leadsMade: 0, newest: [] };

  // Clicks to this salesperson not yet matched to a chat (last 24 h): a known person's message only matters near one.
  const logs = await getRoundRobinLogs(500);
  const staffLogs = logs.filter((l) => l.staffId === staffId);
  const openClickMs = staffLogs
    .filter((l) => !l.contact && !l.demo && l.routeType === 'DIRECT_CONTACT_CLICK')
    .map((l) => Date.parse(l.timestamp))
    .filter((t) => Number.isFinite(t) && nowMs - t < 86_400_000);
  const earliestOpenClick = openClickMs.length ? Math.min(...openClickMs) : undefined;

  // The customer's first message is read from the chat itself, so a salesperson who answers before the
  // check runs (the dialog then ends with our message) or a customer who writes again later hides nothing.
  let lookups = 0;
  let lookupsStopped = false;
  type Found = { atMs: number; text: string; openedByUs?: boolean };
  const firstIncoming = async (d: DialogPeek, notBeforeMs: number): Promise<Found | null | undefined> => {
    // undefined: could not look (budget used up, or Telegram refused); null: looked, nothing from them since notBeforeMs.
    if (lookupsStopped || lookups >= HISTORY_LOOKUPS_PER_CHECK) return undefined;
    lookups += 1;
    try {
      const msgs = await client.history(d.userId, 20);
      const incoming = msgs.filter((m) => !m.out && m.atMs >= notBeforeMs).sort((a, b) => a.atMs - b.atMs || a.id - b.id);
      if (!incoming.length) return null;
      const first = incoming[0];
      // The greeting typed by the click says little: add the customer's next words for the alert and the lead.
      const next = !first.text || startsWithGreeting(first.text) ? incoming.slice(1).find((m) => m.text && !startsWithGreeting(m.text)) : undefined;
      // The whole chat is in view and the salesperson wrote first, in this period, without the customer
      // sending the click's greeting: they started it (a form lead messaged on Telegram, say).
      const oldest = msgs.reduce<(typeof msgs)[number] | undefined>((o, m) => (!o || m.atMs < o.atMs ? m : o), undefined);
      const openedByUs = msgs.length < 20 && Boolean(oldest?.out) && oldest!.atMs >= notBeforeMs && !startsWithGreeting(first.text);
      return { atMs: first.atMs, text: next ? `${first.text || ''}\n${next.text}`.trim() : first.text || '', ...(openedByUs ? { openedByUs } : {}) };
    } catch (err) {
      if (classifyTelegramError(err).kind !== 'other') {
        lookupsStopped = true;
        await noteTelegramError(staffId, err, nowMs);
      }
      return undefined;
    }
  };
  // Messages worth matching: since the last look, or since the earliest unmatched click if that is older.
  const notBefore = Math.min(since, earliestOpenClick ?? since) - 60_000;

  let added = 0;
  const people = dialogs.filter((d) => !d.isBot && !d.isSelf && d.lastAtMs);
  for (const d of people) {
    if (d.lastIncoming) {
      summary.incoming += 1;
      if (summary.newest.length < 6) summary.newest.push({ name: d.name || d.username || d.userId, username: d.username, atMs: d.lastAtMs, known: known.has(d.userId) });
    }
  }
  // New people first, so the lookup budget goes to them before people the account already knew.
  const ordered = [...people.filter((d) => !known.has(d.userId)), ...people.filter((d) => known.has(d.userId))];
  for (const d of ordered) {
    const isNew = !known.has(d.userId);
    const recent = d.lastAtMs > since - 60_000;
    // Nothing new with a known person since the last look.
    if (!isNew && !recent) continue;
    // A known person with no unmatched click to explain them is an existing customer chatting on.
    if (!isNew && earliestOpenClick === undefined) {
      if (d.lastIncoming) summary.knownRecent += 1;
      continue;
    }
    let msg = await firstIncoming(d, notBefore);
    if (msg === null) {
      if (!d.lastIncoming) {
        // Nothing from them in the period. Someone new: an old chat, or one the salesperson opened; remember
        // them, so a later reply is not taken for a brand-new customer.
        if (isNew) known.add(d.userId);
        continue;
      }
      // They spoke last, before the period (an earlier check did not finish): keep their latest message.
      // It is too old for any open click, so it can only become a Track every new chat lead.
      msg = { atMs: d.lastAtMs, text: d.lastText };
    }
    if (msg === undefined) {
      // Could not read the chat: fall back to their latest message if they spoke last; otherwise look next time.
      if (!d.lastIncoming) continue;
      msg = { atMs: d.lastAtMs, text: d.lastText };
    }
    if (isNew) summary.newPeople += 1;
    else summary.knownRecent += 1;
    known.add(d.userId);
    const at = new Date(msg.atMs).toISOString();
    const key = `${d.userId}:${at}`;
    if (seenKey.has(key)) continue;
    if (isNew) {
      // Already this salesperson's lead (they came through the sales bot): tracked on the lead, nothing to match.
      const existing = await findLeadByTelegramUserId(d.userId).catch(() => null);
      if (existing && existing.routing?.staffId === staffId) continue;
    }
    contacts.unshift({ staffId, at, userId: d.userId, username: d.username, name: d.name, text: msg.text.slice(0, 200), known: !isNew, ...(msg.openedByUs ? { openedByUs: true } : {}) });
    seenKey.add(key);
    foundNow.add(key);
    if (!isNew) provisional.add(key);
    added += 1;
  }
  // Whether the salesperson has answered, for the wording of the alert.
  const answered = new Map(people.map((d) => [d.userId, !d.lastIncoming]));

  // Match to clicks and leads.
  const matches = matchContactsToLogs(staffLogs, contacts, new Date(nowMs).toISOString());
  // A known person whose message no click explains is an old customer chatting on: not a new contact.
  for (let i = contacts.length - 1; i >= 0; i -= 1) {
    const c = contacts[i];
    const key = `${c.userId}:${c.at}`;
    if (provisional.has(key) && !matches.some((m) => m.contact.userId === c.userId && m.contact.at === c.at)) {
      contacts.splice(i, 1);
      added -= 1;
    }
  }
  summary.matched = matches.length;
  if (matches.length) {
    const byLog = new Map(matches.map((m) => [m.logId, m.confirmation]));
    await updateRoundRobinLogs((all) => all.map((l) => (byLog.has(l.id) && !l.contact ? { ...l, contact: byLog.get(l.id) } : l)));
    for (const m of matches) {
      const c = contacts.find((x) => x.userId === m.contact.userId && x.at === m.contact.at);
      if (c) c.logId = m.logId;
    }
    const logById = new Map(logs.map((l) => [l.id, l]));
    const rr = await getRoundRobinSettings();
    const staff = rr.staffList.find((s) => s.id === staffId) || null;
    for (const m of matches) {
      const log = logById.get(m.logId);
      if (!log || log.demo) continue;
      // Every confirmed chat is a prospect in the CRM (one lead per Telegram user).
      let existed = false;
      try {
        const found = await leadForChat(log, m.confirmation, staff);
        const lead = found.lead;
        existed = found.existed;
        m.confirmation.leadId = lead.id;
        if (!existed) summary.leadsMade += 1;
        const row = summary.newest.find((n) => (m.contact.username ? n.username === m.contact.username : n.name === (m.contact.name || m.contact.userId)));
        if (row) row.leadId = lead.id;
        await updateRoundRobinLogs((all) => all.map((l) => (l.id === log.id && l.contact ? { ...l, contact: { ...l.contact, leadId: lead.id } } : l)));
      } catch (err) {
        console.error('Lead from Telegram chat error:', err);
      }
      await alertChatStarted(log, m.confirmation, { answered: answered.get(m.contact.userId) === true, existing: existed }).catch(() => undefined);
    }
  }

  // Customers who wrote without clicking a page (when the salesperson chose to track every new chat).
  if (rec.trackAll) {
    const rr = await getRoundRobinSettings();
    const staff = rr.staffList.find((s) => s.id === staffId) || null;
    // New people whose message is recent (a week): older unmatched contacts stay as they are, and so do
    // chats the salesperson started (a form lead answering on Telegram is already in the CRM).
    for (const c of contacts.filter((x) => !x.logId && !x.openedByUs && Date.parse(x.at) >= nowMs - 7 * 86_400_000)) {
      try {
        const existing = await findLeadByTelegramUserId(c.userId);
        if (existing) continue;
        const lead = await createLeadFromTelegramChat({ contact: c, staff });
        c.logId = `direct:${lead.id}`;
        summary.leadsMade += 1;
        // Alert only for people found now: switching the option on must not replay a week of chats
        // (those who still wait are covered by the reminder).
        if (foundNow.has(`${c.userId}:${c.at}`)) await alertDirectChat(staffId, c, lead.id, answered.get(c.userId) === true).catch(() => undefined);
      } catch (err) {
        console.error('Lead from direct Telegram chat error:', err);
      }
    }
  }

  // How the conversations are going: counts and reply times for this person's open chat leads.
  let statsUpdated = 0;
  let statsError: string | undefined;
  try {
    statsUpdated = await refreshChatStats(client, staffId, dialogs, nowMs);
  } catch (err) {
    // A flood wait or a dead session here counts like anywhere else.
    statsError = (await noteTelegramError(staffId, err, nowMs)).message;
  }

  // Customers waiting for our reply: the bot reminds the salesperson, and the manager after twice as long.
  try {
    await remindWaitingChats(staffId, dialogs, nowMs);
  } catch (err) {
    console.error('Waiting-chat reminder error:', err);
  }

  rec.knownUserIds = Array.from(known).slice(-KNOWN_USERS_KEPT);
  rec.contacts = contacts.slice(0, CONTACTS_KEPT);
  await patchAccountRecord(staffId, { knownUserIds: rec.knownUserIds, contacts: rec.contacts, lastCheckSummary: summary, ...(statsError ? {} : { lastError: undefined }) });
  return { staffId, newContacts: Math.max(0, added), matched: matches.length, statsUpdated, error: statsError };
}

/** The CRM lead for a confirmed chat: found by Telegram user id (existed = true), or made now. */
async function leadForChat(log: RoundRobinLog, c: ContactInfo, staff: RoundRobinStaff | null): Promise<{ lead: Lead; existed: boolean }> {
  const existing = await findLeadByTelegramUserId(c.userId);
  if (existing) {
    const other = staff && existing.routing?.staffId && existing.routing.staffId !== staff.id ? ` · now chatting with ${staff.name}` : '';
    await addLeadNote(existing.id, `Clicked again: ${log.pageTitle || log.pageSlug}${other}${c.text ? ` · “${c.text.slice(0, 120)}”` : ''}`, 'Telegram check').catch(() => null);
    return { lead: existing, existed: true };
  }
  return { lead: await createLeadFromTelegramChat({ log, contact: c, staff }), existed: false };
}

type ContactInfo = { at: string; userId: string; username?: string; name?: string; text?: string; match: 'ref' | 'time'; leadId?: string };

/** Open leads that began as Telegram chats: how many messages each way, first reply time, who spoke last. */
export const CHAT_STATS_MAX_LEADS = 15;
export const CHAT_STATS_MESSAGES = 60;
export const CHAT_STATS_DAYS = 30;
/** Chats read per check to find a customer's first message (one Telegram call each). */
export const HISTORY_LOOKUPS_PER_CHECK = 8;
/** Voice messages turned into text per check and per chat read (each one is a Telegram call or a download). */
export const VOICE_PER_CHECK = 3;
export const VOICE_PER_READ = 2;

/**
 * Gives pending voice messages their text: Telegram's own transcription first, then
 * the outside transcriber when one is configured. Saves the chat; returns how many
 * were attempted. Flood or session errors propagate; anything else marks the message.
 */
async function transcribePending(client: AccountClient, peer: PeerRef, chat: StoredChat, limit: number): Promise<number> {
  const outside = externalTranscriber();
  const pending = pendingTranscripts(chat, limit);
  let attempted = 0;
  let changed = false;
  for (const m of pending) {
    attempted += 1;
    let text: string | null = null;
    let error: string | undefined;
    try {
      text = await client.transcribe(peer, m.id);
    } catch (err) {
      if (classifyTelegramError(err).kind !== 'other') throw err;
      error = errText(err);
    }
    if (text === null && outside) {
      try {
        const file = await client.downloadVoice(peer, m.id);
        if (file) text = await outside.transcribe(file.data, file.mimeType, 'a customer or salesperson of a Cambodian travel company');
        else error = error || 'voice file not available';
      } catch (err) {
        if (classifyTelegramError(err).kind !== 'other') throw err;
        error = errText(err);
      }
    }
    if (text !== null) {
      m.transcript = text;
      m.tstatus = 'done';
      delete m.terror;
      changed = true;
    } else if (error || !outside) {
      // Without Telegram's text and without an outside transcriber the message waits; a real error is noted.
      if (error) { m.tstatus = 'failed'; m.terror = error.slice(0, 120); changed = true; }
    }
  }
  if (changed) {
    chat.updatedAt = new Date().toISOString();
    await saveStoredChat(chat);
  }
  return attempted;
}

/** Puts the stored transcripts onto the messages the browser will show. */
function withTranscripts(messages: ChatMessage[], chat: StoredChat | null): ChatMessage[] {
  if (!chat) return messages;
  const byId = new Map(chat.messages.map((m) => [m.id, m]));
  return messages.map((m) => {
    const rec = byId.get(m.id);
    if (!rec || (!rec.transcript && !rec.tstatus)) return m;
    return { ...m, ...(rec.transcript ? { transcript: rec.transcript } : {}), ...(rec.tstatus ? { tstatus: rec.tstatus } : {}) };
  });
}

async function refreshChatStats(client: AccountClient, staffId: string, dialogs: DialogPeek[], nowMs: number): Promise<number> {
  const since = nowMs - CHAT_STATS_DAYS * 86_400_000;
  const unreadBy = new Map(dialogs.map((d) => [d.userId, d.unread]));
  const dialogBy = new Map(dialogs.map((d) => [d.userId, d]));
  const leads = (await getRealLeads())
    .filter((l) => l.routing?.routeType === 'DIRECT_CONTACT_CLICK' && l.routing.staffId === staffId && l.customFields?.telegramUserId)
    .filter((l) => l.status !== 'WON' && l.status !== 'LOST' && Date.parse(l.createdAt) >= since)
    // Only chats in the recent list (their peer is known) whose last message or unread count changed
    // since the numbers were taken: an unchanged chat costs no Telegram call.
    .filter((l) => {
      const d = dialogBy.get(l.customFields!.telegramUserId);
      if (!d) return false;
      const c = l.routing?.chat;
      return !(c?.lastAt && Date.parse(c.lastAt) === d.lastAtMs && (c.unread ?? 0) === (d.unread ?? 0));
    })
    // The ones with the oldest numbers first, so every changed chat gets its turn.
    .sort((a, b) => (a.routing?.chat?.updatedAt || '').localeCompare(b.routing?.chat?.updatedAt || ''))
    .slice(0, CHAT_STATS_MAX_LEADS);
  let n = 0;
  let voiceBudget = VOICE_PER_CHECK;
  for (const lead of leads) {
    const userId = lead.customFields!.telegramUserId;
    const messages = await client.history(userId, CHAT_STATS_MESSAGES);
    if (!messages.length) continue;
    // Keep the conversation itself (see chat-store.ts) and turn a voice message or two into text.
    try {
      const stored = await recordChatMessages(lead.id, staffId, messages);
      const peer = await client.resolvePeer(userId, lead.customFields?.telegramUsername);
      if (peer && voiceBudget > 0) voiceBudget -= await transcribePending(client, peer, stored, Math.min(voiceBudget, 2));
    } catch (err) {
      if (classifyTelegramError(err).kind !== 'other') throw err;
      console.error('Chat store error:', err);
    }
    const prior = lead.routing!.chat;
    // Keep what the inbox learned about the chat's message ids; the counters here are fresh.
    const stats: ChatStats = { ...chatStatsFrom(messages, unreadBy.get(userId), new Date(nowMs).toISOString()), lastMessageId: prior?.lastMessageId, seenMaxId: prior?.seenMaxId };
    if (!statsDiffer(prior, stats)) continue;
    await saveChatStats(lead, stats);
    n += 1;
  }
  return n;
}

/** Oldest first; same-second messages by Telegram's id, so a quick exchange keeps its order. */
const byTime = (a: ChatMessage, b: ChatMessage) => a.atMs - b.atMs || a.id - b.id;

/**
 * Writes the chat numbers onto the lead as it is stored now, so a note or status the
 * admin saved during the Telegram round trip is not overwritten by our older copy.
 */
async function saveChatStats(lead: Lead, stats: ChatStats): Promise<void> {
  const fresh = (await getLeadById(lead.id).catch(() => null)) || lead;
  if (!fresh.routing) return;
  fresh.routing = { ...fresh.routing, chat: stats };
  lead.routing = fresh.routing;
  await saveLeadChanges(fresh).catch(() => undefined);
}

/** True when anything but the timestamp differs, so unchanged chats cost no write. */
function statsDiffer(a: ChatStats | undefined, b: ChatStats): boolean {
  if (!a) return true;
  const pick = (s: ChatStats) => [s.fromCustomer, s.fromUs, s.firstCustomerAt, s.firstReplyAt, s.firstReplySeconds, s.lastAt, s.lastFrom, s.waitingSince, s.unread, s.lastMessageId, s.seenMaxId].map((v) => (v === undefined ? null : v));
  return JSON.stringify(pick(a)) !== JSON.stringify(pick(b));
}

// ─── Waiting-customer reminder ─────────────────────────────────────────────

/** Allowed values for Round Robin → "Remind when a Telegram customer waits" (minutes; 0 = off). */
export const CHAT_REPLY_MINUTE_CHOICES = [0, 10, 15, 30, 60] as const;
export const DEFAULT_CHAT_REPLY_MINUTES = 15;
/** Customer messages older than this are never reminded about, whatever the shifts. */
const REMIND_MAX_AGE_MS = 7 * 86_400_000;

/** Minutes before the reminder, from the Round Robin settings (missing = 15, 0 = off). */
export function chatReplyMinutes(rr: { chatReplyMinutes?: number }): number {
  if (rr.chatReplyMinutes === undefined || rr.chatReplyMinutes === null) return DEFAULT_CHAT_REPLY_MINUTES;
  const n = Number(rr.chatReplyMinutes);
  return (CHAT_REPLY_MINUTE_CHOICES as readonly number[]).includes(n) ? n : DEFAULT_CHAT_REPLY_MINUTES;
}

export interface WaitDecision {
  /** Remind the salesperson now. */
  staff: boolean;
  /** Send the manager a copy now. */
  manager: boolean;
  /** When the wait began (ISO): the customer's first unanswered message, the key that keeps each reminder to once per wait. */
  forAt: string;
  /** How long the customer has been waiting, in clock time, since that message. */
  waitedMs: number;
  /** The customer wrote again after the salesperson's reminder. */
  again?: boolean;
}

/**
 * When the reminder clock starts for a message at `fromMs`: at once during the salesperson's shift,
 * otherwise when the next shift opens; and if the reminder would fall due after the shift has
 * ended, at the start of the next shift instead, so it never comes at closing time or days late.
 */
function reminderClockStart(staff: Pick<RoundRobinStaff, 'workHours'>, fromMs: number, ms: number): number {
  const start = shiftStartMs(staff, fromMs);
  return staffOnShift(staff, start + ms) ? start : shiftStartMs(staff, start + ms);
}

/**
 * Whether a customer who spoke last should trigger a reminder now. The wait starts at their first
 * unanswered message (the chat numbers, when current) or else at their last message (never early).
 * Nobody is reminded while the salesperson is off shift (no working hours set = always on shift).
 * The salesperson is reminded once per wait, and again if the customer writes after that reminder;
 * the manager once per wait, `minutes` after the salesperson's reminder (twice the time at the earliest).
 * Nothing for a customer whose last message is more than 7 days old.
 */
export function waitDecision(input: {
  minutes: number;
  nowMs: number;
  lastIncomingAtMs: number;
  stats?: Pick<ChatStats, 'lastAt' | 'waitingSince'>;
  staff: Pick<RoundRobinStaff, 'workHours' | 'telegramChatId'>;
  reminder?: { forAt: string; staffAt?: string; managerAt?: string };
  managerChat?: string;
}): WaitDecision | null {
  const { minutes, nowMs, stats, staff } = input;
  if (!minutes) return null;
  const lastMs = input.lastIncomingAtMs;
  const current = stats?.waitingSince && stats.lastAt && Date.parse(stats.lastAt) === lastMs;
  const sinceMs = current ? Date.parse(stats!.waitingSince!) : lastMs;
  if (!Number.isFinite(sinceMs) || !Number.isFinite(lastMs) || nowMs - lastMs > REMIND_MAX_AGE_MS) return null;
  if (!staffOnShift(staff, nowMs)) return null;
  const ms = minutes * 60_000;
  const forAt = new Date(sinceMs).toISOString();
  // What was already sent during this wait (a reminder from before it began was for an earlier one).
  // Times, not the stored key, decide: the key moves when the chat numbers catch up with the dialog.
  const staffAtMs = input.reminder?.staffAt ? Date.parse(input.reminder.staffAt) : NaN;
  const reminded = Number.isFinite(staffAtMs) && staffAtMs >= sinceMs;
  const managerAtMs = input.reminder?.managerAt ? Date.parse(input.reminder.managerAt) : NaN;
  const managerTold = Number.isFinite(managerAtMs) && managerAtMs >= sinceMs;
  const staffChat = (staff.telegramChatId || '').trim();
  // The salesperson: first reminder of this wait, or again for a message that came after it.
  const again = reminded && lastMs > staffAtMs;
  const onShiftWait = nowMs - reminderClockStart(staff, again ? lastMs : sinceMs, ms);
  const staffDue = Boolean(staffChat) && (!reminded || again) && onShiftWait >= ms;
  // The manager: once per wait, after the salesperson had `minutes` to answer their reminder.
  const manager = (input.managerChat || '').trim();
  let managerDue = false;
  if (manager && manager !== staffChat && !managerTold) {
    if (reminded) managerDue = nowMs - staffAtMs >= ms;
    else if (!staffChat) managerDue = nowMs - reminderClockStart(staff, sinceMs, ms) >= 2 * ms;
  }
  if (!staffDue && !managerDue) return null;
  return { staff: staffDue, manager: managerDue, forAt, waitedMs: nowMs - sinceMs, ...(staffDue && again ? { again: true } : {}) };
}

/** More reminders than this due at once for one salesperson go out as one list instead. */
const REMINDERS_ONE_BY_ONE = 3;

/**
 * After a check: for each of this salesperson's open Telegram chat leads whose customer spoke
 * last (seen in the dialogs Telegram just returned, so the answer is current), remind the
 * salesperson once the wait passes the set minutes and copy the manager later (waitDecision).
 */
async function remindWaitingChats(staffId: string, dialogs: DialogPeek[], nowMs: number): Promise<number> {
  const waitingDialogs = dialogs.filter((d) => !d.isBot && !d.isSelf && d.lastIncoming && d.lastAtMs);
  if (!waitingDialogs.length) return 0;
  const rr = await getRoundRobinSettings();
  const minutes = chatReplyMinutes(rr);
  const staff = rr.staffList.find((s) => s.id === staffId);
  if (!minutes || !staff) return 0;
  const settings = await getSettings();
  const token = settings.telegramBotToken;
  if (!token) return 0;
  const managerChat = (rr.managerChatId || rr.fallbackChatId || settings.telegramChatId || '').trim();
  const leads = (await getRealLeads()).filter((l) => l.routing?.staffId === staffId && l.customFields?.telegramUserId && l.status !== 'WON' && l.status !== 'LOST');
  const byUser = new Map(leads.map((l) => [l.customFields!.telegramUserId, l]));
  const due: Array<{ lead: Lead; d: DialogPeek; decision: WaitDecision }> = [];
  for (const d of waitingDialogs) {
    const lead = byUser.get(d.userId);
    if (!lead?.routing) continue;
    const decision = waitDecision({ minutes, nowMs, lastIncomingAtMs: d.lastAtMs, stats: lead.routing.chat, staff, reminder: lead.routing.chatReminder, managerChat });
    if (decision) due.push({ lead, d, decision });
  }
  if (!due.length) return 0;

  const send = (chatId: string, text: string) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    }).then(readTelegramResponse).then((d) => Boolean(d.ok)).catch(() => false);
  const who = (l: Lead) => escapeHtml([l.fullName, l.customFields?.telegramUsername ? `(@${l.customFields.telegramUsername})` : ''].filter(Boolean).join(' '));
  const service = (l: Lead) => escapeHtml(l.landingPageTitle || 'KHB Events');
  const waited = (x: (typeof due)[number]) => escapeHtml(formatWait(Math.round(x.decision.waitedMs / 1000)));
  const wrote = (x: (typeof due)[number]) => phnomPenhStamp(Date.parse(x.decision.forAt));
  const link = (l: Lead) => `https://sale.khbevents.com/admin/chats?id=${encodeURIComponent(l.id)}`;
  const inbox = 'https://sale.khbevents.com/admin/chats';
  const listed = (rows: string[]) => (rows.length > 10 ? [...rows.slice(0, 10), `… +${rows.length - 10}`] : rows);

  const staffSent = new Set<string>();
  const toStaff = due.filter((x) => x.decision.staff);
  if (toStaff.length > REMINDERS_ONE_BY_ONE) {
    const ok = await send(staff.telegramChatId, [
      `⏳ <b>អតិថិជន ${toStaff.length} នាក់រង់ចាំចម្លើយ</b>`,
      ...listed(toStaff.map((x) => `• ${who(x.lead)} · ${service(x.lead)} · ${waited(x)}`)),
      '👉 សូមឆ្លើយឥឡូវ!',
      `📋 ${inbox}`,
    ].join('\n'));
    if (ok) toStaff.forEach((x) => staffSent.add(x.lead.id));
  } else {
    for (const x of toStaff) {
      const said = x.d.lastText ? `💬 “${escapeHtml(x.d.lastText.slice(0, 120))}${x.d.lastText.length > 120 ? '…' : ''}”` : '';
      const ok = await send(staff.telegramChatId, [
        x.decision.again ? `⏳ <b>អតិថិជនសរសេរមកម្តងទៀត · រង់ចាំចម្លើយ ${waited(x)} ហើយ</b>` : `⏳ <b>អតិថិជនរង់ចាំចម្លើយ ${waited(x)} ហើយ</b>`,
        `👤 ${who(x.lead)}`,
        `📌 សេវា៖ <b>${service(x.lead)}</b>`,
        `🕒 សរសេរមកតាំងពី៖ ${wrote(x)}`,
        said,
        '👉 សូមឆ្លើយឥឡូវ!',
        `📋 ${link(x.lead)}`,
      ].filter(Boolean).join('\n'));
      if (ok) staffSent.add(x.lead.id);
    }
  }

  const managerSent = new Set<string>();
  const toManager = due.filter((x) => x.decision.manager);
  if (toManager.length > REMINDERS_ONE_BY_ONE) {
    const ok = await send(managerChat, [
      `⏳ <b>${toManager.length} customers still waiting for a reply</b> → ${escapeHtml(staff.name)}`,
      ...listed(toManager.map((x) => `• ${who(x.lead)} · ${service(x.lead)} · waiting ${waited(x)}`)),
      `📋 ${inbox}`,
    ].join('\n'));
    if (ok) toManager.forEach((x) => managerSent.add(x.lead.id));
  } else {
    for (const x of toManager) {
      const ok = await send(managerChat, [
        `⏳ <b>Customer still waiting for a reply</b> → ${escapeHtml(staff.name)}`,
        `👤 ${who(x.lead)} · ${service(x.lead)}`,
        `🕒 Wrote ${wrote(x)} · waiting ${waited(x)}`,
        `📋 ${link(x.lead)}`,
      ].join('\n'));
      if (ok) managerSent.add(x.lead.id);
    }
  }

  // Remember what went out, so each reminder is sent once per wait.
  const nowIso = new Date(nowMs).toISOString();
  for (const x of due) {
    const prev = x.lead.routing!.chatReminder;
    const reminder = { ...prev, forAt: x.decision.forAt };
    if (staffSent.has(x.lead.id)) reminder.staffAt = nowIso;
    if (managerSent.has(x.lead.id)) reminder.managerAt = nowIso;
    if (reminder.staffAt === prev?.staffAt && reminder.managerAt === prev?.managerAt && reminder.forAt === prev?.forAt) continue;
    const fresh = (await getLeadById(x.lead.id).catch(() => null)) || x.lead;
    if (fresh.routing) {
      fresh.routing = { ...fresh.routing, chatReminder: reminder };
      await saveLeadChanges(fresh).catch(() => undefined);
    }
  }
  return staffSent.size + managerSent.size;
}

/** Sends one bot message to the salesperson and, when Manager notification is on, a copy to the manager chat. */
async function sendChatAlert(staffId: string, text: string): Promise<void> {
  const [rr, settings] = await Promise.all([getRoundRobinSettings(), getSettings()]);
  const token = settings.telegramBotToken;
  if (!token) return;
  const staff = rr.staffList.find((s) => s.id === staffId);
  const send = (chatId: string) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    }).then(readTelegramResponse).catch(() => undefined);
  const tasks: Promise<unknown>[] = [];
  if (staff?.telegramChatId) tasks.push(send(staff.telegramChatId));
  // Same destination as the click copy: the Manager Chat ID, else the company chat in Settings.
  const manager = rr.managerChatId || settings.telegramChatId;
  if (rr.enableManagerNotification && manager && String(manager) !== String(staff?.telegramChatId)) tasks.push(send(manager));
  await Promise.allSettled(tasks);
}

/**
 * Tells the salesperson (and the manager, when CC is on) that the customer behind a
 * click has now written: who they are and what they asked. Short and in Khmer.
 * `answered`: the salesperson already replied (no "reply now"); `existing`: a customer
 * who already had a lead clicked again.
 */
async function alertChatStarted(log: RoundRobinLog, c: { at: string; name?: string; username?: string; text?: string; match: 'ref' | 'time'; leadId?: string }, opts: { answered?: boolean; existing?: boolean } = {}): Promise<void> {
  if (log.demo) return;
  const who = [c.name, c.username ? `(@${c.username})` : ''].filter(Boolean).join(' ') || 'អតិថិជន';
  const head = opts.existing ? '🔁 <b>អតិថិជនចាស់ចុចម្តងទៀត ហើយផ្ញើសារមកអ្នក</b>' : '✅ <b>អតិថិជនបានផ្ញើសារមកអ្នកហើយ</b>';
  const text = [
    c.match === 'ref' ? head : `${head} (ប្រហែលពីការចុចនេះ)`,
    `👤 ${escapeHtml(who)}`,
    `📌 សេវា៖ <b>${escapeHtml(log.pageTitle || log.pageSlug)}</b>`,
    c.text ? `💬 “${escapeHtml(c.text.slice(0, 120))}${c.text.length > 120 ? '…' : ''}”` : '',
    `⏰ ${phnomPenhStamp(Date.parse(c.at))}`,
    opts.answered ? '✔️ បានឆ្លើយរួចហើយ' : '👉 សូមឆ្លើយឥឡូវ!',
    c.leadId ? `📋 CRM: https://sale.khbevents.com/admin/leads?id=${encodeURIComponent(c.leadId)}` : '',
  ].filter(Boolean).join('\n');
  await sendChatAlert(log.staffId, text);
}

/** "Track every new chat": a new customer wrote without a click and became a lead. */
async function alertDirectChat(staffId: string, c: { at: string; name?: string; username?: string; text?: string }, leadId: string, answered: boolean): Promise<void> {
  const who = [c.name, c.username ? `(@${c.username})` : ''].filter(Boolean).join(' ') || 'អតិថិជន';
  const text = [
    '💬 <b>អតិថិជនថ្មីផ្ញើសារមកផ្ទាល់</b> (មិនមែនពីការចុចលើទំព័រ)',
    `👤 ${escapeHtml(who)}`,
    c.text ? `💬 “${escapeHtml(c.text.slice(0, 120))}${c.text.length > 120 ? '…' : ''}”` : '',
    `⏰ ${phnomPenhStamp(Date.parse(c.at))}`,
    answered ? '✔️ បានឆ្លើយរួចហើយ' : '👉 សូមឆ្លើយឥឡូវ!',
    `📋 CRM: https://sale.khbevents.com/admin/leads?id=${encodeURIComponent(leadId)}`,
  ].filter(Boolean).join('\n');
  await sendChatAlert(staffId, text);
}

/** Checks every connected account (throttled). Never throws. */
export async function checkAllAccounts(options: { force?: boolean; everyMs?: number } = {}): Promise<CheckResult[]> {
  try {
    const rr = await getRoundRobinSettings();
    const out: CheckResult[] = [];
    for (const s of rr.staffList) {
      try {
        out.push(await checkAccount(s.id, options));
      } catch (err) {
        out.push({ staffId: s.id, newContacts: 0, matched: 0, error: errText(err) });
      }
    }
    return out;
  } catch (err) {
    console.error('Telegram account check error:', err);
    return [];
  }
}

/** Runs the check with a time limit, so a page never waits long for Telegram. */
export async function checkAllAccountsWithin(ms: number, options: { everyMs?: number } = {}): Promise<CheckResult[]> {
  return Promise.race([
    checkAllAccounts(options),
    new Promise<CheckResult[]>((resolve) => setTimeout(() => resolve([]), ms)),
  ]);
}

// ─── Chat view ─────────────────────────────────────────────────────────────

/** How the live read went, so the browser knows how soon to look again. */
export interface LiveState {
  state: 'ok' | 'busy' | 'flood' | 'not_connected' | 'error';
  retryInMs?: number;
  floodUntil?: string;
}

export interface LeadConversation {
  leadId: string;
  staffId: string;
  staffName: string;
  customer: { userId: string; username?: string; name: string };
  /** The trip or page the customer asked about, for a first greeting. */
  pageTitle?: string;
  /** Oldest first. Empty when `unchanged`: keep the messages already shown. */
  messages: ChatMessage[];
  stats: ChatStats;
  readAt: string;
  /** Why there are no messages, when the account could not be read. */
  error?: string;
  /** Nothing new since the browser's last look (its `since` and `unread`). */
  unchanged?: boolean;
  /** Telegram's id of the latest message and the customer's unread count: the browser sends them back next time. */
  lastMessageId?: number;
  unread?: number;
  /** The salesperson's "Auto seen" setting, for the badge. */
  autoSeen?: boolean;
  live: LiveState;
}

export interface ReadOptions {
  /** The latest message id the browser has, and the unread count it saw: unchanged chats skip the message download. */
  since?: number;
  unread?: number;
  /** A person is looking at the chat right now (visible, focused tab). Needed for Auto seen. */
  viewing?: boolean;
  limit?: number;
  nowMs?: number;
}

async function chatLead(leadId: string): Promise<{ lead: Lead; userId: string; username?: string } | null> {
  const lead = await getLeadById(leadId);
  const userId = lead?.customFields?.telegramUserId;
  if (!lead || !userId || !lead.routing) return null;
  return { lead, userId, username: lead.customFields?.telegramUsername || undefined };
}

function conversationBase(lead: Lead, userId: string, username: string | undefined, nowMs: number): LeadConversation {
  const stats = lead.routing!.chat || { fromCustomer: 0, fromUs: 0, updatedAt: '' };
  return {
    leadId: lead.id,
    staffId: lead.routing!.staffId,
    staffName: lead.routing!.staffName,
    customer: { userId, username, name: lead.fullName },
    pageTitle: lead.landingPageTitle || undefined,
    messages: [],
    stats,
    readAt: new Date(nowMs).toISOString(),
    lastMessageId: stats.lastMessageId,
    unread: stats.unread,
    live: { state: 'ok' },
  };
}

/**
 * The live conversation between the salesperson and a Telegram customer, read
 * through the salesperson's connected account while the inbox is open.
 *
 * One short connection: a probe of the chat's counters; with Auto seen on and a
 * person looking, one read receipt for new customer messages; the messages only
 * when the top message or the unread count changed since the browser's last look.
 * The lead keeps only the numbers (routing.chat), written only when they change.
 */
export async function readLeadConversation(leadId: string, options: ReadOptions = {}): Promise<LeadConversation | null> {
  const found = await chatLead(leadId);
  if (!found) return null;
  const { lead, userId, username } = found;
  const nowMs = options.nowMs ?? Date.now();
  const staffId = lead.routing!.staffId;
  const base = conversationBase(lead, userId, username, nowMs);
  const rec = await getAccountRecord(staffId);
  base.autoSeen = Boolean(rec.autoSeen);
  if (!rec.session || !rec.user) return { ...base, error: 'not_connected', live: { state: 'not_connected' } };
  const flood = floodActive(rec, nowMs);
  if (flood) return { ...base, unchanged: options.since !== undefined, live: { state: 'flood', floodUntil: flood, retryInMs: Date.parse(flood) - nowMs } };
  try {
    return await withAccountLease(staffId, (signal) => readWithClient(lead, rec, base, options, nowMs, signal), { waitMs: 0, store: getLeaseStore() });
  } catch (err) {
    if (err instanceof AccountBusyError) return { ...base, unchanged: options.since !== undefined, live: { state: 'busy', retryInMs: err.retryInMs } };
    throw err;
  }
}

async function readWithClient(lead: Lead, rec: TelegramAccountRecord, base: LeadConversation, options: ReadOptions, nowMs: number, signal?: AbortSignal): Promise<LeadConversation> {
  const staffId = rec.staffId;
  const userId = base.customer.userId;
  const client = await clientFor(rec, rec.session!);
  closeOnAbort(signal, client);
  const patch: Partial<TelegramAccountRecord> = {};
  try {
    await client.connect();
    const found = await locateChat(client, rec, userId, base.customer.username);
    if (!found) return { ...base, error: 'Chat not found on this account', live: { state: 'error' } };
    const { peer, probe } = found;
    if (found.peers) patch.peers = found.peers;
    const prior = lead.routing!.chat;
    let seenMaxId = prior?.seenMaxId;
    // "Seen" on Telegram only when the salesperson asked for it and a person is really looking.
    if (shouldMarkRead({ autoSeen: Boolean(rec.autoSeen), viewing: Boolean(options.viewing), unreadCount: probe.unreadCount, topMessageId: probe.topMessageId, markedMaxId: seenMaxId })) {
      await client.markRead(peer, probe.topMessageId);
      seenMaxId = probe.topMessageId;
      probe.unreadCount = 0;
      probe.readInboxMaxId = probe.topMessageId;
    }
    const changed = !dialogUnchanged(probe, options.since, options.unread);
    let messages: ChatMessage[] | null = null;
    let stats: ChatStats;
    const stamp = new Date(nowMs).toISOString();
    if (changed) {
      // First time this chat is stored: take more history, so the story starts before today.
      const known = await getStoredChat(lead.id);
      const limit = known && known.messages.length ? options.limit ?? 100 : Math.max(options.limit ?? 100, CHAT_BACKFILL);
      messages = (await client.messages(peer, limit)).sort(byTime);
      let stored: StoredChat | null = known;
      try {
        stored = await recordChatMessages(lead.id, staffId, messages);
        await transcribePending(client, peer, stored, VOICE_PER_READ);
      } catch (err) {
        if (classifyTelegramError(err).kind !== 'other') throw err;
        console.error('Chat store error:', err);
      }
      messages = withTranscripts(messages, stored);
      stats = { ...chatStatsFrom(messages, probe.unreadCount, stamp), lastMessageId: probe.topMessageId, seenMaxId };
    } else {
      stats = { ...(prior || { fromCustomer: 0, fromUs: 0, updatedAt: stamp }), unread: probe.unreadCount, lastMessageId: probe.topMessageId, seenMaxId };
    }
    for (const k of ['seenMaxId', 'lastMessageId'] as const) if (stats[k] === undefined) delete stats[k];
    if (statsDiffer(prior, stats)) await saveChatStats(lead, stats);
    const session = client.saveSession();
    if (session !== rec.session) patch.session = session;
    if (rec.lastError) patch.lastError = undefined;
    return { ...base, messages: messages || [], unchanged: !changed, stats, lastMessageId: probe.topMessageId, unread: probe.unreadCount, live: { state: 'ok' } };
  } catch (err) {
    const noted = await noteTelegramError(staffId, err, nowMs);
    if (noted.kind === 'flood') return { ...base, unchanged: options.since !== undefined, live: { state: 'flood', floodUntil: noted.floodUntil, retryInMs: Date.parse(noted.floodUntil!) - nowMs } };
    if (noted.kind === 'terminal') return { ...base, error: 'not_connected', live: { state: 'not_connected' } };
    return { ...base, error: noted.message, live: { state: 'error' } };
  } finally {
    await client.disconnect();
    if (Object.keys(patch).length) await patchAccountRecord(staffId, patch).catch(() => undefined);
  }
}

/**
 * Sends a reply to a Telegram customer from the portal, through the salesperson's
 * connected account (so the customer sees it from the salesperson, as usual), and
 * returns the refreshed conversation. Like any chat app, replying marks the
 * customer's messages as read first. One connection does it all. A short note on
 * the lead records who sent it.
 *
 * Throws SendPaceError (too fast), FloodBlockedError (Telegram asked to wait) or
 * AccountBusyError (another request held the account for too long).
 */
export async function sendLeadMessage(leadId: string, rawText: string, by: string, nowMs = Date.now()): Promise<LeadConversation | null> {
  const text = rawText.replace(/\s+$/g, '').trim().slice(0, 4000);
  if (!text) throw new Error('Message is empty');
  const found = await chatLead(leadId);
  if (!found) return null;
  const { lead, userId, username } = found;
  const staffId = lead.routing!.staffId;
  const first = await getAccountRecord(staffId);
  if (!first.session || !first.user) throw new Error(`${lead.routing!.staffName}'s Telegram account is not connected`);
  const flood = floodActive(first, nowMs);
  if (flood) throw new FloodBlockedError(flood, nowMs);
  const pace = sendGuard(first.sendTimes, nowMs);
  if (!pace.ok) throw new SendPaceError(pace.retryInMs);

  const result = await withAccountLease(staffId, async (signal) => {
    // Fresh copy inside the lease: another reply may have just gone out.
    const rec = await getAccountRecord(staffId);
    if (!rec.session || !rec.user) throw new Error(`${lead.routing!.staffName}'s Telegram account is not connected`);
    const now = Date.now();
    const blocked = floodActive(rec, now);
    if (blocked) throw new FloodBlockedError(blocked, now);
    const guard = sendGuard(rec.sendTimes, now);
    if (!guard.ok) throw new SendPaceError(guard.retryInMs);
    // Take the slot before talking to Telegram, so a failed send still counts toward the pace.
    const sendTimes = [...(rec.sendTimes || []).filter((t) => now - Date.parse(t) < 60_000), new Date(now).toISOString()];
    await patchAccountRecord(staffId, { sendTimes });
    const base = conversationBase(lead, userId, username, now);
    base.autoSeen = Boolean(rec.autoSeen);
    const client = await clientFor(rec, rec.session);
    closeOnAbort(signal, client);
    const patch: Partial<TelegramAccountRecord> = {};
    try {
      await client.connect();
      const found = await locateChat(client, rec, userId, username);
      if (!found) throw new ChatNotFoundError();
      const { peer, probe } = found;
      if (found.peers) patch.peers = found.peers;
      const prior = lead.routing!.chat;
      let seenMaxId = prior?.seenMaxId;
      if (probe.unreadCount > 0 && probe.topMessageId > 0) {
        await client.markRead(peer, probe.topMessageId);
        seenMaxId = probe.topMessageId;
      }
      await client.sendTo(peer, text);
      let messages = (await client.messages(peer, 100)).sort(byTime);
      try {
        messages = withTranscripts(messages, await recordChatMessages(lead.id, staffId, messages));
      } catch (err) {
        if (classifyTelegramError(err).kind !== 'other') throw err;
        console.error('Chat store error:', err);
      }
      const top = messages.reduce((m, x) => Math.max(m, x.id), probe.topMessageId);
      const stats: ChatStats = { ...chatStatsFrom(messages, 0, new Date().toISOString()), lastMessageId: top };
      if (seenMaxId !== undefined) stats.seenMaxId = seenMaxId;
      if (statsDiffer(prior, stats)) await saveChatStats(lead, stats);
      const session = client.saveSession();
      if (session !== rec.session) patch.session = session;
      if (rec.lastError) patch.lastError = undefined;
      return { ...base, messages, stats, lastMessageId: top, unread: 0, live: { state: 'ok' } } satisfies LeadConversation;
    } catch (err) {
      if (err instanceof SendPaceError || err instanceof FloodBlockedError || err instanceof ChatNotFoundError) throw err;
      const noted = await noteTelegramError(staffId, err, now);
      if (noted.kind === 'flood') throw new FloodBlockedError(noted.floodUntil!, now);
      if (noted.kind === 'terminal') throw new Error('Telegram ended the session. Connect the account again under Settings.');
      throw new Error(noted.message);
    } finally {
      await client.disconnect();
      if (Object.keys(patch).length) await patchAccountRecord(staffId, patch).catch(() => undefined);
    }
  }, { waitMs: LEASE_WAIT_SEND_MS, store: getLeaseStore() });

  await addLeadNote(leadId, `💬 Sent on Telegram by ${by}: “${text.slice(0, 160)}${text.length > 160 ? '…' : ''}”`, by).catch(() => null);
  return result;
}

/** Every Telegram customer, newest activity first, for the inbox. */
export interface InboxRow {
  leadId: string;
  name: string;
  username?: string;
  pageTitle: string;
  staffId: string;
  staffName: string;
  status: string;
  createdAt: string;
  lastAt?: string;
  lastFrom?: 'customer' | 'us';
  fromCustomer: number;
  fromUs: number;
  unread?: number;
  firstMessage?: string;
  /** The salesperson's account is connected, so the chat can be read and answered here. */
  connected: boolean;
  /** The AI coach's last verdict, when it has looked at this lead. */
  heat?: 'hot' | 'warm' | 'cold';
  nextStep?: string;
}

export async function listTelegramInbox(): Promise<InboxRow[]> {
  const { listLeadHeat } = await import('./lead-ai');
  const [leads, rr, heat] = await Promise.all([getRealLeads(), getRoundRobinSettings(), listLeadHeat().catch(() => ({} as Awaited<ReturnType<typeof listLeadHeat>>))]);
  const connected = new Map<string, boolean>();
  for (const s of rr.staffList) {
    const rec = await getAccountRecord(s.id);
    connected.set(s.id, Boolean(rec.session && rec.user));
  }
  return leads
    .filter((l) => l.customFields?.telegramUserId && l.routing)
    .map((l) => {
      const c = l.routing!.chat;
      return {
        leadId: l.id,
        name: l.fullName,
        username: l.customFields?.telegramUsername,
        pageTitle: l.landingPageTitle,
        staffId: l.routing!.staffId,
        staffName: l.routing!.staffName,
        status: l.status,
        createdAt: l.createdAt,
        lastAt: c?.lastAt || l.createdAt,
        lastFrom: c?.lastFrom,
        fromCustomer: c?.fromCustomer ?? 0,
        fromUs: c?.fromUs ?? 0,
        unread: c?.unread,
        firstMessage: l.message,
        connected: connected.get(l.routing!.staffId) ?? false,
        heat: heat[l.id]?.heat,
        nextStep: heat[l.id]?.nextStep,
      };
    })
    .sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
}
