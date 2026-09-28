/**
 * The page brief: everything a landing page says, in English and Khmer, plus its live facts
 * (price, dates, seats), gathered in one place for the ads generator (Gen Ads). The AI may
 * use only what is in here; every number it writes is checked against these texts.
 *
 * Client-safe: no Next.js or Node imports.
 */
import { normalizeBuilderDoc, pick, formatPrice, type Bi, type Lang } from './builder';
import { posterFacts, ppDay, type PosterFacts } from './ad-posters';
import type { LandingPage } from './types';

export interface BriefSection {
  /** Block or field the lines come from ("hero", "benefits", "faq", …). */
  kind: string;
  title: string;
  lines: string[];
}

export interface PageBrief {
  slug: string;
  title: string;
  category: string;
  /** Language a first-time visitor sees. */
  defaultLang: Lang;
  facts: PosterFacts;
  /** The main button opens Telegram, or the form. */
  ctaKind: 'telegram' | 'form' | 'link';
  coordinatorName?: string;
  sections: { en: BriefSection[]; kh: BriefSection[] };
  /** The whole page as text, per language, for the AI and for the number check. */
  text: { en: string; kh: string };
}

const MAX_LINE = 400;
const MAX_LINES = 12;
const MAX_TEXT = 14_000;

// Runs of '=' are neutralised so a CMS line can never look like the prompt's data markers.
const clip = (s: unknown, n = MAX_LINE) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').replace(/={3,}/g, '—').trim().slice(0, n) : '');
const take = (lines: string[]) => lines.map((l) => clip(l)).filter(Boolean).slice(0, MAX_LINES);

/**
 * Digit groups in a text (Khmer digits read as Latin), e.g. "$750 on 30 Sep" → ["750", "30"].
 * Digits glued to Latin letters (B2B, 4K) are not numbers; "2,500" → "2500"; "799.00" → "799"; "1.5" stays "1.5".
 */
export function numbersIn(text: string): string[] {
  const latin = text.replace(/[០-៩]/g, (d) => String('០១២៣៤៥៦៧៨៩'.indexOf(d)));
  return (latin.match(/(?<![A-Za-z\d])\d+(?:[.,]\d+)*(?![A-Za-z])/g) || []).map((n) => {
    const noThousands = n.replace(/,(?=\d{3}(?!\d))/g, '');
    const [int, ...rest] = noThousands.split(/[.,]/);
    const frac = rest.join('').replace(/0+$/, '');
    return frac ? `${int}.${frac}` : int;
  });
}

/** Numbers in `text` that do not appear in `allowed` (a fact source); [] when every number is backed. */
export function unbackedNumbers(text: string, allowed: Set<string>): string[] {
  return [...new Set(numbersIn(text).filter((n) => !allowed.has(n)))];
}

function builderSections(page: LandingPage, lang: Lang): BriefSection[] {
  const doc = normalizeBuilderDoc(page.builder);
  const t = (b?: Bi) => clip(pick(b, lang));
  const out: BriefSection[] = [];
  for (const b of doc.blocks) {
    switch (b.type) {
      case 'hero':
        out.push({ kind: 'hero', title: 'Hero', lines: take([b.badge ? `Badge: ${t(b.badge)}` : '', `Headline: ${t(b.headline)}`, b.sub ? `Supporting line: ${t(b.sub)}` : '', `Button: ${t(b.ctaLabel)}`, b.riskNote ? `Reassurance under the button: ${t(b.riskNote)}` : '']) });
        break;
      case 'benefits':
        out.push({ kind: 'benefits', title: t(b.title) || 'Benefits', lines: take([t(b.sub), ...b.items.map((i) => [t(i.title), t(i.text)].filter(Boolean).join(': '))]) });
        break;
      case 'included':
        out.push({ kind: 'included', title: t(b.title) || 'Included', lines: take([t(b.sub), ...b.items.map((i) => t(i)), b.note ? `Note: ${t(b.note)}` : '']) });
        break;
      case 'inclusions':
        out.push({ kind: 'inclusions', title: t(b.title) || 'Included and not included', lines: take([...b.included.map((i) => `${t(b.includedTitle) || 'Included'}: ${t(i)}`), ...b.excluded.map((i) => `${t(b.excludedTitle) || 'Not included'}: ${t(i)}`), b.note ? `Note: ${t(b.note)}` : '']) });
        break;
      case 'offer':
        out.push({ kind: 'offer', title: t(b.title) || 'Offer', lines: take([...b.features.map((f) => t(f)), `Button: ${t(b.ctaLabel)}`, b.note ? `Note: ${t(b.note)}` : '']) });
        break;
      case 'steps':
        // No "1." prefixes: a number the code adds must never back a number the AI writes.
        out.push({ kind: 'steps', title: t(b.title) || 'How to join', lines: take(b.items.map((s) => [t(s.title), t(s.text)].filter(Boolean).join(': '))) });
        break;
      case 'form':
        out.push({ kind: 'form', title: t(b.title) || 'Form', lines: take([t(b.sub), b.interestLabel ? `Question asked: ${t(b.interestLabel)} (${(b.interestOptions || []).map((o) => t(o)).filter(Boolean).join(' / ')})` : '', `Button: ${t(b.submitLabel)}`, b.successText ? `After sending: ${t(b.successText)}` : '', b.privacyNote ? `Privacy: ${t(b.privacyNote)}` : '']) });
        break;
      case 'faq':
        out.push({ kind: 'faq', title: t(b.title) || 'FAQ', lines: take(b.items.map((q) => `Q: ${t(q.q)} A: ${t(q.a)}`)) });
        break;
      case 'terms':
        out.push({ kind: 'terms', title: t(b.title) || 'Terms', lines: take(b.items.map((i) => `${t(i.title)}: ${clip(pick(i.text, lang), 200)}`)) });
        break;
      case 'finalCta':
        out.push({ kind: 'finalCta', title: 'Closing call to action', lines: take([`Headline: ${t(b.headline)}`, b.sub ? `Supporting line: ${t(b.sub)}` : '', `Button: ${t(b.ctaLabel)}`, b.riskNote ? `Reassurance: ${t(b.riskNote)}` : '']) });
        break;
      case 'gallery': {
        const caps = b.items.map((g) => t(g.caption)).filter(Boolean);
        if (caps.length) out.push({ kind: 'gallery', title: t(b.title) || 'Photos', lines: take(caps) });
        break;
      }
      default:
        break;
    }
  }
  return out.filter((s) => s.lines.length);
}

