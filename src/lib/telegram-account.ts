/**
 * The salesperson's own Telegram account, connected once, tells us which visitors
 * really started a chat after clicking "Chat on Telegram".
 *
 * How it works
 * - The admin enters the API ID and API hash from my.telegram.org and the phone
 *   number; Telegram sends a login code to the phone; the code (and the two-step
 *   password, if any) completes the login. The login session is stored in the
 *   `tg_account:<staffId>` row of system_settings (the same protection as the bot token).
 * - A check lists the account's recent private chats. A chat with a person we have
 *   not seen before is a new contact; its first message is matched to the click that
 *   led to it (reference code, or timing). See contact-verify.ts.
 * - Checks run at most every 2 minutes: from Team performance, the routing tick and
 *   the daily cron, or with "Check now".
 *
 * The account is only read: the portal never sends a message from it. Only new
 * chats and the first 200 characters of their first message are kept.
 *
 * Server only. `TELEGRAM_ACCOUNT_MOCK=1` swaps Telegram for a file-backed double
 * so the flow can be tested where Telegram is unreachable.
 */
import { getMarker, getRoundRobinLogs, getRoundRobinSettings, getSettings, phnomPenhStamp, setMarker, updateRoundRobinLogs } from './storage';
import { escapeHtml, readTelegramResponse } from './round-robin';
import type { RoundRobinLog } from './types';
import { matchContactsToLogs, refCodeIn, type RecentContact } from './contact-verify';

export const CHECK_EVERY_MS = 2 * 60 * 1000;
const RECENT_DIALOGS = 40;
const KNOWN_USERS_KEPT = 3000;
const CONTACTS_KEPT = 300;

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
  lastError?: string;
  connectedAt?: string;
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

export function maskPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '••••';
  return `${phone.startsWith('+') ? '+' : ''}${digits.slice(0, 3)}••••${digits.slice(-3)}`;
}

export function statusOf(rec: TelegramAccountRecord, staffName: string): TelegramAccountStatus {
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
    matched: contacts.filter((c) => c.logId).length,
  };
}

/** Status for every salesperson in the Round Robin team. */
export async function listAccountStatuses(): Promise<TelegramAccountStatus[]> {
  const rr = await getRoundRobinSettings();
  return Promise.all(rr.staffList.map(async (s) => statusOf(await getAccountRecord(s.id), s.name)));
}

/** True when at least one salesperson's account is connected (then clicks carry a reference code). */
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
}

export interface AccountClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  saveSession(): string;
  sendCode(phone: string): Promise<{ phoneCodeHash: string }>;
  /** Throws { needsPassword: true } when the account has two-step verification. */
  signIn(phone: string, phoneCodeHash: string, code: string): Promise<void>;
  checkPassword(password: string): Promise<void>;
  getMe(): Promise<{ id: string; username?: string; name?: string }>;
  recentDialogs(limit: number): Promise<DialogPeek[]>;
  logOut(): Promise<void>;
}

export class NeedsPasswordError extends Error {
  constructor() {
    super('SESSION_PASSWORD_NEEDED');
    this.name = 'NeedsPasswordError';
  }
}

async function realClient(apiId: number, apiHash: string, session: string): Promise<AccountClient> {
  // Everything comes from the package's main export: a sub-path import ('telegram/sessions')
  // can load a second copy of the library, whose classes fail the client's own checks
  // ("Only StringSession and StoreSessions are supported").
  const tg = await import('telegram');
  const { TelegramClient, Api, sessions, password } = tg;
  const computeCheck = password.computeCheck;
  const client = new TelegramClient(new sessions.StringSession(session), apiId, apiHash, { connectionRetries: 2, useWSS: false });
  client.setLogLevel('none' as Parameters<typeof client.setLogLevel>[0]);
  const fullName = (u: { firstName?: string; lastName?: string }) => [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || undefined;
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
        out.push({
          userId: u.id.toString(),
          username: u.username || undefined,
          name: fullName(u),
          isBot: Boolean(u.bot),
          isSelf: Boolean(u.self),
          lastIncoming: Boolean(m) && !m!.out,
          lastAtMs: m ? Number(m.date) * 1000 : 0,
          lastText: m?.message || '',
        });
      }
      return out;
    },
    logOut: async () => {
      await client.invoke(new Api.auth.LogOut());
    },
  };
}

/**
 * Test double: the "account" lives in a JSON file (TELEGRAM_ACCOUNT_MOCK_FILE) that a
 * test writes chats into. Code 12345 logs in; 22222 asks for the password "secret".
 */
async function mockClient(session: string): Promise<AccountClient> {
  const fs = await import('node:fs/promises');
  const file = process.env.TELEGRAM_ACCOUNT_MOCK_FILE || '';
  const read = async (): Promise<{ me?: { id: string; username?: string; name?: string }; dialogs?: DialogPeek[] }> => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      return {};
    }
  };
  let state = session || 'fresh';
  return {
    connect: async () => undefined,
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
    recentDialogs: async () => (await read()).dialogs || [],
    logOut: async () => undefined,
  };
}

