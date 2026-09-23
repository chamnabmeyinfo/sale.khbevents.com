import type { PackageTier } from '@/lib/types';

/** "$550", "550", "$1,250 / person" → 550, 550, 1250. NaN for anything without digits. */
export function parsePrice(value: unknown): number {
  const n = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return n > 0 ? n : NaN;
}

/**
 * The price a buyer pays right now.
 *
 * When the admin has published package cards, the featured card's price wins: it is the
 * number they are actively advertising, and it must never disagree with the nav button,
 * the pass preview or the FAQ. Without package cards the price follows the sale phase.
 */
export function currentSeatPrice(
  packages: PackageTier[] | undefined,
  isEarlyBird: boolean,
  earlyBirdPrice: number,
  regularPrice: number,
): number {
  const featured = packages?.find(p => p.popular) ?? packages?.[0];
  const fromPackage = featured ? parsePrice(featured.price) : NaN;
  if (Number.isFinite(fromPackage)) return fromPackage;
  return isEarlyBird ? earlyBirdPrice : regularPrice;
}
