import { describe, expect, it } from 'vitest';
import { normalizeGa4Id } from '../ga4';

describe('normalizeGa4Id', () => {
  it('accepts GA4 measurement IDs, empty to switch off, and rejects anything else', () => {
    expect(normalizeGa4Id(' g-ab12cd34ef ')).toBe('G-AB12CD34EF');
    expect(normalizeGa4Id('')).toBe('');
    expect(normalizeGa4Id('   ')).toBe('');
    expect(normalizeGa4Id('UA-12345-1')).toBeNull();
    expect(normalizeGa4Id('GTM-ABC123')).toBeNull();
    expect(normalizeGa4Id('G-<script>')).toBeNull();
    expect(normalizeGa4Id(42)).toBeNull();
  });
});