async function clientFor(rec: TelegramAccountRecord, session: string): Promise<AccountClient> {
  if (process.env.TELEGRAM_ACCOUNT_MOCK === '1') return mockClient(session);
  if (!rec.apiId || !rec.apiHash) throw new Error('API ID and API hash are missing');
  return realClient(rec.apiId, rec.apiHash, session);
}

const errText = (err: unknown): string => {
  const e = err as { errorMessage?: string; message?: string };
  return (e?.errorMessage || e?.message || String(err)).slice(0, 200);
};

// ─── Login ─────────────────────────────────────────────────────────────────

export interface LoginInput {
  apiId: number;
  apiHash: string;
  phone: string;
}

/** Step 1: Telegram sends a code to the phone. */
export async function startLogin(staffId: string, input: LoginInput): Promise<TelegramAccountStatus> {
  const rec = await getAccountRecord(staffId);
  const phone = input.phone.replace(/[^\d+]/g, '');
  if (!/^\+?\d{8,15}$/.test(phone)) throw new Error('Enter the phone number with the country code, for example +855 12 345 678');
  if (!Number.isInteger(input.apiId) || input.apiId <= 0) throw new Error('The API ID is a number from my.telegram.org');
  // An empty hash keeps the one saved earlier (it is never sent back to the browser).
  const apiHash = input.apiHash.trim() || rec.apiHash || '';
  if (!/^[a-f0-9]{32}$/i.test(apiHash)) throw new Error('The API hash is 32 letters and digits from my.telegram.org');
  const next: TelegramAccountRecord = { ...rec, apiId: input.apiId, apiHash, phone, pending: undefined, lastError: undefined };
  const client = await clientFor(next, '');
  try {
    await client.connect();
    const { phoneCodeHash } = await client.sendCode(phone);
    next.pending = { session: client.saveSession(), phoneCodeHash, at: new Date().toISOString() };
  } catch (err) {
    next.lastError = errText(err);
    await saveAccountRecord(next);
    throw new Error(`Telegram did not accept the request: ${next.lastError}`);
  } finally {
    await client.disconnect();
  }
  await saveAccountRecord(next);
  return statusOf(next, '');
}

/** Step 2: the code from the phone (and the two-step password when the account has one). */
export async function finishLogin(staffId: string, code: string, password?: string): Promise<TelegramAccountStatus> {
  const rec = await getAccountRecord(staffId);
  if (!rec.pending || !rec.phone) throw new Error('Ask for a code first');
  if (Date.now() - Date.parse(rec.pending.at) > 15 * 60 * 1000) {
    rec.pending = undefined;
    await saveAccountRecord(rec);
    throw new Error('The code has expired. Ask for a new one.');
  }
  const client = await clientFor(rec, rec.pending.session);
  try {
    await client.connect();
    if (!rec.pending.needsPassword) {
      try {
        await client.signIn(rec.phone, rec.pending.phoneCodeHash, code.replace(/\D/g, ''));
      } catch (err) {
        if (err instanceof NeedsPasswordError) {
          rec.pending = { ...rec.pending, session: client.saveSession(), needsPassword: true };
          if (!password) {
            await saveAccountRecord(rec);
            return statusOf(rec, '');
          }
        } else {
          throw err;
        }
      }
    }
    if (rec.pending.needsPassword) {
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
    };
    await saveAccountRecord(next);
    return statusOf(next, '');
  } catch (err) {
    rec.lastError = errText(err);
    await saveAccountRecord(rec);
    throw new Error(`Login failed: ${rec.lastError}`);
  } finally {
    await client.disconnect();
  }
}

/** Logs the portal out of the account and forgets the session. The chats already matched stay. */
export async function disconnectAccount(staffId: string): Promise<TelegramAccountStatus> {
  const rec = await getAccountRecord(staffId);
  if (rec.session) {
    try {
      const client = await clientFor(rec, rec.session);
      await client.connect();
      await client.logOut().catch(() => undefined);
      await client.disconnect();
    } catch {
      // Already gone: forgetting the session is what matters.
    }
  }
  const next: TelegramAccountRecord = { ...rec, session: undefined, user: undefined, pending: undefined, lastError: undefined };
  await saveAccountRecord(next);
  return statusOf(next, '');
}

// ─── The check ─────────────────────────────────────────────────────────────

export interface CheckResult {
  staffId: string;
  skipped?: boolean;
  newContacts: number;
  matched: number;
  error?: string;
}

