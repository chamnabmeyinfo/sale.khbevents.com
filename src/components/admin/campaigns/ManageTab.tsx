'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, Loader2, Pencil, Plus, QrCode, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { CHANNELS, CHANNEL_IDS, STATUSES, campaignLink, slugify, spendBetween, type Campaign, type CampaignChannel } from '@/lib/campaigns';
import { qrPath } from '@/lib/qr';
import { BTN_PRIMARY, BTN_SOFT, CARD, H2, INPUT, LABEL, SUB, money } from './ui';
import type { PageOption } from './CampaignsClient';

type Draft = Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'spend' | 'ads' | 'budget'> & {
  id?: string;
  budget: string;
  ads: Array<{ id?: string; name: string; content?: string }>;
  spend: Array<{ date: string; amount: string; note?: string }>;
};

const today = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

function toDraft(c: Campaign | null, pages: PageOption[]): Draft {
  if (!c) {
    return { name: '', slug: '', pageSlug: pages[0]?.slug || '', channel: 'facebook', source: CHANNELS.facebook.source, medium: CHANNELS.facebook.medium, status: 'active', startDate: today(), endDate: '', budget: '', ads: [], spend: [], audience: '', notes: '' };
  }
  return { ...c, budget: c.budget !== undefined ? String(c.budget) : '', ads: c.ads.map((a) => ({ ...a })), spend: c.spend.map((s) => ({ ...s, amount: String(s.amount) })), endDate: c.endDate || '', startDate: c.startDate || '', audience: c.audience || '', notes: c.notes || '' };
}

