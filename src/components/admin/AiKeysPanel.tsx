'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, Star, XCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type Provider = 'anthropic' | 'gemini';

interface KeyStatus {
  provider: Provider;
  set: boolean;
  source: 'settings' | 'env' | null;
  last4?: string;
  updatedAt?: string;
  envName: string;
  primary: boolean;
}

const CARD = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6 space-y-3 shadow-sm';
const INPUT = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-400';
const BTN = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

function ProviderCard({ status, busy, onAction }: { status: KeyStatus; busy: boolean; onAction: (action: 'save' | 'remove' | 'test', key?: string) => Promise<{ ok: boolean; message: string }> }) {
  const { t } = useLanguage();
  const [key, setKey] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const p = status.provider;
  const run = async (action: 'save' | 'remove' | 'test') => {
    if (action === 'remove' && !confirm(t('ai.keys.removeConfirm'))) return;
    const r = await onAction(action, action === 'save' ? key : undefined);
    setResult(r);
    if (action === 'save' && r.ok) setKey('');
  };
  return (
    <div className={CARD} data-ai-key={p}>
      <div className="flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            {t(`ai.keys.${p}.title`)}
            {status.primary && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold" data-ai-key-primary-badge=""><Star className="w-3 h-3" />{t('ai.keys.primaryBadge')}</span>}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">{t(`ai.keys.${p}.uses`)}</p>
        </div>
      </div>
      <p className={`text-xs font-bold flex items-center gap-1.5 ${status.set ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`} data-ai-key-status="">
        {status.set ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        {!status.set
          ? t('ai.keys.notSet')
          : status.source === 'settings'
            ? t('ai.keys.fromSettings', { last4: status.last4 || '' })
            : t('ai.keys.fromEnv', { env: status.envName, last4: status.last4 || '' })}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={p === 'anthropic' ? 'sk-ant-…' : 'AIza…'}
          aria-label={t(`ai.keys.${p}.title`)}
          className={INPUT}
          data-ai-key-input=""
        />
        <button type="button" disabled={busy || !key.trim()} onClick={() => void run('save')} className={`${BTN} bg-amber-400 hover:bg-amber-300 text-black shrink-0`} data-ai-key-save="">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}{t('ai.keys.save')}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !status.set} onClick={() => void run('test')} className={`${BTN} bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-300`} data-ai-key-test="">
          {t('ai.keys.test')}
        </button>
        {status.source === 'settings' && (
          <button type="button" disabled={busy} onClick={() => void run('remove')} className={`${BTN} text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60`} data-ai-key-remove="">
            {t('ai.keys.remove')}
          </button>
        )}
      </div>
      {result && (
        <p className={`text-xs ${result.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`} role="status" data-ai-key-result="">{result.message}</p>
      )}
      <p className="text-[11px] text-slate-500 dark:text-gray-400">{t(`ai.keys.${p}.how`)}</p>
    </div>
  );
}

/** Which AI the text features ask first; the other one, when it has a key, is the back-up. */
function PrimaryCard({ keys, busy, onPick }: { keys: KeyStatus[]; busy: boolean; onPick: (p: Provider) => void }) {
  const { t } = useLanguage();
  const primary = keys.find((k) => k.primary) || keys[0];
  const backup = keys.find((k) => k.provider !== primary.provider);
  const note = !primary.set
    ? backup?.set ? t('ai.keys.primaryNoKeyBackup', { primary: t(`ai.keys.${primary.provider}.title`), backup: t(`ai.keys.${backup.provider}.title`) }) : t('ai.keys.primaryNone')
    : backup?.set ? t('ai.keys.primaryWithBackup', { backup: t(`ai.keys.${backup.provider}.title`) }) : t('ai.keys.primaryNoBackup');
  return (
    <div className={CARD} data-ai-primary="">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('ai.keys.primaryTitle')}</h3>
      <p className="text-[11px] text-slate-500 dark:text-gray-400">{t('ai.keys.primaryIntro')}</p>
      <div className="flex flex-col sm:flex-row gap-2" role="radiogroup" aria-label={t('ai.keys.primaryTitle')}>
        {keys.map((k) => (
          <label key={k.provider} className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${k.primary ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-emerald-900/60 text-slate-700 dark:text-gray-300'}`}>
            <input type="radio" name="ai-primary" checked={k.primary} disabled={busy} onChange={() => onPick(k.provider)} className="accent-amber-500" data-ai-primary-option={k.provider} />
            <span>{t(`ai.keys.${k.provider}.title`)}</span>
            <span className={`ml-auto text-[10px] font-normal ${k.set ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>{k.set ? t('ai.keys.hasKey') : t('ai.keys.noKeyShort')}</span>
          </label>
        ))}
      </div>
      <p className={`text-xs ${primary.set ? 'text-slate-600 dark:text-gray-300' : 'text-amber-700 dark:text-amber-400'}`} data-ai-primary-note="">{note}</p>
      <p className="text-[11px] text-slate-500 dark:text-gray-400">{t('ai.keys.primaryVoice')}</p>
    </div>
  );
}

/** Settings → AI & API keys: the keys every AI feature uses. Keys are never shown again after saving. */
export default function AiKeysPanel() {
  const { t } = useLanguage();
  const [keys, setKeys] = useState<KeyStatus[] | null>(null);
  const [busy, setBusy] = useState<Provider | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/settings/ai', { cache: 'no-store' });
    const json = await res.json().catch(() => null);
    if (json?.success) setKeys(json.keys);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const act = async (provider: Provider, action: 'save' | 'remove' | 'test' | 'primary', key?: string) => {
    setBusy(provider);
    try {
      const res = await fetch('/api/settings/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, action, key }) });
      const json = await res.json().catch(() => ({}));
      if (json?.keys) setKeys(json.keys);
      if (action === 'remove') return { ok: Boolean(json?.success), message: json?.success ? t('ai.keys.removed') : json?.error || t('ai.keys.failed') };
      return { ok: Boolean(json?.success), message: json?.message || json?.error || t('ai.keys.failed') };
    } catch {
      return { ok: false, message: t('ai.keys.failed') };
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className={CARD}>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('ai.keys.heading')}</h2>
        <p className="text-xs text-slate-600 dark:text-gray-300">{t('ai.keys.intro')}</p>
        <p className="text-[11px] text-slate-500 dark:text-gray-400">{t('ai.keys.safety')}</p>
      </div>
      {!keys ? (
        <p className="text-xs text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('ai.keys.loading')}</p>
      ) : (
        <>
        <PrimaryCard keys={keys} busy={busy !== null} onPick={(p) => void act(p, 'primary')} />
        <div className="grid lg:grid-cols-2 gap-4">
          {keys.map((k) => <ProviderCard key={k.provider} status={k} busy={busy === k.provider} onAction={(action, key) => act(k.provider, action, key)} />)}
        </div>
        </>
      )}
    </div>
  );
}
