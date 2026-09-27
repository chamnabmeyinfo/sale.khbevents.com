/**
 * Who the visitor behind a Round Robin contact is: device, browser, location,
 * where they came from, and whether the click looks like a real person.
 *
 * Pure helpers, client-safe. The request-side capture (`visitorDetailFromRequest`)
 * only reads headers and cookies; the check (`clickCheck`) only reads the log entry
 * and the matching visit record. Nothing here talks to the database.
 */
import type { ContactConfirmation, RoundRobinLog, VisitorDetail } from './types';
import type { VisitRecord } from './visits';
import { inAppBrowserName } from './popup-ads';

/** Cookies the landing pages set so the server can tie a click to its visit. */
export const SESSION_COOKIE = 'khb_sid';
export const VISITOR_COOKIE = 'khb_vid';

const clip = (v: string | null | undefined, n: number): string | undefined => {
  const s = (v || '').trim();
  return s ? s.slice(0, n) : undefined;
};

/** Location, referrer, campaign and ids from the request that carried the click or the form. */
export function visitorDetailFromRequest(
  headers: Headers,
  cookies?: { get(name: string): { value: string } | string | undefined }
): VisitorDetail {
  const out: VisitorDetail = {};
  const country = clip(headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry'), 2);
  if (country && country !== 'XX') out.country = country.toUpperCase();
  const region = clip(headers.get('x-vercel-ip-country-region'), 40);
  if (region) out.region = region;
  const cityRaw = headers.get('x-vercel-ip-city');
  if (cityRaw) {
    try {
      out.city = clip(decodeURIComponent(cityRaw), 80);
    } catch {
      out.city = clip(cityRaw, 80);
    }
  }
  const referrer = clip(headers.get('referer'), 1000);
  if (referrer) {
    out.referrer = referrer;
    Object.assign(out, utmFromUrl(referrer));
  }
  const lang = clip(headers.get('accept-language'), 60);
  if (lang) out.lang = lang.split(',')[0].trim().slice(0, 12);
  const cookie = (name: string): string | undefined => {
    const c = cookies?.get(name);
    return typeof c === 'string' ? c : c?.value;
  };
  const sid = clip(cookie(SESSION_COOKIE), 100);
  if (sid) out.sessionId = sid;
  const vid = clip(cookie(VISITOR_COOKIE), 60);
  if (vid) out.visitorId = vid;
  return out;
}

/** utm_ tags carried by an address (the landing page the visitor clicked from). */
export function utmFromUrl(url: string): Pick<VisitorDetail, 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent'> {
  const out: Pick<VisitorDetail, 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent'> = {};
  try {
    const q = new URL(url).searchParams;
    const pick = (k: string) => clip(q.get(k), 100)?.toLowerCase();
    const s = pick('utm_source');
    const m = pick('utm_medium');
    const c = pick('utm_campaign');
    const n = pick('utm_content');
    if (s) out.utmSource = s;
    if (m) out.utmMedium = m;
    if (c) out.utmCampaign = c;
    if (n) out.utmContent = n;
  } catch {
    // Not an address.
  }
  return out;
}

// ─── User agent ────────────────────────────────────────────────────────────

export type DeviceKind = 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';

export interface AgentInfo {
  device: DeviceKind;
  /** iOS, Android, Windows, macOS, Linux, ChromeOS… or ''. */
  os: string;
  /** Chrome, Safari, Firefox, Edge, Samsung Internet, Opera… or ''. */
  browser: string;
  /** App whose built-in browser opened the page (Telegram, Facebook…). */
  app?: string;
  /** Crawler, link-preview fetcher, script or headless browser. */
  bot: boolean;
}

