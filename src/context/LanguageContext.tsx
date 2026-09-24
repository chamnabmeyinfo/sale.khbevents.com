'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useStoredChoice } from '@/lib/use-browser-state';
import { LANGS, translate, type Lang, type Vars } from '@/lib/i18n';

/**
 * The portal's UI language (English / Khmer). Stored per browser under
 * 'khb_admin_lang' (with 'khb_lang' as an alias shared with the public site),
 * applied to <html lang> and as the `lang-kh` class that switches the UI font.
 */
interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Vars) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useStoredChoice<Lang>(['khb_admin_lang', 'khb_lang'], LANGS, 'en');

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang === 'kh' ? 'km' : 'en';
    root.classList.toggle('lang-kh', lang === 'kh');
    return () => {
      root.classList.remove('lang-kh');
    };
  }, [lang]);

  const t = useCallback((key: string, vars?: Vars) => translate(lang, key, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Current language and translator. Outside a provider it is English. */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  return ctx ?? { lang: 'en', setLang: () => {}, t: (key, vars) => translate('en', key, vars) };
}

export const useT = () => useLanguage().t;
