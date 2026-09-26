'use client';

import React, { useEffect, useRef, useState } from 'react';
import BackgroundVideo from './BackgroundVideo';
import { leadAttribution, newEventId } from '@/components/common/attribution';
import { getSessionId } from '@/components/common/LandingPageTracking';
import { BenefitIconSvg } from './icons';
export { BenefitIconSvg };
import type {
  BenefitsBlock,
  BuilderBlock,
  ContactBlock,
  BuilderBrand,
  BuilderOffer,
  FaqBlock,
  TermsBlock,
  FinalCtaBlock,
  FormBlock,
  GalleryBlock,
  HeroBlock,
  IncludedBlock,
  InclusionsBlock,
  Lang,
  OfferBlock,
  StepsBlock,
} from '@/lib/builder';
import { parseVideoSource } from '@/lib/video-embed';
import { DEFAULT_LOGO, type CompanyInfo } from '@/lib/company';
import { countdown, ctaOpensTelegram, discountPercent, effectiveOffer, formatDay, formatPrice, offerCtaHref, pick, safeLink, stockTakenPercent } from '@/lib/builder';

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
  /** Server time of this render, used for prices until the clock ticks (keeps server and browser HTML equal). */
  serverNowMs?: number;
  /** Editor mode: links do not navigate. */
  editing?: boolean;
  onCta?: (block: BuilderBlock) => void;
  /** Called after a form was accepted by the server. */
  /** A lead was sent; eventId is shared with the server's Conversions API call. */
  onLead?: (block: FormBlock, eventId?: string) => void;
  /** The page's Terms & Conditions section, for the form's "I agree" link and the accepted version. */
  terms?: { id: string; updated?: string };
  /** Logo, company name and contacts: the page's own, else the company settings. */
  company?: CompanyInfo;
}

const UI = {
  en: {
    save: 'Save {n}%', left: '{n} {label}', endsIn: 'Offer ends in', d: 'days', h: 'hours', m: 'min', s: 'sec', from: 'Price',
    name: 'Your name', phone: 'Phone or Telegram', email: 'Email (optional)', message: 'Message (optional)',
    sending: 'Sending…', required: 'Please write your name and phone number.', failed: 'Sending failed. Please try again, or use the Telegram button.',
    continueTelegram: 'Continue on Telegram',
    agree: 'I have read and agree to the Terms & Conditions.', mustAgree: 'Please tick the box to agree to the Terms & Conditions.', readTerms: 'Read the terms', updated: 'Last updated: {date}',
    earlyEndsIn: 'Early-bird price ends in', website: 'Official website', choose: 'Choose one',
    addPhotos: 'Add photos in the panel on the right.', openPhoto: 'Open photo', previous: 'Previous', next: 'Next', close: 'Close',
  },
  kh: {
    save: 'សន្សំ {n}%', left: '{n} {label}', endsIn: 'ការផ្តល់ជូនបញ្ចប់ក្នុង', d: 'ថ្ងៃ', h: 'ម៉ោង', m: 'នាទី', s: 'វិនាទី', from: 'តម្លៃ',
    name: 'ឈ្មោះរបស់អ្នក', phone: 'លេខទូរស័ព្ទ ឬ Telegram', email: 'អ៊ីមែល (មិនចាំបាច់)', message: 'សារ (មិនចាំបាច់)',
    sending: 'កំពុងផ្ញើ…', required: 'សូមសរសេរឈ្មោះ និងលេខទូរស័ព្ទរបស់អ្នក។', failed: 'ការផ្ញើមិនបានសម្រេច។ សូមព្យាយាមម្តងទៀត ឬប្រើប៊ូតុង Telegram។',
    continueTelegram: 'បន្តតាម Telegram',
    agree: 'ខ្ញុំបានអាន និងយល់ព្រមតាមលក្ខខណ្ឌ។', mustAgree: 'សូមធីកប្រអប់ ដើម្បីយល់ព្រមតាមលក្ខខណ្ឌ។', readTerms: 'អានលក្ខខណ្ឌ', updated: 'កែប្រែចុងក្រោយ៖ {date}',
    earlyEndsIn: 'តម្លៃពិសេសបញ្ចប់ក្នុងរយៈពេល', website: 'គេហទំព័រផ្លូវការ', choose: 'សូមជ្រើសរើស',
    addPhotos: 'បន្ថែមរូបភាពនៅផ្ទាំងខាងស្តាំ។', openPhoto: 'បើករូបភាព', previous: 'មុន', next: 'បន្ទាប់', close: 'បិទ',
  },
} as const;


const CheckMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
);

const CrossMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
);

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
    s.bgImage || s.bgVideo ? 'kb-has-bg' : '',
  ].filter(Boolean).join(' ');
}

function SectionBackground({ image, video }: { image?: string; video?: string }) {
  const v = video ? parseVideoSource(video) : null;
  if (!image && !v) return null;
  return (
    <div className={`kb-bg${v ? ' kb-bg--video' : ''}`} aria-hidden="true">
      {image && <img className="kb-bg__poster" src={image} alt="" loading="lazy" decoding="async" />}
      {v?.provider === 'file' && (
        <BackgroundVideo className="kb-bg__media kb-bg__video" src={v.src} poster={image} />
      )}
      {v && v.provider !== 'file' && (
        <iframe
          className="kb-bg__media kb-bg__frame"
          src={v.src}
          title=""
          tabIndex={-1}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ '--kb-video-ratio': v.aspect } as React.CSSProperties}
        />
      )}
    </div>
  );
}

/** Position in a list, used to stagger entrance animations. */
const nth = (i: number) => ({ '--kb-i': Math.min(i, 10) }) as React.CSSProperties;

function Photo({ src, className, alt = '', eager = false }: { src?: string; className: string; alt?: string; eager?: boolean }) {
  if (!src) return null;
  return (
    <div className={className}>
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </div>
  );
}

function CtaButton({ label, block, ctx, variant = 'primary' }: { label: string; block: BuilderBlock; ctx: RenderContext; variant?: 'primary' | 'block' }) {
  if (!label) return null;
  const href = offerCtaHref(ctx.offer, ctx.slug);
  const telegram = ctaOpensTelegram(ctx.offer);
  const external = telegram || /^https?:/i.test(href);
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
      {telegram && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
        </svg>
      )}
      <span>{label}</span>
    </a>
  );
}

/** Price and countdown right now: the ticking clock once mounted, else the server's render time. */
const offerNow = (ctx: RenderContext) => effectiveOffer(ctx.offer, ctx.nowMs ?? ctx.serverNowMs ?? null);

