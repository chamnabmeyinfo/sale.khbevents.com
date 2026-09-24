import { safeRedirectUrl } from './safe-url';

/**
 * Drag-and-drop page builder: data model and pure rules.
 *
 * A builder page is a list of components ("blocks"). Every block type has a
 * core value (the one sales job it does), several designed variants, design
 * controls and bilingual content. Prices, dates and stock live once in the
 * page's Offer and every block reads them from there, so they never disagree.
 *
 * Client-safe: no Next.js or Node imports. Shared by the editor, the public
 * renderer and storage.
 */

export type Lang = 'en' | 'kh';

/** English text with an optional Khmer version (falls back to English). */
export interface Bi {
  en: string;
  kh?: string;
}

export type BlockTheme = 'dark' | 'light' | 'brand';
export type BlockAlign = 'left' | 'center';
export type BlockSpacing = 'compact' | 'normal' | 'roomy';

export interface BlockStyle {
  theme: BlockTheme;
  align: BlockAlign;
  spacing: BlockSpacing;
  /** Optional background photo (darkened for legibility). */
  bgImage?: string;
}

interface BlockBase {
  id: string;
  style: BlockStyle;
}

export interface HeroBlock extends BlockBase {
  type: 'hero';
  variant: 'split' | 'fullbleed';
  badge?: Bi;
  headline: Bi;
  sub?: Bi;
  image?: string;
  ctaLabel: Bi;
  /** Short reassurance under the button, e.g. "No payment today". */
  riskNote?: Bi;
}

export interface OfferBlock extends BlockBase {
  type: 'offer';
  variant: 'card' | 'banner';
  title: Bi;
  features: Bi[];
  ctaLabel: Bi;
  note?: Bi;
}

export interface FaqItem {
  q: Bi;
  a: Bi;
}

export interface FaqBlock extends BlockBase {
  type: 'faq';
  variant: 'accordion' | 'columns';
  title: Bi;
  items: FaqItem[];
}

export type BuilderBlock = HeroBlock | OfferBlock | FaqBlock;
export type BlockType = BuilderBlock['type'];

export interface BuilderOffer {
  name: Bi;
  /** Price in the offer currency; null hides the price ("ask us"). */
  price: number | null;
  /** Previous price, shown struck through only when higher than price. */
  compareAtPrice: number | null;
  currency: 'USD' | 'KHR';
  /** Shown after the price, e.g. "per person". */
  priceNote?: Bi;
  /** ISO date the offer or discount ends; drives the countdown. */
  deadline?: string;
  /** Seats or stock; both null hides the counter. */
  stockTotal: number | null;
  stockLeft: number | null;
  /** What is counted: "seats", "units", "spots". */
  stockLabel: Bi;
  cta: { action: 'telegram' | 'url'; url?: string };
}

export interface BuilderBrand {
  /** Button and highlight colour. */
  accent: string;
  /** Corner style for cards and buttons. */
  radius: 'sharp' | 'soft' | 'round';
}

export interface BuilderDoc {
  version: 1;
  offer: BuilderOffer;
  brand: BuilderBrand;
  blocks: BuilderBlock[];
}

export const DEFAULT_ACCENT = '#E5A93C';
export const MAX_BLOCKS = 40;

// ─── Text helpers ──────────────────────────────────────────────────────────

export function pick(text: Bi | undefined, lang: Lang): string {
  if (!text) return '';
  return (lang === 'kh' && text.kh?.trim()) || text.en || '';
}

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');

function bi(v: unknown, max: number, fallback?: Bi): Bi {
  if (typeof v === 'string') return { en: str(v, max) };
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const en = str(o.en, max);
    const kh = str(o.kh, max);
    return kh ? { en, kh } : { en };
  }
  return fallback ? { ...fallback } : { en: '' };
}

function optBi(v: unknown, max: number): Bi | undefined {
  const b = bi(v, max);
  return b.en.trim() || b.kh?.trim() ? b : undefined;
}

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

