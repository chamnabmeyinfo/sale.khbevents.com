'use client';

import React, { useEffect, useState } from 'react';
import type { BuilderBlock, BuilderBrand, BuilderOffer, FaqBlock, HeroBlock, Lang, OfferBlock } from '@/lib/builder';
import { countdown, discountPercent, formatPrice, offerCtaHref, pick, stockTakenPercent } from '@/lib/builder';

/**
 * Renders builder components. The same code draws the editor canvas and the
 * public page, so the editor preview is exactly what visitors see. Layout
 * responds to the width of `.kb-page` (a CSS container), not the window, so
 * the editor's phone preview is a true phone layout.
 */

export interface RenderContext {
  offer: BuilderOffer;
  brand: BuilderBrand;
  lang: Lang;
  slug: string;
  /** Current time for countdowns; null until mounted (keeps server HTML stable). */
  nowMs: number | null;
  /** Editor mode: links do not navigate. */
  editing?: boolean;
  onCta?: (block: BuilderBlock) => void;
}

const UI = {
  en: { save: 'Save {n}%', left: '{n} {label}', endsIn: 'Offer ends in', d: 'days', h: 'hours', m: 'min', s: 'sec', from: 'Price' },
  kh: { save: 'សន្សំ {n}%', left: '{n} {label}', endsIn: 'ការផ្តល់ជូនបញ្ចប់ក្នុង', d: 'ថ្ងៃ', h: 'ម៉ោង', m: 'នាទី', s: 'វិនាទី', from: 'តម្លៃ' },
} as const;

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

/** Ticks once a second after mount; null during server render and hydration. */
export function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  return now;
}

function sectionClass(block: BuilderBlock): string {
  const s = block.style;
  return [
    'kb-section',
    `kb-${block.type}`,
    `kb-${block.type}--${block.variant}`,
    `kb-theme-${s.theme}`,
    `kb-align-${s.align}`,
    `kb-space-${s.spacing}`,
    s.bgImage ? 'kb-has-bg' : '',
  ].filter(Boolean).join(' ');
}

function SectionBackground({ image }: { image?: string }) {
  if (!image) return null;
  return (
    <div className="kb-bg" aria-hidden="true">
      <img src={image} alt="" loading="lazy" decoding="async" />
    </div>
  );
}

function CtaButton({ label, block, ctx, variant = 'primary' }: { label: string; block: BuilderBlock; ctx: RenderContext; variant?: 'primary' | 'block' }) {
  if (!label) return null;
  const href = offerCtaHref(ctx.offer, ctx.slug);
  const external = ctx.offer.cta.action === 'telegram' || /^https?:/i.test(href);
  return (
    <a
      className={`kb-btn kb-btn--${variant}`}
      href={ctx.editing ? undefined : href}
      target={!ctx.editing && external ? '_blank' : undefined}
      rel={!ctx.editing && external ? 'noreferrer' : undefined}
      role={ctx.editing ? 'button' : undefined}
      onClick={(e) => {
        if (ctx.editing) {
          e.preventDefault();
          return;
        }
        ctx.onCta?.(block);
      }}
    >
      {ctx.offer.cta.action === 'telegram' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
        </svg>
      )}
      <span>{label}</span>
    </a>
  );
}

function PriceLine({ ctx, size = 'md' }: { ctx: RenderContext; size?: 'md' | 'lg' }) {
  const { offer, lang } = ctx;
  if (offer.price === null) return null;
  const off = discountPercent(offer);
  return (
    <div className={`kb-price kb-price--${size}`}>
      <span className="kb-price__now">{formatPrice(offer.price, offer.currency)}</span>
      {off > 0 && <span className="kb-price__was">{formatPrice(offer.compareAtPrice, offer.currency)}</span>}
      {off > 0 && <span className="kb-price__save">{fill(UI[lang].save, { n: off })}</span>}
      {offer.priceNote && <span className="kb-price__note">{pick(offer.priceNote, lang)}</span>}
    </div>
  );
}

function StockBar({ ctx }: { ctx: RenderContext }) {
  const { offer, lang } = ctx;
  const taken = stockTakenPercent(offer);
  if (taken === null || offer.stockLeft === null) return null;
  return (
    <div className="kb-stock">
      <div className="kb-stock__label">{fill(UI[lang].left, { n: offer.stockLeft, label: pick(offer.stockLabel, lang) })}</div>
      <div className="kb-stock__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={taken}>
        <div className="kb-stock__fill" style={{ width: `${taken}%` }} />
      </div>
    </div>
  );
}

