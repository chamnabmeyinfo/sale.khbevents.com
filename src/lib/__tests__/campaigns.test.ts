import { describe, expect, it } from 'vitest';
import { mergeVisit, upsertVisit, visitChannel, visitFromEvent, type VisitRecord } from '../visits';
import { campaignLink, normalizeCampaign, spendBetween, uniqueSlug, type Campaign } from '../campaigns';
import { buildCampaignReport, leadCampaign, NO_CAMPAIGN, type PageInfo } from '../campaign-analytics';
import { metaPayload, nameParts, normalizePhone, sha256, tiktokPayload } from '../conversions';
import { analystBrief, normalizeAiReport } from '../ai-analyst';
import type { Lead } from '../types';

const NOW = Date.parse('2026-09-25T05:00:00Z'); // 12:00 in Phnom Penh
const HOUR = 3_600_000;

const visit = (o: Partial<VisitRecord>): VisitRecord => ({ s: `s${Math.random()}`, p: 'trip', t0: NOW - HOUR, t1: NOW - HOUR, src: 'facebook', ...o });
const lead = (o: Partial<Lead>): Lead => ({
  id: `l${Math.random()}`, landingPageSlug: 'trip', landingPageTitle: 'Trip', fullName: 'Sokha Chan', email: '', phone: '012 345 678', eventType: '',
  status: 'NEW', notes: [], createdAt: new Date(NOW - HOUR).toISOString(), updatedAt: '', ...o,
});

describe('visits', () => {
  it('builds a visit from a page view and ignores other events and anonymous beacons', () => {
    const v = visitFromEvent({ slug: 'trip', eventType: 'page_view', sessionId: 'sid_1', visitorId: 'v_1', utmSource: 'fb', utmCampaign: 'Oct-Video', referrer: 'https://m.facebook.com/', deviceType: 'mobile', userAgent: 'Mozilla/5.0 FBAN/FBIOS', lang: 'kh', ownHost: 'sale.khbevents.com', nowMs: NOW });
    expect(v).toMatchObject({ s: 'sid_1', v: 'v_1', src: 'facebook', cmp: 'oct-video', ref: 'm.facebook.com', app: 'Facebook', dev: 'mobile', lang: 'kh' });
    expect(visitFromEvent({ slug: 'trip', eventType: 'cta_click', sessionId: 'sid_1', nowMs: NOW })).toBeNull();
    expect(visitFromEvent({ slug: 'trip', eventType: 'page_view', sessionId: 'anonymous', nowMs: NOW })).toBeNull();
  });

  it('reads the visit summary and keeps the deepest engagement when merged', () => {
    const first = visitFromEvent({ slug: 'trip', eventType: 'page_view', sessionId: 's', utmCampaign: 'a', nowMs: NOW })!;
    const summary = visitFromEvent({ slug: 'trip', eventType: 'session_summary', sessionId: 's', nowMs: NOW + 60_000, eventData: { activeSeconds: 42, maxScroll: 80, cta: 1, formStarted: true, seen: ['b1', 'b2', 'bad id!'], maxSection: 1, sectionCount: 5, firstCampaign: 'old' } })!;
    const later = visitFromEvent({ slug: 'trip', eventType: 'session_summary', sessionId: 's', nowMs: NOW + 90_000, eventData: { activeSeconds: 30, maxScroll: 50 } })!;
    const merged = mergeVisit(mergeVisit(first, summary), later);
    expect(merged).toMatchObject({ cmp: 'a', sec: 42, sc: 80, cta: 1, fs: true, sx: 1, sn: 5, fcmp: 'old', t1: NOW + 90_000 });
    expect(merged.seen).toEqual(['b1', 'b2']);
    expect(upsertVisit([first], summary)).toHaveLength(1);
  });

  it('names the channel from utm_source, then the app, then the site', () => {
    expect(visitChannel({ utmSource: 'IG' })).toBe('instagram');
    expect(visitChannel({ userAgent: 'Telegram-Android/10' })).toBe('telegram');
    expect(visitChannel({ referrer: 'https://example.org/x', ownHost: 'sale.khbevents.com' })).toBe('referral');
    expect(visitChannel({})).toBe('direct');
  });
});

describe('campaigns', () => {
  it('cleans a campaign and builds tracked links', () => {
    const c = normalizeCampaign({ name: 'Vietnam – Video Oct', pageSlug: 'smart-city-tea-cafe', channel: 'tiktok', ads: [{ name: 'Video A' }, { name: '' }], spend: [{ date: '2026-09-20', amount: '12.5' }, { date: 'bad', amount: 3 }] }, '2026-09-25T00:00:00Z')!;
    expect(c.slug).toBe('vietnam-video-oct');
    expect(c.source).toBe('tiktok');
    expect(c.ads).toHaveLength(1);
    expect(c.spend).toEqual([{ date: '2026-09-20', amount: 12.5 }]);
    expect(campaignLink('https://sale.khbevents.com', c, c.ads[0])).toBe('https://sale.khbevents.com/smart-city-tea-cafe?utm_source=tiktok&utm_medium=paid_social&utm_campaign=vietnam-video-oct&utm_content=video-a');
    expect(normalizeCampaign({ name: '', pageSlug: 'x' }, '')).toBeNull();
    expect(spendBetween(c, '2026-09-21')).toBe(0);
    expect(uniqueSlug('a', ['a', 'a-2'])).toBe('a-3');
  });
});

