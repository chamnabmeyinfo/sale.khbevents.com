'use client';

import React from 'react';
import FlagIcon from '@/components/common/FlagIcon';
import { useLanguage } from '@/context/LanguageContext';

/** EN / ខ្មែរ toggle for the portal UI language. */
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <div className={`lang-switcher ${className}`.trim()} role="group" aria-label={t('common.language')}>
      <button type="button" className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')} title={t('shell.langEnglish')} aria-pressed={lang === 'en'}>
        <span className="lang-flag" aria-hidden="true"><FlagIcon country="en" width={18} height={12} /></span>
        <span>EN</span>
      </button>
      <button type="button" className={`lang-btn${lang === 'kh' ? ' active' : ''}`} onClick={() => setLang('kh')} title={t('shell.langKhmer')} aria-pressed={lang === 'kh'}>
        <span className="lang-flag" aria-hidden="true"><FlagIcon country="kh" width={18} height={12} /></span>
        <span>ខ្មែរ</span>
      </button>
    </div>
  );
}
