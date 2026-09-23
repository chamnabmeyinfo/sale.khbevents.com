import { describe, expect, it } from 'vitest';
import { safeRedirectUrl } from '../safe-url';

describe('safeRedirectUrl', () => {
  it('allows http(s) and site paths', () => {
    expect(safeRedirectUrl('https://t.me/khb')).toBe('https://t.me/khb');
    expect(safeRedirectUrl('/thank-you')).toBe('/thank-you');
  });

  it('blocks script and protocol-relative URLs', () => {
    expect(safeRedirectUrl('javascript:alert(1)')).toBeNull();
    expect(safeRedirectUrl(' JavaScript:alert(1)')).toBeNull();
    expect(safeRedirectUrl('data:text/html,hi')).toBeNull();
    expect(safeRedirectUrl('//evil.example')).toBeNull();
    expect(safeRedirectUrl('')).toBeNull();
  });
});
