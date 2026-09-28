/**
 * Gen Ads: the ads package one landing page gets from one AI call, and everything computed
 * around it without AI (offer lines from the CMS, image prompts per size, Canva text pack,
 * carousel cards, posting plan, platform character limits, the number check).
 *
 * The AI writes words; the code owns every number. Client-safe: no Next.js or Node imports.
 */
import { POSTER_FORMATS, POSTER_GOALS, goalBlocked, imagePrompt, posterCopy, ppDay, type PosterFacts, type PosterGoal } from './ad-posters';
import { factLines, numbersIn, unbackedNumbers, type PageBrief } from './ad-brief';
import { formatPrice, pick, type Lang } from './builder';
import { CHANNELS, slugify, type CampaignChannel } from './campaigns';

export type ConceptId = 'a' | 'b' | 'c';
export const CONCEPT_IDS: ConceptId[] = ['a', 'b', 'c'];
export type Angle = 'outcome' | 'loss' | 'ease' | 'forWhom' | 'timing';
export const ANGLES: Angle[] = ['outcome', 'loss', 'ease', 'forWhom', 'timing'];
export type TestMetric = 'engaged_visits' | 'leads' | 'cost_per_lead' | 'telegram_clicks';
export const TEST_METRICS: TestMetric[] = ['engaged_visits', 'leads', 'cost_per_lead', 'telegram_clicks'];
export type TestRun = '7_days' | '14_days' | '200_visits_each';
export const TEST_RUNS: TestRun[] = ['7_days', '14_days', '200_visits_each'];

export interface AdConcept {
  id: ConceptId;
  angle: Angle;
  /** The master idea in one sentence: what the owner reads to pick a concept. */
  hook: string;
  /** Background photo for the image tool: place, people, action; no text. */
  scene: string;
  focalSubject: string;
  colourNote: string;
  headlineEn: string;
  headlineKh: string;
  supportEn: string;
  supportKh: string;
  /** Up to six words for the 9:16 story or Reel overlay. */
  overlayEn: string;
  overlayKh: string;
  /** Which offer line the code appends (price, early-bird, last seats, closing date). */
  goal: PosterGoal;
  meta: { primaryEn: string; primaryKh: string; headlineEn: string; headlineKh: string; descriptionEn: string; descriptionKh: string };
  tiktok: { captionEn: string; captionKh: string; hashtags: string[] };
  telegram: { postEn: string; postKh: string };
}

export interface VideoShot {
  seconds: number;
  /** What the phone films. */
  film: string;
  onScreenEn: string;
  onScreenKh: string;
  voiceEn: string;
  voiceKh: string;
}

export interface AdPackage {
  analysis: {
    audienceEn: string; audienceKh: string;
    outcomeEn: string; outcomeKh: string;
    fearEn: string; fearKh: string;
    proofPoints: Array<{ text: string; source: string }>;
    /** Things that would make better ads and are not on the page. Never written as copy. */
    missingFacts: string[];
  };
  concepts: AdConcept[];
  video: { shots: VideoShot[]; closingEn: string; closingKh: string; musicMood: string };
  google: { headlines: string[]; descriptions: string[]; keywords: string[]; sitelinks: string[] };
  linkedin: { introEn: string; bodyEn: string; hashtags: string[] };
  objections: Array<{ objectionEn: string; objectionKh: string; answerEn: string; answerKh: string; sourceQuestion: string }>;
  /** The salesperson's first message when the ad brings a chat. A person sends it. */
  reply: { firstEn: string; firstKh: string; followUpEn: string; followUpKh: string };
  targeting: { interests: string[]; jobTitles: string[]; exclude: string[]; retargetingEn: string; retargetingKh: string };
  abTests: Array<{ hypothesis: string; variantA: ConceptId; variantB: ConceptId; metric: TestMetric; runFor: TestRun }>;
}

