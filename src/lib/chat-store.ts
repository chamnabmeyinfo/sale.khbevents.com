/**
 * The stored conversation of each Telegram chat lead: every message both ways,
 * with the text of voice messages once transcribed. One JSON row per lead
 * (`chat:<leadId>` in system_settings, or the local file), newest 500 messages.
 *
 * Why store it (owner decision, 2026-09-27): the AI coach reads the whole story
 * of a customer to say where they stand and what to do next, and a salesperson
 * can read a chat even when the account is busy or the tab is off. Admin only.
 */
import { getMarker, setMarker } from './storage';

export type TranscriptStatus = 'pending' | 'done' | 'failed';

export interface ChatRecord {
  /** Telegram's message id in that chat. */
  id: number;
  out: boolean;
  atMs: number;
  text: string;
  media?: 'photo' | 'video' | 'voice' | 'audio' | 'sticker' | 'file' | 'other';
  /** Seconds, for voice and audio. */
  duration?: number;
  /** What was said in a voice message, once turned into text. */
  transcript?: string;
  tstatus?: TranscriptStatus;
  /** Why the transcript failed, short. */
  terror?: string;
}

export interface StoredChat {
  leadId: string;
  staffId: string;
  messages: ChatRecord[];
  updatedAt: string;
}

export const CHAT_KEPT = 500;
const rowId = (leadId: string) => `chat:${leadId}`;

export async function getStoredChat(leadId: string): Promise<StoredChat | null> {
  const raw = await getMarker(rowId(leadId));
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as StoredChat;
    return v && Array.isArray(v.messages) ? v : null;
  } catch {
    return null;
  }
}

/** Merges fresh messages into the stored chat (by Telegram id), keeping transcripts already made. */
export function mergeChat(existing: StoredChat | null, leadId: string, staffId: string, fresh: Array<Omit<ChatRecord, 'transcript' | 'tstatus' | 'terror'>>, nowIso = new Date().toISOString()): StoredChat {
  const byId = new Map<number, ChatRecord>((existing?.messages || []).map((m) => [m.id, m]));
  for (const m of fresh) {
    const old = byId.get(m.id);
    const rec: ChatRecord = { ...old, id: m.id, out: m.out, atMs: m.atMs, text: m.text, media: m.media, duration: m.duration };
    if (rec.media === undefined) delete rec.media;
    if (rec.duration === undefined) delete rec.duration;
    if ((rec.media === 'voice' || rec.media === 'audio') && !rec.tstatus) rec.tstatus = 'pending';
    byId.set(m.id, rec);
  }
  const messages = Array.from(byId.values()).sort((a, b) => a.atMs - b.atMs || a.id - b.id).slice(-CHAT_KEPT);
  return { leadId, staffId, messages, updatedAt: nowIso };
}

export async function saveStoredChat(chat: StoredChat): Promise<void> {
  await setMarker(rowId(chat.leadId), JSON.stringify(chat));
}

/** Stores fresh messages for a lead and returns the merged chat. */
export async function recordChatMessages(leadId: string, staffId: string, fresh: Array<Omit<ChatRecord, 'transcript' | 'tstatus' | 'terror'>>): Promise<StoredChat> {
  const existing = await getStoredChat(leadId);
  const merged = mergeChat(existing, leadId, staffId, fresh);
  if (!existing || JSON.stringify(existing.messages) !== JSON.stringify(merged.messages)) await saveStoredChat(merged);
  return merged;
}

/** Voice or audio messages still waiting for their text, oldest first. */
export function pendingTranscripts(chat: StoredChat | null, limit: number): ChatRecord[] {
  return (chat?.messages || []).filter((m) => m.tstatus === 'pending').slice(-limit);
}

/** The text a reader (or the AI) should see for a message: its text, or what the voice said. */
export function spokenText(m: ChatRecord): string {
  if (m.transcript) return m.text ? `${m.text}\n${m.transcript}` : m.transcript;
  return m.text;
}
