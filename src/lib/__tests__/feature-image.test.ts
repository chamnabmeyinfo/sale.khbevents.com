import { describe, expect, it } from 'vitest';
import { featureImage } from '../feature-image';
import { normalizeBuilderDoc } from '../builder';

describe('featureImage', () => {
  it('uses the chosen image first', () => {
    expect(featureImage({ ogImage: '/a.jpg', heroImage: '/b.jpg' })).toEqual({ src: '/a.jpg', chosen: true });
  });

  it('falls back to the classic hero cover, then to builder photos', () => {
    expect(featureImage({ ogImage: ' ', heroImage: '/b.jpg' })).toEqual({ src: '/b.jpg', chosen: false });
    const builder = normalizeBuilderDoc({
      blocks: [
        { type: 'faq', title: { en: 'Q' } },
        { type: 'gallery', title: { en: 'G' }, items: [{ image: '/g.jpg' }] },
        { type: 'hero', headline: { en: 'H' }, image: '/h.jpg' },
      ],
    });
    expect(featureImage({ builder })).toEqual({ src: '/h.jpg', chosen: false });
    const galleryOnly = normalizeBuilderDoc({ blocks: [{ type: 'gallery', title: { en: 'G' }, items: [{ image: '/g.jpg' }] }] });
    expect(featureImage({ builder: galleryOnly })?.src).toBe('/g.jpg');
  });

  it('returns null when the page has no photo at all', () => {
    expect(featureImage({ builder: normalizeBuilderDoc({ blocks: [{ type: 'faq', title: { en: 'Q' } }] }) })).toBeNull();
    expect(featureImage({})).toBeNull();
  });
});