function num(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

const url = (v: unknown): string | undefined => safeRedirectUrl(str(v, 2000)) || undefined;
const HEX = /^#[0-9a-fA-F]{6}$/;

export function newBlockId(): string {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Component registry ────────────────────────────────────────────────────

export interface BlockDefinition {
  type: BlockType;
  name: Bi;
  /** The one sales job this component does. */
  coreValue: Bi;
  variants: Array<{ id: string; name: Bi; detail: Bi }>;
  create: () => BuilderBlock;
}

const baseStyle = (theme: BlockTheme = 'dark', align: BlockAlign = 'left'): BlockStyle => ({ theme, align, spacing: 'normal' });

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  hero: {
    type: 'hero',
    name: { en: 'Hero', kh: 'ផ្នែកខាងលើ (Hero)' },
    coreValue: { en: 'Promise the result in one glance, with the main button on the first screen.', kh: 'សន្យាលទ្ធផលក្នុងមួយភ្លែត ហើយប៊ូតុងសំខាន់នៅលើអេក្រង់ទីមួយ។' },
    variants: [
      { id: 'split', name: { en: 'Split photo', kh: 'រូបភាពម្ខាង' }, detail: { en: 'Text on one side, photo on the other.', kh: 'អត្ថបទម្ខាង រូបភាពម្ខាង។' } },
      { id: 'fullbleed', name: { en: 'Full photo', kh: 'រូបភាពពេញ' }, detail: { en: 'Photo fills the section, text on top.', kh: 'រូបភាពពេញផ្នែក អត្ថបទនៅលើ។' } },
    ],
    create: () => ({
      id: newBlockId(),
      type: 'hero',
      variant: 'split',
      style: baseStyle('dark'),
      badge: { en: 'New', kh: 'ថ្មី' },
      headline: { en: 'Say the result your buyer wants', kh: 'សរសេរលទ្ធផលដែលអ្នកទិញចង់បាន' },
      sub: { en: 'One or two sentences: who it is for and what they get.', kh: 'មួយ ឬពីរប្រយោគ៖ សម្រាប់អ្នកណា និងទទួលបានអ្វី។' },
      ctaLabel: { en: 'Chat with us on Telegram', kh: 'ជជែកតាម Telegram' },
      riskNote: { en: 'No payment today', kh: 'មិនបង់ប្រាក់ថ្ងៃនេះ' },
    }),
  },
  offer: {
    type: 'offer',
    name: { en: 'Offer card', kh: 'កាតការផ្តល់ជូន' },
    coreValue: { en: 'Make the price, what is included and the deadline impossible to miss.', kh: 'បង្ហាញតម្លៃ អ្វីដែលរួមបញ្ចូល និងថ្ងៃផុតកំណត់ឱ្យច្បាស់។' },
    variants: [
      { id: 'card', name: { en: 'Price card', kh: 'កាតតម្លៃ' }, detail: { en: 'A focused card with the list of what is included.', kh: 'កាតផ្តោតលើតម្លៃ និងបញ្ជីអ្វីដែលរួមបញ្ចូល។' } },
      { id: 'banner', name: { en: 'Price banner', kh: 'បដាតម្លៃ' }, detail: { en: 'A wide strip: price, countdown and button in one row.', kh: 'បដាវែង៖ តម្លៃ ពេលវេលារាប់ថយក្រោយ និងប៊ូតុង។' } },
    ],
    create: () => ({
      id: newBlockId(),
      type: 'offer',
      variant: 'card',
      style: baseStyle('light', 'center'),
      title: { en: 'What you get', kh: 'អ្វីដែលលោកអ្នកទទួលបាន' },
      features: [
        { en: 'First thing included', kh: 'ចំណុចទីមួយដែលរួមបញ្ចូល' },
        { en: 'Second thing included', kh: 'ចំណុចទីពីរដែលរួមបញ្ចូល' },
        { en: 'Third thing included', kh: 'ចំណុចទីបីដែលរួមបញ្ចូល' },
      ],
      ctaLabel: { en: 'Reserve now', kh: 'កក់ឥឡូវ' },
      note: { en: 'We reply on Telegram within minutes.', kh: 'យើងឆ្លើយតាម Telegram ក្នុងពេលប៉ុន្មាននាទី។' },
    }),
  },
  faq: {
    type: 'faq',
    name: { en: 'FAQ', kh: 'សំណួរញឹកញាប់' },
    coreValue: { en: 'Remove the doubts that stop people from buying.', kh: 'លុបការសង្ស័យដែលធ្វើឱ្យអ្នកទិញស្ទាក់ស្ទើរ។' },
    variants: [
      { id: 'accordion', name: { en: 'Accordion', kh: 'បើក/បិទ' }, detail: { en: 'Questions open one at a time. Best for many questions.', kh: 'បើកម្តងមួយសំណួរ។ ល្អសម្រាប់សំណួរច្រើន។' } },
      { id: 'columns', name: { en: 'Two columns', kh: 'ពីរជួរ' }, detail: { en: 'All answers visible. Best for four to six questions.', kh: 'ចម្លើយទាំងអស់បង្ហាញ។ ល្អសម្រាប់ ៤ ដល់ ៦ សំណួរ។' } },
    ],
    create: () => ({
      id: newBlockId(),
      type: 'faq',
      variant: 'accordion',
      style: baseStyle('light', 'left'),
      title: { en: 'Questions buyers ask', kh: 'សំណួរដែលអ្នកទិញសួរ' },
      items: [
        { q: { en: 'Do I have to pay today?', kh: 'តើត្រូវបង់ប្រាក់ថ្ងៃនេះទេ?' }, a: { en: 'Write your real answer here.', kh: 'សរសេរចម្លើយពិតរបស់លោកអ្នកនៅទីនេះ។' } },
        { q: { en: 'How do I get it?', kh: 'តើទទួលបានដោយរបៀបណា?' }, a: { en: 'Write your real answer here.', kh: 'សរសេរចម្លើយពិតរបស់លោកអ្នកនៅទីនេះ។' } },
      ],
    }),
  },
};

export const BLOCK_TYPES = Object.keys(BLOCK_DEFINITIONS) as BlockType[];

export function createBlock(type: BlockType): BuilderBlock {
  return BLOCK_DEFINITIONS[type].create();
}

export function defaultOffer(): BuilderOffer {
  return {
    name: { en: '' },
    price: null,
    compareAtPrice: null,
    currency: 'USD',
    stockTotal: null,
    stockLeft: null,
    stockLabel: { en: 'seats left', kh: 'កៅអីនៅសល់' },
    cta: { action: 'telegram' },
  };
}

/** A new page starts with the three pilot components in a sensible order. */
export function defaultBuilderDoc(): BuilderDoc {
  return {
    version: 1,
    offer: defaultOffer(),
    brand: { accent: DEFAULT_ACCENT, radius: 'soft' },
    blocks: [createBlock('hero'), createBlock('offer'), createBlock('faq')],
  };
}

// ─── Validation ────────────────────────────────────────────────────────────

function normalizeStyle(v: unknown, fallback: BlockStyle): BlockStyle {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return {
    theme: oneOf(o.theme, ['dark', 'light', 'brand'] as const, fallback.theme),
    align: oneOf(o.align, ['left', 'center'] as const, fallback.align),
    spacing: oneOf(o.spacing, ['compact', 'normal', 'roomy'] as const, fallback.spacing),
    bgImage: url(o.bgImage),
  };
}

function normalizeBlock(v: unknown): BuilderBlock | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const type = o.type as BlockType;
  const def = BLOCK_DEFINITIONS[type];
  if (!def) return null;
  const blank = def.create();
  const id = str(o.id, 60).replace(/[^A-Za-z0-9_-]/g, '') || blank.id;
  const style = normalizeStyle(o.style, blank.style);
  if (type === 'hero') {
    const b = blank as HeroBlock;
    return {
      id, style, type,
      variant: oneOf(o.variant, ['split', 'fullbleed'] as const, b.variant),
      badge: optBi(o.badge, 60),
      headline: bi(o.headline, 160, { en: '' }),
      sub: optBi(o.sub, 400),
      image: url(o.image),
      ctaLabel: bi(o.ctaLabel, 60, b.ctaLabel),
      riskNote: optBi(o.riskNote, 120),
    };
  }
  if (type === 'offer') {
    const b = blank as OfferBlock;
    const features = Array.isArray(o.features) ? o.features.slice(0, 12).map((f) => bi(f, 160)).filter((f) => f.en.trim() || f.kh?.trim()) : [];
    return {
      id, style, type,
      variant: oneOf(o.variant, ['card', 'banner'] as const, b.variant),
      title: bi(o.title, 120, { en: '' }),
      features,
      ctaLabel: bi(o.ctaLabel, 60, b.ctaLabel),
      note: optBi(o.note, 200),
    };
  }
  const b = blank as FaqBlock;
  const items = Array.isArray(o.items)
    ? o.items.slice(0, 20).map((it) => {
        const r = (it && typeof it === 'object' ? it : {}) as Record<string, unknown>;
        return { q: bi(r.q, 200), a: bi(r.a, 1200) };
      }).filter((it) => it.q.en.trim() || it.q.kh?.trim())
    : [];
  return {
    id, style, type: 'faq',
    variant: oneOf(o.variant, ['accordion', 'columns'] as const, b.variant),
    title: bi(o.title, 120, { en: '' }),
    items,
  };
}

