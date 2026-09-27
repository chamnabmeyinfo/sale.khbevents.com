/**
 * Live chat on the website (server side).
 *
 * A visitor opens the chat window on a landing page and writes. The chat is
 * routed to a salesperson with the same Round Robin rules as a Telegram click,
 * a CRM lead is made, and each visitor message is sent to the salesperson's
 * Telegram by the company bot. The salesperson answers by replying to that
 * Telegram message (the webhook matches the #WC-XXXXXX code), or from the admin
 * inbox; the visitor's browser polls and shows the answer.
 *
 * Storage: one JSON row per chat (`webchat:<id>`) and an index row
 * (`webchat_index`) in system_settings; no migration needed.
 */
import { createLeadFromWebChat, getMarker, getPageBySlug, getRealLeads, getRoundRobinSettings, getSettings, phnomPenhStamp, setMarker, updateRoundRobinSettings } from './storage';
import { saveLeadChanges } from './lead-followup';
import { chatStatsFrom } from './contact-verify';
import { countAssignment, escapeHtml, readTelegramResponse, rememberedStaff, selectNextStaff } from './round-robin';
import type { RoundRobinStaff, VisitorDetail } from './types';
import { MAX_MESSAGES_KEPT, MAX_MESSAGE_CHARS, summarize, webChatCode, type WebChat, type WebChatMessage, type WebChatSummary, type WebChatView } from './web-chat-types';

const INDEX_ROW = 'webchat_index';
const rowId = (id: string) => `webchat:${id}`;
const INDEX_KEPT = 400;
const ADMIN_URL = 'https://sale.khbevents.com/admin/chats';

const rand = (n: number) => {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < n; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

async function readIndex(): Promise<WebChatSummary[]> {
  const raw = await getMarker(INDEX_ROW);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeIndex(list: WebChatSummary[]): Promise<void> {
  await setMarker(INDEX_ROW, JSON.stringify(list.slice(0, INDEX_KEPT)));
}

function toSummary(chat: WebChat): WebChatSummary {
  const { id, code, pageSlug, pageTitle, lang, visitorName, visitorPhone, staffId, staffName, leadId, status, createdAt, unreadForStaff, unreadForVisitor } = chat;
  return { id, code, pageSlug, pageTitle, lang, visitorName, visitorPhone, staffId, staffName, leadId, status, createdAt, unreadForStaff, unreadForVisitor, ...summarize(chat) };
}

async function saveChat(chat: WebChat): Promise<void> {
  chat.messages = chat.messages.slice(-MAX_MESSAGES_KEPT);
  Object.assign(chat, summarize(chat));
  await setMarker(rowId(chat.id), JSON.stringify(chat));
  const index = await readIndex();
  const i = index.findIndex((c) => c.id === chat.id);
  const summary = toSummary(chat);
  if (i >= 0) index[i] = summary;
  else index.unshift(summary);
  index.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  await writeIndex(index);
}

export async function getWebChat(id: string): Promise<WebChat | null> {
  if (!/^wc_[a-z0-9]{10,}$/.test(id)) return null;
  const raw = await getMarker(rowId(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WebChat;
  } catch {
    return null;
  }
}

/** The visitor's copy: only with the right token. */
export async function getWebChatForVisitor(id: string, token: string): Promise<WebChat | null> {
  const chat = await getWebChat(id);
  if (!chat || !token || chat.token !== token) return null;
  return chat;
}

export function viewFor(chat: WebChat, sinceIso?: string): WebChatView {
  const since = sinceIso ? Date.parse(sinceIso) : 0;
  return {
    id: chat.id,
    status: chat.status,
    staffName: chat.staffName,
    visitorName: chat.visitorName,
    messages: since ? chat.messages.filter((m) => Date.parse(m.at) > since) : chat.messages,
    now: new Date().toISOString(),
  };
}

export async function listWebChats(): Promise<WebChatSummary[]> {
  return readIndex();
}

export async function findWebChatByCode(code: string): Promise<WebChat | null> {
  const wanted = code.toUpperCase();
  const hit = (await readIndex()).find((c) => c.code.toUpperCase() === wanted);
  return hit ? getWebChat(hit.id) : null;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

// ─── Telegram delivery ─────────────────────────────────────────────────────

async function telegramSend(token: string, chatId: string, text: string, extra: Record<string, unknown> = {}): Promise<{ ok: boolean; messageId?: number; description?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra }),
    });
    const data = (await readTelegramResponse(res)) as { ok: boolean; description?: string; result?: { message_id?: number } };
    return { ok: Boolean(data.ok), messageId: data.result?.message_id, description: data.description };
  } catch (err) {
    return { ok: false, description: (err as Error).message };
  }
}

