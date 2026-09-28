import { describe, expect, it } from 'vitest';
import { clickCheck, countryFlag, countryName, isAutomatedAgent, parseUserAgent, sourceLabel, utmFromUrl, visitorDetailFromRequest } from '../visitor-detail';
import type { RoundRobinLog } from '../types';

const IPHONE_TG = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Telegram-iOS/10.12';
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';
const WIN_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const IPAD_SAFARI = 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const FB_PREVIEW = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const CURL = 'curl/8.4.0';

const click = (o: Partial<RoundRobinLog> = {}): Pick<RoundRobinLog, 'userAgent' | 'visitor' | 'assignmentReason' | 'demo' | 'routeType'> => ({
  routeType: 'DIRECT_CONTACT_CLICK',
  userAgent: ANDROID_CHROME,
  visitor: { country: 'KH', city: 'Phnom Penh', referrer: 'https://sale.khbevents.com/smart-city-tea-cafe?utm_source=facebook' },
  ...o,
});

describe('parseUserAgent', () => {
  it('reads phones, tablets and computers', () => {
    expect(parseUserAgent(IPHONE_TG)).toMatchObject({ device: 'mobile', os: 'iOS 17', browser: 'Safari', app: 'Telegram', bot: false });
    expect(parseUserAgent(ANDROID_CHROME)).toMatchObject({ device: 'mobile', os: 'Android 14', browser: 'Chrome', bot: false });
    expect(parseUserAgent(ANDROID_CHROME).app).toBeUndefined();
    expect(parseUserAgent(WIN_CHROME)).toMatchObject({ device: 'desktop', os: 'Windows 10/11', browser: 'Chrome' });
    expect(parseUserAgent(IPAD_SAFARI)).toMatchObject({ device: 'tablet', browser: 'Safari' });
  });

  it('recognises bots, link previews and scripts', () => {
    expect(parseUserAgent(FB_PREVIEW)).toMatchObject({ device: 'bot', bot: true, browser: 'facebookexternalhit' });
    expect(parseUserAgent(CURL)).toMatchObject({ device: 'bot', bot: true, browser: 'curl' });
    expect(parseUserAgent('Simulation Engine/1.0').bot).toBe(true);
    expect(parseUserAgent('')).toMatchObject({ device: 'unknown', bot: false });
  });

  it('tells crawlers and scripts from people for routing, without catching phone names ending in "bot"', () => {
    for (const ua of [
      FB_PREVIEW, CURL, 'TelegramBot (like TwitterBot)', 'WhatsApp/2.23.20.0 A', 'Twitterbot/1.0',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)',
      'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/129.0.0.0 Safari/537.36',
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    ]) expect(isAutomatedAgent(ua)).toBe(true);
    for (const ua of [
      IPHONE_TG, ANDROID_CHROME, WIN_CHROME, IPAD_SAFARI, '', undefined,
      'Mozilla/5.0 (Linux; Android 11; CUBOT X50) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ]) expect(isAutomatedAgent(ua)).toBe(false);
  });
});

describe('visitorDetailFromRequest', () => {
  it('takes the location from the edge headers, the campaign from the referrer and the ids from cookies', () => {
    const headers = new Headers({
      'x-vercel-ip-country': 'KH',
      'x-vercel-ip-country-region': 'Phnom Penh',
      'x-vercel-ip-city': 'Phnom%20Penh',
      referer: 'https://sale.khbevents.com/smart-city-tea-cafe?utm_source=Facebook&utm_campaign=VN-Oct&x=1',
      'accept-language': 'km-KH,km;q=0.9,en;q=0.8',
    });
    const cookies = { get: (name: string) => (name === 'khb_sid' ? { value: 'sid_1' } : name === 'khb_vid' ? { value: 'v_1' } : undefined) };
    expect(visitorDetailFromRequest(headers, cookies)).toEqual({
      country: 'KH', region: 'Phnom Penh', city: 'Phnom Penh',
      referrer: 'https://sale.khbevents.com/smart-city-tea-cafe?utm_source=Facebook&utm_campaign=VN-Oct&x=1',
      utmSource: 'facebook', utmCampaign: 'vn-oct', lang: 'km-KH', sessionId: 'sid_1', visitorId: 'v_1',
    });
  });

  it('is empty when nothing is known', () => {
    expect(visitorDetailFromRequest(new Headers())).toEqual({});
    expect(utmFromUrl('not a url')).toEqual({});
  });
});

describe('clickCheck', () => {
  it('a normal click from our page on a phone looks real', () => {
    expect(clickCheck(click())).toEqual({ verdict: 'real', reasons: [] });
  });

  it('flags bots, missing browsers and clicks that did not come from our pages', () => {
    expect(clickCheck(click({ userAgent: FB_PREVIEW })).verdict).toBe('bot');
    expect(clickCheck(click({ userAgent: '' }))).toMatchObject({ verdict: 'check', reasons: ['noAgent'] });
    expect(clickCheck(click({ visitor: { country: 'KH' } }))).toMatchObject({ verdict: 'check', reasons: ['noReferrer'] });
    expect(clickCheck(click({ visitor: { referrer: 'https://evil.example/x' } }))).toMatchObject({ verdict: 'check', reasons: ['outsideReferrer'] });
  });

  it('accepts preview deployments and the pages served from our own sub-domains', () => {
    expect(clickCheck(click({ visitor: { referrer: 'https://salekhbevents-abc.vercel.app/korea' } })).verdict).toBe('real');
  });

  it('many contacts from one address are worth a look; a read page outweighs a missing referrer', () => {
    expect(clickCheck(click(), { sameIpCount: 5 })).toMatchObject({ verdict: 'check', reasons: ['manyFromIp'] });
    expect(clickCheck(click({ visitor: {} }), { visit: { sec: 45, sc: 60 } })).toMatchObject({ verdict: 'real', reasons: ['noReferrer', 'sameSession', 'readPage'] });
    expect(clickCheck(click(), { visit: { sec: 1, sc: 0 } })).toMatchObject({ verdict: 'check', reasons: ['sameSession', 'tooFast'] });
  });

  it('counts the time from arriving to clicking when the visit has not sent its reading time yet', () => {
    const t0 = Date.parse('2026-09-27T09:00:00Z');
    expect(clickCheck(click(), { visit: { sec: 0, sc: 0, t0 }, clickMs: t0 + 45_000 })).toMatchObject({ verdict: 'real', reasons: ['sameSession', 'readPage'] });
    expect(clickCheck(click(), { visit: { sec: 0, sc: 0, t0 }, clickMs: t0 + 1_000 })).toMatchObject({ verdict: 'check', reasons: ['sameSession', 'tooFast'] });
  });

  it('notes returning visitors and Simulation Studio tests', () => {
    expect(clickCheck(click({ assignmentReason: 'returning_visitor' })).reasons).toContain('returning');
    expect(clickCheck(click({ demo: true })).reasons).toContain('demo');
  });

  it('does not expect a referrer on a form lead', () => {
    expect(clickCheck({ routeType: 'FORM_SUBMISSION', userAgent: IPHONE_TG, visitor: { country: 'KH' } })).toEqual({ verdict: 'real', reasons: [] });
  });
});

describe('labels', () => {
  it('names countries and draws flags', () => {
    expect(countryName('KH')).toBe('Cambodia');
    expect(countryName('ZZ')).toBe('ZZ');
    expect(countryFlag('KH')).toBe('🇰🇭');
    expect(countryFlag('')).toBe('');
  });

  it('says where a contact came from', () => {
    expect(sourceLabel(click())).toBe('facebook');
    expect(sourceLabel(click({ visitor: { utmSource: 'tiktok', utmCampaign: 'oct' } }))).toBe('tiktok · oct');
    expect(sourceLabel(click({ userAgent: IPHONE_TG, visitor: {} }))).toBe('Telegram app');
    expect(sourceLabel(click({ visitor: { referrer: 'https://www.google.com/' } }))).toBe('www.google.com');
    expect(sourceLabel(click({ visitor: { referrer: 'https://sale.khbevents.com/korea' } }))).toBe('direct');
    expect(sourceLabel(click({ visitor: {} }), { src: 'telegram', cmp: 'vn' })).toBe('telegram · vn');
  });
});
