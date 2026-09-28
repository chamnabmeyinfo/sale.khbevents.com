'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { SUB } from './ui';

/** Writes to the clipboard; falls back to a hidden textarea where the async clipboard is blocked (in-app browsers). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** Copies `text` to the clipboard and says so for two seconds. Shared by the Ad Poster Kit and Gen Ads. */
export function CopyButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const { t } = useLanguage();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        }
      }}
      className={className || 'inline-flex items-center gap-1 min-h-8 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-emerald-950 text-[11px] font-bold text-slate-700 dark:text-emerald-300 cursor-pointer shrink-0'}
    >
      {done ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{done ? t('cp.copied') : label || t('cp.copy')}
    </button>
  );
}

export function PromptBox({ title, note, text, testId }: { title: string; note?: string; text: string; testId?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-emerald-900/60 p-3 space-y-2" data-poster-prompt={testId}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-900 dark:text-white">{title}</div>
          {note && <div className={SUB}>{note}</div>}
        </div>
        <CopyButton text={text} />
      </div>
      <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-[#06100B] rounded-lg p-2.5 max-h-56 overflow-y-auto font-sans">{text}</pre>
    </div>
  );
}