function classicSections(page: LandingPage, lang: Lang): BriefSection[] {
  const kh = lang === 'kh' ? page.translations?.kh : undefined;
  const s = (en: unknown, k?: unknown) => clip((lang === 'kh' && typeof k === 'string' && k.trim()) ? k : en);
  const out: BriefSection[] = [];
  out.push({ kind: 'hero', title: 'Hero', lines: take([page.badge ? `Badge: ${s(page.badge, kh?.badge)}` : '', `Headline: ${s(page.heroHeadline, kh?.heroHeadline)}`, `Supporting line: ${s(page.heroSubheadline, kh?.heroSubheadline)}`, `Button: ${s(page.heroCtaText, kh?.heroCtaText)}`, page.venue ? `Venue: ${s(page.venue, kh?.venue)}` : '', page.eventDate ? `Date: ${clip(page.eventDate)}` : '']) });
  if (page.highlights?.length) out.push({ kind: 'highlights', title: 'Highlights', lines: take(page.highlights.map((h) => [h.title, h.description].filter(Boolean).join(': '))) });
  const cv = kh?.coreValues || page.coreValues;
  if (cv?.length) out.push({ kind: 'coreValues', title: 'Core value', lines: take(cv.map((c) => [c.title, c.desc].filter(Boolean).join(': '))) });
  const pr = kh?.problems || page.problems;
  if (pr?.length) out.push({ kind: 'problems', title: 'Problems solved', lines: take(pr.map((c) => [c.title, c.desc].filter(Boolean).join(': '))) });
  const au = kh?.audiences || page.audiences;
  if (au?.length) out.push({ kind: 'audiences', title: 'Who it is for', lines: take(au.map((c) => [c.title, c.desc].filter(Boolean).join(': '))) });
  const it = kh?.itinerary || page.itinerary;
  if (it?.length) out.push({ kind: 'itinerary', title: 'Itinerary', lines: take(it.map((d) => `Day ${d.day} ${d.date}: ${d.title}${d.events?.length ? ` (${d.events.map((e) => e.activity).filter(Boolean).slice(0, 6).join(', ')})` : ''}`)) });
  const vs = kh?.valueStack || page.valueStack;
  if (vs?.inclusions?.length) out.push({ kind: 'included', title: vs.title || 'Included', lines: take(vs.inclusions.map((i) => [i.title, i.desc].filter(Boolean).join(': '))) });
  if (page.packages?.length) out.push({ kind: 'packages', title: 'Packages', lines: take(page.packages.map((p) => `${p.name}: ${p.price}${p.period ? ` ${p.period}` : ''}${p.features?.length ? ` (${p.features.slice(0, 6).join(', ')})` : ''}`)) });
  const g = kh?.guarantee || page.guarantee;
  if (g?.points?.length) out.push({ kind: 'guarantee', title: g.title || 'Guarantee', lines: take(g.points) });
  if (page.testimonials?.length) out.push({ kind: 'testimonials', title: 'Testimonials on the page', lines: take(page.testimonials.map((q) => `"${q.quote}" — ${q.name}${q.company ? `, ${q.company}` : ''}`)) });
  const fq = kh?.faqs || page.faqs;
  if (fq?.length) out.push({ kind: 'faq', title: 'FAQ', lines: take(fq.map((q) => `Q: ${q.question} A: ${q.answer}`)) });
  return out.filter((s) => s.lines.length);
}