function Countdown({ ctx, compact = false }: { ctx: RenderContext; compact?: boolean }) {
  const { offer, lang, nowMs } = ctx;
  if (!offer.deadline) return null;
  // Before mount the numbers are unknown: reserve the space so nothing jumps.
  const c = nowMs === null ? null : countdown(offer.deadline, nowMs);
  if (c && c.ended) return null;
  const t = UI[lang];
  const parts: Array<[number | null, string]> = [
    [c ? c.days : null, t.d],
    [c ? c.hours : null, t.h],
    [c ? c.minutes : null, t.m],
    [c ? c.seconds : null, t.s],
  ];
  return (
    <div className={`kb-countdown${compact ? ' kb-countdown--compact' : ''}`}>
      <div className="kb-countdown__label">{t.endsIn}</div>
      <div className="kb-countdown__boxes">
        {parts.map(([value, unit]) => (
          <div className="kb-countdown__box" key={unit}>
            <span className="kb-countdown__num" suppressHydrationWarning>{value === null ? '–' : String(value).padStart(2, '0')}</span>
            <span className="kb-countdown__unit">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero({ block, ctx }: { block: HeroBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const fullbleed = block.variant === 'fullbleed';
  const priceChip = ctx.offer.price !== null;
  return (
    <section className={sectionClass(block)}>
      {fullbleed ? <SectionBackground image={block.image || block.style.bgImage} /> : <SectionBackground image={block.style.bgImage} />}
      <div className="kb-container kb-hero__grid">
        <div className="kb-hero__copy">
          {block.badge && <span className="kb-badge">{pick(block.badge, lang)}</span>}
          <h1 className="kb-hero__title">{pick(block.headline, lang)}</h1>
          {block.sub && <p className="kb-hero__sub">{pick(block.sub, lang)}</p>}
          <div className="kb-hero__actions">
            <CtaButton label={pick(block.ctaLabel, lang)} block={block} ctx={ctx} />
            {priceChip && <PriceLine ctx={ctx} />}
          </div>
          {block.riskNote && (
            <p className="kb-risk">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              <span>{pick(block.riskNote, lang)}</span>
            </p>
          )}
        </div>
        {!fullbleed && (
          <div className="kb-hero__media">
            {block.image ? <img src={block.image} alt="" decoding="async" /> : <div className="kb-hero__placeholder" aria-hidden="true" />}
          </div>
        )}
      </div>
    </section>
  );
}

function Offer({ block, ctx }: { block: OfferBlock; ctx: RenderContext }) {
  const { lang, offer } = ctx;
  const name = pick(offer.name, lang);
  const features = block.features.map((f) => pick(f, lang)).filter(Boolean);
  if (block.variant === 'banner') {
    return (
      <section className={sectionClass(block)}>
        <SectionBackground image={block.style.bgImage} />
        <div className="kb-container kb-offer-banner">
          <div className="kb-offer-banner__main">
            <div className="kb-offer-banner__title">{pick(block.title, lang) || name}</div>
            <PriceLine ctx={ctx} />
            <StockBar ctx={ctx} />
          </div>
          <Countdown ctx={ctx} compact />
          <div className="kb-offer-banner__cta">
            <CtaButton label={pick(block.ctaLabel, lang)} block={block} ctx={ctx} />
            {block.note && <p className="kb-note">{pick(block.note, lang)}</p>}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className={sectionClass(block)}>
      <SectionBackground image={block.style.bgImage} />
      <div className="kb-container">
        <div className="kb-offer-card">
          {name && <div className="kb-offer-card__name">{name}</div>}
          <h2 className="kb-offer-card__title">{pick(block.title, lang)}</h2>
          <PriceLine ctx={ctx} size="lg" />
          <StockBar ctx={ctx} />
          <Countdown ctx={ctx} />
          {features.length > 0 && (
            <ul className="kb-features">
              {features.map((f, i) => (
                <li key={i}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
          <CtaButton label={pick(block.ctaLabel, lang)} block={block} ctx={ctx} variant="block" />
          {block.note && <p className="kb-note">{pick(block.note, lang)}</p>}
        </div>
      </div>
    </section>
  );
}

function Faq({ block, ctx }: { block: FaqBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const items = block.items.filter((i) => pick(i.q, lang));
  return (
    <section className={sectionClass(block)}>
      <SectionBackground image={block.style.bgImage} />
      <div className="kb-container">
        <h2 className="kb-section-title">{pick(block.title, lang)}</h2>
        {block.variant === 'columns' ? (
          <div className="kb-faq-cols">
            {items.map((it, i) => (
              <div className="kb-faq-col" key={i}>
                <h3>{pick(it.q, lang)}</h3>
                <p>{pick(it.a, lang)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="kb-faq-list">
            {items.map((it, i) => (
              <details className="kb-faq-item" key={i} open={ctx.editing && i === 0 ? true : undefined}>
                <summary>
                  <span>{pick(it.q, lang)}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                </summary>
                <p>{pick(it.a, lang)}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function BlockView({ block, ctx }: { block: BuilderBlock; ctx: RenderContext }) {
  switch (block.type) {
    case 'hero':
      return <Hero block={block} ctx={ctx} />;
    case 'offer':
      return <Offer block={block} ctx={ctx} />;
    case 'faq':
      return <Faq block={block} ctx={ctx} />;
    default:
      return null;
  }
}

/** The page root: brand tokens as CSS variables, Khmer font, width container. */
export function BuilderRoot({ brand, lang, className = '', children }: { brand: BuilderBrand; lang: Lang; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`kb-page kb-radius-${brand.radius}${lang === 'kh' ? ' kb-lang-kh' : ''} ${className}`.trim()}
      style={{ '--kb-accent': brand.accent } as React.CSSProperties}
      lang={lang === 'kh' ? 'km' : 'en'}
    >
      {children}
    </div>
  );
}