/** Sends a visitor's message to the salesperson (or the fallback chat) and remembers the Telegram message id. */
async function deliverToTelegram(chat: WebChat, msg: WebChatMessage, first: boolean): Promise<void> {
  const settings = await getSettings();
  const token = settings.telegramBotToken;
  if (!token || !chat.telegramChatId) return;
  const who = `${escapeHtml(chat.visitorName || 'Visitor')}${chat.visitorPhone ? ` · ${escapeHtml(chat.visitorPhone)}` : ''}`;
  const lines = first
    ? [
        `💬 <b>Live chat ថ្មីពីគេហទំព័រ</b> · ${escapeHtml(chat.pageTitle)}`,
        `👤 ${who}`,
        `💬 ${escapeHtml(msg.text)}`,
        `⏰ ${phnomPenhStamp(Date.parse(msg.at))}`,
        '',
        `↩️ <b>Reply</b> ទៅសារនេះដើម្បីឆ្លើយអតិថិជន (សាររបស់អ្នកបង្ហាញលើគេហទំព័រភ្លាម) · <code>${chat.code}</code>`,
      ]
    : [
        `💬 ${who} · ${escapeHtml(chat.pageTitle)}`,
        `💬 ${escapeHtml(msg.text)}`,
        `↩️ Reply ដើម្បីឆ្លើយ · <code>${chat.code}</code>`,
      ];
  const r = await telegramSend(token, chat.telegramChatId, lines.join('\n'), {
    reply_markup: { inline_keyboard: [[{ text: '📋 បើកក្នុង Admin', url: `${ADMIN_URL}?id=${encodeURIComponent(chat.id)}` }]] },
  });
  if (r.ok && r.messageId) chat.telegramMessageIds = [...(chat.telegramMessageIds || []), r.messageId].slice(-50);
  // Manager copy of the first message, when CC is on.
  if (first) {
    const rr = await getRoundRobinSettings();
    const manager = rr.managerChatId || settings.telegramChatId;
    if (rr.enableManagerNotification && manager && String(manager) !== String(chat.telegramChatId)) {
      await telegramSend(token, String(manager), `💬 <b>Live chat</b> → ${escapeHtml(chat.staffName || 'fallback')} · ${escapeHtml(chat.pageTitle)}\n👤 ${who}\n💬 ${escapeHtml(msg.text)}`);
    }
  }
}

// ─── Lead numbers ──────────────────────────────────────────────────────────

async function updateLeadFromChat(chat: WebChat): Promise<void> {
  if (!chat.leadId) return;
  const lead = (await getRealLeads()).find((l) => l.id === chat.leadId);
  if (!lead) return;
  const stats = chatStatsFrom(chat.messages.filter((m) => m.from !== 'system').map((m) => ({ out: m.from === 'staff', atMs: Date.parse(m.at) })), chat.unreadForStaff);
  if (chat.visitorPhone && !lead.phone) lead.phone = chat.visitorPhone;
  if (chat.visitorName && (!lead.fullName || lead.fullName === 'Visitor')) lead.fullName = chat.visitorName;
  if (lead.routing) lead.routing = { ...lead.routing, chat: stats };
  await saveLeadChanges(lead);
}

