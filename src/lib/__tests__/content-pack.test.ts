import { describe, expect, it } from 'vitest';
import { isContentPack, mergeContentPack } from '@/lib/content-pack';
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
