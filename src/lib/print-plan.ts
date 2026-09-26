/**
 * What to print for a landing page (/<slug>/print), in two modes:
 *
 * - "agenda": straight to the point for a visitor to review. The planner reads the
 *   page to learn what it sells and keeps only the practical parts:
 *     trip    (a day-by-day programme with times) → schedule, places to visit,
 *             what's included, how to join, who it's for;
 *     event   (a deadline or seats, no programme) → key benefits, what's included,
 *             how to join, a few questions;
 *     product (anything else) → benefits, what's included, how to buy, a few questions.
 *   Persuasion sections (problems, long "why" lists, the full FAQ) are left out.
 * - "full": the entire page, every section in the page's order, with photos.
 *
 * Built from the saved builder document on every request, so a print always shows
 * the latest update. Pure: no browser or storage access.
 */
import { effectiveOffer, formatPrice, pick, type BenefitIcon, type BuilderBlock, type BuilderDoc, type Lang } from './builder';

export type PrintMode = 'agenda' | 'full';
export type PageNature = 'trip' | 'event' | 'product';

export interface ScheduleDay {
  label: string;
  date?: string;
  title?: string;
  rows: Array<{ time?: string; text: string }>;
}

export type PrintSection =
  | { kind: 'schedule'; id: string; title: string; days: ScheduleDay[] }
  | { kind: 'cards'; id: string; title: string; sub?: string; items: Array<{ icon: BenefitIcon; title: string; text?: string; link?: string; image?: string }>; compact?: boolean }
  | { kind: 'places'; id: string; title: string; sub?: string; items: Array<{ icon: BenefitIcon; title: string; text?: string; link?: string }> }
  | { kind: 'chips'; id: string; title: string; items: string[] }
  | { kind: 'checklist'; id: string; title: string; sub?: string; items: string[]; note?: string; tone?: 'accent' | 'plain' }
  | { kind: 'inclusions'; id: string; title: string; sub?: string; included: { title: string; items: string[] }; excluded: { title: string; items: string[] }; note?: string }
  | { kind: 'steps'; id: string; title: string; items: Array<{ title: string; text?: string }> }
  | { kind: 'faq'; id: string; title: string; items: Array<{ q: string; a: string }>; more?: number }
  | { kind: 'terms'; id: string; title: string; sub?: string; updated?: string; items: Array<{ title: string; text: string }>; note?: string }
  | { kind: 'gallery'; id: string; title: string; images: string[] }
  | { kind: 'offer'; id: string; title: string; features: string[]; note?: string }
  | { kind: 'callout'; id: string; title: string; text?: string };

export interface PrintFact {
  icon: 'price' | 'calendar' | 'deadline' | 'seats';
  label: string;
  value: string;
  sub?: string;
}

export interface PrintPlan {
  mode: PrintMode;
  nature: PageNature;
  lang: Lang;
  title: string;
  badge?: string;
  intro?: string;
  heroImage?: string;
  facts: PrintFact[];
  sections: PrintSection[];
  /** Section titles the agenda left out (shown on screen, not printed). */
  omitted: string[];
}

const L = {
  en: {
    price: 'Price', was: 'regular {p}', early: 'Early-bird price until', deadline: 'Registration closes', closed: 'Registration closed',
    seats: 'Seats', left: '{n} of {t} left', dates: 'Dates', schedule: 'Programme', joinTitle: 'How to join', whoFor: 'Who it is for',
    questions: 'Good to know', register: 'Register or ask a question', registerText: 'Scan the QR code, or contact us with the details below.',
  },
  kh: {
    price: 'តម្លៃ', was: 'តម្លៃធម្មតា {p}', early: 'តម្លៃពិសេសរហូតដល់', deadline: 'ផុតកំណត់ចុះឈ្មោះ', closed: 'បានបិទការចុះឈ្មោះ',
    seats: 'កៅអី', left: 'នៅសល់ {n} ក្នុងចំណោម {t}', dates: 'កាលបរិច្ឆេទ', schedule: 'កម្មវិធី', joinTitle: 'របៀបចូលរួម', whoFor: 'សម្រាប់អ្នកណា',
    questions: 'គួរដឹង', register: 'ចុះឈ្មោះ ឬសួរសំណួរ', registerText: 'ស្កេន QR ឬទាក់ទងយើងតាមព័ត៌មានខាងក្រោម។',
  },
} as const;

