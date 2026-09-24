import type {
  BilingualText,
  PopupAd,
  PopupAdCtaAction,
  PopupAdFrequency,
  PopupAdHours,
  PopupAdSecondary,
  PopupAdSmartReason,
  PopupAdSmartSensitivity,
  PopupAdStatus,
  PopupAdTemplate,
  PopupAdTheme,
  PopupAdTrigger,
  PopupAdTriggerType,
  PopupAdsSettings,
  PopupAdsState,
} from './types';
import { safeRedirectUrl } from './safe-url';

/**
 * Pure rules for popup ads: validation, schedule, targeting, which popup a
 * visitor sees and how often. No Next.js or Node imports: this module is shared
 * by the public popup (client), the admin editor (client) and storage (server).
 * Time always comes in as a parameter so the rules are testable.
 */

export const HOME_SLUG = 'main-sales';

/** Server clock for pages that pass "now" to client components (keeps clock calls out of render). */
export const serverNowMs = (): number => Date.now();
export const DEFAULT_ACCENT = '#E5A93C';
export const MAX_POPUP_ADS = 50;

export const POPUP_TEMPLATES: PopupAdTemplate[] = ['chat', 'card', 'bottom-sheet', 'banner', 'image'];
export const POPUP_THEMES: PopupAdTheme[] = ['dark', 'light', 'brand'];
export const POPUP_TRIGGERS: PopupAdTriggerType[] = ['smart', 'immediate', 'delay', 'scroll', 'exit_intent', 'idle'];
export const SMART_SENSITIVITIES = ['gentle', 'balanced', 'eager'] as const;
export const POPUP_POSITIONS = ['center', 'bottom-right', 'bottom-left'] as const;
export const POPUP_SIZES = ['sm', 'md', 'lg'] as const;
export const POPUP_ANIMATIONS = ['zoom', 'fade', 'slide', 'bounce'] as const;
export const POPUP_RADII = ['sharp', 'soft', 'round'] as const;
export const POPUP_OVERLAYS = ['none', 'light', 'dark'] as const;
/** Cambodia has no daylight saving: always UTC+7. */
const PHNOM_PENH_OFFSET_MS = 7 * 60 * 60 * 1000;
export const POPUP_FREQUENCIES: PopupAdFrequency[] = ['always', 'session', 'day', 'week', 'month', 'forever'];
export const POPUP_CTA_ACTIONS: PopupAdCtaAction[] = ['telegram', 'register', 'url', 'close'];

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long a frequency rule blocks a repeat show. 'session' and 'always' are handled separately. */
export const FREQUENCY_WINDOW_MS: Record<PopupAdFrequency, number> = {
  always: 0,
  session: 0,
  day: DAY_MS,
  week: 7 * DAY_MS,
  month: 30 * DAY_MS,
  forever: Number.POSITIVE_INFINITY,
};

export const defaultPopupAdsSettings: PopupAdsSettings = { enabled: true, globalCooldownHours: 12 };
export const defaultPopupAdsState: PopupAdsState = { settings: { ...defaultPopupAdsSettings }, ads: [] };

/** Browser storage keys used by the public popup for frequency capping. */
export const popupStorageKeys = {
  shown: (adId: string) => `khb_popup_${adId}`,
  sessionShown: (adId: string) => `khb_popup_s_${adId}`,
  lastAny: 'khb_popup_last',
  leadSent: 'khb_lead_sent',
  /** First time this browser saw the site (ms), to tell new from returning visitors. */
  firstSeen: 'khb_first_seen',
  /** utm_source of the visit, kept for the browser session. */
  utmSource: 'khb_utm_source',
  /** Number of visits (browser sessions) to the site, for smart timing. */
  visits: 'khb_visits',
  /** Set once per browser session so a visit is counted once. */
  visitCounted: 'khb_visit_counted',
  /** Pages opened in this browser session, for smart timing. */
  pagesThisVisit: 'khb_pages_visit',
};

/** A visitor counts as returning once their first visit is older than this. */
export const RETURNING_AFTER_MS = 30 * 60 * 1000;

// ─── Text helpers ──────────────────────────────────────────────────────────

/** The text for the current language, falling back to English. */
export function pickText(text: BilingualText | undefined, lang: 'en' | 'kh'): string {
  if (!text) return '';
  return (lang === 'kh' && text.kh?.trim()) || text.en || '';
}

const clampStr = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

