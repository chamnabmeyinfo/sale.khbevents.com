/**
 * The AI coach: reads one customer's story (lead-story.ts) and tells the team
 * where the customer stands and what to do next. It never talks to a customer;
 * the suggested reply is a draft a person edits and sends.
 *
 * Runs on demand ("Analyze now") and, for open chat leads whose conversation
 * changed, a few at a time after site traffic. Needs an AI key (Settings →
 * AI & API keys: the primary AI, Claude or Gemini, as for the campaign analyst). Results live in `lead_ai:<leadId>`.
 */
import { getLeadById, getMarker, getMarkersWithPrefix, getRealLeads, setMarker } from './storage';
import { buildLeadStory } from './lead-story';
import { AiAnalystError, generateJson, NO_AI_KEY } from './ai-text';
import { aiTextProviders } from './ai-keys';

export type Heat = 'hot' | 'warm' | 'cold';

export interface LeadInsight {
  /** Who this is and what they want, 2–4 sentences. */
  summary: string;
  /** What the customer is trying to do right now. */
  intent: string;
  heat: Heat;
  heatReason: string;
  /** Why the deal is stuck, as short tags: price, dates, visa, needs approval, comparing, silent… */
  objections: string[];
  /** The one thing the salesperson should do next, and when. */
  nextStep: string;
  nextStepWhen: string;
  /** A short reply the salesperson can send, in Khmer, and the same in English. */
  suggestedReplyKh: string;
  suggestedReplyEn: string;
  /** Coaching for the salesperson on how they handled this chat (kind, specific). */
  coaching: string;
  /** How sure the model is that the story had enough to go on. */
  confidence: 'high' | 'medium' | 'low';
}

export interface StoredLeadInsight {
  leadId: string;
  insight: LeadInsight;
  generatedAt: string;
  model: string;
  /** What the analysis was based on. */
  basis: { messages: number; pendingVoice: number; chatUpdatedAt?: string; status: string };
  trigger: 'manual' | 'auto';
}

const str = { type: 'string' } as const;
export const LEAD_INSIGHT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'intent', 'heat', 'heatReason', 'objections', 'nextStep', 'nextStepWhen', 'suggestedReplyKh', 'suggestedReplyEn', 'coaching', 'confidence'],
  properties: {
    summary: str,
    intent: str,
    heat: { type: 'string', enum: ['hot', 'warm', 'cold'] },
    heatReason: str,
    objections: { type: 'array', items: str },
    nextStep: str,
    nextStepWhen: str,
    suggestedReplyKh: str,
    suggestedReplyEn: str,
    coaching: str,
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
};

const SYSTEM_PROMPT = `You are the sales coach of KHB Events, a Cambodian company that sells seats on business trips, trade delegations, expo tours and B2B matchmaking trips (Vietnam, Korea and more). Customers write to a salesperson on Telegram, often in Khmer, after clicking a landing page.

You read one customer's story (profile, clicks, the whole Telegram conversation, team notes) and help the salesperson close, honestly and kindly. Rules:
- Judge only from what the story shows. Never invent facts, prices, dates or promises. If the story is thin, say so (confidence low) and keep advice modest.
- heat: hot = wants to buy soon (asked how to pay, confirmed dates, asked for seats, gave phone or company details, replied fast and often); warm = interested but something is open (price, dates, needs to ask someone, comparing); cold = silent for days, said not now, or only browsed.
- objections: short tags in English, 0–4 items, only those the story supports (e.g. "price", "dates", "visa", "needs approval", "comparing options", "no reply", "wants more details").
- nextStep: one concrete action for the salesperson (send the agenda PDF, call at 5 pm, offer the early-bird deadline, ask for the phone number, close with the payment link…). nextStepWhen: a plain time ("today", "tomorrow morning", "in 3 days").
- suggestedReplyKh: a short, natural Khmer message (2–4 sentences, polite, no hard sell) the salesperson could send now; if the last message was ours and the customer is silent, a gentle follow-up. suggestedReplyEn: the same in English.
- coaching: one or two sentences for the salesperson, specific and kind (what worked, what to do differently: reply faster, answer the question asked, propose a next step, ask for the phone).
- Write summary, intent, heatReason, nextStep, nextStepWhen and coaching in the language asked for.`;

const rowId = (leadId: string) => `lead_ai:${leadId}`;

export async function leadAiConfigured(): Promise<boolean> {
  return (await aiTextProviders()).length > 0;
}

export async function getLeadInsight(leadId: string): Promise<StoredLeadInsight | null> {
  const raw = await getMarker(rowId(leadId));
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as StoredLeadInsight;
    return v && v.insight ? v : null;
  } catch {
    return null;
  }
}

