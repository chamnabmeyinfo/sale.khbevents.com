'use client';

import { useCallback, useSyncExternalStore } from 'react';

/*
 * Hydration-safe access to browser-only values. The server (and the first
 * client render) sees the fallback; React then switches to the real browser
 * value without the extra render pass of a setState-in-useEffect.
 */

const STORAGE_EVENT = 'khb-local-storage';

function subscribeStorage(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * A localStorage-backed value restricted to `allowed`. `keys` are read in
 * order (first valid one wins); the setter writes all of them so aliases
 * stay in sync.
 */
export function useStoredChoice<T extends string>(
  keys: string | readonly string[],
  allowed: readonly T[],
  fallback: T
): [T, (value: T) => void] {
  const keyList = typeof keys === 'string' ? [keys] : keys;
  const keySig = keyList.join('\n');

  const stored = useSyncExternalStore(
    subscribeStorage,
    () => {
      for (const key of keySig.split('\n')) {
        const v = readStorage(key);
        if (v !== null && (allowed as readonly string[]).includes(v)) return v as T;
      }
      return null;
    },
    () => null
  );

  const setValue = useCallback(
    (value: T) => {
      try {
        for (const key of keySig.split('\n')) localStorage.setItem(key, value);
      } catch {
        // Storage may be unavailable (private mode); the value just won't persist.
      }
      window.dispatchEvent(new Event(STORAGE_EVENT));
    },
    [keySig]
  );

  return [stored ?? fallback, setValue];
}

function subscribeLocation(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  window.addEventListener('popstate', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener('popstate', onChange);
  };
}

/** The current URL hash without '#', or '' during server render. */
export function useLocationHash(): string {
  return useSyncExternalStore(
    subscribeLocation,
    () => window.location.hash.replace(/^#/, ''),
    () => ''
  );
}

/** Whether the OS prefers a dark colour scheme (`serverDefault` during SSR). */
export function usePrefersDark(serverDefault = true): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => serverDefault
  );
}

/** A query-string parameter from the current URL, or null during server render. */
export function useUrlParam(name: string): string | null {
  return useSyncExternalStore(
    subscribeLocation,
    () => new URLSearchParams(window.location.search).get(name),
    () => null
  );
}