function normalizeBilingual(value: unknown, max: number): BilingualText | undefined {
  if (typeof value === 'string') {
    const en = clampStr(value, max);
    return en ? { en } : undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const v = value as Record<string, unknown>;
  const en = clampStr(v.en, max);
  const kh = clampStr(v.kh, max);
  if (!en && !kh) return undefined;
  return { en: en || kh, kh: kh || undefined };
}

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

const clampNum = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

const isoOrUndefined = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** A fresh popup with sensible defaults; the admin fills in the copy. */
export function newPopupAd(nowIso: string, overrides: Partial<PopupAd> = {}): PopupAd {
  const rand = Math.random().toString(36).slice(2, 7);
  return {
    id: `ad-${new Date(nowIso).getTime().toString(36)}-${rand}`,
    name: 'New popup',
    enabled: false,
    title: { en: '' },
    cta: { label: { en: 'Chat on Telegram', kh: 'ជជែកតាម Telegram' }, action: 'telegram' },
    dismissLabel: { en: 'Not now', kh: 'មិនមែនឥឡូវ' },
    template: 'card',
    theme: 'dark',
    accent: DEFAULT_ACCENT,
    pages: 'all',
    devices: 'all',
    languages: 'all',
    trigger: { type: 'delay', seconds: 8 },
    frequency: 'day',
    priority: 10,
    hideAfterLead: true,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...overrides,
  };
}

/**
 * Cleans an ad coming from the admin form or an import. Unknown fields are
 * dropped, numbers clamped, URLs checked. Returns null when the ad has no
 * title or no button label in any language.
 */
export function normalizePopupAd(input: unknown, nowIso: string, existing?: PopupAd): PopupAd | null {
  if (!input || typeof input !== 'object') return null;
  const v = input as Record<string, unknown>;
  const title = normalizeBilingual(v.title, 120);
  const ctaRaw = (v.cta && typeof v.cta === 'object' ? v.cta : {}) as Record<string, unknown>;
  const ctaLabel = normalizeBilingual(ctaRaw.label, 60);
  if (!title || !ctaLabel) return null;

  const id = clampStr(v.id, 80).replace(/[^A-Za-z0-9_-]/g, '') || newPopupAd(nowIso).id;
  const action = oneOf(ctaRaw.action, POPUP_CTA_ACTIONS, 'telegram');
  const url = action === 'url' ? safeRedirectUrl(clampStr(ctaRaw.url, 2000)) || undefined : undefined;
  const triggerRaw = (v.trigger && typeof v.trigger === 'object' ? v.trigger : {}) as Record<string, unknown>;
  const triggerType = oneOf(triggerRaw.type, POPUP_TRIGGERS, 'delay');
  const trigger: PopupAdTrigger = { type: triggerType };
  if (triggerType === 'delay') trigger.seconds = clampNum(triggerRaw.seconds, 0, 600, 8);
  if (triggerType === 'scroll') trigger.percent = clampNum(triggerRaw.percent, 1, 100, 40);
  if (triggerType === 'idle') trigger.idleSeconds = clampNum(triggerRaw.idleSeconds, 3, 600, 20);
  if (triggerType === 'smart') trigger.sensitivity = oneOf(triggerRaw.sensitivity, SMART_SENSITIVITIES, 'balanced');

  let pages: 'all' | string[] = 'all';
  if (Array.isArray(v.pages)) {
    const list = v.pages
      .map((s) => clampStr(s, 120).toLowerCase())
      .filter((s) => /^[a-z0-9_-]+$/.test(s));
    pages = list.length ? Array.from(new Set(list)) : 'all';
  }

  const startAt = isoOrUndefined(v.startAt);
  const endAt = isoOrUndefined(v.endAt);
  const accent = clampStr(v.accent, 7);
  const imageUrl = safeRedirectUrl(clampStr(v.imageUrl, 2000)) || undefined;

  return {
    id,
    name: clampStr(v.name, 80) || title.en.slice(0, 80) || 'Popup',
    enabled: Boolean(v.enabled),
    badge: normalizeBilingual(v.badge, 40),
    title,
    body: normalizeBilingual(v.body, 400),
    imageUrl,
    cta: { label: ctaLabel, action, url, newTab: action === 'url' ? Boolean(ctaRaw.newTab) : undefined },
    dismissLabel: normalizeBilingual(v.dismissLabel, 40),
    template: oneOf(v.template, POPUP_TEMPLATES, 'card'),
    theme: oneOf(v.theme, POPUP_THEMES, 'dark'),
    accent: HEX_COLOR.test(accent) ? accent : DEFAULT_ACCENT,
    pages,
    devices: oneOf(v.devices, ['all', 'mobile', 'desktop'] as const, 'all'),
    languages: oneOf(v.languages, ['all', 'en', 'kh'] as const, 'all'),
    trigger,
    frequency: oneOf(v.frequency, POPUP_FREQUENCIES, 'day'),
    startAt,
    endAt: endAt && startAt && endAt < startAt ? undefined : endAt,
    priority: clampNum(v.priority, 0, 1000, 10),
    hideAfterLead: v.hideAfterLead === undefined ? true : Boolean(v.hideAfterLead),
    ...normalizeAdvanced(v),
    createdAt: existing?.createdAt || isoOrUndefined(v.createdAt) || nowIso,
    updatedAt: nowIso,
  };
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const slugList = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.map((s) => clampStr(s, 120).toLowerCase()).filter((s) => /^[a-z0-9_-]+$/.test(s))))
    : [];

