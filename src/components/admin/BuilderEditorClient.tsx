'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Copy,
  ExternalLink,
  GripVertical,
  Printer,
  LayoutTemplate,
  MapIcon,
  Maximize2,
  History,
  Monitor,
  Plus,
  Redo2,
  Save,
  Settings2,
  Smartphone,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import type { ContactLine, LandingPage, SystemSettings } from '@/lib/types';
import { CONTACT_LINES, companyFor } from '@/lib/company';
import type { BenefitsBlock, Bi, BlockType, BuilderBlock, BuilderDoc, FaqBlock, FinalCtaBlock, FormBlock, GalleryBlock, HeroBlock, IncludedBlock, InclusionsBlock, ContactBlock, Lang, OfferBlock, StepsBlock, TermsBlock } from '@/lib/builder';
import {
  BENEFIT_ICONS,
  BLOCK_ANIMATIONS,
  BLOCK_DEFINITIONS,
  BLOCK_TYPES,
  DEFAULT_ACCENT,
  blockHints,
  createBlock,
  duplicateBlock,
  insertAt,
  moveBlock,
  normalizeBuilderDoc,
  pick,
} from '@/lib/builder';
import { BenefitIconSvg, BlockView, BuilderRoot, useNow } from '@/components/builder/BuilderBlocks';
import BuilderFullPreview from './BuilderFullPreview';
import BuilderPageMap from './BuilderPageMap';
import BuilderVersions from './BuilderVersions';
import ImageField from './ImageField';
import VideoField from './VideoField';
import ImageManager from './ImageManager';
import { useLanguage } from '@/context/LanguageContext';
import { errorMessage } from '@/lib/errors';
import { featureImage } from '@/lib/feature-image';

/**
 * Drag-and-drop page builder (pilot): component library on the left, the live
 * page in the middle, settings on the right. The canvas uses the same renderer
 * as the public page.
 */

interface BuilderEditorClientProps {
  initialPage: LandingPage;
  initialDoc: BuilderDoc;
  /** Settings → Company: what the page's logo and contact details fall back to. */
  companySettings?: Partial<SystemSettings>;
}

/** The page's own logo and contact details (empty = use the company settings). */
const brandOf = (p: LandingPage) => {
  const s = p.isolatedSettings || {};
  return {
    logoUrl: s.logoUrl || '',
    companyName: s.companyName || '',
    phone: s.phone || '',
    telegramUsername: (s.telegramUsername || '').replace(/^@/, ''),
    whatsapp: s.whatsapp || s.whatsappNumber || '',
    email: s.email || '',
    address: s.address || '',
    contactHidden: (s.contactHidden || []) as ContactLine[],
    footerNote: (s.footerNote || { en: '' }) as Bi,
    printClosingTitle: (s.printClosingTitle || { en: '' }) as Bi,
    printClosingText: (s.printClosingText || { en: '' }) as Bi,
    coordinatorName: s.coordinatorName || '',
    coordinatorRole: s.coordinatorRole || '',
    coordinatorRoleKh: s.coordinatorRoleKh || '',
    coordinatorAvatar: s.coordinatorAvatar || '',
    coordinatorPhone: s.coordinatorPhone || '',
    coordinatorTelegram: s.coordinatorTelegram || '',
    coordinatorBio: (s.coordinatorBio || { en: '' }) as Bi,
  };
};
const biOrUndefined = (b: Bi) => {
  const en = b.en.trim();
  const kh = b.kh?.trim();
  return en || kh ? { en: en || kh || '', ...(kh ? { kh } : {}) } : undefined;
};
type PageBrand = ReturnType<typeof brandOf>;
const metaOf = (p: LandingPage) => ({ title: p.title, slug: p.slug, status: p.status, ogImage: p.ogImage || '', brand: brandOf(p) });
const brandToSettings = (b: PageBrand) => ({
  logoUrl: b.logoUrl.trim() || undefined,
  companyName: b.companyName.trim() || undefined,
  phone: b.phone.trim() || undefined,
  telegramUsername: b.telegramUsername.trim() ? `@${b.telegramUsername.trim().replace(/^@/, '')}` : undefined,
  whatsapp: b.whatsapp.replace(/[^0-9]/g, '') || undefined,
  whatsappNumber: undefined,
  email: b.email.trim() || undefined,
  address: b.address.trim() || undefined,
  contactHidden: b.contactHidden.length ? b.contactHidden : undefined,
  footerNote: biOrUndefined(b.footerNote),
  printClosingTitle: biOrUndefined(b.printClosingTitle),
  printClosingText: biOrUndefined(b.printClosingText),
  coordinatorName: b.coordinatorName.trim() || undefined,
  coordinatorRole: b.coordinatorRole.trim() || undefined,
  coordinatorRoleKh: b.coordinatorRoleKh.trim() || undefined,
  coordinatorAvatar: b.coordinatorAvatar.trim() || undefined,
  coordinatorPhone: b.coordinatorPhone.trim() || undefined,
  coordinatorTelegram: b.coordinatorTelegram.trim().replace(/^@/, '') || undefined,
  coordinatorBio: biOrUndefined(b.coordinatorBio),
});

type Device = 'phone' | 'desktop';

const INPUT = 'w-full px-3 py-2 rounded-lg bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors';
const LABEL = 'block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1';
const HINT = 'text-[10px] text-slate-500 dark:text-gray-400 mt-1';
const PANEL = 'rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs';
const SEG = (active: boolean) =>
  `flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${active ? 'bg-amber-400 text-black' : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-emerald-900/60'}`;
const ICON_BTN = 'p-1.5 rounded-md bg-white/95 dark:bg-[#0A1610]/95 text-slate-700 dark:text-gray-200 hover:text-black dark:hover:text-white shadow border border-slate-200 dark:border-emerald-800 cursor-pointer disabled:opacity-30';
const ACCENT_PRESETS = ['#E5A93C', '#1E8E5A', '#2563EB', '#DC2626', '#7C3AED', '#0F172A'];
const HISTORY_LIMIT = 60;

const toLocalInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : undefined;
};
const numOrNull = (v: string): number | null => (v.trim() === '' || !Number.isFinite(Number(v)) ? null : Number(v));

function BiInput({ label, value, onChange, multiline, hint }: { label: string; value?: Bi; onChange: (v: Bi) => void; multiline?: boolean; hint?: string }) {
  const { t } = useLanguage();
  const Tag = multiline ? 'textarea' : 'input';
  const cls = `${INPUT}${multiline ? ' min-h-[64px] resize-y' : ''}`;
  return (
    <div>
      {label && <label className={LABEL}>{label}</label>}
      <div className="space-y-1.5">
        <div className="flex items-start gap-1.5">
          <span className="mt-2 text-[9px] font-extrabold text-slate-400 w-5 shrink-0">EN</span>
          <Tag className={cls} value={value?.en || ''} placeholder={t('builder.field.english')} onChange={(e) => onChange({ en: e.target.value, kh: value?.kh })} />
        </div>
        <div className="flex items-start gap-1.5">
          <span className="mt-2 text-[9px] font-extrabold text-slate-400 w-5 shrink-0">KH</span>
          <Tag className={cls} lang="km" value={value?.kh || ''} placeholder={t('builder.field.khmer')} onChange={(e) => onChange({ en: value?.en || '', kh: e.target.value || undefined })} />
        </div>
      </div>
      {hint && <p className={HINT}>{hint}</p>}
    </div>
  );
}

/** Move up / move down / remove for one row of a list inside a component. */
function RowTools({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="flex gap-1">
      <button type="button" className={ICON_BTN} disabled={index === 0} aria-label={t('builder.moveUp')} onClick={() => onMove(index - 1)}><ArrowUp className="w-3 h-3" /></button>
      <button type="button" className={ICON_BTN} disabled={index === count - 1} aria-label={t('builder.moveDown')} onClick={() => onMove(index + 1)}><ArrowDown className="w-3 h-3" /></button>
      <button type="button" className={ICON_BTN} aria-label={t('common.remove')} onClick={onRemove}><Trash2 className="w-3 h-3 text-rose-600" /></button>
    </div>
  );
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer" onClick={onClick}>
      <Plus className="w-3.5 h-3.5" />{label}
    </button>
  );
}

const ROW = 'p-2.5 rounded-xl border border-slate-200 dark:border-emerald-900/60 space-y-2';
const ROW_HEAD = 'flex items-center justify-between';
const ROW_LABEL = 'text-[11px] font-extrabold text-slate-500';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 pt-4 first:pt-0 border-t first:border-t-0 border-slate-100 dark:border-emerald-950/60">
      <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-emerald-500/80">{title}</h4>
      {children}
    </div>
  );
}

