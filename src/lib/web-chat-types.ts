/**
 * Live chat on the website: types and pure helpers shared by the widget, the
 * admin inbox and the server. No storage or network here.
 */

export type WebChatSide = 'visitor' | 'staff' | 'system';

export interface WebChatMessage {
  id: string;
  from: WebChatSide;
  text: string;
  /** ISO time. */
  at: string;
  /** Who answered: the salesperson's name, or "Admin". */
  by?: string;
}

export interface WebChatSummary {
  id: string;
  /** Short code shown in Telegram so a reply can be matched: #WC-XXXXXX. */
  code: string;
  pageSlug: string;
  pageTitle: string;
  lang: 'en' | 'kh';
  visitorName: string;
  visitorPhone?: string;
  staffId?: string;
  staffName?: string;
  leadId?: string;
  status: 'open' | 'closed';
  createdAt: string;
  lastAt: string;
  lastFrom: WebChatSide;
  lastText: string;
  /** Visitor messages the team has not opened in the inbox yet. */
  unreadForStaff: number;
  /** Staff messages the visitor has not seen yet. */
  unreadForVisitor: number;
  /** Messages each way. */
  fromVisitor: number;
  fromStaff: number;
  /** Seconds from the visitor's first message to the team's first answer. */
  firstReplySeconds?: number;
}

export interface WebChat extends WebChatSummary {
  /** Secret held by the visitor's browser; required to read or write the chat. */
  token: string;
  messages: WebChatMessage[];
  /** Where the visitor came from (campaign, referrer, device), for the lead. */
  visitor?: Record<string, string | undefined>;
  visitorIp?: string;
  userAgent?: string;
  /** Telegram chat that receives the visitor's messages, and the ids of those messages. */
  telegramChatId?: string;
  telegramMessageIds?: number[];
  /** Salesperson's first reply time is measured from the first visitor message. */
}

/** What the visitor's browser receives: no token echo, no internal ids. */
export interface WebChatView {
  id: string;
  status: WebChat['status'];
  staffName?: string;
  visitorName: string;
  messages: WebChatMessage[];
  /** Server time of this answer (ISO), to ask only for newer messages next time. */
  now: string;
}

export const WEB_CHAT_CODE_RE = /#WC-([A-Z0-9]{6})\b/i;
export const MAX_MESSAGE_CHARS = 1000;
export const MAX_MESSAGES_KEPT = 400;

/** The code for a chat id, as printed in Telegram: #WC-XXXXXX. */
export function webChatCode(id: string): string {
  return `#WC-${id.slice(-6).toUpperCase()}`;
}

/** The chat code inside a Telegram message, normalised, or undefined. */
export function webChatCodeIn(text: string | undefined | null): string | undefined {
  const m = WEB_CHAT_CODE_RE.exec(text || '');
  return m ? `#WC-${m[1].toUpperCase()}` : undefined;
}

/** Recomputes the counts on a chat from its messages. */
export function summarize(chat: Pick<WebChat, 'messages'> & Partial<Pick<WebChatSummary, 'unreadForStaff' | 'unreadForVisitor'>>): Pick<WebChatSummary, 'lastAt' | 'lastFrom' | 'lastText' | 'fromVisitor' | 'fromStaff' | 'firstReplySeconds'> {
  const msgs = chat.messages;
  const last = msgs[msgs.length - 1];
  let fromVisitor = 0;
  let fromStaff = 0;
  let firstVisitorAt: string | undefined;
  let firstReplySeconds: number | undefined;
  for (const m of msgs) {
    if (m.from === 'visitor') {
      fromVisitor += 1;
      if (!firstVisitorAt) firstVisitorAt = m.at;
    } else if (m.from === 'staff') {
      fromStaff += 1;
      if (firstVisitorAt && firstReplySeconds === undefined) firstReplySeconds = Math.max(0, Math.round((Date.parse(m.at) - Date.parse(firstVisitorAt)) / 1000));
    }
  }
  return {
    lastAt: last?.at || new Date(0).toISOString(),
    lastFrom: last?.from || 'system',
    lastText: (last?.text || '').slice(0, 120),
    fromVisitor,
    fromStaff,
    firstReplySeconds,
  };
}

/** Greeting and labels of the visitor widget, in the page's language. */
export const WIDGET_TEXT = {
  en: {
    open: 'Chat with us',
    title: 'Chat with our team',
    online: 'We reply here and by phone',
    greeting: 'Hello! Ask us anything about this trip. A member of our sales team answers you here.',
    name: 'Your name',
    phone: 'Phone or Telegram (optional, so we can reach you if you leave)',
    message: 'Type your message…',
    send: 'Send',
    start: 'Start chat',
    sent: 'Sent. Our team will answer here; keep this page open or come back later.',
    you: 'You',
    team: 'KHB Events',
    closed: 'This chat is closed. Start a new one any time.',
    newChat: 'New chat',
    error: 'Could not send. Please try again.',
    poweredBy: 'Replies also reach you by phone if you left a number.',
  },
  kh: {
    open: 'ជជែកជាមួយយើង',
    title: 'ជជែកជាមួយក្រុមយើង',
    online: 'យើងឆ្លើយនៅទីនេះ និងតាមទូរស័ព្ទ',
    greeting: 'សួស្តី! សួរអ្វីក៏បានអំពីដំណើរនេះ។ បុគ្គលិកផ្នែកលក់យើងឆ្លើយអ្នកនៅទីនេះ។',
    name: 'ឈ្មោះរបស់អ្នក',
    phone: 'ទូរស័ព្ទ ឬ Telegram (ស្រេចចិត្ត ដើម្បីទាក់ទងអ្នកបើអ្នកចាកចេញ)',
    message: 'វាយសាររបស់អ្នក…',
    send: 'ផ្ញើ',
    start: 'ចាប់ផ្តើមជជែក',
    sent: 'បានផ្ញើ។ ក្រុមយើងនឹងឆ្លើយនៅទីនេះ សូមបើកទំព័រនេះចោល ឬត្រឡប់មកវិញពេលក្រោយ។',
    you: 'អ្នក',
    team: 'KHB Events',
    closed: 'ការជជែកនេះបានបិទ។ ចាប់ផ្តើមថ្មីបានគ្រប់ពេល។',
    newChat: 'ជជែកថ្មី',
    error: 'មិនអាចផ្ញើបានទេ។ សូមព្យាយាមម្តងទៀត។',
    poweredBy: 'ចម្លើយក៏ទៅដល់អ្នកតាមទូរស័ព្ទផងដែរ បើអ្នកទុកលេខ។',
  },
} as const;
