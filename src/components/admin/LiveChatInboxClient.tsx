'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, MessageCircle, RefreshCw, RotateCcw, Send, X } from 'lucide-react';
import type { WebChat, WebChatSummary } from '@/lib/web-chat-types';
import { useLanguage } from '@/context/LanguageContext';

const CARD = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs';
const SUB = 'text-[11px] text-slate-500 dark:text-gray-400';
const POLL_MS = 5000;
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

type SafeChat = Omit<WebChat, 'token'>;

/**
 * Admin → Live chat inbox: every website chat, the conversation, a reply box,
 * close/reopen, and the on/off switch for the widget. The salesperson can also
 * answer from Telegram; both paths land here.
 */
export default function LiveChatInboxClient({ initialId }: { initialId?: string }) {
  const { t } = useLanguage();
  const [chats, setChats] = useState<WebChatSummary[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [staff, setStaff] = useState<Array<{ id: string; name: string; hasChatId: boolean }>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialId || null);
  const [chat, setChat] = useState<SafeChat | null>(null);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/admin', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || t('chats.err.load'));
      setChats(json.chats);
      setEnabled(json.enabled);
      setStaff(json.staff || []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [t]);
  const loadChat = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/admin?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) setChat(json.chat);
    } catch {}
  }, []);

  useEffect(() => {
    const first = window.setTimeout(() => { void loadList(); if (selectedId) void loadChat(selectedId); }, 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void loadList();
      if (selectedId) void loadChat(selectedId);
    }, POLL_MS);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [loadList, loadChat, selectedId]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [chat?.messages.length, selectedId]);

  const select = (id: string) => {
    setSelectedId(id);
    setChat(null);
    void loadChat(id);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('id', id);
      window.history.replaceState(null, '', u.toString());
    } catch {}
  };

  const act = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    // The switch flips at once; the server confirms (or the list reload corrects it).
    if (body.action === 'toggle') setEnabled(body.enabled !== false);
    try {
      const res = await fetch('/api/chat/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || t('chats.err.action'));
      if (json.chat) setChat(json.chat);
      if (body.action === 'toggle') setEnabled(Boolean(json.enabled));
      void loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chat || !reply.trim()) return;
    const by = staff.find((s) => s.id === chat.staffId)?.name || 'Admin';
    await act({ action: 'reply', id: chat.id, text: reply.trim(), by });
    setReply('');
  };

  const visible = useMemo(() => chats.filter((c) => filter === 'all' || c.status === 'open'), [chats, filter]);
  const waiting = chats.filter((c) => c.status === 'open' && c.lastFrom === 'visitor').length;

  return (
    <div className="pa-root space-y-4 max-w-7xl mx-auto pb-24" data-live-chat-inbox="">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2"><MessageCircle className="w-5 h-5 text-emerald-600" />{t('chats.title')}</h1>
          <p className={SUB}>{t('chats.subtitle')}</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-gray-200 cursor-pointer">
          <input type="checkbox" checked={enabled} disabled={busy} onChange={(e) => act({ action: 'toggle', enabled: e.target.checked })} />
          {enabled ? t('chats.on') : t('chats.off')}
        </label>
      </div>
      {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">{error}</div>}
      {staff.length > 0 && staff.every((s) => !s.hasChatId) && <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">{t('chats.noChatIds')}</div>}

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
              {visible.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => select(c.id)} className={`w-full text-left py-2.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-emerald-950/40 cursor-pointer ${selectedId === c.id ? 'bg-slate-100 dark:bg-emerald-950/60' : ''}`} data-chat-item={c.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{c.visitorName}</span>
                      <span className={`${SUB} pa-num shrink-0`}>{when(c.lastAt)}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-gray-300 truncate">{c.lastFrom === 'staff' ? '↩ ' : ''}{c.lastText}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                      <span className="text-slate-500 dark:text-gray-400 truncate">{c.pageTitle}</span>
                      {c.staffName && <span className="text-slate-500 dark:text-gray-400">· {c.staffName}</span>}
                      {c.status === 'closed' ? <span className="px-1.5 rounded-full border border-slate-300 dark:border-emerald-800 text-slate-500">{t('chats.closed')}</span>
                        : c.lastFrom === 'visitor' ? <span className="px-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">{t('chats.needsReply')}</span>
                        : null}
                      {c.unreadForStaff > 0 && <span className="px-1.5 rounded-full bg-rose-500 text-[#fff] font-black">{c.unreadForStaff}</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${CARD} p-4 min-h-[300px] flex flex-col`}>
          {!selectedId ? <p className={SUB}>{t('chats.pick')}</p> : !chat ? <div className={`${SUB} flex items-center gap-1.5`}><Loader2 className="w-3.5 h-3.5 animate-spin" />{t('chats.loading')}</div> : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-emerald-900/50">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">{chat.visitorName}{chat.visitorPhone ? <span className="ml-2 font-mono text-xs text-emerald-700 dark:text-emerald-300">{chat.visitorPhone}</span> : null}</div>
                  <div className={SUB}>{chat.pageTitle} · {chat.staffName || t('chats.noStaff')} · {chat.code} · {when(chat.createdAt)}</div>
                  <div className={`${SUB} pa-num`}>{t('chats.stats', { v: chat.fromVisitor, s: chat.fromStaff })}{chat.firstReplySeconds !== undefined ? ` · ${t('chats.firstReply', { s: chat.firstReplySeconds < 60 ? `${chat.firstReplySeconds}s` : `${Math.round(chat.firstReplySeconds / 60)} min` })}` : ''}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {chat.leadId && <Link href={`/admin/leads?id=${encodeURIComponent(chat.leadId)}`} className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-xs font-bold text-slate-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950">{t('chats.openLead')}</Link>}
                  <button type="button" onClick={() => loadChat(chat.id)} className="p-1.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-slate-600 dark:text-emerald-300 cursor-pointer" aria-label={t('chats.refresh')}><RefreshCw className="w-3.5 h-3.5" /></button>
                  {chat.status === 'open'
                    ? <button type="button" disabled={busy} onClick={() => act({ action: 'close', id: chat.id })} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-xs font-bold text-slate-700 dark:text-gray-200 cursor-pointer"><X className="w-3.5 h-3.5" />{t('chats.close')}</button>
                    : <button type="button" disabled={busy} onClick={() => act({ action: 'reopen', id: chat.id })} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-xs font-bold text-slate-700 dark:text-gray-200 cursor-pointer"><RotateCcw className="w-3.5 h-3.5" />{t('chats.reopen')}</button>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-2 max-h-[55vh]" data-chat-thread="">
                {chat.messages.map((m) => m.from === 'system' ? (
                  <div key={m.id} className="text-center text-[10px] text-slate-400">{m.text} · {when(m.at)}</div>
                ) : (
                  <div key={m.id} className={`flex ${m.from === 'staff' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words ${m.from === 'staff' ? 'bg-emerald-600 text-[#fff] on-dark rounded-br-sm' : 'bg-slate-100 dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/50 text-slate-900 dark:text-white rounded-bl-sm'}`}>
                      {m.from === 'staff' && m.by && <div className="text-[10px] font-bold opacity-90 mb-0.5">{m.by}</div>}
                      {m.text}
                      <div className={`text-[9px] mt-0.5 text-right pa-num ${m.from === 'staff' ? 'text-emerald-100' : 'text-slate-400'}`}>{when(m.at)}</div>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <form onSubmit={sendReply} className="flex items-end gap-2 pt-3 border-t border-slate-200 dark:border-emerald-900/50">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} maxLength={1000} placeholder={t('chats.replyPh')} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-white dark:bg-[#06100B] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit(); } }} />
                <button type="submit" disabled={busy || !reply.trim()} className="h-9 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50">
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}{t('chats.send')}
                </button>
              </form>
              <p className={`${SUB} mt-2 flex items-center gap-1`}><CheckCircle2 className="w-3 h-3" />{t('chats.footnote')}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
