'use client';

import React from 'react';
import type { LandingPage, PopupAd } from '@/lib/types';
import type { Lang } from '@/lib/builder';
import { ctaOpensTelegram, effectiveOffer, normalizeBuilderDoc } from '@/lib/builder';
import LandingPageTracking, { trackLandingEvent } from '@/components/common/LandingPageTracking';
import PopupAdsHost from '@/components/common/PopupAds';
import { popupStorageKeys } from '@/lib/popup-ads';
import { useStoredChoice, useUrlParam } from '@/lib/use-browser-state';
import { BlockView, BuilderRoot, useNow } from './BuilderBlocks';

/** Public view of a page made with the drag-and-drop builder. */
export default function BuilderPageView({ page, initialLang = 'en', serverNowMs, popupAds, popupPreviewId }: {
  page: LandingPage;
  /** From ?lang=, else the page's default language. */
  initialLang?: Lang;
  /** Server render time, so prices match between the server HTML and the first browser render. */
  serverNowMs?: number;
  popupAds?: PopupAd[];
  popupPreviewId?: string;
}) {
  const doc = normalizeBuilderDoc(page.builder);
  const urlLang = useUrlParam('lang');
  const [storedLang, setStoredLang] = useStoredChoice<Lang>('khb_lang', ['en', 'kh'] as const, initialLang);
  const lang: Lang = urlLang === 'kh' || urlLang === 'en' ? urlLang : storedLang;
  const nowMs = useNow();

  const priceNow = effectiveOffer(doc.offer, nowMs ?? serverNowMs ?? null).price;
  const termsBlock = doc.blocks.find((b) => b.type === 'terms');
  const terms = termsBlock && termsBlock.type === 'terms' ? { id: `terms-${termsBlock.id}`, updated: termsBlock.updated } : undefined;
  const leadValue = doc.offer.currency === 'USD' && priceNow ? priceNow : undefined;

  const switchLang = (next: Lang) => {
    setStoredLang(next);
    const u = new URL(window.location.href);
    u.searchParams.set('lang', next);
    window.history.replaceState(null, '', u.toString());
    window.dispatchEvent(new PopStateEvent('popstate'));
    trackLandingEvent(page, 'lang_toggle', { to: next }, next);
  };

  return (
    <BuilderRoot brand={doc.brand} lang={lang}>
      <LandingPageTracking page={page} lang={lang} sections={doc.blocks.map((b) => b.id)} />
      <PopupAdsHost ads={popupAds} previewId={popupPreviewId} pageSlug={page.slug} lang={lang} />
      <div className="kb-langbar" role="group" aria-label="Language">
        <button type="button" aria-pressed={lang === 'en'} onClick={() => switchLang('en')}>EN</button>
        <button type="button" aria-pressed={lang === 'kh'} onClick={() => switchLang('kh')}>ខ្មែរ</button>
        <a
          className="kb-langbar__print"
          href={`/${page.slug}/print?lang=${lang}`}
          aria-label={lang === 'kh' ? 'បោះពុម្ពកម្មវិធី' : 'Print agenda'}
          title={lang === 'kh' ? 'បោះពុម្ពកម្មវិធី' : 'Print agenda'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="7" />
          </svg>
        </a>
      </div>
      <main>
        {doc.blocks.map((block) => (
          <BlockView
            key={block.id}
            block={block}
            ctx={{
              offer: doc.offer,
              brand: doc.brand,
              lang,
              slug: page.slug,
              terms,
              nowMs,
              serverNowMs,
              onCta: (b) => trackLandingEvent(page, ctaOpensTelegram(doc.offer) ? 'telegram_click' : 'cta_click', { placement: `builder_${b.type}` }, lang),
              onLead: (b, eventId) => {
                // No names or phone numbers in tracking: the lead itself is in Leads.
                trackLandingEvent(page, 'form_submit', { placement: `builder_${b.type}`, ...(leadValue ? { value: leadValue } : {}), ...(eventId ? { eventId } : {}) }, lang);
                try {
                  localStorage.setItem(popupStorageKeys.leadSent, '1');
                } catch {}
              },
            }}
          />
        ))}
      </main>
    </BuilderRoot>
  );
}
