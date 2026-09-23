'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useStoredChoice, usePrefersDark } from '@/lib/use-browser-state';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'khb-portal-theme';

const THEME_MODES = ['light', 'dark', 'system'] as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The inline script in app/layout.tsx applies the saved theme before first
  // paint; this keeps React's view of it in sync afterwards.
  const [theme, setTheme] = useStoredChoice<ThemeMode>(THEME_STORAGE_KEY, THEME_MODES, 'system');
  const prefersDark = usePrefersDark();
  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    // Read the live preference rather than `resolvedTheme`: during hydration the
    // render still holds the server placeholder, and applying that would flash.
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {}
    const mode = (THEME_MODES as readonly string[]).includes(saved ?? '') ? saved : 'system';
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
