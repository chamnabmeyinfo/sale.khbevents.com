'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, ExternalLink, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from 'lucide-react';
import { uploadImage } from '@/lib/image-upload-client';
import { matchesSearch, MAX_LABEL, readableName, type MediaFile, type MediaUsage } from '@/lib/media-library';
import { useLanguage } from '@/context/LanguageContext';

/**
 * The photo library: every uploaded photo, with upload, search, rename and
 * delete. In a picker (`onPick`), a click adds the photo; on the library page it
 * opens the photo.
 *
 * Rename changes only the name shown here; the file and the URL pages use stay
 * the same. Delete warns when pages or popups still show the photo.
 */
interface MediaLibraryProps {
  /** Picker mode: called with the URL when a photo is clicked. */
  onPick?: (url: string) => void;
  /** URLs already used by the caller; shown as added and not clickable. */
  exclude?: string[];
  /** Preset images from /public (read-only, cannot be renamed or deleted). */
  presets?: string[];
  /** Change it to reload the list, e.g. after the caller uploaded a photo. */
  reloadKey?: number;
  /** Longest edge when downscaling uploads. */
  maxEdge?: number;
  /** Smaller grid for side panels and dialogs. */
  compact?: boolean;
  title?: string;
}

type Confirming = { name: string; usedBy: MediaUsage[] } | null;

const TILE_BTN = 'p-1 rounded-md bg-white/95 dark:bg-[#07130D]/95 text-slate-700 dark:text-gray-200 hover:text-black dark:hover:text-white shadow cursor-pointer';

