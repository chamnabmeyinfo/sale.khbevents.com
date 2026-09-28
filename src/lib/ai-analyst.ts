/**
 * AI marketing analyst: reads the campaign report first (numbers, visitor behaviour,
 * the rule findings, what each page offers) and writes a diagnosis and a prioritised
 * plan to get more visitors to register. Runs on demand (Admin → Campaigns → AI analyst)
 * and once a day with the daily cron, so the owner opens a ready answer.
 *
 * Only aggregated numbers are sent: no names, phones, e-mails or ids.
 * Runs on the primary AI set in Settings → AI & API keys (Claude or Gemini), with the other as back-up.
 */
import { aiTextProviders } from './ai-keys';
import { generateJson } from './ai-text';
import type { CampaignReport, PageInfo } from './campaign-analytics';
import type { Campaign } from './campaigns';

export { AI_MODEL, AiAnalystError } from './ai-text';

export interface AiAction {
  priority: number;
  title: string;
  why: string;
  how: string[];
  area: 'ads' | 'page' | 'sales' | 'offer' | 'tracking';
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

export interface AiReport {
  headline: string;
  dataQuality: { level: 'good' | 'thin' | 'insufficient'; note: string };
  campaigns: Array<{ key: string; verdict: 'scale' | 'keep' | 'fix' | 'pause' | 'too_early'; reason: string }>;
  insights: Array<{ title: string; evidence: string; area: 'ads' | 'page' | 'sales' | 'offer' | 'tracking' | 'audience' }>;
  actions: AiAction[];
  experiments: Array<{ name: string; hypothesis: string; change: string; metric: string; days: number }>;
  adIdeas: Array<{ channel: string; angle: string; headline: string; primaryText: string }>;
  salesFollowUp: string;
}

export interface StoredAiReport {
  report: AiReport;
  lang: 'en' | 'kh';
  days: number;
  pageSlug?: string;
  generatedAt: string;
  model: string;
  trigger: 'manual' | 'daily';
  /** Numbers the analysis was based on, to show next to it. */
  basis: { visits: number; leads: number; won: number; spend: number };
}

const AREAS = ['ads', 'page', 'sales', 'offer', 'tracking'];
const str = { type: 'string' } as const;

export const AI_REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'dataQuality', 'campaigns', 'insights', 'actions', 'experiments', 'adIdeas', 'salesFollowUp'],
  properties: {
    headline: str,
    dataQuality: {
      type: 'object',
      additionalProperties: false,
      required: ['level', 'note'],
      properties: { level: { type: 'string', enum: ['good', 'thin', 'insufficient'] }, note: str },
    },
    campaigns: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'verdict', 'reason'],
        properties: { key: str, verdict: { type: 'string', enum: ['scale', 'keep', 'fix', 'pause', 'too_early'] }, reason: str },
      },
    },
    insights: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'evidence', 'area'],
        properties: { title: str, evidence: str, area: { type: 'string', enum: [...AREAS, 'audience'] } },
      },
    },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['priority', 'title', 'why', 'how', 'area', 'impact', 'effort'],
        properties: {
          priority: { type: 'integer' },
          title: str,
          why: str,
          how: { type: 'array', items: str },
          area: { type: 'string', enum: AREAS },
          impact: { type: 'string', enum: ['high', 'medium', 'low'] },
          effort: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
    },
    experiments: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'hypothesis', 'change', 'metric', 'days'],
        properties: { name: str, hypothesis: str, change: str, metric: str, days: { type: 'integer' } },
      },
    },
    adIdeas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['channel', 'angle', 'headline', 'primaryText'],
        properties: { channel: str, angle: str, headline: str, primaryText: str },
      },
    },
    salesFollowUp: str,
  },
} as const;

