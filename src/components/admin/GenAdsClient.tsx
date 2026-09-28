'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Edit, ExternalLink, ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { POSTER_GOALS, goalBlocked, posterWarnings, type PosterGoal } from '@/lib/ad-posters';
import { factLines } from '@/lib/ad-brief';
import {
  AD_LINK_CHANNELS, CONCEPT_IDS, LIMITS, isAdCampaign, canvaPack, carouselCards, chars, conceptDesignPrompt, conceptImagePrompts, conceptLines, googleFactHeadlines, isClean, packageMarkdown, planDay, postingPlan,
  type AdConcept, type ConceptId, type Flag,
} from '@/lib/ad-package';
import type { AdPackageView } from '@/lib/gen-ads';
import { campaignLink } from '@/lib/campaigns';
import type { Lang } from '@/lib/builder';
import { LinkRow } from './campaigns/ManageTab';
import { CopyButton, PromptBox } from './campaigns/CopyButton';
import { BTN_PRIMARY, BTN_SOFT, CARD, H2, INPUT, LABEL, SUB } from './campaigns/ui';

interface PageInfo { id: string; slug: string; title: string; status: string; template?: string }
type Tab = 'overview' | 'poster' | 'captions' | 'video' | 'sales' | 'plan';
const TABS: Tab[] = ['overview', 'poster', 'captions', 'video', 'sales', 'plan'];
type Busy = 'generate' | 'links' | 'restore' | null;

const LANG_LABEL: Record<Lang, string> = { en: 'EN', kh: 'ខ្មែរ' };
const ROW_LABEL = 'text-[10px] font-bold uppercase text-slate-400 dark:text-gray-500';
const ROW_TEXT = 'text-xs text-slate-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere]';

