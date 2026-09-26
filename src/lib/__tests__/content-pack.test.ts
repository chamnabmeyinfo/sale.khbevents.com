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

describe('pack: replace builder sections by id', () => {
  const live = JSON.parse(readFileSync(join(process.cwd(), 'data/db.json'), 'utf8')).pages
    .find((p: LandingPage) => p.slug === 'smart-city-tea-cafe') as LandingPage;
  const pack = JSON.parse(readFileSync(join(process.cwd(), 'content/pages/smart-city-tea-cafe.json'), 'utf8'));

  it('the Vietnam pack shows the nine included items and the four not included from the FAQ', () => {
    const merged = mergeContentPack(live, pack);
    const block = merged.builder!.blocks.find((b) => b.id === 'cv-included');
    expect(block?.type).toBe('inclusions');
    if (block?.type !== 'inclusions') return;
    expect(block.included).toHaveLength(9);
    expect(block.excluded.map((x) => x.en)).toEqual([
      'Lunches and dinners outside the listed programme (the Halong Bay cruise lunch is included).',
      'A Vietnam SIM card.',
      'Travel insurance.',
      'Personal shopping.',
    ]);
    expect(block.excluded.every((x) => x.kh)).toBe(true);
  });

  it('changes only that section: order, other sections and the offer stay the admin\'s', () => {
    const owner = structuredClone(live);
    owner.builder!.offer.deadline = '2026-12-01T00:00:00.000Z';
    owner.builder!.blocks = [...owner.builder!.blocks].reverse();
    const merged = mergeContentPack(owner, pack);
    expect(merged.builder!.offer.deadline).toBe('2026-12-01T00:00:00.000Z');
    expect(merged.builder!.blocks.map((b) => b.id)).toEqual(owner.builder!.blocks.map((b) => b.id));
    const others = (p: LandingPage) => JSON.stringify(p.builder!.blocks.filter((b) => b.id !== 'cv-included'));
    expect(others(merged)).toBe(others(owner));
    expect(merged.title).toBe(owner.title);
  });

  it('skips ids that are not on the page and pages without a builder', () => {
    const merged = mergeContentPack(live, { slug: live.slug, replaceBuilderBlocks: [{ id: 'nope', type: 'faq', items: [] }] });
    expect(merged.builder!.blocks.map((b) => b.id)).toEqual(live.builder!.blocks.map((b) => b.id));
    const classicPage = { ...structuredClone(live), builder: undefined };
    expect(mergeContentPack(classicPage, { slug: live.slug, replaceBuilderBlocks: [{ id: 'cv-included', type: 'faq' }] }).builder).toBeUndefined();
    expect('replaceBuilderBlocks' in merged).toBe(false);
  });
});