/** "8 October 2026" in Cambodia time. */
export function printDate(iso: string | undefined, lang: Lang): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Phnom_Penh' });
}

/** "25 Sept 2026, 14:05" in Cambodia time. */
export function printDateTime(iso: string | undefined, lang: Lang): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleString(lang === 'kh' ? 'km-KH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Phnom_Penh' });
}

const TIME = /^(\d{1,2}[:.]\d{2}(?:\s*[-–]\s*\d{1,2}[:.]\d{2})?)\s+(.+)$/;
const DAY_TITLE = /^(day|ថ្ងៃទី?)\s*[\d០-៩]+/i;

/** A "steps" block is a schedule when most of its items are days or hold timed lines. */
export function isSchedule(block: BuilderBlock): boolean {
  if (block.type !== 'steps' || block.items.length === 0) return false;
  const timed = block.items.filter((it) => DAY_TITLE.test(it.title.en.trim()) || (it.text?.en || '').split('\n').some((l) => TIME.test(l.trim())));
  return timed.length >= Math.ceil(block.items.length / 2);
}

/** "Day 1 · Oct 8, 2026 · Phnom Penh to Hanoi" and "17:45 - 21:35  Flight …" lines → a day of a programme. */
export function parseDay(title: string, text: string | undefined): ScheduleDay {
  const parts = title.split(/\s+·\s+/).map((s) => s.trim()).filter(Boolean);
  const day: ScheduleDay = parts.length >= 3
    ? { label: parts[0], date: parts[1], title: parts.slice(2).join(' · '), rows: [] }
    : parts.length === 2 && DAY_TITLE.test(parts[0])
      ? { label: parts[0], title: parts[1], rows: [] }
      : { label: title.trim(), rows: [] };
  for (const raw of (text || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(TIME);
    day.rows.push(m ? { time: m[1].replace(/\s*[-–]\s*/, '–'), text: m[2].trim() } : { text: line });
  }
  return day;
}

/** Titles such as "Who this trip is for", "Who should come", "Is this for you?". */
const WHO = /^\s*(who\b|for whom\b|is (this|it) for\b)|\b(is|are) (this|it) for (you|me)\b|^\s*(អ្នកណា|នរណា)|សម្រាប់អ្នកណា|សម្រាប់នរណា/i;

export function classifyNature(doc: BuilderDoc): PageNature {
  if (doc.blocks.some(isSchedule)) return 'trip';
  if (doc.offer.deadline || (doc.offer.stockTotal !== null && /seat|កៅអី|កន្លែង/i.test(`${doc.offer.stockLabel.en} ${doc.offer.stockLabel.kh || ''}`))) return 'event';
  return 'product';
}

export function buildPrintPlan(doc: BuilderDoc, opts: { lang: Lang; mode: PrintMode; nowMs: number; pageTitle?: string; closing?: { title?: string; text?: string } }): PrintPlan {
  const { lang, mode, nowMs } = opts;
  const t = L[lang];
  const txt = (b: Parameters<typeof pick>[0] | undefined) => (b ? pick(b, lang).trim() : '');
  const nature = classifyNature(doc);
  const offer = doc.offer;
  const now = effectiveOffer(offer, nowMs);

  // ── Key facts
  const facts: PrintFact[] = [];
  if (now.price !== null) {
    const was = now.compareAtPrice !== null && now.compareAtPrice > now.price ? t.was.replace('{p}', formatPrice(now.compareAtPrice, offer.currency)) : undefined;
    facts.push({ icon: 'price', label: t.price, value: formatPrice(now.price, offer.currency), sub: [offer.priceNote ? pick(offer.priceNote, lang) : '', was].filter(Boolean).join(' · ') || undefined });
  }
  const schedule = doc.blocks.find(isSchedule);
  if (schedule && schedule.type === 'steps') {
    const days = schedule.items.map((it) => parseDay(txt(it.title), txt(it.text)));
    const dated = days.filter((d) => d.date);
    if (dated.length) facts.push({ icon: 'calendar', label: t.dates, value: dated.length > 1 ? `${dated[0].date} – ${dated[dated.length - 1].date}` : dated[0].date!, sub: `${days.length} ${lang === 'kh' ? 'ថ្ងៃ' : days.length === 1 ? 'day' : 'days'}` });
  }
  if (now.countdownKind === 'early' && offer.earlyUntil) facts.push({ icon: 'deadline', label: t.early, value: printDate(offer.earlyUntil, lang) });
  if (offer.deadline) {
    const passed = new Date(offer.deadline).getTime() <= nowMs;
    facts.push({ icon: 'deadline', label: passed ? t.closed : t.deadline, value: printDate(offer.deadline, lang) });
  }
  if (offer.stockTotal !== null && offer.stockLeft !== null) {
    facts.push({ icon: 'seats', label: t.seats, value: t.left.replace('{n}', String(offer.stockLeft)).replace('{t}', String(offer.stockTotal)) });
  }

  // ── Every section, in page order
  let title = opts.pageTitle || '';
  let badge: string | undefined;
  let intro: string | undefined;
  let heroImage: string | undefined;
  let heroSeen = false;
  type Tagged = { section: PrintSection; role: 'schedule' | 'places' | 'who' | 'why' | 'included' | 'offer' | 'howto' | 'faq' | 'gallery' | 'final' | 'terms' };
  const all: Tagged[] = [];
  const hasIncluded = doc.blocks.some((b) => (b.type === 'included' && b.items.length) || (b.type === 'inclusions' && b.included.length));

  for (const block of doc.blocks) {
    if (block.type === 'hero') {
      if (heroSeen) continue;
      heroSeen = true;
      title = txt(block.headline) || title;
      badge = txt(block.badge) || undefined;
      intro = txt(block.sub) || undefined;
      heroImage = block.image || block.style.bgImage || undefined;
    } else if (block.type === 'steps') {
      if (isSchedule(block)) {
        all.push({ role: 'schedule', section: { kind: 'schedule', id: block.id, title: txt(block.title) || t.schedule, days: block.items.map((it) => parseDay(txt(it.title), txt(it.text))) } });
      } else {
        all.push({ role: 'howto', section: { kind: 'steps', id: block.id, title: txt(block.title) || t.joinTitle, items: block.items.map((it) => ({ title: txt(it.title), text: txt(it.text) || undefined })) } });
      }
    } else if (block.type === 'benefits') {
      const items = block.items.map((it) => ({ icon: it.icon, title: txt(it.title), text: txt(it.text) || undefined, link: it.link, image: it.image }));
      const withLinks = block.items.filter((it) => it.link).length;
      if (withLinks && withLinks >= block.items.length / 2) {
        all.push({ role: 'places', section: { kind: 'places', id: block.id, title: txt(block.title), sub: txt(block.sub) || undefined, items } });
      } else if (WHO.test(`${block.title.en} ${block.title.kh || ''}`)) {
        all.push({ role: 'who', section: { kind: 'cards', id: block.id, title: txt(block.title) || t.whoFor, sub: txt(block.sub) || undefined, items } });
      } else {
        all.push({ role: 'why', section: { kind: 'cards', id: block.id, title: txt(block.title), sub: txt(block.sub) || undefined, items } });
      }
    } else if (block.type === 'included') {
      all.push({ role: 'included', section: { kind: 'checklist', id: block.id, title: txt(block.title), sub: txt(block.sub) || undefined, items: block.items.map((i) => txt(i)), note: txt(block.note) || undefined, tone: block.style.theme === 'brand' ? 'accent' : 'plain' } });
    } else if (block.type === 'inclusions') {
      all.push({ role: 'included', section: { kind: 'inclusions', id: block.id, title: txt(block.title), sub: txt(block.sub) || undefined, included: { title: txt(block.includedTitle), items: block.included.map((i) => txt(i)) }, excluded: { title: txt(block.excludedTitle), items: block.excluded.map((i) => txt(i)) }, note: txt(block.note) || undefined } });
    } else if (block.type === 'offer') {
      all.push({ role: 'offer', section: { kind: 'offer', id: block.id, title: txt(block.title), features: block.features.map((f) => txt(f)), note: txt(block.note) || undefined } });
    } else if (block.type === 'terms') {
      all.push({ role: 'terms', section: { kind: 'terms', id: block.id, title: txt(block.title), sub: txt(block.sub) || undefined, updated: block.updated ? printDate(`${block.updated}T12:00:00Z`, lang) : undefined, items: block.items.map((it) => ({ title: txt(it.title), text: txt(it.text) })).filter((x) => x.title), note: txt(block.note) || undefined } });
    } else if (block.type === 'faq') {
      all.push({ role: 'faq', section: { kind: 'faq', id: block.id, title: txt(block.title), items: block.items.map((it) => ({ q: txt(it.q), a: txt(it.a) })).filter((x) => x.q && x.a) } });
    } else if (block.type === 'gallery') {
      all.push({ role: 'gallery', section: { kind: 'gallery', id: block.id, title: txt(block.title), images: block.items.map((i) => i.image) } });
    } else if (block.type === 'finalCta') {
      all.push({ role: 'final', section: { kind: 'callout', id: block.id, title: txt(block.headline), text: txt(block.sub) || undefined } });
    }
    // The lead form is replaced on paper by the QR code and contacts.
  }

  const clean = (s: PrintSection): PrintSection | null => {
    switch (s.kind) {
      case 'schedule': return s.days.length ? s : null;
      case 'cards': case 'places': { const items = s.items.filter((i) => i.title); return items.length ? { ...s, items } as PrintSection : null; }
      case 'checklist': { const items = s.items.filter(Boolean); return items.length ? { ...s, items } : null; }
      case 'inclusions': {
        const included = { ...s.included, items: s.included.items.filter(Boolean) };
        const excluded = { ...s.excluded, items: s.excluded.items.filter(Boolean) };
        return included.items.length || excluded.items.length ? { ...s, included, excluded } : null;
      }
      case 'steps': { const items = s.items.filter((i) => i.title); return items.length ? { ...s, items } : null; }
      case 'faq': return s.items.length ? s : null;
      case 'terms': return s.items.length ? s : null;
      case 'gallery': return s.images.length ? s : null;
      case 'offer': { const features = s.features.filter(Boolean); return features.length ? { ...s, features } : null; }
      case 'chips': return s.items.length ? s : null;
      case 'callout': return s.title ? s : null;
    }
  };

  let sections: PrintSection[];
  const omitted: string[] = [];

  if (mode === 'full') {
    sections = all.map((x) => x.section);
  } else {
    // Agenda: practical parts only, ordered for a reader who wants the facts.
    const pickRoles: Record<PageNature, Tagged['role'][]> = {
      trip: ['schedule', 'places', 'included', 'howto', 'who'],
      event: ['why', 'places', 'included', 'howto', 'who', 'faq'],
      product: ['why', 'included', 'offer', 'howto', 'faq'],
    };
    const order = pickRoles[nature];
    const chosen: PrintSection[] = [];
    let whyUsed = false;
    for (const role of order) {
      for (const x of all.filter((a) => a.role === role)) {
        let s = x.section;
        if (role === 'offer' && hasIncluded) continue;
        if (role === 'why') {
          if (whyUsed) continue; // only the first, main benefits list
          whyUsed = true;
          if (s.kind === 'cards') s = { ...s, compact: true, items: s.items.slice(0, 6) };
        }
        if (role === 'who' && s.kind === 'cards') s = { kind: 'chips', id: s.id, title: s.title || t.whoFor, items: s.items.map((i) => i.title) };
        if (role === 'faq' && s.kind === 'faq') s = { ...s, title: t.questions, items: s.items.slice(0, 4), more: Math.max(0, s.items.length - 4) };
        chosen.push(s);
      }
    }
    sections = chosen;
    for (const x of all) {
      if (x.role === 'final') continue;
      if (!chosen.some((s) => s.id === x.section.id) && x.section.title) omitted.push(x.section.title);
    }
  }

  sections = sections.map(clean).filter((s): s is PrintSection => s !== null);
  // Paper has no form: close with how to register (QR code and contacts sit beside it).
  if (!sections.some((s) => s.kind === 'callout')) sections.push({ kind: 'callout', id: 'print-register', title: opts.closing?.title || t.register, text: opts.closing?.text || t.registerText });

  return { mode, nature, lang, title: title || opts.pageTitle || '', badge, intro, heroImage, facts, sections, omitted };
}
