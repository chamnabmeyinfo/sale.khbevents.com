import { describe, expect, it } from 'vitest';
import {
  adTargetsPage,
  frequencyAllows,
  isWithinSchedule,
  newPopupAd,
  normalizePopupAd,
  normalizePopupAdsState,
  pickPopupToShow,
  pickText,
  popupAdStatus,
  previewPath,
  resolveCtaHref,
  selectPublicPopupAds,
} from '../popup-ads';
import type { PopupVisitorContext } from '../popup-ads';
import type { PopupAd, PopupAdsSettings, PopupAdsState } from '../types';

const NOW = '2026-10-01T10:00:00.000Z';
const nowMs = new Date(NOW).getTime();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const ad = (overrides: Partial<PopupAd> = {}): PopupAd =>
  newPopupAd(NOW, { id: 'ad-1', enabled: true, title: { en: 'Save your seat' }, ...overrides });

const state = (ads: PopupAd[], settings: Partial<PopupAdsSettings> = {}): PopupAdsState => ({
  settings: { enabled: true, globalCooldownHours: 12, ...settings },
  ads,
});

const visitor = (overrides: Partial<PopupVisitorContext> = {}): PopupVisitorContext => ({
  nowMs,
  device: 'mobile',
  lang: 'en',
  leadSent: false,
  shownAt: () => undefined,
  shownThisSession: () => false,
  ...overrides,
});

