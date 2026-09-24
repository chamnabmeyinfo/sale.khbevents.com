import type { LandingPage } from './types';

/**
 * A campaign page's feature image: the one photo that stands for the page in the
 * admin page lists, on the home page and in link previews (Facebook, Telegram).
 *
 * It is stored in `page.ogImage`. When it is empty, the best photo already on the
 * page is used: the classic hero cover, else a builder page's hero photo, a
 * section background, the first gallery photo or the first offer photo.
 * Client-safe.
 */
export interface FeatureImage {
  src: string;
  /** True when the admin chose it; false when it was taken from the page. */
  chosen: boolean;
}

type PageLike = Pick<LandingPage, 'ogImage' | 'heroImage' | 'builder'>;

function fromBuilder(page: PageLike): string | undefined {
  const blocks = page.builder?.blocks || [];
  for (const b of blocks) if (b.type === 'hero' && b.image) return b.image;
  for (const b of blocks) if (b.style?.bgImage) return b.style.bgImage;
  for (const b of blocks) if (b.type === 'gallery' && b.items[0]?.image) return b.items[0].image;
  for (const b of blocks) if (b.type === 'offer' && b.image) return b.image;
  return undefined;
}

export function featureImage(page: PageLike): FeatureImage | null {
  const chosen = page.ogImage?.trim();
  if (chosen) return { src: chosen, chosen: true };
  const fallback = page.heroImage?.trim() || fromBuilder(page);
  return fallback ? { src: fallback, chosen: false } : null;
}

/** Recommended size for link previews. */
export const FEATURE_IMAGE_SIZE = { width: 1200, height: 630 };
