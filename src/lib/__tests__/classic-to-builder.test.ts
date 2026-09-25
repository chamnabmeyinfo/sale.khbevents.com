import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cambodiaIso, classicToBuilder, convertPageToBuilder } from '../classic-to-builder';
import { mergeContentPack } from '../content-pack';
import type { LandingPage } from '../types';

// The Vietnam page as it was on the old fixed layout (the seed keeps those fields).
const seed = JSON.parse(readFileSync(join(process.cwd(), 'data/db.json'), 'utf8')).pages
  .find((p: LandingPage) => p.slug === 'smart-city-tea-cafe') as LandingPage;
const classic = (o: Partial<LandingPage> = {}): LandingPage => ({ ...structuredClone(seed), template: 'b2b-delegation', builder: undefined, ...o });

describe('classic page to builder', () => {
  it('keeps the price, deadline and seats the owner set', () => {
    const doc = classicToBuilder(classic());
    expect(doc.offer.price).toBe(550);
    // Early bird equals the regular price, so there is no early-bird offer.
    expect(doc.offer.earlyPrice).toBeNull();
    expect(doc.offer.deadline).toBe('2026-09-20T16:59:59.000Z');
    expect(doc.offer.stockTotal).toBe(30);
    expect(doc.offer.stockLeft).toBe(11);
    expect(doc.offer.cta.action).toBe('telegram');
  });

  it('uses a cheaper early-bird price with its own deadline', () => {
    const page = classic({ urgency: { ...seed.urgency, earlyBirdPrice: 500, regularPrice: 550, earlyBirdDeadline: '2026-10-01' } });
    const doc = classicToBuilder(page);
    expect(doc.offer.earlyPrice).toBe(500);
    expect(doc.offer.earlyUntil).toBe('2026-10-01T16:59:59.000Z');
  });

  it('moves every section, in both languages, in the page order', () => {
    const doc = classicToBuilder(classic());
    expect(doc.blocks.map((b) => b.id)).toEqual([
      'cv-hero', 'cv-values', 'cv-problems', 'cv-audiences', 'cv-included', 'cv-itinerary', 'cv-gallery',
      'cv-offer', 'cv-guarantee', 'cv-steps', 'cv-form', 'cv-faq', 'cv-final',
    ]);
    const hero = doc.blocks[0];
    expect(hero.type === 'hero' && hero.headline.en).toBe(seed.heroHeadline);
    expect(hero.type === 'hero' && hero.headline.kh).toBe(seed.translations?.kh?.heroHeadline);
    const faq = doc.blocks.find((b) => b.type === 'faq');
    expect(faq?.type === 'faq' && faq.items.length).toBe(seed.faqs.length);
    const days = doc.blocks.find((b) => b.id === 'cv-itinerary');
    expect(days?.type === 'steps' && days.items[0].text?.en).toContain('17:45 - 21:35');
  });

  it('skips sections the owner hid', () => {
    const doc = classicToBuilder(classic({ sectionVisibility: { ...seed.sectionVisibility, problems: false, faqs: false } }));
    expect(doc.blocks.some((b) => b.id === 'cv-problems' || b.id === 'cv-faq')).toBe(false);
  });

  it('leaves builder pages alone', () => {
    const page = convertPageToBuilder(classic());
    expect(page.template).toBe('builder');
    expect(convertPageToBuilder(page)).toBe(page);
  });

  it('a pack with convertToBuilder converts the live page, with the live values', () => {
    const live = classic({ urgency: { ...seed.urgency, registrationDeadline: '2026-10-05T12:00:00' } });
    const merged = mergeContentPack(live, { slug: live.slug, convertToBuilder: true });
    expect(merged.template).toBe('builder');
    expect(merged.builder?.offer.deadline).toBe('2026-10-05T05:00:00.000Z');
    expect('convertToBuilder' in merged).toBe(false);
  });

  it('reads admin dates as Cambodia time', () => {
    expect(cambodiaIso('2026-09-20T23:59:59')).toBe('2026-09-20T16:59:59.000Z');
    expect(cambodiaIso('2026-09-20T23:59:59Z')).toBe('2026-09-20T23:59:59.000Z');
    expect(cambodiaIso('')).toBeUndefined();
    expect(cambodiaIso('not a date')).toBeUndefined();
  });
});
