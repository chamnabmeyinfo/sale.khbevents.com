'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { WIDGET_TEXT, type WebChatMessage, type WebChatView } from '@/lib/web-chat-types';

const STORE_KEY = 'khb_chat';
const POLL_OPEN_MS = 4000;
const POLL_CLOSED_MS = 20000;

interface Stored { id: string; token: string; name: string }

const readStore = (): Stored | null => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
};
const writeStore = (v: Stored | null) => {
  try {
    if (v) localStorage.setItem(STORE_KEY, JSON.stringify(v));
    else localStorage.removeItem(STORE_KEY);
  } catch {}
};
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Phnom_Penh' });

/**
 * The chat window on the landing pages. The first message opens a chat with a
 * salesperson (Round Robin); answers arrive here while the page is open, and
 * again when the visitor comes back in the same browser.
 */
export default function LiveChatWidget({ pageSlug, lang, enabled = true }: { pageSlug: string; pageTitle?: string; lang?: 'en' | 'kh'; enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [stored, setStored] = useState<Stored | null>(null);
  const [chat, setChat] = useState<WebChatView | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unread, setUnread] = useState(0);
  const [pageLang, setPageLang] = useState<'en' | 'kh'>(lang || 'en');
  const sinceRef = useRef<string | undefined>(undefined);
  const endRef = useRef<HTMLDivElement>(null);
  const T = WIDGET_TEXT[pageLang];

  // After hydration only (server and browser first render the same), so no mismatch.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setPageLang(lang || (document.documentElement.lang === 'kh' ? 'kh' : 'en'));
      const s = readStore();
      if (s) {
        setStored(s);
        setName(s.name);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [lang]);

  const merge = useCallback((view: WebChatView, replace: boolean) => {
    setChat((prev) => {
      if (replace || !prev) return view;
      const known = new Set(prev.messages.map((m) => m.id));
      const fresh = view.messages.filter((m) => !known.has(m.id));
      if (!open) setUnread((n) => n + fresh.filter((m) => m.from === 'staff').length);
      return { ...view, messages: [...prev.messages, ...fresh] };
    });
    sinceRef.current = view.now;
  }, [open]);

  const poll = useCallback(async (full = false) => {
    const s = stored;
    if (!s) return;
    try {
      const q = new URLSearchParams({ token: s.token });
      if (!full && sinceRef.current) q.set('since', sinceRef.current);
      const res = await fetch(`/api/chat/${encodeURIComponent(s.id)}?${q}`, { cache: 'no-store' });
      if (res.status === 404) {
        writeStore(null);
        setStored(null);
        setChat(null);
        return;
      }
      const json = await res.json();
      if (json.success) merge(json.chat, full);
    } catch {}
  }, [stored, merge]);

  useEffect(() => {
    if (!stored) return;
    const first = window.setTimeout(() => { void poll(true); }, 0);
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') void poll(); }, open ? POLL_OPEN_MS : POLL_CLOSED_MS);
    return () => { window.clearTimeout(first); window.clearInterval(id); };
  }, [stored, open, poll]);
  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => setUnread(0), 0);
      endRef.current?.scrollIntoView({ block: 'end' });
      return () => window.clearTimeout(id);
    }
  }, [open, chat?.messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError('');
    try {
      if (!stored) {
        if (!name.trim()) throw new Error(T.name);
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageSlug, lang: pageLang, name: name.trim(), phone: phone.trim(), text: body }) });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || T.error);
        const s: Stored = { id: json.id, token: json.token, name: name.trim() };
        writeStore(s);
        setStored(s);
        merge(json.chat, true);
      } else {
        const res = await fetch(`/api/chat/${encodeURIComponent(stored.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: stored.token, text: body }) });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || T.error);
        merge(json.chat, true);
      }
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : T.error);
    } finally {
      setBusy(false);
    }
  };

  const startNew = () => {
    writeStore(null);
    setStored(null);
    setChat(null);
    sinceRef.current = undefined;
  };

  if (!enabled) return null;
  const messages: WebChatMessage[] = chat?.messages.filter((m) => m.from !== 'system') || [];

  return (
    <div className="fixed bottom-6 left-4 sm:left-6 z-50 flex flex-col items-start gap-2" data-live-chat="" lang={pageLang}>
      {open && (
        <div className="w-[min(92vw,360px)] max-h-[70vh] flex flex-col rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 shadow-2xl overflow-hidden" role="dialog" aria-label={T.title}>
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-emerald-700 text-[#fff]">
            <div>
              <div className="text-sm font-extrabold">{T.title}</div>
              <div className="text-[11px] opacity-90">{chat?.staffName ? `${chat.staffName} · ${T.online}` : T.online}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/15 cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 text-sm bg-slate-50 dark:bg-[#06100B]" data-live-chat-messages="">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 text-slate-800 dark:text-gray-100 text-xs leading-relaxed">{T.greeting}</div>
            </div>
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words ${m.from === 'visitor' ? 'bg-emerald-600 text-[#fff] rounded-br-sm' : 'bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 text-slate-800 dark:text-gray-100 rounded-bl-sm'}`}>
                  {m.from === 'staff' && <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">{m.by || T.team}</div>}
                  {m.text}
                  <div className={`text-[9px] mt-0.5 text-right ${m.from === 'visitor' ? 'text-emerald-100' : 'text-slate-400'}`}>{timeOf(m.at)}</div>
                </div>
              </div>
            ))}
            {stored && messages.length > 0 && messages[messages.length - 1].from === 'visitor' && (
              <div className="text-[10px] text-slate-500 dark:text-gray-400 text-center px-2">{T.sent}</div>
            )}
            {chat?.status === 'closed' && (
              <div className="text-[10px] text-slate-500 dark:text-gray-400 text-center px-2">{T.closed} <button type="button" onClick={startNew} className="underline font-semibold cursor-pointer">{T.newChat}</button></div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="border-t border-slate-200 dark:border-emerald-900/60 p-2.5 space-y-2 bg-white dark:bg-[#0A1610]">
            {!stored && (
              <div className="grid grid-cols-1 gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={T.name} required maxLength={80} autoComplete="name" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-white dark:bg-[#06100B] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={T.phone} maxLength={40} inputMode="tel" autoComplete="tel" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-white dark:bg-[#06100B] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500" />
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={T.message} rows={2} maxLength={1000} required className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-white dark:bg-[#06100B] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 resize-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit(); } }} />
              <button type="submit" disabled={busy || !text.trim()} className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[#fff] text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50" aria-label={stored ? T.send : T.start}>
                <Send className="w-3.5 h-3.5" />{stored ? T.send : T.start}
              </button>
            </div>
            {error && <div className="text-[11px] text-rose-600 dark:text-rose-300">{error}</div>}
            {!stored && <div className="text-[10px] text-slate-500 dark:text-gray-400">{T.poweredBy}</div>}
          </form>
        </div>
      )}

      <button type="button" onClick={() => setOpen((o) => !o)} className="relative inline-flex items-center gap-2 h-12 pl-3 pr-4 rounded-full bg-emerald-700 hover:bg-emerald-600 text-[#fff] text-sm font-extrabold shadow-xl shadow-emerald-900/30 cursor-pointer" aria-expanded={open} data-live-chat-button="">
        <MessageCircle className="w-5 h-5" />
        <span>{T.open}</span>
        {unread > 0 && !open && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-[10px] font-black flex items-center justify-center">{unread}</span>}
      </button>
    </div>
  );
}
