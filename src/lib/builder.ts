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

/** Icons a benefit can show; drawn by the renderer. */
export const BENEFIT_ICONS = ['sparkles', 'check', 'star', 'shield', 'clock', 'gift', 'heart', 'truck', 'chat', 'users', 'leaf', 'award'] as const;
export type BenefitIcon = (typeof BENEFIT_ICONS)[number];

export interface BenefitItem {
  icon: BenefitIcon;
  title: Bi;
  text?: Bi;
}

export interface BenefitsBlock extends BlockBase {
  type: 'benefits';
  variant: 'cards' | 'rows';
  title: Bi;
  sub?: Bi;
  items: BenefitItem[];
}

export interface IncludedBlock extends BlockBase {
  type: 'included';
  variant: 'checklist' | 'split';
  title: Bi;
  sub?: Bi;
  items: Bi[];
  /** Photo beside the list in the split design. */
  image?: string;
  note?: Bi;
}

export interface StepItem {
  title: Bi;
  text?: Bi;
}

export interface StepsBlock extends BlockBase {
  type: 'steps';
  variant: 'numbered' | 'timeline';
  title: Bi;
  items: StepItem[];
  /** Optional button under the steps. */
  ctaLabel?: Bi;
}

export interface FormBlock extends BlockBase {
  type: 'form';
  variant: 'card' | 'split';
  title: Bi;
  sub?: Bi;
  /** Name and phone are always asked; these add optional fields. */
  askEmail: boolean;
  askMessage: boolean;
  submitLabel: Bi;
  successTitle: Bi;
  successText?: Bi;
  privacyNote?: Bi;
}

export interface FinalCtaBlock extends BlockBase {
  type: 'finalCta';
  variant: 'centered' | 'split';
  headline: Bi;
  sub?: Bi;
  ctaLabel: Bi;
  riskNote?: Bi;
}

