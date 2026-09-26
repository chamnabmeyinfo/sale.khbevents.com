import { describe, expect, it } from 'vitest';
import { withSnapshot, type PageVersion } from '../page-backups';
import type { LandingPage } from '../types';

const T0 = Date.parse('2026-09-26T08:00:00Z');
const v = (title: string, at: number): PageVersion => ({ savedAt: new Date(at).toISOString(), page: { title } as LandingPage });

describe('autosave snapshots', () => {
  it('replaces the newest snapshot within two minutes, otherwise adds one, and keeps at most 20', () => {
    let list = withSnapshot([], v('v1', T0), T0);
    list = withSnapshot(list, v('v2', T0 + 30_000), T0 + 30_000);
    expect(list.map((x) => x.page.title)).toEqual(['v2']);
    list = withSnapshot(list, v('v3', T0 + 3 * 60_000), T0 + 3 * 60_000);
    expect(list.map((x) => x.page.title)).toEqual(['v3', 'v2']);
    for (let i = 0; i < 25; i++) list = withSnapshot(list, v(`n${i}`, T0 + (i + 2) * 3 * 60_000), T0 + (i + 2) * 3 * 60_000);
    expect(list).toHaveLength(20);
    expect(list[0].page.title).toBe('n24');
  });
});
