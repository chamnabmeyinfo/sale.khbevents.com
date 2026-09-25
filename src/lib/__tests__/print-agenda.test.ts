import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeBuilderDoc } from '../builder';
import { buildAgenda, printDate } from '../print-agenda';
import { qrPath } from '../qr';
import type { LandingPage } from '../types';

const page = JSON.parse(readFileSync(join(process.cwd(), 'data/db.json'), 'utf8')).pages
  .find((p: LandingPage) => p.slug === 'smart-city-tea-cafe') as LandingPage;
const doc = normalizeBuilderDoc(page.builder);
const SEPT_25 = Date.parse('2026-09-25T05:00:00Z');

describe('print agenda', () => {
  it('prints price, deadline and seats as facts', () => {
    const a = buildAgenda(doc, 'en', SEPT_25, page.title);
    expect(a.facts).toEqual([
      { label: 'Price', value: '$550 per person' },
      { label: 'Closed on', value: '20 September 2026' },
      { label: 'Seats', value: '11 of 30 left' },
    ]);
  });

  it('says "Registration closes" while the deadline is ahead', () => {
    const a = buildAgenda(doc, 'en', Date.parse('2026-09-01T00:00:00Z'));
    expect(a.facts.find((f) => f.label === 'Registration closes')?.value).toBe('20 September 2026');
  });

  it('keeps the readable sections and leaves out the form and photos', () => {
    const a = buildAgenda(doc, 'en', SEPT_25);
    expect(a.title).toBe('Come home with suppliers, not just photos.');
    const ids = a.sections.map((s) => s.id);
    expect(ids).toContain('cv-itinerary');
    expect(ids).toContain('cv-faq');
    expect(ids).not.toContain('cv-form');
    expect(ids).not.toContain('cv-gallery');
    const days = a.sections.find((s) => s.id === 'cv-itinerary');
    expect(days?.kind).toBe('steps');
    expect(days?.items[0].text).toContain('17:45 - 21:35');
  });

  it('prints in Khmer', () => {
    const a = buildAgenda(doc, 'kh', SEPT_25);
    expect(a.title).toBe(page.translations?.kh?.heroHeadline);
    expect(a.facts[0].label).toBe('តម្លៃ');
  });

  it('shows an open early-bird price with its end date', () => {
    const early = normalizeBuilderDoc({ ...doc, offer: { ...doc.offer, price: 799, earlyPrice: 750, earlyUntil: '2026-09-30T16:59:59Z' } });
    const a = buildAgenda(early, 'en', SEPT_25);
    expect(a.facts[0].value).toBe('$750 per person (regular price $799)');
    expect(a.facts[1]).toEqual({ label: 'Early-bird price until', value: printDate('2026-09-30T16:59:59Z', 'en') });
  });

  it('makes a QR code path', () => {
    const q = qrPath('https://sale.khbevents.com/smart-city-tea-cafe');
    expect(q.size).toBeGreaterThanOrEqual(21);
    expect(q.d.startsWith('M0 0h1v1h-1z')).toBe(true);
  });
});
