import { describe, expect, it } from 'vitest';
import { currentSeatPrice, parsePrice } from '@/lib/seat-price';
import type { PackageTier } from '@/lib/types';

const pkg = (price: string, popular?: boolean): PackageTier =>
  ({ id: 'p', name: 'Seat', price, features: [], popular } as unknown as PackageTier);

describe('parsePrice', () => {
  it('reads dollar strings and plain numbers', () => {
    expect(parsePrice('$550')).toBe(550);
    expect(parsePrice('550')).toBe(550);
    expect(parsePrice(599)).toBe(599);
    expect(parsePrice('$1,250 / person')).toBe(1250);
  });
  it('is NaN for text without a number', () => {
    expect(Number.isNaN(parsePrice('Contact us'))).toBe(true);
    expect(Number.isNaN(parsePrice(''))).toBe(true);
    expect(Number.isNaN(parsePrice(undefined))).toBe(true);
  });
});

describe('currentSeatPrice', () => {
  it('follows the sale phase when there are no package cards', () => {
    expect(currentSeatPrice([], true, 550, 599)).toBe(550);
    expect(currentSeatPrice(undefined, false, 550, 599)).toBe(599);
  });
  it('uses the featured package price over the phase price', () => {
    // Production today: early bird over, urgency says 599, but the published card says $550.
    expect(currentSeatPrice([pkg('$550', true)], false, 550, 599)).toBe(550);
  });
  it('falls back to the first package when none is marked popular', () => {
    expect(currentSeatPrice([pkg('$620'), pkg('$700')], false, 550, 599)).toBe(620);
  });
  it('ignores a package whose price is not a number', () => {
    expect(currentSeatPrice([pkg('Contact us', true)], false, 550, 599)).toBe(599);
  });
});
