'use client';

import Script from 'next/script';
import { normalizeGa4Id } from '@/lib/ga4';
import type { TrackingEventType } from '@/lib/types';

/** A value as a JavaScript string literal inside an inline script (`<` escaped). */
function jsString(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

type GaWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  __khbGa?: Record<string, 1>;
};

/**
 * Loads Google Analytics 4 for one measurement ID. The site-wide ID (Settings) and a page's own
 * ID (page → Tracking & Pixels) both use this, and it is safe to render twice: gtag.js is loaded
 * once and each ID is configured once, so the same ID in both places never counts a view twice.
 */
export function Ga4Tag({ id }: { id?: string }) {
  const clean = normalizeGa4Id(id || '');
  if (!clean) return null;
  return (
    <Script id={`ga4-${clean}`} strategy="afterInteractive">
      {`
        (function (w, d, id) {
          w.dataLayer = w.dataLayer || [];
          w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
          w.__khbGa = w.__khbGa || {};
          if (w.__khbGa[id]) return;
          w.__khbGa[id] = 1;
          if (!w.__khbGaLoaded) {
            w.__khbGaLoaded = 1;
            w.gtag('js', new Date());
            var s = d.createElement('script');
            s.async = true;
            s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
            d.head.appendChild(s);
          }
          w.gtag('config', id);
        })(window, document, ${jsString(clean)});
      `}
    </Script>
  );
}

/**
 * Sends the matching GA4 event to every configured measurement ID: generate_lead for a form,
 * contact for a Telegram click, select_content for a button or seat. Never personal data.
 */
export function gaEvent(eventType: TrackingEventType | undefined, data: { pageTitle?: string; value?: unknown; label?: unknown; seat?: unknown } = {}): void {
  if (typeof window === 'undefined') return;
  const w = window as GaWindow;
  if (typeof w.gtag !== 'function' || !w.__khbGa || !Object.keys(w.__khbGa).length) return;
  if (eventType === 'form_submit') {
    w.gtag('event', 'generate_lead', {
      page_title: data.pageTitle,
      ...(data.value ? { value: data.value, currency: 'USD' } : {}),
    });
  } else if (eventType === 'telegram_click') {
    w.gtag('event', 'contact', { event_category: 'engagement', event_label: 'Telegram Inquiry' });
  } else if (eventType === 'cta_click' || eventType === 'seat_select') {
    w.gtag('event', 'select_content', { content_type: eventType === 'seat_select' ? 'seat' : 'button', item_id: data.seat || data.label });
  }
}
