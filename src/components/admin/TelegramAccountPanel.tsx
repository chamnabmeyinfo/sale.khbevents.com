'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, LogOut, MessageCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import type { TelegramAccountStatus } from '@/lib/telegram-account';
import { useLanguage } from '@/context/LanguageContext';

const CARD = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6 shadow-sm';
const BTN = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const INPUT = 'w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-sm focus:border-amber-400 focus:outline-none';
const SUB = 'text-[11px] text-slate-500 dark:text-gray-400';

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

/**
 * Admin → Settings & Security → Telegram account check. Each salesperson connects
 * their own Telegram account once (API ID and hash from my.telegram.org, phone
 * number, login code, two-step password if any). The portal then reads the account's
 * new chats and matches them to the clicks on Team performance.
 */
export default function TelegramAccountPanel() {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<TelegramAccountStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [mock, setMock] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [form, setForm] = useState<Record<string, { apiId: string; apiHash: string; phone: string; code: string; password: string }>>({});

  const field = (staffId: string) => form[staffId] || { apiId: '', apiHash: '', phone: '', code: '', password: '' };
  const setField = (staffId: string, k: string, v: string) => setForm((f) => ({ ...f, [staffId]: { ...field(staffId), [k]: v } }));

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/telegram-account', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t('tga.err.load'));
      setAccounts(data.accounts);
      setMock(Boolean(data.mock));
      setForm((f) => {
        const next = { ...f };
        for (const a of data.accounts as TelegramAccountStatus[]) if (!next[a.staffId]) next[a.staffId] = { apiId: a.apiId ? String(a.apiId) : '', apiHash: '', phone: '', code: '', password: '' };
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (staffId: string, action: string, extra: Record<string, unknown> = {}) => {
    setBusy(`${staffId}:${action}`);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/telegram-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ staffId, action, ...extra }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t('tga.err.action'));
      if (data.account) setAccounts((list) => list.map((a) => (a.staffId === staffId ? { ...data.account, staffName: a.staffName } : a)));
      if (action === 'check' && data.result) setNotice(t('tga.checked', { n: data.result.newContacts, m: data.result.matched }));
      if (action === 'verify' && data.account?.connected) {
        setNotice(t('tga.connectedNotice', { user: data.account.user?.username ? `@${data.account.user.username}` : data.account.user?.name || '' }));
        setField(staffId, 'code', '');
        setField(staffId, 'password', '');
        setField(staffId, 'apiHash', '');
      }
      if (action === 'start') setNotice(t('tga.codeSent'));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-4" data-telegram-account-panel="">
      <div className={CARD}>
        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{t('tga.title')}</h2>
            <p className="text-xs text-slate-600 dark:text-gray-300 mt-1">{t('tga.intro')}</p>
            <ol className="text-xs text-slate-600 dark:text-gray-300 mt-2 list-decimal pl-4 space-y-1">
              <li>{t('tga.step1')} <a href="https://my.telegram.org/apps" target="_blank" rel="noreferrer" className="underline font-semibold">my.telegram.org/apps</a></li>
              <li>{t('tga.step2')}</li>
              <li>{t('tga.step3')}</li>
            </ol>
            <p className={`${SUB} mt-2`}>{t('tga.privacy')}</p>
            {mock && <p className="mt-2 text-[11px] font-bold text-violet-700 dark:text-violet-300">{t('tga.mock')}</p>}
          </div>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2"><ShieldAlert className="w-4 h-4 shrink-0" />{error}</div>}
      {notice && <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{notice}</div>}

      {loading ? (
        <div className={`${CARD} flex items-center gap-2 text-xs text-slate-500`}><Loader2 className="w-4 h-4 animate-spin" />{t('tga.loading')}</div>
      ) : accounts.length === 0 ? (
        <div className={`${CARD} text-xs text-slate-600 dark:text-gray-300`}>{t('tga.noStaff')}</div>
      ) : accounts.map((a) => {
        const f = field(a.staffId);
        const isBusy = (k: string) => busy === `${a.staffId}:${k}`;
        return (
          <div key={a.staffId} className={CARD} data-account={a.staffId}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">{a.staffName}</div>
                {a.connected ? (
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">{t('tga.status.connected', { user: a.user?.username ? `@${a.user.username}` : a.user?.name || a.user?.id || '', phone: a.phoneMasked || '' })}</div>
                ) : a.pending ? (
                  <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">{a.needsPassword ? t('tga.status.password') : t('tga.status.codeSent', { phone: a.phoneMasked || '' })}</div>
                ) : (
                  <div className="text-xs text-slate-500 dark:text-gray-400">{t('tga.status.off')}</div>
                )}
                {a.lastError && !a.connected && <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">{a.lastError}</div>}
              </div>
              {a.connected && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={`${BTN} bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-slate-700 dark:text-emerald-300`} disabled={Boolean(busy)} onClick={() => act(a.staffId, 'check')}>
                    {isBusy('check') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}{t('tga.checkNow')}
                  </button>
                  <button type="button" className={`${BTN} border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300`} disabled={Boolean(busy)} onClick={() => { if (window.confirm(t('tga.disconnectConfirm'))) void act(a.staffId, 'disconnect'); }}>
                    {isBusy('disconnect') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}{t('tga.disconnect')}
                  </button>
                </div>
              )}
            </div>

            {a.connected ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                <div><div className={SUB}>{t('tga.since')}</div><div className="font-semibold text-slate-900 dark:text-white pa-num">{when(a.connectedAt)}</div></div>
                <div><div className={SUB}>{t('tga.lastCheck')}</div><div className="font-semibold text-slate-900 dark:text-white pa-num">{when(a.lastCheckAt) || '–'}</div></div>
                <div><div className={SUB}>{t('tga.newChats')}</div><div className="font-semibold text-slate-900 dark:text-white pa-num">{a.contactsFound}</div></div>
                <div><div className={SUB}>{t('tga.matched')}</div><div className="font-semibold text-slate-900 dark:text-white pa-num">{a.matched}</div></div>
                {a.lastError && <div className="col-span-full text-[11px] text-rose-700 dark:text-rose-300">{t('tga.lastError')}: {a.lastError}</div>}
              </div>
            ) : a.pending ? (
              <form className="mt-3 grid sm:grid-cols-3 gap-3 items-end" onSubmit={(e) => { e.preventDefault(); void act(a.staffId, 'verify', { code: f.code, password: f.password || undefined }); }}>
                {!a.needsPassword && (
                  <label className="block text-xs">
                    <span className="font-bold text-slate-700 dark:text-gray-200">{t('tga.code')}</span>
                    <input className={`${INPUT} mt-1`} inputMode="numeric" autoComplete="one-time-code" value={f.code} onChange={(e) => setField(a.staffId, 'code', e.target.value)} placeholder="12345" required />
                  </label>
                )}
                <label className="block text-xs">
                  <span className="font-bold text-slate-700 dark:text-gray-200">{a.needsPassword ? t('tga.passwordRequired') : t('tga.password')}</span>
                  <input className={`${INPUT} mt-1`} type="password" autoComplete="off" value={f.password} onChange={(e) => setField(a.staffId, 'password', e.target.value)} required={a.needsPassword} />
                </label>
                <div className="flex gap-2">
                  <button type="submit" className={`${BTN} bg-amber-400 text-black`} disabled={Boolean(busy)}>{isBusy('verify') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}{t('tga.verify')}</button>
                  <button type="button" className={`${BTN} border border-slate-200 dark:border-emerald-800 text-slate-600 dark:text-gray-300`} disabled={Boolean(busy)} onClick={() => act(a.staffId, 'disconnect')}>{t('tga.cancel')}</button>
                </div>
              </form>
            ) : (
              <form className="mt-3 grid sm:grid-cols-4 gap-3 items-end" onSubmit={(e) => { e.preventDefault(); void act(a.staffId, 'start', { apiId: Number(f.apiId), apiHash: f.apiHash, phone: f.phone }); }}>
                <label className="block text-xs">
                  <span className="font-bold text-slate-700 dark:text-gray-200">{t('tga.apiId')}</span>
                  <input className={`${INPUT} mt-1`} inputMode="numeric" value={f.apiId} onChange={(e) => setField(a.staffId, 'apiId', e.target.value)} placeholder="1234567" required />
                </label>
                <label className="block text-xs">
                  <span className="font-bold text-slate-700 dark:text-gray-200">{t('tga.apiHash')}</span>
                  <input className={`${INPUT} mt-1`} type="password" autoComplete="off" value={f.apiHash} onChange={(e) => setField(a.staffId, 'apiHash', e.target.value)} placeholder={a.hasApiHash ? '••••••••' : ''} required={!a.hasApiHash} />
                </label>
                <label className="block text-xs">
                  <span className="font-bold text-slate-700 dark:text-gray-200">{t('tga.phone')}</span>
                  <input className={`${INPUT} mt-1`} inputMode="tel" value={f.phone} onChange={(e) => setField(a.staffId, 'phone', e.target.value)} placeholder="+855 12 345 678" required />
                </label>
                <button type="submit" className={`${BTN} bg-amber-400 text-black justify-center`} disabled={Boolean(busy)}>{isBusy('start') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}{t('tga.sendCode')}</button>
              </form>
            )}
          </div>
        );
      })}
      <p className={SUB}>{t('tga.footnote')}</p>
    </div>
  );
}
