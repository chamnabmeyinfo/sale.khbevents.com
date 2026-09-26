import { describe, expect, it } from 'vitest';
import { computePageStats } from '../page-stats';
import type { Lead } from '../types';
import type { VisitRecord } from '../visits';

const NOW = Date.parse('2026-09-26T05:00:00Z');
const DAY = 86_400_000;
const visit = (p: string, s: string, ago: number): VisitRecord => ({ s, p, t0: NOW - ago, t1: NOW - ago, src: 'direct' });
const lead = (slug: string, ago: number): Lead => ({ id: `l${Math.random()}`, landingPageSlug: slug, landingPageTitle: '', fullName: 'X', email: '', phone: '', eventType: '', status: 'NEW', notes: [], createdAt: new Date(NOW - ago).toISOString(), updatedAt: '' });

describe('page stats', () => {
  it('counts one visit per session and page, leads all time, conversion within the window', () => {
    const visits = [visit('trip', 'a', DAY), visit('trip', 'a', DAY - 10), visit('trip', 'b', 2 * DAY), visit('other', 'a', DAY), visit('trip', 'old', 40 * DAY)];
    const leads = [lead('trip', DAY), lead('trip', 90 * DAY), lead('other', DAY)];
    const s = computePageStats(leads, visits, NOW, 30);
    expect(s.bySlug.trip).toEqual({ leads: 2, visits: 2, windowLeads: 1, conversion: 50 });
    expect(s.bySlug.other).toMatchObject({ leads: 1, visits: 1, conversion: 100 });
    expect(s.total).toMatchObject({ leads: 3, visits: 3, windowLeads: 2, conversion: 66.7 });
  });

  it('starts the window when tracking began, so older leads do not inflate conversion', () => {
    const s = computePageStats([lead('trip', 10 * DAY), lead('trip', DAY / 2)], [visit('trip', 'a', DAY)], NOW, 30);
    expect(s.sinceMs).toBe(NOW - DAY);
    expect(s.bySlug.trip).toMatchObject({ leads: 2, windowLeads: 1, visits: 1, conversion: 100 });
  });

  it('shows no conversion without visits', () => {
    const s = computePageStats([lead('trip', DAY)], [], NOW, 30);
    expect(s.bySlug.trip.conversion).toBeNull();
    expect(s.total.visits).toBe(0);
  });
});
