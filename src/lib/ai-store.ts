/**
 * Runs the AI analyst and keeps its latest answers (Supabase JSON rows):
 *   ai_campaign_report   the latest analysis
 *   ai_campaign_history  the last 10 (headline and top actions), to compare over time
 *   ai_settings          language, daily run on/off, Telegram brief on/off
 */
import { escapeHtml } from './round-robin';
import { AiAnalystError, aiConfigured, AI_MODEL, runAiAnalysis, type StoredAiReport } from './ai-analyst';
import { getCampaignReport } from './campaign-store';
import { phnomPenhDay } from './popup-analytics';
import { getMarker, setMarker } from './storage';

export interface AiSettings {
  lang: 'en' | 'kh';
  /** Run once a day with the daily cron. */
  daily: boolean;
  /** Send the top actions to the manager's Telegram after the daily run. */
  telegram: boolean;
  /** Days the daily analysis covers. */
  days: number;
}

export const DEFAULT_AI_SETTINGS: AiSettings = { lang: 'kh', daily: true, telegram: true, days: 14 };
const DAY_CHOICES = [7, 14, 30, 60, 90];

export function parseAiSettings(raw: unknown): AiSettings {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    lang: o.lang === 'en' ? 'en' : o.lang === 'kh' ? 'kh' : DEFAULT_AI_SETTINGS.lang,
    daily: typeof o.daily === 'boolean' ? o.daily : DEFAULT_AI_SETTINGS.daily,
    telegram: typeof o.telegram === 'boolean' ? o.telegram : DEFAULT_AI_SETTINGS.telegram,
    days: DAY_CHOICES.includes(Number(o.days)) ? Number(o.days) : DEFAULT_AI_SETTINGS.days,
  };
}

const readJson = async (id: string) => {
  try {
    return JSON.parse((await getMarker(id)) || 'null');
  } catch {
    return null;
  }
};

export async function getAiSettings(): Promise<AiSettings> {
  return parseAiSettings(await readJson('ai_settings'));
}

export async function saveAiSettings(input: unknown): Promise<AiSettings> {
  const clean = parseAiSettings(input);
  await setMarker('ai_settings', JSON.stringify(clean));
  return clean;
}

export async function getLatestAiReport(): Promise<StoredAiReport | null> {
  const r = await readJson('ai_campaign_report');
  return r && r.report ? (r as StoredAiReport) : null;
}

export async function getAiHistory(): Promise<Array<Pick<StoredAiReport, 'generatedAt' | 'days' | 'lang' | 'basis'> & { headline: string; actions: string[] }>> {
  const h = await readJson('ai_campaign_history');
  return Array.isArray(h) ? h : [];
}

/** Runs a fresh analysis and stores it. */
export async function runAndStoreAiReport(opts: { days: number; lang: 'en' | 'kh'; pageSlug?: string; trigger: 'manual' | 'daily' }): Promise<StoredAiReport> {
  const { report, campaigns, pages } = await getCampaignReport(opts.days, opts.pageSlug);
  const ai = await runAiAnalysis({ report, campaigns, pages, lang: opts.lang, pageSlug: opts.pageSlug });
  const stored: StoredAiReport = {
    report: ai,
    lang: opts.lang,
    days: opts.days,
    pageSlug: opts.pageSlug,
    generatedAt: new Date().toISOString(),
    model: AI_MODEL,
    trigger: opts.trigger,
    basis: { visits: report.total.visits, leads: report.total.leads, won: report.total.won, spend: report.total.spend },
  };
  await setMarker('ai_campaign_report', JSON.stringify(stored));
  const history = await getAiHistory();
  await setMarker('ai_campaign_history', JSON.stringify([
    { generatedAt: stored.generatedAt, days: stored.days, lang: stored.lang, basis: stored.basis, headline: ai.headline, actions: ai.actions.slice(0, 3).map((a) => a.title) },
    ...history,
  ].slice(0, 10)));
  return stored;
}

/** Telegram text for the manager: verdict and the top three actions. */
export function aiBriefText(r: StoredAiReport, link: string): string {
  const kh = r.lang === 'kh';
  const lines = [
    `🤖 <b>${kh ? 'អ្នកវិភាគ AI៖ យុទ្ធនាការ' : 'AI analyst: campaigns'}</b> (${r.days} ${kh ? 'ថ្ងៃ' : 'days'})`,
    `${kh ? 'អ្នកចូលមើល' : 'Visits'} ${r.basis.visits} · ${kh ? 'អ្នកចុះឈ្មោះ' : 'Leads'} ${r.basis.leads} · ${kh ? 'អតិថិជន' : 'Customers'} ${r.basis.won}${r.basis.spend ? ` · $${r.basis.spend}` : ''}`,
    '',
    escapeHtml(r.report.headline),
    '',
    ...r.report.actions.slice(0, 3).map((a, i) => `${i + 1}. <b>${escapeHtml(a.title)}</b>`),
    '',
    `👉 <a href="${link}">${kh ? 'មើលផែនការពេញ' : 'Open the full plan'}</a>`,
  ];
  return lines.join('\n');
}

/**
 * Daily run (from the daily cron): once per Phnom Penh day, when switched on, the key is
 * set and there were visits or leads in the period. Sends the brief to Telegram if chosen.
 */
export async function maybeRunDailyAi(send: (text: string) => Promise<boolean>, nowMs: number = Date.now()): Promise<{ ran: boolean; reason?: string }> {
  if (!aiConfigured()) return { ran: false, reason: 'no key' };
  const settings = await getAiSettings();
  if (!settings.daily) return { ran: false, reason: 'off' };
  const day = phnomPenhDay(nowMs);
  if ((await getMarker('ai_daily')) === day) return { ran: false, reason: 'already ran' };
  await setMarker('ai_daily', day);
  try {
    // No visits and no leads: nothing to analyse, so no AI cost.
    const { report } = await getCampaignReport(settings.days);
    if (report.total.visits === 0 && report.total.leads === 0) return { ran: false, reason: 'no data' };
    const stored = await runAndStoreAiReport({ days: settings.days, lang: settings.lang, trigger: 'daily' });
    if (settings.telegram) await send(aiBriefText(stored, 'https://sale.khbevents.com/admin/campaigns?tab=ai'));
    return { ran: true };
  } catch (err) {
    console.error('Daily AI analysis failed:', err instanceof AiAnalystError ? err.message : err);
    return { ran: false, reason: 'error' };
  }
}
