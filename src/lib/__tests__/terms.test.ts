import { describe, expect, it } from 'vitest';
import { blockHints, createBlock, normalizeBuilderDoc } from '../builder';
import { buildPrintPlan } from '../print-plan';

describe('Terms & Conditions section', () => {
  it('starts with headings and placeholder text that the editor flags', () => {
    const b = createBlock('terms');
    expect(b.type).toBe('terms');
    expect(blockHints(b)).toContain('placeholderText');
  });

  it('keeps clauses, the last-updated date and a note; drops bad values', () => {
    const doc = normalizeBuilderDoc({
      blocks: [
        { type: 'terms', variant: 'document', title: 'Terms', updated: '2026-09-26', note: 'Questions: call us.', items: [{ title: 'Payment', text: '50% deposit.\nBalance before 1 Oct.' }, { title: '', text: 'no heading' }] },
        { type: 'terms', variant: 'weird', updated: '26/09/2026', items: [] },
        { type: 'form', requireTerms: true, termsLabel: 'I agree' },
      ],
    });
    const [t1, t2, form] = doc.blocks;
    expect(t1.type === 'terms' && t1.items).toEqual([{ title: { en: 'Payment' }, text: { en: '50% deposit.\nBalance before 1 Oct.' } }]);
    expect(t1.type === 'terms' && t1.updated).toBe('2026-09-26');
    expect(t2.type === 'terms' && t2.variant).toBe('accordion');
    expect(t2.type === 'terms' && t2.updated).toBeUndefined();
    expect(form.type === 'form' && form.requireTerms).toBe(true);
    expect(form.type === 'form' && form.termsLabel).toEqual({ en: 'I agree' });
  });

  it('prints in full on "Entire page" and stays out of the agenda', () => {
    const doc = normalizeBuilderDoc({ offer: { price: 100 }, blocks: [{ type: 'benefits', items: [{ title: 'A' }] }, { type: 'terms', title: 'Terms', updated: '2026-09-26', items: [{ title: 'Payment', text: 'Deposit' }] }] });
    const full = buildPrintPlan(doc, { lang: 'en', mode: 'full', nowMs: Date.now() });
    const terms = full.sections.find((s) => s.kind === 'terms');
    expect(terms && terms.kind === 'terms' && terms.updated).toBe('26 September 2026');
    const agenda = buildPrintPlan(doc, { lang: 'en', mode: 'agenda', nowMs: Date.now() });
    expect(agenda.sections.some((s) => s.kind === 'terms')).toBe(false);
    expect(agenda.omitted).toContain('Terms');
  });
});
