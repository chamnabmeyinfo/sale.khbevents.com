import { describe, expect, it } from 'vitest';
import { compareCounts, RETENTION } from '../backups';

const tables = (slugs: string[], leads: number) => ({
  landing_pages: slugs.map((slug) => ({ id: `p-${slug}`, slug })),
  leads: Array.from({ length: leads }, (_, i) => ({ id: `l${i}` })),
  system_settings: [{ id: 'default' }],
});

describe('backup comparison (data-loss check)', () => {
  it('is quiet when nothing went missing, including after a small demo clean-up', () => {
    expect(compareCounts(tables(['a', 'b'], 40), tables(['a', 'b'], 40))).toBeUndefined();
    expect(compareCounts(tables(['a', 'b'], 40), tables(['a', 'b', 'c'], 45))).toBeUndefined();
    expect(compareCounts(tables(['a'], 40), tables(['a'], 37))).toBeUndefined();
  });

  it('reports a missing page and a real fall in leads', () => {
    const d = compareCounts(tables(['a', 'b'], 40), tables(['a'], 40));
    expect(d).toMatchObject({ pagesBefore: 2, pagesNow: 1, missingPages: ['b'] });
    expect(compareCounts(tables(['a'], 100), tables(['a'], 80))).toMatchObject({ leadsBefore: 100, leadsNow: 80 });
    // A page replaced by another (same count, different slug) still counts as missing.
    expect(compareCounts(tables(['a', 'b'], 10), tables(['a', 'c'], 10))?.missingPages).toEqual(['b']);
  });

  it('works from counts alone when the previous snapshot file is gone', () => {
    expect(compareCounts({ pages: 3, leads: 10, settingsRows: 5 }, tables(['a', 'b'], 10))).toMatchObject({ pagesBefore: 3, pagesNow: 2, missingPages: [] });
    expect(compareCounts(undefined, tables(['a'], 1))).toBeUndefined();
  });

  it('keeps a sensible number of each kind', () => {
    expect(RETENTION).toEqual({ deploy: 20, daily: 30, before: 20, manual: 50 });
  });
});
