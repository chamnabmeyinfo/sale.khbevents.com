/**
 * Ad Poster Kit: image prompts and ad text for social media posters, built from a trip page's
 * live facts (price, early-bird date, seats, deadline) so a poster never states an old number.
 *
 * The image tool draws the background only ("no text"); the headline, price and QR code are
 * added in Canva with real fonts, because image generators write Khmer badly.
 * Client-safe: no Next.js or Node imports.
 */
import { effectiveOffer, formatPrice, normalizeBuilderDoc, pick, type Bi, type Lang } from './builder';
import type { LandingPage } from './types';

export interface PosterFormat {
  id: 'portrait' | 'square' | 'vertical' | 'landscape';
  ratio: string;
  width: number;
  height: number;
  /** Where this size is used. */
  placements: string;
  /** Where the photo's subject goes and which areas stay calm for text. */
  layout: string;
  /** Areas the platform covers with its own buttons, or margins to keep. */
  safeZone: string;
}

export const POSTER_FORMATS: PosterFormat[] = [
  {
    id: 'portrait', ratio: '4:5', width: 1080, height: 1350,
    placements: 'Facebook and Instagram feed (best on phones), LinkedIn feed',
    layout: 'subject in the lower half; the top 40% calm and uncluttered for a headline; a plain area at the bottom right for a QR code',
    safeZone: 'keep text 60 px from every edge',
  },
  {
    id: 'square', ratio: '1:1', width: 1080, height: 1080,
    placements: 'Facebook, Instagram and LinkedIn feed, Telegram posts, Google Display square',
    layout: 'subject on the right half; the left half calm and uncluttered for text',
    safeZone: 'keep text 60 px from every edge',
  },
  {
    id: 'vertical', ratio: '9:16', width: 1080, height: 1920,
    placements: 'TikTok, Facebook and Instagram Reels and Stories, Telegram stories, YouTube Shorts',
    layout: 'subject in the middle third; calm space just above the subject for a headline; the top 15% and the bottom 35% plain',
    safeZone: 'no text in the top 15% or the bottom 35% (the app puts its buttons and caption there), and 64 px from the sides',
  },
  {
    id: 'landscape', ratio: '1.91:1', width: 1200, height: 628,
    placements: 'Google Display, LinkedIn and Facebook link ads',
    layout: 'subject on the right third; the left 55% calm and uncluttered for text',
    safeZone: 'keep text 40 px from every edge; small text is unreadable at this size, so use the headline and price only',
  },
];

export type PosterGoal = 'launch' | 'early' | 'lastSeats' | 'deadline';
export const POSTER_GOALS: PosterGoal[] = ['launch', 'early', 'lastSeats', 'deadline'];

/** The facts a poster may state, read from the page at one moment. */
export interface PosterFacts {
  slug: string;
  title: Bi;
  headline?: Bi;
  sub?: Bi;
  cta?: Bi;
  riskNote?: Bi;
  /** What the trip is about, in English, for the image scene. */
  theme: string;
  currency: 'USD' | 'KHR';
  /** Price charged today, and the regular price when an early-bird price is open. */
  price: number | null;
  regularPrice: number | null;
  priceNote?: Bi;
  /** Set only while the early-bird price is open. */
  earlyUntil?: string;
  /** Set only while registration is still open. */
  deadline?: string;
  /** True when the page has a deadline that has already passed. */
  deadlinePassed: boolean;
  seatsLeft: number | null;
  seatsTotal: number | null;
  seatLabel: Bi;
  accent: string;
  /** The page's own hero image, as a style reference. */
  image?: string;
  builder: boolean;
}

const firstSentence = (text: string) => (text.match(/^[^.!?។]*[.!?។]?/)?.[0] || text).trim();

