'use client';

import React, { useRef, useState } from 'react';
import { CheckCircle2, Film, Loader2, Upload, X } from 'lucide-react';
import { parseVideoSource, VIDEO_PROVIDER_NAMES } from '@/lib/video-embed';
import { uploadVideo } from '@/lib/video-upload-client';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Background video for a builder section: paste a YouTube, Vimeo, Facebook or
 * TikTok link or embed code, a video file link, or upload an MP4 / WebM / MOV.
 * Only a recognised video is saved; anything else shows an error and changes nothing.
 */
export default function VideoField({ label, value, onChange, hint }: { label: string; value: string; onChange: (url: string) => void; hint?: string }) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = value ? parseVideoSource(value) : null;
  const shown = draft ?? value;

  const accept = (raw: string) => {
    setDraft(raw);
    if (!raw.trim()) {
      setError(null);
      setDraft(null);
      onChange('');
      return;
    }
    const parsed = parseVideoSource(raw);
    if (parsed) {
      setError(null);
      setDraft(null);
      onChange(parsed.url);
    } else {
      setError(t('video.notSupported'));
    }
  };

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadVideo(file);
      setDraft(null);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('image.uploadFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Film className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={shown}
            onChange={(e) => accept(e.target.value)}
            placeholder={t('video.placeholder')}
            aria-label={label}
            className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => { void upload(e.target.files); e.target.value = ''; }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          title={t('video.upload')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer disabled:opacity-60 shrink-0"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>{busy ? t('common.uploading') : t('common.upload')}</span>
        </button>
        {value && (
          <button type="button" onClick={() => accept('')} title={t('video.remove')} aria-label={t('video.remove')} className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {busy && <p className="mt-1 text-[11px] text-slate-500">{t('video.uploading')}</p>}
      {error && <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
      {!error && current && (
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t('video.recognised', { source: VIDEO_PROVIDER_NAMES[current.provider] })}
          {(current.provider === 'facebook' || current.provider === 'tiktok') && <span className="font-normal text-amber-700 dark:text-amber-400"> {t('video.socialNote')}</span>}
        </p>
      )}
      {!error && current?.provider === 'file' && /\.(mov|m4v)(?:$|[?#])/i.test(current.url) && (
        <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">{t('video.movNote')}</p>
      )}
      {hint && !error && <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}
