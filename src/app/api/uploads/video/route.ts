import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';
import { uploadStorage } from '@/lib/upload-store';
import { ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES, VIDEO_BUCKET, isAllowedVideoType, safeVideoName } from '@/lib/uploads';

/**
 * Background video uploads (admin only).
 *
 * POST JSON { name, type, size } → with Supabase Storage: a signed upload URL the
 * browser uses to send the file straight to the `page-videos` bucket (Vercel's
 * 4.5 MB body limit does not apply): { mode: 'signed', bucket, path, token, url }.
 * Without storage in local development: { mode: 'local' }, then
 * POST multipart/form-data { file } stores it in public/uploads-video and returns { url }.
 */

export const runtime = 'nodejs';

const LOCAL_VIDEO_DIR = path.join(process.cwd(), 'public', 'uploads-video');
const MB = Math.round(MAX_VIDEO_BYTES / 1024 / 1024);

async function ensureVideoBucket(supabase: SupabaseClient): Promise<void> {
  const { data } = await supabase.storage.getBucket(VIDEO_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(VIDEO_BUCKET, {
    public: true,
    fileSizeLimit: MAX_VIDEO_BYTES,
    allowedMimeTypes: ALLOWED_VIDEO_TYPES,
  });
  if (error && !/already exists/i.test(error.message)) throw error;
}

const bad = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status });

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const isForm = (req.headers.get('content-type') || '').includes('multipart/form-data');
  const supabase = uploadStorage();

  if (!isForm) {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.name !== 'string') return bad('Send the video name, type and size.');
    if (!isAllowedVideoType(body.type)) return bad('Only MP4, WebM or MOV videos are accepted.', 415);
    if (typeof body.size !== 'number' || body.size <= 0 || body.size > MAX_VIDEO_BYTES) return bad(`Videos must be under ${MB} MB. Shorten or compress the clip.`, 413);
    if (!supabase) {
      if (process.env.VERCEL) return bad('Video storage is not configured: set SUPABASE_SERVICE_ROLE_KEY.', 503);
      return NextResponse.json({ success: true, mode: 'local' });
    }
    try {
      await ensureVideoBucket(supabase);
      const name = safeVideoName(body.name, body.type);
      const { data, error } = await supabase.storage.from(VIDEO_BUCKET).createSignedUploadUrl(name);
      if (error || !data) throw error || new Error('No upload URL');
      const url = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(name).data.publicUrl;
      return NextResponse.json({ success: true, mode: 'signed', bucket: VIDEO_BUCKET, path: data.path, token: data.token, url });
    } catch (error) {
      console.error('Video upload URL error:', error);
      return bad('Could not start the upload. Try again.', 500);
    }
  }

  // Local development only: the file comes through this route.
  if (supabase || process.env.VERCEL) return bad('Upload the video with a signed upload URL.', 400);
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return bad('Send the video as the "file" field.');
  if (!isAllowedVideoType(file.type)) return bad('Only MP4, WebM or MOV videos are accepted.', 415);
  if (file.size > MAX_VIDEO_BYTES) return bad(`Videos must be under ${MB} MB. Shorten or compress the clip.`, 413);
  const name = safeVideoName(file.name, file.type);
  await mkdir(LOCAL_VIDEO_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_VIDEO_DIR, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ success: true, url: `/api/uploads/video/${name}` });
}
