'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import type { DataHealth } from '@/lib/backups';
import { useLanguage } from '@/context/LanguageContext';

/** Red banner on the dashboard when pages or leads are missing since the last backup. */
export default function DataHealthBanner({ health }: { health: DataHealth | null }) {
  const { t } = useLanguage();
  if (!health || health.ok || !health.drop) return null;
  const d = health.drop;
  return (
    <div className="p-4 rounded-2xl border bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 flex flex-wrap items-center justify-between gap-3" data-health-banner="">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-extrabold">{t('backups.banner.title')}</div>
          <div className="text-xs mt-0.5">
            {t('backups.banner.detail', { pb: d.pagesBefore, pn: d.pagesNow, lb: d.leadsBefore, ln: d.leadsNow })}
            {d.missingPages.length > 0 && ` ${t('backups.health.missing', { pages: d.missingPages.join(', ') })}`}
          </div>
        </div>
      </div>
      <Link href="/admin/settings#backups" className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-[#fff] on-dark text-xs font-extrabold">{t('backups.banner.action')}</Link>
    </div>
  );
}
