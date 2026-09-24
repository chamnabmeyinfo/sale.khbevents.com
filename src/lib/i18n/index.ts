/**
 * Portal-wide translations (admin, login, shared chrome). Client-safe: no Next
 * or Node imports.
 *
 * Keys are flat, namespaced strings ('nav.dashboard'). Each feature keeps its
 * own dictionary in ./dict/<feature>.ts exporting { en, kh }; they are merged
 * here. A missing Khmer string falls back to English, a missing key to the key
 * itself, so partial coverage never breaks a screen.
 */
import { common } from './dict/common';
import { nav } from './dict/nav';
import { login } from './dict/login';
import { dashboard } from './dict/dashboard';
import { pages } from './dict/pages';
import { leads } from './dict/leads';
import { settings } from './dict/settings';
import { roundRobin } from './dict/round-robin';
import { ads } from './dict/ads';
import { guide } from './dict/guide';
import { editor } from './dict/editor';
import { editorExtras } from './dict/editor-extras';
import { auth } from './dict/auth';

export type Lang = 'en' | 'kh';
export const LANGS: readonly Lang[] = ['en', 'kh'];
export type Dictionary = { en: Record<string, string>; kh: Record<string, string> };

const parts: Dictionary[] = [common, nav, login, dashboard, pages, leads, settings, roundRobin, ads, guide, editor, editorExtras, auth];

export const messages: Record<Lang, Record<string, string>> = {
  en: Object.assign({}, ...parts.map((p) => p.en)),
  kh: Object.assign({}, ...parts.map((p) => p.kh)),
};

export type Vars = Record<string, string | number>;

/** Translate a key with optional {placeholders}. */
export function translate(lang: Lang, key: string, vars?: Vars): string {
  const text = messages[lang][key] ?? messages.en[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export const isLang = (value: unknown): value is Lang => value === 'en' || value === 'kh';

/** Khmer UI font stack (loaded once in app/layout.tsx). */
export const KH_FONT = "'Kantumruy Pro', 'Hanuman', 'Plus Jakarta Sans', sans-serif";