/** A safe second-button address: a normal link, or a phone number (tel:). */
export function safeSecondaryHref(value: unknown): string | undefined {
  const raw = clampStr(value, 2000);
  if (/^tel:\+?[0-9][0-9 ()-]{4,24}$/.test(raw)) return raw.replace(/[ ()-]/g, '');
  return safeRedirectUrl(raw) || undefined;
}

function normalizeHours(value: unknown): PopupAdHours | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as Record<string, unknown>;
  const days = Array.isArray(v.days)
    ? Array.from(new Set(v.days.map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))).sort()
    : [];
  const from = typeof v.from === 'string' && TIME.test(v.from) ? v.from : '';
  const to = typeof v.to === 'string' && TIME.test(v.to) ? v.to : '';
  if (!days.length || !from || !to || from === to) return undefined;
  return { days, from, to };
}

/** The optional design and targeting settings; missing values keep the old behaviour. */
function normalizeAdvanced(v: Record<string, unknown>): Partial<PopupAd> {
  const out: Partial<PopupAd> = {};
  if (v.position !== undefined) out.position = oneOf(v.position, POPUP_POSITIONS, 'center');
  if (v.size !== undefined) out.size = oneOf(v.size, POPUP_SIZES, 'md');
  if (v.animation !== undefined) out.animation = oneOf(v.animation, POPUP_ANIMATIONS, 'zoom');
  if (v.radius !== undefined) out.radius = oneOf(v.radius, POPUP_RADII, 'soft');
  if (v.overlay !== undefined) out.overlay = oneOf(v.overlay, POPUP_OVERLAYS, 'dark');
  if (v.closeOnBackdrop !== undefined) out.closeOnBackdrop = Boolean(v.closeOnBackdrop);
  const agentName = clampStr(v.agentName, 60);
  if (agentName) out.agentName = agentName;
  const agentRole = normalizeBilingual(v.agentRole, 60);
  if (agentRole) out.agentRole = agentRole;
  if (v.secondary && typeof v.secondary === 'object') {
    const sec = v.secondary as Record<string, unknown>;
    const label = normalizeBilingual(sec.label, 40);
    const href = safeSecondaryHref(sec.href);
    if (label && href) out.secondary = { label, href } satisfies PopupAdSecondary;
  }
  const countdownTo = isoOrUndefined(v.countdownTo);
  if (countdownTo) out.countdownTo = countdownTo;
  const countdownLabel = normalizeBilingual(v.countdownLabel, 60);
  if (countdownLabel) out.countdownLabel = countdownLabel;
  const autoClose = clampNum(v.autoCloseSeconds, 0, 600, 0);
  if (autoClose > 0) out.autoCloseSeconds = autoClose;
  if (v.launcher) out.launcher = true;
  const exclude = slugList(v.excludePages);
  if (exclude.length) out.excludePages = exclude;
  if (v.visitors !== undefined) out.visitors = oneOf(v.visitors, ['all', 'new', 'returning'] as const, 'all');
  const utm = Array.isArray(v.utmSources)
    ? Array.from(new Set(v.utmSources.map((s) => clampStr(s, 60).toLowerCase()).filter((s) => /^[a-z0-9._-]+$/.test(s)))).slice(0, 20)
    : [];
  if (utm.length) out.utmSources = utm;
  const hours = normalizeHours(v.hours);
  if (hours) out.hours = hours;
  return out;
}

