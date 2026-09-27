'use client';

import React, { useEffect, useState } from 'react';
import { Copy, Download, Flame, Loader2, Sparkles } from 'lucide-react';
import type { StoredLeadInsight } from '@/lib/lead-ai';
import { useLanguage } from '@/context/LanguageContext';

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export const HEAT_CLASS: Record<'hot' | 'warm' | 'cold', string> = {
  hot: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  warm: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  cold: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
};

/** A small heat badge for lists (hot / warm / cold). */
export function HeatBadge({ heat, title }: { heat?: 'hot' | 'warm' | 'cold'; title?: string }) {
  const { t } = useLanguage();
  if (!heat) return null;
  return <span className={`px-1.5 rounded-full border font-bold ${HEAT_CLASS[heat]}`} title={title} data-heat={heat}>{heat === 'hot' ? '🔥 ' : ''}{t(`leads.ai.heat.${heat}`)}</span>;
}

/**
 * The AI coach on one lead: summary, heat, objections, next step, a reply to
 * copy, coaching. "Analyze now" reads the customer's story again. The story
 * itself can be downloaded as a Markdown file.
 */
export default function LeadInsightCard({ leadId, onHeat, onUseReply }: { leadId: string; /** Tells the parent the heat so a list can update its badge. */ onHeat?: (heat: 'hot' | 'warm' | 'cold') => void; /** Puts the suggested reply into the chat box. */ onUseReply?: (text: string) => void }) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<StoredLeadInsight | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/ai`, { cache: 'no-store', signal: ctrl.signal });
        const json = await res.json();
        if (json.success) { setData(json.insight); setConfigured(Boolean(json.configured)); }
      } catch {} finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 0);
    return () => { window.clearTimeout(id); ctrl.abort(); };
  }, [leadId]);

  const run = async () => {
    setRunning(true);
    setError('');
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: lang === 'kh' ? 'kh' : 'en' }) });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setConfigured(json.configured !== false);
        throw new Error(json.code === 'no_key' ? t('leads.ai.noKey') : json.error || t('leads.ai.failed'));
      }
      setData(json.insight);
      onHeat?.(json.insight.insight.heat);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); window.setTimeout(() => setCopied(''), 1500); } catch {}
  };

  const i = data?.insight;
  return (
    <div className="rounded-xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/60 dark:bg-violet-950/20 p-3.5 space-y-2 text-xs" data-lead-insight="">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-violet-800 dark:text-violet-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('leads.ai.title')}</span>
          {i && <HeatBadge heat={i.heat} title={i.heatReason} />}
          {i && <span className="text-[10px] font-semibold text-slate-500 dark:text-gray-400">{t(`leads.ai.confidence.${i.confidence}`)}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {data && <span className="text-[10px] text-slate-500 dark:text-gray-400 pa-num">{t('leads.ai.at', { at: when(data.generatedAt) })}</span>}
          <a href={`/api/leads/${encodeURIComponent(leadId)}/story?download=1`} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950 text-[10px] font-bold" title={t('leads.story.downloadHint')} data-story-download="">
            <Download className="w-3 h-3" />{t('leads.story.download')}
          </a>
          <button type="button" onClick={run} disabled={running || !configured} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-[#fff] on-dark text-[10px] font-extrabold cursor-pointer disabled:opacity-50" data-analyze="">
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}{running ? t('leads.ai.running') : data ? t('leads.ai.again') : t('leads.ai.run')}
          </button>
        </div>
      </div>

      {!configured && <div className="text-[11px] text-amber-800 dark:text-amber-300">{t('leads.ai.noKey')}</div>}
      {error && <div className="text-[11px] text-rose-700 dark:text-rose-300">{error}</div>}
      {loading ? (
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />{t('leads.ai.loading')}</div>
      ) : !i ? (
        <p className="text-[11px] text-slate-600 dark:text-gray-400">{t('leads.ai.empty')}</p>
      ) : (
        <div className="space-y-2">
          <p className="text-slate-800 dark:text-gray-100 leading-relaxed">{i.summary}</p>
          {i.intent && <p className="text-slate-600 dark:text-gray-300"><span className="font-bold">{t('leads.ai.intent')}:</span> {i.intent}</p>}
          {i.objections.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-bold text-slate-700 dark:text-gray-200">{t('leads.ai.objections')}:</span>
              {i.objections.map((o) => <span key={o} className="px-1.5 rounded-full border border-slate-300 dark:border-emerald-900 text-slate-600 dark:text-gray-300 text-[10px]">{o}</span>)}
            </div>
          )}
          <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1610] border border-violet-200 dark:border-violet-900/50">
            <div className="font-extrabold text-violet-900 dark:text-violet-200 flex items-center gap-1"><Flame className="w-3.5 h-3.5" />{t('leads.ai.nextStep')} <span className="font-semibold text-slate-500 dark:text-gray-400">· {i.nextStepWhen}</span></div>
            <p className="text-slate-800 dark:text-gray-100 mt-0.5">{i.nextStep}</p>
          </div>
          {(i.suggestedReplyKh || i.suggestedReplyEn) && (
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 space-y-1.5">
              <div className="font-bold text-slate-700 dark:text-gray-200">{t('leads.ai.reply')}</div>
              {[['kh', i.suggestedReplyKh], ['en', i.suggestedReplyEn]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex items-start gap-2">
                  <p className="flex-1 whitespace-pre-wrap text-slate-800 dark:text-gray-100">{v}</p>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button type="button" onClick={() => copy(v as string, k as string)} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300 dark:border-emerald-800 text-[10px] font-bold text-slate-600 dark:text-gray-300 cursor-pointer" title={t('leads.ai.copy')}><Copy className="w-3 h-3" />{copied === k ? t('leads.ai.copied') : (k as string).toUpperCase()}</button>
                    {onUseReply && <button type="button" onClick={() => onUseReply(v as string)} className="px-1.5 py-0.5 rounded bg-sky-600 text-[#fff] on-dark text-[10px] font-bold cursor-pointer" data-use-reply={k}>{t('leads.ai.use')}</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {i.coaching && <p className="text-slate-600 dark:text-gray-300"><span className="font-bold">{t('leads.ai.coaching')}:</span> {i.coaching}</p>}
          <p className="text-[10px] text-slate-500 dark:text-gray-400 pa-num">{t('leads.ai.basis', { n: data!.basis.messages, v: data!.basis.pendingVoice })}</p>
        </div>
      )}
    </div>
  );
}
