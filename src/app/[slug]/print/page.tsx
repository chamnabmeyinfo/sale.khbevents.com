import type { Metadata } from 'next';
import { companyFor, pageText } from '@/lib/company';
import { pick } from '@/lib/builder';
import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { loadPublicPage } from '@/lib/page-access';
import { getPublicSettings } from '@/lib/storage';
import { normalizeBuilderDoc, type Lang } from '@/lib/builder';
import { classicToBuilder } from '@/lib/classic-to-builder';
import { buildPrintPlan, printDateTime, type PrintFact, type PrintMode, type PrintSection } from '@/lib/print-plan';
import { serverNowMs } from '@/lib/popup-ads';
import { qrPath } from '@/lib/qr';
import PageLockScreen from '@/components/common/PageLockScreen';
import PrintButton from '@/components/print/PrintButton';
import { BenefitIconSvg } from '@/components/builder/icons';
import '@/styles/print.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const UI = {
  en: {
    print: 'Print or save as PDF', back: 'Back to the page', updated: 'Last updated', printed: 'Printed', scan: 'Scan to register or see the latest update', coordinator: 'Your coordinator',
    contact: 'Contact', agenda: 'Agenda', full: 'Entire page', photos: 'Photos', on: 'On', off: 'Off', page: 'Page',
    smartTitle: 'Smart agenda', leftOut: 'Left out (see "Entire page")',
    nature: { trip: 'a trip with a day-by-day programme', event: 'an event with a deadline or limited seats', product: 'a product or service' },
    picks: 'This page reads as {nature}. The agenda prints:', fullNote: 'Every section of the page, in the page\'s order, with photos.', moreQ: '+{n} more questions on the page',
  },
  kh: {
    print: 'បោះពុម្ព ឬរក្សាទុកជា PDF', back: 'ត្រឡប់ទៅទំព័រ', updated: 'កែប្រែចុងក្រោយ', printed: 'បោះពុម្ពនៅ', scan: 'ស្កេនដើម្បីចុះឈ្មោះ ឬមើលព័ត៌មានថ្មីបំផុត', coordinator: 'អ្នកសម្របសម្រួលរបស់អ្នក',
    contact: 'ទំនាក់ទំនង', agenda: 'កម្មវិធី', full: 'ទំព័រទាំងមូល', photos: 'រូបភាព', on: 'បើក', off: 'បិទ', page: 'ទំព័រ',
    smartTitle: 'កម្មវិធីឆ្លាតវៃ', leftOut: 'មិនបានបញ្ចូល (មើល "ទំព័រទាំងមូល")',
    nature: { trip: 'ដំណើរមានកម្មវិធីប្រចាំថ្ងៃ', event: 'ព្រឹត្តិការណ៍មានថ្ងៃផុតកំណត់ ឬកៅអីកំណត់', product: 'ផលិតផល ឬសេវាកម្ម' },
    picks: 'ទំព័រនេះជា {nature}។ កម្មវិធីបោះពុម្ព៖', fullNote: 'គ្រប់ផ្នែកនៃទំព័រ តាមលំដាប់ទំព័រ មានរូបភាព។', moreQ: '+{n} សំណួរទៀតនៅលើទំព័រ',
  },
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadPublicPage(slug.toLowerCase().trim());
  const title = result.kind === 'ok' && result.page ? result.page.title : 'Print';
  return { title: `${title} | Print`, robots: { index: false, follow: false } };
}

const FACT_ICONS: Record<PrintFact['icon'], React.ReactNode> = {
  price: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="8" cy="8" r="1.5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
  deadline: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></>,
  seats: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.5 3.5 5.2" /></>,
};
const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const Check = () => <Svg><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Svg>;
const Cross = () => <Svg><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></Svg>;

