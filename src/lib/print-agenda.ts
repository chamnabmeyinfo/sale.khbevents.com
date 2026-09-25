/**
 * A printable agenda of a landing page: the same facts as the live page, laid out
 * for paper (A4) or "Save as PDF". Staff print it for meetings and visitors print
 * it to keep. Built from the builder document on every request, so a print always
 * shows the latest update. Pure: no browser or storage access.
 *
 * Left out on paper: the lead form, buttons, photos galleries and countdowns
 * (a countdown means nothing on paper; the deadline date is printed instead).
 */
import { effectiveOffer, formatPrice, pick, type BuilderDoc, type Lang } from './builder';

export interface AgendaSection {
  id: string;
  title: string;
  sub?: string;
  kind: 'list' | 'steps' | 'cards' | 'faq';
  items: Array<{ title: string; text?: string; link?: string }>;
  note?: string;
}

export interface Agenda {
  lang: Lang;
  title: string;
  badge?: string;
  intro?: string;
  /** Price, deadline and seats as printable lines. */
  facts: Array<{ label: string; value: string }>;
  sections: AgendaSection[];
}

const L = {
  en: {
    price: 'Price', was: 'regular price', early: 'Early-bird price until', deadline: 'Registration closes', seats: 'Seats', left: '{n} of {t} left',
    closed: 'Closed on',
  },
  kh: {
    price: 'តម្លៃ', was: 'តម្លៃធម្មតា', early: 'តម្លៃពិសេសរហូតដល់', deadline: 'ផុតកំណត់ចុះឈ្មោះ', seats: 'កៅអី', left: 'នៅសល់ {n} ក្នុងចំណោម {t}',
    closed: 'បានបិទនៅ',
  },
} as const;

/** "8 Oct 2026" in Cambodia time. */
export function printDate(iso: string | undefined, lang: Lang): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Phnom_Penh' });
}

/** "25 Sept 2026, 14:05" in Cambodia time, for "Last updated". */
export function printDateTime(iso: string | undefined, lang: Lang): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleString(lang === 'kh' ? 'km-KH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Phnom_Penh' });
}

export function buildAgenda(doc: BuilderDoc, lang: Lang, nowMs: number, pageTitle = ''): Agenda {
  const t = L[lang];
  const offer = doc.offer;
  const now = effectiveOffer(offer, nowMs);
  const facts: Agenda['facts'] = [];

  if (now.price !== null) {
    const note = offer.priceNote ? ` ${pick(offer.priceNote, lang)}` : '';
    const was = now.compareAtPrice !== null && now.compareAtPrice > now.price ? ` (${t.was} ${formatPrice(now.compareAtPrice, offer.currency)})` : '';
    facts.push({ label: t.price, value: `${formatPrice(now.price, offer.currency)}${note}${was}` });
  }
  if (now.countdownKind === 'early' && offer.earlyUntil) facts.push({ label: t.early, value: printDate(offer.earlyUntil, lang) });
  if (offer.deadline) {
    const passed = new Date(offer.deadline).getTime() <= nowMs;
    facts.push({ label: passed ? t.closed : t.deadline, value: printDate(offer.deadline, lang) });
  }
  if (offer.stockTotal !== null && offer.stockLeft !== null) {
    facts.push({ label: t.seats, value: t.left.replace('{n}', String(offer.stockLeft)).replace('{t}', String(offer.stockTotal)) });
  }

  let title = pageTitle;
  let badge: string | undefined;
  let intro: string | undefined;
  const sections: AgendaSection[] = [];
  const txt = (b: Parameters<typeof pick>[0] | undefined) => (b ? pick(b, lang).trim() : '');

  for (const block of doc.blocks) {
    if (block.type === 'hero') {
      if (!intro) {
        title = txt(block.headline) || title;
        badge = txt(block.badge) || undefined;
        intro = txt(block.sub) || undefined;
      }
    } else if (block.type === 'benefits') {
      sections.push({
        id: block.id, kind: 'cards', title: txt(block.title), sub: txt(block.sub) || undefined,
        items: block.items.map((it) => ({ title: txt(it.title), text: txt(it.text) || undefined, link: it.link })),
      });
    } else if (block.type === 'included') {
      sections.push({ id: block.id, kind: 'list', title: txt(block.title), sub: txt(block.sub) || undefined, items: block.items.map((it) => ({ title: txt(it) })), note: txt(block.note) || undefined });
    } else if (block.type === 'offer') {
      sections.push({ id: block.id, kind: 'list', title: txt(block.title), items: block.features.map((f) => ({ title: txt(f) })), note: txt(block.note) || undefined });
    } else if (block.type === 'steps') {
      sections.push({ id: block.id, kind: 'steps', title: txt(block.title), items: block.items.map((it) => ({ title: txt(it.title), text: txt(it.text) || undefined })) });
    } else if (block.type === 'faq') {
      sections.push({ id: block.id, kind: 'faq', title: txt(block.title), items: block.items.map((it) => ({ title: txt(it.q), text: txt(it.a) || undefined })) });
    }
    // form, gallery and finalCta have nothing to read on paper.
  }

  return {
    lang,
    title: title || pageTitle,
    badge,
    intro,
    facts,
    sections: sections
      .map((s) => ({ ...s, items: s.items.filter((it) => it.title) }))
      .filter((s) => s.items.length > 0),
  };
}
