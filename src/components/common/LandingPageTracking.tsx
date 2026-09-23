'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { LandingPage, TrackingEventType } from '@/lib/types';

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
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) || window.innerWidth < 768) {
    return 'mobile';
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
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      utmSource: p.get('utm_source') || undefined,
      utmMedium: p.get('utm_medium') || undefined,
      utmCampaign: p.get('utm_campaign') || undefined,
      utmContent: p.get('utm_content') || undefined,
      utmTerm: p.get('utm_term') || undefined,
      gclid: p.get('gclid') || undefined,
      fbclid: p.get('fbclid') || undefined,
      ttclid: p.get('ttclid') || undefined,
    };
  } catch {
    return {};
  }
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
    eventData,
    referrer: document.referrer || '',
    ...utms,
    deviceType: getDeviceType(),
    browser: navigator.userAgent,
    lang: lang || (document.documentElement.lang === 'kh' ? 'kh' : 'en'),
  };

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
      win.fbq('track', 'Lead', {
        content_name: page.title,
        content_category: page.category,
        value: eventData?.value || page.urgency?.earlyBirdPrice || 499,
        currency: 'USD',
      });
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
        value: eventData?.value || page.urgency?.earlyBirdPrice || 499,
        currency: 'USD',
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
      win.ttq.track('SubmitForm', {
        contents: [{ content_id: slug, content_name: page.title }],
        value: eventData?.value || 499,
        currency: 'USD',
      });
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
}

export default function LandingPageTracking({ page, lang = 'en' }: LandingPageTrackingProps) {
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
              fbq('init', '${tracking.facebookPixelId}');
              fbq('track', 'PageView');
              fbq('track', 'ViewContent', { content_name: '${page.title?.replace(/'/g, "\\'")}', value: 499, currency: 'USD' });
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${tracking.facebookPixelId}&ev=PageView&noscript=1`}
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
              })(window,document,'script','dataLayer','${tracking.gtmContainerId}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${tracking.gtmContainerId}`}
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
            src={`https://www.googletagmanager.com/gtag/js?id=${tracking.ga4MeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id={`ga4-init-${page.slug}`} strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${tracking.ga4MeasurementId}', {
                page_title: '${page.title?.replace(/'/g, "\\'")}',
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
              ttq.load('${tracking.tiktokPixelId}');
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