export interface StoredAdPackage {
  slug: string;
  package: AdPackage;
  /** The goal the owner asked for; 'auto' lets each concept pick from the goals the page can back. */
  goal: PosterGoal | 'auto';
  /** Extra facts typed by the owner; their numbers are allowed in the copy. */
  notes: string;
  direction: string;
  generatedAt: string;
  model: string;
  provider: string;
  /** Hash of the page text the package was written from; a different hash today means the page changed. */
  factsHash: string;
  /** Slots emptied at generation because they stated a number not on the page. */
  dropped: string[];
  previous?: Omit<StoredAdPackage, 'previous'>;
  /** Set on the answer returned to the screen when the database write did not go through (never stored). */
  saveFailed?: boolean;
}

/** Platform limits in characters (code points, so Khmer counts fairly) or words. */
export const LIMITS = {
  metaPrimary: 500, metaHook: 125, metaHeadline: 40, metaDescription: 30,
  tiktokCaption: 100, telegramPost: 900, telegramCaption: 1024,
  linkedinIntro: 150, linkedinBody: 1300,
  googleHeadline: 30, googleDescription: 90, googleSitelink: 25,
  hook: 140, headlineWords: 10, supportWords: 18, overlayWords: 6, replyWords: 60, followUpWords: 40,
} as const;

