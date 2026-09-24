import { describe, expect, it } from 'vitest';
import {
  BLOCK_TYPES,
  blockHints,
  countdown,
  ctaOpensTelegram,
  effectiveOffer,
  createBlock,
  defaultBuilderDoc,
  discountPercent,
  duplicateBlock,
  formatPrice,
  insertAt,
  moveBlock,
  normalizeBuilderDoc,
  offerCtaHref,
  pick,
  stockTakenPercent,
} from '../builder';
import type { BenefitsBlock, FormBlock, GalleryBlock, HeroBlock, IncludedBlock, OfferBlock, StepsBlock } from '../builder';

describe('registry and defaults', () => {
  it('every block type creates a valid block that survives normalization', () => {
    for (const type of BLOCK_TYPES) {
      const block = createBlock(type);
      const doc = normalizeBuilderDoc({ blocks: [block] });
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].type).toBe(type);
      expect(doc.blocks[0].id).toBe(block.id);
    }
  });

  it('a new page starts as a complete sales page', () => {
    expect(defaultBuilderDoc().blocks.map((b) => b.type)).toEqual(['hero', 'benefits', 'steps', 'offer', 'faq', 'finalCta']);
  });
});

describe('normalizeBuilderDoc', () => {
  it('drops unknown blocks and fields, clamps values and blocks unsafe URLs', () => {
    const doc = normalizeBuilderDoc({
      brand: { accent: 'red', radius: 'weird' },
      offer: { price: '550', compareAtPrice: -5, currency: 'EUR', stockTotal: 30, stockLeft: 99, deadline: 'nope', cta: { action: 'url', url: 'javascript:alert(1)' } },
      blocks: [
        { type: 'hero', id: 'h 1!', variant: 'weird', headline: 'Hi', image: 'data:image/png;base64,AA', style: { theme: 'neon' }, evil: true },
        { type: 'script', id: 'x' },
        { type: 'offer', features: ['A', '', { en: 'B', kh: 'ខ' }] },
      ],
    });
    expect(doc.brand).toEqual({ accent: '#E5A93C', radius: 'soft' });
    expect(doc.offer.price).toBe(550);
    expect(doc.offer.compareAtPrice).toBe(0);
    expect(doc.offer.currency).toBe('USD');
    expect(doc.offer.stockLeft).toBe(30);
    expect(doc.offer.deadline).toBeUndefined();
    expect(doc.offer.cta).toEqual({ action: 'url', url: undefined });
    expect(doc.blocks.map((b) => b.type)).toEqual(['hero', 'offer']);
    const hero = doc.blocks[0] as HeroBlock;
    expect(hero.id).toBe('h1');
    expect(hero.variant).toBe('split');
    expect(hero.headline).toEqual({ en: 'Hi' });
    expect(hero.image).toBeUndefined();
    expect(hero.style.theme).toBe('dark');
    expect((hero as unknown as Record<string, unknown>).evil).toBeUndefined();
    expect((doc.blocks[1] as OfferBlock).features).toEqual([{ en: 'A' }, { en: 'B', kh: 'ខ' }]);
  });

  it('gives duplicate block ids a new id', () => {
    const hero = createBlock('hero');
    const doc = normalizeBuilderDoc({ blocks: [hero, hero] });
    expect(new Set(doc.blocks.map((b) => b.id)).size).toBe(2);
  });

  it('handles garbage input', () => {
    expect(normalizeBuilderDoc(null).blocks).toEqual([]);
    expect(normalizeBuilderDoc('x').offer.cta.action).toBe('telegram');
  });
});

