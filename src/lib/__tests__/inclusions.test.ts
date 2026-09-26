import { describe, expect, it } from 'vitest';
import { blockHints, createBlock, normalizeBuilderDoc } from '../builder';
import { buildPrintPlan } from '../print-plan';

describe('Included & not included section', () => {
  it('starts with both lists and placeholder text that the editor flags', () => {
    const b = createBlock('inclusions');
    expect(b.type === 'inclusions' && b.included.length > 0 && b.excluded.length > 0).toBe(true);
    expect(blockHints(b)).toContain('placeholderText');
  });

  it('keeps both lists and their headings; drops empty items and bad values', () => {
    const doc = normalizeBuilderDoc({
      blocks: [
        { type: 'inclusions', variant: 'stacked', title: 'Price', includedTitle: 'Yes', included: ['Hotel', '', { en: 'Meals', kh: 'អាហារ' }], excludedTitle: 'No', excluded: ['Visa'] },
        { type: 'inclusions', variant: 'weird', included: [], excluded: [] },
      ],
    });
    const [a, b] = doc.blocks;
    expect(a.type === 'inclusions' && a.included).toEqual([{ en: 'Hotel' }, { en: 'Meals', kh: 'អាហារ' }]);
    expect(a.type === 'inclusions' && a.excluded).toEqual([{ en: 'Visa' }]);
    expect(a.type === 'inclusions' && a.variant).toBe('stacked');
    expect(b.type === 'inclusions' && b.variant).toBe('columns');
    expect(b.type === 'inclusions' && b.includedTitle.en).toBe('Included');
    expect(blockHints(b)).toContain('noItems');
  });

  it('prints on both the agenda and the entire page', () => {
    const doc = normalizeBuilderDoc({ offer: { price: 100 }, blocks: [{ type: 'inclusions', title: 'Price covers', included: ['Hotel'], excluded: ['Visa'] }] });
    for (const mode of ['agenda', 'full'] as const) {
      const plan = buildPrintPlan(doc, { lang: 'en', mode, nowMs: Date.now() });
      const s = plan.sections.find((x) => x.kind === 'inclusions');
      expect(s && s.kind === 'inclusions' && [s.included.items, s.excluded.items]).toEqual([['Hotel'], ['Visa']]);
    }
  });
});