/** Cleans a whole settings object; invalid ads are dropped, duplicate ids keep the first. */
export function normalizePopupAdsState(input: unknown, nowIso: string, existing?: PopupAdsState): PopupAdsState {
  const v = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const settingsRaw = (v.settings && typeof v.settings === 'object' ? v.settings : {}) as Record<string, unknown>;
  const previous = new Map((existing?.ads || []).map((a) => [a.id, a]));
  const seen = new Set<string>();
  const ads: PopupAd[] = [];
  for (const raw of Array.isArray(v.ads) ? v.ads : []) {
    const rawId = raw && typeof raw === 'object' ? clampStr((raw as Record<string, unknown>).id, 80) : '';
    const ad = normalizePopupAd(raw, nowIso, previous.get(rawId));
    if (!ad || seen.has(ad.id)) continue;
    // Keep the stored updatedAt when nothing changed, so "last edited" stays truthful.
    const before = previous.get(ad.id);
    if (before && JSON.stringify({ ...before, updatedAt: '' }) === JSON.stringify({ ...ad, updatedAt: '' })) {
      ad.updatedAt = before.updatedAt;
    }
    seen.add(ad.id);
    ads.push(ad);
    if (ads.length >= MAX_POPUP_ADS) break;
  }
  return {
    settings: {
      enabled: settingsRaw.enabled === undefined ? true : Boolean(settingsRaw.enabled),
      globalCooldownHours: clampNum(settingsRaw.globalCooldownHours, 0, 24 * 30, defaultPopupAdsSettings.globalCooldownHours),
    },
    ads,
    updatedAt: nowIso,
  };
}

// ─── Schedule, targeting, selection ────────────────────────────────────────

export function isWithinSchedule(ad: Pick<PopupAd, 'startAt' | 'endAt'>, nowMs: number): boolean {
  if (ad.startAt && new Date(ad.startAt).getTime() > nowMs) return false;
  if (ad.endAt && new Date(ad.endAt).getTime() <= nowMs) return false;
  return true;
}

export function popupAdStatus(ad: PopupAd, nowMs: number): PopupAdStatus {
  if (!ad.enabled) return 'paused';
  if (ad.startAt && new Date(ad.startAt).getTime() > nowMs) return 'scheduled';
  if (ad.endAt && new Date(ad.endAt).getTime() <= nowMs) return 'expired';
  return 'active';
}

export function adTargetsPage(ad: Pick<PopupAd, 'pages' | 'excludePages'>, slug: string): boolean {
  const clean = slug.toLowerCase().trim();
  if (ad.pages === 'all') return !(ad.excludePages || []).includes(clean);
  return ad.pages.includes(clean);
}

/** True when the time falls inside the popup's days and hours (Cambodia time). No hours = any time. */
export function withinHours(hours: PopupAdHours | undefined, nowMs: number): boolean {
  if (!hours) return true;
  const local = new Date(nowMs + PHNOM_PENH_OFFSET_MS);
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  const from = toMin(hours.from);
  const to = toMin(hours.to);
  const day = local.getUTCDay();
  if (from < to) return hours.days.includes(day) && minutes >= from && minutes < to;
  // Overnight window (e.g. 20:00 to 02:00): the early hours belong to the previous day.
  if (minutes >= from) return hours.days.includes(day);
  if (minutes < to) return hours.days.includes((day + 6) % 7);
  return false;
}

