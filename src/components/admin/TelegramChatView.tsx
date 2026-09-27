'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Paperclip, RefreshCw } from 'lucide-react';
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
export default function TelegramChatView({ leadId, staffName }: { leadId: string; staffName?: string }) {
  const { t } = useLanguage();
  const [data, setData] = useState<LeadConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1" role="log" aria-live="polite">
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
      <p className="text-[10px] text-slate-500 dark:text-gray-400">{t('leads.chat.footnote')}</p>
    </div>
  );
}