function PriceLine({ ctx, size = 'md' }: { ctx: RenderContext; size?: 'md' | 'lg' }) {
  const { offer, lang } = ctx;
  const now = offerNow(ctx);
  if (now.price === null) return null;
  const off = discountPercent(now);
  return (
    <div className={`kb-price kb-price--${size}`}>
      <span className="kb-price__now">{formatPrice(now.price, offer.currency)}</span>
      {off > 0 && <span className="kb-price__was">{formatPrice(now.compareAtPrice, offer.currency)}</span>}
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
  const target = offerNow(ctx);
  if (!target.countdownTo) return null;
  // Before mount the numbers are unknown: reserve the space so nothing jumps.
  const c = nowMs === null ? null : countdown(target.countdownTo, nowMs);
  if (c && c.ended) return null;
  const t = UI[lang];
  const label = target.countdownKind === 'early' ? t.earlyEndsIn : pick(offer.deadlineLabel, lang) || t.endsIn;
  const parts: Array<[number | null, string]> = [
    [c ? c.days : null, t.d],
    [c ? c.hours : null, t.h],
    [c ? c.minutes : null, t.m],
    [c ? c.seconds : null, t.s],
  ];
  return (
    <div className={`kb-countdown${compact ? ' kb-countdown--compact' : ''}`}>
      <div className="kb-countdown__label">{label}</div>
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
    <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
      <SectionBackground image={fullbleed ? block.image || block.style.bgImage : block.style.bgImage} video={block.style.bgVideo} />
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
      <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
        <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
        <div className={`kb-container kb-offer-banner${block.image ? ' kb-offer-banner--photo' : ''}`}>
          <Photo src={block.image} className="kb-offer-banner__photo" />
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
    <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
      <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
      <div className="kb-container">
        <div className={`kb-offer-card${block.image ? ' kb-offer-card--photo' : ''}`}>
          <Photo src={block.image} className="kb-offer-card__photo" />
          {name && <div className="kb-offer-card__name">{name}</div>}
          <h2 className="kb-offer-card__title">{pick(block.title, lang)}</h2>
          <PriceLine ctx={ctx} size="lg" />
          <StockBar ctx={ctx} />
          <Countdown ctx={ctx} />
          {features.length > 0 && (
            <ul className="kb-features">
              {features.map((f, i) => (
                <li key={i} style={nth(i)}>
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
    <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
      <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
      <div className="kb-container">
        <h2 className="kb-section-title">{pick(block.title, lang)}</h2>
        <div className={block.image ? 'kb-faq-layout' : undefined}>
        {block.image && <Photo src={block.image} className="kb-faq-media" />}
        {block.variant === 'columns' ? (
          <div className="kb-faq-cols">
            {items.map((it, i) => (
              <div className="kb-faq-col" key={i} style={nth(i)}>
                <h3>{pick(it.q, lang)}</h3>
                <p>{pick(it.a, lang)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="kb-faq-list">
            {items.map((it, i) => (
              <details className="kb-faq-item" key={i} style={nth(i)} open={ctx.editing && i === 0 ? true : undefined}>
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
      </div>
    </section>
  );
}

function Terms({ block, ctx }: { block: TermsBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const t = UI[lang];
  const items = block.items.filter((i) => pick(i.title, lang));
  const date = block.updated ? formatDay(block.updated, lang) : '';
  return (
    <section id={`terms-${block.id}`} className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
      <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
      <div className="kb-container">
        <h2 className="kb-section-title">{pick(block.title, lang)}</h2>
        {block.sub && <p className="kb-section-sub">{pick(block.sub, lang)}</p>}
        {date && <p className="kb-terms__updated">{fill(t.updated, { date })}</p>}
        {block.variant === 'document' ? (
          <ol className="kb-terms-doc">
            {items.map((it, i) => (
              <li key={i} style={nth(i)}>
                <h3>{pick(it.title, lang)}</h3>
                <p>{pick(it.text, lang)}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="kb-faq-list kb-terms-list">
            {items.map((it, i) => (
              <details className="kb-faq-item" key={i} style={nth(i)} open={ctx.editing && i === 0 ? true : undefined}>
                <summary>
                  <span><span className="kb-terms__n">{i + 1}.</span> {pick(it.title, lang)}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                </summary>
                <p>{pick(it.text, lang)}</p>
              </details>
            ))}
          </div>
        )}
        {block.note && <p className="kb-terms__note">{pick(block.note, lang)}</p>}
      </div>
    </section>
  );
}

function Benefits({ block, ctx }: { block: BenefitsBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const items = block.items.filter((i) => pick(i.title, lang));
  return (
    <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
      <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
      <div className="kb-container">
        <h2 className="kb-section-title">{pick(block.title, lang)}</h2>
        {block.sub && <p className="kb-section-sub">{pick(block.sub, lang)}</p>}
        <div className={block.variant === 'rows' ? 'kb-benefit-rows' : 'kb-benefit-cards'}>
          {items.map((it, i) => (
            <div className={`kb-benefit${it.image ? ' kb-benefit--photo' : ''}`} key={i} style={nth(i)}>
              {it.image ? <Photo src={it.image} className="kb-benefit__photo" /> : <span className="kb-benefit__icon"><BenefitIconSvg icon={it.icon} /></span>}
              <div>
                <h3 className="kb-benefit__title">{pick(it.title, lang)}</h3>
                {it.text && <p className="kb-benefit__text">{pick(it.text, lang)}</p>}
                {safeLink(it.link) && (
                  <a className="kb-benefit__link" href={ctx.editing ? undefined : safeLink(it.link)} target="_blank" rel="noopener noreferrer">
                    {UI[lang].website} <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Included({ block, ctx }: { block: IncludedBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const items = block.items.map((f) => pick(f, lang)).filter(Boolean);
  const list = (
    <ul className="kb-checklist">
      {items.map((f, i) => (
        <li key={i} style={nth(i)}><CheckMark /><span>{f}</span></li>
      ))}
    </ul>
  );
  const heading = (
    <>
      <h2 className="kb-section-title">{pick(block.title, lang)}</h2>
      {block.sub && <p className="kb-section-sub">{pick(block.sub, lang)}</p>}
    </>
  );
  return (
    <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
      <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
      <div className="kb-container">
        {block.variant === 'split' ? (
          <div className="kb-included-split">
            <div className="kb-included-split__media">
              {block.image ? <img src={block.image} alt="" loading="lazy" decoding="async" /> : <div className="kb-hero__placeholder" aria-hidden="true" />}
            </div>
            <div>
              {heading}
              {list}
              {block.note && <p className="kb-note">{pick(block.note, lang)}</p>}
            </div>
          </div>
        ) : (
          <>
            {heading}
            <div className="kb-included-card">
              {list}
              {block.note && <p className="kb-note">{pick(block.note, lang)}</p>}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Inclusions({ block, ctx }: { block: InclusionsBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const yes = block.included.map((f) => pick(f, lang)).filter(Boolean);
  const no = block.excluded.map((f) => pick(f, lang)).filter(Boolean);
  const group = (kind: 'yes' | 'no', title: string, items: string[]) =>
    items.length > 0 && (
      <div className={`kb-incl__group kb-incl__group--${kind}`}>
        <h3 className="kb-incl__head">{kind === 'yes' ? <CheckMark /> : <CrossMark />}<span>{title}</span></h3>
        <ul className={`kb-checklist${kind === 'no' ? ' kb-checklist--no' : ''}`}>
          {items.map((f, i) => (
            <li key={i} style={nth(i)}>{kind === 'yes' ? <CheckMark /> : <CrossMark />}<span>{f}</span></li>
          ))}
        </ul>
      </div>
    );
  return (
    <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
      <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
      <div className="kb-container">
        <h2 className="kb-section-title">{pick(block.title, lang)}</h2>
        {block.sub && <p className="kb-section-sub">{pick(block.sub, lang)}</p>}
        <div className={`kb-incl kb-incl--${block.variant}${yes.length && no.length ? '' : ' kb-incl--single'}`}>
          {group('yes', pick(block.includedTitle, lang), yes)}
          {group('no', pick(block.excludedTitle, lang), no)}
        </div>
        {block.note && <p className="kb-note kb-incl__note">{pick(block.note, lang)}</p>}
      </div>
    </section>
  );
}

const ContactIcon = ({ kind }: { kind: 'phone' | 'telegram' | 'whatsapp' | 'email' | 'address' }) => {
  const paths: Record<typeof kind, React.ReactNode> = {
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
    telegram: <path d="m22 2-7 20-4-9-9-4Zm0 0L11 13" />,
    whatsapp: <path d="M3 21l1.7-5A9 9 0 1 1 8 19.3L3 21zM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a5 5 0 0 1-2.3-2.3l.8-1-1-2-1.5 1" />,
    email: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
    address: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
};

function Contact({ block, ctx }: { block: ContactBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const c: CompanyInfo = ctx.company || { logo: DEFAULT_LOGO, name: 'KHB Events', website: true };
  const note = c.note ? pick(c.note, lang) : '';
  const lines: Array<{ kind: 'phone' | 'telegram' | 'whatsapp' | 'email'; label: string; value: string; href: string }> = [];
  if (c.phone) lines.push({ kind: 'phone', label: lang === 'kh' ? 'ទូរស័ព្ទ' : 'Phone', value: c.phone, href: `tel:${c.phone.replace(/[^0-9+]/g, '')}` });
  if (c.telegram) lines.push({ kind: 'telegram', label: 'Telegram', value: `@${c.telegram}`, href: `https://t.me/${encodeURIComponent(c.telegram)}` });
  if (c.whatsapp) lines.push({ kind: 'whatsapp', label: 'WhatsApp', value: `+${c.whatsapp}`, href: `https://wa.me/${c.whatsapp}` });
  if (c.email) lines.push({ kind: 'email', label: lang === 'kh' ? 'អ៊ីមែល' : 'Email', value: c.email, href: `mailto:${c.email}` });
  const external = (kind: string) => kind === 'telegram' || kind === 'whatsapp';
  const title = block.title ? pick(block.title, lang) : '';
  const sub = block.sub ? pick(block.sub, lang) : '';
  const brand = (
    <div className="kb-contact__brand">
      {/* eslint-disable-next-line @next/next/no-img-element -- uploaded logos may live on another host */}
      <img className="kb-contact__logo" src={c.logo} alt={c.name} loading="lazy" decoding="async" />
      <div>
        <div className="kb-contact__name">{c.name}</div>
        {c.tagline && <div className="kb-contact__tagline">{c.tagline}</div>}
      </div>
    </div>
  );
  const list = (
    <ul className="kb-contact__list">
      {lines.map((l) => (
        <li key={l.kind}>
          <a
            className={`kb-contact__item kb-contact__item--${l.kind}`}
            href={ctx.editing ? undefined : l.href}
            target={!ctx.editing && external(l.kind) ? '_blank' : undefined}
            rel={!ctx.editing && external(l.kind) ? 'noopener noreferrer' : undefined}
          >
            <span className="kb-contact__icon"><ContactIcon kind={l.kind} /></span>
            <span className="kb-contact__text"><span className="kb-contact__label">{l.label}</span><span className="kb-contact__value">{l.value}</span></span>
          </a>
        </li>
      ))}
    </ul>
  );
  const coord = c.coordinator;
  const coordRole = coord?.role ? pick(coord.role, lang) : '';
  const coordBio = coord?.bio ? pick(coord.bio, lang) : '';
  const coordinator = coord && (
    <div className="kb-coord">
      {coord.photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded photos may live on another host
        <img className="kb-coord__photo" src={coord.photo} alt={coord.name} loading="lazy" decoding="async" />
      ) : (
        <span className="kb-coord__photo kb-coord__initials" aria-hidden="true">{coord.name.split(/\s+/).filter((w) => /\p{L}/u.test(w[0] || '')).map((w) => w[0]).slice(-2).join('').toUpperCase()}</span>
      )}
      <div className="kb-coord__body">
        <span className="kb-coord__label">{lang === 'kh' ? 'អ្នកសម្របសម្រួលរបស់អ្នក' : 'Your coordinator'}</span>
        <span className="kb-coord__name">{coord.name}</span>
        {coordRole && <span className="kb-coord__role">{coordRole}</span>}
        {coordBio && <span className="kb-coord__bio">{coordBio}</span>}
        {(coord.phone || coord.telegram) && (
          <span className="kb-coord__links">
            {coord.phone && <a href={ctx.editing ? undefined : `tel:${coord.phone.replace(/[^0-9+]/g, '')}`}><ContactIcon kind="phone" />{coord.phone}</a>}
            {coord.telegram && <a href={ctx.editing ? undefined : `https://t.me/${encodeURIComponent(coord.telegram)}`} target={ctx.editing ? undefined : '_blank'} rel="noopener noreferrer"><ContactIcon kind="telegram" />@{coord.telegram}</a>}
          </span>
        )}
      </div>
    </div>
  );
  const address = (c.address || note) && (
    <>
      {c.address && <p className="kb-contact__address"><ContactIcon kind="address" /><span>{c.address}</span></p>}
      {note && <p className="kb-contact__note">{note}</p>}
    </>
  );
  return (
    <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
      <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
      <div className="kb-container">
        {block.variant === 'card' ? (
          <div className="kb-contact-card">
            {brand}
            {title && <h2 className="kb-section-title">{title}</h2>}
            {sub && <p className="kb-section-sub">{sub}</p>}
            {coordinator}
            {list}
            {address}
          </div>
        ) : (
          <div className="kb-contact-footer">
            <div className="kb-contact-footer__about">
              {brand}
              {address}
            </div>
            <div>
              {title && <h2 className="kb-contact-footer__title">{title}</h2>}
              {sub && <p className="kb-section-sub">{sub}</p>}
              {coordinator}
              {list}
            </div>
          </div>
        )}
        {block.variant === 'footer' && <p className="kb-contact-footer__legal">© {c.name}</p>}
      </div>
    </section>
  );
}

function Steps({ block, ctx }: { block: StepsBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const items = block.items.filter((i) => pick(i.title, lang));
  return (
    <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
      <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
      <div className="kb-container">
        <h2 className="kb-section-title">{pick(block.title, lang)}</h2>
        <ol className={block.variant === 'timeline' ? 'kb-timeline' : 'kb-stepcards'}>
          {items.map((it, i) => (
            <li className={`kb-step${it.image ? ' kb-step--photo' : ''}`} key={i} style={nth(i)}>
              <Photo src={it.image} className="kb-step__photo" />
              <span className="kb-step__num" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 className="kb-step__title">{pick(it.title, lang)}</h3>
                {it.text && <p className="kb-step__text">{pick(it.text, lang)}</p>}
              </div>
            </li>
          ))}
        </ol>
        {block.ctaLabel && pick(block.ctaLabel, lang) && (
          <div className="kb-steps__cta"><CtaButton label={pick(block.ctaLabel, lang)} block={block} ctx={ctx} /></div>
        )}
      </div>
    </section>
  );
}

function LeadFormBlock({ block, ctx }: { block: FormBlock; ctx: RenderContext }) {
  const { lang, offer } = ctx;
  const t = UI[lang];
  const [values, setValues] = useState({ fullName: '', phone: '', email: '', message: '', interest: '' });
  const [agreed, setAgreed] = useState(false);
  const options = (block.interestOptions || []).filter((o) => pick(o, lang));
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const interestChoice = options[Number(values.interest)] as (typeof options)[number] | undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ctx.editing || state === 'sending') return;
    if (!values.fullName.trim() || !values.phone.trim()) {
      setError(t.required);
      return;
    }
    if (block.requireTerms && !agreed) {
      setError(t.mustAgree);
      return;
    }
    setState('sending');
    setError('');
    try {
      // The campaign the visit landed with (kept for the whole visit), the first campaign
      // that found this visitor, and one conversion id shared with the ad platforms.
      const attr = leadAttribution(getSessionId());
      const eventId = newEventId();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          email: block.askEmail ? values.email.trim() : '',
          message: block.askMessage ? values.message.trim() : undefined,
          packageInterest: pick(offer.name, 'en') || undefined,
          // The chosen option in English for the sales team, whatever language the visitor used.
          eventType: interestChoice ? pick(interestChoice, 'en') : undefined,
          landingPageSlug: ctx.slug,
          utmSource: attr.utmSource || attr.firstTouch?.utmSource,
          utmMedium: attr.utmMedium || attr.firstTouch?.utmMedium,
          utmCampaign: attr.utmCampaign || attr.firstTouch?.utmCampaign,
          utmContent: attr.utmContent || attr.firstTouch?.utmContent,
          referrer: attr.referrer || document.referrer || undefined,
          tracking: {
            eventId,
            sessionId: attr.sessionId,
            visitorId: attr.visitorId,
            fbclid: attr.fbclid || attr.firstTouch?.fbclid,
            ttclid: attr.ttclid || attr.firstTouch?.ttclid,
            pageUrl: window.location.href.split('#')[0],
            firstCampaign: attr.firstTouch?.utmCampaign,
          },
          customFields: {
            language: lang,
            ...(interestChoice ? { interest: pick(interestChoice, 'en') } : {}),
            // When and which version of the terms the visitor agreed to.
            ...(block.requireTerms && agreed ? { termsAccepted: new Date().toISOString(), ...(ctx.terms?.updated ? { termsVersion: ctx.terms.updated } : {}) } : {}),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : t.failed);
      setState('done');
      ctx.onLead?.(block, eventId);
    } catch (err) {
      setState('idle');
      setError(err instanceof Error && err.message ? err.message : t.failed);
    }
  };

  const form =
    state === 'done' ? (
      <div className="kb-leadform kb-leadform--done" role="status">
        <span className="kb-leadform__done-icon"><CheckMark /></span>
        <h3 className="kb-leadform__done-title">{pick(block.successTitle, lang)}</h3>
        {block.successText && <p className="kb-leadform__done-text">{pick(block.successText, lang)}</p>}
        {ctaOpensTelegram(offer) && <CtaButton label={t.continueTelegram} block={block} ctx={ctx} />}
      </div>
    ) : (
      <form className="kb-leadform" onSubmit={submit} noValidate>
        <label className="kb-field">
          <span>{t.name}</span>
          <input name="name" autoComplete="name" required value={values.fullName} onChange={set('fullName')} disabled={ctx.editing} />
        </label>
        <label className="kb-field">
          <span>{t.phone}</span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required value={values.phone} onChange={set('phone')} disabled={ctx.editing} />
        </label>
        {block.askEmail && (
          <label className="kb-field">
            <span>{t.email}</span>
            <input name="email" type="email" autoComplete="email" value={values.email} onChange={set('email')} disabled={ctx.editing} />
          </label>
        )}
        {options.length > 0 && (
          <label className="kb-field">
            <span>{pick(block.interestLabel, lang) || t.choose}</span>
            <select name="interest" value={values.interest} onChange={set('interest')} disabled={ctx.editing}>
              <option value="">{t.choose}</option>
              {options.map((o, i) => <option key={i} value={String(i)}>{pick(o, lang)}</option>)}
            </select>
          </label>
        )}
        {block.askMessage && (
          <label className="kb-field">
            <span>{t.message}</span>
            <textarea name="message" rows={3} value={values.message} onChange={set('message')} disabled={ctx.editing} />
          </label>
        )}
        {block.requireTerms && (
          <label className="kb-agree">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={ctx.editing} required />
            <span>
              {pick(block.termsLabel, lang) || t.agree}
              {ctx.terms && <> <a href={`#${ctx.terms.id}`} onClick={(e) => { if (ctx.editing) e.preventDefault(); }}>{t.readTerms}</a></>}
            </span>
          </label>
        )}
        {error && <p className="kb-leadform__error" role="alert">{error}</p>}
        <button type="submit" className="kb-btn kb-btn--block" disabled={state === 'sending'}>
          {state === 'sending' ? t.sending : pick(block.submitLabel, lang)}
        </button>
        {block.privacyNote && <p className="kb-leadform__privacy">{pick(block.privacyNote, lang)}</p>}
      </form>
    );

  const heading = (
    <>
      <h2 className="kb-section-title">{pick(block.title, lang)}</h2>
      {block.sub && <p className="kb-section-sub">{pick(block.sub, lang)}</p>}
    </>
  );

  return (
    <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'} id={`form-${block.id}`}>
      <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
      <div className="kb-container">
        {block.variant === 'split' ? (
          <div className="kb-form-split">
            <div>
              <Photo src={block.image} className="kb-form-photo" />
              {heading}
              <PriceLine ctx={ctx} size="lg" />
              <StockBar ctx={ctx} />
              <Countdown ctx={ctx} />
            </div>
            {form}
          </div>
        ) : (
          <div className="kb-form-card">
            <Photo src={block.image} className="kb-form-photo" />
            {heading}
            {form}
          </div>
        )}
      </div>
    </section>
  );
}

function FinalCta({ block, ctx }: { block: FinalCtaBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const risk = block.riskNote && (
    <p className="kb-risk"><CheckMark /><span>{pick(block.riskNote, lang)}</span></p>
  );
  if (block.variant === 'split') {
    return (
      <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
        <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
        <div className="kb-container kb-final-split">
          <div>
            <h2 className="kb-final__title">{pick(block.headline, lang)}</h2>
            {block.sub && <p className="kb-section-sub">{pick(block.sub, lang)}</p>}
          </div>
          <div className="kb-final-box">
            <PriceLine ctx={ctx} size="lg" />
            <StockBar ctx={ctx} />
            <Countdown ctx={ctx} compact />
            <div className="kb-final-box__cta"><CtaButton label={pick(block.ctaLabel, lang)} block={block} ctx={ctx} variant="block" /></div>
            {risk}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
      <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
      <div className="kb-container kb-final">
        <h2 className="kb-final__title">{pick(block.headline, lang)}</h2>
        {block.sub && <p className="kb-section-sub">{pick(block.sub, lang)}</p>}
        <PriceLine ctx={ctx} size="lg" />
        <Countdown ctx={ctx} />
        <div className="kb-final__cta"><CtaButton label={pick(block.ctaLabel, lang)} block={block} ctx={ctx} /></div>
        {risk}
      </div>
    </section>
  );
}

function Gallery({ block, ctx }: { block: GalleryBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const [open, setOpen] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const items = block.items;
  const carousel = block.variant === 'carousel';

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items.length]);

  const slide = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  // A gallery without photos is only a placeholder in the editor; visitors never see an empty section.
  if (items.length === 0 && !ctx.editing) return null;

  return (
    <section className={sectionClass(block)} data-anim={block.style.animation || 'rise'}>
      <SectionBackground image={block.style.bgImage} video={block.style.bgVideo} />
      <div className="kb-container">
        <h2 className="kb-section-title">{pick(block.title, lang)}</h2>
        {block.sub && <p className="kb-section-sub">{pick(block.sub, lang)}</p>}
        {items.length === 0 ? (
          ctx.editing ? <div className="kb-gallery-empty">{UI[lang].addPhotos}</div> : null
        ) : (
          <div className={carousel ? 'kb-carousel' : undefined}>
            <div ref={track} className={carousel ? 'kb-carousel__track' : `kb-photogrid kb-photogrid--m${items.length % 3}${items.length % 2 === 0 ? ' kb-photogrid--even' : ''}`}>
              {items.map((it, i) => (
                <figure className="kb-gallery__item" key={`${it.image}-${i}`} style={nth(i)}>
                  <button type="button" className="kb-gallery__open" onClick={() => !ctx.editing && setOpen(i)} aria-label={pick(it.caption, lang) || UI[lang].openPhoto}>
                    <img src={it.image} alt={pick(it.caption, lang)} loading="lazy" decoding="async" />
                  </button>
                  {it.caption && <figcaption>{pick(it.caption, lang)}</figcaption>}
                </figure>
              ))}
            </div>
            {carousel && items.length > 1 && (
              <div className="kb-carousel__nav">
                <button type="button" onClick={() => slide(-1)} aria-label={UI[lang].previous}>‹</button>
                <button type="button" onClick={() => slide(1)} aria-label={UI[lang].next}>›</button>
              </div>
            )}
          </div>
        )}
      </div>
      {open !== null && items[open] && (
        <div className="kb-lightbox" role="dialog" aria-modal="true" aria-label={pick(items[open].caption, lang) || UI[lang].openPhoto} onClick={() => setOpen(null)}>
          <img src={items[open].image} alt={pick(items[open].caption, lang)} onClick={(e) => e.stopPropagation()} />
          {items[open].caption && <p className="kb-lightbox__caption">{pick(items[open].caption, lang)}</p>}
          <button type="button" className="kb-lightbox__close" onClick={() => setOpen(null)} aria-label={UI[lang].close}>×</button>
          {items.length > 1 && (
            <>
              <button type="button" className="kb-lightbox__prev" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + items.length) % items.length); }} aria-label={UI[lang].previous}>‹</button>
              <button type="button" className="kb-lightbox__next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % items.length); }} aria-label={UI[lang].next}>›</button>
            </>
          )}
        </div>
      )}
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
    case 'benefits':
      return <Benefits block={block} ctx={ctx} />;
    case 'included':
      return <Included block={block} ctx={ctx} />;
    case 'contact':
      return <Contact block={block} ctx={ctx} />;
    case 'inclusions':
      return <Inclusions block={block} ctx={ctx} />;
    case 'steps':
      return <Steps block={block} ctx={ctx} />;
    case 'form':
      return <LeadFormBlock block={block} ctx={ctx} />;
    case 'finalCta':
      return <FinalCta block={block} ctx={ctx} />;
    case 'gallery':
      return <Gallery block={block} ctx={ctx} />;
    case 'terms':
      return <Terms block={block} ctx={ctx} />;
    default:
      return null;
  }
}

/**
 * Scroll-in animations. Sections start hidden (CSS, only inside `[data-kb-motion]`)
 * and get `data-kb-in` when they enter the screen, so their items animate in one
 * after another. `data-kb-done` then removes the stagger delay so hover effects
 * react at once. Attributes are set on the DOM, not through React props, so
 * re-renders never undo them. Changing a section's animation in the editor
 * replays it. Without JavaScript a <noscript> style shows everything.
 */
function useSectionReveal(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      el?.removeAttribute('data-kb-motion');
      return;
    }
    const timers = new Set<number>();
    const reveal = (section: Element) => {
      section.setAttribute('data-kb-in', '');
      io.unobserve(section);
      const t = window.setTimeout(() => { section.setAttribute('data-kb-done', ''); timers.delete(t); }, 1800);
      timers.add(t);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) reveal(e.target); }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    );
    const scan = () => {
      el.querySelectorAll<HTMLElement>('.kb-section').forEach((section) => {
        const anim = section.getAttribute('data-anim') || 'rise';
        if (section.dataset.kbSeen === anim) return;
        if (section.dataset.kbSeen) {
          section.removeAttribute('data-kb-in');
          section.removeAttribute('data-kb-done');
        }
        section.dataset.kbSeen = anim;
        io.observe(section);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-anim'] });
    return () => {
      io.disconnect();
      mo.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [root]);
}

/** The page root: brand tokens as CSS variables, Khmer font, width container, scroll-in animations. */
export function BuilderRoot({ brand, lang, className = '', children }: { brand: BuilderBrand; lang: Lang; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useSectionReveal(ref);
  return (
    <div
      ref={ref}
      data-kb-motion=""
      className={`kb-page kb-radius-${brand.radius}${lang === 'kh' ? ' kb-lang-kh' : ''} ${className}`.trim()}
      style={{ '--kb-accent': brand.accent } as React.CSSProperties}
      lang={lang === 'kh' ? 'km' : 'en'}
    >
      <noscript>
        <style>{'.kb-page[data-kb-motion] .kb-section:not([data-kb-in]) *{opacity:1!important;transform:none!important}'}</style>
      </noscript>
      {children}
    </div>
  );
}