function normalizeOffer(v: unknown): BuilderOffer {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const d = defaultOffer();
  const ctaRaw = (o.cta && typeof o.cta === 'object' ? o.cta : {}) as Record<string, unknown>;
  const action = oneOf(ctaRaw.action, ['telegram', 'url'] as const, 'telegram');
  const deadlineMs = typeof o.deadline === 'string' ? new Date(o.deadline).getTime() : NaN;
  const stockTotal = num(o.stockTotal, 0, 1_000_000);
  const stockLeftRaw = num(o.stockLeft, 0, 1_000_000);
  return {
    name: bi(o.name, 120, d.name),
    price: num(o.price, 0, 1_000_000_000),
    compareAtPrice: num(o.compareAtPrice, 0, 1_000_000_000),
    currency: oneOf(o.currency, ['USD', 'KHR'] as const, 'USD'),
    priceNote: optBi(o.priceNote, 60),
    deadline: Number.isFinite(deadlineMs) ? new Date(deadlineMs).toISOString() : undefined,
    stockTotal,
    stockLeft: stockLeftRaw !== null && stockTotal !== null ? Math.min(stockLeftRaw, stockTotal) : stockLeftRaw,
    stockLabel: bi(o.stockLabel, 40, d.stockLabel),
    cta: action === 'url' ? { action, url: url(ctaRaw.url) } : { action },
  };
}