function Qr({ url, caption }: { url: string; caption: string }) {
  const qr = qrPath(url);
  return (
    <figure className="pp-qr">
      <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} role="img" aria-label={url} shapeRendering="crispEdges">
        <rect x={-2} y={-2} width={qr.size + 4} height={qr.size + 4} fill="#fff" />
        <path d={qr.d} fill="#000" />
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Section({ s, photos, moreQ, footer, updatedLabel }: { s: PrintSection; photos: boolean; moreQ: string; footer: React.ReactNode; updatedLabel: string }) {
  const head = (title: string, sub?: string) => (
    <div className="pp-sec__head">
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  );
  switch (s.kind) {
    case 'schedule':
      return (
        <section className="pp-sec pp-schedule">
          {head(s.title)}
          <div className="pp-days">
            {s.days.map((d, i) => (
              <article key={i} className="pp-day">
                <div className="pp-day__head">
                  <span className="pp-day__label">{d.label}</span>
                  {d.date && <span className="pp-day__date">{d.date}</span>}
                  {d.title && <strong className="pp-day__title">{d.title}</strong>}
                </div>
                <ol className="pp-day__rows">
                  {d.rows.map((r, j) => (
                    <li key={j}>
                      <span className="pp-time">{r.time || ''}</span>
                      <span className="pp-dot" aria-hidden="true" />
                      <span className="pp-what">{r.text}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>
      );
    case 'places':
      return (
        <section className="pp-sec">
          {head(s.title, s.sub)}
          <div className="pp-places">
            {s.items.map((it, i) => (
              <article key={i} className="pp-place">
                <span className="pp-icon"><BenefitIconSvg icon={it.icon} /></span>
                <div>
                  <strong>{it.title}</strong>
                  {it.text && <p>{it.text}</p>}
                  {it.link && <p className="pp-link">{it.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    case 'cards':
      return (
        <section className="pp-sec">
          {head(s.title, s.sub)}
          <div className={`pp-cards${s.compact ? ' pp-cards--compact' : ''}`}>
            {s.items.map((it, i) => (
              <article key={i} className="pp-card">
                {photos && it.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img className="pp-card__img" src={it.image} alt="" />
                  : <span className="pp-icon"><BenefitIconSvg icon={it.icon} /></span>}
                <strong>{it.title}</strong>
                {it.text && <p>{it.text}</p>}
              </article>
            ))}
          </div>
        </section>
      );
    case 'chips':
      return (
        <section className="pp-sec pp-sec--tight">
          {head(s.title)}
          <ul className="pp-chips">{s.items.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </section>
      );
    case 'checklist':
      return (
        <section className={`pp-sec${s.tone === 'accent' ? ' pp-box' : ''}`}>
          {head(s.title, s.sub)}
          <ul className="pp-check">{s.items.map((c, i) => <li key={i}><Check />{c}</li>)}</ul>
          {s.note && <p className="pp-note">{s.note}</p>}
        </section>
      );
    case 'inclusions':
      return (
        <section className="pp-sec">
          {head(s.title, s.sub)}
          <div className="pp-incl">
            {s.included.items.length > 0 && (
              <div className="pp-incl__col">
                <h3 className="pp-incl__head"><Check />{s.included.title}</h3>
                <ul className="pp-check pp-check--one">{s.included.items.map((c, i) => <li key={i}><Check />{c}</li>)}</ul>
              </div>
            )}
            {s.excluded.items.length > 0 && (
              <div className="pp-incl__col pp-incl__col--no">
                <h3 className="pp-incl__head"><Cross />{s.excluded.title}</h3>
                <ul className="pp-check pp-check--one">{s.excluded.items.map((c, i) => <li key={i}><Cross />{c}</li>)}</ul>
              </div>
            )}
          </div>
          {s.note && <p className="pp-note">{s.note}</p>}
        </section>
      );
    case 'steps':
      return (
        <section className="pp-sec">
          {head(s.title)}
          <ol className="pp-steps">
            {s.items.map((it, i) => (
              <li key={i}>
                <span className="pp-steps__n">{i + 1}</span>
                <strong>{it.title}</strong>
                {it.text && <p>{it.text}</p>}
              </li>
            ))}
          </ol>
        </section>
      );
    case 'faq':
      return (
        <section className="pp-sec">
          {head(s.title)}
          <dl className="pp-faq">
            {s.items.map((it, i) => (
              <div key={i}>
                <dt>{it.q}</dt>
                <dd>{it.a}</dd>
              </div>
            ))}
          </dl>
          {s.more ? <p className="pp-note">{moreQ.replace('{n}', String(s.more))}</p> : null}
        </section>
      );
    case 'terms':
      return (
        <section className="pp-sec pp-terms">
          {head(s.title, s.sub)}
          {s.updated && <p className="pp-note">{updatedLabel}: {s.updated}</p>}
          <ol className="pp-terms__list">
            {s.items.map((it, i) => (
              <li key={i}>
                <strong>{it.title}</strong>
                {it.text && <p>{it.text}</p>}
              </li>
            ))}
          </ol>
          {s.note && <p className="pp-note">{s.note}</p>}
        </section>
      );
    case 'gallery':
      if (!photos) return null;
      return (
        <section className="pp-sec">
          {head(s.title)}
          <div className="pp-gallery">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {s.images.slice(0, 6).map((src, i) => <img key={i} src={src} alt="" />)}
          </div>
        </section>
      );
    case 'offer':
      return (
        <section className="pp-sec pp-box">
          {head(s.title)}
          <ul className="pp-check">{s.features.map((c, i) => <li key={i}><Check />{c}</li>)}</ul>
          {s.note && <p className="pp-note">{s.note}</p>}
        </section>
      );
    case 'callout':
      return (
        <section className="pp-callout">
          <div className="pp-callout__text">
            <h2>{s.title}</h2>
            {s.text && <p>{s.text}</p>}
            {footer}
          </div>
        </section>
      );
  }
}

/** /<slug>/print: the page as a designed printout, as a smart agenda or the entire page. */
export default async function PrintPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();
  const sp = searchParams ? await searchParams : {};
  const result = await loadPublicPage(cleanSlug);
  if (result.kind === 'not_found') notFound();
  if (result.kind === 'locked') return <PageLockScreen page={result.stub} />;
  const page = result.page;
  if (!page) notFound();

  const doc = page.template === 'builder' && page.builder ? normalizeBuilderDoc(page.builder) : classicToBuilder(page);
  const lang: Lang = sp.lang === 'kh' || sp.lang === 'en' ? sp.lang : doc.defaultLang || 'en';
  const mode: PrintMode = sp.mode === 'full' ? 'full' : 'agenda';
  const photos = sp.photos !== '0';
  const nowMs = serverNowMs();
  // The page's own closing wording, else the default "Register or ask a question".
  const iso = page.isolatedSettings;
  const closingTitle = pageText(iso?.printClosingTitle);
  const closingText = pageText(iso?.printClosingText);
  const plan = buildPrintPlan(doc, { lang, mode, nowMs, pageTitle: page.title, closing: { title: closingTitle ? pick(closingTitle, lang) : undefined, text: closingText ? pick(closingText, lang) : undefined } });
  const settings = await getPublicSettings();
  const ui = UI[lang];

  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'sale.khbevents.com';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const pageUrl = `${proto}://${host}/${page.slug}${lang === 'kh' ? '?lang=kh' : ''}`;
  // The page's own logo and contact details win; the rest comes from Settings → Company.
  const company = companyFor(settings, page);
  const contacts = [company.phone, company.telegram ? `Telegram @${company.telegram}` : '', company.whatsapp ? `WhatsApp +${company.whatsapp}` : '', company.email].filter(Boolean);
  const footerNote = company.note ? pick(company.note, lang) : '';

  const link = (o: { mode?: PrintMode; lang?: Lang; photos?: boolean }) => {
    const q = new URLSearchParams();
    const m = o.mode ?? mode;
    const l = o.lang ?? lang;
    const ph = o.photos ?? photos;
    if (m === 'full') q.set('mode', 'full');
    q.set('lang', l);
    if (!ph) q.set('photos', '0');
    return `/${page.slug}/print?${q}`;
  };

  const coord = company.coordinator;
  const coordRole = coord?.role ? pick(coord.role, lang) : '';
  const coordBio = coord?.bio ? pick(coord.bio, lang) : '';
  const coordReach = coord ? [coord.phone, coord.telegram ? `Telegram @${coord.telegram}` : ''].filter(Boolean).join(' · ') : '';
  const coordinatorCard = coord && (
    <div className="pp-coord">
      {coord.photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded photos may live on another host
        <img className="pp-coord__photo" src={coord.photo} alt="" />
      ) : (
        <span className="pp-coord__photo pp-coord__initials" aria-hidden="true">{coord.name.split(/\s+/).filter((w) => /\p{L}/u.test(w[0] || '')).map((w) => w[0]).slice(-2).join('').toUpperCase()}</span>
      )}
      <div className="pp-coord__body">
        <span className="pp-coord__label">{ui.coordinator}</span>
        <strong>{coord.name}</strong>
        {coordRole && <span>{coordRole}</span>}
        {coordReach && <span className="pp-coord__reach">{coordReach}</span>}
        {coordBio && <span className="pp-coord__bio">{coordBio}</span>}
      </div>
    </div>
  );
  const contactBlock = (
    <div className="pp-contact">
      <div className="pp-contact__main">
      {coordinatorCard}
      <div className="pp-contact__lines">
        <strong>{company.name}</strong>
        {contacts.length > 0 && <span>{contacts.join(' · ')}</span>}
        {company.address && <span>{company.address}</span>}
        {footerNote && <span>{footerNote}</span>}
        {company.website && <span className="pp-link">{pageUrl}</span>}
      </div>
      </div>
      <Qr url={pageUrl} caption={ui.scan} />
    </div>
  );
  const cover = photos && plan.heroImage;

  return (
    <div className={`pp pp--${mode}${lang === 'kh' ? ' pp--kh' : ''}`} lang={lang === 'kh' ? 'km' : 'en'} style={{ '--pp-accent': doc.brand.accent } as React.CSSProperties}>
      <div className="pp-toolbar">
        <a className="pp-back" href={`/${page.slug}${lang === 'kh' ? '?lang=kh' : ''}`}>← {ui.back}</a>
        <div className="pp-toolbar__controls">
          <nav className="pp-seg" aria-label="Print">
            <a href={link({ mode: 'agenda' })} aria-current={mode === 'agenda' ? 'true' : undefined}>{ui.agenda}</a>
            <a href={link({ mode: 'full' })} aria-current={mode === 'full' ? 'true' : undefined}>{ui.full}</a>
          </nav>
          <nav className="pp-seg" aria-label="Language">
            <a href={link({ lang: 'en' })} aria-current={lang === 'en' ? 'true' : undefined}>EN</a>
            <a href={link({ lang: 'kh' })} aria-current={lang === 'kh' ? 'true' : undefined}>ខ្មែរ</a>
          </nav>
          <nav className="pp-seg" aria-label={ui.photos}>
            <span className="pp-seg__label">{ui.photos}</span>
            <a href={link({ photos: true })} aria-current={photos ? 'true' : undefined}>{ui.on}</a>
            <a href={link({ photos: false })} aria-current={!photos ? 'true' : undefined}>{ui.off}</a>
          </nav>
          <PrintButton label={ui.print} />
        </div>
      </div>

      <aside className="pp-explain">
        {mode === 'agenda' ? (
          <>
            <strong>{ui.smartTitle}.</strong> {ui.picks.replace('{nature}', ui.nature[plan.nature])}{' '}
            {plan.sections.filter((s) => s.kind !== 'callout').map((s) => s.title).filter(Boolean).join(' · ')}.
            {plan.omitted.length > 0 && <span className="pp-explain__out"> {ui.leftOut}: {plan.omitted.join(' · ')}.</span>}
          </>
        ) : (
          <><strong>{ui.full}.</strong> {ui.fullNote}</>
        )}
      </aside>

      <article className="pp-sheet">
        <div className={`pp-cover${cover ? ' pp-cover--photo' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {cover && <img className="pp-cover__img" src={plan.heroImage} alt="" />}
          <div className="pp-cover__body">
            <div className="pp-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={company.logo} alt="" width={54} height={30} />
              <span className="pp-brand__tag">{mode === 'agenda' ? ui.agenda : ui.full}</span>
            </div>
            {plan.badge && <p className="pp-badge">{plan.badge}</p>}
            <h1>{plan.title}</h1>
            {plan.intro && <p className="pp-intro">{plan.intro}</p>}
          </div>
        </div>

        <div className="pp-keyrow">
          {plan.facts.length > 0 && (
            <dl className="pp-facts">
              {plan.facts.map((f) => (
                <div key={f.label} className="pp-fact">
                  <span className="pp-fact__icon"><Svg>{FACT_ICONS[f.icon]}</Svg></span>
                  <div>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                    {f.sub && <dd className="pp-fact__sub">{f.sub}</dd>}
                  </div>
                </div>
              ))}
            </dl>
          )}
          <Qr url={pageUrl} caption={ui.scan} />
        </div>

        {plan.sections.map((s) => <Section key={s.id} s={s} photos={photos} moreQ={ui.moreQ} footer={contactBlock} updatedLabel={ui.updated} />)}

        <div className="pp-foot">
          <span>{ui.updated}: {printDateTime(page.updatedAt, lang)}</span>
          <span>{ui.printed}: {printDateTime(new Date(nowMs).toISOString(), lang)}</span>
        </div>
      </article>
    </div>
  );
}