const SYSTEM_PROMPT = `You are the marketing analyst of KHB Events, a Cambodian company that sells seats on B2B business trips and trade delegations (for example to trade fairs in Vietnam and Korea) through landing pages on sale.khbevents.com.

How the business sells: ads and posts on Facebook, Instagram, TikTok and Telegram send people to a landing page. The page has sections built in a drag-and-drop builder (hero, benefits, what is included, itinerary, price card with countdown and seats left, lead form, FAQ, final call to action). A visitor becomes a lead by sending the form or by tapping the Telegram button, which opens a chat with the next salesperson (round robin). Salespeople then call the lead; a lead marked "WON" in the CRM is a paying customer. Buyers are Cambodian business owners; many read Khmer and open links inside the Facebook or Telegram app on a phone.

You receive the campaign report as JSON: per-campaign visits, engaged visits (15+ active seconds, half the page read, or a click), median active seconds, scroll depth, how far readers get through each page section, form starts vs sends, Telegram clicks, leads, customers, spend and cost per lead, breakdowns by channel, ad, device, in-app browser, language, new/returning visitors and hour of day (Phnom Penh time), the rule-based findings, and each page's sections and offer deadline.

Your job: analyse it first, then give the owner a plan that gets more visitors to register and more leads to pay.
- Base every statement on numbers in the report and quote them. Compare against the page's own averages.
- Say when a sample is too small to judge (fewer than about 30 visits or 5 leads for a campaign) and what to measure instead. Do not over-read small numbers.
- Never invent figures, customers, testimonials, partners or prices. If spend is missing, say that cost per lead cannot be judged yet.
- Recommend concrete actions the team can do in this portal or in the ad managers: change or move a builder section, the headline, the price card, the form (fewer fields), the Telegram button, a popup, the campaign audience or creative, budget moves between campaigns, sales follow-up speed. Say where and how, step by step, in plain words.
- Order actions by expected impact first, then by effort. Give at most 6 actions, 3 experiments and 3 ad ideas.
- Ad ideas: angles grounded in what the page and the data show; no promises the page does not make.
- Verdict per campaign: scale, keep, fix, pause, or too_early (not enough data).
- Write for a busy business owner: short sentences, no jargon (say "people who clicked" rather than CTR).`;

export function analystBrief(report: CampaignReport, campaigns: Campaign[], pages: PageInfo[], pageSlug?: string) {
  const strip = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const m = (x: CampaignReport['total']) => strip({
    visits: x.visits, visitors: x.visitors, engaged: x.engaged, engagedRate: x.engagedRate, medianActiveSeconds: x.medianSeconds, avgScroll: x.avgScroll,
    readHalf: x.readHalf, clickedButton: x.interested, telegramClicks: x.telegram, formStarts: x.formStarts, formSent: x.formLeads, returning: x.returning,
    leads: x.leads, leadRate: x.leadRate, customers: x.won, lost: x.lost, contacted: x.contacted, spendUsd: x.spend || undefined, costPerLead: x.cpl, costPerCustomer: x.cpw,
  });
  const rows = (list: CampaignReport['channels'], limit = 8) => list.slice(0, limit).map((r) => ({ key: r.label, ...m(r) }));
  return {
    period: report.range,
    scope: pageSlug ? `page ${pageSlug}` : 'all pages',
    total: m(report.total),
    campaigns: report.campaigns.slice(0, 15).map((c) => {
      const def = campaigns.find((x) => x.slug === c.key);
      return strip({
        key: c.key,
        name: c.label,
        registered: Boolean(def),
        page: c.pageSlug,
        channel: c.channel,
        status: c.status,
        budgetUsd: c.budget,
        audience: def?.audience,
        notes: def?.notes,
        ads: def?.ads.map((a) => a.name).join(', ') || undefined,
        medianMinutesToFirstAnswer: c.responseMinutes,
        leadsNotContactedYet: c.newLeadsWaiting || undefined,
        ...m(c),
      });
    }),
    channels: rows(report.channels),
    ads: rows(report.ads, 12),
    devices: rows(report.devices),
    inAppBrowsers: rows(report.apps),
    languages: rows(report.languages),
    newVsReturning: rows(report.visitorType),
    pages: rows(report.pages),
    busiestHours: [...report.hours].sort((a, b) => b.visits - a.visits).slice(0, 6),
    daily: report.days.filter((d) => d.visits || d.leads || d.spend),
    sectionReach: Object.fromEntries(Object.entries(report.sections).map(([slug, list]) => [slug, list.map((s) => `${s.type}${s.title ? ` "${s.title}"` : ''}: ${s.pct}%`)])),
    pageOffers: pages.filter((p) => !pageSlug || p.slug === pageSlug).map((p) => strip({ slug: p.slug, title: p.title, registrationDeadline: p.deadline, sections: p.sections.map((s) => s.type).join(' → ') })),
    ruleFindings: report.findings.map((f) => `[${f.severity}/${f.area}] ${f.en}`),
  };
}

