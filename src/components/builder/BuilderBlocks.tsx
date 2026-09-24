'use client';

import React, { useEffect, useState } from 'react';
import type {
  BenefitIcon,
  BenefitsBlock,
  BuilderBlock,
  BuilderBrand,
  BuilderOffer,
  FaqBlock,
  FinalCtaBlock,
  FormBlock,
  HeroBlock,
  IncludedBlock,
  Lang,
  OfferBlock,
  StepsBlock,
} from '@/lib/builder';
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
  /** Called after a form was accepted by the server. */
  onLead?: (block: FormBlock) => void;
}

const UI = {
  en: {
    save: 'Save {n}%', left: '{n} {label}', endsIn: 'Offer ends in', d: 'days', h: 'hours', m: 'min', s: 'sec', from: 'Price',
    name: 'Your name', phone: 'Phone or Telegram', email: 'Email (optional)', message: 'Message (optional)',
    sending: 'Sending…', required: 'Please write your name and phone number.', failed: 'Sending failed. Please try again, or use the Telegram button.',
    continueTelegram: 'Continue on Telegram',
  },
  kh: {
    save: 'សន្សំ {n}%', left: '{n} {label}', endsIn: 'ការផ្តល់ជូនបញ្ចប់ក្នុង', d: 'ថ្ងៃ', h: 'ម៉ោង', m: 'នាទី', s: 'វិនាទី', from: 'តម្លៃ',
    name: 'ឈ្មោះរបស់អ្នក', phone: 'លេខទូរស័ព្ទ ឬ Telegram', email: 'អ៊ីមែល (មិនចាំបាច់)', message: 'សារ (មិនចាំបាច់)',
    sending: 'កំពុងផ្ញើ…', required: 'សូមសរសេរឈ្មោះ និងលេខទូរស័ព្ទរបស់អ្នក។', failed: 'ការផ្ញើមិនបានសម្រេច។ សូមព្យាយាមម្តងទៀត ឬប្រើប៊ូតុង Telegram។',
    continueTelegram: 'បន្តតាម Telegram',
  },
} as const;

const svgProps = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

/** Simple line icons (paths in the style of Lucide) so the public page ships no icon library. */
const ICON_PATHS: Record<BenefitIcon, React.ReactNode> = {
  sparkles: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />,
  shield: <><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M5 12v9h14v-9M12 8C10 4 7 4 7 6.5S10 8 12 8zM12 8c2-4 5-4 5-1.5S14 8 12 8z" /></>,
  heart: <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />,
  truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.5 3.5 5.2" /></>,
  leaf: <path d="M11 20A7 7 0 0 1 4 13c0-6 5-9 16-9 0 11-3 16-9 16zM4 21c3-5 6-8 10-10" />,
  award: <><circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8" /></>,
};

export function BenefitIconSvg({ icon }: { icon: BenefitIcon }) {
  return <svg {...svgProps}>{ICON_PATHS[icon] || ICON_PATHS.check}</svg>;
}

const CheckMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
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

function Benefits({ block, ctx }: { block: BenefitsBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const items = block.items.filter((i) => pick(i.title, lang));
  return (
    <section className={sectionClass(block)}>
      <SectionBackground image={block.style.bgImage} />
      <div className="kb-container">
        <h2 className="kb-section-title">{pick(block.title, lang)}</h2>
        {block.sub && <p className="kb-section-sub">{pick(block.sub, lang)}</p>}
        <div className={block.variant === 'rows' ? 'kb-benefit-rows' : 'kb-benefit-cards'}>
          {items.map((it, i) => (
            <div className="kb-benefit" key={i}>
              <span className="kb-benefit__icon"><BenefitIconSvg icon={it.icon} /></span>
              <div>
                <h3 className="kb-benefit__title">{pick(it.title, lang)}</h3>
                {it.text && <p className="kb-benefit__text">{pick(it.text, lang)}</p>}
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
        <li key={i}><CheckMark /><span>{f}</span></li>
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
    <section className={sectionClass(block)}>
      <SectionBackground image={block.style.bgImage} />
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

function Steps({ block, ctx }: { block: StepsBlock; ctx: RenderContext }) {
  const { lang } = ctx;
  const items = block.items.filter((i) => pick(i.title, lang));
  return (
    <section className={sectionClass(block)}>
      <SectionBackground image={block.style.bgImage} />
      <div className="kb-container">
        <h2 className="kb-section-title">{pick(block.title, lang)}</h2>
        <ol className={block.variant === 'timeline' ? 'kb-timeline' : 'kb-stepcards'}>
          {items.map((it, i) => (
            <li className="kb-step" key={i}>
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
  const [values, setValues] = useState({ fullName: '', phone: '', email: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ctx.editing || state === 'sending') return;
    if (!values.fullName.trim() || !values.phone.trim()) {
      setError(t.required);
      return;
    }
    setState('sending');
    setError('');
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          email: block.askEmail ? values.email.trim() : '',
          message: block.askMessage ? values.message.trim() : undefined,
          packageInterest: pick(offer.name, 'en') || undefined,
          landingPageSlug: ctx.slug,
          utmSource: params.get('utm_source') || undefined,
          utmMedium: params.get('utm_medium') || undefined,
          utmCampaign: params.get('utm_campaign') || undefined,
          utmContent: params.get('utm_content') || undefined,
          referrer: document.referrer || undefined,
          customFields: { language: lang },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : t.failed);
      setState('done');
      ctx.onLead?.(block);
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
        {offer.cta.action === 'telegram' && <CtaButton label={t.continueTelegram} block={block} ctx={ctx} />}
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
        {block.askMessage && (
          <label className="kb-field">
            <span>{t.message}</span>
            <textarea name="message" rows={3} value={values.message} onChange={set('message')} disabled={ctx.editing} />
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
    <section className={sectionClass(block)} id={`form-${block.id}`}>
      <SectionBackground image={block.style.bgImage} />
      <div className="kb-container">
        {block.variant === 'split' ? (
          <div className="kb-form-split">
            <div>
              {heading}
              <PriceLine ctx={ctx} size="lg" />
              <StockBar ctx={ctx} />
              <Countdown ctx={ctx} />
            </div>
            {form}
          </div>
        ) : (
          <div className="kb-form-card">
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
      <section className={sectionClass(block)}>
        <SectionBackground image={block.style.bgImage} />
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
    <section className={sectionClass(block)}>
      <SectionBackground image={block.style.bgImage} />
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
    case 'steps':
      return <Steps block={block} ctx={ctx} />;
    case 'form':
      return <LeadFormBlock block={block} ctx={ctx} />;
    case 'finalCta':
      return <FinalCta block={block} ctx={ctx} />;
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