// ─── Visitor side ──────────────────────────────────────────────────────────

export interface StartWebChatInput {
  pageSlug: string;
  lang: 'en' | 'kh';
  name: string;
  phone?: string;
  text: string;
  visitor?: VisitorDetail;
  visitorIp?: string;
  userAgent?: string;
  /** Salesperson from the visitor's cookie (same person as an earlier click or form). */
  preferredStaffId?: string;
}

export interface StartWebChatResult {
  chat: WebChat;
  view: WebChatView;
  staff: RoundRobinStaff | null;
  rememberSeconds: number;
}

/** A visitor's first message: picks the salesperson, makes the lead, delivers to Telegram. */
export async function startWebChat(input: StartWebChatInput): Promise<StartWebChatResult> {
  const text = clean(input.text, MAX_MESSAGE_CHARS);
  if (!text) throw new Error('Message is empty');
  const name = clean(input.name, 80) || 'Visitor';
  const phone = clean(input.phone, 40) || undefined;
  const page = await getPageBySlug(input.pageSlug);
  const pageTitle = page?.title || input.pageSlug;
  const now = new Date().toISOString();

  // The salesperson: the one the visitor met before, else the rotation (someone the bot can reach).
  const rr = await getRoundRobinSettings();
  const settings = await getSettings();
  let staff: RoundRobinStaff | null = null;
  let rememberSeconds = 0;
  if (rr.enabled) {
    staff = rememberedStaff(rr, input.preferredStaffId, 'chatId');
    if (!staff) {
      const pick = selectNextStaff(rr, { need: settings.telegramBotToken ? 'chatId' : undefined, ctx: { pageSlug: input.pageSlug, nowMs: Date.now() } });
      if (pick) {
        staff = pick.staff;
        countAssignment(staff, Date.now());
        staff.lastAssignedAt = now;
        rr.lastAssignedIndex = pick.nextIndex;
        await updateRoundRobinSettings({ staffList: rr.staffList, lastAssignedIndex: pick.nextIndex }).catch(() => undefined);
      }
    }
    const months = rr.rememberVisitorMonths ?? 1;
    rememberSeconds = months > 0 ? months * 30 * 86400 : 0;
  }
  const telegramChatId = staff?.telegramChatId || rr.managerChatId || settings.telegramChatId || undefined;

  const id = `wc_${Date.now().toString(36)}${rand(6)}`;
  const first: WebChatMessage = { id: `m_${rand(8)}`, from: 'visitor', text, at: now };
  const chat: WebChat = {
    id,
    code: webChatCode(id),
    token: rand(24),
    pageSlug: input.pageSlug,
    pageTitle,
    lang: input.lang === 'kh' ? 'kh' : 'en',
    visitorName: name,
    visitorPhone: phone,
    staffId: staff?.id,
    staffName: staff?.name,
    status: 'open',
    createdAt: now,
    lastAt: now,
    lastFrom: 'visitor',
    lastText: text.slice(0, 120),
    unreadForStaff: 1,
    unreadForVisitor: 0,
    fromVisitor: 1,
    fromStaff: 0,
    messages: [first],
    visitor: input.visitor as Record<string, string | undefined> | undefined,
    visitorIp: input.visitorIp,
    userAgent: input.userAgent,
    telegramChatId: telegramChatId ? String(telegramChatId) : undefined,
    telegramMessageIds: [],
  };

  try {
    const lead = await createLeadFromWebChat({ chatId: id, code: chat.code, pageSlug: input.pageSlug, pageTitle, name, phone, firstMessage: text, staff, visitor: input.visitor, visitorIp: input.visitorIp, userAgent: input.userAgent, at: now });
    chat.leadId = lead.id;
  } catch (err) {
    console.error('Live chat lead error:', err);
  }
  await deliverToTelegram(chat, first, true);
  await saveChat(chat);
  if (chat.leadId) await updateLeadFromChat(chat).catch(() => undefined);
  return { chat, view: viewFor(chat), staff, rememberSeconds };
}