export default function BuilderEditorClient({ initialPage, initialDoc, companySettings }: BuilderEditorClientProps) {
  const { t, lang: uiLang } = useLanguage();
  const [page, setPage] = useState<LandingPage>(initialPage);
  const [meta, setMeta] = useState(() => metaOf(initialPage));
  const [doc, setDocState] = useState<BuilderDoc>(initialDoc);
  const [past, setPast] = useState<BuilderDoc[]>([]);
  const [future, setFuture] = useState<BuilderDoc[]>([]);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify({ doc: initialDoc, meta: metaOf(initialPage) }));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [previewLang, setPreviewLang] = useState<Lang>('en');
  const [view, setView] = useState<'page' | 'map'>('page');
  const [fullPreview, setFullPreview] = useState(false);
  const closeFullPreview = useCallback(() => setFullPreview(false), []);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [conflict, setConflict] = useState(false);
  // Autosave: a live page gets a backup copy on the server (the live page itself only changes
  // on Save); a draft is saved directly. A copy also goes to this browser, offered back on reopen.
  const [autosave, setAutosave] = useState<{ state: 'idle' | 'saving' | 'saved' | 'error'; at?: string }>({ state: 'idle' });
  const [restoreOffer, setRestoreOffer] = useState<{ savedAt: string; doc: BuilderDoc; meta: ReturnType<typeof metaOf> } | null>(null);
  const draftKey = `khb_builder_draft:${initialPage.id}`;
  const [versionsOpen, setVersionsOpen] = useState(false);
  const nowMs = useNow();
  const lastTyping = useRef(0);

  const dirty = JSON.stringify({ doc, meta }) !== savedJson;
  const selectedIndex = doc.blocks.findIndex((b) => b.id === selectedId);
  const selected = selectedIndex >= 0 ? doc.blocks[selectedIndex] : null;

  // History lives in refs so every change is recorded exactly once (state updaters may run twice).
  const docRef = useRef(doc);
  const pastRef = useRef<BuilderDoc[]>([]);
  const futureRef = useRef<BuilderDoc[]>([]);
  const syncHistory = () => {
    setPast(pastRef.current);
    setFuture(futureRef.current);
  };

  /** Every change goes through here so it can be undone. Typing bursts become one undo step. */
  const setDoc = useCallback((next: BuilderDoc | ((d: BuilderDoc) => BuilderDoc), opts: { typing?: boolean } = {}) => {
    const prev = docRef.current;
    const value = typeof next === 'function' ? next(prev) : next;
    if (value === prev) return;
    const now = Date.now();
    const merge = Boolean(opts.typing) && now - lastTyping.current < 800;
    lastTyping.current = opts.typing ? now : 0;
    if (!merge) pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), prev];
    futureRef.current = [];
    docRef.current = value;
    setDocState(value);
    syncHistory();
  }, []);

  const undo = useCallback(() => {
    const prev = pastRef.current[pastRef.current.length - 1];
    if (!prev) return;
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [docRef.current, ...futureRef.current].slice(0, HISTORY_LIMIT);
    lastTyping.current = 0;
    docRef.current = prev;
    setDocState(prev);
    syncHistory();
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current[0];
    if (!next) return;
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, docRef.current].slice(-HISTORY_LIMIT);
    docRef.current = next;
    setDocState(next);
    syncHistory();
  }, []);

  // Keyboard: Ctrl/Cmd+S saves (also while typing); undo/redo, Esc and Alt+arrows work outside text fields.
  const keyActions = useRef({ save: () => {}, deselect: () => {}, moveSelected: (_dir: -1 | 1) => {} });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === 's') {
        e.preventDefault();
        keyActions.current.save();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        keyActions.current.deselect();
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        keyActions.current.moveSelected(e.key === 'ArrowUp' ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // Sticky top bar: its height and the admin header's height feed the side panels' offsets.
  // Below the desktop layout it slides away while scrolling down and returns on scrolling up.
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [barHidden, setBarHidden] = useState(false);
  const [barStuck, setBarStuck] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    const bar = barRef.current;
    if (!root || !bar) return;
    const tops = Array.from(document.querySelectorAll<HTMLElement>('[data-admin-topbar]'));
    const measure = () => {
      root.style.setProperty('--kb-top', `${tops.reduce((h, el) => Math.max(h, el.offsetHeight), 0)}px`);
      root.style.setProperty('--kb-bar', `${bar.offsetHeight}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    [bar, ...tops].forEach((el) => ro.observe(el));
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setBarStuck(y > 8);
      if (window.innerWidth >= 1024 || y < 160) {
        setBarHidden(false);
        last = y;
        return;
      }
      if (y > last + 6) setBarHidden(true);
      else if (y < last - 6) setBarHidden(false);
      if (Math.abs(y - last) > 6) last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  const updateBlock = (id: string, patch: Partial<BuilderBlock>, typing = true) =>
    setDoc((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as BuilderBlock) : b)) }), { typing });

  /** "+" adds at the end, but above a closing call to action so the page still ends with it. */
  const defaultInsertIndex = (type: BlockType) => {
    if (type === 'contact') return doc.blocks.length;
    // Above a closing call to action, and above a contact footer after it.
    let at = doc.blocks.length;
    while (at > 0 && doc.blocks[at - 1].type === 'contact') at--;
    const beforeFooter = doc.blocks[at - 1];
    return beforeFooter && beforeFooter.type === 'finalCta' && type !== 'finalCta' ? at - 1 : at;
  };
  const addBlock = (type: BlockType, index = defaultInsertIndex(type)) => {
    const block = createBlock(type);
    setDoc((d) => ({ ...d, blocks: insertAt(d.blocks, index, block) }));
    setSelectedId(block.id);
  };
  const move = (from: number, to: number) => setDoc((d) => ({ ...d, blocks: moveBlock(d.blocks, from, to) }));
  const remove = (id: string) => {
    setDoc((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };
  const duplicate = (index: number) => {
    const copy = duplicateBlock(doc.blocks[index]);
    setDoc((d) => ({ ...d, blocks: insertAt(d.blocks, index + 1, copy) }));
    setSelectedId(copy.id);
  };

  // ── Drag and drop: library → canvas (new) and canvas → canvas (move) ──
  const onDragStartNew = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('text/plain', `new:${type}`);
    e.dataTransfer.effectAllowed = 'copy';
  };
  const onDragStartMove = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', `move:${index}`);
    e.dataTransfer.effectAllowed = 'move';
  };
  const dropIndexFor = (e: React.DragEvent, index: number) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2 ? index : index + 1;
  };
  const onDrop = (e: React.DragEvent, target: number) => {
    e.preventDefault();
    setDragOver(null);
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('new:')) {
      const type = data.slice(4) as BlockType;
      if (BLOCK_DEFINITIONS[type]) addBlock(type, target);
    } else if (data.startsWith('move:')) {
      const from = Number(data.slice(5));
      if (!Number.isInteger(from)) return;
      const to = target > from ? target - 1 : target;
      if (to !== from) move(from, to);
    }
  };

  /** The page as this editor would save it now. */
  const payload = (status: LandingPage['status']): LandingPage =>
    ({ ...page, title: meta.title.trim() || t('builder.untitled'), slug: meta.slug, status, ogImage: meta.ogImage.trim(), template: 'builder', builder: doc, isolatedSettings: { ...page.isolatedSettings, ...brandToSettings(meta.brand) } }) as LandingPage;

  const save = async (statusOverride?: LandingPage['status'], opts: { auto?: boolean } = {}) => {
    if (!opts.auto) {
      setSaving(true);
      setNotice(null);
    }
    const status = statusOverride || meta.status;
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // expectedUpdatedAt: the version this editor opened; a page saved elsewhere since is not overwritten.
        body: JSON.stringify({ ...payload(status), expectedUpdatedAt: page.updatedAt, autosave: opts.auto === true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.conflict) {
        setConflict(true);
        throw new Error(t('builder.conflict'));
      }
      if (!res.ok || !data.page) throw new Error(data.error || t('common.errorSaving'));
      const saved: LandingPage = data.page;
      const savedDoc = normalizeBuilderDoc(saved.builder);
      const savedMeta = metaOf(saved);
      setPage(saved);
      setMeta(savedMeta);
      docRef.current = savedDoc;
      setDocState(savedDoc);
      setSavedJson(JSON.stringify({ doc: savedDoc, meta: savedMeta }));
      try { localStorage.removeItem(draftKey); } catch {}
      if (opts.auto) {
        setAutosave({ state: 'saved', at: saved.updatedAt });
      } else {
        setNotice({ kind: 'ok', text: status === 'published' ? t('builder.savedLive') : t('builder.savedDraft') });
        window.setTimeout(() => setNotice(null), 4000);
      }
    } catch (err) {
      if (opts.auto) setAutosave({ state: 'error' });
      else setNotice({ kind: 'error', text: errorMessage(err, t('common.errorSaving')) });
    } finally {
      if (!opts.auto) setSaving(false);
    }
  };

  /** A backup of the current editor state on the server; the live page is untouched. */
  const backup = async () => {
    setAutosave((a) => ({ ...a, state: 'saving' }));
    try {
      const res = await fetch(`/api/pages/${page.id}/autosave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: payload(meta.status) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'backup failed');
      setAutosave({ state: 'saved', at: data.savedAt });
    } catch {
      setAutosave({ state: 'error' });
    }
  };

  // Autosave 4 s after the last change: drafts are saved, live pages get a backup copy.
  const autoRef = useRef({ run: () => {} });
  useEffect(() => {
    autoRef.current.run = () => {
      if (!dirty || saving || conflict) return;
      if (meta.status === 'published') void backup();
      else void save(undefined, { auto: true });
    };
  });
  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => autoRef.current.run(), 4000);
    return () => window.clearTimeout(timer);
  }, [dirty, doc, meta]);

  // Browser copy of unsaved work (in case the connection drops), 1 s after the last change.
  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify({ savedAt: new Date().toISOString(), base: page.updatedAt, doc, meta })); } catch {}
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [dirty, doc, meta, draftKey, page.updatedAt]);

  // On opening: offer unsaved work this browser kept, if it differs from the saved page.
  useEffect(() => {
    // After the first paint, so the server HTML and the first browser render match.
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(draftKey);
        if (!raw) return;
        const d = JSON.parse(raw) as { savedAt: string; doc: unknown; meta: ReturnType<typeof metaOf> };
        const doc = normalizeBuilderDoc(d.doc);
        if (JSON.stringify({ doc, meta: d.meta }) === savedJson) {
          localStorage.removeItem(draftKey);
          return;
        }
        setRestoreOffer({ savedAt: d.savedAt, doc, meta: d.meta });
      } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
    // Only when the editor opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restoreDraft = () => {
    if (!restoreOffer) return;
    setDoc(() => restoreOffer.doc);
    setMeta(restoreOffer.meta);
    setRestoreOffer(null);
  };
  const discardDraft = () => {
    try { localStorage.removeItem(draftKey); } catch {}
    setRestoreOffer(null);
  };

  useEffect(() => {
    keyActions.current = {
      save: () => { if (!saving) void save(); },
      deselect: () => { if (!fullPreview) setSelectedId(null); },
      moveSelected: (dir) => {
        const to = selectedIndex + dir;
        if (selectedIndex >= 0 && to >= 0 && to < doc.blocks.length) move(selectedIndex, to);
      },
    };
  });

  const termsBlock = doc.blocks.find((b): b is TermsBlock => b.type === 'terms');
  const termsRef = termsBlock ? `terms-${termsBlock.id}|${termsBlock.updated || ''}` : '';
  const brandKey = JSON.stringify(meta.brand);
  const company = useMemo(() => companyFor(companySettings, { isolatedSettings: brandToSettings(JSON.parse(brandKey) as PageBrand) }), [companySettings, brandKey]);
  const ctx = useMemo(
    () => {
      const [id, updated] = termsRef ? termsRef.split('|') : [];
      return { offer: doc.offer, brand: doc.brand, lang: previewLang, slug: meta.slug, nowMs, editing: true, terms: id ? { id, updated: updated || undefined } : undefined, company };
    },
    [doc.offer, doc.brand, previewLang, meta.slug, nowMs, termsRef, company],
  );

  const hintsFor = (block: BuilderBlock) => blockHints(block).map((h) => t(`builder.hint.${h}`));

  // ── Inspector pieces ──
  const styleControls = (block: BuilderBlock) => {
    const def = BLOCK_DEFINITIONS[block.type];
    const setStyle = (patch: Partial<BuilderBlock['style']>) => updateBlock(block.id, { style: { ...block.style, ...patch } }, false);
    return (
      <Section title={t('builder.design')}>
        <div>
          <label className={LABEL}>{t('builder.variant')}</label>
          <div className="grid grid-cols-1 gap-1.5">
            {def.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => updateBlock(block.id, { variant: v.id } as Partial<BuilderBlock>, false)}
                className={`text-left p-2.5 rounded-xl border cursor-pointer transition-colors ${block.variant === v.id ? 'border-amber-400 bg-amber-50 dark:bg-amber-400/10' : 'border-slate-200 dark:border-emerald-900/60 hover:border-amber-300'}`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">{pick(v.name, uiLang)}</div>
                <div className="text-[10px] text-slate-500 dark:text-gray-400">{pick(v.detail, uiLang)}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={LABEL}>{t('builder.theme')}</label>
          <div className="flex gap-1">
            {(['dark', 'light', 'brand'] as const).map((th) => (
              <button key={th} type="button" className={SEG(block.style.theme === th)} onClick={() => setStyle({ theme: th })}>{t(`builder.theme.${th}`)}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={LABEL}>{t('builder.animation')}</label>
          <div className="grid grid-cols-5 gap-1">
            {BLOCK_ANIMATIONS.map((a) => (
              <button key={a} type="button" className={SEG((block.style.animation || 'rise') === a)} onClick={() => setStyle({ animation: a })}>{t(`builder.animation.${a}`)}</button>
            ))}
          </div>
          <p className={HINT}>{t('builder.animationHint')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL}>{t('builder.align')}</label>
            <div className="flex gap-1">
              {(['left', 'center'] as const).map((a) => (
                <button key={a} type="button" className={SEG(block.style.align === a)} onClick={() => setStyle({ align: a })}>{t(`builder.align.${a}`)}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>{t('builder.spacing')}</label>
            <select className={INPUT} value={block.style.spacing} onChange={(e) => setStyle({ spacing: e.target.value as BuilderBlock['style']['spacing'] })}>
              {(['compact', 'normal', 'roomy'] as const).map((s) => <option key={s} value={s}>{t(`builder.spacing.${s}`)}</option>)}
            </select>
          </div>
        </div>
        <ImageField label={t('builder.bgImage')} value={block.style.bgImage || ''} onChange={(v) => setStyle({ bgImage: v || undefined })} maxEdge={1920} hint={t('builder.bgImageHint')} compact />
        <VideoField label={t('builder.bgVideo')} value={block.style.bgVideo || ''} onChange={(v) => setStyle({ bgVideo: v || undefined })} hint={t('builder.bgVideoHint')} />
      </Section>
    );
  };

  const heroContent = (b: HeroBlock) => (
    <Section title={t('builder.content')}>
      <BiInput label={t('builder.hero.badge')} value={b.badge} onChange={(v) => updateBlock(b.id, { badge: v })} />
      <BiInput label={t('builder.hero.headline')} value={b.headline} onChange={(v) => updateBlock(b.id, { headline: v })} multiline hint={t('builder.hero.headlineHint')} />
      <BiInput label={t('builder.hero.sub')} value={b.sub} onChange={(v) => updateBlock(b.id, { sub: v })} multiline />
      <ImageField label={t('builder.hero.image')} value={b.image || ''} onChange={(v) => updateBlock(b.id, { image: v || undefined }, false)} maxEdge={1920} hint={t('builder.hero.imageHint')} compact />
      <BiInput label={t('builder.buttonText')} value={b.ctaLabel} onChange={(v) => updateBlock(b.id, { ctaLabel: v })} hint={t('builder.buttonHint')} />
      <BiInput label={t('builder.hero.risk')} value={b.riskNote} onChange={(v) => updateBlock(b.id, { riskNote: v })} hint={t('builder.hero.riskHint')} />
    </Section>
  );

  const offerContent = (b: OfferBlock) => (
    <Section title={t('builder.content')}>
      <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-[11px] text-sky-900 dark:text-sky-200">
        {t('builder.offer.fromPage')}{' '}
        <button type="button" onClick={() => setSelectedId(null)} className="font-bold underline cursor-pointer">{t('builder.offer.openSettings')}</button>
      </div>
      <ImageField label={t('builder.offer.photo')} value={b.image || ''} onChange={(v) => updateBlock(b.id, { image: v || undefined }, false)} maxEdge={1600} hint={t('builder.offer.photoHint')} compact />
      <BiInput label={t('builder.offer.title')} value={b.title} onChange={(v) => updateBlock(b.id, { title: v })} />
      <div>
        <label className={LABEL}>{t('builder.offer.features')}</label>
        <div className="space-y-2">
          {b.features.map((f, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <div className="flex-1">
                <BiInput label={`${i + 1}.`} value={f} onChange={(v) => updateBlock(b.id, { features: b.features.map((x, j) => (j === i ? v : x)) })} />
              </div>
              <button type="button" className="mt-5 p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md cursor-pointer" aria-label={t('common.remove')} onClick={() => updateBlock(b.id, { features: b.features.filter((_, j) => j !== i) }, false)}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button type="button" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer" onClick={() => updateBlock(b.id, { features: [...b.features, { en: '' }] }, false)}>
            <Plus className="w-3.5 h-3.5" />{t('builder.offer.addFeature')}
          </button>
        </div>
      </div>
      <BiInput label={t('builder.buttonText')} value={b.ctaLabel} onChange={(v) => updateBlock(b.id, { ctaLabel: v })} hint={t('builder.buttonHint')} />
      <BiInput label={t('builder.offer.note')} value={b.note} onChange={(v) => updateBlock(b.id, { note: v })} />
    </Section>
  );

  const faqContent = (b: FaqBlock) => (
    <Section title={t('builder.content')}>
      <BiInput label={t('builder.faq.title')} value={b.title} onChange={(v) => updateBlock(b.id, { title: v })} />
      <ImageField label={t('builder.faq.photo')} value={b.image || ''} onChange={(v) => updateBlock(b.id, { image: v || undefined }, false)} maxEdge={1600} hint={t('builder.faq.photoHint')} compact />
      <div className="space-y-3">
        {b.items.map((it, i) => (
          <div key={i} className="p-2.5 rounded-xl border border-slate-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500">{t('builder.faq.question', { n: i + 1 })}</span>
              <div className="flex gap-1">
                <button type="button" className={ICON_BTN} disabled={i === 0} aria-label={t('builder.moveUp')} onClick={() => updateBlock(b.id, { items: moveBlock(b.items, i, i - 1) }, false)}><ArrowUp className="w-3 h-3" /></button>
                <button type="button" className={ICON_BTN} disabled={i === b.items.length - 1} aria-label={t('builder.moveDown')} onClick={() => updateBlock(b.id, { items: moveBlock(b.items, i, i + 1) }, false)}><ArrowDown className="w-3 h-3" /></button>
                <button type="button" className={ICON_BTN} aria-label={t('common.remove')} onClick={() => updateBlock(b.id, { items: b.items.filter((_, j) => j !== i) }, false)}><Trash2 className="w-3 h-3 text-rose-600" /></button>
              </div>
            </div>
            <BiInput label={t('builder.faq.q')} value={it.q} onChange={(v) => updateBlock(b.id, { items: b.items.map((x, j) => (j === i ? { ...x, q: v } : x)) })} />
            <BiInput label={t('builder.faq.a')} value={it.a} multiline onChange={(v) => updateBlock(b.id, { items: b.items.map((x, j) => (j === i ? { ...x, a: v } : x)) })} />
          </div>
        ))}
        <button type="button" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer" onClick={() => updateBlock(b.id, { items: [...b.items, { q: { en: '' }, a: { en: '' } }] }, false)}>
          <Plus className="w-3.5 h-3.5" />{t('builder.faq.add')}
        </button>
      </div>
    </Section>
  );

  const termsContent = (b: TermsBlock) => {
    const setItems = (items: TermsBlock['items'], typing = true) => updateBlock(b.id, { items }, typing);
    return (
      <Section title={t('builder.content')}>
        <BiInput label={t('builder.sectionTitle')} value={b.title} onChange={(v) => updateBlock(b.id, { title: v })} />
        <BiInput label={t('builder.sectionSub')} value={b.sub} onChange={(v) => updateBlock(b.id, { sub: v })} multiline />
        <div>
          <label className={LABEL}>{t('builder.terms.updated')}</label>
          <input type="date" className={INPUT} value={b.updated || ''} onChange={(e) => updateBlock(b.id, { updated: e.target.value || undefined }, false)} />
          <p className={HINT}>{t('builder.terms.updatedHint')}</p>
        </div>
        <div className="space-y-3">
          {b.items.map((it, i) => (
            <div key={i} className={ROW}>
              <div className={ROW_HEAD}>
                <span className={ROW_LABEL}>{t('builder.terms.clause', { n: i + 1 })}</span>
                <RowTools index={i} count={b.items.length} onMove={(to) => setItems(moveBlock(b.items, i, to), false)} onRemove={() => setItems(b.items.filter((_, j) => j !== i), false)} />
              </div>
              <BiInput label={t('builder.terms.heading')} value={it.title} onChange={(v) => setItems(b.items.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
              <BiInput label={t('builder.terms.text')} value={it.text} multiline onChange={(v) => setItems(b.items.map((x, j) => (j === i ? { ...x, text: v } : x)))} />
            </div>
          ))}
          {b.items.length < 30 && <AddRow label={t('builder.terms.add')} onClick={() => setItems([...b.items, { title: { en: '' }, text: { en: '' } }], false)} />}
        </div>
        <BiInput label={t('builder.terms.note')} value={b.note} onChange={(v) => updateBlock(b.id, { note: v })} multiline hint={t('builder.terms.noteHint')} />
        <p className={HINT}>{t('builder.terms.legalHint')}</p>
      </Section>
    );
  };

  const titleFields = (b: BenefitsBlock | IncludedBlock) => (
    <>
      <BiInput label={t('builder.sectionTitle')} value={b.title} onChange={(v) => updateBlock(b.id, { title: v })} />
      <BiInput label={t('builder.sectionSub')} value={b.sub} onChange={(v) => updateBlock(b.id, { sub: v })} multiline />
    </>
  );

  const benefitsContent = (b: BenefitsBlock) => {
    const setItems = (items: BenefitsBlock['items'], typing = true) => updateBlock(b.id, { items }, typing);
    return (
      <Section title={t('builder.content')}>
        {titleFields(b)}
        <div className="space-y-3">
          {b.items.map((it, i) => (
            <div key={i} className={ROW}>
              <div className={ROW_HEAD}>
                <span className={ROW_LABEL}>{t('builder.list.item', { n: i + 1 })}</span>
                <RowTools index={i} count={b.items.length} onMove={(to) => setItems(moveBlock(b.items, i, to), false)} onRemove={() => setItems(b.items.filter((_, j) => j !== i), false)} />
              </div>
              <div>
                <label className={LABEL}>{t('builder.benefits.icon')}</label>
                <div className="grid grid-cols-6 gap-1">
                  {BENEFIT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      title={t(`builder.icon.${icon}`)}
                      aria-label={t(`builder.icon.${icon}`)}
                      aria-pressed={it.icon === icon}
                      onClick={() => setItems(b.items.map((x, j) => (j === i ? { ...x, icon } : x)), false)}
                      className={`flex items-center justify-center p-1.5 rounded-lg border cursor-pointer [&_svg]:w-4 [&_svg]:h-4 ${it.icon === icon ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' : 'border-slate-200 dark:border-emerald-900/60 text-slate-600 dark:text-gray-300 hover:border-amber-300'}`}
                    >
                      <BenefitIconSvg icon={icon} />
                    </button>
                  ))}
                </div>
              </div>
              <BiInput label={t('builder.benefits.title')} value={it.title} onChange={(v) => setItems(b.items.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
              <BiInput label={t('builder.benefits.text')} value={it.text} multiline onChange={(v) => setItems(b.items.map((x, j) => (j === i ? { ...x, text: v } : x)))} />
              <div>
                <label className={LABEL}>{t('builder.benefits.link')}</label>
                <input className={INPUT} placeholder="https://…" value={it.link || ''} onChange={(e) => setItems(b.items.map((x, j) => (j === i ? { ...x, link: e.target.value || undefined } : x)))} />
              </div>
              <ImageField label={t('builder.item.photo')} value={it.image || ''} onChange={(v) => setItems(b.items.map((x, j) => (j === i ? { ...x, image: v || undefined } : x)), false)} maxEdge={1200} hint={t('builder.benefits.photoHint')} compact />
            </div>
          ))}
          <AddRow label={t('builder.benefits.add')} onClick={() => setItems([...b.items, { icon: 'check', title: { en: '' } }], false)} />
        </div>
      </Section>
    );
  };

  const includedContent = (b: IncludedBlock) => {
    const setItems = (items: Bi[], typing = true) => updateBlock(b.id, { items }, typing);
    return (
      <Section title={t('builder.content')}>
        {titleFields(b)}
        <div className="space-y-2">
          {b.items.map((it, i) => (
            <div key={i} className={ROW}>
              <div className={ROW_HEAD}>
                <span className={ROW_LABEL}>{t('builder.list.item', { n: i + 1 })}</span>
                <RowTools index={i} count={b.items.length} onMove={(to) => setItems(moveBlock(b.items, i, to), false)} onRemove={() => setItems(b.items.filter((_, j) => j !== i), false)} />
              </div>
              <BiInput label="" value={it} onChange={(v) => setItems(b.items.map((x, j) => (j === i ? v : x)))} />
            </div>
          ))}
          <AddRow label={t('builder.list.add')} onClick={() => setItems([...b.items, { en: '' }], false)} />
        </div>
        {b.variant === 'split' && (
          <ImageField label={t('builder.included.image')} value={b.image || ''} onChange={(v) => updateBlock(b.id, { image: v || undefined }, false)} maxEdge={1600} compact />
        )}
        <BiInput label={t('builder.included.note')} value={b.note} onChange={(v) => updateBlock(b.id, { note: v })} />
      </Section>
    );
  };

  const inclusionsContent = (b: InclusionsBlock) => {
    const list = (key: 'included' | 'excluded', titleKey: 'includedTitle' | 'excludedTitle') => {
      const items = b[key];
      const setItems = (next: Bi[], typing = true) => updateBlock(b.id, { [key]: next }, typing);
      return (
        <div className="space-y-2">
          <div className={`text-xs font-black ${key === 'included' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
            {key === 'included' ? '✓ ' : '✕ '}{t(key === 'included' ? 'builder.inclusions.included' : 'builder.inclusions.excluded')}
          </div>
          <BiInput label={t('builder.inclusions.groupTitle')} value={b[titleKey]} onChange={(v) => updateBlock(b.id, { [titleKey]: v })} />
          {items.map((it, i) => (
            <div key={i} className={ROW}>
              <div className={ROW_HEAD}>
                <span className={ROW_LABEL}>{t('builder.list.item', { n: i + 1 })}</span>
                <RowTools index={i} count={items.length} onMove={(to) => setItems(moveBlock(items, i, to), false)} onRemove={() => setItems(items.filter((_, j) => j !== i), false)} />
              </div>
              <BiInput label="" value={it} onChange={(v) => setItems(items.map((x, j) => (j === i ? v : x)))} />
            </div>
          ))}
          {items.length < 30 && <AddRow label={t(key === 'included' ? 'builder.inclusions.addIncluded' : 'builder.inclusions.addExcluded')} onClick={() => setItems([...items, { en: '' }], false)} />}
        </div>
      );
    };
    return (
      <Section title={t('builder.content')}>
        <BiInput label={t('builder.sectionTitle')} value={b.title} onChange={(v) => updateBlock(b.id, { title: v })} />
        <BiInput label={t('builder.sectionSub')} value={b.sub} onChange={(v) => updateBlock(b.id, { sub: v })} multiline />
        <p className={HINT}>{t('builder.inclusions.hint')}</p>
        {list('included', 'includedTitle')}
        {list('excluded', 'excludedTitle')}
        <BiInput label={t('builder.inclusions.note')} value={b.note} onChange={(v) => updateBlock(b.id, { note: v })} />
      </Section>
    );
  };

  const contactContent = (b: ContactBlock) => (
    <Section title={t('builder.content')}>
      <BiInput label={t('builder.contact.title')} value={b.title} onChange={(v) => updateBlock(b.id, { title: v })} />
      <BiInput label={t('builder.sectionSub')} value={b.sub} onChange={(v) => updateBlock(b.id, { sub: v })} multiline />
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-emerald-900/60 space-y-2">
        <p className="text-[11px] text-slate-700 dark:text-gray-300">{t('builder.contact.source')}</p>
        <button type="button" onClick={() => setSelectedId(null)} className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-extrabold cursor-pointer">{t('builder.contact.edit')}</button>
      </div>
    </Section>
  );

  const stepsContent = (b: StepsBlock) => {
    const setItems = (items: StepsBlock['items'], typing = true) => updateBlock(b.id, { items }, typing);
    return (
      <Section title={t('builder.content')}>
        <BiInput label={t('builder.sectionTitle')} value={b.title} onChange={(v) => updateBlock(b.id, { title: v })} />
        <div className="space-y-3">
          {b.items.map((it, i) => (
            <div key={i} className={ROW}>
              <div className={ROW_HEAD}>
                <span className={ROW_LABEL}>{t('builder.steps.step', { n: i + 1 })}</span>
                <RowTools index={i} count={b.items.length} onMove={(to) => setItems(moveBlock(b.items, i, to), false)} onRemove={() => setItems(b.items.filter((_, j) => j !== i), false)} />
              </div>
              <BiInput label={t('builder.steps.title')} value={it.title} onChange={(v) => setItems(b.items.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
              <BiInput label={t('builder.steps.text')} value={it.text} multiline onChange={(v) => setItems(b.items.map((x, j) => (j === i ? { ...x, text: v } : x)))} />
              <ImageField label={t('builder.item.photo')} value={it.image || ''} onChange={(v) => setItems(b.items.map((x, j) => (j === i ? { ...x, image: v || undefined } : x)), false)} maxEdge={1200} compact />
            </div>
          ))}
          {b.items.length < 8 && <AddRow label={t('builder.steps.add')} onClick={() => setItems([...b.items, { title: { en: '' } }], false)} />}
        </div>
        <BiInput label={t('builder.steps.button')} value={b.ctaLabel} onChange={(v) => updateBlock(b.id, { ctaLabel: v })} hint={t('builder.steps.buttonHint')} />
      </Section>
    );
  };

  const formContent = (b: FormBlock) => (
    <Section title={t('builder.content')}>
      <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-[11px] text-sky-900 dark:text-sky-200">{t('builder.form.where')}</div>
      <BiInput label={t('builder.sectionTitle')} value={b.title} onChange={(v) => updateBlock(b.id, { title: v })} />
      <BiInput label={t('builder.sectionSub')} value={b.sub} onChange={(v) => updateBlock(b.id, { sub: v })} multiline />
      <ImageField label={t('builder.form.photo')} value={b.image || ''} onChange={(v) => updateBlock(b.id, { image: v || undefined }, false)} maxEdge={1600} hint={t('builder.form.photoHint')} compact />
      <div>
        <label className={LABEL}>{t('builder.form.fields')}</label>
        <p className={HINT}>{t('builder.form.alwaysAsked')}</p>
        <label className="flex items-center gap-2 mt-2 text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
          <input type="checkbox" checked={b.askEmail} onChange={(e) => updateBlock(b.id, { askEmail: e.target.checked }, false)} className="accent-amber-500" />
          {t('builder.form.askEmail')}
        </label>
        <label className="flex items-center gap-2 mt-1.5 text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
          <input type="checkbox" checked={b.askMessage} onChange={(e) => updateBlock(b.id, { askMessage: e.target.checked }, false)} className="accent-amber-500" />
          {t('builder.form.askMessage')}
        </label>
      </div>
      <div className="space-y-2">
        <BiInput label={t('builder.form.interestLabel')} value={b.interestLabel} onChange={(v) => updateBlock(b.id, { interestLabel: v })} hint={t('builder.form.interestHint')} />
        {(b.interestOptions || []).map((opt, i) => {
          const list = b.interestOptions || [];
          return (
            <div key={i} className={ROW}>
              <div className={ROW_HEAD}>
                <span className={ROW_LABEL}>{t('builder.form.option', { n: i + 1 })}</span>
                <RowTools index={i} count={list.length} onMove={(to) => updateBlock(b.id, { interestOptions: moveBlock(list, i, to) }, false)} onRemove={() => updateBlock(b.id, { interestOptions: list.filter((_, j) => j !== i) }, false)} />
              </div>
              <BiInput label="" value={opt} onChange={(v) => updateBlock(b.id, { interestOptions: list.map((x, j) => (j === i ? v : x)) })} />
            </div>
          );
        })}
        {(b.interestOptions || []).length < 10 && <AddRow label={t('builder.form.addOption')} onClick={() => updateBlock(b.id, { interestOptions: [...(b.interestOptions || []), { en: '' }] }, false)} />}
      </div>
      <BiInput label={t('builder.form.submit')} value={b.submitLabel} onChange={(v) => updateBlock(b.id, { submitLabel: v })} />
      <BiInput label={t('builder.form.successTitle')} value={b.successTitle} onChange={(v) => updateBlock(b.id, { successTitle: v })} />
      <BiInput label={t('builder.form.successText')} value={b.successText} onChange={(v) => updateBlock(b.id, { successText: v })} multiline />
      <BiInput label={t('builder.form.privacy')} value={b.privacyNote} onChange={(v) => updateBlock(b.id, { privacyNote: v })} />
      <div>
        <label className="flex items-center gap-2 text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
          <input type="checkbox" checked={Boolean(b.requireTerms)} onChange={(e) => updateBlock(b.id, { requireTerms: e.target.checked }, false)} className="accent-amber-500" />
          {t('builder.form.requireTerms')}
        </label>
        <p className={HINT}>{t('builder.form.requireTermsHint')}</p>
        {b.requireTerms && <BiInput label={t('builder.form.termsLabel')} value={b.termsLabel} onChange={(v) => updateBlock(b.id, { termsLabel: v })} hint={t('builder.form.termsLabelHint')} />}
      </div>
    </Section>
  );

  const finalContent = (b: FinalCtaBlock) => (
    <Section title={t('builder.content')}>
      <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-[11px] text-sky-900 dark:text-sky-200">
        {t('builder.offer.fromPage')}{' '}
        <button type="button" onClick={() => setSelectedId(null)} className="font-bold underline cursor-pointer">{t('builder.offer.openSettings')}</button>
      </div>
      <BiInput label={t('builder.final.headline')} value={b.headline} onChange={(v) => updateBlock(b.id, { headline: v })} multiline />
      <BiInput label={t('builder.final.sub')} value={b.sub} onChange={(v) => updateBlock(b.id, { sub: v })} multiline />
      <BiInput label={t('builder.buttonText')} value={b.ctaLabel} onChange={(v) => updateBlock(b.id, { ctaLabel: v })} hint={t('builder.buttonHint')} />
      <BiInput label={t('builder.final.risk')} value={b.riskNote} onChange={(v) => updateBlock(b.id, { riskNote: v })} />
    </Section>
  );

  const galleryContent = (b: GalleryBlock) => {
    const images = b.items.map((it) => it.image);
    const setImages = (next: string[]) =>
      updateBlock(b.id, { items: next.map((image) => b.items.find((it) => it.image === image) || { image }) }, false);
    return (
      <Section title={t('builder.content')}>
        <BiInput label={t('builder.sectionTitle')} value={b.title} onChange={(v) => updateBlock(b.id, { title: v })} />
        <BiInput label={t('builder.sectionSub')} value={b.sub} onChange={(v) => updateBlock(b.id, { sub: v })} multiline />
        <ImageManager images={images} onChange={setImages} title={t('builder.gallery.photos')} hint={t('builder.gallery.photosHint')} />
        {b.items.length > 0 && (
          <div className="space-y-2">
            <label className={LABEL}>{t('builder.gallery.captions')}</label>
            {b.items.map((it, i) => (
              <div key={it.image} className="flex gap-2 items-start">
                <img src={it.image} alt="" className="w-12 h-10 rounded-md object-cover shrink-0 mt-5" />
                <div className="flex-1 min-w-0">
                  <BiInput label={`${i + 1}.`} value={it.caption} onChange={(v) => updateBlock(b.id, { items: b.items.map((x, j) => (j === i ? { ...x, caption: v } : x)) })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    );
  };

  /** Puts an earlier version in the editor as unsaved changes (Undo reverts it; Save makes it live). */
  const loadVersion = (v: LandingPage, label: string) => {
    if (!v.builder) return;
    setDoc(() => normalizeBuilderDoc(v.builder));
    setMeta((m) => ({ ...m, title: v.title || m.title, ogImage: v.ogImage || '', brand: brandOf(v) }));
    setVersionsOpen(false);
    setSelectedId(null);
    setNotice({ kind: 'ok', text: t('builder.versions.loaded', { label }) });
  };
  const setBrand = (patch: Partial<PageBrand>) => setMeta((m) => ({ ...m, brand: { ...m.brand, ...patch } }));
  const pagePanel = () => {
    const o = doc.offer;
    const setOffer = (patch: Partial<BuilderDoc['offer']>, typing = true) => setDoc((d) => ({ ...d, offer: { ...d.offer, ...patch } }), { typing });
    return (
      <>
        <Section title={t('builder.page')}>
          <div>
            <ImageField
              label={t('builder.page.feature')}
              value={meta.ogImage}
              onChange={(url) => setMeta({ ...meta, ogImage: url })}
              maxEdge={1600}
              hint={t('builder.page.featureHint')}
            />
            {!meta.ogImage && (
              <p className="mt-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                {featureImage({ builder: doc }) ? t('builder.page.featureAuto') : t('builder.page.featureMissing')}
              </p>
            )}
          </div>
          <div>
            <label className={LABEL}>{t('builder.page.title')}</label>
            <input className={INPUT} value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </div>
          <div>
            <label className={LABEL}>{t('builder.page.slug')}</label>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 font-mono">/</span>
              <input className={`${INPUT} font-mono`} value={meta.slug} onChange={(e) => setMeta({ ...meta, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
            </div>
          </div>
          <div>
            <label className={LABEL}>{t('builder.page.defaultLang')}</label>
            <div className="flex gap-1">
              {(['en', 'kh'] as const).map((l) => (
                <button key={l} type="button" className={SEG((doc.defaultLang || 'en') === l)} onClick={() => setDoc((d) => ({ ...d, defaultLang: l }))}>{l === 'en' ? 'English' : 'ខ្មែរ'}</button>
              ))}
            </div>
            <p className={HINT}>{t('builder.page.defaultLangHint')}</p>
          </div>
        </Section>
        <Section title={t('builder.contactInfo')}>
          <div data-brand-contact="" className="space-y-3">
            <p className={HINT}>{t('builder.contactInfo.intro')}</p>
            <ImageField
              label={t('builder.contactInfo.logo')}
              value={meta.brand.logoUrl}
              onChange={(url) => setBrand({ logoUrl: url })}
              maxEdge={800}
              preview="contain"
              hint={meta.brand.logoUrl ? t('builder.contactInfo.logoOwn') : t('builder.contactInfo.logoCompany')}
            />
            {(
              [
                ['companyName', 'builder.contactInfo.name', companySettings?.companyName],
                ['phone', 'builder.contactInfo.phone', companySettings?.phone],
                ['telegramUsername', 'builder.contactInfo.telegram', companySettings?.telegramUsername?.replace(/^@/, '')],
                ['whatsapp', 'builder.contactInfo.whatsapp', companySettings?.whatsappNumber],
                ['email', 'builder.contactInfo.email', companySettings?.email],
                ['address', 'builder.contactInfo.address', companySettings?.address],
              ] as const
            ).map(([key, label, fallback]) => (
              <div key={key}>
                <label className={LABEL}>{t(label)}</label>
                <div className="flex items-center gap-1">
                  {key === 'telegramUsername' && <span className="text-[11px] text-slate-400 font-mono">@</span>}
                  <input className={INPUT} data-brand-field={key} value={meta.brand[key]} placeholder={fallback || ''} onChange={(e) => setBrand({ [key]: key === 'telegramUsername' ? e.target.value.replace(/^@/, '') : e.target.value })} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-200 dark:border-emerald-900/50 space-y-2" data-coordinator="">
              <label className={LABEL}>{t('isolated.coordinator.title')}</label>
              <div className="flex items-start gap-2">
                <div className="w-20 shrink-0">
                  <ImageField label="" value={meta.brand.coordinatorAvatar} onChange={(url) => setBrand({ coordinatorAvatar: url })} maxEdge={512} preview="square" compact />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <input className={INPUT} data-brand-field="coordinatorName" placeholder={t('isolated.coordinator.name')} value={meta.brand.coordinatorName} onChange={(e) => setBrand({ coordinatorName: e.target.value })} />
                  <input className={INPUT} placeholder={t('isolated.coordinator.role')} value={meta.brand.coordinatorRole} onChange={(e) => setBrand({ coordinatorRole: e.target.value })} />
                  <input className={INPUT} placeholder={t('isolated.coordinator.roleKh')} value={meta.brand.coordinatorRoleKh} onChange={(e) => setBrand({ coordinatorRoleKh: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className={INPUT} data-brand-field="coordinatorPhone" placeholder={t('isolated.coordinator.phone')} value={meta.brand.coordinatorPhone} onChange={(e) => setBrand({ coordinatorPhone: e.target.value })} />
                <input className={INPUT} data-brand-field="coordinatorTelegram" placeholder={t('isolated.coordinator.telegram')} value={meta.brand.coordinatorTelegram} onChange={(e) => setBrand({ coordinatorTelegram: e.target.value.replace(/^@/, '') })} />
              </div>
              <BiInput label={t('isolated.coordinator.bio')} value={meta.brand.coordinatorBio} onChange={(v) => setBrand({ coordinatorBio: v })} multiline />
              <p className={HINT}>{t('builder.contactInfo.coordinatorHint')}</p>
            </div>
            <div>
              <label className={LABEL}>{t('builder.contactInfo.show')}</label>
              <div className="flex flex-wrap gap-1" data-contact-lines="">
                {CONTACT_LINES.map((line) => {
                  const on = !meta.brand.contactHidden.includes(line);
                  return (
                    <button
                      key={line}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setBrand({ contactHidden: on ? [...meta.brand.contactHidden, line] : meta.brand.contactHidden.filter((x) => x !== line) })}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${on ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300' : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-emerald-900/60 text-slate-400 line-through'}`}
                    >
                      {t(`builder.contactInfo.line.${line}`)}
                    </button>
                  );
                })}
              </div>
              <p className={HINT}>{t('builder.contactInfo.showHint')}</p>
            </div>
            <BiInput label={t('builder.contactInfo.note')} value={meta.brand.footerNote} onChange={(v) => setBrand({ footerNote: v })} multiline hint={t('builder.contactInfo.noteHint')} />
            <div className="pt-2 border-t border-slate-200 dark:border-emerald-900/50 space-y-2">
              <label className={LABEL}>{t('builder.contactInfo.printClosing')}</label>
              <BiInput label={t('builder.contactInfo.printTitle')} value={meta.brand.printClosingTitle} onChange={(v) => setBrand({ printClosingTitle: v })} />
              <BiInput label={t('builder.contactInfo.printText')} value={meta.brand.printClosingText} onChange={(v) => setBrand({ printClosingText: v })} multiline />
              <p className={HINT}>{t('builder.contactInfo.printHint')}</p>
            </div>
            <p className={HINT}>{t('builder.contactInfo.where')}</p>
          </div>
        </Section>
        <Section title={t('builder.offer')}>
          <p className={HINT}>{t('builder.offer.intro')}</p>
          <BiInput label={t('builder.offer.name')} value={o.name} onChange={(v) => setOffer({ name: v })} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LABEL}>{t('builder.offer.price')}</label>
              <input className={INPUT} type="number" min={0} value={o.price ?? ''} onChange={(e) => setOffer({ price: numOrNull(e.target.value) })} />
            </div>
            <div>
              <label className={LABEL}>{t('builder.offer.currency')}</label>
              <select className={INPUT} value={o.currency} onChange={(e) => setOffer({ currency: e.target.value === 'KHR' ? 'KHR' : 'USD' }, false)}>
                <option value="USD">USD ($)</option>
                <option value="KHR">KHR (៛)</option>
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>{t('builder.offer.compareAt')}</label>
            <input className={INPUT} type="number" min={0} value={o.compareAtPrice ?? ''} onChange={(e) => setOffer({ compareAtPrice: numOrNull(e.target.value) })} />
            <p className={HINT}>{t('builder.offer.compareAtHint')}</p>
          </div>
          <div className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-400/30 bg-amber-50/60 dark:bg-amber-400/5 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LABEL}>{t('builder.offer.earlyPrice')}</label>
                <input className={INPUT} type="number" min={0} value={o.earlyPrice ?? ''} onChange={(e) => setOffer({ earlyPrice: numOrNull(e.target.value) })} />
              </div>
              <div>
                <label className={LABEL}>{t('builder.offer.earlyUntil')}</label>
                <input className={INPUT} type="datetime-local" value={toLocalInput(o.earlyUntil)} onChange={(e) => setOffer({ earlyUntil: fromLocalInput(e.target.value) }, false)} />
              </div>
            </div>
            <p className={HINT}>{t('builder.offer.earlyHint')}</p>
          </div>
          <BiInput label={t('builder.offer.priceNote')} value={o.priceNote} onChange={(v) => setOffer({ priceNote: v })} />
          <div>
            <label className={LABEL}>{t('builder.offer.deadline')}</label>
            <input className={INPUT} type="datetime-local" value={toLocalInput(o.deadline)} onChange={(e) => setOffer({ deadline: fromLocalInput(e.target.value) }, false)} />
            <p className={HINT}>{t('builder.offer.deadlineHint')}</p>
          </div>
          <BiInput label={t('builder.offer.deadlineLabel')} value={o.deadlineLabel} onChange={(v) => setOffer({ deadlineLabel: v })} hint={t('builder.offer.deadlineLabelHint')} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LABEL}>{t('builder.offer.stockTotal')}</label>
              <input className={INPUT} type="number" min={0} value={o.stockTotal ?? ''} onChange={(e) => setOffer({ stockTotal: numOrNull(e.target.value) })} />
            </div>
            <div>
              <label className={LABEL}>{t('builder.offer.stockLeft')}</label>
              <input className={INPUT} type="number" min={0} value={o.stockLeft ?? ''} onChange={(e) => setOffer({ stockLeft: numOrNull(e.target.value) })} />
            </div>
          </div>
          <BiInput label={t('builder.offer.stockLabel')} value={o.stockLabel} onChange={(v) => setOffer({ stockLabel: v })} hint={t('builder.offer.stockHint')} />
          <div>
            <label className={LABEL}>{t('builder.offer.cta')}</label>
            <select className={INPUT} value={o.cta.action} onChange={(e) => setOffer({ cta: e.target.value === 'url' ? { action: 'url', url: o.cta.url } : { action: 'telegram' } }, false)}>
              <option value="telegram">{t('builder.offer.ctaTelegram')}</option>
              <option value="url">{t('builder.offer.ctaUrl')}</option>
            </select>
            {o.cta.action === 'url' && (
              <input className={`${INPUT} mt-1.5`} placeholder="https://… or /page" value={o.cta.url || ''} onChange={(e) => setOffer({ cta: { action: 'url', url: e.target.value } })} />
            )}
          </div>
        </Section>
        <Section title={t('builder.brand')}>
          <div>
            <label className={LABEL}>{t('builder.brand.accent')}</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ACCENT_PRESETS.map((c) => (
                <button key={c} type="button" aria-label={c} onClick={() => setDoc((d) => ({ ...d, brand: { ...d.brand, accent: c } }))} className={`w-7 h-7 rounded-full border-2 cursor-pointer ${doc.brand.accent.toLowerCase() === c.toLowerCase() ? 'border-slate-900 dark:border-white' : 'border-transparent'}`} style={{ background: c }} />
              ))}
              <input type="color" aria-label={t('builder.brand.accent')} value={doc.brand.accent} onChange={(e) => setDoc((d) => ({ ...d, brand: { ...d.brand, accent: e.target.value } }), { typing: true })} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent" />
              <button type="button" className="text-[10px] font-bold underline text-slate-500 cursor-pointer" onClick={() => setDoc((d) => ({ ...d, brand: { ...d.brand, accent: DEFAULT_ACCENT } }))}>{t('builder.brand.reset')}</button>
            </div>
          </div>
          <div>
            <label className={LABEL}>{t('builder.brand.radius')}</label>
            <div className="flex gap-1">
              {(['sharp', 'soft', 'round'] as const).map((r) => (
                <button key={r} type="button" className={SEG(doc.brand.radius === r)} onClick={() => setDoc((d) => ({ ...d, brand: { ...d.brand, radius: r } }))}>{t(`builder.brand.radius.${r}`)}</button>
              ))}
            </div>
          </div>
        </Section>
      </>
    );
  };

  return (
    <div ref={rootRef} className="space-y-4" style={{ '--kb-top': '0px', '--kb-bar': '0px' } as React.CSSProperties}>
      {fullPreview && <BuilderFullPreview doc={doc} ctx={ctx} lang={previewLang} onLang={setPreviewLang} onClose={closeFullPreview} slug={meta.slug} />}
      {/* Top bar */}
      <div
        ref={barRef}
        data-editor-bar={barHidden ? 'hidden' : 'shown'}
        className={`${PANEL} p-3 flex flex-wrap items-center gap-2 justify-between sticky top-[var(--kb-top)] z-[15] transition-[transform,box-shadow] duration-200 ${barStuck ? 'shadow-lg' : ''} ${barHidden ? 'max-lg:-translate-y-[calc(100%+var(--kb-top))]' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/admin/pages" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-gray-300" aria-label={t('builder.back')}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <LayoutTemplate className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white truncate">{meta.title || t('builder.untitled')}</div>
            <div className="text-[10px] text-slate-500 dark:text-gray-400 font-mono truncate">/{meta.slug}</div>
          </div>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${meta.status === 'published' ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'}`}>
            {meta.status === 'published' ? t('builder.status.live') : t('builder.status.draft')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={undo} disabled={!past.length} className={ICON_BTN} title={t('builder.undo')} aria-label={t('builder.undo')}><Undo2 className="w-4 h-4" /></button>
          <button type="button" onClick={redo} disabled={!future.length} className={ICON_BTN} title={t('builder.redo')} aria-label={t('builder.redo')}><Redo2 className="w-4 h-4" /></button>
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-emerald-950/60 mx-1">
            <button type="button" onClick={() => setDevice('phone')} className={`p-1.5 rounded-lg cursor-pointer ${device === 'phone' ? 'bg-white dark:bg-[#0A1610] shadow text-slate-900 dark:text-white' : 'text-slate-500'}`} aria-label={t('builder.phone')} title={t('builder.phone')}><Smartphone className="w-4 h-4" /></button>
            <button type="button" onClick={() => setDevice('desktop')} className={`p-1.5 rounded-lg cursor-pointer ${device === 'desktop' ? 'bg-white dark:bg-[#0A1610] shadow text-slate-900 dark:text-white' : 'text-slate-500'}`} aria-label={t('builder.desktop')} title={t('builder.desktop')}><Monitor className="w-4 h-4" /></button>
            <button type="button" onClick={() => setFullPreview(true)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-gray-300 hover:bg-white dark:hover:bg-[#0A1610] hover:text-slate-900 dark:hover:text-white cursor-pointer" title={t('builder.fullPreviewHint')}><Maximize2 className="w-3.5 h-3.5" />{t('builder.fullPreview')}</button>
          </div>
          <button type="button" onClick={() => setView((v) => (v === 'map' ? 'page' : 'map'))} aria-pressed={view === 'map'} className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold cursor-pointer ${view === 'map' ? 'bg-amber-400 text-black shadow' : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-emerald-900/60'}`} title={t('builder.mapHint')}>
            <MapIcon className="w-3.5 h-3.5" />{t('builder.map')}
          </button>
          <button type="button" onClick={() => setVersionsOpen(true)} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold cursor-pointer bg-slate-100 dark:bg-emerald-950/60 text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-emerald-900/60" title={t('builder.versions.hint')}>
            <History className="w-3.5 h-3.5" />{t('builder.versions')}
          </button>
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-emerald-950/60">
            {(['en', 'kh'] as const).map((l) => (
              <button key={l} type="button" onClick={() => setPreviewLang(l)} className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${previewLang === l ? 'bg-white dark:bg-[#0A1610] shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>{l === 'en' ? 'EN' : 'ខ្មែរ'}</button>
            ))}
          </div>
          <a href={`/${page.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-emerald-950/60" title={t('builder.viewHint')}>
            <ExternalLink className="w-3.5 h-3.5" />{t('builder.view')}
          </a>
          <a href={`/${page.slug}/print?lang=${previewLang}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-emerald-950/60" title={t('builder.printHint')}>
            <Printer className="w-3.5 h-3.5" />{t('builder.print')}
          </a>
          {meta.status !== 'published' ? (
            <button type="button" disabled={saving} onClick={() => save('published')} className="px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-[#fff] on-dark cursor-pointer disabled:opacity-50">{t('builder.publish')}</button>
          ) : (
            <button type="button" disabled={saving} onClick={() => save('draft')} className="px-3 py-2 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 cursor-pointer disabled:opacity-50">{t('builder.unpublish')}</button>
          )}
          <button type="button" disabled={saving} onClick={() => save()} title={t('builder.saveShortcut')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs shadow-md cursor-pointer disabled:opacity-50">
            <Save className="w-4 h-4" />
            <span>{saving ? t('common.saving') : t('common.save')}</span>
            {dirty && !saving && <span className="w-2 h-2 rounded-full bg-rose-500" title={t('common.unsavedChanges')} />}
          </button>
        </div>
        <div className="w-full text-[10px] text-slate-500 dark:text-gray-400 -mt-1 flex items-center gap-1.5" data-autosave={autosave.state}>
          <span className={`w-1.5 h-1.5 rounded-full ${autosave.state === 'error' ? 'bg-rose-500' : autosave.state === 'saving' ? 'bg-amber-400 animate-pulse' : autosave.state === 'saved' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
          <span>
            {autosave.state === 'saving' && t('builder.autosave.saving')}
            {autosave.state === 'saved' && t(meta.status === 'published' ? 'builder.autosave.backedUp' : 'builder.autosave.saved', { time: autosave.at ? new Date(autosave.at).toLocaleTimeString(uiLang === 'kh' ? 'km-KH' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : '' })}
            {autosave.state === 'error' && t('builder.autosave.failed')}
            {autosave.state === 'idle' && t(meta.status === 'published' ? 'builder.autosave.idleLive' : 'builder.autosave.idleDraft')}
          </span>
        </div>
      </div>

      {conflict && (
        <div className="p-3 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 border bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800/60 text-rose-800 dark:text-rose-200" data-conflict="">
          <span>{t('builder.conflict')}</span>
          <button type="button" onClick={() => window.location.reload()} className="px-3 py-1.5 rounded-lg bg-rose-600 text-[#fff] on-dark font-extrabold cursor-pointer">{t('builder.conflictReload')}</button>
        </div>
      )}
      {restoreOffer && (
        <div className="p-3 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 border bg-amber-50 dark:bg-amber-400/10 border-amber-300 dark:border-amber-400/40 text-slate-900 dark:text-white" data-restore-offer="">
          <span>{t('builder.restore.found', { time: new Date(restoreOffer.savedAt).toLocaleString(uiLang === 'kh' ? 'km-KH' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}</span>
          <span className="flex gap-2">
            <button type="button" onClick={restoreDraft} className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-extrabold cursor-pointer">{t('builder.restore.restore')}</button>
            <button type="button" onClick={discardDraft} className="px-3 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-emerald-800 font-bold cursor-pointer">{t('builder.restore.discard')}</button>
          </span>
        </div>
      )}
      {versionsOpen && <BuilderVersions pageId={page.id} onClose={() => setVersionsOpen(false)} onLoad={loadVersion} />}
      {notice && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${notice.kind === 'ok' ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-500/60 text-emerald-800 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'}`}>
          {notice.kind === 'ok' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)_320px] items-start">
        {/* Library */}
        <aside className={`${PANEL} p-3 space-y-2 lg:sticky lg:top-[calc(var(--kb-top)+var(--kb-bar)+12px)] lg:max-h-[calc(100vh-var(--kb-top)-var(--kb-bar)-88px)] lg:overflow-y-auto`}>
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-emerald-500/80 px-1">{t('builder.library')}</h3>
          <p className="text-[10px] text-slate-500 dark:text-gray-400 px-1">{t('builder.libraryHint')}</p>
          {BLOCK_TYPES.map((type) => {
            const def = BLOCK_DEFINITIONS[type];
            return (
              <div
                key={type}
                draggable
                onDragStart={(e) => onDragStartNew(e, type)}
                className="group p-3 rounded-xl border border-slate-200 dark:border-emerald-900/60 hover:border-amber-400 bg-slate-50 dark:bg-[#06100B] cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">{pick(def.name, uiLang)}</div>
                  <button type="button" onClick={() => addBlock(type)} className="p-1 rounded-md text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer" aria-label={t('builder.addToPage')} title={t('builder.addToPage')}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-gray-400 mt-1 leading-snug">{pick(def.coreValue, uiLang)}</p>
                <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 mt-1.5">{t('builder.designsCount', { n: def.variants.length })}</p>
              </div>
            );
          })}
          <p className="text-[10px] text-slate-400 px-1 pt-1">{t('builder.moreSoon')}</p>
        </aside>

        {/* Canvas */}
        <div className={`${PANEL} p-3 overflow-hidden`}>
          {view === 'map' ? (
          <div className="bg-slate-100 dark:bg-black/40 rounded-xl p-2 sm:p-4 overflow-auto max-h-[calc(100vh-190px)] lg:max-h-[calc(100vh-var(--kb-top)-var(--kb-bar)-112px)]">
            <BuilderPageMap
              doc={doc}
              ctx={ctx}
              lang={previewLang}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={move}
              onApply={(blocks) => setDoc((d) => ({ ...d, blocks }))}
            />
          </div>
          ) : (
          <div className="bg-slate-100 dark:bg-black/40 rounded-xl p-2 sm:p-4 overflow-auto max-h-[calc(100vh-190px)] lg:max-h-[calc(100vh-var(--kb-top)-var(--kb-bar)-112px)]" onClick={() => setSelectedId(null)}>
            <div className={`mx-auto transition-all duration-300 ${device === 'phone' ? 'w-[390px] max-w-full rounded-[28px] ring-8 ring-slate-800 dark:ring-black overflow-hidden' : 'w-full'}`}>
              <BuilderRoot brand={doc.brand} lang={previewLang}>
                {doc.blocks.length === 0 ? (
                  <div
                    className="m-4 p-10 rounded-2xl border-2 border-dashed border-slate-300 text-center text-sm text-slate-500"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(0); }}
                    onDrop={(e) => onDrop(e, 0)}
                  >
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    {t('builder.empty')}
                  </div>
                ) : (
                  doc.blocks.map((block, index) => {
                    const isSel = block.id === selectedId;
                    const hints = hintsFor(block);
                    return (
                      <div
                        key={block.id}
                        className={`relative group ${isSel ? 'outline outline-3 outline-amber-400 -outline-offset-3 z-[1]' : 'hover:outline hover:outline-2 hover:outline-amber-300/70 hover:-outline-offset-2'}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedId(block.id); }}
                        draggable
                        onDragStart={(e) => onDragStartMove(e, index)}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(dropIndexFor(e, index)); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => onDrop(e, dropIndexFor(e, index))}
                      >
                        {dragOver === index && <div className="absolute -top-1 left-0 right-0 h-1.5 bg-amber-400 rounded-full z-10 pointer-events-none" />}
                        {dragOver === index + 1 && index === doc.blocks.length - 1 && <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-amber-400 rounded-full z-10 pointer-events-none" />}
                        <div className={`absolute top-2 left-2 z-10 flex items-center gap-1 ${isSel ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-400 text-black text-[10px] font-extrabold shadow cursor-grab">
                            <GripVertical className="w-3 h-3" />{pick(BLOCK_DEFINITIONS[block.type].name, uiLang)}
                          </span>
                          {hints.length > 0 && <span className="px-1.5 py-1 rounded-md bg-rose-600 text-[#fff] on-dark text-[10px] font-extrabold shadow" title={hints.join('\n')}>{hints.length}</span>}
                        </div>
                        <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 ${isSel ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} onClick={(e) => e.stopPropagation()}>
                          <button type="button" className={ICON_BTN} disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={t('builder.moveUp')} title={t('builder.moveUp')}><ArrowUp className="w-3.5 h-3.5" /></button>
                          <button type="button" className={ICON_BTN} disabled={index === doc.blocks.length - 1} onClick={() => move(index, index + 1)} aria-label={t('builder.moveDown')} title={t('builder.moveDown')}><ArrowDown className="w-3.5 h-3.5" /></button>
                          <button type="button" className={ICON_BTN} onClick={() => duplicate(index)} aria-label={t('common.duplicate')} title={t('common.duplicate')}><Copy className="w-3.5 h-3.5" /></button>
                          <button type="button" className={ICON_BTN} onClick={() => remove(block.id)} aria-label={t('common.delete')} title={t('common.delete')}><Trash2 className="w-3.5 h-3.5 text-rose-600" /></button>
                        </div>
                        <div className="pointer-events-none select-none">
                          <BlockView block={block} ctx={ctx} />
                        </div>
                      </div>
                    );
                  })
                )}
                {doc.blocks.length > 0 && (
                  <div
                    className={`m-3 p-4 rounded-xl border-2 border-dashed text-center text-xs font-bold ${dragOver === doc.blocks.length ? 'border-amber-400 text-amber-700 bg-amber-50' : 'border-slate-300 text-slate-400'}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(doc.blocks.length); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => onDrop(e, doc.blocks.length)}
                  >
                    {t('builder.dropHere')}
                  </div>
                )}
              </BuilderRoot>
            </div>
          </div>
          )}
        </div>

        {/* Inspector */}
        <aside className={`${PANEL} p-4 space-y-4 lg:sticky lg:top-[calc(var(--kb-top)+var(--kb-bar)+12px)] max-h-[calc(100vh-110px)] lg:max-h-[calc(100vh-var(--kb-top)-var(--kb-bar)-88px)] overflow-y-auto`}>
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">{pick(BLOCK_DEFINITIONS[selected.type].name, uiLang)}</div>
                  <div className="text-[10px] text-slate-500">{t('builder.position', { n: selectedIndex + 1, total: doc.blocks.length })}</div>
                </div>
                <button type="button" onClick={() => setSelectedId(null)} className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer" aria-label={t('common.close')}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/30">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400">{t('builder.coreValue')}</div>
                <p className="text-xs text-slate-800 dark:text-gray-200 mt-1">{pick(BLOCK_DEFINITIONS[selected.type].coreValue, uiLang)}</p>
              </div>
              {hintsFor(selected).length > 0 && (
                <ul className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-1">
                  {hintsFor(selected).map((h) => <li key={h} className="text-[11px] text-rose-800 dark:text-rose-200">• {h}</li>)}
                </ul>
              )}
              {styleControls(selected)}
              {selected.type === 'hero' && heroContent(selected)}
              {selected.type === 'offer' && offerContent(selected)}
              {selected.type === 'faq' && faqContent(selected)}
              {selected.type === 'benefits' && benefitsContent(selected)}
              {selected.type === 'included' && includedContent(selected)}
              {selected.type === 'steps' && stepsContent(selected)}
              {selected.type === 'form' && formContent(selected)}
              {selected.type === 'finalCta' && finalContent(selected)}
              {selected.type === 'gallery' && galleryContent(selected)}
              {selected.type === 'terms' && termsContent(selected)}
              {selected.type === 'inclusions' && inclusionsContent(selected)}
              {selected.type === 'contact' && contactContent(selected)}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-500" />
                <div className="text-sm font-black text-slate-900 dark:text-white">{t('builder.pageSettings')}</div>
              </div>
              <p className={HINT}>{t('builder.pageSettingsHint')}</p>
              {pagePanel()}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
