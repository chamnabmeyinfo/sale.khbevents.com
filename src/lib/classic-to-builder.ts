/**
 * Turns a page made with the old fixed layouts (template 'b2b-delegation' and
 * friends) into a drag-and-drop builder page, so every page is edited in one
 * place: Admin → Landing Pages CMS → Edit (the builder).
 *
 * It only moves what the page already says. Text comes from the page record and
 * its Khmer translation; section headings come from the copy the old layout
 * showed. Price, deadlines and seats are the ones the owner set in the admin
 * (urgency settings), never new values. Nothing is invented.
 *
 * Used by the content pack sync (a pack with "convertToBuilder": true), by
 * Admin → Import JSON, and by the "Move to drag-and-drop" button in the old editor.
 */
import type { CoreValueItem, LandingPage, LandingPageTranslation } from './types';
import { BENEFIT_ICONS, normalizeBuilderDoc, type BenefitIcon, type BuilderDoc } from './builder';
import { CONTENT, GENERAL, type PageFacts } from '../components/landing/smart-city-content';

type Pair = { en: string; kh?: string };

/** Section headings and extra copy the old layout showed around the page data. */
export interface ClassicHeadings {
  coreValues: { title: Pair; sub?: Pair };
  problems: { title: Pair; sub?: Pair };
  audiences: { title: Pair; sub?: Pair };
  valueStack: { title: Pair; sub?: Pair };
  itinerary: { title: Pair };
  gallery: { title: Pair };
  guarantee: { title: Pair };
  faq: { title: Pair };
  offer: { title: Pair; features: Pair[]; note?: Pair };
  steps?: { title: Pair; items: Array<{ title: Pair; text: Pair }> };
  form: { title: Pair; sub?: Pair; submit: Pair; successTitle: Pair; successText?: Pair; interestLabel?: Pair; interestOptions: Pair[] };
  finalCta: { headline: Pair; sub?: Pair };
  ctaLabel: Pair;
}

const GENERIC: ClassicHeadings = {
  coreValues: { title: { en: 'What you take home', kh: 'អ្វីដែលលោកអ្នកទទួលបាន' } },
  problems: { title: { en: 'The problems this solves', kh: 'បញ្ហាដែលកម្មវិធីនេះដោះស្រាយ' } },
  audiences: { title: { en: 'Who this is for', kh: 'កម្មវិធីនេះសម្រាប់នរណា' } },
  valueStack: { title: { en: 'What is included', kh: 'អ្វីដែលរួមបញ្ចូល' } },
  itinerary: { title: { en: 'Day by day', kh: 'កម្មវិធីប្រចាំថ្ងៃ' } },
  gallery: { title: { en: 'Photos', kh: 'រូបភាព' } },
  guarantee: { title: { en: 'Our promise', kh: 'ការសន្យារបស់យើង' } },
  faq: { title: { en: 'Questions', kh: 'សំណួរញឹកញាប់' } },
  offer: { title: { en: 'Price', kh: 'តម្លៃ' }, features: [] },
  form: {
    title: { en: 'Register your interest', kh: 'ចុះឈ្មោះចូលរួម' },
    submit: { en: 'Send my details', kh: 'ផ្ញើព័ត៌មានរបស់ខ្ញុំ' },
    successTitle: { en: 'Thank you! We received your details.', kh: 'អរគុណ! យើងបានទទួលព័ត៌មានរបស់លោកអ្នកហើយ។' },
    interestOptions: [],
  },
  finalCta: { headline: { en: 'Questions? Ask us today', kh: 'មានសំណួរ? សួរយើងថ្ងៃនេះ' } },
  ctaLabel: { en: 'Chat with us on Telegram', kh: 'ជជែកជាមួយយើងតាម Telegram' },
};

const both = (en: string, kh?: string): Pair => (kh && kh !== en ? { en, kh } : { en });