describe('list operations', () => {
  it('moves, inserts and duplicates', () => {
    expect(moveBlock(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveBlock(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
    expect(insertAt(['a', 'b'], 1, 'x')).toEqual(['a', 'x', 'b']);
    expect(insertAt(['a'], 99, 'x')).toEqual(['a', 'x']);
    const hero = createBlock('hero');
    const copy = duplicateBlock(hero);
    expect(copy.id).not.toBe(hero.id);
    expect({ ...copy, id: '' }).toEqual({ ...hero, id: '' });
  });
});

describe('offer facts', () => {
  it('formats prices and discounts', () => {
    expect(formatPrice(550, 'USD')).toBe('$550');
    expect(formatPrice(19.9, 'USD')).toBe('$19.90');
    expect(formatPrice(40000, 'KHR')).toBe('40,000៛');
    expect(formatPrice(null, 'USD')).toBe('');
    expect(discountPercent({ price: 450, compareAtPrice: 600 })).toBe(25);
    expect(discountPercent({ price: 550, compareAtPrice: 550 })).toBe(0);
    expect(discountPercent({ price: 550, compareAtPrice: null })).toBe(0);
  });

  it('counts down and ends at zero', () => {
    const now = new Date('2026-10-01T00:00:00Z').getTime();
    expect(countdown('2026-10-02T01:02:03Z', now)).toEqual({ days: 1, hours: 1, minutes: 2, seconds: 3, ended: false });
    expect(countdown('2026-09-01T00:00:00Z', now)?.ended).toBe(true);
    expect(countdown(undefined, now)).toBeNull();
  });

  it('computes stock taken and the button destination', () => {
    expect(stockTakenPercent({ stockTotal: 30, stockLeft: 11 })).toBe(63);
    expect(stockTakenPercent({ stockTotal: null, stockLeft: 5 })).toBeNull();
    const offer = defaultBuilderDoc().offer;
    expect(offerCtaHref(offer, 'my page')).toBe('/api/round-robin?page=my%20page&redirect=true');
    expect(offerCtaHref({ ...offer, cta: { action: 'url', url: 'https://khbevents.com/x' } }, 'p')).toBe('https://khbevents.com/x');
  });

  it('picks Khmer with English fallback', () => {
    expect(pick({ en: 'Hi', kh: 'សួស្តី' }, 'kh')).toBe('សួស្តី');
    expect(pick({ en: 'Hi' }, 'kh')).toBe('Hi');
  });
});

describe('blockHints', () => {
  it('flags placeholder text and missing pieces', () => {
    expect(blockHints(createBlock('hero'))).toContain('placeholderText');
    const hero = { ...(createBlock('hero') as HeroBlock), headline: { en: 'one two three four five six seven eight nine ten eleven twelve thirteen' }, ctaLabel: { en: '' } };
    const hints = blockHints(hero);
    expect(hints).toEqual(expect.arrayContaining(['longHeadline', 'missingCta', 'missingKhmer']));
    const faq = normalizeBuilderDoc({ blocks: [{ type: 'faq', title: { en: 'Q', kh: 'ស' }, items: [] }] }).blocks[0];
    expect(blockHints(faq)).toEqual(['noQuestions']);
  });
});

describe('sales page components', () => {
  it('cleans benefits, included, steps, form and closing sections', () => {
    const doc = normalizeBuilderDoc({
      blocks: [
        { type: 'benefits', variant: 'rows', title: { en: 'Why' }, items: [{ icon: 'rocket', title: { en: 'Fast' } }, { icon: 'gift', title: { en: '' } }] },
        { type: 'included', variant: 'split', title: { en: 'All in' }, items: ['One', { en: '' }, { en: 'Two', kh: 'ពីរ' }], image: 'javascript:alert(1)' },
        { type: 'steps', variant: 'bogus', title: { en: 'How' }, items: Array.from({ length: 12 }, (_, i) => ({ title: { en: `S${i}` } })) },
        { type: 'form', title: { en: 'Leave details' }, askEmail: 'yes', askMessage: true },
        { type: 'finalCta', variant: 'split', headline: { en: 'Go' }, ctaLabel: { en: '' } },
      ],
    });
    expect(doc.blocks.map((b) => b.type)).toEqual(['benefits', 'included', 'steps', 'form', 'finalCta']);
    const benefits = doc.blocks[0] as BenefitsBlock;
    expect(benefits.variant).toBe('rows');
    expect(benefits.items).toEqual([{ icon: 'check', title: { en: 'Fast' }, text: undefined }]);
    const included = doc.blocks[1] as IncludedBlock;
    expect(included.items).toEqual([{ en: 'One' }, { en: 'Two', kh: 'ពីរ' }]);
    expect(included.image).toBeUndefined();
    const steps = doc.blocks[2] as StepsBlock;
    expect(steps.variant).toBe('numbered');
    expect(steps.items).toHaveLength(8);
    const form = doc.blocks[3] as FormBlock;
    expect(form.askEmail).toBe(false);
    expect(form.askMessage).toBe(true);
    expect(form.submitLabel.en).not.toBe('');
    expect(blockHints(doc.blocks[4])).toContain('missingCta');
  });

  it('flags empty lists and the example text of new components', () => {
    for (const type of ['benefits', 'included', 'steps', 'finalCta'] as const) {
      expect(blockHints(createBlock(type))).toContain('placeholderText');
    }
    expect(blockHints(createBlock('form'))).toEqual([]);
    const empty = normalizeBuilderDoc({ blocks: [{ type: 'included', title: { en: 'X', kh: 'ក' }, items: [] }] }).blocks[0];
    expect(blockHints(empty)).toEqual(['noItems']);
  });
});

describe('early-bird pricing, language and links', () => {
  const offer = normalizeBuilderDoc({
    offer: { price: 799, earlyPrice: 750, earlyUntil: '2026-09-30T16:59:59Z', deadline: '2026-10-15T16:59:59Z', cta: { action: 'url', url: 'https://t.me/VuthaTim' } },
  }).offer;

  it('charges the early-bird price until its date, then the regular price by itself', () => {
    const before = effectiveOffer(offer, Date.parse('2026-09-24T00:00:00Z'));
    expect(before).toMatchObject({ price: 750, compareAtPrice: 799, countdownKind: 'early', countdownTo: '2026-09-30T16:59:59.000Z' });
    expect(discountPercent(before)).toBe(6);
    const after = effectiveOffer(offer, Date.parse('2026-10-01T00:00:00Z'));
    expect(after).toMatchObject({ price: 799, compareAtPrice: null, countdownKind: 'offer', countdownTo: '2026-10-15T16:59:59.000Z' });
    expect(effectiveOffer(offer, null).price).toBe(750);
  });

  it('ignores an early-bird price that is not lower than the price', () => {
    const odd = { ...offer, earlyPrice: 900 };
    expect(effectiveOffer(odd, Date.parse('2026-09-24T00:00:00Z')).price).toBe(799);
  });

  it('treats a t.me link as Telegram', () => {
    expect(ctaOpensTelegram(offer)).toBe(true);
    expect(ctaOpensTelegram({ ...offer, cta: { action: 'url', url: 'https://example.com' } })).toBe(false);
    expect(ctaOpensTelegram({ ...offer, cta: { action: 'telegram' } })).toBe(true);
  });

  it('keeps the default language, safe links and form choices', () => {
    const doc = normalizeBuilderDoc({
      defaultLang: 'kh',
      blocks: [
        { type: 'benefits', title: { en: 'Fairs' }, items: [{ icon: 'glasses', title: { en: 'Optic fair' }, link: 'https://kopticsfair.com/en/' }, { icon: 'tent', title: { en: 'X' }, link: 'javascript:alert(1)' }] },
        { type: 'form', title: { en: 'Join' }, interestLabel: { en: 'Sector?' }, interestOptions: [{ en: 'Camping' }, { en: '' }, 'Eyewear'] },
      ],
    });
    expect(doc.defaultLang).toBe('kh');
    expect(normalizeBuilderDoc({}).defaultLang).toBe('en');
    const benefits = doc.blocks[0] as BenefitsBlock;
    expect(benefits.items[0]).toMatchObject({ icon: 'glasses', link: 'https://kopticsfair.com/en/' });
    expect(benefits.items[1].link).toBeUndefined();
    expect((doc.blocks[1] as FormBlock).interestOptions).toEqual([{ en: 'Camping' }, { en: 'Eyewear' }]);
  });
});

describe('background video', () => {
  it('keeps supported videos in their canonical form and drops the rest', () => {
    const doc = normalizeBuilderDoc({
      blocks: [
        { type: 'hero', headline: { en: 'A' }, style: { theme: 'dark', bgVideo: '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>' } },
        { type: 'hero', headline: { en: 'B' }, style: { theme: 'dark', bgVideo: 'https://evil.example.com/embed' } },
        { type: 'hero', headline: { en: 'C' }, style: { theme: 'dark', bgVideo: '/api/uploads/video/abc-12345678-clip.webm' } },
      ],
    });
    expect(doc.blocks.map((b) => b.style.bgVideo)).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ', undefined, '/api/uploads/video/abc-12345678-clip.webm']);
  });
});

describe('photos, gallery and animation', () => {
  it('defaults every section to the rise animation and keeps a chosen one', () => {
    const doc = normalizeBuilderDoc({ blocks: [{ type: 'faq', title: { en: 'Q' } }, { type: 'faq', title: { en: 'Q' }, style: { animation: 'zoom' } }, { type: 'faq', title: { en: 'Q' }, style: { animation: 'spin' } }] });
    expect(doc.blocks.map((b) => b.style.animation)).toEqual(['rise', 'zoom', 'rise']);
  });

  it('keeps safe photos on components and gallery items with captions', () => {
    const doc = normalizeBuilderDoc({
      blocks: [
        { type: 'gallery', variant: 'carousel', title: { en: 'Photos' }, items: [{ image: '/api/uploads/a-1.jpg', caption: { en: 'Booth' } }, { image: 'javascript:alert(1)' }, { caption: { en: 'no image' } }] },
        { type: 'offer', title: { en: 'O' }, image: 'https://cdn.example.com/p.jpg', features: [{ en: 'x' }] },
        { type: 'steps', title: { en: 'S' }, items: [{ title: { en: 'One' }, image: '/api/uploads/b-2.jpg' }] },
        { type: 'benefits', title: { en: 'B' }, items: [{ icon: 'star', title: { en: 'One' }, image: '/api/uploads/c-3.jpg' }] },
      ],
    });
    const gallery = doc.blocks[0] as GalleryBlock;
    expect(gallery.variant).toBe('carousel');
    expect(gallery.items).toEqual([{ image: '/api/uploads/a-1.jpg', caption: { en: 'Booth' } }]);
    expect((doc.blocks[1] as OfferBlock).image).toBe('https://cdn.example.com/p.jpg');
    expect((doc.blocks[2] as StepsBlock).items[0].image).toBe('/api/uploads/b-2.jpg');
    expect((doc.blocks[3] as BenefitsBlock).items[0].image).toBe('/api/uploads/c-3.jpg');
    expect(blockHints(createBlock('gallery'))).toEqual(['noItems']);
  });
});
