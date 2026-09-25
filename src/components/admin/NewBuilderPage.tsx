'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { createBuilderPage } from './create-builder-page';

/** Admin → Create new page: makes a draft builder page and opens it in the builder. */
export default function NewBuilderPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    createBuilderPage(t('builder.newPageName'))
      .then((id) => router.replace(`/admin/builder/${id}`))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [router, t]);

  return (
    <div className="max-w-md mx-auto mt-16 p-6 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 text-center text-sm text-slate-700 dark:text-gray-300">
      {error ? (
        <>
          <p role="alert" className="text-rose-700 dark:text-rose-300">{error}</p>
          <Link href="/admin/pages" className="inline-block mt-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">{t('editor.backToPages')}</Link>
        </>
      ) : (
        <p className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('builder.creating')}</p>
      )}
    </div>
  );
}
