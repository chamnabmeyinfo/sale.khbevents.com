/**
 * AI headline ideas for the Ad Poster Kit: the primary AI writes a few poster headlines and supporting
 * lines (English and Khmer) from the trip page's own copy and live facts. A person picks one;
 * nothing is published by itself. Any idea that states a number not found in the facts is
 * dropped, so the AI cannot invent a price, date, seat count or statistic.
 *
 * Server only (uses the primary AI key from ai-keys.ts).
 */
import { generateJson } from './ai-text';
import { posterCopy, type PosterFacts, type PosterGoal } from './ad-posters';
import { pick } from './builder';

export interface PosterIdea {
  angle: string;
  headlineEn: string;
  headlineKh: string;
  supportEn: string;
  supportKh: string;
}

const str = { type: 'string' } as const;
const IDEAS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['ideas'],
  properties: {
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['angle', 'headlineEn', 'headlineKh', 'supportEn', 'supportKh'],
        properties: { angle: str, headlineEn: str, headlineKh: str, supportEn: str, supportKh: str },
      },
    },
  },
};

const SYSTEM_PROMPT = `You write social media ad posters for KHB Events, a Cambodian company that sells seats on business trips and trade delegations. The buyer is a Cambodian business owner who pays personally and decides on the phone.

Rules (from the company's copy rules):
- They buy an outcome (suppliers found, better margins, new partners), not a trip. Lead with the outcome.
- Headline: at most 10 words, one idea, specific. Supporting line: one sentence, at most 18 words.
- Use only the facts given. Never add a price, date, number of seats, number of suppliers or visitors, statistic, testimonial, partner or brand name that is not in the facts. If a detail is not given, write without it.
- Cut adjectives any competitor could claim (premium, exclusive, world-class, amazing).
- Khmer: write from the intent, not word for word; plain, natural and shorter than the English; digits as in the facts.
- Each idea takes a different angle (for example: outcome, fear of missing the right supplier, ease, timing, who it is for).`;

/** Digit groups in a text (Khmer digits read as Latin), e.g. "$750 on 30 Sep" → ["750", "30"]. */
export function numbersIn(text: string): string[] {
  const latin = text.replace(/[០-៩]/g, (d) => String('០១២៣៤៥៦៧៨៩'.indexOf(d)));
  return (latin.match(/\d+(?:[.,]\d+)*/g) || []).map((n) => n.replace(/[.,]/g, ''));
}

/** Keeps only ideas whose every number appears in the facts (price, dates, seats, the page's own copy). */
export function groundedIdeas(ideas: PosterIdea[], factsText: string): PosterIdea[] {
  const allowed = new Set(numbersIn(factsText));
  return ideas.filter((i) => [i.headlineEn, i.headlineKh, i.supportEn, i.supportKh].every((t) => numbersIn(t).every((n) => allowed.has(n))));
}

const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, n) : '');

/** Asks the primary AI (Claude or Gemini) for poster headline ideas. Throws AiAnalystError with a short reason on failure. */
export async function suggestPosterIdeas(facts: PosterFacts, goal: PosterGoal, description: string): Promise<PosterIdea[]> {
  const en = posterCopy(facts, goal, 'en');
  const kh = posterCopy(facts, goal, 'kh');
  const factsText = [
    `Trip: ${pick(facts.title, 'en')} / ${pick(facts.title, 'kh')}`,
    `Page headline: ${en.headline} / ${kh.headline}`,
    facts.sub ? `Page supporting text: ${pick(facts.sub, 'en')} / ${pick(facts.sub, 'kh')}` : '',
    description ? `Page description: ${description}` : '',
    en.offer ? `Offer line (exact, from the CMS): ${en.offer} / ${kh.offer}` : '',
    en.cta ? `Button: ${en.cta} / ${kh.cta}` : '',
    en.trust ? `Reassurance: ${en.trust} / ${kh.trust}` : '',
  ].filter(Boolean).join('\n');
  const goalText = { launch: 'announce the trip', early: 'fill seats before the early-bird price ends', lastSeats: 'fill the last seats', deadline: 'get registrations before registration closes' }[goal];

  const answer = await generateJson({
    system: SYSTEM_PROMPT,
    user: `Goal of the ad: ${goalText}.\n\nFacts (the only facts you may use):\n${factsText}\n\nWrite 5 poster ideas.`,
    schema: IDEAS_SCHEMA as unknown as Record<string, unknown>,
    effort: 'medium',
    maxTokens: 16000,
    timeoutMs: 90_000,
  });
  const raw = answer.data;
  const list = raw && typeof raw === 'object' && Array.isArray((raw as { ideas?: unknown }).ideas) ? (raw as { ideas: unknown[] }).ideas : [];
  const ideas = list.slice(0, 8).map((x) => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    return { angle: clean(o.angle, 60), headlineEn: clean(o.headlineEn, 120), headlineKh: clean(o.headlineKh, 200), supportEn: clean(o.supportEn, 220), supportKh: clean(o.supportKh, 320) };
  }).filter((i) => i.headlineEn && i.headlineKh);
  return groundedIdeas(ideas, factsText);
}
