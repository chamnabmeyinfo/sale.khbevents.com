import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeBuilderDoc, type BuilderDoc } from '../builder';
import { buildPrintPlan, classifyNature, parseDay, printDate } from '../print-plan';
import { qrPath } from '../qr';
import type { LandingPage } from '../types';

const pages = JSON.parse(readFileSync(join(process.cwd(), 'data/db.json'), 'utf8')).pages as LandingPage[];
const docOf = (slug: string) => normalizeBuilderDoc(pages.find((p) => p.slug === slug)!.builder);
const vietnam = docOf('smart-city-tea-cafe');
const korea = docOf('korea-b2b-trip-2026');
const SEPT_25 = Date.parse('2026-09-25T05:00:00Z');
const plan = (doc: BuilderDoc, mode: 'agenda' | 'full' = 'agenda', lang: 'en' | 'kh' = 'en') => buildPrintPlan(doc, { lang, mode, nowMs: SEPT_25 });

describe('print plan', () => {
  it('reads what each page sells', () => {
    expect(classifyNature(vietnam)).toBe('trip');
    expect(classifyNature(korea)).toBe('event');
    const product = normalizeBuilderDoc({ offer: { price: 25, currency: 'USD', stockTotal: null, stockLeft: null }, blocks: [{ type: 'benefits', items: [{ title: 'Fast' }] }] });
    expect(classifyNature(product)).toBe('product');
  });

  it('turns a day of the itinerary into timed rows', () => {
    const d = parseDay('Day 1 · Oct 8, 2026 · Phnom Penh to Hanoi', '17:45 - 21:35  Flight to Hanoi\nFree evening');
    expect(d).toEqual({ label: 'Day 1', date: 'Oct 8, 2026', title: 'Phnom Penh to Hanoi', rows: [{ time: '17:45–21:35', text: 'Flight to Hanoi' }, { text: 'Free evening' }] });
  });

  it('trip agenda: programme first, persuasion left out', () => {
    const p = plan(vietnam);
    const kinds = p.sections.map((s) => s.kind);
    expect(kinds[0]).toBe('schedule');
    expect(kinds).toContain('checklist');
    expect(kinds).toContain('steps');
    expect(kinds).toContain('chips'); // who it is for, as tags
    expect(kinds).not.toContain('faq');
    expect(kinds.at(-1)).toBe('callout');
    expect(p.omitted.join(' ')).toMatch(/35%/); // the problems section
    const days = p.sections[0].kind === 'schedule' ? p.sections[0].days : [];
    expect(days).toHaveLength(4);
    expect(days[0].rows[0].time).toBe('17:45–21:35');
    expect(p.facts.map((f) => f.icon)).toEqual(['price', 'calendar', 'deadline', 'seats']);
    expect(p.facts.find((f) => f.icon === 'deadline')?.label).toBe('Registration closed');
  });

  it('event agenda: fairs as places, a few questions', () => {
    const p = plan(korea);
    expect(p.sections.some((s) => s.kind === 'places')).toBe(true);
    const faq = p.sections.find((s) => s.kind === 'faq');
    expect(faq && faq.kind === 'faq' && faq.items.length).toBeLessThanOrEqual(4);
  });

  it('entire page keeps every section in page order, with photos', () => {
    const p = plan(vietnam, 'full');
    expect(p.omitted).toEqual([]);
    expect(p.sections.some((s) => s.kind === 'gallery')).toBe(true);
    expect(p.sections.some((s) => s.kind === 'faq' && s.items.length === 10)).toBe(true);
    expect(p.heroImage).toBeTruthy();
  });

  it('prints in Khmer', () => {
    const p = plan(vietnam, 'agenda', 'kh');
    expect(p.facts[0].label).toBe('តម្លៃ');
    expect(p.title).toBe(pages.find((x) => x.slug === 'smart-city-tea-cafe')!.translations?.kh?.heroHeadline);
  });

  it('dates are Cambodia time', () => {
    expect(printDate('2026-09-20T16:59:59.000Z', 'en')).toBe('20 September 2026');
  });

  it('makes a QR code path', () => {
    const q = qrPath('https://sale.khbevents.com/smart-city-tea-cafe');
    expect(q.size).toBeGreaterThanOrEqual(21);
  });
});
