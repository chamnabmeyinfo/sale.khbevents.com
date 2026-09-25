/**
 * Photo library: rules shared by the upload API and the admin library.
 *
 * Uploaded files keep their storage name forever (it is part of the public URL
 * that pages store), so "rename" changes a display name kept beside the files,
 * never the file itself. Before a delete, the admin sees which pages and popups
 * still show the photo.
 *
 * Client-safe: no Node or Next imports.
 */

/** Names the upload route creates: `<time>-<random>-<slug>.<ext>`. */
export const UPLOAD_NAME = /^[a-z0-9][a-z0-9-]*\.(jpg|png|webp|gif|avif)$/;
export const MAX_LABEL = 80;
const MAX_ENTRIES = 2000;

export interface MediaMetaEntry {
  /** Display name chosen in the admin. */
  label: string;
}

/** Display names by storage file name. */
export type MediaMeta = Record<string, MediaMetaEntry>;

export interface MediaUsage {
  kind: 'page' | 'popup' | 'staff';
  id: string;
  title: string;
  /** Page web address, for pages. */
  slug?: string;
}

export interface MediaFile {
  name: string;
  url: string;
  createdAt?: string;
  /** Display name: the saved label, else a readable form of the file name. */
  label: string;
  usedBy: MediaUsage[];
}

export function isUploadName(name: unknown): name is string {
  return typeof name === 'string' && name.length <= 200 && UPLOAD_NAME.test(name);
}

/** Readable name from a storage name: drops the time and random prefix and the dashes. */
export function readableName(name: string): string {
  const base = name.replace(/\.[a-z0-9]+$/, '').replace(/^[a-z0-9]+-[a-f0-9]{8}-/, '');
  const words = base.replace(/-+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : name;
}

export function cleanLabel(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL) : '';
}

export function normalizeMediaMeta(input: unknown): MediaMeta {
  const out: MediaMeta = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  let count = 0;
  for (const [name, value] of Object.entries(input as Record<string, unknown>)) {
    if (!isUploadName(name) || !value || typeof value !== 'object') continue;
    const label = cleanLabel((value as Record<string, unknown>).label);
    if (!label) continue;
    out[name] = { label };
    if (++count >= MAX_ENTRIES) break;
  }
  return out;
}

export function labelFor(name: string, meta: MediaMeta): string {
  return meta[name]?.label || readableName(name);
}

/** Sets or clears (empty label) a display name; returns a new object. */
export function withLabel(meta: MediaMeta, name: string, label: unknown): MediaMeta {
  const next = { ...meta };
  const clean = cleanLabel(label);
  if (clean) next[name] = { label: clean };
  else delete next[name];
  return next;
}

export function withoutFile(meta: MediaMeta, name: string): MediaMeta {
  if (!(name in meta)) return meta;
  const next = { ...meta };
  delete next[name];
  return next;
}

interface UsageSource {
  id: string;
  title?: unknown;
  name?: unknown;
  slug?: string;
}

const text = (v: unknown): string => (typeof v === 'string' ? v : '');

/**
 * Pages and popups whose saved content contains the photo's URL. Matching on
 * the file name also catches the same photo stored under another host or path.
 */
export function findUsage(name: string, pages: UsageSource[], popups: UsageSource[], staff: UsageSource[] = []): MediaUsage[] {
  const used: MediaUsage[] = [];
  const contains = (item: unknown) => {
    try {
      return JSON.stringify(item).includes(name);
    } catch {
      return false;
    }
  };
  for (const p of pages) {
    if (contains(p)) used.push({ kind: 'page', id: p.id, title: text(p.title) || p.slug || p.id, slug: p.slug });
  }
  for (const a of popups) {
    if (contains(a)) used.push({ kind: 'popup', id: a.id, title: text(a.name) || a.id });
  }
  for (const s of staff) {
    if (contains(s)) used.push({ kind: 'staff', id: s.id, title: text(s.name) || s.id });
  }
  return used;
}

/** Library search: display name or file name, case-insensitive. */
export function matchesSearch(file: Pick<MediaFile, 'name' | 'label'>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return file.label.toLowerCase().includes(q) || file.name.toLowerCase().includes(q);
}
