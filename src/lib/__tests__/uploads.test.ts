import { describe, expect, it } from 'vitest';
import { isAllowedImageType, safeUploadName, MAX_UPLOAD_BYTES } from '@/lib/uploads';

describe('safeUploadName', () => {
  it('takes the extension from the MIME type, never from the file name', () => {
    expect(safeUploadName('evil.php.jpg', 'image/png', 1000)).toMatch(/^rs-[a-f0-9]{8}-evil-php\.png$/);
    expect(safeUploadName('photo.JPG', 'image/jpeg', 1000)).toMatch(/-photo\.jpg$/);
  });
  it('strips paths, spaces and unicode down to a readable slug', () => {
    expect(safeUploadName('../../Hà Nội Expo (2).jpeg', 'image/webp', 1000)).toMatch(/^rs-[a-f0-9]{8}-h-n-i-expo-2\.webp$/);
    expect(safeUploadName('こんにちは', 'image/gif', 1000)).toMatch(/^rs-[a-f0-9]{8}-image\.gif$/);
  });
  it('is unique per call', () => {
    expect(safeUploadName('a.png', 'image/png')).not.toBe(safeUploadName('a.png', 'image/png'));
  });
});

describe('isAllowedImageType', () => {
  it('accepts raster images and rejects SVG and non-images', () => {
    expect(isAllowedImageType('image/jpeg')).toBe(true);
    expect(isAllowedImageType('image/webp')).toBe(true);
    expect(isAllowedImageType('image/svg+xml')).toBe(false);
    expect(isAllowedImageType('text/html')).toBe(false);
  });
  it('keeps the size cap under the Vercel request limit', () => {
    expect(MAX_UPLOAD_BYTES).toBeLessThan(4.5 * 1024 * 1024);
  });
});