function FlagChips({ flags, path }: { flags: Flag[]; path: string }) {
  const { t } = useLanguage();
  const mine = flags.filter((f) => f.path === path);
  if (!mine.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1" data-gen-flags={path}>
      {mine.map((f, i) => (
        <span key={i} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${f.kind === 'superlative' ? 'bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-gray-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200'}`}>
          <AlertTriangle className="w-3 h-3" /> {t(`gen.flag.${f.kind}`, { detail: f.detail })}
        </span>
      ))}
    </div>
  );
}

/** One copyable line: label, text, counter against the platform limit, flags, copy. */
function Row({ label, text, path, limit, flags, copy, note, count }: { label: string; text: string; path?: string; limit?: number; flags: Flag[]; copy?: string; note?: string; count?: string }) {
  if (!text) return null;
  const n = chars(count ?? text);
  const over = limit !== undefined && n > limit;
  const flagged = path ? !isClean(flags, path) : false;
  return (
    <div className={`flex items-start gap-2 py-1.5 ${flagged || over ? 'border-l-2 border-amber-400 pl-2' : ''}`} data-gen-row={path || label}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={ROW_LABEL}>{label}</span>
          {note && <span className="text-[10px] px-1.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold">{note}</span>}
          {limit !== undefined && <span className={`text-[10px] font-mono ${over ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-400'}`}>{n}/{limit}</span>}
        </div>
        <div className={ROW_TEXT}>{text}</div>
        {path && <FlagChips flags={flags} path={path} />}
      </div>
      <CopyButton text={copy ?? text} />
    </div>
  );
}

function Section({ title, sub, children, testId, action }: { title: string; sub?: string; children: React.ReactNode; testId?: string; action?: React.ReactNode }) {
  return (
    <section className={`${CARD} p-4 space-y-2`} data-gen-section={testId}>
      <div className="flex items-start gap-2 flex-wrap">
        <div className="min-w-0 flex-1">
          <h3 className={H2}>{title}</h3>
          {sub && <p className={`${SUB} mt-0.5`}>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function when(iso: string, lang: Lang): string {
  try {
    return new Date(iso).toLocaleString(lang === 'kh' ? 'km-KH' : 'en-GB', { timeZone: 'Asia/Phnom_Penh', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso.slice(0, 16);
  }
}

/** Admin → Landing Pages CMS → Gen Ads: one page's ads package, a copy console. */
export default function GenAdsClient({ page, initial }: { page: PageInfo; initial: AdPackageView }) {
  const { t, lang } = useLanguage();
  const [view, setView] = useState<AdPackageView>(initial);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<{ text: string; noKey: boolean; busy?: boolean; kind?: Exclude<Busy, null> } | null>(null);
  const [formOpen, setFormOpen] = useState(!initial.stored);
  const [goal, setGoal] = useState<PosterGoal | 'auto'>(initial.stored?.goal || 'auto');
  const [notes, setNotes] = useState(initial.stored?.notes || '');
  const [direction, setDirection] = useState(initial.stored?.direction || '');
  const [tab, setTab] = useState<Tab>('overview');
  const [concept, setConcept] = useState<ConceptId>('a');
  const [origin, setOrigin] = useState('https://sale.khbevents.com');
  // The tab row sticks just under the admin top bar (sticky on laptops), so it is measured, not guessed.
  const [topOffset, setTopOffset] = useState(0);
  const autoRan = useRef(false);

  useEffect(() => {
    const measure = () => {
      // The shell has one bar for phones and one for laptops, both tagged; take the one that is shown.
      const bar = [...document.querySelectorAll<HTMLElement>('[data-admin-topbar]')].find((el) => el.offsetParent !== null && getComputedStyle(el).position === 'sticky');
      setTopOffset(bar ? Math.round(bar.getBoundingClientRect().height) : 0);
    };
    const id = window.setTimeout(measure, 0);
    window.addEventListener('resize', measure);
    return () => { window.clearTimeout(id); window.removeEventListener('resize', measure); };
  }, []);

  const act = useCallback(async (body: Record<string, unknown>, kind: Exclude<Busy, null>) => {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${page.id}/ad-concepts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!json?.success) {
        setError({ text: json?.code === 'busy' ? t('gen.busy') : json?.error || t('gen.failed'), noKey: json?.code === 'no_key', busy: json?.code === 'busy', kind });
        return false;
      }
      setView(json.view);
      return true;
    } catch {
      setError({ text: t('gen.failed'), noKey: false, kind });
      return false;
    } finally {
      setBusy(null);
    }
  }, [page.id, t]);

  const generate = useCallback(async () => {
    const ok = await act({ action: 'generate', goal, notes, direction }, 'generate');
    if (ok) { setFormOpen(false); setTab('overview'); setConcept('a'); }
  }, [act, goal, notes, direction]);

  // The one click the owner asked for: the first open with no package runs the generation by itself
  // (unless a run is already in flight from another tab or a reload: then this tab waits for it).
  useEffect(() => {
    const id = window.setTimeout(() => {
      setOrigin(window.location.origin);
      if (!autoRan.current && !initial.stored && initial.hasAiKey) {
        autoRan.current = true;
        if (initial.running) setError({ text: t('gen.busy'), noKey: false, busy: true });
        else void generate();
      }
    }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While another run is in flight, ask every 15 seconds whether the package has arrived.
  useEffect(() => {
    if (!error?.busy) return;
    const id = window.setInterval(async () => {
      const res = await fetch(`/api/pages/${page.id}/ad-concepts`, { cache: 'no-store' }).catch(() => null);
      const json = res ? await res.json().catch(() => null) : null;
      if (json?.success && json.view?.stored && json.view.stored.generatedAt !== view.stored?.generatedAt) {
        setView(json.view);
        setError(null);
        setFormOpen(false);
      } else if (json?.success && !json.view?.running) {
        setError(null);
      }
    }, 15_000);
    return () => window.clearInterval(id);
  }, [error?.busy, page.id, view.stored?.generatedAt]);

  const stored = view.stored;
  const pkg = stored?.package || null;
  const facts = view.facts;
  const flags = view.flags;
  const warnings = posterWarnings(facts);
  const current = pkg?.concepts.find((c) => c.id === concept) || pkg?.concepts[0] || null;

  /** The tracked link of a concept on a channel, in a language; the plain page link when none was created. */
  const linkFor = useCallback((id: ConceptId, channel: string, l: Lang): { url: string; tracked: boolean } => {
    const ch = AD_LINK_CHANNELS.find((x) => x.key === channel);
    const c = ch ? view.campaigns.find((x) => isAdCampaign(x, page.slug, ch)) : undefined;
    const ad = c?.ads.find((a) => a.content === `concept-${id}`);
    if (c && ad) return { url: campaignLink(origin, c, ad, l), tracked: true };
    return { url: `${origin}/${page.slug}${l === 'kh' ? '?lang=kh' : ''}`, tracked: false };
  }, [view.campaigns, origin, page.slug]);

  const brief = useMemo(() => (stored ? packageMarkdown(stored, { slug: page.slug, title: page.title, facts }, Object.fromEntries(CONCEPT_IDS.map((id) => [id, linkFor(id, 'facebook', 'en').url])), flags) : ''), [stored, page.slug, page.title, facts, linkFor, flags]);
  const droppedNumbers = stored ? stored.dropped.filter((d) => !d.startsWith('objections')).length : 0;
  const droppedObjections = stored ? stored.dropped.filter((d) => d.startsWith('objections')).length : 0;
  const plan = useMemo(() => postingPlan(facts, view.nowMs), [facts, view.nowMs]);
  const hasLinks = view.campaigns.length > 0;

  const editHref = page.template === 'builder' ? `/admin/builder/${page.id}` : `/admin/pages/${page.id}`;
  const angleLabel = (c: AdConcept) => t(`gen.angle.${c.angle}`);
  const pathOf = (c: AdConcept, f: string) => `concepts.${c.id}.${f}`;
  const clean = (rows: Array<[string, string, string?]>) => rows.filter(([, text, p]) => text && (!p || isClean(flags, p))).map(([l, text]) => `${l}: ${text}`).join('\n');

  return (
    <div className="pa-root space-y-4 max-w-6xl mx-auto pb-24 min-w-0" data-gen-ads-root={page.slug}>
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link href="/admin/pages" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white w-fit"><ArrowLeft className="w-4 h-4" /> {t('gen.back')}</Link>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> {t('gen.title')}</p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{page.title}</h1>
            <p className="text-[11px] font-mono text-amber-700 dark:text-amber-300 mt-0.5">/{page.slug} · {page.status}</p>
            <p className={`${SUB} mt-1 max-w-3xl`}>{t('gen.subtitle')}</p>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1" data-gen-made="">
              {stored ? t('gen.madeAt', { when: when(stored.generatedAt, lang), model: stored.model }) : t('gen.notYet')}
              {stored?.previous && <> · <button type="button" disabled={busy !== null} onClick={() => void act({ action: 'restore' }, 'restore')} className="underline cursor-pointer" data-gen-restore="">{t('gen.restore')}</button></>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button type="button" disabled={busy !== null} onClick={() => setFormOpen((v) => !v)} className={BTN_PRIMARY} data-gen-generate="">
              {busy === 'generate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {stored ? t('gen.regenerate') : t('gen.generate')}
            </button>
            {stored && <CopyButton text={brief} label={t('gen.copyBrief')} className={BTN_SOFT} />}
            <Link href={`/admin/campaigns?tab=posters&page=${encodeURIComponent(page.slug)}`} className={BTN_SOFT}><ImageIcon className="w-3.5 h-3.5" /> {t('gen.posterKit')}</Link>
            <Link href={editHref} className={BTN_SOFT}><Edit className="w-3.5 h-3.5" /> {t('gen.editPage')}</Link>
            <Link href={`/${page.slug}`} target="_blank" className={BTN_SOFT} aria-label={page.slug}><ExternalLink className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
      </div>

      {/* Generate form */}
      {formOpen && (
        <div className={`${CARD} p-4 space-y-3 border-amber-300 dark:border-amber-800`} data-gen-form="">
          <div>
            <span className={LABEL}>{t('gen.goal')}</span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('gen.goal')}>
              {(['auto', ...POSTER_GOALS] as Array<PosterGoal | 'auto'>).map((g) => {
                const blocked = g === 'auto' ? null : goalBlocked(g, facts);
                return (
                  <button key={g} type="button" role="radio" aria-checked={goal === g} disabled={Boolean(blocked)} title={blocked ? t(`cp.poster.blocked.${blocked}`) : undefined} onClick={() => setGoal(g)} data-gen-goal={g}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${goal === g ? 'bg-amber-400 text-black' : 'bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300'}`}>
                    {g === 'auto' ? t('gen.goal.auto') : t(`cp.poster.goal.${g}`)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor="gen-notes">{t('gen.notes')}</label>
              <textarea id="gen-notes" className={INPUT} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1500} data-gen-notes="" />
              <p className={`${SUB} mt-1`}>{t('gen.notesHint')}</p>
            </div>
            <div>
              <label className={LABEL} htmlFor="gen-direction">{t('gen.direction')}</label>
              <input id="gen-direction" className={INPUT} value={direction} onChange={(e) => setDirection(e.target.value)} maxLength={300} placeholder={t('gen.directionHint')} />
              <p className={`${SUB} mt-2`}>{t('gen.cost')}</p>
            </div>
          </div>
          {!view.hasAiKey && (
            <p className="text-xs text-red-700 dark:text-red-400" data-gen-nokey="">{t('gen.noKey')} <Link href="/admin/settings#ai" className="font-bold underline">{t('gen.setKey')}</Link></p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy !== null || !view.hasAiKey} onClick={() => { if (!stored || Date.now() - Date.parse(stored.generatedAt) > 10 * 60_000 || confirm(t('gen.confirmRegen'))) void generate(); }} className={BTN_PRIMARY} data-gen-run="">
              {busy === 'generate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {t('gen.run')}
            </button>
            {stored && <button type="button" onClick={() => setFormOpen(false)} className={BTN_SOFT}>{t('gen.cancel')}</button>}
          </div>
        </div>
      )}

      {busy === 'generate' && <p className={`${SUB} flex items-center gap-2`} data-gen-running=""><Loader2 className="w-4 h-4 animate-spin" /> {t('gen.running')}</p>}
      {error && (
        <p className={`text-xs flex flex-wrap items-center gap-2 ${error.busy ? 'text-amber-800 dark:text-amber-300' : 'text-red-700 dark:text-red-400'}`} role="status" data-gen-error="">
          {error.busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {error.text}
          {error.noKey ? <Link href="/admin/settings#ai" className="font-bold underline">{t('gen.setKey')}</Link> : !error.busy && (error.kind === 'generate' || !error.kind) && <button type="button" onClick={() => void generate()} className="font-bold underline cursor-pointer">{t('gen.tryAgain')}</button>}
        </p>
      )}

      {/* Warnings */}
      {(warnings.length > 0 || view.factsChanged || (stored && (stored.dropped.length > 0 || flags.length > 0 || stored.saveFailed))) && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1" data-gen-warnings="">
          {stored?.saveFailed && <p className="flex gap-2 font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {t('gen.warn.saveFailed')}</p>}
          {warnings.map((w) => <p key={w} className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {t(`cp.poster.warn.${w}`)}</p>)}
          {view.factsChanged && <p className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {t('gen.warn.factsChanged')}</p>}
          {droppedNumbers > 0 && <p className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {t('gen.warn.dropped', { n: droppedNumbers })}</p>}
          {droppedObjections > 0 && <p className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {t('gen.warn.droppedObjection', { n: droppedObjections })}</p>}
          {stored && flags.length > 0 && <p className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {t('gen.warn.flags', { n: new Set(flags.map((f) => f.path)).size })}</p>}
        </div>
      )}

      {pkg && current && (
        <>
          {/* Tabs */}
          <nav className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sticky z-10 bg-slate-50/95 dark:bg-[#06100B]/95 backdrop-blur py-2" style={{ top: topOffset }} aria-label={t('gen.title')} data-gen-tabs="">
            {TABS.map((id) => (
              <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined} data-gen-tab={id}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${tab === id ? 'bg-amber-400 text-black shadow' : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'}`}>
                {t(`gen.tab.${id}`)}
              </button>
            ))}
          </nav>

          {tab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-4">
              <Section title={t('gen.analysis')} testId="analysis">
                {([['audience', pkg.analysis.audienceEn, pkg.analysis.audienceKh], ['outcome', pkg.analysis.outcomeEn, pkg.analysis.outcomeKh], ['fear', pkg.analysis.fearEn, pkg.analysis.fearKh]] as Array<[string, string, string]>).map(([k, en, kh]) => (
                  <div key={k} className="py-1">
                    <div className={ROW_LABEL}>{t(`gen.analysis.${k}`)}</div>
                    <div className={ROW_TEXT}>{en}</div>
                    <FlagChips flags={flags} path={`analysis.${k}En`} />
                    {kh && <div className={`${ROW_TEXT} text-slate-600 dark:text-gray-300`}>{kh}</div>}
                    <FlagChips flags={flags} path={`analysis.${k}Kh`} />
                  </div>
                ))}
                {pkg.analysis.proofPoints.length > 0 && (
                  <div className="py-1">
                    <div className={ROW_LABEL}>{t('gen.analysis.proof')}</div>
                    <ul className="space-y-0.5">{pkg.analysis.proofPoints.map((p, i) => <li key={i} className={ROW_TEXT}>• {p.text} <span className="text-[10px] px-1 rounded bg-slate-100 dark:bg-emerald-950 text-slate-500">{p.source}</span><FlagChips flags={flags} path={`analysis.proofPoints.${i}.text`} /></li>)}</ul>
                  </div>
                )}
                {pkg.analysis.missingFacts.length > 0 && (
                  <div className="py-1 rounded-lg bg-slate-50 dark:bg-[#06100B] p-2">
                    <div className={ROW_LABEL}>{t('gen.analysis.missing')}</div>
                    <ul className="space-y-0.5">{pkg.analysis.missingFacts.map((m, i) => <li key={i} className={ROW_TEXT}>☐ {m}</li>)}</ul>
                    <Link href={editHref} className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline">{t('gen.editPage')} →</Link>
                  </div>
                )}
              </Section>
              <Section title={t('gen.facts')} testId="facts">
                {(['en', 'kh'] as Lang[]).map((l) => {
                  const lines = factLines(facts, l);
                  return (
                    <div key={l} className="py-1">
                      <div className={ROW_LABEL}>{LANG_LABEL[l]}</div>
                      {lines.length ? <ul className="space-y-0.5">{lines.map((x) => <li key={x} className={ROW_TEXT}>• {x}</li>)}</ul> : <p className={SUB}>{t('gen.facts.none')}</p>}
                    </div>
                  );
                })}
              </Section>
              <Section title={t('gen.targeting')} sub={t('gen.targeting.fixed')} testId="targeting">
                {([['interests', pkg.targeting.interests], ['jobTitles', pkg.targeting.jobTitles], ['exclude', pkg.targeting.exclude]] as Array<[string, string[]]>).filter(([, items]) => items.length).map(([k, items]) => (
                  <div key={k} className="py-1">
                    <div className="flex items-center gap-2"><span className={ROW_LABEL}>{t(`gen.targeting.${k}`)}</span><CopyButton text={items.join(', ')} label={t('gen.copyList')} /></div>
                    <div className="flex flex-wrap gap-1 mt-1">{items.map((x) => <span key={x} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-emerald-950 text-[11px] text-slate-700 dark:text-emerald-300">{x}</span>)}</div>
                  </div>
                ))}
                <Row label={`${t('gen.targeting.retargeting')} · EN`} text={pkg.targeting.retargetingEn} path="targeting.retargetingEn" flags={flags} />
                <Row label={`${t('gen.targeting.retargeting')} · ខ្មែរ`} text={pkg.targeting.retargetingKh} path="targeting.retargetingKh" flags={flags} />
              </Section>
              <Section title={t('gen.tests')} sub={t('gen.tests.read')} testId="tests">
                <ul className="space-y-1.5">
                  {pkg.abTests.map((x, i) => (
                    <li key={i} className={ROW_TEXT}>
                      <span className="font-bold">{x.variantA.toUpperCase()} {t('gen.tests.vs')} {x.variantB.toUpperCase()}</span> · {x.hypothesis}
                      <div className={SUB}>{t(`gen.metric.${x.metric}`)} · {t(`gen.runFor.${x.runFor}`)}</div>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          )}

          {tab === 'poster' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('gen.concept')}>
                {pkg.concepts.map((c) => (
                  <button key={c.id} type="button" role="radio" aria-checked={concept === c.id} onClick={() => setConcept(c.id)} data-gen-concept={c.id}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer text-left ${concept === c.id ? 'bg-amber-400 text-black shadow' : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-700 dark:text-gray-300'}`}>
                    {t('gen.concept')} {c.id.toUpperCase()} · {angleLabel(c)}{!isClean(flags, pathOf(c, 'goal')) || flags.some((f) => f.path === pathOf(c, 'goal')) ? ' ⚠' : ''}
                  </button>
                ))}
              </div>
              <div className={`${CARD} p-4 space-y-3`} data-gen-concept-card={current.id}>
                <div>
                  <div className={ROW_LABEL}>{t('gen.hook')}</div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{current.hook}</p>
                  <FlagChips flags={flags} path={pathOf(current, 'hook')} />
                  <FlagChips flags={flags} path={pathOf(current, 'goal')} />
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                  {(['en', 'kh'] as Lang[]).map((l) => {
                    const lines = conceptLines(facts, current, l);
                    const link = linkFor(current.id, 'facebook', l);
                    return (
                      <div key={l} className="rounded-xl border border-slate-200 dark:border-emerald-900/60 p-3" data-gen-poster-text={l}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{t('gen.poster.text')} · {LANG_LABEL[l]}</div>
                          <CopyButton text={canvaPack(facts, current, l, link.url)} label={t('gen.poster.canva')} />
                        </div>
                        <Row label={t('gen.poster.headline')} text={lines.headline} path={pathOf(current, l === 'kh' ? 'headlineKh' : 'headlineEn')} flags={flags} />
                        <Row label={t('gen.poster.support')} text={lines.support} path={pathOf(current, l === 'kh' ? 'supportKh' : 'supportEn')} flags={flags} />
                        <Row label={t('gen.poster.offer')} text={lines.offer} note={t('gen.poster.offerNote')} flags={flags} />
                        <Row label={t('gen.poster.button')} text={lines.cta} flags={flags} />
                        <Row label={t('gen.poster.trust')} text={lines.trust} flags={flags} />
                        <Row label={t('gen.poster.overlay')} text={lines.overlay} path={pathOf(current, l === 'kh' ? 'overlayKh' : 'overlayEn')} flags={flags} />
                        {l === 'kh' && <p className={`${SUB} mt-1`}>{t('gen.kh.review')}</p>}
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-emerald-900/60 p-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">{t('gen.poster.photo')}</div>
                  <Row label={t('gen.poster.scene')} text={current.scene} path={pathOf(current, 'scene')} flags={flags} />
                  <Row label={t('gen.poster.focal')} text={current.focalSubject} flags={flags} />
                  <Row label={t('gen.poster.colour')} text={`${facts.accent} · ${current.colourNote}`} flags={flags} />
                </div>
                <details className="rounded-xl border border-slate-200 dark:border-emerald-900/60 p-3">
                  <summary className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer flex items-center justify-between gap-2">
                    <span>{t('gen.poster.prompts')}</span>
                    <CopyButton text={conceptImagePrompts(facts, current).map(({ format, prompt }) => `## ${format.ratio} · ${format.width}×${format.height}\n${prompt}`).join('\n\n')} label={t('gen.copyPrompts')} />
                  </summary>
                  <div className="grid lg:grid-cols-2 gap-3 mt-3">
                    {conceptImagePrompts(facts, current).map(({ format, prompt }) => (
                      <PromptBox key={format.id} testId={`${current.id}-${format.id}`} title={`${format.ratio} · ${format.width}×${format.height} px`} note={`${format.placements}. ${t('cp.poster.safe')}: ${format.safeZone}.`} text={prompt} />
                    ))}
                  </div>
                </details>
                <PromptBox testId={`${current.id}-design`} title={t('gen.poster.designPrompt')} text={conceptDesignPrompt(facts, current, linkFor(current.id, 'facebook', 'en').url)} />
                {(() => {
                  const cards = carouselCards({ slug: page.slug, title: page.title, category: '', defaultLang: 'en', facts, ctaKind: view.ctaKind, sections: view.sections, text: { en: '', kh: '' } }, facts, current.goal, lang === 'kh' ? 'kh' : 'en');
                  return cards.length ? (
                    <div className="rounded-xl border border-slate-200 dark:border-emerald-900/60 p-3" data-gen-carousel="">
                      <div className="flex items-center justify-between gap-2 mb-1"><div className="text-xs font-bold text-slate-900 dark:text-white">{t('gen.meta.carousel')}</div><CopyButton text={cards.map((c, i) => `${i + 1}. ${c}`).join('\n')} label={t('gen.copyCards')} /></div>
                      <ol className="space-y-0.5">{cards.map((c, i) => <li key={i} className={ROW_TEXT}>{i + 1}. {c}</li>)}</ol>
                    </div>
                  ) : null;
                })()}
                <div className="rounded-xl border border-slate-200 dark:border-emerald-900/60 p-3 space-y-1.5" data-gen-links="">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{t('gen.links.forConcept', { id: current.id.toUpperCase() })}</div>
                  {hasLinks ? (
                    <ul className="space-y-1.5">
                      {(['facebook', 'telegram'] as const).flatMap((ch) => (['en', 'kh'] as Lang[]).map((l) => <LinkRow key={`${ch}-${l}`} label={`${ch} · ${LANG_LABEL[l]}`} url={linkFor(current.id, ch, l).url} fileName={`${page.slug}-${current.id}-${ch}-${l}`} />))}
                    </ul>
                  ) : (
                    <p className={SUB}>{t('gen.links.none')} <button type="button" disabled={busy !== null} onClick={() => void act({ action: 'links' }, 'links')} className="font-bold underline cursor-pointer" data-gen-links-create="">{t('gen.links.create')}</button></p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'captions' && (
            <div className="space-y-4">
              <div className={`${CARD} p-3 text-xs flex flex-wrap items-center gap-2`} data-gen-links-strip="">
                {hasLinks ? <span className={SUB}>{t('gen.links.hint')}</span> : (
                  <>
                    <span className={SUB}>{t('gen.links.none')}</span>
                    <button type="button" disabled={busy !== null} onClick={() => void act({ action: 'links' }, 'links')} className={BTN_PRIMARY} data-gen-links-create="">
                      {busy === 'links' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} {t('gen.links.create')}
                    </button>
                  </>
                )}
              </div>
              <Section title={t('gen.tab.facebook')} testId="facebook">
                {pkg.concepts.map((c) => {
                  const offerEn = conceptLines(facts, c, 'en').offer;
                  const offerKh = conceptLines(facts, c, 'kh').offer;
                  const all = clean([[`Primary EN`, c.meta.primaryEn, pathOf(c, 'meta.primaryEn')], ['Offer line EN', offerEn], ['Headline EN', c.meta.headlineEn, pathOf(c, 'meta.headlineEn')], ['Description EN', c.meta.descriptionEn, pathOf(c, 'meta.descriptionEn')], ['Website URL EN', linkFor(c.id, 'facebook', 'en').url], ['Primary KH', c.meta.primaryKh, pathOf(c, 'meta.primaryKh')], ['Offer line KH', offerKh], ['Headline KH', c.meta.headlineKh, pathOf(c, 'meta.headlineKh')], ['Description KH', c.meta.descriptionKh, pathOf(c, 'meta.descriptionKh')], ['Website URL KH', linkFor(c.id, 'facebook', 'kh').url]]);
                  return (
                    <div key={c.id} className="rounded-xl border border-slate-200 dark:border-emerald-900/60 p-3" data-gen-caption={`facebook-${c.id}`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{t('gen.concept')} {c.id.toUpperCase()} · {angleLabel(c)}</div>
                        <CopyButton text={all} label={t('gen.copyAll', { platform: `Facebook ${c.id.toUpperCase()}` })} />
                      </div>
                      <Row label={`${t('gen.meta.primary')} · EN`} text={c.meta.primaryEn} path={pathOf(c, 'meta.primaryEn')} limit={LIMITS.metaPrimary} flags={flags} copy={`${c.meta.primaryEn}${offerEn ? `\n\n${offerEn}` : ''}`} />
                      <Row label={`${t('gen.meta.primary')} · ខ្មែរ`} text={c.meta.primaryKh} path={pathOf(c, 'meta.primaryKh')} limit={LIMITS.metaPrimary} flags={flags} copy={`${c.meta.primaryKh}${offerKh ? `\n\n${offerKh}` : ''}`} />
                      <Row label={`${t('gen.poster.offer')}`} text={offerEn} note={t('gen.poster.offerNote')} flags={flags} />
                      <Row label={`${t('gen.meta.headline')} · EN`} text={c.meta.headlineEn} path={pathOf(c, 'meta.headlineEn')} limit={LIMITS.metaHeadline} flags={flags} />
                      <Row label={`${t('gen.meta.headline')} · ខ្មែរ`} text={c.meta.headlineKh} path={pathOf(c, 'meta.headlineKh')} limit={LIMITS.metaHeadline} flags={flags} />
                      <Row label={`${t('gen.meta.description')} · EN`} text={c.meta.descriptionEn} path={pathOf(c, 'meta.descriptionEn')} limit={LIMITS.metaDescription} flags={flags} />
                      <Row label={`${t('gen.meta.description')} · ខ្មែរ`} text={c.meta.descriptionKh} path={pathOf(c, 'meta.descriptionKh')} limit={LIMITS.metaDescription} flags={flags} />
                      <Row label={`${t('gen.meta.url')} · EN`} text={linkFor(c.id, 'facebook', 'en').url} flags={flags} note={linkFor(c.id, 'facebook', 'en').tracked ? undefined : t('gen.links.noLink')} />
                      <Row label={`${t('gen.meta.url')} · ខ្មែរ`} text={linkFor(c.id, 'facebook', 'kh').url} flags={flags} />
                    </div>
                  );
                })}
              </Section>
              <Section title={t('gen.tab.telegram')} testId="telegram">
                {pkg.concepts.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 dark:border-emerald-900/60 p-3" data-gen-caption={`telegram-${c.id}`}>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">{t('gen.concept')} {c.id.toUpperCase()} · {angleLabel(c)}</div>
                    {(['en', 'kh'] as Lang[]).map((l) => {
                      const post = l === 'kh' ? c.telegram.postKh : c.telegram.postEn;
                      const offer = conceptLines(facts, c, l).offer;
                      const url = linkFor(c.id, 'telegram', l).url;
                                      const full = [post, offer, url].filter(Boolean).join('\n\n');
                      return <Row key={l} label={`${t('gen.telegram.post')} · ${LANG_LABEL[l]}`} text={post} path={pathOf(c, l === 'kh' ? 'telegram.postKh' : 'telegram.postEn')} limit={LIMITS.telegramCaption} count={full} flags={flags} copy={full} note={t('gen.telegram.withLink')} />;
                    })}
                  </div>
                ))}
              </Section>
              <Section title={t('gen.tab.tiktok')} testId="tiktok">
                {pkg.concepts.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 dark:border-emerald-900/60 p-3" data-gen-caption={`tiktok-${c.id}`}>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">{t('gen.concept')} {c.id.toUpperCase()} · {angleLabel(c)}</div>
                    {(['en', 'kh'] as Lang[]).map((l) => {
                      const cap = `${l === 'kh' ? c.tiktok.captionKh : c.tiktok.captionEn} ${c.tiktok.hashtags.join(' ')}`.trim();
                      return <Row key={l} label={`${t('gen.tiktok.caption')} · ${LANG_LABEL[l]}`} text={cap} path={pathOf(c, l === 'kh' ? 'tiktok.captionKh' : 'tiktok.captionEn')} limit={LIMITS.tiktokCaption} flags={flags} />;
                    })}
                    <Row label={t('gen.meta.url')} text={linkFor(c.id, 'tiktok', 'en').url} flags={flags} />
                  </div>
                ))}
              </Section>
              <Section title={t('gen.linkedin')} testId="linkedin" action={<CopyButton text={clean([['', pkg.linkedin.introEn, 'linkedin.introEn'], ['', pkg.linkedin.bodyEn, 'linkedin.bodyEn'], ['', pkg.linkedin.hashtags.join(' ')], ['', linkFor('a', 'linkedin', 'en').url]]).replace(/^: /gm, '')} label={t('gen.copyAll', { platform: 'LinkedIn' })} />}>
                <Row label={t('gen.linkedin.intro')} text={pkg.linkedin.introEn} path="linkedin.introEn" limit={LIMITS.linkedinIntro} flags={flags} />
                <Row label={t('gen.linkedin.body')} text={pkg.linkedin.bodyEn} path="linkedin.bodyEn" limit={LIMITS.linkedinBody} flags={flags} />
                <Row label={t('gen.tiktok.hashtags')} text={pkg.linkedin.hashtags.join(' ')} flags={flags} />
                <Row label={t('gen.meta.url')} text={linkFor('a', 'linkedin', 'en').url} flags={flags} />
              </Section>
              <Section title={t('gen.google')} sub={t('gen.google.note')} testId="google">
                <div className="py-1">
                  <div className="flex items-center gap-2"><span className={ROW_LABEL}>{t('gen.google.headlines')}</span><CopyButton text={[...googleFactHeadlines(facts), ...pkg.google.headlines.filter((_, i) => isClean(flags, `google.headlines.${i}`))].join('\n')} label={t('gen.copyList')} /></div>
                  {googleFactHeadlines(facts).map((h) => <Row key={h} label="" text={h} note={t('gen.google.factHeadlines')} limit={LIMITS.googleHeadline} flags={flags} />)}
                  {pkg.google.headlines.map((h, i) => <Row key={i} label="" text={h} path={`google.headlines.${i}`} limit={LIMITS.googleHeadline} flags={flags} />)}
                </div>
                <div className="py-1">
                  <div className="flex items-center gap-2"><span className={ROW_LABEL}>{t('gen.google.descriptions')}</span><CopyButton text={pkg.google.descriptions.filter((_, i) => isClean(flags, `google.descriptions.${i}`)).join('\n')} label={t('gen.copyList')} /></div>
                  {pkg.google.descriptions.map((h, i) => <Row key={i} label="" text={h} path={`google.descriptions.${i}`} limit={LIMITS.googleDescription} flags={flags} />)}
                </div>
                {pkg.google.sitelinks.length > 0 && <div className="py-1"><span className={ROW_LABEL}>{t('gen.google.sitelinks')}</span>{pkg.google.sitelinks.map((h, i) => <Row key={i} label="" text={h} path={`google.sitelinks.${i}`} limit={LIMITS.googleSitelink} flags={flags} />)}</div>}
                {pkg.google.keywords.length > 0 && <Row label={t('gen.google.keywords')} text={pkg.google.keywords.join(', ')} flags={flags} />}
                <Row label={t('gen.meta.url')} text={linkFor('a', 'google', 'en').url} flags={flags} />
              </Section>
            </div>
          )}

          {tab === 'video' && (
            <Section title={t('gen.video')} testId="video" action={<CopyButton text={[...pkg.video.shots.map((s, i) => `${i + 1}. ${s.seconds}s · ${s.film}\n   ${t('gen.video.onScreen')}: ${s.onScreenEn} / ${s.onScreenKh}\n   ${t('gen.video.voice')}: ${s.voiceKh} (${s.voiceEn})`), `${t('gen.video.offerRow')}: ${conceptLines(facts, current, 'kh').offer} · ${conceptLines(facts, current, 'kh').cta}`, `${t('gen.video.closing')}: ${pkg.video.closingKh} (${pkg.video.closingEn})`, `${t('gen.video.music')}: ${pkg.video.musicMood}`].join('\n')} label={t('gen.video.copy')} />}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-[10px] uppercase text-slate-400"><th className="py-1 pr-2">{t('gen.video.sec')}</th><th className="py-1 pr-2">{t('gen.video.film')}</th><th className="py-1 pr-2">{t('gen.video.onScreen')}</th><th className="py-1">{t('gen.video.voice')}</th></tr></thead>
                  <tbody>
                    {pkg.video.shots.map((s, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-emerald-900/40 align-top">
                        <td className="py-1.5 pr-2 font-mono">{s.seconds}</td>
                        <td className="py-1.5 pr-2 text-slate-800 dark:text-gray-100">{s.film}<FlagChips flags={flags} path={`video.shots.${i}.film`} /></td>
                        <td className="py-1.5 pr-2"><div className="font-bold text-slate-900 dark:text-white">{s.onScreenEn}</div><div className="text-slate-700 dark:text-gray-300">{s.onScreenKh}</div></td>
                        <td className="py-1.5"><div className="text-slate-900 dark:text-white">{s.voiceKh}</div><div className={SUB}>{s.voiceEn}</div><FlagChips flags={flags} path={`video.shots.${i}.voiceKh`} /><FlagChips flags={flags} path={`video.shots.${i}.voiceEn`} /></td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-100 dark:border-emerald-900/40 align-top bg-emerald-50/60 dark:bg-emerald-950/30">
                      <td className="py-1.5 pr-2 font-mono">3</td>
                      <td className="py-1.5 pr-2 text-slate-800 dark:text-gray-100">{t('gen.video.offerRow')}</td>
                      <td className="py-1.5 pr-2"><div className="font-bold text-slate-900 dark:text-white">{conceptLines(facts, current, 'en').offer}</div><div className="text-slate-700 dark:text-gray-300">{conceptLines(facts, current, 'kh').offer}</div></td>
                      <td className="py-1.5"><div className="text-slate-900 dark:text-white">{pkg.video.closingKh}</div><div className={SUB}>{pkg.video.closingEn}</div><FlagChips flags={flags} path="video.closingKh" /><FlagChips flags={flags} path="video.closingEn" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Row label={t('gen.video.music')} text={pkg.video.musicMood} flags={flags} />
            </Section>
          )}

          {tab === 'sales' && (
            <div className="grid lg:grid-cols-2 gap-4">
              <Section title={t('gen.reply')} sub={t('gen.reply.note')} testId="reply">
                <Row label={`${t('gen.reply.first')} · EN`} text={pkg.reply.firstEn} path="reply.firstEn" flags={flags} />
                <Row label={`${t('gen.reply.first')} · ខ្មែរ`} text={pkg.reply.firstKh} path="reply.firstKh" flags={flags} />
                <Row label={`${t('gen.reply.followUp')} · EN`} text={pkg.reply.followUpEn} path="reply.followUpEn" flags={flags} />
                <Row label={`${t('gen.reply.followUp')} · ខ្មែរ`} text={pkg.reply.followUpKh} path="reply.followUpKh" flags={flags} />
              </Section>
              <Section title={t('gen.objections')} testId="objections">
                {pkg.objections.length === 0 && <p className={SUB}>{t('gen.objections.none')}</p>}
                {pkg.objections.map((o, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 dark:border-emerald-900/60 p-3">
                    <div className={SUB}>{t('gen.objections.source')}: {o.sourceQuestion}</div>
                    <Row label="EN" text={`${o.objectionEn}\n${o.answerEn}`} path={`objections.${i}.answerEn`} flags={flags} />
                    <FlagChips flags={flags} path={`objections.${i}.objectionEn`} />
                    <Row label="ខ្មែរ" text={`${o.objectionKh}\n${o.answerKh}`} path={`objections.${i}.answerKh`} flags={flags} />
                    <FlagChips flags={flags} path={`objections.${i}.objectionKh`} />
                  </div>
                ))}
              </Section>
            </div>
          )}

          {tab === 'plan' && (
            <Section title={t('gen.plan')} testId="plan" action={<CopyButton text={plan.map((r) => `${planDay(r, 'en') || t('gen.plan.now')}: ${t(`gen.plan.step.${r.step}`)}`).join('\n')} label={t('gen.copyList')} />}>
              <table className="w-full text-xs">
                <thead><tr className="text-left text-[10px] uppercase text-slate-400"><th className="py-1 pr-3 w-36">{t('gen.plan.when')}</th><th className="py-1">{t('gen.plan.what')}</th></tr></thead>
                <tbody>
                  {plan.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-emerald-900/40 align-top" data-gen-plan-row={r.step}>
                      <td className="py-1.5 pr-3 font-bold text-slate-900 dark:text-white">{planDay(r, lang === 'kh' ? 'kh' : 'en') || (r.step === 'launch' ? t('gen.plan.now') : '')}</td>
                      <td className="py-1.5 text-slate-800 dark:text-gray-100">{t(`gen.plan.step.${r.step}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