const BOT_RE = /bot\b|bot\/|crawl|spider|slurp|headless|phantomjs|puppeteer|playwright|selenium|python-requests|python-urllib|\bcurl\/|\bwget\/|go-http-client|java\/|libwww|httpclient|axios\/|node-fetch|undici|postman|insomnia|scrapy|facebookexternalhit|facebookcatalog|telegrambot|whatsapp\/|skypeuripreview|twitterbot|linkedinbot|discordbot|slackbot|pinterest|embedly|quora link preview|bitlybot|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|yandex|baiduspider|duckduckbot|applebot|google-inspectiontool|lighthouse|pagespeed|gtmetrix|uptimerobot|pingdom|site24x7|statuscake|simulation engine/i;

/** Device, operating system, browser and app from a User-Agent string. */
export function parseUserAgent(ua: string | undefined | null): AgentInfo {
  const s = (ua || '').trim();
  if (!s) return { device: 'unknown', os: '', browser: '', bot: false };
  if (BOT_RE.test(s)) return { device: 'bot', os: '', browser: botName(s), bot: true };

  let os = '';
  if (/iPhone|iPod/.test(s)) os = 'iOS';
  else if (/iPad/.test(s) || (/Macintosh/.test(s) && /Mobile/.test(s))) os = 'iPadOS';
  else if (/Android/.test(s)) os = 'Android';
  else if (/Windows/.test(s)) os = 'Windows';
  else if (/CrOS/.test(s)) os = 'ChromeOS';
  else if (/Mac OS X|Macintosh/.test(s)) os = 'macOS';
  else if (/Linux/.test(s)) os = 'Linux';
  const osVer = os === 'iOS' || os === 'iPadOS' ? s.match(/OS (\d+)[_.]/)?.[1] : os === 'Android' ? s.match(/Android (\d+)/)?.[1] : os === 'Windows' ? (/Windows NT 10/.test(s) ? '10/11' : s.match(/Windows NT (\d+\.\d)/)?.[1]) : undefined;
  if (osVer) os = `${os} ${osVer}`;

  let browser = '';
  if (/EdgA?\/|Edge\//.test(s)) browser = 'Edge';
  else if (/SamsungBrowser\//.test(s)) browser = 'Samsung Internet';
  else if (/OPR\/|Opera/.test(s)) browser = 'Opera';
  else if (/UCBrowser\//.test(s)) browser = 'UC Browser';
  else if (/Firefox\/|FxiOS\//.test(s)) browser = 'Firefox';
  else if (/CriOS\//.test(s)) browser = 'Chrome';
  else if (/Chrome\/|Chromium\//.test(s)) browser = 'Chrome';
  else if (/Safari\//.test(s)) browser = 'Safari';
  // Every browser and in-app view on iPhone and iPad is WebKit, whatever the label says.
  else if (/AppleWebKit/.test(s) && (os.startsWith('iOS') || os.startsWith('iPadOS'))) browser = 'Safari';

  const app = inAppBrowserName(s) || undefined;

  let device: DeviceKind = 'desktop';
  if (/iPad/.test(s) || /Tablet|PlayBook|Silk/i.test(s) || (os === 'iPadOS')) device = 'tablet';
  else if (/Mobi|iPhone|iPod|Opera Mini|IEMobile|BlackBerry/i.test(s)) device = 'mobile';
  else if (/Android/.test(s)) device = 'tablet';

  return { device, os, browser, app, bot: false };
}

function botName(ua: string): string {
  const m = ua.match(/(facebookexternalhit|TelegramBot|WhatsApp|Twitterbot|LinkedInBot|Discordbot|Slackbot|Googlebot|bingbot|Applebot|Bytespider|PetalBot|AhrefsBot|SemrushBot|HeadlessChrome|python-requests|curl|Wget|Go-http-client|axios|node-fetch|Postman|Simulation Engine|Lighthouse)/i);
  return m ? m[1] : 'Bot';
}

// ─── Is it a real person? ──────────────────────────────────────────────────

export type ClickVerdict = 'real' | 'check' | 'bot';

/** Reasons shown to the admin; each has a translation `rr.vis.reason.<key>`. */
export type ClickReason =
  | 'botAgent'
  | 'noAgent'
  | 'noReferrer'
  | 'outsideReferrer'
  | 'manyFromIp'
  | 'tooFast'
  | 'readPage'
  | 'returning'
  | 'sameSession'
  | 'chatConfirmed'
  | 'chatProbable'
  | 'demo';

export interface ClickCheck {
  verdict: ClickVerdict;
  reasons: ClickReason[];
}

export interface ClickContext {
  /** Contacts from the same IP address in the period being looked at (including this one). */
  sameIpCount?: number;
  /** The landing-page visit this contact belongs to, when the session id matched. */
  visit?: Pick<VisitRecord, 'sec' | 'sc' | 'ret' | 'cta' | 'tg'> & Partial<Pick<VisitRecord, 't0'>> | null;
  /** When the contact happened (epoch ms), to measure the time from arriving on the page to the click. */
  clickMs?: number;
  /** Our own host names, so a referrer from the landing page is recognised. */
  ownHosts?: string[];
  /** The chat that followed, seen in the salesperson's Telegram account. */
  contact?: Pick<ContactConfirmation, 'match'> | null;
}

export const DEFAULT_OWN_HOSTS = ['sale.khbevents.com', 'localhost', '127.0.0.1'];

/** Thresholds that make a contact worth a second look. */
export const MANY_FROM_IP = 5;
export const TOO_FAST_SECONDS = 3;
export const READ_PAGE_SECONDS = 10;

/**
 * Real person, worth a look, or a bot? A rule of thumb from the signals we have,
 * not a proof: a person on a VPN or a strict browser can look odd, and a careful
 * script can look normal.
 */
export function clickCheck(entry: Pick<RoundRobinLog, 'userAgent' | 'visitor' | 'assignmentReason' | 'demo' | 'routeType'>, ctx: ClickContext = {}): ClickCheck {
  const reasons: ClickReason[] = [];
  const agent = parseUserAgent(entry.userAgent);
  if (entry.demo) reasons.push('demo');
  if (agent.bot) reasons.push('botAgent');
  else if (agent.device === 'unknown') reasons.push('noAgent');

  const ownHosts = (ctx.ownHosts || DEFAULT_OWN_HOSTS).map((h) => h.toLowerCase());
  const referrer = entry.visitor?.referrer;
  if (entry.routeType === 'DIRECT_CONTACT_CLICK') {
    if (!referrer) reasons.push('noReferrer');
    else {
      try {
        const host = new URL(referrer).hostname.toLowerCase();
        if (!ownHosts.some((h) => host === h || host.endsWith(`.${h}`) || host.endsWith('.vercel.app'))) reasons.push('outsideReferrer');
      } catch {
        reasons.push('outsideReferrer');
      }
    }
  }
  if ((ctx.sameIpCount || 0) >= MANY_FROM_IP) reasons.push('manyFromIp');

  const v = ctx.visit;
  if (v) {
    reasons.push('sameSession');
    // The visit's reading time arrives when the visitor leaves the page, so the time from
    // arriving to clicking (known at once) counts too.
    const onPage = secondsOnPageBeforeClick(v, ctx.clickMs);
    if (onPage < TOO_FAST_SECONDS && (v.sc ?? 0) < 10) reasons.push('tooFast');
    else if (onPage >= READ_PAGE_SECONDS || (v.sc ?? 0) >= 25) reasons.push('readPage');
  }
  if (entry.assignmentReason === 'returning_visitor' || entry.assignmentReason === 'returning_customer' || v?.ret) reasons.push('returning');

  if (ctx.contact) reasons.push(ctx.contact.match === 'ref' ? 'chatConfirmed' : 'chatProbable');

  let verdict: ClickVerdict = 'real';
  if (reasons.includes('botAgent')) verdict = 'bot';
  else if (reasons.some((r) => r === 'noAgent' || r === 'noReferrer' || r === 'outsideReferrer' || r === 'manyFromIp' || r === 'tooFast')) verdict = 'check';
  // A visit we can see, with real reading, outweighs a missing referrer.
  if (verdict === 'check' && reasons.includes('readPage') && !reasons.includes('manyFromIp') && !reasons.includes('noAgent')) verdict = 'real';
  // A real chat in the salesperson's Telegram, carrying the code from the click, is the strongest proof there is.
  if (reasons.includes('chatConfirmed') && verdict !== 'bot') verdict = 'real';
  return { verdict, reasons };
}

/** Seconds the visitor had been on the page when they clicked: the tracked active time, or the time since arriving. */
export function secondsOnPageBeforeClick(visit: Pick<VisitRecord, 'sec'> & Partial<Pick<VisitRecord, 't0'>>, clickMs?: number): number {
  const sinceArrival = visit.t0 && clickMs && clickMs > visit.t0 ? (clickMs - visit.t0) / 1000 : 0;
  return Math.max(visit.sec ?? 0, sinceArrival);
}

// ─── Labels ────────────────────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  KH: 'Cambodia', VN: 'Vietnam', TH: 'Thailand', LA: 'Laos', MY: 'Malaysia', SG: 'Singapore', ID: 'Indonesia', PH: 'Philippines', MM: 'Myanmar',
  CN: 'China', HK: 'Hong Kong', TW: 'Taiwan', KR: 'South Korea', JP: 'Japan', IN: 'India', AU: 'Australia', NZ: 'New Zealand',
  US: 'United States', CA: 'Canada', GB: 'United Kingdom', FR: 'France', DE: 'Germany', NL: 'Netherlands', IE: 'Ireland', ES: 'Spain', IT: 'Italy',
  SE: 'Sweden', FI: 'Finland', NO: 'Norway', DK: 'Denmark', PL: 'Poland', RU: 'Russia', UA: 'Ukraine', TR: 'Türkiye', AE: 'United Arab Emirates',
  SA: 'Saudi Arabia', QA: 'Qatar', BR: 'Brazil', MX: 'Mexico', ZA: 'South Africa', NG: 'Nigeria', EG: 'Egypt', PK: 'Pakistan', BD: 'Bangladesh', LK: 'Sri Lanka', NP: 'Nepal',
};

/** "Cambodia" for KH; the code itself when unknown. */
export function countryName(code: string | undefined): string {
  if (!code) return '';
  return COUNTRY_NAMES[code.toUpperCase()] || code.toUpperCase();
}

/** 🇰🇭 for KH. */
export function countryFlag(code: string | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Where the contact came from, for one line: "facebook · campaign", "Telegram app", "google.com", "direct". */
export function sourceLabel(entry: Pick<RoundRobinLog, 'userAgent' | 'visitor'>, visit?: Pick<VisitRecord, 'src' | 'cmp' | 'ref'> | null, ownHosts: string[] = DEFAULT_OWN_HOSTS): string {
  const v = entry.visitor;
  const fromRef = v?.referrer ? utmFromUrl(v.referrer) : {};
  const parts: string[] = [];
  const src = v?.utmSource || fromRef.utmSource || visit?.src;
  if (src && src !== 'direct') parts.push(src);
  const cmp = v?.utmCampaign || fromRef.utmCampaign || visit?.cmp;
  if (cmp) parts.push(cmp);
  if (!parts.length) {
    const app = entry.userAgent ? inAppBrowserName(entry.userAgent) : null;
    if (app) return `${app} app`;
    if (visit?.ref) return visit.ref;
    if (v?.referrer) {
      try {
        const host = new URL(v.referrer).hostname.toLowerCase();
        if (!ownHosts.some((h) => host === h || host.endsWith(`.${h}`))) return host;
      } catch {}
    }
    return visit?.src || 'direct';
  }
  return parts.join(' · ');
}