export default function MediaLibrary({ onPick, exclude = [], presets = [], reloadKey = 0, maxEdge, compact = false, title }: MediaLibraryProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ name: string; value: string } | null>(null);
  const [busyName, setBusyName] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [dropping, setDropping] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch('/api/uploads', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data.files)) throw new Error();
      setFiles(data.files);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch after mount; the timer keeps setState out of the effect body.
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load, reloadKey]);

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice((n) => (n === text ? null : n)), 3000);
  };

  // ── Create ──
  const uploadFiles = async (list: FileList | File[]) => {
    const images = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    setError(null);
    setPending((p) => p + images.length);
    let added = 0;
    for (const file of images) {
      try {
        await uploadImage(file, maxEdge);
        added++;
      } catch (e) {
        setError(e instanceof Error ? e.message : t('image.uploadFailed'));
      } finally {
        setPending((p) => p - 1);
      }
    }
    if (added) {
      await load();
      flash(t('media.uploaded', { n: added }));
    }
  };

  // ── Update ──
  const saveName = async () => {
    if (!editing) return;
    const { name, value } = editing;
    setBusyName(name);
    setError(null);
    try {
      const res = await fetch(`/api/uploads/${encodeURIComponent(name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('media.renameFailed'));
      setFiles((all) => all.map((f) => (f.name === name ? { ...f, label: data.label } : f)));
      setEditing(null);
      flash(t('media.renamed'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('media.renameFailed'));
    } finally {
      setBusyName(null);
    }
  };

  // ── Delete ──
  const remove = async (name: string, force: boolean) => {
    setBusyName(name);
    setError(null);
    try {
      const res = await fetch(`/api/uploads/${encodeURIComponent(name)}${force ? '?force=1' : ''}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && Array.isArray(data.usedBy)) {
        setConfirming({ name, usedBy: data.usedBy });
        return;
      }
      if (!res.ok) throw new Error(data.error || t('media.deleteFailed'));
      setFiles((all) => all.filter((f) => f.name !== name));
      setConfirming(null);
      flash(t('media.deleted'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('media.deleteFailed'));
    } finally {
      setBusyName(null);
    }
  };

  const choose = (url: string, added: boolean) => {
    if (!onPick) window.open(url, '_blank', 'noopener');
    else if (!added) onPick(url);
  };

  const shown = files.filter((f) => matchesSearch(f, query));
  const presetItems = presets
    .filter((p, i, all) => all.indexOf(p) === i && !files.some((f) => f.url === p))
    .map((url) => ({ url, label: readableName(decodeURIComponent(url.split('/').pop() || url)) }))
    .filter((p) => !query.trim() || p.label.toLowerCase().includes(query.trim().toLowerCase()));
  const total = files.length + presets.length;
  const grid = compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3';

  const usageText = (u: MediaUsage) => (u.kind === 'page' ? `${u.title} (/${u.slug})` : u.kind === 'staff' ? t('media.staffNamed', { name: u.title }) : t('media.popupNamed', { name: u.title }));

  return (
    <div
      className={`space-y-3 rounded-2xl ${dropping ? 'ring-2 ring-amber-400 bg-amber-50/50 dark:bg-amber-400/5' : ''}`}
      onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDropping(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDropping(false); }}
      onDrop={(e) => { if (e.dataTransfer.files?.length) { e.preventDefault(); setDropping(false); void uploadFiles(e.dataTransfer.files); } }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[12px] font-bold text-slate-700 dark:text-gray-200 mr-auto">
          {title ?? t('media.title')} <span className="text-slate-400 font-semibold">({total})</span>
          {onPick && <span className="block text-[11px] font-semibold text-slate-500 dark:text-gray-400">{t('image.library')}</span>}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('media.search')}
            aria-label={t('media.search')}
            className="w-40 sm:w-52 pl-8 pr-2 py-1.5 rounded-lg bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
          />
        </div>
        <button type="button" onClick={() => { setLoading(true); void load(); }} className="p-1.5 rounded-lg border border-slate-200 dark:border-emerald-900/60 text-slate-600 dark:text-gray-300 hover:border-amber-400 cursor-pointer" aria-label={t('media.refresh')} title={t('media.refresh')}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) void uploadFiles(e.target.files); e.target.value = ''; }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending > 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-emerald-800 text-[#fff] on-dark font-bold text-xs cursor-pointer hover:opacity-90 disabled:opacity-60"
        >
          {pending > 0 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {pending > 0 ? t('image.uploadingN', { n: pending }) : t('media.upload')}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl px-3 py-2">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label={t('common.close')} className="cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {notice && <div role="status" className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl px-3 py-2">{notice}</div>}

      {confirming && (
        <div role="alertdialog" aria-label={t('media.confirmTitle')} className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4" />{t('media.inUse', { n: confirming.usedBy.length })}
          </div>
          <ul className="text-[11px] text-amber-900 dark:text-amber-100 list-disc pl-5">
            {confirming.usedBy.map((u) => <li key={`${u.kind}-${u.id}`}>{usageText(u)}</li>)}
          </ul>
          <p className="text-[11px] text-amber-900/80 dark:text-amber-100/80">{t('media.inUseHint')}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => void remove(confirming.name, true)} disabled={busyName === confirming.name} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-[#fff] on-dark text-xs font-bold cursor-pointer disabled:opacity-60">{t('media.deleteAnyway')}</button>
            <button type="button" onClick={() => setConfirming(null)} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-emerald-800 text-xs font-bold text-slate-700 dark:text-gray-200 cursor-pointer">{t('common.cancel')}</button>
          </div>
        </div>
      )}

      {loading && files.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500"><Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />{t('media.loading')}</div>
      ) : loadError ? (
        <div className="py-6 text-center text-xs text-rose-600">{t('media.loadFailed')}</div>
      ) : shown.length === 0 && presetItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 dark:text-gray-400 rounded-xl border-2 border-dashed border-slate-200 dark:border-emerald-900/60">
          {query.trim() ? t('media.noMatch') : t('media.empty')}
        </div>
      ) : (
        <ul className={grid}>
          {shown.map((f) => {
            const added = exclude.includes(f.url);
            const isEditing = editing?.name === f.name;
            const busy = busyName === f.name;
            return (
              <li key={f.name} className="rounded-xl overflow-hidden border border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-[#07130D] group">
                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-black/30">
                  <button
                    type="button"
                    onClick={() => choose(f.url, added)}
                    disabled={Boolean(onPick) && added}
                    title={onPick ? (added ? t('media.alreadyAdded') : t('media.clickToAdd')) : t('media.open')}
                    className="absolute inset-0 w-full h-full cursor-pointer disabled:cursor-default"
                  >
                    <img src={f.url} alt={f.label} loading="lazy" className="w-full h-full object-cover" />
                    {onPick && !added && (
                      <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#fff] on-dark text-xs font-bold transition-opacity"><Plus className="w-4 h-4 mr-1" />{t('media.add')}</span>
                    )}
                    {added && <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-[#fff] on-dark text-[11px] font-bold"><Check className="w-4 h-4 mr-1" />{t('media.added')}</span>}
                  </button>
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                    <button type="button" className={TILE_BTN} onClick={() => setEditing({ name: f.name, value: f.label })} aria-label={t('media.rename')} title={t('media.rename')}><Pencil className="w-3.5 h-3.5" /></button>
                    <a className={TILE_BTN} href={f.url} target="_blank" rel="noreferrer" aria-label={t('media.open')} title={t('media.open')}><ExternalLink className="w-3.5 h-3.5" /></a>
                    <button type="button" className={TILE_BTN} onClick={() => void remove(f.name, false)} disabled={busy} aria-label={t('media.delete')} title={t('media.delete')}>
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                    </button>
                  </div>
                  {f.usedBy.length > 0 && (
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-emerald-600 text-[#fff] on-dark text-[9px] font-extrabold shadow" title={f.usedBy.map(usageText).join('\n')}>
                      {t('media.usedOn', { n: f.usedBy.length })}
                    </span>
                  )}
                </div>
                <div className="px-2 py-1.5">
                  {isEditing ? (
                    <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); void saveName(); }}>
                      <input
                        autoFocus
                        value={editing.value}
                        maxLength={MAX_LABEL}
                        onChange={(e) => setEditing({ name: f.name, value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null); }}
                        aria-label={t('media.newName')}
                        className="flex-1 min-w-0 px-1.5 py-1 rounded-md border border-amber-400 bg-white dark:bg-[#06100B] text-[11px] text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button type="submit" disabled={busy} className="p-1 rounded-md bg-amber-400 text-black cursor-pointer" aria-label={t('common.save')}>{busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}</button>
                      <button type="button" onClick={() => setEditing(null)} className="p-1 rounded-md text-slate-500 cursor-pointer" aria-label={t('common.cancel')}><X className="w-3 h-3" /></button>
                    </form>
                  ) : (
                    <button type="button" onClick={() => setEditing({ name: f.name, value: f.label })} className="w-full text-left text-[11px] font-semibold text-slate-800 dark:text-gray-200 truncate cursor-text" title={`${f.label}\n${f.name}`}>
                      {f.label}
                    </button>
                  )}
                  {!compact && f.createdAt && <div className="text-[10px] text-slate-400">{new Date(f.createdAt).toLocaleDateString()}</div>}
                </div>
              </li>
            );
          })}
          {presetItems.map((p) => {
            const added = exclude.includes(p.url);
            return (
              <li key={p.url} className="rounded-xl overflow-hidden border border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-[#07130D] group">
                <button
                  type="button"
                  onClick={() => choose(p.url, added)}
                  disabled={Boolean(onPick) && added}
                  className="relative block w-full aspect-[4/3] bg-slate-100 dark:bg-black/30 cursor-pointer disabled:cursor-default"
                  title={t('media.presetHint')}
                >
                  <img src={p.url} alt={p.label} loading="lazy" className="w-full h-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-[#fff] on-dark text-[9px] font-extrabold">{t('media.preset')}</span>
                  {added && <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-[#fff] on-dark text-[11px] font-bold"><Check className="w-4 h-4 mr-1" />{t('media.added')}</span>}
                </button>
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-800 dark:text-gray-200 truncate" title={p.url}>{p.label}</div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[10px] text-slate-400">{t('media.hint')}</p>
    </div>
  );
}