export const chars = (s: string) => [...s].length;
export const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** A stable hash of the page text, to know when the page changed after a package was made. */
export function factsHash(brief: PageBrief): string {
  const text = `${brief.text.en}\n${brief.text.kh}`;
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Goals the page can back right now, in the order the AI may prefer them. */
export function allowedGoals(facts: PosterFacts): PosterGoal[] {
  return POSTER_GOALS.filter((g) => !goalBlocked(g, facts));
}

/** The goal to use when the owner leaves it on "auto": the offer that is really open today. */
export function defaultGoal(facts: PosterFacts): PosterGoal {
  if (facts.earlyUntil) return 'early';
  if (facts.deadline) return 'deadline';
  return 'launch';
}

// ---- Tracked links: one campaign per channel per page, named the same way everywhere ----

/** Channels Gen Ads makes tracked links for; LinkedIn has no channel of its own, so it rides on "other". */
export const AD_LINK_CHANNELS: Array<{ key: string; channel: CampaignChannel; source?: string; medium?: string }> = [
  { key: 'facebook', channel: 'facebook' },
  { key: 'tiktok', channel: 'tiktok' },
  { key: 'telegram', channel: 'telegram' },
  { key: 'linkedin', channel: 'other', source: 'linkedin', medium: 'paid_social' },
  { key: 'google', channel: 'google' },
];

/** `ads-<page>-<channel>`, already in the form the campaign store keeps (slugified, at most 60 characters, the channel never cut). */
export const adCampaignSlug = (pageSlug: string, key: string) => `${slugify(`ads-${pageSlug}`, 60 - key.length - 1)}-${key}`;

/**
 * The page's Gen Ads campaign for a channel: named by adCampaignSlug, on the same page and channel
 * (a "-2" suffix from uniqueSlug still matches; a campaign the owner made by hand does not).
 */
export function isAdCampaign(c: { pageSlug: string; slug: string; channel: string; source: string }, pageSlug: string, ch: (typeof AD_LINK_CHANNELS)[number]): boolean {
  const source = ch.source || CHANNELS[ch.channel].source;
  return c.pageSlug === pageSlug && c.channel === ch.channel && c.source === source && c.slug.startsWith(adCampaignSlug(pageSlug, ch.key));
}

// ---- Checks: the AI's words against the page's numbers and the platforms' limits ----

export type FlagKind = 'number' | 'liveFact' | 'goal' | 'placeholder' | 'price' | 'limit' | 'words' | 'superlative';
export interface Flag { path: string; kind: FlagKind; detail: string }

const SUPERLATIVES = /\b(premium|exclusive|world[- ]class|amazing|best|#1|number one|guaranteed|cheapest|free)\b/i;
const PLACEHOLDER = /\{([a-z_]+)\}/gi;
const REPLY_PLACEHOLDERS = new Set(['name', 'staff_name']);

function eachString(pkg: AdPackage): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const walk = (v: unknown, path: string) => {
    if (typeof v === 'string') { if (v) out.push([path, v]); return; }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}.${i}`)); return; }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(pkg, '');
  return out;
}

const conceptPath = (c: AdConcept, field: string) => `concepts.${c.id}.${field}`;

/**
 * Everything the owner must look at before copying: numbers not on the page, placeholders
 * other than {name}/{staff_name}, a price in the sales reply, platform limits, word limits,
 * and adjectives any competitor could claim. Nothing is changed; the screen shows the flags.
 */
export function auditPackage(pkg: AdPackage, allowed: Set<string>, opts: { live?: Set<string>; facts?: PosterFacts } = {}): Flag[] {
  const flags: Flag[] = [];
  const live = opts.live || new Set<string>();
  // Not customer copy, or shown with their own check: hashtags (#B2B), lists of names, test definitions, the missing-facts list.
  const skipNumbers = new Set(['analysis.missingFacts', 'abTests', 'targeting.interests', 'targeting.jobTitles', 'targeting.exclude', 'google.keywords', 'linkedin.hashtags']);
  const skipRe = /\.(seconds|tiktok\.hashtags\.\d+)$/;
  for (const [path, text] of eachString(pkg)) {
    // Concept paths use the concept id, not the index, so the screen can find them.
    const p = path.replace(/^concepts\.(\d)\./, (_, i) => `concepts.${CONCEPT_IDS[Number(i)] || i}.`);
    // Hashtags are names, not claims: no checks at all.
    if (/\.hashtags\.\d+$/.test(p)) continue;
    if (![...skipNumbers].some((s) => p.startsWith(s)) && !skipRe.test(p)) {
      const bad = unbackedNumbers(text, allowed);
      if (bad.length) flags.push({ path: p, kind: 'number', detail: bad.join(', ') });
      // A typed price or date from the CMS facts: the code adds those; typed ones go stale.
      const typedLive = numbersIn(text).filter((n) => live.has(n));
      if (typedLive.length && !p.startsWith('analysis.')) flags.push({ path: p, kind: 'liveFact', detail: [...new Set(typedLive)].join(', ') });
    }
    if (SUPERLATIVES.test(text) && !p.startsWith('analysis.') && !p.startsWith('targeting.')) flags.push({ path: p, kind: 'superlative', detail: text.match(SUPERLATIVES)![0] });
    if (p.startsWith('reply.')) {
      const others = [...text.matchAll(PLACEHOLDER)].map((m) => m[1].toLowerCase()).filter((n) => !REPLY_PLACEHOLDERS.has(n));
      if (others.length) flags.push({ path: p, kind: 'placeholder', detail: [...new Set(others)].map((n) => `{${n}}`).join(', ') });
      if (/\$\s?\d|\d\s?\$|USD/i.test(text)) flags.push({ path: p, kind: 'price', detail: '$' });
    } else if (PLACEHOLDER.test(text)) {
      PLACEHOLDER.lastIndex = 0;
      flags.push({ path: p, kind: 'placeholder', detail: [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => `{${m[1]}}`))].join(', ') });
    }
    PLACEHOLDER.lastIndex = 0;
  }
  for (const c of pkg.concepts) {
    // The concept was written around an offer the page no longer backs (early-bird over, deadline passed, seats gone).
    if (opts.facts && goalBlocked(c.goal, opts.facts)) flags.push({ path: conceptPath(c, 'goal'), kind: 'goal', detail: c.goal });
    const lim = (field: string, text: string, max: number) => { if (chars(text) > max) flags.push({ path: conceptPath(c, field), kind: 'limit', detail: `${chars(text)}/${max}` }); };
    const wl = (field: string, text: string, max: number) => { if (words(text) > max) flags.push({ path: conceptPath(c, field), kind: 'words', detail: `${words(text)}/${max}` }); };
    lim('hook', c.hook, LIMITS.hook);
    wl('headlineEn', c.headlineEn, LIMITS.headlineWords);
    wl('supportEn', c.supportEn, LIMITS.supportWords);
    wl('overlayEn', c.overlayEn, LIMITS.overlayWords);
    lim('meta.primaryEn', c.meta.primaryEn, LIMITS.metaPrimary);
    lim('meta.primaryKh', c.meta.primaryKh, LIMITS.metaPrimary);
    lim('meta.headlineEn', c.meta.headlineEn, LIMITS.metaHeadline);
    lim('meta.headlineKh', c.meta.headlineKh, LIMITS.metaHeadline);
    lim('meta.descriptionEn', c.meta.descriptionEn, LIMITS.metaDescription);
    lim('meta.descriptionKh', c.meta.descriptionKh, LIMITS.metaDescription);
    // TikTok counts the hashtags in its 100 characters.
    lim('tiktok.captionEn', `${c.tiktok.captionEn} ${c.tiktok.hashtags.join(' ')}`.trim(), LIMITS.tiktokCaption);
    lim('tiktok.captionKh', `${c.tiktok.captionKh} ${c.tiktok.hashtags.join(' ')}`.trim(), LIMITS.tiktokCaption);
    lim('telegram.postEn', c.telegram.postEn, LIMITS.telegramPost);
    lim('telegram.postKh', c.telegram.postKh, LIMITS.telegramPost);
  }
  pkg.google.headlines.forEach((h, i) => { if (chars(h) > LIMITS.googleHeadline) flags.push({ path: `google.headlines.${i}`, kind: 'limit', detail: `${chars(h)}/${LIMITS.googleHeadline}` }); });
  pkg.google.descriptions.forEach((h, i) => { if (chars(h) > LIMITS.googleDescription) flags.push({ path: `google.descriptions.${i}`, kind: 'limit', detail: `${chars(h)}/${LIMITS.googleDescription}` }); });
  pkg.google.sitelinks.forEach((h, i) => { if (chars(h) > LIMITS.googleSitelink) flags.push({ path: `google.sitelinks.${i}`, kind: 'limit', detail: `${chars(h)}/${LIMITS.googleSitelink}` }); });
  if (chars(pkg.linkedin.introEn) > LIMITS.linkedinIntro) flags.push({ path: 'linkedin.introEn', kind: 'limit', detail: `${chars(pkg.linkedin.introEn)}/${LIMITS.linkedinIntro}` });
  if (chars(pkg.linkedin.bodyEn) > LIMITS.linkedinBody) flags.push({ path: 'linkedin.bodyEn', kind: 'limit', detail: `${chars(pkg.linkedin.bodyEn)}/${LIMITS.linkedinBody}` });
  if (words(pkg.reply.firstEn) > LIMITS.replyWords) flags.push({ path: 'reply.firstEn', kind: 'words', detail: `${words(pkg.reply.firstEn)}/${LIMITS.replyWords}` });
  if (words(pkg.reply.followUpEn) > LIMITS.followUpWords) flags.push({ path: 'reply.followUpEn', kind: 'words', detail: `${words(pkg.reply.followUpEn)}/${LIMITS.followUpWords}` });
  return flags;
}

/** True when a line may be copied without a second look (no flag of a blocking kind). */
export function isClean(flags: Flag[], path: string): boolean {
  return !flags.some((f) => f.path === path && (f.kind === 'number' || f.kind === 'liveFact' || f.kind === 'limit' || f.kind === 'price'));
}

// ---- Deterministic parts: the numbers, prompts and plans the code owns ----

/** The offer, button and reassurance lines for a concept, live from the CMS. */
export function conceptLines(facts: PosterFacts, c: AdConcept, lang: Lang) {
  const base = posterCopy(facts, c.goal, lang);
  return {
    headline: (lang === 'kh' ? c.headlineKh : c.headlineEn) || base.headline,
    support: (lang === 'kh' ? c.supportKh : c.supportEn) || base.support,
    offer: base.offer,
    cta: base.cta,
    trust: base.trust,
    overlay: lang === 'kh' ? c.overlayKh : c.overlayEn,
  };
}

/** The four background-photo prompts of a concept, one per size. */
export function conceptImagePrompts(facts: PosterFacts, c: AdConcept) {
  return POSTER_FORMATS.map((format) => ({ format, prompt: imagePrompt(facts, c.goal, format, c.scene) }));
}

/** The text a designer types over the photo, in hierarchy order, in one language. */
export function canvaPack(facts: PosterFacts, c: AdConcept, lang: Lang, link?: string): string {
  const l = conceptLines(facts, c, lang);
  return [
    `Poster text (${lang === 'kh' ? 'Khmer, typeset with a Khmer font such as Kantumruy Pro or Battambang' : 'English'}), in reading order:`,
    `1. Headline: ${l.headline}`,
    l.support ? `2. Supporting line: ${l.support}` : '',
    l.offer ? `3. Offer line (from the CMS today): ${l.offer}` : '',
    l.cta ? `4. Button: ${l.cta}` : '',
    l.trust ? `5. Reassurance: ${l.trust}` : '',
    l.overlay ? `Story/Reel overlay (9:16): ${l.overlay}` : '',
    link ? `QR code and link: ${link}` : 'Leave space for a QR code at the bottom right.',
    `Brand colour: ${facts.accent}. Use it for the button and highlights. ${c.colourNote}`.trim(),
    '',
    'Sizes (one master layout, re-cropped):',
    ...POSTER_FORMATS.map((f) => `- ${f.ratio}, ${f.width}×${f.height} px: ${f.placements}. Layout: ${f.layout}. Safe zone: ${f.safeZone}.`),
  ].filter(Boolean).join('\n');
}

/** One prompt for a design assistant covering the photo, the text in both languages and the rules, for this concept. */
export function conceptDesignPrompt(facts: PosterFacts, c: AdConcept, link?: string): string {
  const lines = (lang: Lang) => {
    const l = conceptLines(facts, c, lang);
    return [`- Headline: ${l.headline}`, l.support ? `- Supporting line: ${l.support}` : '', l.offer ? `- Offer line: ${l.offer}` : '', l.cta ? `- Button text: ${l.cta}` : '', l.trust ? `- Reassurance: ${l.trust}` : '', l.overlay ? `- Story overlay (9:16 only): ${l.overlay}` : ''].filter(Boolean).join('\n');
  };
  return [
    `Design a set of social media ad posters for this business trip: ${pick(facts.title, 'en')}.`,
    `Big idea: ${c.hook}`,
    '',
    'Sizes (one master layout, re-cropped for each):',
    ...POSTER_FORMATS.map((f) => `- ${f.ratio}, ${f.width}×${f.height} px: ${f.placements}. Layout: ${f.layout}. Safe zone: ${f.safeZone}.`),
    '',
    `Background photo: ${c.scene} Sharpest subject: ${c.focalSubject}. Realistic editorial photography, natural light. No text, logos, flags or app screens inside the photo.`,
    `Brand colour: ${facts.accent}. ${c.colourNote}`.trim(),
    '',
    'Text in English:',
    lines('en'),
    '',
    'Text in Khmer (typeset with a Khmer font such as Kantumruy Pro or Battambang; never draw Khmer inside a generated image):',
    lines('kh'),
    '',
    link ? `QR code and link: ${link} (QR code at least 180 px wide on the 1080 px sizes, bottom right).` : 'Leave space for a QR code at the bottom right (at least 180 px wide on the 1080 px sizes).',
    '',
    'Rules: use only the text above, exactly as written. Do not add prices, dates, seat numbers, testimonials, partner logos or statistics. One headline, one offer line and one button per poster. High contrast; the headline readable on a phone.',
  ].join('\n');
}

/** Carousel cards (Facebook, Instagram, a Telegram album) from what the page promises: no AI. */
export function carouselCards(brief: PageBrief, facts: PosterFacts, goal: PosterGoal, lang: Lang): string[] {
  const sections = brief.sections[lang];
  const pickKind = (kinds: string[]) => sections.find((s) => kinds.includes(s.kind));
  const list = pickKind(['included', 'inclusions']) || pickKind(['benefits', 'highlights', 'coreValues']);
  if (!list) return [];
  const copy = posterCopy(facts, goal, lang);
  const items = list.lines
    .filter((l) => !/^Note:/i.test(l))
    .map((l) => l.replace(/^(Included|Not included):\s*/i, (m, label: string) => (/^not included$/i.test(label) ? '✕ ' : '')).trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((l) => (chars(l) > 40 ? `${[...l].slice(0, 39).join('').trim()}…` : l));
  if (!items.length) return [];
  return [copy.headline, ...items, [copy.offer, copy.cta].filter(Boolean).join(' · ')].filter(Boolean);
}

export type PlanStep = 'launch' | 'earlyReminder' | 'earlyLastDay' | 'closingWeek' | 'closingLastDay' | 'afterDeadline' | 'objections';
export interface PlanRow { step: PlanStep; day?: string; concept?: ConceptId; goal: PosterGoal | null }

const PP_OFFSET_MS = 7 * 3_600_000;
/** The Phnom Penh calendar day of an instant, as a day number. */
const ppDayNumber = (ms: number) => Math.floor((ms + PP_OFFSET_MS) / 86_400_000);

/** When to post what, from the page's real dates (Phnom Penh time). Rows before today's Phnom Penh day are left out; the launch row is always first. */
export function postingPlan(facts: PosterFacts, nowMs: number): PlanRow[] {
  const dayMs = 86_400_000;
  const rows: Array<PlanRow & { at: number }> = [];
  const push = (step: PlanStep, at: number, goal: PosterGoal | null, concept?: ConceptId) => { if (ppDayNumber(at) >= ppDayNumber(nowMs)) rows.push({ step, at, day: new Date(at).toISOString(), goal, concept }); };
  // The launch sorts before everything, even a reminder that falls today.
  rows.push({ step: 'launch', at: -Infinity, goal: allowedGoals(facts)[0] === 'launch' ? 'launch' : defaultGoal(facts), concept: 'a' });
  if (facts.earlyUntil) {
    const end = Date.parse(facts.earlyUntil);
    push('earlyReminder', end - 3 * dayMs, 'early', 'b');
    push('earlyLastDay', end, 'early', 'a');
  }
  if (facts.deadline) {
    const end = Date.parse(facts.deadline);
    push('closingWeek', end - 7 * dayMs, 'deadline', 'c');
    push('closingLastDay', end, 'deadline', 'a');
    push('afterDeadline', end + dayMs, null);
  }
  const sorted = rows.sort((x, y) => x.at - y.at).map((r): PlanRow => ({ step: r.step, day: r.day, concept: r.concept, goal: r.goal }));
  // Objection posts fill the gaps after launch.
  sorted.splice(1, 0, { step: 'objections', goal: null });
  return sorted;
}

/** The day of a plan row as the pages write it, or '' for "now". */
export const planDay = (row: PlanRow, lang: Lang) => (row.day && row.step !== 'launch' ? ppDay(row.day, lang) : '');

/** Google Ads headlines that carry a number, built from the CMS so the AI never types one; only those within 30 characters. */
export function googleFactHeadlines(facts: PosterFacts): string[] {
  const price = formatPrice(facts.price, facts.currency);
  const out = [
    price ? `From ${price} ${pick(facts.priceNote, 'en')}`.trim() : '',
    facts.earlyUntil ? `Early-bird until ${ppDay(facts.earlyUntil, 'en').replace(/ \d{4}$/, '')}` : '',
    facts.deadline ? `Register by ${ppDay(facts.deadline, 'en').replace(/ \d{4}$/, '')}` : '',
    facts.seatsLeft !== null && facts.seatsLeft > 0 ? `${facts.seatsLeft} ${pick(facts.seatLabel, 'en')}` : '',
  ];
  return out.filter((h) => h && chars(h) <= LIMITS.googleHeadline);
}

/** The whole package as one text brief for a designer or an agency. Live numbers come from the CMS at export time. */
export function packageMarkdown(stored: StoredAdPackage, brief: Pick<PageBrief, 'slug' | 'title' | 'facts'>, links: Partial<Record<ConceptId, string>> = {}, flags: Flag[] = []): string {
  const p = stored.package;
  const f = brief.facts;
  // A flagged line leaves with its warning in front, so a designer or an agency sees it too.
  const w = (path: string, text: string) => {
    const mine = flags.filter((x) => x.path === path && x.kind !== 'superlative' && x.kind !== 'words');
    return mine.length ? `⚠ [${mine.map((x) => `${x.kind}: ${x.detail}`).join('; ')}] ${text}` : text;
  };
  const out: string[] = [
    `# Ads brief: ${brief.title}`,
    `Page: https://sale.khbevents.com/${brief.slug}`,
    `Made ${stored.generatedAt.slice(0, 10)} with ${stored.model}. Use only the facts below; every number must match the page today.`,
    '',
    '## Facts from the CMS today',
    ...factLines(f, 'en').map((l) => `- ${l}`),
    ...(factLines(f, 'en').length ? [] : ['- No price, dates or seats are set on this page.']),
    '',
    '## What the page sells',
    `- Audience: ${p.analysis.audienceEn}`,
    `- Outcome: ${p.analysis.outcomeEn}`,
    `- Fear answered: ${p.analysis.fearEn}`,
    ...p.analysis.proofPoints.map((x) => `- Proof (${x.source}): ${x.text}`),
    ...(p.analysis.missingFacts.length ? ['', 'Not on the page yet (ask the owner, do not invent):', ...p.analysis.missingFacts.map((m) => `- ${m}`)] : []),
  ];
  for (const c of p.concepts) {
    const en = conceptLines(f, c, 'en');
    const kh = conceptLines(f, c, 'kh');
    const cp = (field: string) => `concepts.${c.id}.${field}`;
    out.push('', `## Concept ${c.id.toUpperCase()} · ${c.angle}`, w(cp('goal'), w(cp('hook'), c.hook)), '', `Photo: ${w(cp('scene'), c.scene)} Sharpest: ${c.focalSubject}. ${c.colourNote}`, '',
      'Poster text EN:', `- Headline: ${w(cp('headlineEn'), en.headline)}`, en.support ? `- Supporting line: ${w(cp('supportEn'), en.support)}` : '', en.offer ? `- Offer line (CMS): ${en.offer}` : '', en.cta ? `- Button: ${en.cta}` : '', en.trust ? `- Reassurance: ${en.trust}` : '', en.overlay ? `- Story overlay: ${w(cp('overlayEn'), en.overlay)}` : '',
      'Poster text KH:', `- Headline: ${w(cp('headlineKh'), kh.headline)}`, kh.support ? `- Supporting line: ${w(cp('supportKh'), kh.support)}` : '', kh.offer ? `- Offer line (CMS): ${kh.offer}` : '', kh.cta ? `- Button: ${kh.cta}` : '', kh.trust ? `- Reassurance: ${kh.trust}` : '', kh.overlay ? `- Story overlay: ${w(cp('overlayKh'), kh.overlay)}` : '',
      '', 'Facebook / Instagram:', `- Primary text EN: ${w(cp('meta.primaryEn'), c.meta.primaryEn)}`, `- Primary text KH: ${w(cp('meta.primaryKh'), c.meta.primaryKh)}`, `- Headline EN: ${w(cp('meta.headlineEn'), c.meta.headlineEn)} · KH: ${w(cp('meta.headlineKh'), c.meta.headlineKh)}`, `- Description EN: ${w(cp('meta.descriptionEn'), c.meta.descriptionEn)} · KH: ${w(cp('meta.descriptionKh'), c.meta.descriptionKh)}`,
      'TikTok:', `- EN: ${w(cp('tiktok.captionEn'), c.tiktok.captionEn)}`, `- KH: ${w(cp('tiktok.captionKh'), c.tiktok.captionKh)}`, `- Hashtags: ${c.tiktok.hashtags.join(' ')}`,
      'Telegram post EN:', w(cp('telegram.postEn'), c.telegram.postEn), 'Telegram post KH:', w(cp('telegram.postKh'), c.telegram.postKh),
      links[c.id] ? `Tracked link: ${links[c.id]}` : '');
  }
  out.push('', '## Short video, 15 to 20 seconds (phone)', ...p.video.shots.map((s, i) => `${i + 1}. ${s.seconds}s · film: ${w(`video.shots.${i}.film`, s.film)} · on screen: ${s.onScreenEn} / ${s.onScreenKh} · voice: ${w(`video.shots.${i}.voiceKh`, s.voiceKh)} (${w(`video.shots.${i}.voiceEn`, s.voiceEn)})`), `Closing: ${w('video.closingKh', p.video.closingKh)} (${w('video.closingEn', p.video.closingEn)})`, `Music: ${p.video.musicMood}`);
  out.push('', '## Google Ads (English)', 'Headlines (≤30):', ...googleFactHeadlines(f).map((h) => `- ${h} (CMS)`), ...p.google.headlines.map((h, i) => `- ${w(`google.headlines.${i}`, h)}`), 'Descriptions (≤90):', ...p.google.descriptions.map((h, i) => `- ${w(`google.descriptions.${i}`, h)}`), 'Sitelinks:', ...p.google.sitelinks.map((h, i) => `- ${w(`google.sitelinks.${i}`, h)}`), 'Keywords:', p.google.keywords.join(', '));
  out.push('', '## LinkedIn', w('linkedin.introEn', p.linkedin.introEn), '', w('linkedin.bodyEn', p.linkedin.bodyEn), p.linkedin.hashtags.join(' '));
  if (p.objections.length) out.push('', '## Objection posts', ...p.objections.flatMap((o, i) => [`- ${w(`objections.${i}.objectionEn`, o.objectionEn)} → ${w(`objections.${i}.answerEn`, o.answerEn)} (from FAQ: ${o.sourceQuestion})`, `  KH: ${w(`objections.${i}.objectionKh`, o.objectionKh)} → ${w(`objections.${i}.answerKh`, o.answerKh)}`]));
  out.push('', '## First Telegram reply (a person sends it)', `EN: ${w('reply.firstEn', p.reply.firstEn)}`, `KH: ${w('reply.firstKh', p.reply.firstKh)}`, `Follow-up EN: ${w('reply.followUpEn', p.reply.followUpEn)}`, `Follow-up KH: ${w('reply.followUpKh', p.reply.followUpKh)}`);
  out.push('', '## Targeting (suggestions)', `Location: Cambodia, Phnom Penh first · Age 25–55 · Languages Khmer, English`, `Interests: ${p.targeting.interests.join(', ')}`, `Job titles: ${p.targeting.jobTitles.join(', ')}`, `Exclude: ${p.targeting.exclude.join(', ')}`, `Retargeting EN: ${w('targeting.retargetingEn', p.targeting.retargetingEn)}`, `Retargeting KH: ${w('targeting.retargetingKh', p.targeting.retargetingKh)}`);
  out.push('', '## A/B tests', ...p.abTests.map((t) => `- ${t.hypothesis} (${t.variantA.toUpperCase()} vs ${t.variantB.toUpperCase()}, metric ${t.metric.replace(/_/g, ' ')}, run ${t.runFor.replace(/_/g, ' ')})`));
  return out.filter((l) => l !== undefined).join('\n');
}