export default function ManageTab({ pages }: { pages: PageOption[] }) {
  const { t } = useLanguage();
  const [list, setList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [origin, setOrigin] = useState('https://sale.khbevents.com');

  useEffect(() => {
    const id = window.setTimeout(() => setOrigin(window.location.origin), 0);
    return () => window.clearTimeout(id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t('cp.failed'));
      setList(data.campaigns);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('cp.failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        ...draft,
        budget: draft.budget === '' ? undefined : Number(draft.budget),
        spend: draft.spend.filter((s) => s.amount !== '').map((s) => ({ ...s, amount: Number(s.amount) })),
        ads: draft.ads.filter((a) => a.name.trim()),
      };
      const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaign: body }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t('cp.failed'));
      setList(data.campaigns);
      setDraft(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('cp.failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Campaign) => {
    if (!confirm(t('cp.confirmDelete', { name: c.name }))) return;
    const res = await fetch(`/api/campaigns?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (data.campaigns) setList(data.campaigns);
  };

  const pageTitle = (slug: string) => pages.find((p) => p.slug === slug)?.title || slug;

  return (
    <div className="space-y-4">
      <div className={`${CARD} p-4 text-xs text-slate-600 dark:text-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <p>{t('cp.howto')}</p>
        <button type="button" className={`${BTN_PRIMARY} shrink-0`} onClick={() => setDraft(toDraft(null, pages))}><Plus className="w-4 h-4" /> {t('cp.new')}</button>
      </div>
      {error && <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">{error}</div>}
      {draft && <Editor draft={draft} setDraft={setDraft} pages={pages} saving={saving} onSave={() => void save()} onCancel={() => setDraft(null)} origin={origin} />}
      {loading && !list.length ? (
        <p className={`${SUB} flex items-center gap-2`}><Loader2 className="w-4 h-4 animate-spin" /> {t('cp.loading')}</p>
      ) : list.length === 0 && !draft ? (
        <div className={`${CARD} p-6 text-xs text-slate-600 dark:text-gray-300`}>{t('cp.manageEmpty')}</div>
      ) : (
        <div className="grid [&>*]:min-w-0 lg:grid-cols-2 gap-4">
          {list.map((c) => (
            <article key={c.id} className={`${CARD} p-5 space-y-3`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate">{c.name}</h3>
                  <p className={`${SUB} truncate`}>{t(`cp.ch.${c.channel}`)} · {pageTitle(c.pageSlug)} · <span className="font-mono">{c.slug}</span></p>
                  <p className={`${SUB} mt-0.5`}>
                    <span className="font-bold">{t(`cp.status.${c.status}`)}</span>
                    {c.startDate ? ` · ${c.startDate}${c.endDate ? ` → ${c.endDate}` : ''}` : ''}
                    {spendBetween(c) ? ` · ${t('cp.card.spent', { v: spendBetween(c) })}` : ''}
                    {c.budget ? ` · ${t('cp.card.budget', { v: c.budget })}` : ''}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button type="button" className={BTN_SOFT} onClick={() => setDraft(toDraft(c, pages))} aria-label={t('cp.edit')}><Pencil className="w-3.5 h-3.5" /></button>
                  <button type="button" className={`${BTN_SOFT} text-rose-600`} onClick={() => void remove(c)} aria-label={t('cp.delete')}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <Links campaign={c} origin={origin} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Links({ campaign, origin }: { campaign: Pick<Campaign, 'pageSlug' | 'slug' | 'source' | 'medium' | 'ads' | 'name'>; origin: string }) {
  const { t } = useLanguage();
  const rows = [
    { key: 'main', label: t('cp.linkMain'), url: campaignLink(origin, campaign) },
    ...campaign.ads.map((a) => ({ key: a.id, label: a.name, url: campaignLink(origin, campaign, a) })),
    { key: 'kh', label: t('cp.linkKh'), url: campaignLink(origin, campaign, undefined, 'kh') },
  ];
  return (
    <div>
      <div className="text-[11px] font-bold text-slate-600 dark:text-gray-400 mb-1.5">{t('cp.links')}</div>
      <ul className="space-y-1.5">
        {rows.map((r) => <LinkRow key={r.key} label={r.label} url={r.url} fileName={`${campaign.slug}-${r.key}`} />)}
      </ul>
    </div>
  );
}

function LinkRow({ label, url, fileName }: { label: string; url: string; fileName: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const qr = useMemo(() => (showQr ? qrPath(url) : null), [showQr, url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // A PNG of the QR code (1024 px) for ads, posters and print.
  const download = () => {
    if (!qr) return;
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cell = size / (qr.size + 8);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.setTransform(cell, 0, 0, cell, cell * 4, cell * 4);
    ctx.fillStyle = '#000';
    ctx.fill(new Path2D(qr.d));
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${fileName}-qr.png`;
    a.click();
  };

  return (
    <li className="rounded-lg border border-slate-200 dark:border-emerald-900/60 p-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-slate-800 dark:text-gray-200 truncate">{label}</div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-gray-400 truncate" title={url}>{url}</div>
        </div>
        <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-emerald-950 text-[11px] font-bold text-slate-700 dark:text-emerald-300 cursor-pointer shrink-0">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied ? t('cp.copied') : t('cp.copy')}
        </button>
        <button type="button" onClick={() => setShowQr((v) => !v)} aria-pressed={showQr} aria-label={t('cp.qr')} className="p-1.5 rounded-md bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 cursor-pointer shrink-0"><QrCode className="w-3.5 h-3.5" /></button>
      </div>
      {qr && (
        <div className="mt-2 flex items-end gap-3">
          <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} className="w-28 h-28 rounded bg-white" role="img" aria-label={url} shapeRendering="crispEdges">
            <rect x={-2} y={-2} width={qr.size + 4} height={qr.size + 4} fill="#fff" />
            <path d={qr.d} fill="#000" />
          </svg>
          <button type="button" onClick={download} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-emerald-950 text-[11px] font-bold text-slate-700 dark:text-emerald-300 cursor-pointer"><Download className="w-3 h-3" /> {t('cp.qrDownload')}</button>
        </div>
      )}
    </li>
  );
}

function Editor({ draft, setDraft, pages, saving, onSave, onCancel, origin }: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  pages: PageOption[];
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  origin: string;
}) {
  const { t } = useLanguage();
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const [advanced, setAdvanced] = useState(false);
  const slug = draft.slug || slugify(draft.name);
  const preview = draft.pageSlug && slug ? campaignLink(origin, { pageSlug: draft.pageSlug, slug, source: draft.source, medium: draft.medium }) : '';
  const setChannel = (channel: CampaignChannel) => set({ channel, source: CHANNELS[channel].source, medium: CHANNELS[channel].medium });

  return (
    <div className={`${CARD} p-5 space-y-4 border-amber-300 dark:border-amber-700`}>
      <div className="grid [&>*]:min-w-0 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="cp-name">{t('cp.field.name')}</label>
          <input id="cp-name" className={INPUT} value={draft.name} placeholder={t('cp.field.nameHint')} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div>
          <label className={LABEL} htmlFor="cp-page">{t('cp.field.page')}</label>
          <select id="cp-page" className={INPUT} value={draft.pageSlug} onChange={(e) => set({ pageSlug: e.target.value })}>
            {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="cp-channel">{t('cp.field.channel')}</label>
          <select id="cp-channel" className={INPUT} value={draft.channel} onChange={(e) => setChannel(e.target.value as CampaignChannel)}>
            {CHANNEL_IDS.map((c) => <option key={c} value={c}>{t(`cp.ch.${c}`)}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="cp-status">{t('cp.field.status')}</label>
          <select id="cp-status" className={INPUT} value={draft.status} onChange={(e) => set({ status: e.target.value as Draft['status'] })}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`cp.status.${s}`)}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="cp-budget">{t('cp.field.budget')}</label>
          <input id="cp-budget" className={INPUT} inputMode="decimal" value={draft.budget} onChange={(e) => set({ budget: e.target.value.replace(/[^\d.]/g, '') })} />
        </div>
        <div>
          <label className={LABEL} htmlFor="cp-start">{t('cp.field.start')}</label>
          <input id="cp-start" type="date" className={INPUT} value={draft.startDate || ''} onChange={(e) => set({ startDate: e.target.value })} />
        </div>
        <div>
          <label className={LABEL} htmlFor="cp-end">{t('cp.field.end')}</label>
          <input id="cp-end" type="date" className={INPUT} value={draft.endDate || ''} onChange={(e) => set({ endDate: e.target.value })} />
        </div>
      </div>

      <div>
        <div className={LABEL}>{t('cp.field.ads')}</div>
        <p className={`${SUB} mb-2`}>{t('cp.field.adsHint')}</p>
        <div className="space-y-1.5">
          {draft.ads.map((a, i) => (
            <div key={i} className="flex gap-2">
              <input className={INPUT} aria-label={t('cp.field.adName')} placeholder={t('cp.field.adName')} value={a.name} onChange={(e) => set({ ads: draft.ads.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
              <button type="button" className={`${BTN_SOFT} text-rose-600`} aria-label={t('cp.delete')} onClick={() => set({ ads: draft.ads.filter((_, j) => j !== i) })}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button type="button" className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer" onClick={() => set({ ads: [...draft.ads, { name: '' }] })}>{t('cp.field.addAd')}</button>
        </div>
      </div>

      <div>
        <div className={LABEL}>{t('cp.field.spend')}</div>
        <p className={`${SUB} mb-2`}>{t('cp.field.spendHint')}</p>
        <div className="space-y-1.5">
          {draft.spend.map((s, i) => (
            <div key={i} className="grid [&>*]:min-w-0 grid-cols-2 sm:grid-cols-[1fr_90px_1fr_auto] gap-2">
              <input type="date" className={INPUT} aria-label={t('cp.field.date')} value={s.date} onChange={(e) => set({ spend: draft.spend.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)) })} />
              <input className={INPUT} inputMode="decimal" aria-label={t('cp.field.amount')} placeholder={t('cp.field.amount')} value={s.amount} onChange={(e) => set({ spend: draft.spend.map((x, j) => (j === i ? { ...x, amount: e.target.value.replace(/[^\d.]/g, '') } : x)) })} />
              <input className={INPUT} aria-label={t('cp.field.note')} placeholder={t('cp.field.note')} value={s.note || ''} onChange={(e) => set({ spend: draft.spend.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)) })} />
              <button type="button" className={`${BTN_SOFT} text-rose-600`} aria-label={t('cp.delete')} onClick={() => set({ spend: draft.spend.filter((_, j) => j !== i) })}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button type="button" className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer" onClick={() => set({ spend: [...draft.spend, { date: today(), amount: '' }] })}>{t('cp.field.addSpend')}</button>
          {draft.spend.length > 0 && <p className={SUB}>{money(draft.spend.reduce((sum, s) => sum + (Number(s.amount) || 0), 0))}</p>}
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="cp-aud">{t('cp.field.audience')}</label>
        <textarea id="cp-aud" className={`${INPUT} min-h-[60px]`} placeholder={t('cp.field.audienceHint')} value={draft.audience || ''} onChange={(e) => set({ audience: e.target.value })} />
      </div>

      <button type="button" className="text-[11px] font-bold text-slate-600 dark:text-gray-400 cursor-pointer" onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced}>{advanced ? '▾' : '▸'} {t('cp.advanced')}</button>
      {advanced && (
        <div className="grid [&>*]:min-w-0 sm:grid-cols-3 gap-3">
          <div>
            <label className={LABEL} htmlFor="cp-slug">{t('cp.field.slug')}</label>
            <input id="cp-slug" className={`${INPUT} font-mono`} value={draft.slug} placeholder={slugify(draft.name)} onChange={(e) => set({ slug: slugify(e.target.value, 80) })} />
            <p className={`${SUB} mt-1`}>{t('cp.field.slugHint')}</p>
          </div>
          <div>
            <label className={LABEL} htmlFor="cp-src">{t('cp.field.source')}</label>
            <input id="cp-src" className={`${INPUT} font-mono`} value={draft.source} onChange={(e) => set({ source: e.target.value })} />
          </div>
          <div>
            <label className={LABEL} htmlFor="cp-med">{t('cp.field.medium')}</label>
            <input id="cp-med" className={`${INPUT} font-mono`} value={draft.medium} onChange={(e) => set({ medium: e.target.value })} />
          </div>
          <div className="sm:col-span-3">
            <label className={LABEL} htmlFor="cp-notes">{t('cp.field.notes')}</label>
            <textarea id="cp-notes" className={`${INPUT} min-h-[50px]`} value={draft.notes || ''} onChange={(e) => set({ notes: e.target.value })} />
          </div>
        </div>
      )}

      {preview && <p className="text-[11px] font-mono text-slate-500 dark:text-gray-400 break-all">{preview}</p>}
      <div className="flex gap-2">
        <button type="button" className={BTN_PRIMARY} onClick={onSave} disabled={saving || !draft.name.trim() || !draft.pageSlug}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{saving ? t('cp.saving') : t('cp.save')}</button>
        <button type="button" className={BTN_SOFT} onClick={onCancel}>{t('cp.cancel')}</button>
      </div>
      <h2 className={`${H2} sr-only`}>{t('cp.new')}</h2>
    </div>
  );
}
