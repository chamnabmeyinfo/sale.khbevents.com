import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { featureImageDecision, isContentPack, mergeContentPack, parseFeatureImages } from '@/lib/content-pack';
import type { LandingPage } from '@/lib/types';

const page = {
  id: 'page-1',
  slug: 'trip',
  title: 'Old title',
  viewsCount: 120,
  leadsCount: 7,
  urgency: { totalSeats: 30, claimedSeats: 19, regularPrice: '599', registrationDeadline: '2026-10-01T00:00:00' },
  isolatedSettings: { phone: '+855 12 999 888', coordinatorName: 'Sovann Meas', customCtaText: 'Old CTA' },
  faqs: [{ id: 'f1', question: 'Old?', answer: 'Old.' }],
  tracking: { ga4MeasurementId: 'G-1' },
} as unknown as LandingPage;

describe('mergeContentPack', () => {
  it('replaces scalars and arrays, keeps fields the pack does not mention', () => {
    const out = mergeContentPack(page, { title: 'New title', faqs: [{ id: 'f1', question: 'New?', answer: 'New.' }] });
    expect(out.title).toBe('New title');
    expect(out.faqs).toEqual([{ id: 'f1', question: 'New?', answer: 'New.' }]);
    expect(out.tracking).toEqual({ ga4MeasurementId: 'G-1' });
    expect(out.slug).toBe('trip');
  });

  it('merges nested settings key by key so admin-set values survive', () => {
    const out = mergeContentPack(page, { urgency: { regularPrice: 550, noticeText: '' } });
    expect(out.urgency).toEqual({
      totalSeats: 30,
      claimedSeats: 19,
      regularPrice: 550,
      registrationDeadline: '2026-10-01T00:00:00',
      noticeText: '',
    });
    const out2 = mergeContentPack(page, { isolatedSettings: { customCtaText: 'New CTA' } });
    expect(out2.isolatedSettings?.phone).toBe('+855 12 999 888');
    expect(out2.isolatedSettings?.coordinatorName).toBe('Sovann Meas');
    expect(out2.isolatedSettings?.customCtaText).toBe('New CTA');
  });

  it('never lets a pack change identity or counters', () => {
    const out = mergeContentPack(page, {
      id: 'evil', viewsCount: 0, leadsCount: 0, createdAt: 'x', updatedAt: 'y', title: 'T',
    } as Partial<LandingPage>);
    expect(out.id).toBe('page-1');
    expect(out.viewsCount).toBe(120);
    expect(out.leadsCount).toBe(7);
    expect(out.title).toBe('T');
  });

  it('does not mutate the base page', () => {
    const before = JSON.stringify(page);
    mergeContentPack(page, { urgency: { regularPrice: 1 } });
    expect(JSON.stringify(page)).toBe(before);
  });
});

describe('isContentPack', () => {
  it('requires an object with a slug', () => {
    expect(isContentPack({ slug: 'trip' })).toBe(true);
    expect(isContentPack({ title: 'no slug' })).toBe(false);
    expect(isContentPack([{ slug: 'trip' }])).toBe(false);
    expect(isContentPack('trip')).toBe(false);
    expect(isContentPack(null)).toBe(false);
  });
});

describe('suggested feature images', () => {
  it('applies once, and never over an image the owner chose', () => {
    expect(featureImageDecision(undefined, '/a.jpg', null)).toBe('apply');
    expect(featureImageDecision('', '/a.jpg', null)).toBe('apply');
    expect(featureImageDecision('/mine.jpg', '/a.jpg', null)).toBe('owner-chose');
    expect(featureImageDecision('', '/a.jpg', '/a.jpg')).toBe('already-applied');
    expect(featureImageDecision('', '/b.jpg', '/a.jpg')).toBe('apply');
  });

  it('accepts only site paths and https images for plain slugs', () => {
    expect(parseFeatureImages({ 'korea-trip': '/images/a.jpg', 'x': 'https://cdn.example.com/b.jpg', 'Bad Slug': '/c.jpg', y: 'javascript:alert(1)', z: '//evil.com/d.jpg', w: 5 })).toEqual({
      'korea-trip': '/images/a.jpg',
      x: 'https://cdn.example.com/b.jpg',
    });
    expect(parseFeatureImages(null)).toEqual({});
  });
});

describe('pack: the Vietnam page restored from the owner\'s saved copy', () => {
  const live = JSON.parse(readFileSync(join(process.cwd(), 'data/db.json'), 'utf8')).pages
    .find((p: LandingPage) => p.slug === 'smart-city-tea-cafe') as LandingPage;
  const pack = JSON.parse(readFileSync(join(process.cwd(), 'content/pages/smart-city-tea-cafe.json'), 'utf8'));

  it('carries the owner\'s sections, photos and offer, plus the lead form and final call to action', () => {
    const merged = mergeContentPack({ ...structuredClone(live), builder: { ...live.builder!, blocks: [] } }, pack);
    const ids = merged.builder!.blocks.map((b) => b.id);
    expect(ids).toEqual(['cv-hero', 'cv-values', 'cv-problems', 'cv-audiences', 'cv-included', 'cv-itinerary', 'cv-gallery', 'cv-offer', 'cv-guarantee', 'cv-steps', 'cv-form', 'cv-faq', 'b-muh2ouop-sox0t', 'b-muh3nvax-0x2ot', 'b-muhup9e4-g3ywe', 'cv-final']);
    expect(new Set(JSON.stringify(merged.builder).match(/https:\/\/[^"]+\.(?:webp|jpg|jpeg|png)/g)).size).toBe(23);
    expect(merged.builder!.offer.stockLeft).toBe(16);
    expect(merged.builder!.defaultLang).toBe('kh');
    const terms = merged.builder!.blocks.find((b) => b.type === 'terms');
    expect(terms && terms.type === 'terms' && terms.items).toHaveLength(5);
  });

  it('shows the nine included items under the owner\'s title, and the not-included lines from the FAQ and Terms', () => {
    const merged = mergeContentPack(live, pack);
    const block = merged.builder!.blocks.find((b) => b.id === 'cv-included');
    expect(block?.type).toBe('inclusions');
    if (block?.type !== 'inclusions') return;
    expect(block.title.en).toBe('9 things include in this package');
    expect(block.included).toHaveLength(9);
    expect(block.excluded.map((x) => x.en)).toEqual([
      'Lunches and dinners outside the listed programme (the Halong Bay cruise lunch is included).',
      'A Vietnam SIM card.',
      'Travel insurance.',
      'Personal shopping.',
      'Single room: +$25 per night (the price is twin or double sharing).',
    ]);
    expect(block.excluded.every((x) => x.kh)).toBe(true);
    // The page record itself (title, settings, counters) is not touched.
    expect(merged.title).toBe(live.title);
    expect(merged.isolatedSettings).toEqual(live.isolatedSettings);
  });

  it('skips ids that are not on the page and pages without a builder', () => {
    const merged = mergeContentPack(live, { slug: live.slug, replaceBuilderBlocks: [{ id: 'nope', type: 'faq', items: [] }] });
    expect(merged.builder!.blocks.map((b) => b.id)).toEqual(live.builder!.blocks.map((b) => b.id));
    const classicPage = { ...structuredClone(live), builder: undefined };
    expect(mergeContentPack(classicPage, { slug: live.slug, replaceBuilderBlocks: [{ id: 'cv-included', type: 'faq' }] }).builder).toBeUndefined();
    expect('replaceBuilderBlocks' in merged).toBe(false);
  });
});
