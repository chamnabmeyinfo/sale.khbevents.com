'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { PopupAd, PopupAdSmartSensitivity } from '@/lib/types';
import { pickPopupToShow, pickText, popupStorageKeys, inAppBrowserName, nextOpening, popupSkipReason, resolveCtaHref, RETURNING_AFTER_MS, settingsFromPublicAds, SKIP_REASON_TEXT, smartShouldShow, SMART_RULES, visitSources, type PopupVisitorContext, type PublicPopupAd } from '@/lib/popup-ads';
import { getDeviceType, trackClientEvent } from '@/components/common/LandingPageTracking';
import { useStoredChoice, useUrlParam } from '@/lib/use-browser-state';

/**
 * Popup ads shown on the public landing pages.
 *
 * PopupAdCard is the presentational popup (also rendered inline by the admin
 * live preview). PopupAdsHost decides which popup this visitor sees, waits for
 * its trigger, records view / click / close events and applies the frequency
 * rules. Styles live in src/styles/popup-ads.css (own class names, z-index 1200,
 * above every piece of landing page chrome).
 */

/** Darkens a #rrggbb colour for the gradient end of the button. */
function shade(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** The look a popup gets when an option was never set (older popups keep their design). */
export function popupDefaults(ad: PopupAd) {
  const chat = ad.template === 'chat';
  return {
    position: ad.position ?? (chat ? 'bottom-right' : 'center'),
    size: ad.size ?? 'md',
    animation: ad.animation ?? (chat ? 'slide' : 'zoom'),
    radius: ad.radius ?? 'soft',
    overlay: ad.template === 'banner' || chat ? ad.overlay ?? 'none' : ad.overlay ?? (ad.template === 'bottom-sheet' ? 'light' : 'dark'),
    closeOnBackdrop: ad.closeOnBackdrop ?? true,
  };
}

/** Time left until a date, ticking once a second after mount (null before, so server HTML stays stable). */
function useCountdown(iso?: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!iso) return;
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => { window.clearTimeout(first); window.clearInterval(id); };
  }, [iso]);
  if (!iso || now === null) return null;
  const diff = new Date(iso).getTime() - now;
  if (!Number.isFinite(diff) || diff <= 0) return null;
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor(diff / 3_600_000) % 24,
    m: Math.floor(diff / 60_000) % 60,
    s: Math.floor(diff / 1000) % 60,
  };
}

const TelegramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
  </svg>
);

/** Avatar letters: a short all-caps first word as is (KHB), otherwise the first letters of two words. */
const initials = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);
  if (words[0] && /^[A-Z]{2,3}$/.test(words[0])) return words[0];
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'K';
};

export interface PopupAdCardProps {
  ad: PopupAd;
  lang: 'en' | 'kh';
  /** Slug of the page the popup is shown on (the Telegram CTA routes through it). */
  pageSlug: string;
  onClose: () => void;
  /** Called with the resolved destination (null = the button only closes). */
  onCta: (href: string | null) => void;
  /** Render in the normal flow (no fixed overlay), for the admin preview. */
  inline?: boolean;
  /** Set once the panel should be on screen; drives the enter animation. */
  open?: boolean;
}