/** Reads the account's recent chats, records new contacts and matches them to clicks. */
export async function checkAccount(staffId: string, options: { force?: boolean; nowMs?: number } = {}): Promise<CheckResult> {
  const rec = await getAccountRecord(staffId);
  if (!rec.session || !rec.user) return { staffId, skipped: true, newContacts: 0, matched: 0 };
  const nowMs = options.nowMs ?? Date.now();
  if (!options.force && rec.lastCheckAt && nowMs - Date.parse(rec.lastCheckAt) < CHECK_EVERY_MS) return { staffId, skipped: true, newContacts: 0, matched: 0 };
  // Claim the slot first so two servers do not both check.
  const since = rec.lastCheckAt ? Date.parse(rec.lastCheckAt) : nowMs - CHECK_EVERY_MS;
  rec.lastCheckAt = new Date(nowMs).toISOString();
  await saveAccountRecord(rec);

  const client = await clientFor(rec, rec.session);
  let dialogs: DialogPeek[];
  try {
    await client.connect();
    dialogs = await client.recentDialogs(RECENT_DIALOGS);
    rec.session = client.saveSession();
  } catch (err) {
    rec.lastError = errText(err);
    await saveAccountRecord(rec);
    return { staffId, newContacts: 0, matched: 0, error: rec.lastError };
  } finally {
    await client.disconnect();
  }

  const known = new Set(rec.knownUserIds || []);
  const contacts = [...(rec.contacts || [])];
  const seenKey = new Set(contacts.map((c) => `${c.userId}:${c.at}`));
  let added = 0;
  for (const d of dialogs) {
    if (d.isBot || d.isSelf || !d.lastIncoming || !d.lastAtMs) continue;
    const isNew = !known.has(d.userId);
    // A known customer sending a fresh reference code also counts: they clicked again.
    const freshRef = !isNew && d.lastAtMs > since - 60_000 && Boolean(refCodeIn(d.lastText));
    known.add(d.userId);
    if (!isNew && !freshRef) continue;
    const at = new Date(d.lastAtMs).toISOString();
    if (seenKey.has(`${d.userId}:${at}`)) continue;
    contacts.unshift({ staffId, at, userId: d.userId, username: d.username, name: d.name, text: d.lastText.slice(0, 200) });
    added += 1;
  }

  // Match to clicks and leads.
  const logs = await getRoundRobinLogs(500);
  const matches = matchContactsToLogs(logs.filter((l) => l.staffId === staffId), contacts, new Date(nowMs).toISOString());
  if (matches.length) {
    const byLog = new Map(matches.map((m) => [m.logId, m.confirmation]));
    await updateRoundRobinLogs((all) => all.map((l) => (byLog.has(l.id) && !l.contact ? { ...l, contact: byLog.get(l.id) } : l)));
    for (const m of matches) {
      const c = contacts.find((x) => x.userId === m.contact.userId && x.at === m.contact.at);
      if (c) c.logId = m.logId;
    }
    const logById = new Map(logs.map((l) => [l.id, l]));
    await Promise.allSettled(matches.map((m) => {
      const log = logById.get(m.logId);
      return log ? alertChatStarted(log, m.confirmation) : Promise.resolve();
    }));
  }

  rec.knownUserIds = Array.from(known).slice(-KNOWN_USERS_KEPT);
  rec.contacts = contacts.slice(0, CONTACTS_KEPT);
  rec.lastError = undefined;
  await saveAccountRecord(rec);
  return { staffId, newContacts: added, matched: matches.length };
}

/**
 * Tells the salesperson (and the manager, when CC is on) that the customer behind a
 * click has now written: who they are and what they asked. Short and in Khmer.
 */
async function alertChatStarted(log: RoundRobinLog, c: { at: string; name?: string; username?: string; text?: string; match: 'ref' | 'time' }): Promise<void> {
  if (log.demo) return;
  const [rr, settings] = await Promise.all([getRoundRobinSettings(), getSettings()]);
  const token = settings.telegramBotToken;
  if (!token) return;
  const staff = rr.staffList.find((s) => s.id === log.staffId);
  const who = [c.name, c.username ? `(@${c.username})` : ''].filter(Boolean).join(' ') || 'អតិថិជន';
  const text = [
    c.match === 'ref' ? '✅ <b>អតិថិជនបានផ្ញើសារមកអ្នកហើយ</b>' : '✅ <b>អតិថិជនបានផ្ញើសារមកអ្នកហើយ</b> (ប្រហែលពីការចុចនេះ)',
    `👤 ${escapeHtml(who)}`,
    `📌 សេវា៖ <b>${escapeHtml(log.pageTitle || log.pageSlug)}</b>`,
    c.text ? `💬 “${escapeHtml(c.text.slice(0, 120))}${c.text.length > 120 ? '…' : ''}”` : '',
    `⏰ ${phnomPenhStamp(Date.parse(c.at))}`,
    '👉 សូមឆ្លើយឥឡូវ!',
  ].filter(Boolean).join('\n');
  const send = (chatId: string) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    }).then(readTelegramResponse).catch(() => undefined);
  const tasks: Promise<unknown>[] = [];
  if (staff?.telegramChatId) tasks.push(send(staff.telegramChatId));
  const manager = rr.managerChatId || settings.telegramChatId;
  if (rr.enableManagerNotification && manager && String(manager) !== String(staff?.telegramChatId)) {
    tasks.push(send(manager));
  }
  await Promise.allSettled(tasks);
}

/** Checks every connected account (throttled). Never throws. */
export async function checkAllAccounts(options: { force?: boolean } = {}): Promise<CheckResult[]> {
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
export async function checkAllAccountsWithin(ms: number): Promise<CheckResult[]> {
  return Promise.race([
    checkAllAccounts(),
    new Promise<CheckResult[]>((resolve) => setTimeout(() => resolve([]), ms)),
  ]);
}
