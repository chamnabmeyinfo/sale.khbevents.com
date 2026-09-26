import type { LandingPage } from './types';

export interface PageVersion { savedAt: string; page: LandingPage }

/** Auto-saved editor states: one per couple of minutes, last 20. */
export const AUTOSAVE_LIMIT = 20;
export const AUTOSAVE_GAP_MS = 2 * 60_000;

/**
 * Adds a snapshot to the list (newest first). Within AUTOSAVE_GAP_MS of the newest one it
 * replaces it, so a long editing session leaves a trail of snapshots rather than hundreds
 * of near-identical copies.
 */
export function withSnapshot(list: PageVersion[], entry: PageVersion, nowMs: number, opts: { gapMs?: number; limit?: number } = {}): PageVersion[] {
  const gap = opts.gapMs ?? AUTOSAVE_GAP_MS;
  const limit = opts.limit ?? AUTOSAVE_LIMIT;
  const recent = list[0] && nowMs - Date.parse(list[0].savedAt) < gap;
  return [entry, ...(recent ? list.slice(1) : list)].slice(0, limit);
}
