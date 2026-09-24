import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { UPLOAD_BUCKET } from './uploads';
import { findUsage, isUploadName, labelFor, withoutFile, type MediaFile } from './media-library';
import { getMediaMeta, getPages, getPopupAds, saveMediaMeta } from './storage';

/**
 * Server side of the photo library: where uploaded files live and how to list
 * and delete them. Supabase Storage in production, public/uploads locally.
 */

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/** The anon key cannot write to storage, so only a service-role client counts. */
export function uploadStorage(): SupabaseClient | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabase() : null;
}

interface StoredFile {
  name: string;
  url: string;
  createdAt?: string;
}

async function listStored(): Promise<StoredFile[]> {
  const supabase = uploadStorage();
  if (supabase) {
    const { data: bucket } = await supabase.storage.getBucket(UPLOAD_BUCKET);
    if (!bucket) return [];
    const { data, error } = await supabase.storage
      .from(UPLOAD_BUCKET)
      .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) throw error;
    return (data || [])
      .filter((f) => f.name && !f.name.startsWith('.'))
      .map((f) => ({
        name: f.name,
        url: supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(f.name).data.publicUrl,
        createdAt: f.created_at || undefined,
      }));
  }
  const names = await readdir(LOCAL_UPLOAD_DIR).catch(() => [] as string[]);
  const files = await Promise.all(
    names
      .filter((n) => !n.startsWith('.'))
      .map(async (n) => ({ name: n, url: `/api/uploads/${n}`, createdAt: (await stat(path.join(LOCAL_UPLOAD_DIR, n))).mtime.toISOString() })),
  );
  return files.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

async function usageSources() {
  const [pages, popups] = await Promise.all([getPages(), getPopupAds(true)]);
  return { pages, popups: popups.ads };
}

/** Every uploaded photo, newest first, with its display name and where it is shown. */
export async function listLibrary(): Promise<MediaFile[]> {
  const [stored, meta, sources] = await Promise.all([listStored(), getMediaMeta(), usageSources()]);
  return stored.map((f) => ({
    ...f,
    label: labelFor(f.name, meta),
    usedBy: isUploadName(f.name) ? findUsage(f.name, sources.pages, sources.popups) : [],
  }));
}

export async function usageOf(name: string) {
  const sources = await usageSources();
  return findUsage(name, sources.pages, sources.popups);
}

export async function fileExists(name: string): Promise<boolean> {
  const supabase = uploadStorage();
  if (supabase) {
    const { data, error } = await supabase.storage.from(UPLOAD_BUCKET).list('', { search: name, limit: 5 });
    if (error) throw error;
    return (data || []).some((f) => f.name === name);
  }
  return stat(path.join(LOCAL_UPLOAD_DIR, name)).then(() => true, () => false);
}

/** Deletes the file and its display name. */
export async function deleteUpload(name: string): Promise<void> {
  const supabase = uploadStorage();
  if (supabase) {
    const { error } = await supabase.storage.from(UPLOAD_BUCKET).remove([name]);
    if (error) throw error;
  } else if (process.env.VERCEL) {
    throw new Error('Image storage is not configured: set SUPABASE_SERVICE_ROLE_KEY.');
  } else {
    await unlink(path.join(LOCAL_UPLOAD_DIR, name));
  }
  const meta = await getMediaMeta();
  const next = withoutFile(meta, name);
  if (next !== meta) await saveMediaMeta(next);
}