export type BuilderBlock = HeroBlock | OfferBlock | FaqBlock | BenefitsBlock | IncludedBlock | StepsBlock | FormBlock | FinalCtaBlock;
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

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});
const hasText = (b: Bi): boolean => Boolean(b.en.trim() || b.kh?.trim());

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
  benefits: {
    type: 'benefits',
    name: { en: 'Benefits', kh: 'អត្ថប្រយោជន៍' },
    coreValue: { en: 'Answer "why should I care?" with the results the buyer gets.', kh: 'ឆ្លើយសំណួរ "ហេតុអ្វីខ្ញុំគួរចាប់អារម្មណ៍?" ដោយលទ្ធផលដែលអ្នកទិញទទួលបាន។' },
    variants: [
      { id: 'cards', name: { en: 'Icon cards', kh: 'កាតរូបតំណាង' }, detail: { en: 'A grid of cards, one benefit each.', kh: 'កាតជាក្រឡា មួយកាតមួយអត្ថប្រយោជន៍។' } },
      { id: 'rows', name: { en: 'Icon list', kh: 'បញ្ជីរូបតំណាង' }, detail: { en: 'A calm list with an icon beside each benefit.', kh: 'បញ្ជីស្អាត មានរូបតំណាងក្បែរអត្ថប្រយោជន៍នីមួយៗ។' } },
    ],
    create: () => ({
      id: newBlockId(),
      type: 'benefits',
      variant: 'cards',
      style: baseStyle('light', 'center'),
      title: { en: 'Why people choose this', kh: 'ហេតុអ្វីមនុស្សជ្រើសរើសមួយនេះ' },
      items: [
        { icon: 'sparkles', title: { en: 'First benefit', kh: 'អត្ថប្រយោជន៍ទីមួយ' }, text: { en: 'Replace this with the result the buyer gets.', kh: 'ជំនួសអត្ថបទនេះដោយលទ្ធផលដែលអ្នកទិញទទួលបាន។' } },
        { icon: 'shield', title: { en: 'Second benefit', kh: 'អត្ថប្រយោជន៍ទីពីរ' }, text: { en: 'Replace this with the result the buyer gets.', kh: 'ជំនួសអត្ថបទនេះដោយលទ្ធផលដែលអ្នកទិញទទួលបាន។' } },
        { icon: 'clock', title: { en: 'Third benefit', kh: 'អត្ថប្រយោជន៍ទីបី' }, text: { en: 'Replace this with the result the buyer gets.', kh: 'ជំនួសអត្ថបទនេះដោយលទ្ធផលដែលអ្នកទិញទទួលបាន។' } },
      ],
    }),
  },
  included: {
    type: 'included',
    name: { en: "What's included", kh: 'អ្វីដែលរួមបញ្ចូល' },
    coreValue: { en: 'List exactly what the buyer gets, so there are no surprises.', kh: 'រាយឱ្យច្បាស់នូវអ្វីដែលអ្នកទិញទទួលបាន ដើម្បីកុំឱ្យមានការភ្ញាក់ផ្អើល។' },
    variants: [
      { id: 'checklist', name: { en: 'Checklist', kh: 'បញ្ជីធីក' }, detail: { en: 'A card with a two-column checklist.', kh: 'កាតមានបញ្ជីធីកពីរជួរ។' } },
      { id: 'split', name: { en: 'Photo and list', kh: 'រូបភាព និងបញ្ជី' }, detail: { en: 'A photo of the product beside the list.', kh: 'រូបភាពផលិតផលនៅក្បែរបញ្ជី។' } },
    ],
    create: () => ({
      id: newBlockId(),
      type: 'included',
      variant: 'checklist',
      style: baseStyle('light', 'left'),
      title: { en: 'Everything included', kh: 'អ្វីៗទាំងអស់ដែលរួមបញ្ចូល' },
      items: [
        { en: 'Replace this with the first item', kh: 'ជំនួសដោយធាតុទីមួយ' },
        { en: 'Replace this with the second item', kh: 'ជំនួសដោយធាតុទីពីរ' },
        { en: 'Replace this with the third item', kh: 'ជំនួសដោយធាតុទីបី' },
        { en: 'Replace this with the fourth item', kh: 'ជំនួសដោយធាតុទីបួន' },
      ],
    }),
  },
  steps: {
    type: 'steps',
    name: { en: 'How it works', kh: 'របៀបដំណើរការ' },
    coreValue: { en: 'Show that buying is easy: a few clear steps from "message us" to "you have it".', kh: 'បង្ហាញថាការទិញងាយស្រួល៖ ជំហានច្បាស់ៗពី "ផ្ញើសារមកយើង" ដល់ "អ្នកទទួលបាន"។' },
    variants: [
      { id: 'numbered', name: { en: 'Numbered cards', kh: 'កាតមានលេខ' }, detail: { en: 'Steps side by side on a computer, stacked on a phone.', kh: 'ជំហានតម្រៀបគ្នានៅលើកុំព្យូទ័រ និងពីលើចុះក្រោមនៅលើទូរស័ព្ទ។' } },
      { id: 'timeline', name: { en: 'Timeline', kh: 'ខ្សែពេលវេលា' }, detail: { en: 'A vertical line that joins the steps.', kh: 'ខ្សែបញ្ឈរភ្ជាប់ជំហាននីមួយៗ។' } },
    ],
    create: () => ({
      id: newBlockId(),
      type: 'steps',
      variant: 'numbered',
      style: baseStyle('light', 'center'),
      title: { en: 'How it works', kh: 'របៀបដំណើរការ' },
      items: [
        { title: { en: 'Message us', kh: 'ផ្ញើសារមកយើង' }, text: { en: 'Tap the button and ask your questions on Telegram.', kh: 'ចុចប៊ូតុង ហើយសួរសំណួររបស់អ្នកតាម Telegram។' } },
        { title: { en: 'Confirm your order', kh: 'បញ្ជាក់ការកម្មង់' }, text: { en: 'We confirm the details and the price with you.', kh: 'យើងបញ្ជាក់ព័ត៌មានលម្អិត និងតម្លៃជាមួយអ្នក។' } },
        { title: { en: 'Receive it', kh: 'ទទួលបាន' }, text: { en: 'Replace this with how and when the buyer receives it.', kh: 'ជំនួសអត្ថបទនេះដោយរបៀប និងពេលដែលអ្នកទិញទទួលបាន។' } },
      ],
    }),
  },
  form: {
    type: 'form',
    name: { en: 'Lead form', kh: 'ទម្រង់ចុះឈ្មោះ' },
    coreValue: { en: 'Catch buyers who will not chat first. Every form goes to Leads and to the next salesperson.', kh: 'ទទួលអ្នកទិញដែលមិនចង់ជជែកមុន។ ទម្រង់នីមួយៗចូលទៅ Leads និងអ្នកលក់បន្ទាប់។' },
    variants: [
      { id: 'card', name: { en: 'Form card', kh: 'កាតទម្រង់' }, detail: { en: 'A focused card in the middle of the page.', kh: 'កាតផ្តោតនៅកណ្តាលទំព័រ។' } },
      { id: 'split', name: { en: 'Offer and form', kh: 'ការផ្តល់ជូន និងទម្រង់' }, detail: { en: 'Price and countdown on one side, the form on the other.', kh: 'តម្លៃ និងពេលរាប់ថយក្រោយម្ខាង ទម្រង់ម្ខាង។' } },
    ],
    create: () => ({
      id: newBlockId(),
      type: 'form',
      variant: 'card',
      style: baseStyle('dark', 'center'),
      title: { en: 'Leave your details', kh: 'ទុកព័ត៌មានរបស់អ្នក' },
      sub: { en: 'We will contact you on Telegram or by phone.', kh: 'យើងនឹងទាក់ទងអ្នកតាម Telegram ឬទូរស័ព្ទ។' },
      askEmail: false,
      askMessage: true,
      submitLabel: { en: 'Send my details', kh: 'ផ្ញើព័ត៌មានរបស់ខ្ញុំ' },
      successTitle: { en: 'Thank you! We received your details.', kh: 'អរគុណ! យើងបានទទួលព័ត៌មានរបស់អ្នកហើយ។' },
      successText: { en: 'A member of our team will contact you soon.', kh: 'សមាជិកក្រុមរបស់យើងនឹងទាក់ទងអ្នកឆាប់ៗនេះ។' },
      privacyNote: { en: 'We only use your details to reply to you.', kh: 'យើងប្រើព័ត៌មានរបស់អ្នកសម្រាប់តែឆ្លើយតបអ្នកប៉ុណ្ណោះ។' },
    }),
  },
  finalCta: {
    type: 'finalCta',
    name: { en: 'Final call to action', kh: 'ការអំពាវនាវចុងក្រោយ' },
    coreValue: { en: 'Close the page: repeat the offer, the deadline and the button for people who read to the end.', kh: 'បិទទំព័រ៖ រំលឹកការផ្តល់ជូន ថ្ងៃផុតកំណត់ និងប៊ូតុង សម្រាប់អ្នកដែលអានដល់ចប់។' },
    variants: [
      { id: 'centered', name: { en: 'Centered', kh: 'នៅកណ្តាល' }, detail: { en: 'Headline, countdown and button in the middle.', kh: 'ចំណងជើង ពេលរាប់ថយក្រោយ និងប៊ូតុងនៅកណ្តាល។' } },
      { id: 'split', name: { en: 'Split box', kh: 'ប្រអប់ពីរផ្នែក' }, detail: { en: 'Words on one side, price and button in a box on the other.', kh: 'ពាក្យម្ខាង តម្លៃ និងប៊ូតុងក្នុងប្រអប់ម្ខាង។' } },
    ],
    create: () => ({
      id: newBlockId(),
      type: 'finalCta',
      variant: 'centered',
      style: baseStyle('brand', 'center'),
      headline: { en: 'Ready to get yours?', kh: 'ត្រៀមខ្លួនទទួលយកហើយឬនៅ?' },
      sub: { en: 'Replace this with one line that reminds them what they get.', kh: 'ជំនួសអត្ថបទនេះដោយប្រយោគមួយដែលរំលឹកពីអ្វីដែលពួកគេទទួលបាន។' },
      ctaLabel: { en: 'Chat with us on Telegram', kh: 'ជជែកតាម Telegram' },
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

/** A new page starts as a complete sales page: promise, why, how, price, doubts, close. */
export function defaultBuilderDoc(): BuilderDoc {
  return {
    version: 1,
    offer: defaultOffer(),
    brand: { accent: DEFAULT_ACCENT, radius: 'soft' },
    blocks: [createBlock('hero'), createBlock('benefits'), createBlock('steps'), createBlock('offer'), createBlock('faq'), createBlock('finalCta')],
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
  if (type === 'faq') {
    const b = blank as FaqBlock;
    const items = Array.isArray(o.items)
      ? o.items.slice(0, 20).map((it) => {
          const r = obj(it);
          return { q: bi(r.q, 200), a: bi(r.a, 1200) };
        }).filter((it) => hasText(it.q))
      : [];
    return {
      id, style, type,
      variant: oneOf(o.variant, ['accordion', 'columns'] as const, b.variant),
      title: bi(o.title, 120, { en: '' }),
      items,
    };
  }
  if (type === 'benefits') {
    const b = blank as BenefitsBlock;
    const items = Array.isArray(o.items)
      ? o.items.slice(0, 12).map((it) => {
          const r = obj(it);
          return { icon: oneOf(r.icon, BENEFIT_ICONS, 'check'), title: bi(r.title, 120), text: optBi(r.text, 400) };
        }).filter((it) => hasText(it.title))
      : [];
    return {
      id, style, type,
      variant: oneOf(o.variant, ['cards', 'rows'] as const, b.variant),
      title: bi(o.title, 120, { en: '' }),
      sub: optBi(o.sub, 300),
      items,
    };
  }
  if (type === 'included') {
    const b = blank as IncludedBlock;
    return {
      id, style, type,
      variant: oneOf(o.variant, ['checklist', 'split'] as const, b.variant),
      title: bi(o.title, 120, { en: '' }),
      sub: optBi(o.sub, 300),
      items: Array.isArray(o.items) ? o.items.slice(0, 30).map((f) => bi(f, 200)).filter(hasText) : [],
      image: url(o.image),
      note: optBi(o.note, 200),
    };
  }
  if (type === 'steps') {
    const b = blank as StepsBlock;
    const items = Array.isArray(o.items)
      ? o.items.slice(0, 8).map((it) => {
          const r = obj(it);
          return { title: bi(r.title, 120), text: optBi(r.text, 400) };
        }).filter((it) => hasText(it.title))
      : [];
    return {
      id, style, type,
      variant: oneOf(o.variant, ['numbered', 'timeline'] as const, b.variant),
      title: bi(o.title, 120, { en: '' }),
      items,
      ctaLabel: optBi(o.ctaLabel, 60),
    };
  }
  if (type === 'form') {
    const b = blank as FormBlock;
    return {
      id, style, type,
      variant: oneOf(o.variant, ['card', 'split'] as const, b.variant),
      title: bi(o.title, 120, { en: '' }),
      sub: optBi(o.sub, 300),
      askEmail: o.askEmail === true,
      askMessage: o.askMessage === true,
      submitLabel: bi(o.submitLabel, 60, b.submitLabel),
      successTitle: bi(o.successTitle, 120, b.successTitle),
      successText: optBi(o.successText, 300),
      privacyNote: optBi(o.privacyNote, 200),
    };
  }
  const b = blank as FinalCtaBlock;
  return {
    id, style, type: 'finalCta',
    variant: oneOf(o.variant, ['centered', 'split'] as const, b.variant),
    headline: bi(o.headline, 160, { en: '' }),
    sub: optBi(o.sub, 400),
    ctaLabel: bi(o.ctaLabel, 60, b.ctaLabel),
    riskNote: optBi(o.riskNote, 120),
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

export type HintKey = 'missingHeadline' | 'longHeadline' | 'missingKhmer' | 'missingCta' | 'noFeatures' | 'noQuestions' | 'noItems' | 'placeholderText';

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
  } else if (block.type === 'faq') {
    if (!block.items.length) hints.push('noQuestions');
    texts.push(block.title, ...block.items.flatMap((i) => [i.q, i.a]));
  } else if (block.type === 'benefits') {
    if (!block.items.length) hints.push('noItems');
    texts.push(block.title, ...block.items.flatMap((i) => (i.text ? [i.title, i.text] : [i.title])));
  } else if (block.type === 'included') {
    if (!block.items.length) hints.push('noItems');
    texts.push(block.title, ...block.items);
  } else if (block.type === 'steps') {
    if (!block.items.length) hints.push('noItems');
    texts.push(block.title, ...block.items.flatMap((i) => (i.text ? [i.title, i.text] : [i.title])));
  } else if (block.type === 'form') {
    texts.push(block.title, block.submitLabel, block.successTitle);
  } else {
    if (!block.headline.en.trim()) hints.push('missingHeadline');
    if (!block.ctaLabel.en.trim()) hints.push('missingCta');
    texts.push(block.headline, block.ctaLabel);
    if (block.sub) texts.push(block.sub);
  }
  if (texts.some((t) => t.en.trim() && !t.kh?.trim())) hints.push('missingKhmer');
  if (texts.some((t) => /write your real answer|say the result your buyer wants|thing included|^replace this|(first|second|third) benefit/i.test(t.en))) hints.push('placeholderText');
  return hints;
}
