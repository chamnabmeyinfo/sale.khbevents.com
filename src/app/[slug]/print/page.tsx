import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { loadPublicPage } from '@/lib/page-access';
import { getPublicSettings } from '@/lib/storage';
import { normalizeBuilderDoc, type Lang } from '@/lib/builder';
import { classicToBuilder } from '@/lib/classic-to-builder';
import { buildAgenda, printDateTime } from '@/lib/print-agenda';
import { serverNowMs } from '@/lib/popup-ads';
import { qrPath } from '@/lib/qr';
import PageLockScreen from '@/components/common/PageLockScreen';
import PrintButton from '@/components/print/PrintButton';
import '@/styles/print-agenda.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const UI = {
  en: { print: 'Print or save as PDF', back: 'Back to the page', updated: 'Last updated', printed: 'Printed', scan: 'Scan to register or see the latest update', contact: 'Contact', agenda: 'Agenda' },
  kh: { print: 'បោះពុម្ព ឬរក្សាទុកជា PDF', back: 'ត្រឡប់ទៅទំព័រ', updated: 'កែប្រែចុងក្រោយ', printed: 'បោះពុម្ពនៅ', scan: 'ស្កេនដើម្បីចុះឈ្មោះ ឬមើលព័ត៌មានថ្មីបំផុត', contact: 'ទំនាក់ទំនង', agenda: 'កម្មវិធី' },
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadPublicPage(slug.toLowerCase().trim());
  const title = result.kind === 'ok' && result.page ? result.page.title : 'Agenda';
  return { title: `${title} | Agenda`, robots: { index: false, follow: false } };
}

/** /<slug>/print: the page as a printable agenda, always from the latest saved version. */
export default async function PrintAgendaPage({ params, searchParams }: PageProps) {
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
  const nowMs = serverNowMs();
  const agenda = buildAgenda(doc, lang, nowMs, page.title);
  const settings = await getPublicSettings();
  const ui = UI[lang];

  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'sale.khbevents.com';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const pageUrl = `${proto}://${host}/${page.slug}${lang === 'kh' ? '?lang=kh' : ''}`;
  const qr = qrPath(pageUrl);
  const contacts = [settings.phone, settings.telegramUsername ? `Telegram @${settings.telegramUsername.replace(/^@/, '')}` : '', settings.email].filter(Boolean);

  return (
    <div className={`pa4${lang === 'kh' ? ' pa4--kh' : ''}`} lang={lang === 'kh' ? 'km' : 'en'} style={{ '--pa4-accent': doc.brand.accent } as React.CSSProperties}>
      <div className="pa4-toolbar">
        <a className="pa4-link" href={`/${page.slug}${lang === 'kh' ? '?lang=kh' : ''}`}>← {ui.back}</a>
        <div className="pa4-toolbar__right">
          <nav className="pa4-lang" aria-label="Language">
            <a href={`/${page.slug}/print?lang=en`} aria-current={lang === 'en' ? 'true' : undefined}>EN</a>
            <a href={`/${page.slug}/print?lang=kh`} aria-current={lang === 'kh' ? 'true' : undefined}>ខ្មែរ</a>
          </nav>
          <PrintButton label={ui.print} />
        </div>
      </div>

      <article className="pa4-sheet">
        <div className="pa4-head">
          <div className="pa4-head__text">
            <div className="pa4-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/khb-logo.png" alt="" width={54} height={30} />
              <span>{settings.companyName || 'KHB Events'}</span>
              <span className="pa4-brand__tag">{ui.agenda}</span>
            </div>
            {agenda.badge && <p className="pa4-badge">{agenda.badge}</p>}
            <h1>{agenda.title}</h1>
            {agenda.intro && <p className="pa4-intro">{agenda.intro}</p>}
          </div>
          <figure className="pa4-qr">
            <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} role="img" aria-label={pageUrl} shapeRendering="crispEdges">
              <rect x={-2} y={-2} width={qr.size + 4} height={qr.size + 4} fill="#fff" />
              <path d={qr.d} fill="#000" />
            </svg>
            <figcaption>{ui.scan}</figcaption>
          </figure>
        </div>

        {agenda.facts.length > 0 && (
          <dl className="pa4-facts">
            {agenda.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {agenda.sections.map((s) => (
          <section key={s.id} className={`pa4-section pa4-section--${s.kind}`}>
            <h2>{s.title}</h2>
            {s.sub && <p className="pa4-sub">{s.sub}</p>}
            {s.kind === 'steps' ? (
              <ol className="pa4-steps">
                {s.items.map((it, i) => (
                  <li key={i}>
                    <strong>{it.title}</strong>
                    {it.text && <p>{it.text}</p>}
                  </li>
                ))}
              </ol>
            ) : s.kind === 'faq' ? (
              <dl className="pa4-faq">
                {s.items.map((it, i) => (
                  <div key={i}>
                    <dt>{it.title}</dt>
                    {it.text && <dd>{it.text}</dd>}
                  </div>
                ))}
              </dl>
            ) : s.kind === 'cards' ? (
              <ul className="pa4-cards">
                {s.items.map((it, i) => (
                  <li key={i}>
                    <strong>{it.title}</strong>
                    {it.text && <p>{it.text}</p>}
                    {it.link && <p className="pa4-url">{it.link}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="pa4-list">
                {s.items.map((it, i) => <li key={i}>{it.title}</li>)}
              </ul>
            )}
            {s.note && <p className="pa4-note">{s.note}</p>}
          </section>
        ))}

        <footer className="pa4-foot">
          <div>
            <strong>{ui.contact}:</strong> {contacts.join(' · ') || settings.companyName}
            <div className="pa4-url">{pageUrl}</div>
          </div>
          <div className="pa4-stamp">
            {page.updatedAt && <div>{ui.updated}: {printDateTime(page.updatedAt, lang)}</div>}
            <div>{ui.printed}: {printDateTime(new Date(nowMs).toISOString(), lang)}</div>
          </div>
        </footer>
      </article>
    </div>
  );
}
