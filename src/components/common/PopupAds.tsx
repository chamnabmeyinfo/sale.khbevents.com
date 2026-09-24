'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { PopupAd } from '@/lib/types';
import { defaultPopupAdsSettings, pickPopupToShow, pickText, popupStorageKeys, resolveCtaHref } from '@/lib/popup-ads';
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
  const showImage = Boolean(ad.imageUrl) && !isBanner;

  // Focus moves into the dialog when it opens on the live page.
  useEffect(() => {
    if (inline || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      if (previous && typeof previous.focus === 'function') previous.focus({ preventScroll: true });
    };
  }, [inline, open]);

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
      {ctaLabel}
    </a>
  ) : (
    <button type="button" className="khb-popup__cta" onClick={handleCta}>{ctaLabel}</button>
  );

  return (
    <div
      className={`khb-popup khb-popup--${ad.template} khb-popup--${ad.theme}${inline ? ' khb-popup--inline' : ''}${open ? ' is-open' : ''}${lang === 'kh' ? ' lang-kh' : ''}${showImage ? ' has-image' : ''}`}
      style={{ '--khb-accent': accent, '--khb-accent-dark': shade(accent, 0.22) } as React.CSSProperties}
    >
      {!inline && !isBanner && <div className="khb-popup__backdrop" onClick={onClose} aria-hidden="true" />}
      <div
        ref={panelRef}
        className="khb-popup__panel"
        role="dialog"
        aria-modal={!inline && !isBanner}
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <button type="button" className="khb-popup__close" onClick={onClose} aria-label={lang === 'kh' ? 'បិទ' : 'Close'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {showImage && (
          <div className="khb-popup__media">
            <img src={ad.imageUrl} alt="" decoding="async" />
          </div>
        )}
        <div className="khb-popup__content">
          {badge && <span className="khb-popup__badge">{badge}</span>}
          <h2 id={titleId} className="khb-popup__title">{title}</h2>
          {body && <p className="khb-popup__body">{body}</p>}
          <div className="khb-popup__actions">
            {cta}
            {dismiss && (
              <button type="button" className="khb-popup__dismiss" onClick={onClose}>{dismiss}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface PopupAdsHostProps {
  /** Popups the server already filtered for this page (enabled, in schedule, targeted). */
  ads?: PopupAd[];
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
  const viewedRef = useRef(false);

  // Decide after mount only: storage, device and time must not affect the server HTML.
  // The decision runs on the next tick so the effect itself never sets state.
  useEffect(() => {
    if (!ads.length || noPopup === '1') return;
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
    const ad = pickPopupToShow(ads, defaultPopupAdsSettings, {
      nowMs: Date.now(),
      device,
      lang: langRef.current,
      leadSent: readLocal(popupStorageKeys.leadSent) === '1',
      lastAnyShownAt: numberOrUndefined(readLocal(popupStorageKeys.lastAny)),
      shownAt: (id) => numberOrUndefined(readLocal(popupStorageKeys.shown(id))),
      shownThisSession: (id) => readSession(popupStorageKeys.sessionShown(id)) === '1',
    });
    if (!ad) return;
    setActive(ad);

    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      cleanups.forEach((c) => c());
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

    const trigger = ad.trigger;
    if (trigger.type === 'immediate') {
      fire();
    } else if (trigger.type === 'delay') {
      afterMs((trigger.seconds ?? 8) * 1000);
    } else if (trigger.type === 'scroll') {
      onScrollPast(trigger.percent ?? 40);
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
      trackClientEvent(pageSlug, 'popup_view', { adId: active.id, adName: active.name, template: active.template, trigger: active.trigger.type }, langRef.current);
    }
    const lock = active.template !== 'banner';
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
  }, [active, preview, pageSlug]);

  const onCta = useCallback((href: string | null) => {
    if (!active) return;
    if (!preview) {
      trackClientEvent(pageSlug, 'popup_click', { adId: active.id, adName: active.name, template: active.template, action: active.cta.action }, langRef.current);
    }
    close('click');
    if (preview) return;
    if (href === '#register') {
      const target = document.getElementById('register');
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

  if (!active || !visible) return null;
  return (
    <PopupAdCard
      ad={active}
      lang={lang}
      pageSlug={pageSlug}
      open={visible}
      onClose={() => close('close')}
      onCta={onCta}
    />
  );
}