/** True when an Anthropic or a Gemini key is set. */
export async function aiConfigured(): Promise<boolean> {
  return (await aiTextProviders()).length > 0;
}

/** Runs the analysis on the primary AI. Throws AiAnalystError with a short reason on failure. */
export async function runAiAnalysis(input: { report: CampaignReport; campaigns: Campaign[]; pages: PageInfo[]; lang: 'en' | 'kh'; pageSlug?: string }): Promise<{ report: AiReport; model: string }> {
  const brief = analystBrief(input.report, input.campaigns, input.pages, input.pageSlug);
  const language = input.lang === 'kh'
    ? 'Write every text field in Khmer (ខ្មែរ), natural and plain; keep campaign keys, numbers, "Telegram", "Facebook" and section names as they are.'
    : 'Write every text field in clear, simple English.';
  const answer = await generateJson({
    system: SYSTEM_PROMPT,
    user: `${language}\n\nCampaign report:\n${JSON.stringify(brief)}`,
    schema: AI_REPORT_SCHEMA as unknown as Record<string, unknown>,
    effort: 'high',
    maxTokens: 32000,
    timeoutMs: 280_000,
    stream: true,
  });
  return { report: normalizeAiReport(answer.data), model: answer.model };
}

const s = (v: unknown, n = 2000) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const pickOne = <T extends string>(v: unknown, allowed: readonly T[], d: T): T => ((allowed as readonly string[]).includes(v as string) ? (v as T) : d);
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

/** Defensive copy of the model output: known fields only, bounded sizes. */
export function normalizeAiReport(raw: unknown): AiReport {
  const o = obj(raw);
  const dq = obj(o.dataQuality);
  return {
    headline: s(o.headline, 400),
    dataQuality: { level: pickOne(dq.level, ['good', 'thin', 'insufficient'] as const, 'thin'), note: s(dq.note, 600) },
    campaigns: arr(o.campaigns).slice(0, 20).map((c) => {
      const x = obj(c);
      return { key: s(x.key, 100), verdict: pickOne(x.verdict, ['scale', 'keep', 'fix', 'pause', 'too_early'] as const, 'too_early'), reason: s(x.reason, 600) };
    }),
    insights: arr(o.insights).slice(0, 10).map((c) => {
      const x = obj(c);
      return { title: s(x.title, 200), evidence: s(x.evidence, 800), area: pickOne(x.area, ['ads', 'page', 'sales', 'offer', 'tracking', 'audience'] as const, 'page') };
    }),
    actions: arr(o.actions).slice(0, 8).map((c, i) => {
      const x = obj(c);
      return {
        priority: typeof x.priority === 'number' ? Math.max(1, Math.min(20, Math.round(x.priority))) : i + 1,
        title: s(x.title, 200),
        why: s(x.why, 800),
        how: arr(x.how).slice(0, 8).map((h) => s(h, 400)).filter(Boolean),
        area: pickOne(x.area, ['ads', 'page', 'sales', 'offer', 'tracking'] as const, 'page'),
        impact: pickOne(x.impact, ['high', 'medium', 'low'] as const, 'medium'),
        effort: pickOne(x.effort, ['low', 'medium', 'high'] as const, 'medium'),
      };
    }).sort((a, b) => a.priority - b.priority),
    experiments: arr(o.experiments).slice(0, 4).map((c) => {
      const x = obj(c);
      return { name: s(x.name, 200), hypothesis: s(x.hypothesis, 600), change: s(x.change, 600), metric: s(x.metric, 200), days: typeof x.days === 'number' ? Math.max(1, Math.min(60, Math.round(x.days))) : 7 };
    }),
    adIdeas: arr(o.adIdeas).slice(0, 4).map((c) => {
      const x = obj(c);
      return { channel: s(x.channel, 40), angle: s(x.angle, 300), headline: s(x.headline, 200), primaryText: s(x.primaryText, 1200) };
    }),
    salesFollowUp: s(o.salesFollowUp, 1500),
  };
}
