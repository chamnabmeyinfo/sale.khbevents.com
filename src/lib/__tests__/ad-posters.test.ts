import { describe, expect, it } from 'vitest';
import { POSTER_FORMATS, allInOnePrompt, goalBlocked, imagePrompt, posterCopy, posterFacts, posterWarnings } from '../ad-posters';
import { defaultBuilderDoc } from '../builder';
import type { LandingPage } from '../types';

const NOW = Date.parse('2026-09-28T03:00:00Z');

function tripPage(offer: Record<string, unknown>): Pick<LandingPage, 'slug' | 'title' | 'description' | 'builder' | 'template'> {
  const doc = defaultBuilderDoc();
  const hero = doc.blocks.find((b) => b.type === 'hero');
  if (hero && hero.type === 'hero') {
    hero.headline = { en: 'Find Korean suppliers in one trip', kh: 'ស្វែងរកអ្នកផ្គត់ផ្គង់កូរ៉េ ក្នុងដំណើរតែមួយ' };
    hero.sub = { en: 'A 4-day business trip to Seoul. Visit three trade fairs.', kh: 'ដំណើរ ៤ ថ្ងៃទៅសេអ៊ូល។ ទស្សនាពិព័រណ៍ ៣។' };
    hero.ctaLabel = { en: 'Reserve my seat', kh: 'កក់កៅអី' };
    hero.riskNote = { en: 'No payment today', kh: 'មិនបង់ប្រាក់ថ្ងៃនេះ' };
  }
  doc.offer = { ...doc.offer, name: { en: 'Korea business trip', kh: 'ដំណើរកូរ៉េ' }, currency: 'USD', priceNote: { en: 'per person', kh: 'ក្នុងម្នាក់' }, ...offer } as typeof doc.offer;
  return { slug: 'korea', title: 'Korea', description: 'Korea trip.', template: 'builder', builder: doc } as never;
}

describe('posterFacts', () => {
  it('reads the live price, the open early-bird date, seats and deadline', () => {
    const f = posterFacts(tripPage({ price: 799, earlyPrice: 750, earlyUntil: '2026-09-30T16:59:59.000Z', deadline: '2026-10-15T16:59:59.000Z', stockTotal: 30, stockLeft: 11 }), NOW);
    expect(f).toMatchObject({ price: 750, regularPrice: 799, earlyUntil: '2026-09-30T16:59:59.000Z', deadline: '2026-10-15T16:59:59.000Z', seatsLeft: 11, seatsTotal: 30, deadlinePassed: false, builder: true });
    expect(f.theme).toBe('A 4-day business trip to Seoul.');
  });

  it('drops an ended early-bird price and a passed deadline', () => {
    const f = posterFacts(tripPage({ price: 799, earlyPrice: 750, earlyUntil: '2026-09-01T00:00:00.000Z', deadline: '2026-09-20T00:00:00.000Z', stockTotal: null, stockLeft: null }), NOW);
    expect(f).toMatchObject({ price: 799, regularPrice: null, earlyUntil: undefined, deadline: undefined, deadlinePassed: true, seatsLeft: null });
    expect(goalBlocked('early', f)).toBe('noEarly');
    expect(goalBlocked('deadline', f)).toBe('noDeadline');
    expect(goalBlocked('lastSeats', f)).toBe('noSeats');
    expect(goalBlocked('launch', f)).toBeNull();
    expect(posterWarnings(f)).toEqual(['deadlinePassed']);
  });

  it('uses only the title and description of a page not made with the builder', () => {
    const f = posterFacts({ slug: 'old', title: 'Old page', description: 'An older page. More text.', template: 'smart-city' } as never, NOW);
    expect(f).toMatchObject({ builder: false, price: null, theme: 'An older page.' });
    expect(posterWarnings(f)).toEqual(['notBuilder']);
  });
});

describe('posterCopy', () => {
  const f = posterFacts(tripPage({ price: 799, earlyPrice: 750, earlyUntil: '2026-09-30T16:59:59.000Z', deadline: '2026-10-15T16:59:59.000Z', stockTotal: 30, stockLeft: 11 }), NOW);
  it('writes the goal fact line from the CMS numbers, in both languages (Phnom Penh dates)', () => {
    expect(posterCopy(f, 'early', 'en').offer).toBe('Early-bird $750 per person until 30 September 2026 (then $799)');
    expect(posterCopy(f, 'early', 'kh').offer).toBe('តម្លៃពិសេស $750 ក្នុងម្នាក់ ដល់ថ្ងៃ 30 កញ្ញា 2026 (បន្ទាប់មក $799)');
    expect(posterCopy(f, 'lastSeats', 'en').offer).toBe('11 seats left · $750 per person');
    expect(posterCopy(f, 'deadline', 'en').offer).toBe('Registration closes 15 October 2026 · $750 per person');
    expect(posterCopy(f, 'launch', 'en')).toMatchObject({ headline: 'Find Korean suppliers in one trip', support: 'A 4-day business trip to Seoul.', offer: '$750 per person', cta: 'Reserve my seat', trust: 'No payment today' });
    expect(posterCopy(f, 'launch', 'kh').support).toBe('ដំណើរ ៤ ថ្ងៃទៅសេអ៊ូល។');
  });

  it('asks the image tool for no text, in the right size, and the all-in-one prompt forbids invented facts', () => {
    const vertical = POSTER_FORMATS.find((x) => x.id === 'vertical')!;
    const p = imagePrompt(f, 'launch', vertical, 'business owners at a trade fair in Seoul');
    expect(p).toContain('9:16 (1080×1920 px)');
    expect(p).toContain('Scene: business owners at a trade fair in Seoul');
    expect(p).toMatch(/Do not include any text/);
    const all = allInOnePrompt(f, 'early', '', 'https://sale.khbevents.com/korea?utm_source=facebook');
    for (const r of ['4:5', '1:1', '9:16', '1.91:1']) expect(all).toContain(r);
    expect(all).toContain('Early-bird $750 per person until 30 September 2026');
    expect(all).toContain('utm_source=facebook');
    expect(all).toMatch(/Do not add prices, dates, seat numbers, testimonials/);
  });
});
