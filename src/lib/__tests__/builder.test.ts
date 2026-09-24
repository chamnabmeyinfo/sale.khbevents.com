import { describe, expect, it } from 'vitest';
import {
  BLOCK_TYPES,
  blockHints,
  countdown,
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
import type { HeroBlock, OfferBlock } from '../builder';

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

  it('a new page starts with hero, offer and FAQ', () => {
    expect(defaultBuilderDoc().blocks.map((b) => b.type)).toEqual(['hero', 'offer', 'faq']);
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