/** Highest priority first, then most recently edited. */
export function sortByPriority(ads: PopupAd[]): PopupAd[] {
  return ads.slice().sort((a, b) => (b.priority - a.priority) || b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * The popups a page may show, decided on the server: master switch, enabled,
 * inside the schedule, targets this page. A preview id is always included (first),
 * whatever its state, so the admin can look at a draft.
 */
/** A popup as sent to a public page: it carries the site-wide cooldown so the browser applies the saved setting. */
export type PublicPopupAd = PopupAd & { siteCooldownHours?: number };

export function selectPublicPopupAds(
  state: PopupAdsState,
  slug: string,
  nowMs: number,
  options: { previewId?: string } = {}
): PublicPopupAd[] {
  const preview = options.previewId ? state.ads.find((a) => a.id === options.previewId) : undefined;
  if (!state.settings.enabled && !preview) return [];
  const live = state.settings.enabled
    ? sortByPriority(state.ads.filter((a) => a.enabled && isWithinSchedule(a, nowMs) && adTargetsPage(a, slug)))
    : [];
  const list = preview ? [preview, ...live.filter((a) => a.id !== preview.id)] : live;
  const cooldown = state.settings.globalCooldownHours;
  return list.map((a) => ({ ...a, siteCooldownHours: cooldown }));
}

/** The site-wide rules as far as a public page knows them. */
export function settingsFromPublicAds(ads: PublicPopupAd[]): PopupAdsSettings {
  const hours = ads.find((a) => typeof a.siteCooldownHours === 'number')?.siteCooldownHours;
  return { ...defaultPopupAdsSettings, globalCooldownHours: hours ?? defaultPopupAdsSettings.globalCooldownHours };
}

export interface PopupVisitorContext {
  nowMs: number;
  device: 'mobile' | 'desktop';
  lang: 'en' | 'kh';
  /** Visitor already sent the registration form. */
  leadSent: boolean;
  /** First visit more than RETURNING_AFTER_MS ago. */
  returning?: boolean;
  /** utm_source of this visit, lower case. */
  utmSource?: string;
  /** When any popup was last shown to this visitor (ms), for the global cooldown. */
  lastAnyShownAt?: number;
  /** When this ad was last shown to this visitor (ms). */
  shownAt: (adId: string) => number | undefined;
  /** This ad was already shown in the current browser session. */
  shownThisSession: (adId: string) => boolean;
}

export function frequencyAllows(
  frequency: PopupAdFrequency,
  lastShownAtMs: number | undefined,
  shownThisSession: boolean,
  nowMs: number
): boolean {
  if (frequency === 'always') return true;
  if (frequency === 'session') return !shownThisSession;
  if (lastShownAtMs === undefined) return true;
  if (frequency === 'forever') return false;
  return nowMs - lastShownAtMs >= FREQUENCY_WINDOW_MS[frequency];
}

/**
 * The single popup this visitor sees on this page view, or null. Runs in the
 * browser after mount, with the visitor's device, language and storage.
 */
export function pickPopupToShow(ads: PopupAd[], settings: PopupAdsSettings, ctx: PopupVisitorContext): PopupAd | null {
  const cooldownMs = Math.max(0, settings.globalCooldownHours) * 60 * 60 * 1000;
  for (const ad of sortByPriority(ads)) {
    if (ad.devices !== 'all' && ad.devices !== ctx.device) continue;
    if (ad.languages !== 'all' && ad.languages !== ctx.lang) continue;
    if (ad.hideAfterLead && ctx.leadSent) continue;
    if (ad.visitors === 'new' && ctx.returning) continue;
    if (ad.visitors === 'returning' && !ctx.returning) continue;
    if (ad.utmSources?.length && !(ctx.utmSource && ad.utmSources.includes(ctx.utmSource))) continue;
    if (!withinHours(ad.hours, ctx.nowMs)) continue;
    if (!frequencyAllows(ad.frequency, ctx.shownAt(ad.id), ctx.shownThisSession(ad.id), ctx.nowMs)) continue;
    if (
      ad.frequency !== 'always' &&
      cooldownMs > 0 &&
      ctx.lastAnyShownAt !== undefined &&
      ctx.nowMs - ctx.lastAnyShownAt < cooldownMs &&
      ctx.shownAt(ad.id) === undefined
    ) {
      // Another popup was shown recently: do not stack a second one on the visitor.
      continue;
    }
    return ad;
  }
  return null;
}

/** Where the button sends the visitor. Null means "just close". */
export function resolveCtaHref(ad: PopupAd, slug: string): string | null {
  switch (ad.cta.action) {
    case 'telegram':
      return `/api/round-robin?page=${encodeURIComponent(slug)}&redirect=true`;
    case 'register':
      return '#register';
    case 'url':
      return safeRedirectUrl(ad.cta.url);
    default:
      return null;
  }
}

/** Page for the preview link: first targeted page, else the home page. */
export function previewSlug(ad: Pick<PopupAd, 'pages'>): string {
  return ad.pages === 'all' || ad.pages.length === 0 ? 'smart-city-tea-cafe' : ad.pages[0];
}

export function previewPath(ad: Pick<PopupAd, 'id' | 'pages'>): string {
  const slug = previewSlug(ad);
  const base = slug === HOME_SLUG ? '/' : `/${slug}`;
  return `${base}?popup_preview=${encodeURIComponent(ad.id)}`;
}

// ─── Smart timing ──────────────────────────────────────────────────────────
//
// A 'smart' popup waits until the visitor shows interest instead of a fixed
// delay. The browser measures a few signals on this page view (nothing leaves
// the browser, no personal data) and adds up points; the popup shows once the
// points reach the threshold for the chosen sensitivity. Plain rules, not a
// trained model: every decision can be explained with the reasons returned.

export interface SmartSignals {
  /** Seconds on the page while the tab was visible and the visitor active. */
  activeSeconds: number;
  /** Deepest scroll so far, 0–100. */
  maxScrollPercent: number;
  /** The price or offer section has been on screen. */
  priceSeen: boolean;
  /** The registration form has been on screen. */
  formSeen: boolean;
  /** The visitor typed in the form (and has not sent it). Counts more than just seeing it. */
  formStarted?: boolean;
  /** The visitor is typing in a form (or typed in the last few seconds): never interrupt. */
  typing: boolean;
  /** Times the visitor scrolled back up a good distance to read something again. */
  scrollBacks: number;
  /** Pages opened in this visit, this one included. */
  pagesThisVisit: number;
  /** Visits to the site from this browser, this one included. */
  visits: number;
  /** The visitor seems about to leave (pointer to the top on desktop, fast scroll to the top on phones). */
  leaving: boolean;
  /** Seconds since the last scroll, tap or key, after having been active. */
  pausedSeconds: number;
}

export type SmartReason = PopupAdSmartReason;
export const SMART_REASONS: SmartReason[] = ['time', 'scroll', 'price', 'form', 'reread', 'pages', 'returning', 'leaving', 'pause'];

/** Known reasons from a comma-separated beacon value, at most three. */
export function parseSmartReasons(value: unknown): SmartReason[] {
  if (typeof value !== 'string') return [];
  const list = value.split(',').map((r) => r.trim()).filter((r): r is SmartReason => (SMART_REASONS as string[]).includes(r));
  return Array.from(new Set(list)).slice(0, 3);
}

export const SMART_RULES: Record<PopupAdSmartSensitivity, { threshold: number; minSeconds: number }> = {
  gentle: { threshold: 70, minSeconds: 20 },
  balanced: { threshold: 50, minSeconds: 10 },
  eager: { threshold: 35, minSeconds: 5 },
};

/** Interest points for this page view, with the signals that earned them. */
export function smartScore(s: SmartSignals): { score: number; reasons: SmartReason[] } {
  const parts: Array<[SmartReason, number]> = [
    ['time', Math.min(s.activeSeconds, 60) * 0.5],
    ['scroll', Math.max(0, Math.min(s.maxScrollPercent, 100)) * 0.25],
    ['price', s.priceSeen ? 15 : 0],
    ['form', s.formStarted ? 25 : s.formSeen ? 15 : 0],
    ['reread', s.scrollBacks >= 2 ? 10 : 0],
    ['pages', s.pagesThisVisit >= 2 ? 10 : 0],
    ['returning', s.visits >= 2 ? 10 : 0],
    ['leaving', s.leaving ? 25 : 0],
    ['pause', s.pausedSeconds >= 8 && s.activeSeconds >= 10 ? 10 : 0],
  ];
  const earned = parts.filter(([, p]) => p > 0);
  const score = Math.round(earned.reduce((sum, [, p]) => sum + p, 0));
  const reasons = earned.sort((a, b) => b[1] - a[1]).map(([r]) => r);
  return { score, reasons };
}

/**
 * Whether a smart popup should appear now. Never while the visitor types in a
 * form, never before the minimum time (so people who bounce in a few seconds
 * are left alone), except that a visitor about to leave with half the points
 * already earned is asked before they go.
 */
export function smartShouldShow(s: SmartSignals, sensitivity: PopupAdSmartSensitivity = 'balanced'): { show: boolean; score: number; reasons: SmartReason[] } {
  const rules = SMART_RULES[sensitivity] || SMART_RULES.balanced;
  const { score, reasons } = smartScore(s);
  if (s.typing) return { show: false, score, reasons };
  if (s.leaving && s.activeSeconds >= 3 && score >= rules.threshold / 2) return { show: true, score, reasons };
  if (s.activeSeconds < rules.minSeconds) return { show: false, score, reasons };
  return { show: score >= rules.threshold, score, reasons };
}