/** The live numbers as exact lines (Phnom Penh dates), in one language. */
export function factLines(facts: PosterFacts, lang: Lang): string[] {
  const price = formatPrice(facts.price, facts.currency);
  const regular = formatPrice(facts.regularPrice, facts.currency);
  const note = pick(facts.priceNote, lang);
  const out: string[] = [];
  if (price) out.push(lang === 'kh' ? `តម្លៃថ្ងៃនេះ៖ ${price}${note ? ` ${note}` : ''}` : `Price today: ${price}${note ? ` ${note}` : ''}`);
  if (facts.earlyUntil) out.push(lang === 'kh' ? `តម្លៃពិសេសដំបូងដល់ថ្ងៃ ${ppDay(facts.earlyUntil, 'kh')}${regular ? ` (បន្ទាប់មក ${regular})` : ''}` : `Early-bird price until ${ppDay(facts.earlyUntil, 'en')}${regular ? ` (then ${regular})` : ''}`);
  if (facts.deadline) out.push(lang === 'kh' ? `បិទការចុះឈ្មោះ ${ppDay(facts.deadline, 'kh')}` : `Registration closes ${ppDay(facts.deadline, 'en')}`);
  if (facts.deadlinePassed) out.push(lang === 'kh' ? 'ថ្ងៃផុតកំណត់ចុះឈ្មោះលើទំព័របានកន្លងផុតទៅ' : 'The registration deadline on the page has passed');
  if (facts.seatsLeft !== null) out.push(lang === 'kh' ? `${pick(facts.seatLabel, 'kh')} ${facts.seatsLeft}${facts.seatsTotal ? ` នៃ ${facts.seatsTotal}` : ''}` : `${facts.seatsLeft}${facts.seatsTotal ? ` of ${facts.seatsTotal}` : ''} ${pick(facts.seatLabel, 'en')}`);
  return out;
}

function sectionsText(title: string, category: string, description: string, facts: string[], sections: BriefSection[]): string {
  const parts = [`# ${title}`, category ? `Category: ${category}` : '', description ? `Description: ${description}` : '', '', '## Live facts (exact, from the CMS)', ...(facts.length ? facts.map((f) => `- ${f}`) : ['- No price, dates or seats are set on this page.'])];
  for (const s of sections) parts.push('', `## ${s.title}`, ...s.lines.map((l) => `- ${l}`));
  return parts.filter((p) => p !== undefined).join('\n').slice(0, MAX_TEXT);
}

/** Everything the page says, plus its live facts, ready for the AI and the number check. */
export function pageBrief(page: LandingPage, nowMs: number): PageBrief {
  const facts = posterFacts(page, nowMs);
  const builder = page.template === 'builder' && page.builder;
  const doc = builder ? normalizeBuilderDoc(page.builder) : null;
  const sections = {
    en: builder ? builderSections(page, 'en') : classicSections(page, 'en'),
    kh: builder ? builderSections(page, 'kh') : classicSections(page, 'kh'),
  };
  const titleKh = pick(facts.title, 'kh') || page.translations?.kh?.title || page.title;
  const descKh = clip(page.translations?.kh?.description || page.description, 600);
  const ctaKind: PageBrief['ctaKind'] = doc ? (doc.offer.cta.action === 'telegram' ? 'telegram' : /t\.me\//i.test(doc.offer.cta.url || '') ? 'telegram' : doc.offer.cta.url ? 'link' : 'form') : /t\.me\//i.test(page.heroCtaLink || '') ? 'telegram' : 'form';
  return {
    slug: page.slug,
    title: page.title,
    category: page.category || '',
    defaultLang: doc?.defaultLang || 'en',
    facts,
    ctaKind,
    coordinatorName: clip(page.isolatedSettings?.coordinatorName, 80) || undefined,
    sections,
    text: {
      en: sectionsText(page.title, page.category || '', clip(page.description, 600), factLines(facts, 'en'), sections.en),
      kh: sectionsText(titleKh, page.category || '', descKh, factLines(facts, 'kh'), sections.kh),
    },
  };
}

/** Every number the ads may state: the page's own texts in both languages, plus the owner's notes. */
export function allowedNumbers(brief: PageBrief, extra = ''): Set<string> {
  return new Set([...numbersIn(brief.text.en), ...numbersIn(brief.text.kh), ...numbersIn(extra)]);
}

/**
 * The live numbers (price, early-bird date, closing date, seats) that appear only in the CMS facts,
 * not in the page's own copy: the code writes them into the offer line; the AI must not type them.
 */
export function liveOnlyNumbers(brief: PageBrief): Set<string> {
  const inCopy = new Set([...brief.sections.en, ...brief.sections.kh].flatMap((s) => s.lines.flatMap((l) => numbersIn(l))));
  const live = [...factLines(brief.facts, 'en'), ...factLines(brief.facts, 'kh')].flatMap((l) => numbersIn(l));
  return new Set(live.filter((n) => !inCopy.has(n)));
}