describe('normalizePopupAd', () => {
  it('rejects ads without a title or a button label', () => {
    expect(normalizePopupAd({ title: { en: '' }, cta: { label: { en: 'Go' } } }, NOW)).toBeNull();
    expect(normalizePopupAd({ title: { en: 'Hi' }, cta: { label: { en: '' } } }, NOW)).toBeNull();
    expect(normalizePopupAd('nope', NOW)).toBeNull();
  });

  it('drops unknown fields, clamps numbers and blocks unsafe URLs', () => {
    const out = normalizePopupAd(
      {
        id: 'x y/../z',
        title: { en: 'Hi', kh: 'សួស្តី' },
        cta: { label: 'Open', action: 'url', url: 'javascript:alert(1)', newTab: true },
        trigger: { type: 'delay', seconds: 99999 },
        priority: -5,
        accent: 'red',
        imageUrl: 'data:image/png;base64,AAAA',
        pages: ['Smart-City-Tea-Cafe', 'bad slug!', 'smart-city-tea-cafe'],
        evil: true,
      },
      NOW,
    )!;
    expect(out.id).toBe('xyz');
    expect(out.cta.url).toBeUndefined();
    expect(out.trigger).toEqual({ type: 'delay', seconds: 600 });
    expect(out.priority).toBe(0);
    expect(out.accent).toBe('#E5A93C');
    expect(out.imageUrl).toBeUndefined();
    expect(out.pages).toEqual(['smart-city-tea-cafe']);
    expect((out as unknown as Record<string, unknown>).evil).toBeUndefined();
    expect(out.hideAfterLead).toBe(true);
    expect(out.name).toBe('Hi');
  });

  it('keeps the original createdAt and drops an end date before the start', () => {
    const existing = ad({ createdAt: '2026-01-01T00:00:00.000Z' });
    const out = normalizePopupAd({ ...existing, startAt: '2026-10-05', endAt: '2026-10-02' }, NOW, existing)!;
    expect(out.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(out.startAt).toBe('2026-10-05T00:00:00.000Z');
    expect(out.endAt).toBeUndefined();
  });
});

describe('normalizePopupAdsState', () => {
  it('dedupes ids, drops invalid ads and keeps updatedAt for unchanged ads', () => {
    const existing = state([ad({ updatedAt: '2026-09-01T00:00:00.000Z' })]);
    const out = normalizePopupAdsState(
      { settings: { enabled: false, globalCooldownHours: 9999 }, ads: [existing.ads[0], { ...existing.ads[0] }, { title: {} }] },
      NOW,
      existing,
    );
    expect(out.ads).toHaveLength(1);
    expect(out.ads[0].updatedAt).toBe('2026-09-01T00:00:00.000Z');
    expect(out.settings).toEqual({ enabled: false, globalCooldownHours: 720 });
  });

  it('stamps updatedAt on a changed ad', () => {
    const existing = state([ad({ updatedAt: '2026-09-01T00:00:00.000Z' })]);
    const out = normalizePopupAdsState({ ads: [{ ...existing.ads[0], name: 'Renamed' }] }, NOW, existing);
    expect(out.ads[0].updatedAt).toBe(NOW);
  });
});

describe('schedule and status', () => {
  it('is active inside the window, scheduled before and expired after', () => {
    const a = ad({ startAt: new Date(nowMs + HOUR).toISOString() });
    expect(popupAdStatus(a, nowMs)).toBe('scheduled');
    expect(isWithinSchedule(a, nowMs)).toBe(false);
    expect(popupAdStatus(ad({ endAt: new Date(nowMs - 1).toISOString() }), nowMs)).toBe('expired');
    expect(popupAdStatus(ad({ enabled: false }), nowMs)).toBe('paused');
    expect(popupAdStatus(ad(), nowMs)).toBe('active');
  });

  it('targets all pages or an explicit list', () => {
    expect(adTargetsPage(ad(), 'anything')).toBe(true);
    expect(adTargetsPage(ad({ pages: ['smart-city-tea-cafe'] }), 'Smart-City-Tea-Cafe ')).toBe(true);
    expect(adTargetsPage(ad({ pages: ['smart-city-tea-cafe'] }), 'main-sales')).toBe(false);
  });
});

describe('selectPublicPopupAds', () => {
  it('returns nothing when the master switch is off, unless previewing', () => {
    const s = state([ad()], { enabled: false });
    expect(selectPublicPopupAds(s, 'smart-city-tea-cafe', nowMs)).toEqual([]);
    expect(selectPublicPopupAds(s, 'smart-city-tea-cafe', nowMs, { previewId: 'ad-1' }).map((a) => a.id)).toEqual(['ad-1']);
  });

  it('filters by enabled, schedule and page, sorted by priority', () => {
    const s = state([
      ad({ id: 'low', priority: 1 }),
      ad({ id: 'high', priority: 50 }),
      ad({ id: 'off', enabled: false }),
      ad({ id: 'later', startAt: new Date(nowMs + DAY).toISOString() }),
      ad({ id: 'other', pages: ['other-page'] }),
    ]);
    expect(selectPublicPopupAds(s, 'smart-city-tea-cafe', nowMs).map((a) => a.id)).toEqual(['high', 'low']);
  });

  it('puts a previewed draft first even when it is disabled', () => {
    const s = state([ad({ id: 'live', priority: 99 }), ad({ id: 'draft', enabled: false })]);
    expect(selectPublicPopupAds(s, 'x', nowMs, { previewId: 'draft' }).map((a) => a.id)).toEqual(['draft', 'live']);
  });
});

describe('frequencyAllows', () => {
  it('honours each rule', () => {
    expect(frequencyAllows('always', nowMs - 1, true, nowMs)).toBe(true);
    expect(frequencyAllows('session', undefined, true, nowMs)).toBe(false);
    expect(frequencyAllows('session', nowMs - 1, false, nowMs)).toBe(true);
    expect(frequencyAllows('day', nowMs - DAY + 1, false, nowMs)).toBe(false);
    expect(frequencyAllows('day', nowMs - DAY, false, nowMs)).toBe(true);
    expect(frequencyAllows('week', nowMs - 6 * DAY, false, nowMs)).toBe(false);
    expect(frequencyAllows('month', nowMs - 31 * DAY, false, nowMs)).toBe(true);
    expect(frequencyAllows('forever', nowMs - 365 * DAY, false, nowMs)).toBe(false);
    expect(frequencyAllows('forever', undefined, false, nowMs)).toBe(true);
  });
});

describe('pickPopupToShow', () => {
  const settings: PopupAdsSettings = { enabled: true, globalCooldownHours: 12 };

  it('skips ads whose device or language rule does not match', () => {
    const ads = [ad({ id: 'desk', devices: 'desktop', priority: 9 }), ad({ id: 'kh', languages: 'kh', priority: 8 }), ad({ id: 'any', priority: 1 })];
    expect(pickPopupToShow(ads, settings, visitor({ device: 'mobile', lang: 'en' }))!.id).toBe('any');
    expect(pickPopupToShow(ads, settings, visitor({ device: 'desktop', lang: 'kh' }))!.id).toBe('desk');
  });

  it('hides from visitors who already sent the form, unless the ad allows it', () => {
    expect(pickPopupToShow([ad()], settings, visitor({ leadSent: true }))).toBeNull();
    expect(pickPopupToShow([ad({ hideAfterLead: false })], settings, visitor({ leadSent: true }))!.id).toBe('ad-1');
  });

  it('applies the frequency rule and the global cooldown', () => {
    const shownYesterday = visitor({ shownAt: (id) => (id === 'ad-1' ? nowMs - 2 * HOUR : undefined) });
    expect(pickPopupToShow([ad({ frequency: 'day' })], settings, shownYesterday)).toBeNull();
    expect(pickPopupToShow([ad({ frequency: 'always' })], settings, shownYesterday)!.id).toBe('ad-1');

    // Another popup was shown 1h ago → cooldown blocks a different ad, but not the same one again with 'always'.
    const recent = visitor({ lastAnyShownAt: nowMs - HOUR });
    expect(pickPopupToShow([ad({ id: 'second' })], settings, recent)).toBeNull();
    expect(pickPopupToShow([ad({ id: 'second' })], { ...settings, globalCooldownHours: 0 }, recent)!.id).toBe('second');
    expect(pickPopupToShow([ad({ id: 'second' })], settings, visitor({ lastAnyShownAt: nowMs - 13 * HOUR }))!.id).toBe('second');
  });

  it('falls through to the next eligible ad by priority', () => {
    const ads = [ad({ id: 'top', priority: 50, frequency: 'forever' }), ad({ id: 'next', priority: 10 })];
    const ctx = visitor({ shownAt: (id) => (id === 'top' ? nowMs - 100 * DAY : undefined) });
    expect(pickPopupToShow(ads, { ...settings, globalCooldownHours: 0 }, ctx)!.id).toBe('next');
  });
});

describe('cta and text helpers', () => {
  it('resolves the button destination', () => {
    expect(resolveCtaHref(ad(), 'smart-city-tea-cafe')).toBe('/api/round-robin?page=smart-city-tea-cafe&redirect=true');
    expect(resolveCtaHref(ad({ cta: { label: { en: 'x' }, action: 'register' } }), 'p')).toBe('#register');
    expect(resolveCtaHref(ad({ cta: { label: { en: 'x' }, action: 'url', url: 'https://khbevents.com/a' } }), 'p')).toBe('https://khbevents.com/a');
    expect(resolveCtaHref(ad({ cta: { label: { en: 'x' }, action: 'close' } }), 'p')).toBeNull();
  });

  it('falls back to English and builds preview links', () => {
    expect(pickText({ en: 'Hello', kh: 'សួស្តី' }, 'kh')).toBe('សួស្តី');
    expect(pickText({ en: 'Hello', kh: '  ' }, 'kh')).toBe('Hello');
    expect(pickText(undefined, 'en')).toBe('');
    expect(previewPath(ad())).toBe('/smart-city-tea-cafe?popup_preview=ad-1');
    expect(previewPath(ad({ pages: ['main-sales'] }))).toBe('/?popup_preview=ad-1');
  });
});