/** The poster facts of a page right now. Pages not made with the builder give their title and description only. */
export function posterFacts(page: Pick<LandingPage, 'slug' | 'title' | 'description' | 'builder' | 'template'>, nowMs: number): PosterFacts {
  const base: PosterFacts = {
    slug: page.slug,
    title: { en: page.title, kh: page.title },
    theme: firstSentence(page.description || page.title),
    currency: 'USD',
    price: null,
    regularPrice: null,
    deadlinePassed: false,
    seatsLeft: null,
    seatsTotal: null,
    seatLabel: { en: 'seats left', kh: 'កៅអីនៅសល់' },
    accent: '#E5A93C',
    builder: false,
  };
  if (page.template !== 'builder' || !page.builder) return base;
  const doc = normalizeBuilderDoc(page.builder);
  const offer = doc.offer;
  const hero = doc.blocks.find((b) => b.type === 'hero');
  const eff = effectiveOffer(offer, nowMs);
  const deadlineMs = offer.deadline ? Date.parse(offer.deadline) : NaN;
  const open = Number.isFinite(deadlineMs) && deadlineMs > nowMs;
  const seats = offer.stockTotal !== null && offer.stockLeft !== null && offer.stockTotal > 0;
  return {
    ...base,
    title: offer.name.en ? offer.name : base.title,
    headline: hero?.type === 'hero' ? hero.headline : undefined,
    sub: hero?.type === 'hero' ? hero.sub : undefined,
    cta: hero?.type === 'hero' ? hero.ctaLabel : undefined,
    riskNote: hero?.type === 'hero' ? hero.riskNote : undefined,
    theme: firstSentence((hero?.type === 'hero' && hero.sub?.en) || page.description || offer.name.en || page.title),
    currency: offer.currency,
    price: eff.price,
    regularPrice: eff.countdownKind === 'early' ? eff.compareAtPrice : null,
    priceNote: offer.priceNote,
    earlyUntil: eff.countdownKind === 'early' ? offer.earlyUntil : undefined,
    deadline: open ? offer.deadline : undefined,
    deadlinePassed: Number.isFinite(deadlineMs) && !open,
    seatsLeft: seats ? offer.stockLeft : null,
    seatsTotal: seats ? offer.stockTotal : null,
    seatLabel: offer.stockLabel,
    accent: doc.brand.accent,
    image: hero?.type === 'hero' ? hero.image : undefined,
    builder: true,
  };
}

/** Why a goal cannot be used with these facts (null = it can). */
export function goalBlocked(goal: PosterGoal, facts: PosterFacts): 'noEarly' | 'noSeats' | 'soldOut' | 'noDeadline' | null {
  if (goal === 'early' && !facts.earlyUntil) return 'noEarly';
  if (goal === 'lastSeats' && facts.seatsLeft === null) return 'noSeats';
  if (goal === 'lastSeats' && facts.seatsLeft === 0) return 'soldOut';
  if (goal === 'deadline' && !facts.deadline) return 'noDeadline';
  return null;
}

