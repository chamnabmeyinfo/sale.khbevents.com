import { describe, expect, it } from 'vitest';
import {
  applyPopupEvent,
  dayRange,
  KEEP_DAYS,
  lastDays,
  phnomPenhDay,
  phnomPenhHour,
  popupDailyCsv,
  popupInsights,
  summarizePopups,
  type PopupEventDetail,
} from '../popup-analytics';
import type { PopupAdStats, PopupAdStatsMap } from '../types';

// Thursday 1 Oct 2026, 17:00 in Phnom Penh.
const NOW = Date.parse('2026-10-01T10:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const fresh = (): PopupAdStats => ({ views: 0, clicks: 0, closes: 0 });
const ev = (o: Partial<PopupEventDetail>): PopupEventDetail => ({ kind: 'view', nowMs: NOW, page: 'korea', device: 'mobile', lang: 'kh', source: 'telegram', app: 'Telegram', ...o });

describe('recording popup events per day', () => {
  it('uses the Phnom Penh date and hour', () => {
    expect(phnomPenhDay(Date.parse('2026-09-30T18:30:00.000Z'))).toBe('2026-10-01');
    expect(phnomPenhHour(Date.parse('2026-09-30T18:30:00.000Z'))).toBe(1);
  });

  it('counts views, clicks, closes and leads with their breakdowns', () => {
    const s = fresh();
    applyPopupEvent(s, ev({ secondsOnPage: 12 }));
    applyPopupEvent(s, ev({ device: 'desktop', source: undefined, app: undefined, lang: 'en', page: 'vietnam' }));
    applyPopupEvent(s, ev({ kind: 'click', secondsOpen: 4 }));
    applyPopupEvent(s, ev({ kind: 'close', device: 'desktop', secondsOpen: 2 }));
    applyPopupEvent(s, ev({ kind: 'lead', clicked: true }));
    const d = s.daily!['2026-10-01'];
    expect(d.t).toEqual([2, 1, 1, 1]);
    expect(d.d).toEqual({ mobile: [1, 1, 0, 1], desktop: [1, 0, 1, 0] });
    expect(d.s).toEqual({ telegram: [1, 1, 1, 1], direct: [1, 0, 0, 0] });
    expect(d.a).toEqual({ Telegram: [1, 1, 1, 1], Browser: [1, 0, 0, 0] });
    expect(d.h!['17']).toEqual([2, 1, 1, 1]);
    expect(d.ck).toEqual([4, 1]);
    expect(d.cl).toEqual([2, 1]);
    expect(d.sp).toEqual([12, 1]);
    expect(d.lc).toBe(1);
  });

  it('keeps only the last 120 days', () => {
    const s = fresh();
    applyPopupEvent(s, ev({ nowMs: NOW - (KEEP_DAYS + 5) * DAY }));
    applyPopupEvent(s, ev({ nowMs: NOW - 3 * DAY }));
    applyPopupEvent(s, ev({}));
    expect(Object.keys(s.daily!).sort()).toEqual(['2026-09-28', '2026-10-01']);
  });

  it('folds a flood of different values into "other"', () => {
    const s = fresh();
    for (let i = 0; i < 60; i += 1) applyPopupEvent(s, ev({ page: `page-${i}` }));
    const pages = s.daily!['2026-10-01'].p!;
    expect(Object.keys(pages)).toHaveLength(41);
    expect(pages.other[0]).toBe(20);
  });
});

describe('summarising for the dashboard', () => {
  const stats: PopupAdStatsMap = { a: fresh(), b: fresh() };
  for (let i = 0; i < 30; i += 1) applyPopupEvent(stats.a, ev({ nowMs: NOW - (i % 3) * DAY, device: i % 2 ? 'mobile' : 'desktop' }));
  for (let i = 0; i < 9; i += 1) applyPopupEvent(stats.a, ev({ kind: 'click', secondsOpen: 3, device: 'mobile' }));
  for (let i = 0; i < 25; i += 1) applyPopupEvent(stats.b, ev({ source: 'facebook', app: 'Facebook' }));
  applyPopupEvent(stats.b, ev({ kind: 'click', source: 'facebook', app: 'Facebook', secondsOpen: 8 }));
  applyPopupEvent(stats.a, ev({ kind: 'lead', clicked: true }));
  // Outside the range: must not count.
  applyPopupEvent(stats.a, ev({ nowMs: NOW - 20 * DAY }));
  const ads = [{ id: 'a', name: 'Chat', enabled: true }, { id: 'b', name: 'Banner', enabled: false }];
  const range = lastDays(7, NOW);

  it('adds up the range and fills every day', () => {
    const s = summarizePopups(stats, ads, range);
    expect(range).toEqual({ from: '2026-09-25', to: '2026-10-01' });
    expect(s.days).toHaveLength(7);
    expect(s.views).toBe(55);
    expect(s.clicks).toBe(10);
    expect(s.ctr).toBe(18.2);
    expect(s.leads).toBe(1);
    expect(s.leadsAfterClick).toBe(1);
    expect(s.avgSecondsToClick).toBe(3.5);
    expect(s.days.find((d) => d.day === '2026-09-29')!.views).toBe(10);
    expect(s.hours).toHaveLength(24);
    expect(s.detailSince).toBe('2026-09-11');
  });

  it('compares popups and filters to one popup', () => {
    const s = summarizePopups(stats, ads, range);
    expect(s.popups.map((p) => [p.name, p.views, p.clicks, p.ctr])).toEqual([['Chat', 30, 9, 30], ['Banner', 25, 1, 4]]);
    const one = summarizePopups(stats, ads, { ...range, adId: 'b' });
    expect(one.views).toBe(25);
    expect(one.sources.map((r) => r.key)).toEqual(['facebook']);
  });

  it('writes findings only when there is enough data', () => {
    const s = summarizePopups(stats, ads, range);
    const found = popupInsights(s);
    expect(found).toContainEqual({ kind: 'bestPopup', name: 'Chat', ctr: 30, views: 30 });
    expect(found.find((f) => f.kind === 'best' && f.dimension === 'source')).toMatchObject({ key: 'telegram' });
    expect(found).toContainEqual({ kind: 'leads', leads: 1, afterClick: 1 });
    const empty = summarizePopups({}, ads, range);
    expect(popupInsights(empty)).toEqual([{ kind: 'notEnough', views: 0 }]);
  });

  it('exports a CSV safe for spreadsheets', () => {
    const csv = popupDailyCsv(stats, [{ id: 'a', name: '=Chat, "KH"' }], '2026-10-01', '2026-10-01');
    expect(csv.split('\n')[0]).toBe('date,popup,views,clicks,click_rate_percent,closes,leads');
    expect(csv.split('\n')[1]).toBe('2026-10-01,"\'=Chat, ""KH""",10,9,90,0,1');
  });

  it('lists days across a month end', () => {
    expect(dayRange('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  });
});