/** Heat and generation time of every analysed lead, for badges in lists. */
export async function listLeadHeat(): Promise<Record<string, { heat: Heat; generatedAt: string; nextStep: string }>> {
  const rows = await getMarkersWithPrefix('lead_ai:');
  const out: Record<string, { heat: Heat; generatedAt: string; nextStep: string }> = {};
  for (const r of rows) {
    try {
      const v = JSON.parse(r.value) as StoredLeadInsight;
      if (v?.insight?.heat) out[r.id.slice('lead_ai:'.length)] = { heat: v.insight.heat, generatedAt: v.generatedAt, nextStep: v.insight.nextStep };
    } catch {}
  }
  return out;
}

const s = (v: unknown, n = 1200) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const pick = <T extends string>(v: unknown, allowed: readonly T[], d: T): T => ((allowed as readonly string[]).includes(v as string) ? (v as T) : d);

export function normalizeInsight(raw: unknown): LeadInsight {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    summary: s(o.summary),
    intent: s(o.intent, 400),
    heat: pick(o.heat, ['hot', 'warm', 'cold'] as const, 'warm'),
    heatReason: s(o.heatReason, 400),
    objections: (Array.isArray(o.objections) ? o.objections : []).map((x) => s(x, 60)).filter(Boolean).slice(0, 4),
    nextStep: s(o.nextStep, 400),
    nextStepWhen: s(o.nextStepWhen, 80),
    suggestedReplyKh: s(o.suggestedReplyKh, 800),
    suggestedReplyEn: s(o.suggestedReplyEn, 800),
    coaching: s(o.coaching, 500),
    confidence: pick(o.confidence, ['high', 'medium', 'low'] as const, 'medium'),
  };
}

/** Analyses one lead now and stores the result. Throws AiAnalystError on failure. */
export async function analyzeLead(leadId: string, options: { lang?: 'en' | 'kh'; trigger?: 'manual' | 'auto' } = {}): Promise<StoredLeadInsight> {
  if (!(await leadAiConfigured())) throw new AiAnalystError(NO_AI_KEY, 'no_key');
  const lead = await getLeadById(leadId);
  if (!lead) throw new AiAnalystError('Lead not found', 'bad_output');
  const story = await buildLeadStory(leadId);
  if (!story) throw new AiAnalystError('Lead not found', 'bad_output');
  const language = options.lang === 'kh'
    ? 'Write summary, intent, heatReason, nextStep, nextStepWhen and coaching in Khmer (ខ្មែរ), plain and natural.'
    : 'Write summary, intent, heatReason, nextStep, nextStepWhen and coaching in clear, simple English.';
  const answer = await generateJson({
    system: SYSTEM_PROMPT,
    user: `${language}\nToday (Phnom Penh): ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh' })}.\n\nCustomer story:\n\n${story.markdown.slice(0, 60_000)}`,
    schema: LEAD_INSIGHT_SCHEMA as unknown as Record<string, unknown>,
    effort: 'medium',
    maxTokens: 6000,
    timeoutMs: 120_000,
    stream: true,
  });
  const insight = normalizeInsight(answer.data);
  const stored: StoredLeadInsight = {
    leadId,
    insight,
    generatedAt: new Date().toISOString(),
    model: answer.model,
    basis: { messages: story.messages, pendingVoice: story.pendingVoice, chatUpdatedAt: lead.routing?.chat?.updatedAt, status: lead.status },
    trigger: options.trigger || 'manual',
  };
  await setMarker(rowId(leadId), JSON.stringify(stored));
  return stored;
}

export const AUTO_ANALYZE_MAX = 3;
export const AUTO_ANALYZE_DAYS = 30;

/**
 * Open chat leads whose conversation changed since their last analysis, a few at a
 * time, newest activity first. Quiet when the key is missing. Never throws.
 */
export async function analyzeChangedLeads(limit = AUTO_ANALYZE_MAX, nowMs = Date.now()): Promise<number> {
  if (!(await leadAiConfigured())) return 0;
  try {
    const since = nowMs - AUTO_ANALYZE_DAYS * 86_400_000;
    const candidates = (await getRealLeads())
      .filter((l) => l.customFields?.telegramUserId && l.routing?.chat?.lastAt && Date.parse(l.routing.chat.lastAt) >= since)
      .filter((l) => l.status !== 'WON' && l.status !== 'LOST')
      .sort((a, b) => (b.routing!.chat!.lastAt || '').localeCompare(a.routing!.chat!.lastAt || ''));
    let n = 0;
    for (const lead of candidates) {
      if (n >= limit) break;
      const prior = await getLeadInsight(lead.id);
      const chatAt = lead.routing!.chat!.updatedAt;
      // Analysed after the last chat change, and at least an hour ago: nothing new to say.
      if (prior && prior.basis.chatUpdatedAt === chatAt) continue;
      if (prior && nowMs - Date.parse(prior.generatedAt) < 60 * 60_000) continue;
      try {
        await analyzeLead(lead.id, { trigger: 'auto' });
        n += 1;
      } catch (err) {
        console.error('Lead AI error:', err instanceof Error ? err.message : err);
        if (err instanceof AiAnalystError && (err.code === 'no_key' || err.code === 'api')) break;
      }
    }
    return n;
  } catch (err) {
    console.error('Lead AI sweep error:', err);
    return 0;
  }
}