export function PopupAdCard({ ad, lang, pageSlug, onClose, onCta, inline = false, open = true }: PopupAdCardProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const href = resolveCtaHref(ad, pageSlug);
  const accent = ad.accent || '#E5A93C';
  const isBanner = ad.template === 'banner';
  const external = href ? /^https?:/i.test(href) : false;
  const newTab = ad.cta.action === 'telegram' || (ad.cta.action === 'url' && Boolean(ad.cta.newTab));
  const title = pickText(ad.title, lang);
  const body = pickText(ad.body, lang);
  const badge = pickText(ad.badge, lang);
  const ctaLabel = pickText(ad.cta.label, lang);
  const dismiss = pickText(ad.dismissLabel, lang);
  const isChat = ad.template === 'chat';
  const showImage = Boolean(ad.imageUrl) && !isBanner && !isChat;
  const look = popupDefaults(ad);
  const secondaryLabel = ad.secondary ? pickText(ad.secondary.label, lang) : '';
  const countdown = useCountdown(ad.countdownTo);
  const cdLabel = pickText(ad.countdownLabel, lang) || (lang === 'kh' ? 'នៅសល់' : 'Ends in');
  const telegram = ad.cta.action === 'telegram';
  // Chat design: a short "typing" moment before the message appears (not in the admin preview).
  const [typing, setTyping] = useState(isChat && !inline);
  useEffect(() => {
    if (!isChat || inline || !open) return;
    const id = window.setTimeout(() => setTyping(false), 1100);
    return () => window.clearTimeout(id);
  }, [isChat, inline, open]);

  // Focus moves into the dialog when it opens on the live page (not for the chat bubble, which does not block the page).
  useEffect(() => {
    if (inline || !open || isChat) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      if (previous && typeof previous.focus === 'function') previous.focus({ preventScroll: true });
    };
  }, [inline, open, isChat]);

  const handleCta = (e: React.MouseEvent) => {
    if (!href || href === '#register' || (!external && !newTab)) {
      // Let the host decide (close, scroll or navigate) instead of the anchor.
      e.preventDefault();
    }
    onCta(href);
  };

  const cta = href ? (
    <a
      className="khb-popup__cta"
      href={href}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noreferrer' : undefined}
      onClick={handleCta}
    >
      {telegram && <TelegramIcon />}
      <span>{ctaLabel}</span>
    </a>
  ) : (
    <button type="button" className="khb-popup__cta" onClick={handleCta}>{ctaLabel}</button>
  );

  const secondary = ad.secondary && secondaryLabel ? (
    <a
      className="khb-popup__secondary"
      href={ad.secondary.href}
      target={/^https?:/i.test(ad.secondary.href) ? '_blank' : undefined}
      rel={/^https?:/i.test(ad.secondary.href) ? 'noreferrer' : undefined}
      onClick={(e) => { if (inline) e.preventDefault(); }}
    >
      {ad.secondary.href.startsWith('tel:') && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
      )}
      <span>{secondaryLabel}</span>
    </a>
  ) : null;

  const countdownRow = countdown ? (
    <div className="khb-popup__countdown" aria-live="off">
      <span className="khb-popup__countdown-label">{cdLabel}</span>
      <span className="khb-popup__countdown-boxes">
        {([[countdown.d, lang === 'kh' ? 'ថ្ងៃ' : 'd'], [countdown.h, lang === 'kh' ? 'ម៉ោង' : 'h'], [countdown.m, lang === 'kh' ? 'នាទី' : 'm'], [countdown.s, lang === 'kh' ? 'វិ' : 's']] as const).map(([v, u]) => (
          <span key={u}><b>{String(v).padStart(2, '0')}</b>{u}</span>
        ))}
      </span>
    </div>
  ) : null;

  const className = [
    'khb-popup',
    `khb-popup--${ad.template}`,
    `khb-popup--${ad.theme}`,
    `khb-pos-${look.position}`,
    `khb-size-${look.size}`,
    `khb-anim-${look.animation}`,
    `khb-radius-${look.radius}`,
    `khb-overlay-${look.overlay}`,
    inline ? 'khb-popup--inline' : '',
    open ? 'is-open' : '',
    lang === 'kh' ? 'lang-kh' : '',
    showImage ? 'has-image' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={className} style={{ '--khb-accent': accent, '--khb-accent-dark': shade(accent, 0.22) } as React.CSSProperties}>
      {!inline && look.overlay !== 'none' && (
        <div className="khb-popup__backdrop" onClick={look.closeOnBackdrop ? onClose : undefined} aria-hidden="true" />
      )}
      <div
        ref={panelRef}
        className="khb-popup__panel"
        role="dialog"
        aria-modal={!inline && look.overlay !== 'none' && !isBanner && !isChat}
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <button type="button" className="khb-popup__close" onClick={onClose} aria-label={lang === 'kh' ? 'បិទ' : 'Close'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {isChat ? (
          <>
            <div className="khb-chat__head">
              <span className="khb-chat__avatar">
                {ad.imageUrl ? <img src={ad.imageUrl} alt="" decoding="async" /> : <span>{initials(ad.agentName || 'KHB')}</span>}
                <i className="khb-chat__online" aria-hidden="true" />
              </span>
              <span className="khb-chat__who">
                <b>{ad.agentName || 'KHB Events'}</b>
                <small>{pickText(ad.agentRole, lang) || (lang === 'kh' ? 'ជាធម្មតាឆ្លើយក្នុងពេលប៉ុន្មាននាទី' : 'Usually replies in minutes')}</small>
              </span>
            </div>
            <div className="khb-chat__thread">
              {typing ? (
                <div className="khb-chat__bubble khb-chat__typing" aria-label={lang === 'kh' ? 'កំពុងសរសេរ' : 'Typing'}><i /><i /><i /></div>
              ) : (
                <div className="khb-chat__bubble">
                  {badge && <span className="khb-popup__badge">{badge}</span>}
                  <h2 id={titleId} className="khb-chat__title">{title}</h2>
                  {body && <p className="khb-chat__text">{body}</p>}
                </div>
              )}
            </div>
            <div className="khb-popup__content khb-chat__actions">
              {countdownRow}
              <div className="khb-popup__actions">
                {cta}
                {secondary}
                {dismiss && <button type="button" className="khb-popup__dismiss" onClick={onClose}>{dismiss}</button>}
              </div>
            </div>
          </>
        ) : (
          <>
            {showImage && (
              <div className="khb-popup__media">
                <img src={ad.imageUrl} alt="" decoding="async" />
              </div>
            )}
            <div className="khb-popup__content">
              {badge && <span className="khb-popup__badge">{badge}</span>}
              <h2 id={titleId} className="khb-popup__title">{title}</h2>
              {body && <p className="khb-popup__body">{body}</p>}
              {countdownRow}
              <div className="khb-popup__actions">
                {cta}
                {secondary}
                {dismiss && (
                  <button type="button" className="khb-popup__dismiss" onClick={onClose}>{dismiss}</button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export interface PopupAdsHostProps {
  /** Popups the server already filtered for this page (enabled, in schedule, targeted). */
  ads?: PublicPopupAd[];
  pageSlug: string;
  /** Current page language; when omitted the host reads ?lang= and the stored choice. */
  lang?: 'en' | 'kh';
  /** ?popup_preview=<id>: show that popup at once, no frequency rules, no tracking. */
  previewId?: string;
}

const readLocal = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeLocal = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the popup simply shows again next time.
  }
};
const readSession = (key: string): string | null => {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeSession = (key: string, value: string) => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
};
const numberOrUndefined = (value: string | null): number | undefined => {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) ? n : undefined;
};

export default function PopupAdsHost({ ads = [], pageSlug, lang: langProp, previewId }: PopupAdsHostProps) {
  const urlLang = useUrlParam('lang');
  const [storedLang] = useStoredChoice('khb_lang', ['en', 'kh'] as const, 'en');
  const lang: 'en' | 'kh' = langProp ?? (urlLang === 'kh' || urlLang === 'en' ? urlLang : storedLang);
  const noPopup = useUrlParam('nopopup');
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const [active, setActive] = useState<PopupAd | null>(null);
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState(false);
  /** After closing: show the small round button that opens the popup again. */
  const [launcherShown, setLauncherShown] = useState(false);
  const viewedRef = useRef(false);
  /** Why a smart popup appeared (score and top reasons), sent with the view event. */
  const smartRef = useRef<{ score: number; reasons: string } | null>(null);
  /** ?popup_debug=1: an on-screen panel that says why each popup shows or not (in-app browsers have no console). */
  const [debugInfo, setDebugInfo] = useState<{ browser: string; rows: Array<{ name: string; status: string }>; smart?: string } | null>(null);

  // Decide after mount only: storage, device and time must not affect the server HTML.
  // The decision runs on the next tick so the effect itself never sets state.
  useEffect(() => {
    if (!ads.length || noPopup === '1') {
      if (!ads.length && new URLSearchParams(window.location.search).get('popup_debug') === '1') {
        const id = window.setTimeout(() => setDebugInfo({ browser: inAppBrowserName(navigator.userAgent) || 'Normal browser', rows: [] }), 0);
        return () => window.clearTimeout(id);
      }
      return;
    }
    const cleanups: Array<() => void> = [];
    const tick = window.setTimeout(() => decide(cleanups), 0);
    return () => {
      window.clearTimeout(tick);
      cleanups.forEach((c) => c());
    };

    function decide(cleanups: Array<() => void>) {
    const previewAd = previewId ? ads.find((a) => a.id === previewId) : undefined;
    if (previewAd) {
      setActive(previewAd);
      setPreview(true);
      setVisible(true);
      return;
    }

    const device = getDeviceType() === 'desktop' ? 'desktop' : 'mobile';
    const nowMs = Date.now();
    // New or returning visitor: remember the first visit in this browser.
    const firstSeen = numberOrUndefined(readLocal(popupStorageKeys.firstSeen));
    if (firstSeen === undefined) writeLocal(popupStorageKeys.firstSeen, String(nowMs));
    // Ad source: utm_source of this visit, kept for the session as visitors move between pages.
    const urlSource = new URLSearchParams(window.location.search).get('utm_source')?.trim().toLowerCase();
    if (urlSource) writeSession(popupStorageKeys.utmSource, urlSource);
    const utmSource = urlSource || readSession(popupStorageKeys.utmSource) || undefined;
    // Where the visit came from, worked out on the first page of the visit and kept for the session.
    const sources = Array.from(new Set([
      ...(readSession(popupStorageKeys.visitSources) || '').split(',').filter(Boolean),
      ...visitSources({ utmSource, userAgent: navigator.userAgent, referrer: document.referrer, ownHost: window.location.hostname }),
    ]));
    if (sources.length) writeSession(popupStorageKeys.visitSources, sources.join(','));
    // Visit pattern for smart timing: visits from this browser and pages opened in this visit.
    let visits = numberOrUndefined(readLocal(popupStorageKeys.visits)) ?? 0;
    if (readSession(popupStorageKeys.visitCounted) !== '1') {
      visits += 1;
      writeLocal(popupStorageKeys.visits, String(visits));
      writeSession(popupStorageKeys.visitCounted, '1');
    }
    const pagesThisVisit = (numberOrUndefined(readSession(popupStorageKeys.pagesThisVisit)) ?? 0) + 1;
    writeSession(popupStorageKeys.pagesThisVisit, String(pagesThisVisit));
    const settings = settingsFromPublicAds(ads);
    const visitor: PopupVisitorContext = {
      nowMs,
      device,
      lang: langRef.current,
      returning: firstSeen !== undefined && nowMs - firstSeen > RETURNING_AFTER_MS,
      utmSource,
      sources,
      leadSent: readLocal(popupStorageKeys.leadSent) === '1',
      lastAnyShownAt: numberOrUndefined(readLocal(popupStorageKeys.lastAny)),
      shownAt: (id) => numberOrUndefined(readLocal(popupStorageKeys.shown(id))),
      shownThisSession: (id: string) => readSession(popupStorageKeys.sessionShown(id)) === '1',
    };
    const ad = pickPopupToShow(ads, settings, visitor);
    const debugPanel = new URLSearchParams(window.location.search).get('popup_debug') === '1';
    if (debugPanel) {
      setDebugInfo({
        browser: `${inAppBrowserName(navigator.userAgent) || 'Normal browser'} · ${device} · came from: ${sources.join(', ') || 'not known'}`,
        rows: ads.map((a) => {
          const why = popupSkipReason(a, settings, visitor);
          const opens = why === 'hours' ? nextOpening(a.hours, nowMs) : null;
          const status = a.id === ad?.id
            ? `SHOWS (trigger: ${a.trigger.type}${a.trigger.type === 'delay' ? ` ${a.trigger.seconds ?? 8} s` : a.trigger.type === 'idle' ? ` ${a.trigger.idleSeconds ?? 20} s without moving` : a.trigger.type === 'smart' ? `, ${a.trigger.sensitivity ?? 'balanced'}` : ''})`
            : why ? `hidden: ${SKIP_REASON_TEXT[why]}${opens ? `, opens ${opens}` : ''}${why === 'source' ? ` (${(a.utmSources || []).join(', ')})` : ''}` : 'hidden: a higher-priority popup shows instead';
          return { name: a.name, status };
        }),
      });
    }
    if (!ad) return;
    setActive(ad);

    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      cleanups.forEach((c) => c());
      // The visitor may have sent the form on this page after the popup was chosen.
      if (ad.hideAfterLead && readLocal(popupStorageKeys.leadSent) === '1') return;
      setVisible(true);
    };
    const onScrollPast = (percent: number) => {
      const check = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0 || (window.scrollY / max) * 100 >= percent) fire();
      };
      window.addEventListener('scroll', check, { passive: true });
      cleanups.push(() => window.removeEventListener('scroll', check));
      check();
    };
    const afterMs = (ms: number) => {
      const id = window.setTimeout(fire, ms);
      cleanups.push(() => window.clearTimeout(id));
    };

    /**
     * Smart timing: measure interest on this page view and show the popup
     * when smartShouldShow says so. Everything stays in the browser.
     */
    function watchInterest(sensitivity: PopupAdSmartSensitivity) {
      const debug = new URLSearchParams(window.location.search).get('popup_debug') === '1';
      let activeSeconds = 0;
      let lastActivity = Date.now();
      let maxScrollPercent = 0;
      let priceSeen = false;
      let formSeen = false;
      let lastTyped = 0;
      let scrollBacks = 0;
      let peakY = window.scrollY;
      let countedBack = false;
      let leaving = false;
      let lastY = window.scrollY;

      const evaluate = () => {
        const now = Date.now();
        const el = document.activeElement;
        const inField = !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !el.closest('.khb-popup');
        const result = smartShouldShow({
          activeSeconds,
          maxScrollPercent,
          priceSeen,
          formSeen,
          formStarted: lastTyped > 0,
          typing: inField || now - lastTyped < 5000,
          scrollBacks,
          pagesThisVisit,
          visits,
          leaving,
          pausedSeconds: (now - lastActivity) / 1000,
        }, sensitivity);
        leaving = false;
        if (debug) {
          console.info('[popup smart]', sensitivity, result.score, result.reasons.join(','), result.show ? 'SHOW' : '');
          const needed = SMART_RULES[sensitivity].threshold;
          setDebugInfo((d) => (d ? { ...d, smart: `Smart timing: ${result.score}/${needed} points${result.reasons.length ? ` (${result.reasons.join(', ')})` : ''}` } : d));
        }
        if (result.show) {
          smartRef.current = { score: result.score, reasons: result.reasons.slice(0, 3).join(',') };
          fire();
        }
      };

      const markActive = () => { lastActivity = Date.now(); };
      const onScroll = () => {
        markActive();
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max > 0) maxScrollPercent = Math.max(maxScrollPercent, (y / max) * 100);
        // Re-reading: scrolled back up at least 300 px, counted once per upward move.
        if (y > lastY) {
          if (countedBack) { countedBack = false; peakY = y; }
          peakY = Math.max(peakY, y);
        } else if (!countedBack && peakY - y > 300) {
          scrollBacks += 1;
          countedBack = true;
        }
        // Phones: back at the top after reading half the page often means "leaving".
        if (device === 'mobile' && maxScrollPercent >= 50 && y < 150 && lastY >= 150) {
          leaving = true;
          evaluate();
        }
        lastY = y;
      };
      const onType = (e: Event) => {
        const target = e.target as HTMLElement | null;
        if (target && !target.closest('.khb-popup')) lastTyped = Date.now();
      };
      const onLeave = (e: MouseEvent) => {
        if (e.clientY > 0) return;
        leaving = true;
        evaluate();
      };
      const activity = ['pointermove', 'pointerdown', 'keydown', 'touchstart'] as const;
      activity.forEach((ev) => window.addEventListener(ev, markActive, { passive: true }));
      window.addEventListener('scroll', onScroll, { passive: true });
      document.addEventListener('input', onType, true);
      if (device === 'desktop') document.addEventListener('mouseleave', onLeave);

      // Sections that show interest when they come on screen.
      const observer = typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              if ((entry.target as HTMLElement).dataset.khbSmart === 'price') priceSeen = true;
              else formSeen = true;
            }
          }, { threshold: 0.3 })
        : null;
      if (observer) {
        document.querySelectorAll<HTMLElement>('#pricing, section.kb-offer, [data-khb-price]').forEach((el) => { el.dataset.khbSmart = 'price'; observer.observe(el); });
        document.querySelectorAll<HTMLElement>('#register, section[id^="form-"]').forEach((el) => { el.dataset.khbSmart = 'form'; observer.observe(el); });
      }

      // Once a second: count active reading time (tab visible, some activity in the last 30 s).
      const tick = window.setInterval(() => {
        if (document.visibilityState === 'visible' && Date.now() - lastActivity < 30000) activeSeconds += 1;
        evaluate();
      }, 1000);

      cleanups.push(() => {
        window.clearInterval(tick);
        activity.forEach((ev) => window.removeEventListener(ev, markActive));
        window.removeEventListener('scroll', onScroll);
        document.removeEventListener('input', onType, true);
        document.removeEventListener('mouseleave', onLeave);
        observer?.disconnect();
      });
    }

    const trigger = ad.trigger;
    if (trigger.type === 'immediate') {
      fire();
    } else if (trigger.type === 'delay') {
      afterMs((trigger.seconds ?? 8) * 1000);
    } else if (trigger.type === 'scroll') {
      onScrollPast(trigger.percent ?? 40);
    } else if (trigger.type === 'idle') {
      // Idle: no scrolling, tapping, typing or pointer movement for N seconds.
      const idleMs = (trigger.idleSeconds ?? 20) * 1000;
      let timer = window.setTimeout(fire, idleMs);
      const reset = () => { window.clearTimeout(timer); timer = window.setTimeout(fire, idleMs); };
      const events = ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart'] as const;
      events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
      cleanups.push(() => { window.clearTimeout(timer); events.forEach((ev) => window.removeEventListener(ev, reset)); });
    } else if (trigger.type === 'smart') {
      watchInterest(trigger.sensitivity ?? 'balanced');
    } else if (device === 'desktop') {
      // Exit intent: the pointer leaves through the top of the window.
      const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) fire(); };
      document.addEventListener('mouseleave', onLeave);
      cleanups.push(() => document.removeEventListener('mouseleave', onLeave));
    } else {
      // Phones have no exit intent: whichever comes first of 15 s or 60% scrolled.
      afterMs(15000);
      onScrollPast(60);
    }
    }
  }, [ads, previewId, noPopup]);

  // When the popup appears: remember it, count the view, lock scrolling, listen for ESC.
  useEffect(() => {
    if (!visible || !active) return;
    if (!preview && !viewedRef.current) {
      viewedRef.current = true;
      const stamp = String(Date.now());
      writeLocal(popupStorageKeys.shown(active.id), stamp);
      writeLocal(popupStorageKeys.lastAny, stamp);
      writeSession(popupStorageKeys.sessionShown(active.id), '1');
      trackClientEvent(pageSlug, 'popup_view', { adId: active.id, adName: active.name, template: active.template, trigger: active.trigger.type, ...(smartRef.current ? { smartScore: smartRef.current.score, smartReasons: smartRef.current.reasons } : {}) }, langRef.current);
    }
    // Only popups that dim the page block scrolling; the chat bubble and banner leave the page usable.
    const lock = popupDefaults(active).overlay !== 'none' && active.template !== 'banner' && active.template !== 'chat';
    const previousOverflow = document.body.style.overflow;
    if (lock) document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (!preview) trackClientEvent(pageSlug, 'popup_close', { adId: active.id, adName: active.name, template: active.template }, langRef.current);
      setVisible(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (lock) document.body.style.overflow = previousOverflow;
    };
  }, [visible, active, preview, pageSlug]);

  const close = useCallback((reason: 'close' | 'click') => {
    if (active && !preview && reason === 'close') {
      trackClientEvent(pageSlug, 'popup_close', { adId: active.id, adName: active.name, template: active.template }, langRef.current);
    }
    setVisible(false);
    if (active?.launcher) setLauncherShown(true);
  }, [active, preview, pageSlug]);

  // Auto-close after the chosen number of seconds.
  useEffect(() => {
    if (!visible || !active?.autoCloseSeconds || preview) return;
    const id = window.setTimeout(() => close('close'), active.autoCloseSeconds * 1000);
    return () => window.clearTimeout(id);
  }, [visible, active, preview, close]);

  const onCta = useCallback((href: string | null) => {
    if (!active) return;
    if (!preview) {
      trackClientEvent(pageSlug, 'popup_click', { adId: active.id, adName: active.name, template: active.template, action: active.cta.action, ...(smartRef.current ? { smartReasons: smartRef.current.reasons } : {}) }, langRef.current);
    }
    close('click');
    if (preview) return;
    if (href === '#register') {
      // Classic pages use #register; drag-and-drop pages give each form section an id of form-<block>.
      const target = document.getElementById('register') || document.querySelector<HTMLElement>('section[id^="form-"]');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.open(`/api/round-robin?page=${encodeURIComponent(pageSlug)}&redirect=true`, '_blank', 'noreferrer');
      }
      return;
    }
    if (href && active.cta.action === 'url' && !active.cta.newTab) {
      window.location.href = href;
    }
    // 'telegram' and new-tab links are handled by the anchor itself.
  }, [active, preview, close, pageSlug]);

  const debugBox = debugInfo ? (
    <div className="khb-popup-debug" role="status">
      <b>Popup check</b> · {debugInfo.browser}
      {debugInfo.rows.length === 0 && <div>No popup is live for this page.</div>}
      {debugInfo.rows.map((r, i) => <div key={i}>{r.name}: {r.status}</div>)}
      {debugInfo.smart && <div>{debugInfo.smart}</div>}
    </div>
  ) : null;
  if (!active) return debugBox;
  if (!visible) {
    if (!launcherShown) return debugBox;
    const telegram = active.cta.action === 'telegram';
    const look = popupDefaults(active);
    return (
      <>
      {debugBox}
      <button
        type="button"
        className={`khb-launcher khb-launcher--${look.position === 'bottom-left' ? 'left' : 'right'}${telegram ? ' khb-launcher--telegram' : ''}`}
        style={{ '--khb-accent': active.accent || '#E5A93C' } as React.CSSProperties}
        onClick={() => { setLauncherShown(false); setVisible(true); }}
        aria-label={pickText(active.cta.label, lang) || pickText(active.title, lang)}
        title={pickText(active.cta.label, lang)}
      >
        {telegram ? <TelegramIcon size={26} /> : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>
        )}
      </button>
      </>
    );
  }
  return (
    <>
    {debugBox}
    <PopupAdCard
      ad={active}
      lang={lang}
      pageSlug={pageSlug}
      open={visible}
      onClose={() => close('close')}
      onCta={onCta}
    />
    </>
  );
}
