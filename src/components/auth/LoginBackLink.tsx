'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

/** "Back to KHB Home" link on the client /login page (translated). */
export function LoginBackLink() {
  const { t } = useLanguage();
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{t('auth.backHome')}</span>
    </Link>
  );
}