/** Cleans a builder document from the editor or storage. Unknown fields and invalid blocks are dropped. */
export function normalizeBuilderDoc(input: unknown): BuilderDoc {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const brandRaw = (o.brand && typeof o.brand === 'object' ? o.brand : {}) as Record<string, unknown>;
  const accent = str(brandRaw.accent, 7);
  const seen = new Set<string>();
  const blocks: BuilderBlock[] = [];
  for (const raw of Array.isArray(o.blocks) ? o.blocks : []) {
    const block = normalizeBlock(raw);
    if (!block) continue;
    if (seen.has(block.id)) block.id = newBlockId();
    seen.add(block.id);
    blocks.push(block);
    if (blocks.length >= MAX_BLOCKS) break;
  }
  return {
    version: 1,
    offer: normalizeOffer(o.offer),
    brand: {
      accent: HEX.test(accent) ? accent : DEFAULT_ACCENT,
      radius: oneOf(brandRaw.radius, ['sharp', 'soft', 'round'] as const, 'soft'),
    },
    blocks,
  };
}

// ─── List operations (editor) ──────────────────────────────────────────────

export function moveBlock<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length || to < 0 || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Insert at an index (clamped); used by drag-from-library and "+ Add". */
export function insertAt<T>(list: T[], index: number, item: T): T[] {
  const i = Math.max(0, Math.min(list.length, index));
  return [...list.slice(0, i), item, ...list.slice(i)];
}

