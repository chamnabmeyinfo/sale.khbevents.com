'use client';

import React from 'react';
import type { LandingPage, PopupAd } from '@/lib/types';
import type { Lang } from '@/lib/builder';
import { normalizeBuilderDoc } from '@/lib/builder';
import LandingPageTracking, { trackLandingEvent } from '@/components/common/LandingPageTracking';
import PopupAdsHost from '@/components/common/PopupAds';
import { useStoredChoice, useUrlParam } from '@/lib/use-browser-state';
import { BlockView, BuilderRoot, useNow } from './BuilderBlocks';

/** Public view of a page made with the drag-and-drop builder. */
export default function BuilderPageView({ page, initialLang = 'en', popupAds, popupPreviewId }: {
  page: LandingPage;
  initialLang?: Lang;
  popupAds?: PopupAd[];
  popupPreviewId?: string;
}) {
  const doc = normalizeBuilderDoc(page.builder);
  const urlLang = useUrlParam('lang');
  const [storedLang, setStoredLang] = useStoredChoice<Lang>('khb_lang', ['en', 'kh'] as const, initialLang);
  const lang: Lang = urlLang === 'kh' || urlLang === 'en' ? urlLang : storedLang;
  const nowMs = useNow();

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
      <LandingPageTracking page={page} lang={lang} />
      <PopupAdsHost ads={popupAds} previewId={popupPreviewId} pageSlug={page.slug} lang={lang} />
      <div className="kb-langbar" role="group" aria-label="Language">
        <button type="button" aria-pressed={lang === 'en'} onClick={() => switchLang('en')}>EN</button>
        <button type="button" aria-pressed={lang === 'kh'} onClick={() => switchLang('kh')}>ខ្មែរ</button>
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
              nowMs,
              onCta: (b) => trackLandingEvent(page, doc.offer.cta.action === 'telegram' ? 'telegram_click' : 'cta_click', { placement: `builder_${b.type}` }, lang),
            }}
          />
        ))}
      </main>
    </BuilderRoot>
  );
}