/** A further message from the visitor. */
export async function postVisitorMessage(id: string, token: string, rawText: string): Promise<WebChatView | null> {
  const chat = await getWebChatForVisitor(id, token);
  if (!chat) return null;
  const text = clean(rawText, MAX_MESSAGE_CHARS);
  if (!text) return viewFor(chat);
  const msg: WebChatMessage = { id: `m_${rand(8)}`, from: 'visitor', text, at: new Date().toISOString() };
  chat.messages.push(msg);
  chat.unreadForStaff += 1;
  if (chat.status === 'closed') chat.status = 'open';
  await deliverToTelegram(chat, msg, false);
  await saveChat(chat);
  await updateLeadFromChat(chat).catch(() => undefined);
  return viewFor(chat);
}

/** The visitor read the chat: staff messages are no longer unread for them. */
export async function markVisitorRead(chat: WebChat): Promise<void> {
  if (chat.unreadForVisitor) {
    chat.unreadForVisitor = 0;
    await saveChat(chat);
  }
}

// ─── Team side ─────────────────────────────────────────────────────────────

/** An answer from the team, from the inbox or from a Telegram reply. */
export async function postStaffMessage(id: string, rawText: string, by: string, options: { staffId?: string } = {}): Promise<WebChat | null> {
  const chat = await getWebChat(id);
  if (!chat) return null;
  const text = clean(rawText, MAX_MESSAGE_CHARS);
  if (!text) return chat;
  const msg: WebChatMessage = { id: `m_${rand(8)}`, from: 'staff', text, at: new Date().toISOString(), by };
  chat.messages.push(msg);
  chat.unreadForVisitor += 1;
  chat.unreadForStaff = 0;
  if (options.staffId && !chat.staffId) {
    chat.staffId = options.staffId;
    chat.staffName = by;
  }
  await saveChat(chat);
  await updateLeadFromChat(chat).catch(() => undefined);
  return chat;
}

export async function markStaffRead(id: string): Promise<WebChat | null> {
  const chat = await getWebChat(id);
  if (!chat) return null;
  if (chat.unreadForStaff) {
    chat.unreadForStaff = 0;
    await saveChat(chat);
  }
  return chat;
}

export async function setWebChatStatus(id: string, status: WebChat['status'], by: string): Promise<WebChat | null> {
  const chat = await getWebChat(id);
  if (!chat) return null;
  chat.status = status;
  chat.messages.push({ id: `m_${rand(8)}`, from: 'system', text: status === 'closed' ? `closed by ${by}` : `reopened by ${by}`, at: new Date().toISOString(), by });
  await saveChat(chat);
  return chat;
}

/** The salesperson's Telegram reply to a live-chat message: text after the code goes to the visitor. */
export async function handleTelegramReply(input: { code: string; text: string; fromChatId: string; fromName: string }): Promise<{ ok: boolean; chat?: WebChat; reason?: string }> {
  const chat = await findWebChatByCode(input.code);
  if (!chat) return { ok: false, reason: 'unknown_chat' };
  // Only the chat that received the messages may answer (the salesperson's or the fallback chat).
  if (chat.telegramChatId && String(chat.telegramChatId) !== String(input.fromChatId)) return { ok: false, reason: 'wrong_chat' };
  const text = input.text.trim();
  if (/^\/close\b/i.test(text)) {
    const closed = await setWebChatStatus(chat.id, 'closed', input.fromName);
    return { ok: true, chat: closed || chat };
  }
  const rr = await getRoundRobinSettings();
  const staff = rr.staffList.find((s) => String(s.telegramChatId) === String(input.fromChatId));
  const updated = await postStaffMessage(chat.id, text, staff?.name || chat.staffName || input.fromName, { staffId: staff?.id });
  return { ok: Boolean(updated), chat: updated || undefined };
}