/** Headings of the Smart City layout, read from its own copy file in both languages. */
function smartCityHeadings(page: LandingPage): ClassicHeadings {
  const en = CONTENT.en;
  const kh = CONTENT.kh;
  const coordinator = page.isolatedSettings?.coordinatorName?.trim() || GENERAL.coordinatorName;
  const facts = (lang: 'en' | 'kh') => ({ coordinatorName: coordinator, departureDate: formatDay(page.eventDate || GENERAL.departureDate, lang) }) as PageFacts;
  const stepsEn = en.steps(facts('en'));
  const stepsKh = kh.steps(facts('kh'));
  return {
    coreValues: { title: both(en.coreValueTitle, kh.coreValueTitle), sub: both(en.coreValueSubtitle, kh.coreValueSubtitle) },
    problems: { title: both(en.problemTitle, kh.problemTitle), sub: both(en.solutionBridge, kh.solutionBridge) },
    audiences: { title: both(en.audienceSecTitle, kh.audienceSecTitle), sub: both(en.audienceSecSub, kh.audienceSecSub) },
    valueStack: { title: both(en.valueStackTitle, kh.valueStackTitle), sub: both(en.valueStackSubtitle, kh.valueStackSubtitle) },
    itinerary: { title: both(en.itineraryTitle, kh.itineraryTitle) },
    gallery: { title: GENERIC.gallery.title },
    guarantee: { title: both(en.guaranteeTitle, kh.guaranteeTitle) },
    faq: { title: both(en.faqTitle, kh.faqTitle) },
    offer: {
      title: both(en.pricingTitle, kh.pricingTitle),
      features: en.pricingFeatures.map((f, i) => both(f, kh.pricingFeatures[i])),
      note: both(en.pricingSecureNote, kh.pricingSecureNote),
    },
    steps: {
      title: both(en.stepsTitle, kh.stepsTitle),
      items: stepsEn.map((s, i) => ({ title: both(s.title, stepsKh[i]?.title), text: both(s.desc, stepsKh[i]?.desc) })),
    },
    form: {
      title: both(en.registrationSectionTitle, kh.registrationSectionTitle),
      submit: both(en.formSubmitBtn, kh.formSubmitBtn),
      successTitle: both(en.formSuccessTitle, kh.formSuccessTitle),
      successText: both(en.formSuccessDesc(facts('en')), kh.formSuccessDesc(facts('kh'))),
      interestLabel: both(en.businessFocusLabel, kh.businessFocusLabel),
      interestOptions: en.profileOptions.map((o, i) => both(o.label, kh.profileOptions[i]?.label)),
    },
    finalCta: { headline: both(en.orChat, kh.orChat), sub: both(en.coordinatorNote, kh.coordinatorNote) },
    // The button goes to the next salesperson (Round Robin), so it names no one.
    ctaLabel: GENERIC.ctaLabel,
  };
}

export function headingsFor(page: LandingPage): ClassicHeadings {
  return page.slug === 'smart-city-tea-cafe' ? smartCityHeadings(page) : GENERIC;
}

