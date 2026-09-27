'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageCircle } from 'lucide-react';
import type { InboxRow, LeadConversation } from '@/lib/telegram-account';
import { useLanguage } from '@/context/LanguageContext';
import TelegramChatView from './TelegramChatView';
import StaffAvatar from './StaffAvatar';

const CARD = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs';
const SUB = 'text-[11px] text-slate-500 dark:text-gray-400';
const POLL_MS = 15000;
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

/**
 * Admin → Telegram inbox: every Telegram customer (one lead each), the live
 * conversation read through the salesperson's connected account (TelegramChatView
 * keeps it fresh while on screen), and a reply box that sends from that account.
 */
export default function LiveChatInboxClient({ initialId }: { initialId?: string }) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [selected, setSelected] = useState<string | null>(initialId || null);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/admin', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || t('chats.err.load'));
      setRows(json.chats);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useEffect(() => {
    const first = window.setTimeout(() => { void load(); }, 0);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, POLL_MS);
    // Back from another tab: refresh the list right away.
    const onVisibility = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.clearTimeout(first); window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); };
  }, [load]);

  /** The open chat just read fresh numbers: show them in its row now, not at the next list poll. */
  const onChatChanged = useCallback((c: LeadConversation) => {
    setRows((list) => list
      .map((r) => (r.leadId === c.leadId ? { ...r, lastAt: c.stats.lastAt || r.lastAt, lastFrom: c.stats.lastFrom ?? r.lastFrom, fromCustomer: c.stats.fromCustomer, fromUs: c.stats.fromUs, unread: c.stats.unread } : r))
      .sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || '')));
  }, []);

  const select = (id: string) => {
    setSelected(id);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('id', id);
      window.history.replaceState(null, '', u.toString());
    } catch {}
  };

  const visible = useMemo(() => rows.filter((r) => filter === 'all' || (r.status !== 'WON' && r.status !== 'LOST')), [rows, filter]);
  const waiting = rows.filter((r) => r.lastFrom === 'customer' && r.status !== 'WON' && r.status !== 'LOST').length;
  const current = rows.find((r) => r.leadId === selected);
  const someNotConnected = rows.some((r) => !r.connected);

  return (
    <div className="pa-root space-y-4 max-w-7xl mx-auto pb-24" data-telegram-inbox="">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2"><MessageCircle className="w-5 h-5 text-sky-600" />{t('chats.title')}</h1>
        <p className={SUB}>{t('chats.subtitle')}</p>
      </div>
      {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">{error}</div>}
      {someNotConnected && <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">{t('chats.notConnectedHint')} <Link href="/admin/settings#tgaccount" className="underline font-bold">Settings</Link></div>}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        <div className={`${CARD} p-3 min-h-[300px]`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-emerald-950/60 border border-slate-200 dark:border-emerald-900/60">
              {(['open', 'all'] as const).map((f) => (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${filter === f ? 'bg-amber-400 text-black' : 'text-slate-600 dark:text-gray-400'}`}>{f === 'open' ? t('chats.filter.open') : t('chats.filter.all')}</button>
              ))}
            </div>
            <span className={`${SUB} pa-num`}>{t('chats.waiting', { n: waiting })}</span>
          </div>
          {loading ? <div className={`${SUB} flex items-center gap-1.5`}><Loader2 className="w-3.5 h-3.5 animate-spin" />{t('chats.loading')}</div> : visible.length === 0 ? <p className={SUB}>{t('chats.empty')}</p> : (
            <ul className="divide-y divide-slate-100 dark:divide-emerald-950/60 max-h-[70vh] overflow-y-auto">
              {visible.map((r) => (
                <li key={r.leadId}>
                  <button type="button" onClick={() => select(r.leadId)} className={`w-full text-left py-2.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-emerald-950/40 cursor-pointer ${selected === r.leadId ? 'bg-slate-100 dark:bg-emerald-950/60' : ''}`} data-inbox-item={r.leadId}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{r.name}{r.username ? <span className="ml-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300">@{r.username}</span> : null}</span>
                      <span className={`${SUB} pa-num shrink-0`}>{when(r.lastAt)}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-gray-300 truncate">{r.firstMessage || ''}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                      <span className="text-slate-500 dark:text-gray-400 truncate">{r.pageTitle}</span>
                      <span className="text-slate-500 dark:text-gray-400 inline-flex items-center gap-1">· <StaffAvatar name={r.staffName} size={14} /> {r.staffName}</span>
                      <span className="text-slate-500 dark:text-gray-400 pa-num">· {t('chats.stats', { c: r.fromCustomer, u: r.fromUs })}</span>
                      {r.lastFrom === 'customer' && r.status !== 'WON' && r.status !== 'LOST' && <span className="px-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">{t('chats.needsReply')}</span>}
                      {!r.connected && <span className="px-1.5 rounded-full border border-slate-300 dark:border-emerald-800 text-slate-500">{t('chats.notConnected')}</span>}
                      <span className="px-1.5 rounded-full border border-slate-200 dark:border-emerald-900 text-slate-500">{r.status}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${CARD} p-4 min-h-[300px]`}>
          {!selected || !current ? <p className={SUB}>{t('chats.pick')}</p> : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">{current.name}{current.username ? <span className="ml-2 text-xs font-semibold text-sky-700 dark:text-sky-300">@{current.username}</span> : null}</div>
                  <div className={SUB}>{current.pageTitle} · {current.staffName} · {when(current.createdAt)} · {current.status}</div>
                </div>
                <Link href={`/admin/leads?id=${encodeURIComponent(current.leadId)}`} className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-xs font-bold text-slate-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950">{t('chats.openLead')}</Link>
              </div>
              <TelegramChatView key={current.leadId} leadId={current.leadId} staffName={current.staffName} canReply={current.connected} onChanged={onChatChanged} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
