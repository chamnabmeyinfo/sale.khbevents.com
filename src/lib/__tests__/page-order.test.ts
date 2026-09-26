import { describe, expect, it } from 'vitest';
import { createBlock, type BlockType, type BuilderBlock } from '../builder';
import { blockLabel, orderIssues, sameOrder, suggestedOrder } from '../page-order';

const page = (...types: BlockType[]): BuilderBlock[] => types.map((type, i) => ({ ...createBlock(type), id: `${type}-${i}` }));
const keys = (blocks: BuilderBlock[]) => orderIssues(blocks).map((i) => i.key);

describe('page map advice', () => {
  it('a page in the recommended order has no warnings and no change to suggest', () => {
    const blocks = page('hero', 'benefits', 'included', 'offer', 'form', 'faq', 'terms', 'finalCta');
    expect(orderIssues(blocks).filter((i) => i.severity !== 'tip')).toEqual([]);
    expect(sameOrder(blocks, suggestedOrder(blocks))).toBe(true);
  });

  it('flags a hero that is not first, a final call to action that is not last, and a form before the price', () => {
    const blocks = page('benefits', 'hero', 'finalCta', 'form', 'offer', 'faq');
    expect(keys(blocks)).toEqual(expect.arrayContaining(['heroFirst', 'finalLast', 'formBeforeOffer']));
    expect(suggestedOrder(blocks).map((b) => b.type)).toEqual(['hero', 'benefits', 'offer', 'form', 'faq', 'finalCta']);
  });

  it('keeps the owner order inside one step (benefits and details share a step)', () => {
    const blocks = page('hero', 'gallery', 'steps', 'benefits', 'offer');
    expect(sameOrder(blocks, suggestedOrder(blocks))).toBe(true);
  });

  it('gives tips for content after the price and a missing form or hero', () => {
    const blocks = page('offer', 'steps', 'faq');
    const k = keys(blocks);
    expect(k).toContain('detailsAfterOffer');
    expect(k).toContain('noHero');
    expect(k).toContain('noForm');
    expect(keys([])).toEqual([]);
  });

  it('flags terms placed before the offer or the form', () => {
    expect(keys(page('hero', 'terms', 'offer', 'form'))).toContain('termsEarly');
    expect(keys(page('hero', 'terms', 'form'))).toContain('termsEarly');
    expect(keys(page('hero', 'form', 'terms'))).not.toContain('termsEarly');
  });

  it('labels a section with its headline or title', () => {
    const [hero, faq] = page('hero', 'faq');
    expect(blockLabel(hero, 'en')).toBe(hero.type === 'hero' ? hero.headline.en : '');
    expect(blockLabel(faq, 'en')).toBe('Questions buyers ask');
  });
});