describe('campaign report', () => {
  const pages: PageInfo[] = [{ slug: 'trip', title: 'Trip', sections: [{ id: 'h', type: 'hero' }, { id: 'b', type: 'benefits' }, { id: 'f', type: 'form' }], deadline: '2026-09-20T00:00:00Z' }];
  const campaign = normalizeCampaign({ name: 'Oct video', slug: 'oct', pageSlug: 'trip', channel: 'facebook', spend: [{ date: '2026-09-24', amount: 40 }] }, '')!;

  it('credits visits and leads to campaigns and computes cost per lead', () => {
    const visits = [
      ...Array.from({ length: 30 }, (_, i) => visit({ s: `a${i}`, cmp: 'oct', sec: i < 15 ? 30 : 3, sc: i < 10 ? 80 : 10, sn: 3, sx: i < 10 ? 2 : 0 })),
      ...Array.from({ length: 10 }, (_, i) => visit({ s: `n${i}`, src: 'direct' })),
    ];
    const leads = [lead({ utmCampaign: 'oct', status: 'WON' }), lead({ utmCampaign: 'OCT' }), lead({ customFields: { visitSession: 'n1' } })];
    const r = buildCampaignReport({ visits, leads, campaigns: [campaign], pages, days: 7, nowMs: NOW });
    const oct = r.campaigns.find((c) => c.key === 'oct')!;
    expect(oct).toMatchObject({ visits: 30, leads: 2, won: 1, spend: 40, cpl: 20, cpw: 40, engaged: 15, engagedRate: 50 });
    expect(r.campaigns.find((c) => c.key === NO_CAMPAIGN)?.leads).toBe(1);
    expect(r.total.visits).toBe(40);
    expect(r.sections.trip.map((s) => s.pct)).toEqual([100, 33.3, 33.3]);
    expect(r.findings.some((f) => f.area === 'offer')).toBe(true); // deadline passed, campaign running
    expect(r.findings.some((f) => f.area === 'page' && /leave between/.test(f.en))).toBe(true);
  });

  it('flags forms started but not sent, and campaigns with visits and no lead', () => {
    const visits = Array.from({ length: 40 }, (_, i) => visit({ s: `x${i}`, cmp: 'oct', sec: 2, fs: i < 8 }));
    const r = buildCampaignReport({ visits, leads: [], campaigns: [campaign], pages: [], days: 7, nowMs: NOW });
    expect(r.findings.find((f) => f.scope === 'form')?.severity).toBe('high');
    expect(r.findings.find((f) => f.scope === 'oct' && f.severity === 'high')?.area).toBe('ads');
  });

  it('a lead without its own tag takes the first campaign, then its visit', () => {
    expect(leadCampaign(lead({ customFields: { firstCampaign: 'first' } }))).toBe('first');
    expect(leadCampaign(lead({ customFields: { visitSession: 's1' } }), new Map([['s1', visit({ s: 's1', cmp: 'fromvisit' })]]))).toBe('fromvisit');
  });

  it('sends no personal data to the AI', () => {
    const r = buildCampaignReport({ visits: [visit({ cmp: 'oct' })], leads: [lead({ utmCampaign: 'oct', email: 'x@y.com' })], campaigns: [campaign], pages, days: 7, nowMs: NOW });
    const brief = JSON.stringify(analystBrief(r, [campaign], pages));
    expect(brief).not.toMatch(/Sokha|012 345 678|x@y\.com/);
    expect(brief).toMatch(/"leads":1/);
  });
});

describe('conversions', () => {
  it('normalises Cambodian phone numbers and hashes them', () => {
    expect(normalizePhone('012 345 678')).toBe('85512345678');
    expect(normalizePhone('+855 12 345 678')).toBe('85512345678');
    expect(normalizePhone('0066 81 234 5678')).toBe('66812345678');
    expect(normalizePhone('12')).toBeUndefined();
    expect(nameParts('Sok  Dara Chan')).toEqual({ fn: 'sok', ln: 'chan' });
  });

  it('builds Meta and TikTok payloads with the shared event id and hashed data only', () => {
    const l = { eventId: 'lead_1', eventTimeMs: NOW, pageSlug: 'trip', phone: '012345678', email: 'A@B.com', fbclid: 'abc', visitorId: 'v1', value: 550 };
    const meta = metaPayload(l, 'TEST1');
    const ev = meta.data[0];
    expect(ev.event_id).toBe('lead_1');
    expect(ev.user_data.ph).toEqual([sha256('85512345678')]);
    expect(ev.user_data.em).toEqual([sha256('a@b.com')]);
    expect(ev.user_data.fbc).toBe(`fb.1.${NOW}.abc`);
    expect(meta.test_event_code).toBe('TEST1');
    expect(JSON.stringify(meta)).not.toContain('012345678');
    const tt = tiktokPayload(l, 'PIX');
    expect(tt.data[0].user.phone).toBe(sha256('+85512345678'));
    expect(tt.data[0].event_id).toBe('lead_1');
  });
});

describe('AI report', () => {
  it('keeps only known fields and valid values from the model output', () => {
    const r = normalizeAiReport({ headline: 'Good', dataQuality: { level: 'weird' }, actions: [{ priority: 2, title: 'B', how: ['x'], area: 'page', impact: 'high', effort: 'low' }, { priority: 1, title: 'A', area: 'nope' }], campaigns: [{ key: 'oct', verdict: 'explode' }], extra: 1 });
    expect(r.dataQuality.level).toBe('thin');
    expect(r.actions.map((a) => a.title)).toEqual(['A', 'B']);
    expect(r.actions[0].area).toBe('page');
    expect(r.campaigns[0].verdict).toBe('too_early');
    expect('extra' in r).toBe(false);
  });
});

export type { Campaign };
