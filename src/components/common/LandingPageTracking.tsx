'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { LandingPage, TrackingEventType } from '@/lib/types';
import { takePopupLeads } from '@/components/common/popup-attribution';
import { getAttribution, getFirstTouch, getVisitor } from '@/components/common/attribution';

// Helper: Get or create session ID
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let sid = sessionStorage.getItem('khb_sid');
    if (!sid) {
      sid = `sid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('khb_sid', sid);
    }
    return sid;
  } catch {
    return `sid_fallback_${Date.now()}`;
  }
}

// Helper: Detect device type
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  // Phones first: app browsers such as Telegram add "Telegram-Android/…" after "Mobile",
  // which the old "android without mobi after it" test took for a tablet.
  if (/mobi|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) || window.innerWidth < 768) {
    return 'mobile';
  }
  if (/android/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

// Helper: Parse UTM and Marketing query parameters
export function getMarketingParams(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
} {
  if (typeof window === 'undefined') return {};
  // The visit keeps the campaign it landed with (see attribution.ts), so later events
  // and the lead form still credit the ad after the address loses its utm_ tags.
  const a = getAttribution();
  return {
    utmSource: a.utmSource,
    utmMedium: a.utmMedium,
    utmCampaign: a.utmCampaign,
    utmContent: a.utmContent,
    utmTerm: a.utmTerm,
    gclid: a.gclid,
    fbclid: a.fbclid,
    ttclid: a.ttclid,
  };
}

/**
 * What one visit did, sent as a single "session_summary" when the visitor leaves or
 * switches away (and refreshed if they come back). The campaign report is built from
 * these: engagement, how far they read, which sections they reached, what they clicked.
 */
interface VisitState {
  slug: string;
  startedAt: number;
  visibleSince: number | null;
  activeMs: number;
  lastInput: number;
  maxScroll: number;
  cta: number;
  telegram: number;
  formStarted: boolean;
  lead: boolean;
  langToggles: number;
  sections: string[];
  seen: Set<string>;
  maxSection: number;
}

let visit: VisitState | null = null;
const IDLE_MS = 60_000;

function accrueActive(now = Date.now()) {
  if (!visit || visit.visibleSince === null) return;
  // Time with the page open and the visitor active in the last minute.
  const until = Math.min(now, visit.lastInput + IDLE_MS);
  if (until > visit.visibleSince) visit.activeMs += until - visit.visibleSince;
  visit.visibleSince = now;
}

function noteVisitEvent(eventType: TrackingEventType) {
  if (!visit) return;
  if (eventType === 'cta_click') visit.cta++;
  else if (eventType === 'telegram_click') visit.telegram++;
  else if (eventType === 'form_submit') { visit.lead = true; visit.formStarted = true; }
  else if (eventType === 'lang_toggle') visit.langToggles++;
}

function sendVisitSummary(lang?: 'en' | 'kh') {
  if (!visit) return;
  accrueActive();
  const ft = getFirstTouch();
  trackClientEvent(visit.slug, 'session_summary', {
    activeSeconds: Math.round(visit.activeMs / 1000),
    maxScroll: visit.maxScroll,
    cta: visit.cta,
    telegram: visit.telegram,
    formStarted: visit.formStarted,
    lead: visit.lead,
    langToggles: visit.langToggles,
    seen: Array.from(visit.seen).slice(0, 40),
    maxSection: visit.maxSection,
    sectionCount: visit.sections.length,
    firstCampaign: ft?.utmCampaign,
    firstSource: ft?.utmSource,
  }, lang);
}

function visitorFields() {
  const v = getVisitor(getSessionId());
  return { visitorId: v.visitorId, returning: v.returning };
}

// Helper: Send event to /api/track via beacon or fetch
export function trackClientEvent(
  pageSlug: string,
  eventType: TrackingEventType,
  eventData?: Record<string, unknown>,
  lang?: 'en' | 'kh'
) {
  if (typeof window === 'undefined' || !pageSlug) return;
  const utms = getMarketingParams();
  const payload = {
    slug: pageSlug,
    eventType,
    sessionId: getSessionId(),
    ...visitorFields(),
    eventData,
    referrer: document.referrer || '',
    ...utms,
    deviceType: getDeviceType(),
    browser: navigator.userAgent,
    lang: lang || (document.documentElement.lang === 'kh' ? 'kh' : 'en'),
  };

  noteVisitEvent(eventType);
  // A form sent after seeing a popup is credited to that popup in the popup analytics.
  if (eventType === 'form_submit') {
    for (const lead of takePopupLeads()) trackClientEvent(pageSlug, 'popup_lead', lead, lang);
  }

  const bodyStr = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([bodyStr], { type: 'application/json' });
      navigator.sendBeacon('/api/track', blob);
      return;
    } catch {
      // fallback to fetch
    }
  }

  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: bodyStr,
    keepalive: true,
  }).catch(() => {});
}

// Unified Tracker for internal AND external third-party events
/**
 * A value as a JavaScript string literal for the inline pixel snippets below.
 * `<` is escaped too, so an admin-entered value can never close the <script>.
 */
function jsString(value: string | undefined): string {
  return JSON.stringify(value ?? '').replace(/</g, '\\u003c');
}

type PixelFn = (...args: unknown[]) => void;

/** Globals installed by the Meta, Google and TikTok pixel snippets, when present. */
interface TrackingWindow extends Window {
  fbq?: PixelFn;
  gtag?: PixelFn;
  ttq?: { track: PixelFn };
  dataLayer?: unknown[];
}

export function trackLandingEvent(
  page?: LandingPage,
  eventType?: TrackingEventType,
  eventData?: Record<string, unknown>,
  lang?: 'en' | 'kh'
) {
  if (!page) return;
  const slug = page.slug;

  // 1. Internal tracking beacon
  if (eventType) {
    trackClientEvent(slug, eventType, eventData, lang);
  }

  // 2. External Third-Party Pixels
  if (typeof window === 'undefined') return;
  const win = window as TrackingWindow;
  const tracking = page.tracking;

  // Meta (Facebook) Pixel
  if (tracking?.facebookPixelId && tracking.facebookPixelEnabled !== false && typeof win.fbq === 'function') {
    if (eventType === 'form_submit') {
      const lead = {
        content_name: page.title,
        content_category: page.category,
        ...(eventData?.value ? { value: eventData.value, currency: 'USD' } : {}),
      };
      // The same id is sent by the server (Conversions API), so Meta counts the lead once.
      if (typeof eventData?.eventId === 'string') win.fbq('track', 'Lead', lead, { eventID: eventData.eventId });
      else win.fbq('track', 'Lead', lead);
    } else if (eventType === 'telegram_click') {
      win.fbq('track', 'Contact', {
        content_name: page.title,
        contact_channel: 'Telegram',
      });
    } else if (eventType === 'seat_select') {
      win.fbq('track', 'InitiateCheckout', {
        content_name: page.title,
        seat_number: eventData?.seat,
        value: page.urgency?.earlyBirdPrice || 499,
        currency: 'USD',
      });
    } else if (eventType === 'cta_click') {
      win.fbq('trackCustom', 'CtaClick', {
        content_name: page.title,
        cta_label: eventData?.label || 'Reserve VIP Pass',
      });
    }
  }

  // Google Analytics 4 (gtag)
  if (tracking?.ga4MeasurementId && tracking.ga4Enabled !== false && typeof win.gtag === 'function') {
    if (eventType === 'form_submit') {
      win.gtag('event', 'generate_lead', {
        page_title: page.title,
        ...(eventData?.value ? { value: eventData.value, currency: 'USD' } : {}),
      });
    } else if (eventType === 'telegram_click') {
      win.gtag('event', 'contact', {
        event_category: 'engagement',
        event_label: 'Telegram Inquiry',
      });
    } else if (eventType === 'cta_click' || eventType === 'seat_select') {
      win.gtag('event', 'select_content', {
        content_type: 'seat',
        item_id: eventData?.seat || eventData?.label,
      });
    }
  }

  // Google Tag Manager dataLayer
  if (tracking?.gtmContainerId && tracking.gtmEnabled !== false) {
    win.dataLayer = win.dataLayer || [];
    win.dataLayer.push({
      event: `khb_${eventType}`,
      pageSlug: slug,
      pageTitle: page.title,
      ...eventData,
    });
  }

  // TikTok Pixel
  if (tracking?.tiktokPixelId && tracking.tiktokPixelEnabled !== false && typeof win.ttq?.track === 'function') {
    if (eventType === 'form_submit') {
      const lead = {
        contents: [{ content_id: slug, content_name: page.title }],
        ...(eventData?.value ? { value: eventData.value, currency: 'USD' } : {}),
      };
      // Matching event_id with the Events API sent by the server: counted once.
      if (typeof eventData?.eventId === 'string') win.ttq.track('SubmitForm', lead, { event_id: eventData.eventId });
      else win.ttq.track('SubmitForm', lead);
    } else if (eventType === 'telegram_click') {
      win.ttq.track('Contact');
    } else if (eventType === 'cta_click') {
      win.ttq.track('ClickButton', { button_name: eventData?.label });
    }
  }
}

interface LandingPageTrackingProps {
  page?: LandingPage;
  lang?: 'en' | 'kh';
  /** Builder section ids in page order, to report how far visitors read. */
  sections?: string[];
}

export default function LandingPageTracking({ page, lang = 'en', sections }: LandingPageTrackingProps) {
  const scrollMilestones = useRef<Set<number>>(new Set());

  // ── First-party Page View & Scroll Depth Tracking
  useEffect(() => {
    if (!page?.slug) return;

    // Record initial page view
    trackClientEvent(page.slug, 'page_view', undefined, lang);

    // Scroll depth tracker
    const handleScroll = () => {
      const h = document.documentElement;
      const b = document.body;
      const st = 'scrollTop';
      const sh = 'scrollHeight';
      const percent = Math.round(((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100);

      [25, 50, 75, 100].forEach((milestone) => {
        if (percent >= milestone && !scrollMilestones.current.has(milestone)) {
          scrollMilestones.current.add(milestone);
          trackClientEvent(page.slug, 'scroll_depth', { depth: milestone }, lang);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page?.slug, lang]);

  // ── Visit summary: active time, deepest scroll, sections reached, form started.
  const sectionKey = (sections || []).join(',');
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => {
    if (!page?.slug) return;
    const now = Date.now();
    visit = {
      slug: page.slug,
      startedAt: now,
      visibleSince: document.visibilityState === 'visible' ? now : null,
      activeMs: 0,
      lastInput: now,
      maxScroll: 0,
      cta: 0,
      telegram: 0,
      formStarted: false,
      lead: false,
      langToggles: 0,
      sections: sectionKey ? sectionKey.split(',') : [],
      seen: new Set(),
      maxSection: -1,
    };
    const state = visit;
    let dirty = false;
    const onInput = () => {
      accrueActive();
      state.lastInput = Date.now();
    };
    const onScroll = () => {
      onInput();
      const h = document.documentElement;
      const range = h.scrollHeight - h.clientHeight;
      const pct = range > 0 ? Math.round((h.scrollTop / range) * 100) : 100;
      if (pct > state.maxScroll) { state.maxScroll = Math.min(100, pct); dirty = true; }
    };
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.('form') && !state.formStarted) { state.formStarted = true; dirty = true; }
    };
    const flush = () => {
      if (dirty || state.activeMs > 0) sendVisitSummary(langRef.current);
      dirty = false;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        accrueActive();
        state.visibleSince = null;
        flush();
      } else {
        state.visibleSince = Date.now();
        state.lastInput = Date.now();
      }
    };

    // Sections: the page's top-level blocks in order, matched to the builder ids.
    const main = document.querySelector('main');
    const blocks = main ? Array.from(main.children) : [];
    const io = typeof IntersectionObserver === 'function' && state.sections.length
      ? new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const index = blocks.indexOf(entry.target);
            const id = state.sections[index];
            if (!id || state.seen.has(id)) continue;
            state.seen.add(id);
            if (index > state.maxSection) state.maxSection = index;
            dirty = true;
          }
        }, { threshold: 0.35 })
      : null;
    blocks.forEach((b) => io?.observe(b));

    // A first summary after 15 seconds, for visitors whose browser never reports leaving.
    const early = window.setTimeout(flush, 15_000);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', onInput, { passive: true });
    window.addEventListener('keydown', onInput);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearTimeout(early);
      io?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', onInput);
      window.removeEventListener('keydown', onInput);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush();
      if (visit === state) visit = null;
    };
  }, [page?.slug, sectionKey]);

  if (!page) return null;
  const tracking = page.tracking;

  return (
    <>
      {/* ── 1. Meta / Facebook Pixel ── */}
      {tracking?.facebookPixelId && tracking.facebookPixelEnabled !== false && (
        <>
          <Script id={`fb-pixel-${page.slug}`} strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', ${jsString(tracking.facebookPixelId)});
              fbq('track', 'PageView');
              fbq('track', 'ViewContent', { content_name: ${jsString(page.title)} });
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(tracking.facebookPixelId || '')}&ev=PageView&noscript=1`}
              alt="fb-pixel"
            />
          </noscript>
        </>
      )}

      {/* ── 2. Google Tag Manager (GTM) ── */}
      {tracking?.gtmContainerId && tracking.gtmEnabled !== false && (
        <>
          <Script id={`gtm-script-${page.slug}`} strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer',${jsString(tracking.gtmContainerId)});
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(tracking.gtmContainerId || '')}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* ── 3. Google Analytics 4 (GA4) ── */}
      {tracking?.ga4MeasurementId && tracking.ga4Enabled !== false && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tracking.ga4MeasurementId || '')}`}
            strategy="afterInteractive"
          />
          <Script id={`ga4-init-${page.slug}`} strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', ${jsString(tracking.ga4MeasurementId)}, {
                page_title: ${jsString(page.title)},
                page_path: window.location.pathname
              });
            `}
          </Script>
        </>
      )}

      {/* ── 4. TikTok Pixel ── */}
      {tracking?.tiktokPixelId && tracking.tiktokPixelEnabled !== false && (
        <Script id={`tiktok-pixel-${page.slug}`} strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load(${jsString(tracking.tiktokPixelId)});
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* ── 5. Custom <head> Scripts ── */}
      {tracking?.customHeadScript && (
        <Script id={`custom-head-${page.slug}`} strategy="afterInteractive">
          {tracking.customHeadScript.replace(/<\/?script[^>]*>/gi, '')}
        </Script>
      )}

      {/* ── 6. Custom <body> Scripts / Widgets ── */}
      {tracking?.customBodyScript && (
        <div
          id={`custom-body-container-${page.slug}`}
          dangerouslySetInnerHTML={{ __html: tracking.customBodyScript }}
        />
      )}
    </>
  );
}
