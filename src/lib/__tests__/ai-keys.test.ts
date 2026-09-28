import { beforeEach, describe, expect, it, vi } from 'vitest';

// The keys row lives in system_settings; a map stands in for it here.
const rows = new Map<string, string>();
vi.mock('../storage', () => ({
  getMarker: async (id: string) => rows.get(id) ?? null,
  setMarker: async (id: string, value: string) => { rows.set(id, value); },
}));

import { aiKey, aiKeyShapeError, aiKeyStatuses, saveAiKey } from '../ai-keys';
import { groundedIdeas, numbersIn } from '../ai-poster-ideas';

describe('master AI keys', () => {
  beforeEach(() => {
    rows.clear();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  it('uses the key saved in Settings over the Vercel variable, and falls back to it when removed', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-from-vercel-xxxxxxxxxxxx1111';
    expect(await aiKey('anthropic')).toBe('sk-ant-from-vercel-xxxxxxxxxxxx1111');
    await saveAiKey('anthropic', 'sk-ant-saved-in-portal-xxxxxxxx2222');
    expect(await aiKey('anthropic')).toBe('sk-ant-saved-in-portal-xxxxxxxx2222');
    const status = (await aiKeyStatuses()).find((s) => s.provider === 'anthropic')!;
    expect(status).toMatchObject({ set: true, source: 'settings', last4: '2222', envName: 'ANTHROPIC_API_KEY' });
    expect(JSON.stringify(await aiKeyStatuses())).not.toContain('saved-in-portal');
    await saveAiKey('anthropic', null);
    expect(await aiKey('anthropic')).toBe('sk-ant-from-vercel-xxxxxxxxxxxx1111');
    expect((await aiKeyStatuses()).find((s) => s.provider === 'anthropic')).toMatchObject({ source: 'env', last4: '1111' });
    expect(await aiKey('gemini')).toBeUndefined();
    expect((await aiKeyStatuses()).find((s) => s.provider === 'gemini')).toMatchObject({ set: false, source: null });
  });

  it('refuses things that are not keys', () => {
    expect(aiKeyShapeError('anthropic', 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz')).toBeNull();
    expect(aiKeyShapeError('anthropic', 'AIzaSyAbcdefghijklmnopqrstuvwxyz')).toMatch(/sk-ant-/);
    expect(aiKeyShapeError('anthropic', 'short')).toMatch(/does not look/);
    expect(aiKeyShapeError('gemini', 'AIzaSyAbcdefghijklmnopqrstuvwxyz_-12')).toBeNull();
    expect(aiKeyShapeError('gemini', 'AIza with spaces in it here ok')).toMatch(/does not look/);
  });
});

describe('AI poster ideas: number guard', () => {
  it('reads Latin and Khmer digits', () => {
    expect(numbersIn('Early-bird $750 until 30 September 2026')).toEqual(['750', '30', '2026']);
    expect(numbersIn('ដំណើរ ៤ ថ្ងៃ')).toEqual(['4']);
  });

  it('drops ideas stating a number that is not in the facts', () => {
    const facts = 'Offer line: Early-bird $750 per person until 30 September 2026. A 4-day business trip.';
    const ok = { angle: 'outcome', headlineEn: 'Meet Korean suppliers in 4 days', headlineKh: 'ជួបអ្នកផ្គត់ផ្គង់កូរ៉េក្នុង ៤ ថ្ងៃ', supportEn: 'Early-bird $750 until 30 September.', supportKh: '' };
    const invented = { ...ok, angle: 'proof', headlineEn: 'Join 120 business owners' };
    expect(groundedIdeas([ok, invented], facts).map((i) => i.angle)).toEqual(['outcome']);
  });
});
