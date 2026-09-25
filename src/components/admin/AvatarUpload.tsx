'use client';

import React, { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { uploadImage } from '@/lib/image-upload-client';
import { useLanguage } from '@/context/LanguageContext';
import StaffAvatar from './StaffAvatar';

/**
 * A salesperson's photo with a camera button: pick an image, it is shrunk to
 * 400 px and uploaded to the photo library, and its address is saved on the
 * staff record (after Save All Settings). The × removes the photo from the card.
 */
export default function AvatarUpload({ name, src, size = 48, onChange }: { name: string; src?: string; size?: number; onChange: (url: string | undefined) => void }) {
  const { t } = useLanguage();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('rr.avatar.notImage'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { url } = await uploadImage(file, 400);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('image.uploadFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <StaffAvatar name={name} src={src} size={size} className="ring-2 ring-white dark:ring-[#0A1610] shadow-sm" />
      {busy && (
        <span className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin on-dark" style={{ color: '#fff' }} />
        </span>
      )}
      <input ref={input} type="file" accept="image/*" className="hidden" aria-label={t('rr.avatar.upload', { name })} onChange={(e) => { void pick(e.target.files); e.target.value = ''; }} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        title={src ? t('rr.avatar.change') : t('rr.avatar.upload', { name })}
        aria-label={src ? t('rr.avatar.change') : t('rr.avatar.upload', { name })}
        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 hover:bg-amber-300 text-black border-2 border-white dark:border-[#0A1610] flex items-center justify-center cursor-pointer shadow"
      >
        <Camera className="w-3 h-3" />
      </button>
      {src && !busy && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          title={t('rr.avatar.remove')}
          aria-label={t('rr.avatar.remove')}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-[#0A1610] text-slate-500 hover:text-rose-600 border border-slate-200 dark:border-emerald-900 flex items-center justify-center cursor-pointer shadow"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {error && <span role="alert" className="absolute left-0 top-full mt-1 w-48 text-[10px] font-semibold text-rose-600 dark:text-rose-400 z-10">{error}</span>}
    </div>
  );
}