/** "Oct 8, 2026" / "8 តុលា 2026" from a YYYY-MM-DD day. */
function formatDay(day: string, lang: 'en' | 'kh'): string {
  const d = new Date(`${day.slice(0, 10)}T12:00:00Z`);
  if (!Number.isFinite(d.getTime())) return day;
  return d.toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** Admin dates without a time zone are Cambodia time (UTC+7). */
export function cambodiaIso(value: string | undefined): string | undefined {
  const v = (value || '').trim();
  if (!v) return undefined;
  const withTime = /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59` : v;
  const zoned = /(Z|[+-]\d{2}:?\d{2})$/i.test(withTime) ? withTime : `${withTime}+07:00`;
  const ms = new Date(zoned).getTime();
  return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
}

const ICONS: Record<string, BenefitIcon> = {
  chart: 'chart', shield: 'shield', trophy: 'award', zap: 'zap', cpu: 'cpu', coffee: 'coffee', truck: 'truck',
  users: 'users', 'trend-down': 'trend-down', chat: 'chat', search: 'search', star: 'star', gift: 'gift', clock: 'clock',
};
const icon = (name?: string): BenefitIcon => {
  const n = (name || '').trim();
  if (ICONS[n]) return ICONS[n];
  return (BENEFIT_ICONS as readonly string[]).includes(n) ? (n as BenefitIcon) : 'check';
};

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** The Khmer twin of a list item: same id when there is one, else the same position. */
function twin<T extends { id?: string }>(list: T[] | undefined, item: { id?: string }, index: number): T | undefined {
  if (!list?.length) return undefined;
  return (item.id && list.find((x) => x.id === item.id)) || list[index];
}

const cards = (items: CoreValueItem[], kh: CoreValueItem[] | undefined) =>
  items.map((it, i) => {
    const k = twin(kh, it, i);
    return { icon: icon(it.icon), title: both(it.title, k?.title), text: both(it.desc, k?.desc) };
  });

/** Which old section keys become which builder blocks, in the page's own order. */
const SECTION_KEYS = ['hero', 'coreValues', 'problems', 'audiences', 'valueStack', 'itinerary', 'gallery', 'packages', 'guarantee', 'form', 'faqs'] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

export function classicToBuilder(page: LandingPage, headings: ClassicHeadings = headingsFor(page)): BuilderDoc {
  const kh: LandingPageTranslation = page.translations?.kh || {};
  const h = headings;
  const u = page.urgency || {};
  const visible = (key: string) => page.sectionVisibility?.[key as keyof typeof page.sectionVisibility] !== false;
  const blocks: Record<string, unknown>[] = [];
  const style = (theme: 'dark' | 'light' | 'brand', align: 'left' | 'center' = 'left') => ({ theme, align, spacing: 'normal' });
  const ctaLabel = h.ctaLabel;

  const regular = num(u.regularPrice);
  const early = num(u.earlyBirdPrice);
  const total = typeof u.totalSeats === 'number' && u.totalSeats > 0 ? u.totalSeats : null;
  const claimed = typeof u.claimedSeats === 'number' && u.claimedSeats >= 0 ? u.claimedSeats : null;
  const offer = {
    name: both(page.title, kh.title),
    price: regular ?? early,
    compareAtPrice: null,
    currency: 'USD',
    priceNote: { en: 'per person', kh: 'ក្នុងម្នាក់' },
    earlyPrice: early !== null && regular !== null && early < regular ? early : null,
    earlyUntil: early !== null && regular !== null && early < regular ? cambodiaIso(u.earlyBirdDeadline) : undefined,
    deadline: cambodiaIso(u.registrationDeadline),
    deadlineLabel: { en: 'Registration closes in', kh: 'បិទការចុះឈ្មោះក្នុងរយៈពេល' },
    stockTotal: total,
    stockLeft: total !== null && claimed !== null ? Math.max(0, total - claimed) : null,
    stockLabel: { en: 'seats left', kh: 'កៅអីនៅសល់' },
    // Same as the old page: the Telegram button goes to the next salesperson (Round Robin).
    cta: { action: 'telegram' },
  };

  const add: Record<SectionKey, () => void> = {
    hero: () => {
      blocks.push({
        id: 'cv-hero', type: 'hero', variant: 'fullbleed', style: style('dark'),
        badge: page.badge ? both(page.badge, kh.badge) : undefined,
        headline: both(page.heroHeadline || page.title, kh.heroHeadline || kh.title),
        sub: page.heroSubheadline || page.description ? both(page.heroSubheadline || page.description, kh.heroSubheadline || kh.description) : undefined,
        image: page.heroImage || page.gallery?.[0] || undefined,
        ctaLabel,
        riskNote: u.riskNote ? both(u.riskNote, kh.urgencyRiskNote) : undefined,
      });
    },
    coreValues: () => {
      if (!page.coreValues?.length) return;
      blocks.push({ id: 'cv-values', type: 'benefits', variant: 'cards', style: style('light', 'center'), title: h.coreValues.title, sub: h.coreValues.sub, items: cards(page.coreValues, kh.coreValues) });
    },
    problems: () => {
      if (!page.problems?.length) return;
      blocks.push({ id: 'cv-problems', type: 'benefits', variant: 'rows', style: style('dark'), title: h.problems.title, sub: h.problems.sub, items: cards(page.problems, kh.problems) });
    },
    audiences: () => {
      if (!page.audiences?.length) return;
      blocks.push({ id: 'cv-audiences', type: 'benefits', variant: 'cards', style: style('light', 'center'), title: h.audiences.title, sub: h.audiences.sub, items: cards(page.audiences, kh.audiences) });
    },
    valueStack: () => {
      const vs = page.valueStack;
      if (!vs?.inclusions?.length) return;
      const kvs = kh.valueStack;
      const note = vs.totalValue && vs.totalLabel ? both(`${vs.totalLabel}: ${vs.totalValue}`, kvs?.totalLabel ? `${kvs.totalLabel}: ${kvs.totalValue || vs.totalValue}` : undefined) : undefined;
      blocks.push({
        id: 'cv-included', type: 'included', variant: 'checklist', style: style('light'),
        title: vs.title ? both(vs.title, kvs?.title) : h.valueStack.title,
        sub: vs.subtitle ? both(vs.subtitle, kvs?.subtitle) : h.valueStack.sub,
        items: vs.inclusions.map((it, i) => {
          const k = twin(kvs?.inclusions, it, i);
          return both(it.desc ? `${it.title}: ${it.desc}` : it.title, k ? (k.desc ? `${k.title}: ${k.desc}` : k.title) : undefined);
        }),
        note,
      });
    },
    itinerary: () => {
      const days = page.itinerary?.length ? page.itinerary : kh.itinerary;
      if (!days?.length) return;
      const text = (d: typeof days[number]) => (d.events || []).map((e) => (e.time ? `${e.time}  ${e.activity}` : e.activity)).join('\n');
      const title = (d: typeof days[number], lang: 'en' | 'kh') => [lang === 'kh' ? `ថ្ងៃទី ${d.day}` : `Day ${d.day}`, d.date, d.title].filter(Boolean).join(' · ');
      blocks.push({
        id: 'cv-itinerary', type: 'steps', variant: 'timeline', style: style('light'),
        title: h.itinerary.title,
        items: days.slice(0, 8).map((d, i) => {
          const k = page.itinerary?.length ? twin(kh.itinerary, d, i) : d;
          const enDay = page.itinerary?.length ? d : undefined;
          return {
            title: both(enDay ? title(enDay, 'en') : title(d, 'kh'), k ? title(k, 'kh') : undefined),
            text: both(enDay ? text(enDay) : text(d), k ? text(k) : undefined),
          };
        }),
      });
    },
    gallery: () => {
      const photos = (page.gallery || []).filter(Boolean);
      if (!photos.length) return;
      blocks.push({ id: 'cv-gallery', type: 'gallery', variant: 'carousel', style: style('dark', 'center'), title: h.gallery.title, items: photos.map((image) => ({ image })) });
    },
    packages: () => {
      if (offer.price === null) return;
      blocks.push({ id: 'cv-offer', type: 'offer', variant: 'card', style: style('light', 'center'), title: h.offer.title, features: h.offer.features, ctaLabel, note: h.offer.note });
    },
    guarantee: () => {
      const g = page.guarantee;
      if (!g?.points?.length) return;
      const kg = kh.guarantee;
      blocks.push({
        id: 'cv-guarantee', type: 'included', variant: 'checklist', style: style('brand'),
        title: g.title ? both(g.title, kg?.title) : h.guarantee.title,
        sub: g.subtitle ? both(g.subtitle, kg?.subtitle) : undefined,
        items: g.points.map((p, i) => both(p, kg?.points?.[i])),
      });
    },
    form: () => {
      if (h.steps) blocks.push({ id: 'cv-steps', type: 'steps', variant: 'numbered', style: style('light', 'center'), title: h.steps.title, items: h.steps.items });
      const fc = page.formConfig;
      const askEmail = (fc?.fields || []).some((f) => f.id === 'email' || f.type === 'email');
      blocks.push({
        id: 'cv-form', type: 'form', variant: 'split', style: style('dark'),
        title: fc?.headline ? both(fc.headline, h.form.title.kh) : h.form.title,
        sub: fc?.subheadline ? { en: fc.subheadline } : h.form.sub,
        askEmail,
        askMessage: false,
        interestLabel: h.form.interestLabel,
        interestOptions: h.form.interestOptions,
        submitLabel: fc?.submitButtonText ? both(fc.submitButtonText, h.form.submit.kh) : h.form.submit,
        successTitle: h.form.successTitle,
        successText: fc?.successMessage ? both(fc.successMessage, h.form.successText?.kh) : h.form.successText,
      });
    },
    faqs: () => {
      if (!page.faqs?.length) return;
      blocks.push({
        id: 'cv-faq', type: 'faq', variant: 'accordion', style: style('light'), title: h.faq.title,
        items: page.faqs.map((f, i) => {
          const k = twin(kh.faqs, f, i);
          return { q: both(f.question, k?.question), a: both(f.answer, k?.answer) };
        }),
      });
    },
  };

  const order = [...(page.sectionOrder || []), ...SECTION_KEYS].filter((k, i, all): k is SectionKey => (SECTION_KEYS as readonly string[]).includes(k) && all.indexOf(k) === i);
  for (const key of order) {
    if (key !== 'hero' && key !== 'form' && !visible(key)) continue;
    add[key]();
  }
  blocks.push({ id: 'cv-final', type: 'finalCta', variant: 'split', style: style('brand'), headline: h.finalCta.headline, sub: h.finalCta.sub, ctaLabel, riskNote: u.riskNote ? both(u.riskNote, kh.urgencyRiskNote) : undefined });

  return normalizeBuilderDoc({
    version: 1,
    defaultLang: 'en',
    brand: { accent: '#E5A93C', radius: 'soft' },
    offer,
    blocks: blocks.map((b) => Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined))),
  });
}

/** The page as a builder page. Pages that already are builder pages come back unchanged. */
export function convertPageToBuilder(page: LandingPage): LandingPage {
  if (page.template === 'builder' && page.builder) return page;
  return { ...page, template: 'builder', builder: classicToBuilder(page) };
}

