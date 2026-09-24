'use client';

import React from 'react';
import { Images } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import MediaLibrary from './MediaLibrary';

/** Admin → Landing Pages CMS → Photo Library: manage every uploaded photo in one place. */
export default function MediaLibraryPageClient() {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300"><Images className="w-5 h-5" /></div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">{t('media.pageTitle')}</h1>
          <p className="text-xs text-slate-600 dark:text-gray-400 max-w-2xl">{t('media.pageIntro')}</p>
        </div>
      </div>
      <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-4">
        <MediaLibrary />
      </div>
    </div>
  );
}
