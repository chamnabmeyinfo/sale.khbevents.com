'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, Loader2, MessageCircle, Paperclip, RefreshCw, Send } from 'lucide-react';
import type { LeadConversation } from '@/lib/telegram-account';
import { formatWait } from '@/lib/lead-response';
import { BUSY_RETRY_MS, POLL_BACKOFF_MS, POLL_FAST_MS, POLL_FLOOR_MS, pollDelayMs } from '@/lib/telegram-chat-rules';
import { useLanguage } from '@/context/LanguageContext';

const time = (ms: number) => new Date(ms).toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const dayOf = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { timeZone: 'Asia/Phnom_Penh', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
/** After the tab comes back or the window is focused: look again, but not within this long of the last look. */
const WAKE_GAP_MS = 3_000;
/** The Refresh button is a manual look, at most this often. */
const MANUAL_GAP_MS = 2_000;
/** Telegram's wait can be long; look again at least this often to notice when it ends. */
const FLOOD_MAX_WAIT_MS = 5 * 60_000;

type LiveView = 'loading' | 'live' | 'paused' | 'busy' | 'flood' | 'error' | 'off';

const CHIP: Record<LiveView, string> = {
  loading: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-emerald-950/40 dark:text-gray-400 dark:border-emerald-900',
  live: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  paused: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-emerald-950/40 dark:text-gray-400 dark:border-emerald-900',
  busy: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  flood: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  error: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  off: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-emerald-950/40 dark:text-gray-400 dark:border-emerald-900',
};

interface Props {
  leadId: string;
  staffName?: string;
  /** Show the reply box (sends from the salesperson's connected account). */
  canReply?: boolean;
  /** Taller thread for the inbox. */
  compact?: boolean;
  /** Called after each successful read, so a list around the chat can update its row. */
  onChanged?: (conversation: LeadConversation) => void;
  /** Text put into the reply box from outside (the AI coach's suggested reply); a new `at` applies it again. */
  draft?: { text: string; at: number };
}

/**
 * The live Telegram conversation behind a chat lead, read through the salesperson's
 * connected account while it is on screen.
 *
 * Live without risk to the account: one request at a time, only while the tab is
 * visible (an immediate look when it comes back), every 8 s around a fresh
 * conversation and up to 60 s around an old one, backing off when the server says
 * busy, waiting when Telegram asked to, and stopping when the account is not
 * connected. Unchanged chats cost one cheap probe: the server sends no messages back.
 */
export default function TelegramChatView({ leadId, staffName, canReply = true, compact = false, onChanged, draft }: Props) {
  const { t } = useLanguage();
  const [data, setData] = useState<LeadConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState<{ view: LiveView; until?: string }>({ view: 'loading' });
  const [newBelow, setNewBelow] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const stickToBottom = useRef(true);
  const cursor = useRef<{ since?: number; unread?: number }>({});
  const inFlight = useRef<AbortController | null>(null);
  const timer = useRef<number | null>(null);
  const failures = useRef(0);
  const typedAt = useRef(0);
  const lastStart = useRef(0);
  const lastManual = useRef(0);
  const stopped = useRef(false);
  const loadRef = useRef<(manual?: boolean) => Promise<void>>(async () => undefined);
  const onChangedRef = useRef(onChanged);
  useEffect(() => { onChangedRef.current = onChanged; }, [onChanged]);
  useEffect(() => {
    if (!draft?.text) return;
    const id = window.setTimeout(() => { setReply(draft.text); typedAt.current = Date.now(); }, 0);
    return () => window.clearTimeout(id);
  }, [draft?.at, draft?.text]);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const viewing = () => document.visibilityState === 'visible' && document.hasFocus();

  /** Looks again after `ms`, unless the tab is hidden (then when it returns) or the account is off. */
  const next = useCallback((ms: number) => {
    clearTimer();
    if (stopped.current || ms <= 0) return;
    if (document.visibilityState !== 'visible') {
      setLive((l) => (l.view === 'off' ? l : { view: 'paused' }));
      return;
    }
    timer.current = window.setTimeout(() => { void loadRef.current(false); }, Math.max(1_000, ms));
  }, []);

  /** Merges what the server sent: an unchanged chat keeps its messages and takes the fresh numbers. */
  const apply = useCallback((c: LeadConversation) => {
    setData((prev) => (c.unchanged && prev
      ? { ...prev, stats: c.stats, readAt: c.readAt, live: c.live, unread: c.unread, lastMessageId: c.lastMessageId ?? prev.lastMessageId, autoSeen: c.autoSeen ?? prev.autoSeen, error: c.error }
      : c));
    if (c.live.state === 'ok') {
      cursor.current = { since: c.lastMessageId, unread: c.unread };
      onChangedRef.current?.(c);
    }
  }, []);

  const load = useCallback(async (manual = false) => {
    if (inFlight.current) return;
    const ctrl = new AbortController();
    inFlight.current = ctrl;
    lastStart.current = Date.now();
    setReading(true);
    let delay = POLL_FAST_MS;
    try {
      const q = new URLSearchParams();
      // A manual look reads everything again; the automatic ones ask "anything new since…?".
      if (!manual && cursor.current.since !== undefined) {
        q.set('since', String(cursor.current.since));
        if (cursor.current.unread !== undefined) q.set('unread', String(cursor.current.unread));
      }
      q.set('view', viewing() ? '1' : '0');
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/chat?${q.toString()}`, { cache: 'no-store', signal: ctrl.signal });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || t('leads.chat.err'));
      const c = json.conversation as LeadConversation;
      apply(c);
      switch (c.live.state) {
        case 'busy':
          failures.current = 0;
          setLive({ view: 'busy' });
          delay = c.live.retryInMs || BUSY_RETRY_MS;
          break;
        case 'flood':
          failures.current = 0;
          setLive({ view: 'flood', until: c.live.floodUntil });
          delay = Math.min(FLOOD_MAX_WAIT_MS, Math.max(POLL_FLOOR_MS, c.live.retryInMs ?? 60_000));
          break;
        case 'not_connected':
          stopped.current = true;
          setLive({ view: 'off' });
          delay = 0;
          break;
        case 'error':
          failures.current += 1;
          setLive({ view: 'error' });
          delay = POLL_BACKOFF_MS[Math.min(failures.current - 1, POLL_BACKOFF_MS.length - 1)];
          break;
        default:
          failures.current = 0;
          setError('');
          setLive({ view: 'live' });
          delay = pollDelayMs({ nowMs: Date.now(), lastMessageAtMs: c.stats.lastAt ? Date.parse(c.stats.lastAt) : undefined, typedAtMs: typedAt.current || undefined });
      }
    } catch (e) {
      if (ctrl.signal.aborted) return;
      failures.current += 1;
      setError(e instanceof Error ? e.message : String(e));
      setLive({ view: 'error' });
      delay = POLL_BACKOFF_MS[Math.min(failures.current - 1, POLL_BACKOFF_MS.length - 1)];
    } finally {
      if (inFlight.current === ctrl) inFlight.current = null;
      if (!ctrl.signal.aborted) {
        setReading(false);
        setLoading(false);
        next(delay);
      }
    }
  }, [leadId, t, apply, next]);
  useEffect(() => { loadRef.current = load; }, [load]);

  // First look, and the tab's comings and goings.
  useEffect(() => {
    stopped.current = false;
    const first = window.setTimeout(() => { void loadRef.current(false); }, 0);
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        clearTimer();
        setLive((l) => (l.view === 'off' ? l : { view: 'paused' }));
        return;
      }
      const wait = WAKE_GAP_MS - (Date.now() - lastStart.current);
      if (wait > 0) next(wait);
      else void loadRef.current(false);
    };
    const onFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastStart.current >= WAKE_GAP_MS) void loadRef.current(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearTimeout(first);
      clearTimer();
      inFlight.current?.abort();
      inFlight.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [leadId, next]);

  // New messages: follow them when the reader is at the bottom, otherwise offer a jump.
  const count = data?.messages.length ?? 0;
  const lastId = count ? data!.messages[count - 1].id : 0;
  useEffect(() => {
    const el = listRef.current;
    if (!el || !count) return;
    if (stickToBottom.current || nearBottom.current) {
      el.scrollTop = el.scrollHeight;
      stickToBottom.current = false;
      return;
    }
    const id = window.setTimeout(() => setNewBelow(true), 0);
    return () => window.clearTimeout(id);
  }, [lastId, count]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    nearBottom.current = near;
    if (near && newBelow) setNewBelow(false);
  };
  const jumpDown = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    nearBottom.current = true;
    setNewBelow(false);
  };

  const refresh = () => {
    const now = Date.now();
    if (now - lastManual.current < MANUAL_GAP_MS) return;
    lastManual.current = now;
    stopped.current = false;
    clearTimer();
    void load(true);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, by: 'Admin' }) });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (res.status === 409) throw new Error(t('leads.chat.busySend'));
        if (res.status === 429) throw new Error(json.floodUntil ? t('leads.chat.flood', { at: time(Date.parse(json.floodUntil)) }) : t('leads.chat.tooFast', { t: formatWait(Math.ceil((Number(json.retryInMs) || 2000) / 1000)) }));
        throw new Error(json.error || t('leads.chat.sendFailed'));
      }
      stickToBottom.current = true;
      apply(json.conversation as LeadConversation);
      setReply('');
      typedAt.current = Date.now();
      // A reply usually gets an answer soon: look often for a while.
      clearTimer();
      next(POLL_FAST_MS);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : String(e2));
    } finally {
      setSending(false);
    }
  };

  const stats = data?.stats;
  const chipLabel = live.view === 'flood' ? t('leads.chat.flood', { at: live.until ? time(Date.parse(live.until)) : '' }) : t(`leads.chat.state.${live.view}`);
  return (
    <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/20 p-3.5 space-y-2" data-telegram-chat="" data-live-state={live.view} data-last-id={lastId || undefined}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-sky-800 dark:text-sky-300">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{t('leads.chat.title', { staff: data?.staffName || staffName || '' })}</span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-bold ${CHIP[live.view]}`} data-live-chip="">
            {live.view === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />}
            {chipLabel}
          </span>
          {data && data.autoSeen !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${data.autoSeen ? 'border-sky-300 text-sky-800 dark:border-sky-800 dark:text-sky-300' : 'border-slate-300 text-slate-500 dark:border-emerald-900 dark:text-gray-400'}`} title={t('leads.chat.seenTitle')} data-seen={data.autoSeen ? 'on' : 'off'}>
              {data.autoSeen ? t('leads.chat.seenOn') : t('leads.chat.seenOff')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data && <span className="text-[10px] text-slate-500 dark:text-gray-400 pa-num">{t('leads.chat.readAt', { at: time(Date.parse(data.readAt)) })}</span>}
          <button type="button" onClick={refresh} disabled={reading} className="p-1 rounded-lg border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950 cursor-pointer disabled:opacity-50" title={t('leads.chat.refresh')} aria-label={t('leads.chat.refresh')}>
            {reading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {stats && (stats.fromCustomer || stats.fromUs) ? (
        <div className="text-[10px] text-slate-600 dark:text-gray-400 pa-num">
          {t('leads.chat.stats', { c: stats.fromCustomer, u: stats.fromUs })}
          {stats.firstReplySeconds !== undefined ? ` · ${t('leads.chat.firstReply', { t: formatWait(stats.firstReplySeconds) })}` : ''}
          {stats.lastFrom === 'customer' ? <span className="ml-1 font-bold text-amber-700 dark:text-amber-400">· {t('leads.chat.waiting')}</span> : null}
        </div>
      ) : null}

      {error && <div className="text-[11px] text-rose-700 dark:text-rose-300">{error}</div>}
      {data?.error === 'not_connected' && <div className="text-[11px] text-amber-800 dark:text-amber-300">{t('leads.chat.notConnected', { staff: data.staffName })}</div>}
      {data?.error && data.error !== 'not_connected' && <div className="text-[11px] text-rose-700 dark:text-rose-300">{t('leads.chat.readFailed')}: {data.error}</div>}

      {loading && !data ? (
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />{t('leads.chat.loading')}</div>
      ) : data && data.messages.length === 0 && !data.error ? (
        <div className="text-[11px] text-slate-500 dark:text-gray-400">{t('leads.chat.empty')}</div>
      ) : data && data.messages.length > 0 ? (
        <div className="relative">
          <div ref={listRef} onScroll={onScroll} className={`${compact ? 'max-h-[420px]' : 'max-h-[60vh]'} overflow-y-auto space-y-1.5 pr-1`} role="log" aria-live="polite">
            {data.messages.map((m, i) => {
              const prev = data.messages[i - 1];
              const newDay = !prev || dayOf(prev.atMs) !== dayOf(m.atMs);
              return (
                <React.Fragment key={m.id}>
                  {newDay && <div className="text-center text-[10px] text-slate-400 dark:text-gray-500 py-1">{dayOf(m.atMs)}</div>}
                  <div className={`flex ${m.out ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-xs leading-relaxed whitespace-pre-wrap break-words ${m.out ? 'bg-emerald-600 text-[#fff] on-dark rounded-br-sm' : 'bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 text-slate-900 dark:text-white rounded-bl-sm'}`}>
                      {m.media && (
                        <div className={`flex items-center gap-1 text-[10px] font-semibold ${m.out ? 'text-emerald-100' : 'text-slate-500 dark:text-gray-400'} ${m.text || m.transcript ? 'mb-0.5' : ''}`}>
                          <Paperclip className="w-3 h-3" />{t(`leads.chat.media.${m.media}`)}{m.duration ? <span className="pa-num"> · {m.duration}s</span> : null}
                          {(m.media === 'voice' || m.media === 'audio') && !m.transcript && m.tstatus === 'pending' ? <span className="italic font-normal"> · {t('leads.chat.voicePending')}</span> : null}
                          {(m.media === 'voice' || m.media === 'audio') && !m.transcript && m.tstatus === 'failed' ? <span className="italic font-normal"> · {t('leads.chat.voiceFailed')}</span> : null}
                        </div>
                      )}
                      {m.text}
                      {m.transcript && <div className={`italic ${m.text ? 'mt-0.5' : ''}`} data-transcript="">🎤 {m.transcript}</div>}
                      <div className={`text-[9px] mt-0.5 text-right pa-num ${m.out ? 'text-emerald-100' : 'text-slate-400 dark:text-gray-500'}`}>{time(m.atMs)}</div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {newBelow && (
            <button type="button" onClick={jumpDown} className="absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-600 text-[#fff] on-dark text-[10px] font-extrabold shadow cursor-pointer" data-new-messages="">
              <ArrowDown className="w-3 h-3" />{t('leads.chat.newMessages')}
            </button>
          )}
        </div>
      ) : null}
      {canReply && data && !data.error && (
        <form onSubmit={send} className="flex items-end gap-2 pt-1" data-telegram-reply="">
          <textarea value={reply} onChange={(e) => { setReply(e.target.value); typedAt.current = Date.now(); }} rows={2} maxLength={4000} placeholder={t('leads.chat.replyPh', { staff: data.staffName })} className="flex-1 px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-white dark:bg-[#06100B] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit(); } }} />
          <button type="submit" disabled={sending || !reply.trim()} className="h-9 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-[#fff] on-dark text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}{t('leads.chat.send')}
          </button>
        </form>
      )}
      <p className="text-[10px] text-slate-500 dark:text-gray-400">{t('leads.chat.footnote')}</p>
    </div>
  );
}