/** A date in Phnom Penh time, as the pages write it ("30 September 2026" / "30 កញ្ញា 2026"). */
export function ppDay(iso: string, lang: Lang): string {
  const d = new Date(Date.parse(iso) + 7 * 3_600_000);
  const en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const kh = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  return `${d.getUTCDate()} ${(lang === 'kh' ? kh : en)[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export interface PosterCopy {
  headline: string;
  support: string;
  offer: string;
  cta: string;
  trust: string;
}

/** The words to put on the poster, in one language: the page's own copy plus the goal's fact line. */
export function posterCopy(facts: PosterFacts, goal: PosterGoal, lang: Lang): PosterCopy {
  const t = (b?: Bi) => (b ? pick(b, lang) : '');
  const price = formatPrice(facts.price, facts.currency);
  const priceLine = price ? `${price}${t(facts.priceNote) ? ` ${t(facts.priceNote)}` : ''}` : '';
  let offer = priceLine;
  if (goal === 'early' && facts.earlyUntil && price) {
    const regular = formatPrice(facts.regularPrice, facts.currency);
    offer = lang === 'kh'
      ? `តម្លៃពិសេស ${priceLine} ដល់ថ្ងៃ ${ppDay(facts.earlyUntil, 'kh')}${regular ? ` (បន្ទាប់មក ${regular})` : ''}`
      : `Early-bird ${priceLine} until ${ppDay(facts.earlyUntil, 'en')}${regular ? ` (then ${regular})` : ''}`;
  } else if (goal === 'lastSeats' && facts.seatsLeft !== null) {
    const seats = lang === 'kh' ? `${t(facts.seatLabel)} ${facts.seatsLeft}` : `${facts.seatsLeft} ${t(facts.seatLabel)}`;
    offer = priceLine ? `${seats} · ${priceLine}` : seats;
  } else if (goal === 'deadline' && facts.deadline) {
    const closes = lang === 'kh' ? `បិទការចុះឈ្មោះ ${ppDay(facts.deadline, 'kh')}` : `Registration closes ${ppDay(facts.deadline, 'en')}`;
    offer = priceLine ? `${closes} · ${priceLine}` : closes;
  }
  return {
    headline: t(facts.headline) || t(facts.title),
    support: firstSentence(t(facts.sub)),
    offer,
    cta: t(facts.cta),
    trust: t(facts.riskNote),
  };
}

const MOODS: Record<PosterGoal, string> = {
  launch: 'confident, optimistic and professional',
  early: 'fresh and inviting, a good opportunity',
  lastSeats: 'energetic, with a sense of momentum and a full room',
  deadline: 'focused and decisive',
};

/** An image prompt for one size: the background photo only, with room for the text. */
export function imagePrompt(facts: PosterFacts, goal: PosterGoal, format: PosterFormat, scene: string): string {
  return [
    `Advertising photo for a social media ad, ${format.ratio} (${format.width}×${format.height} px), for ${format.placements}.`,
    `Scene: ${scene.trim() || facts.theme}`,
    'People: Cambodian and other Asian business owners in smart business clothes, natural expressions, no famous people.',
    `Mood: ${MOODS[goal]}.`,
    `Style: realistic editorial photography, natural light, sharp and high resolution; colours built around ${facts.accent} with deep neutral tones.`,
    `Layout: ${format.layout}.`,
    'Do not include any text, letters, numbers, logos, watermarks, signs with writing, flags or app screens. The headline, price and QR code are added later.',
  ].join('\n');
}

/** One prompt for a design assistant (ChatGPT, Claude, Gemini, Canva AI) covering every size and the text. */
export function allInOnePrompt(facts: PosterFacts, goal: PosterGoal, scene: string, link?: string): string {
  const en = posterCopy(facts, goal, 'en');
  const kh = posterCopy(facts, goal, 'kh');
  const lines = (c: PosterCopy) => [
    `- Headline: ${c.headline}`,
    c.support ? `- Supporting line: ${c.support}` : '',
    c.offer ? `- Offer line: ${c.offer}` : '',
    c.cta ? `- Button text: ${c.cta}` : '',
    c.trust ? `- Reassurance: ${c.trust}` : '',
  ].filter(Boolean).join('\n');
  return [
    `Design a set of social media ad posters for this business trip: ${pick(facts.title, 'en')}.`,
    `Goal: ${{ launch: 'announce the trip', early: 'fill seats before the early-bird price ends', lastSeats: 'fill the last seats', deadline: 'get registrations before registration closes' }[goal]}.`,
    '',
    'Sizes (one master layout, re-cropped for each):',
    ...POSTER_FORMATS.map((f) => `- ${f.ratio}, ${f.width}×${f.height} px: ${f.placements}. Layout: ${f.layout}. Safe zone: ${f.safeZone}.`),
    '',
    `Background photo: ${scene.trim() || facts.theme}. Realistic editorial photography, ${MOODS[goal]} mood. No text inside the photo.`,
    `Brand colour: ${facts.accent}. Use it for the button and highlights.`,
    '',
    'Text in English:',
    lines(en),
    '',
    'Text in Khmer (typeset with a Khmer font such as Kantumruy Pro or Battambang; never draw Khmer inside a generated image):',
    lines(kh),
    '',
    link ? `QR code and link: ${link} (QR code at least 180 px wide on the 1080 px sizes, bottom right).` : 'Leave space for a QR code at the bottom right (at least 180 px wide on the 1080 px sizes).',
    '',
    'Rules: use only the facts above, exactly as written. Do not add prices, dates, seat numbers, testimonials, partner logos or statistics. One headline, one offer line and one button per poster. High contrast; the headline readable on a phone.',
  ].join('\n');
}

/** Things to fix in the CMS before running ads with this page. */
export function posterWarnings(facts: PosterFacts): Array<'notBuilder' | 'noPrice' | 'deadlinePassed'> {
  const out: Array<'notBuilder' | 'noPrice' | 'deadlinePassed'> = [];
  if (!facts.builder) out.push('notBuilder');
  else if (facts.price === null) out.push('noPrice');
  if (facts.deadlinePassed) out.push('deadlinePassed');
  return out;
}
