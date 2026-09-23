'use client';

import React, { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { uploadImage } from '@/lib/image-upload-client';

/**
 * One image: a URL box with an Upload button, a thumbnail preview and a clear button.
 * Used for every single-image setting in the admin (cover for social sharing, coordinator
 * avatar, partner logo, speaker and artist photos, KHQR code).
 */
interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  hint?: string;
  /** Longest edge to keep when downscaling; smaller for avatars and logos. */
  maxEdge?: number;
  /** Thumbnail shape. */
  preview?: 'square' | 'wide' | 'contain';
  compact?: boolean;
}

export default function ImageField({ label, value, onChange, placeholder, hint, maxEdge, preview = 'wide', compact = false }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await uploadImage(file, maxEdge);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const previewClass = preview === 'square' ? 'w-12 h-12 rounded-full' : preview === 'contain' ? 'w-12 h-12 rounded-lg p-0.5 bg-white' : 'w-16 h-11 rounded-lg';

  return (
    <div>
      <label className={`block ${compact ? 'text-[11px]' : 'text-xs'} font-semibold text-slate-600 dark:text-gray-400 mb-1`}>{label}</label>
      <div
        className="flex items-center gap-2"
        onDragOver={e => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); }}
        onDrop={e => { if (e.dataTransfer.files?.length) { e.preventDefault(); handleFiles(e.dataTransfer.files); } }}
      >
        {value ? (
          <div className={`${previewClass} overflow-hidden border border-slate-200 dark:border-emerald-900/60 shrink-0 bg-slate-100 dark:bg-black/30`}>
            <img src={value} alt="" className={`w-full h-full ${preview === 'contain' ? 'object-contain' : 'object-cover'}`} />
          </div>
        ) : null}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'Paste an image URL or upload'}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          title="Upload an image"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer disabled:opacity-60 shrink-0"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>{busy ? 'Uploading…' : 'Upload'}</span>
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} title="Clear" aria-label="Clear image" className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
      {hint && !error && <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}
