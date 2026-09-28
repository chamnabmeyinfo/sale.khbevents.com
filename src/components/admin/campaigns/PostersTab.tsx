'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useUrlParam } from '@/lib/use-browser-state';
import { campaignLink, type Campaign } from '@/lib/campaigns';
import {
  POSTER_FORMATS,
  POSTER_GOALS,
  allInOnePrompt,
  goalBlocked,
  imagePrompt,
  posterCopy,
  posterWarnings,
  type PosterCopy,
  type PosterFacts,
  type PosterGoal,
} from '@/lib/ad-posters';
import type { PageOption } from './CampaignsClient';
import { LinkRow } from './ManageTab';
import { CopyButton, PromptBox } from './CopyButton';
import { CARD, H2, INPUT, LABEL, SUB } from './ui';

function CopyLines({ lang, copy }: { lang: string; copy: PosterCopy }) {
  const { t } = useLanguage();
  const rows: Array<[string, string]> = [
    [t('cp.poster.headline'), copy.headline],
    [t('cp.poster.support'), copy.support],
    [t('cp.poster.offer'), copy.offer],
    [t('cp.poster.button'), copy.cta],
    [t('cp.poster.trust'), copy.trust],
  ];
  return (
    <div className="rounded-xl border border-slate-200 dark:border-emerald-900/60 p-3" data-poster-copy={lang}>
      <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">{lang === 'en' ? 'English' : 'ខ្មែរ'}</div>
      <ul className="space-y-1.5">
        {rows.filter(([, v]) => v).map(([label, value]) => (
          <li key={label} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase text-slate-400">{label}</div>
              <div className="text-xs text-slate-800 dark:text-gray-100">{value}</div>
            </div>
            <CopyButton text={value} />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PosterIdea { angle: string; headlineEn: string; headlineKh: string; supportEn: string; supportKh: string }

/** Optional: headline ideas written by the primary AI from the same facts (a person picks; numbers are checked). */
function AiIdeas({ slug, goal }: { slug: string; goal: PosterGoal }) {
  const { t } = useLanguage();
  const [ideas, setIdeas] = useState<PosterIdea[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; noKey: boolean } | null>(null);
  const [forKey, setForKey] = useState('');
  const key = `${slug}:${goal}`;
  const shown = forKey === key ? ideas : null;

  const ask = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/campaigns/posters/ideas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: slug, goal }) });
      const json = await res.json().catch(() => ({}));
      if (!json?.success) {
        setError({ text: json?.error || t('cp.poster.ai.failed'), noKey: json?.code === 'no_key' });
        return;
      }
      setIdeas(json.ideas || []);
      setForKey(key);
    } catch {
      setError({ text: t('cp.poster.ai.failed'), noKey: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-800 p-3 space-y-2" data-poster-ai="">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy} onClick={() => void ask()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black cursor-pointer disabled:opacity-50" data-poster-ai-ask="">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '✨'} {t('cp.poster.ai.ask')}
        </button>
        <span className={SUB}>{t('cp.poster.ai.hint')}</span>
      </div>
      {error && (
        <p className="text-xs text-red-700 dark:text-red-400" role="status" data-poster-ai-error="">
          {error.text}{' '}
          {error.noKey && <Link href="/admin/settings#ai" className="font-bold underline">{t('cp.poster.ai.setKey')}</Link>}
        </p>
      )}
      {shown && shown.length === 0 && <p className={SUB}>{t('cp.poster.ai.none')}</p>}
      {shown && shown.length > 0 && (
        <ul className="grid lg:grid-cols-2 gap-2">
          {shown.map((idea, i) => (
            <li key={i} className="rounded-lg bg-slate-50 dark:bg-[#06100B] p-2.5 space-y-1.5" data-poster-idea="">
              <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">{idea.angle}</div>
              {[idea.headlineEn, idea.supportEn, idea.headlineKh, idea.supportKh].filter(Boolean).map((line, j) => (
                <div key={j} className="flex items-start gap-2">
                  <div className={`min-w-0 flex-1 text-xs ${j % 2 === 0 ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>{line}</div>
                  <CopyButton text={line} />
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Admin → Campaigns → Ad posters: prompts and ad text built from a trip page's live facts. */
export default function PostersTab({ pages }: { pages: PageOption[] }) {
  const { t } = useLanguage();
  // ?page=<slug> (from Gen Ads) opens the kit on that page.
  const urlPage = useUrlParam('page');
  const [slug, setSlug] = useState(pages[0]?.slug || '');
  useEffect(() => {
    if (!urlPage || !pages.some((p) => p.slug === urlPage)) return;
    const id = window.setTimeout(() => setSlug(urlPage), 0);
    return () => window.clearTimeout(id);
  }, [urlPage, pages]);
  const [facts, setFacts] = useState<PosterFacts | null>(null);
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState<PosterGoal>('launch');
  const [scene, setScene] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [origin, setOrigin] = useState('https://sale.khbevents.com');

  useEffect(() => {
    const id = window.setTimeout(() => setOrigin(window.location.origin), 0);
    fetch('/api/campaigns', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (j?.success) setCampaigns(j.campaigns || []); })
      .catch(() => undefined);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    const id = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/campaigns/posters?page=${encodeURIComponent(slug)}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((j) => {
          if (!alive) return;
          const f: PosterFacts | null = j?.success ? j.facts : null;
          setFacts(f);
          setScene(f?.theme || '');
          setGoal((g) => (f && goalBlocked(g, f) ? 'launch' : g));
        })
        .catch(() => { if (alive) setFacts(null); })
        .finally(() => { if (alive) setLoading(false); });
    }, 0);
    return () => { alive = false; window.clearTimeout(id); };
  }, [slug]);

  const pageCampaigns = useMemo(() => campaigns.filter((c) => c.pageSlug === slug), [campaigns, slug]);
  const firstLink = pageCampaigns[0] ? campaignLink(origin, pageCampaigns[0]) : undefined;
  const kit = useMemo(() => {
    if (!facts || goalBlocked(goal, facts)) return null;
    return {
      en: posterCopy(facts, goal, 'en'),
      kh: posterCopy(facts, goal, 'kh'),
      all: allInOnePrompt(facts, goal, scene, firstLink),
      images: POSTER_FORMATS.map((f) => ({ format: f, prompt: imagePrompt(facts, goal, f, scene) })),
      warnings: posterWarnings(facts),
    };
  }, [facts, goal, scene, firstLink]);

  return (
    <div className="space-y-4">
      <div className={`${CARD} p-4 space-y-3`}>
        <div>
          <h2 className={H2}>{t('cp.poster.title')}</h2>
          <p className={`${SUB} mt-1`}>{t('cp.poster.intro')}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor="poster-page">{t('cp.poster.page')}</label>
            <select id="poster-page" className={INPUT} value={slug} onChange={(e) => setSlug(e.target.value)} data-poster-page="">
              {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <span className={LABEL}>{t('cp.poster.goal')}</span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('cp.poster.goal')}>
              {POSTER_GOALS.map((g) => {
                const blocked = facts ? goalBlocked(g, facts) : null;
                return (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={goal === g}
                    disabled={Boolean(blocked)}
                    title={blocked ? t(`cp.poster.blocked.${blocked}`) : undefined}
                    onClick={() => setGoal(g)}
                    data-poster-goal={g}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${goal === g ? 'bg-amber-400 text-black' : 'bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300'}`}
                  >
                    {t(`cp.poster.goal.${g}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <label className={LABEL} htmlFor="poster-scene">{t('cp.poster.scene')}</label>
          <textarea id="poster-scene" className={INPUT} rows={2} value={scene} onChange={(e) => setScene(e.target.value)} />
          <p className={`${SUB} mt-1`}>{t('cp.poster.sceneHint')}</p>
        </div>
      </div>

      {loading && <p className={`${SUB} flex items-center gap-2`}><Loader2 className="w-4 h-4 animate-spin" /> {t('cp.loading')}</p>}

      {kit && (
        <>
          {kit.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1" data-poster-warnings="">
              {kit.warnings.map((w) => <p key={w} className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {t(`cp.poster.warn.${w}`)}</p>)}
            </div>
          )}

          <div className={`${CARD} p-4 space-y-3`}>
            <h3 className={H2}>{t('cp.poster.step1')}</h3>
            <p className={SUB}>{t('cp.poster.step1Hint')}</p>
            <div className="grid lg:grid-cols-2 gap-3">
              {kit.images.map(({ format, prompt }) => (
                <PromptBox
                  key={format.id}
                  testId={format.id}
                  title={`${format.ratio} · ${format.width}×${format.height} px`}
                  note={`${format.placements}. ${t('cp.poster.safe')}: ${format.safeZone}.`}
                  text={prompt}
                />
              ))}
            </div>
          </div>

          <div className={`${CARD} p-4 space-y-3`}>
            <h3 className={H2}>{t('cp.poster.step2')}</h3>
            <p className={SUB}>{t('cp.poster.step2Hint')}</p>
            <div className="grid lg:grid-cols-2 gap-3">
              <CopyLines lang="en" copy={kit.en} />
              <CopyLines lang="kh" copy={kit.kh} />
            </div>
            <AiIdeas slug={slug} goal={goal} />
          </div>

          <div className={`${CARD} p-4 space-y-3`}>
            <h3 className={H2}>{t('cp.poster.step3')}</h3>
            {pageCampaigns.length ? (
              <ul className="space-y-1.5">
                {pageCampaigns.flatMap((c) => [
                  <LinkRow key={`${c.id}-main`} label={`${c.name}`} url={campaignLink(origin, c)} fileName={`${c.slug}-main`} />,
                  ...c.ads.map((a) => <LinkRow key={`${c.id}-${a.id}`} label={`${c.name} · ${a.name}`} url={campaignLink(origin, c, a)} fileName={`${c.slug}-${a.id}`} />),
                ])}
              </ul>
            ) : (
              <p className={SUB}>{t('cp.poster.noCampaign')} <Link href="/admin/campaigns?tab=manage" className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline">{t('cp.tab.manage')}</Link></p>
            )}
          </div>

          <div className={`${CARD} p-4 space-y-3`}>
            <h3 className={H2}>{t('cp.poster.step4')}</h3>
            <PromptBox testId="all" title={t('cp.poster.allInOne')} note={t('cp.poster.allInOneHint')} text={kit.all} />
          </div>
        </>
      )}
    </div>
  );
}
