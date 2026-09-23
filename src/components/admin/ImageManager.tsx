'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, GripVertical, ImagePlus, Link2, Loader2, Star, Trash2, Upload } from 'lucide-react';
import { uploadImage } from '@/lib/image-upload-client';

/**
 * Ordered photo list with upload, drag-to-arrange, arrow buttons, "make cover",
 * remove, add-by-URL and a library of preset and previously uploaded images.
 *
 * The first photo is the cover: on the landing page it opens the hero slideshow
 * and leads the gallery. The parent owns the array; this component only reports
 * the new order.
 */
interface ImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  /** Preset paths that can be added with one click (uploaded files are added automatically). */
  library?: string[];
  title?: string;
  hint?: string;
}

interface UploadedFile { url: string; name: string; createdAt?: string }

function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const fileLabel = (url: string) => decodeURIComponent(url.split('/').pop() || url).replace(/^[a-z0-9]+-[a-f0-9]{8}-/, '');

export default function ImageManager({ images, onChange, library = [], title = 'Photos', hint }: ImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/uploads')
      .then(r => (r.ok ? r.json() : { files: [] }))
      .then(data => { if (!cancelled && Array.isArray(data.files)) setUploaded(data.files); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const add = (url: string) => {
    const clean = url.trim();
    if (!clean || images.includes(clean)) return;
    onChange([...images, clean]);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (list.length === 0) return;
    setError(null);
    setPending(p => p + list.length);
    const added: string[] = [];
    for (const original of list) {
      try {
        const data = await uploadImage(original);
        added.push(data.url);
        setUploaded(prev => [{ url: data.url, name: data.name }, ...prev]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setPending(p => p - 1);
      }
    }
    if (added.length) onChange([...images, ...added.filter(u => !images.includes(u))]);
  };

  const libraryItems = [...uploaded.map(f => f.url), ...library].filter((u, i, all) => all.indexOf(u) === i && !images.includes(u));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">{title} ({images.length})</div>
          {hint && <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 max-w-xl">{hint}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ''; }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending > 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow cursor-pointer disabled:opacity-60"
          >
            {pending > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{pending > 0 ? `Uploading ${pending}…` : 'Upload images'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {/* Ordered photos: drag, arrows, make cover, remove. Also a drop zone for files. */}
      <div
        className={`rounded-2xl border-2 border-dashed p-3 transition-colors ${dragOver === -1 ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-400/10' : 'border-slate-200 dark:border-emerald-900/60'}`}
        onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragOver(-1); } }}
        onDragLeave={() => { if (dragOver === -1) setDragOver(null); }}
        onDrop={e => { if (e.dataTransfer.files?.length) { e.preventDefault(); setDragOver(null); uploadFiles(e.dataTransfer.files); } }}
      >
        {images.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-gray-400">
            <ImagePlus className="w-6 h-6 mx-auto mb-2 opacity-60" />
            No photos yet. Upload, drop files here, or pick from the library below.
          </div>
        ) : (
          <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <li
                key={img}
                draggable
                onDragStart={e => { setDragFrom(idx); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)); }}
                onDragOver={e => { if (dragFrom !== null) { e.preventDefault(); setDragOver(idx); } }}
                onDrop={e => { if (dragFrom !== null) { e.preventDefault(); onChange(move(images, dragFrom, idx)); } setDragFrom(null); setDragOver(null); }}
                onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
                className={`relative rounded-2xl overflow-hidden border bg-slate-100 dark:bg-black/30 shadow-sm group cursor-grab active:cursor-grabbing transition-all ${
                  dragOver === idx && dragFrom !== idx ? 'border-amber-400 ring-2 ring-amber-300 scale-[1.02]' : idx === 0 ? 'border-amber-400' : 'border-slate-200 dark:border-emerald-900/50'
                } ${dragFrom === idx ? 'opacity-50' : ''}`}
              >
                <img src={img} alt={`Photo ${idx + 1}`} className="w-full aspect-[4/3] object-cover pointer-events-none" draggable={false} />
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow ${idx === 0 ? 'bg-amber-400 text-black' : 'bg-black/60 text-white'}`}>
                    {idx === 0 ? '★ Cover' : `#${idx + 1}`}
                  </span>
                </div>
                <span className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-white opacity-70" aria-hidden="true"><GripVertical className="w-3.5 h-3.5" /></span>
                <div className="flex items-center justify-between gap-1 px-1.5 py-1.5 bg-white dark:bg-[#07130D]">
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => onChange(move(images, idx, idx - 1))} disabled={idx === 0} aria-label="Move earlier" title="Move earlier" className="p-1 rounded-md text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-emerald-950 disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                    <button type="button" onClick={() => onChange(move(images, idx, idx + 1))} disabled={idx === images.length - 1} aria-label="Move later" title="Move later" className="p-1 rounded-md text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-emerald-950 disabled:opacity-30 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                    {idx !== 0 && (
                      <button type="button" onClick={() => onChange(move(images, idx, 0))} aria-label="Make cover" title="Make this the cover photo" className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-400/10 cursor-pointer"><Star className="w-4 h-4" /></button>
                    )}
                  </div>
                  <button type="button" onClick={() => onChange(images.filter((_, i) => i !== idx))} aria-label="Remove photo" title="Remove from this page (the file stays in the library)" className="p-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="px-2 pb-1.5 text-[10px] text-slate-500 dark:text-gray-400 truncate bg-white dark:bg-[#07130D]" title={img}>{fileLabel(img)}</div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Add by URL */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={urlDraft}
            onChange={e => setUrlDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(urlDraft); setUrlDraft(''); } }}
            placeholder="Or paste an image URL or path (/images/events/…)"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
          />
        </div>
        <button type="button" onClick={() => { add(urlDraft); setUrlDraft(''); }} className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-800 text-white font-bold text-xs cursor-pointer hover:opacity-90">
          Add
        </button>
      </div>

      {/* Library: uploaded first, then presets; one click adds */}
      {libraryItems.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">Library. Click a photo to add it:</div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {libraryItems.map(photo => (
              <button
                key={photo}
                type="button"
                onClick={() => add(photo)}
                title={fileLabel(photo)}
                className="rounded-xl overflow-hidden aspect-[4/3] border border-slate-200 dark:border-emerald-900/40 hover:border-amber-400 hover:scale-105 transition-all cursor-pointer group relative"
              >
                <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold">+ Add</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
