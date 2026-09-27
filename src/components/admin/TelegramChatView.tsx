'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Paperclip, RefreshCw, Send } from 'lucide-react';
import type { LeadConversation } from '@/lib/telegram-account';
import { formatWait } from '@/lib/lead-response';
import { useLanguage } from '@/context/LanguageContext';

const REFRESH_MS = 30_000;
const time = (ms: number) => new Date(ms).toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const dayOf = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { timeZone: 'Asia/Phnom_Penh', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/**
 * The live Telegram conversation behind a chat lead, read through the salesperson's
 * connected account each time it opens (and every 30 s while open). Read only:
 * the salesperson answers from their own Telegram.
 */
export default function TelegramChatView({ leadId, staffName, canReply = true, compact = false }: { leadId: string; staffName?: string; /** Show the reply box (sends from the salesperson's connected account). */ canReply?: boolean; /** Taller thread for the inbox. */ compact?: boolean }) {
  const { t } = useLanguage();
  const [data, setData] = useState<LeadConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/chat`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || t('leads.chat.err'));
      setData(json.conversation);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [leadId, t]);

  useEffect(() => {
    const first = window.setTimeout(() => { void load(); }, 0);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load(true); }, REFRESH_MS);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [data?.messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, by: 'Admin' }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || t('leads.chat.sendFailed'));
      setData(json.conversation);
      setReply('');
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : String(e2));
    } finally {
      setSending(false);
    }
  };

  const stats = data?.stats;
  return (
    <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/20 p-3.5 space-y-2" data-telegram-chat="">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-800 dark:text-sky-300">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{t('leads.chat.title', { staff: data?.staffName || staffName || '' })}</span>
        </div>
        <div className="flex items-center gap-2">
          {data && <span className="text-[10px] text-slate-500 dark:text-gray-400 pa-num">{t('leads.chat.readAt', { at: time(Date.parse(data.readAt)) })}</span>}
          <button type="button" onClick={() => load()} disabled={loading} className="p-1 rounded-lg border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950 cursor-pointer disabled:opacity-50" title={t('leads.chat.refresh')} aria-label={t('leads.chat.refresh')}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
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
        <div className={`${compact ? 'max-h-[420px]' : 'max-h-[60vh]'} overflow-y-auto space-y-1.5 pr-1`} role="log" aria-live="polite">
          {data.messages.map((m, i) => {
            const prev = data.messages[i - 1];
            const newDay = !prev || dayOf(prev.atMs) !== dayOf(m.atMs);
            return (
              <React.Fragment key={m.id}>
                {newDay && <div className="text-center text-[10px] text-slate-400 dark:text-gray-500 py-1">{dayOf(m.atMs)}</div>}
                <div className={`flex ${m.out ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-xs leading-relaxed whitespace-pre-wrap break-words ${m.out ? 'bg-emerald-600 text-[#fff] on-dark rounded-br-sm' : 'bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 text-slate-900 dark:text-white rounded-bl-sm'}`}>
                    {m.media && (
                      <div className={`flex items-center gap-1 text-[10px] font-semibold ${m.out ? 'text-emerald-100' : 'text-slate-500 dark:text-gray-400'} ${m.text ? 'mb-0.5' : ''}`}>
                        <Paperclip className="w-3 h-3" />{t(`leads.chat.media.${m.media}`)}
                      </div>
                    )}
                    {m.text}
                    <div className={`text-[9px] mt-0.5 text-right pa-num ${m.out ? 'text-emerald-100' : 'text-slate-400 dark:text-gray-500'}`}>{time(m.atMs)}</div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={endRef} />
        </div>
      ) : null}
      {canReply && data && !data.error && (
        <form onSubmit={send} className="flex items-end gap-2 pt-1" data-telegram-reply="">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} maxLength={4000} placeholder={t('leads.chat.replyPh', { staff: data.staffName })} className="flex-1 px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-white dark:bg-[#06100B] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 resize-none"
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