export function duplicateBlock(block: BuilderBlock): BuilderBlock {
  return { ...structuredClone(block), id: newBlockId() };
}

// ─── Offer facts shown by blocks ───────────────────────────────────────────

export function formatPrice(amount: number | null, currency: BuilderOffer['currency']): string {
  if (amount === null) return '';
  if (currency === 'KHR') return `${Math.round(amount).toLocaleString('en-US')}៛`;
  const whole = Math.round(amount * 100) % 100 === 0;
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** Discount percent when a higher previous price is set, else 0. */
export function discountPercent(offer: Pick<BuilderOffer, 'price' | 'compareAtPrice'>): number {
  const { price, compareAtPrice } = offer;
  if (price === null || compareAtPrice === null || compareAtPrice <= price || compareAtPrice <= 0) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
}

/** Time left until the deadline; null when there is no deadline. */
export function countdown(deadline: string | undefined, nowMs: number): Countdown | null {
  if (!deadline) return null;
  const end = new Date(deadline).getTime();
  if (!Number.isFinite(end)) return null;
  const diff = Math.max(0, end - nowMs);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    ended: diff === 0,
  };
}

/** Share of stock already taken, 0–100, or null when there is no counter. */
export function stockTakenPercent(offer: Pick<BuilderOffer, 'stockTotal' | 'stockLeft'>): number | null {
  const { stockTotal, stockLeft } = offer;
  if (stockTotal === null || stockLeft === null || stockTotal <= 0) return null;
  return Math.round(((stockTotal - stockLeft) / stockTotal) * 100);
}

/** Where the main button goes. Telegram goes through the round-robin router. */
export function offerCtaHref(offer: BuilderOffer, slug: string): string {
  if (offer.cta.action === 'url' && offer.cta.url) return offer.cta.url;
  return `/api/round-robin?page=${encodeURIComponent(slug)}&redirect=true`;
}

// ─── Health hints (editor) ─────────────────────────────────────────────────

export type HintKey = 'missingHeadline' | 'longHeadline' | 'missingKhmer' | 'missingCta' | 'noFeatures' | 'noQuestions' | 'placeholderText';

/** Problems worth fixing before publishing a block; the editor translates the keys. */
export function blockHints(block: BuilderBlock): HintKey[] {
  const hints: HintKey[] = [];
  const texts: Bi[] = [];
  if (block.type === 'hero') {
    if (!block.headline.en.trim()) hints.push('missingHeadline');
    if (block.headline.en.split(/\s+/).filter(Boolean).length > 12) hints.push('longHeadline');
    if (!block.ctaLabel.en.trim()) hints.push('missingCta');
    texts.push(block.headline, block.ctaLabel);
    if (block.sub) texts.push(block.sub);
  } else if (block.type === 'offer') {
    if (!block.features.length) hints.push('noFeatures');
    if (!block.ctaLabel.en.trim()) hints.push('missingCta');
    texts.push(block.title, block.ctaLabel, ...block.features);
  } else {
    if (!block.items.length) hints.push('noQuestions');
    texts.push(block.title, ...block.items.flatMap((i) => [i.q, i.a]));
  }
  if (texts.some((t) => t.en.trim() && !t.kh?.trim())) hints.push('missingKhmer');
  if (texts.some((t) => /write your real answer|say the result your buyer wants|thing included/i.test(t.en))) hints.push('placeholderText');
  return hints;
}
