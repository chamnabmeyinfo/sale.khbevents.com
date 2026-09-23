import { NextRequest, NextResponse } from 'next/server';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, UPLOAD_BUCKET, isAllowedImageType, safeUploadName } from '@/lib/uploads';

/**
 * Admin image uploads for landing pages.
 *
 * POST multipart/form-data { file } → { url }. Files go to the public Supabase Storage
 * bucket `page-images` (created on first use). Without Supabase, local development
 * writes to public/uploads and serves them through /api/uploads/[name].
 *
 * GET → { files: [{ url, name, createdAt }] } the library of uploaded images, newest first.
 */

export const runtime = 'nodejs';

const LOCAL_DIR = path.join(process.cwd(), 'public', 'uploads');

function storageReady(): SupabaseClient | null {
  // The anon key cannot write to storage, so only a service-role client counts.
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabase() : null;
}

async function ensureBucket(supabase: SupabaseClient): Promise<void> {
  const { data } = await supabase.storage.getBucket(UPLOAD_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(UPLOAD_BUCKET, {
    public: true,
    fileSizeLimit: MAX_UPLOAD_BYTES,
    allowedMimeTypes: ALLOWED_IMAGE_TYPES,
  });
  if (error && !/already exists/i.test(error.message)) throw error;
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'Send the image as the "file" field.' }, { status: 400 });
  }
  if (!isAllowedImageType(file.type)) {
    return NextResponse.json({ success: false, error: 'Only JPEG, PNG, WebP, GIF or AVIF images are accepted.' }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ success: false, error: `Images must be under ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.` }, { status: 413 });
  }

  const name = safeUploadName(file.name, file.type);
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const supabase = storageReady();
    if (supabase) {
      await ensureBucket(supabase);
      const { error } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(name, bytes, { contentType: file.type, cacheControl: '31536000', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(name);
      return NextResponse.json({ success: true, url: data.publicUrl, name });
    }

    if (process.env.VERCEL) {
      return NextResponse.json(
        { success: false, error: 'Image storage is not configured: set SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 503 },
      );
    }

    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_DIR, name), bytes);
    // Served by app/api/uploads/[name]: `next start` does not pick up files added to public/ after the build.
    return NextResponse.json({ success: true, url: `/api/uploads/${name}`, name });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed. Try again.' }, { status: 500 });
  }
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const supabase = storageReady();
    if (supabase) {
      const { data: bucket } = await supabase.storage.getBucket(UPLOAD_BUCKET);
      if (!bucket) return NextResponse.json({ success: true, files: [] });
      const { data, error } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      const files = (data || [])
        .filter(f => f.name && !f.name.startsWith('.'))
        .map(f => ({
          name: f.name,
          url: supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(f.name).data.publicUrl,
          createdAt: f.created_at,
        }));
      return NextResponse.json({ success: true, files });
    }

    const names = await readdir(LOCAL_DIR).catch(() => [] as string[]);
    const files = await Promise.all(
      names
        .filter(n => !n.startsWith('.'))
        .map(async n => ({ name: n, url: `/api/uploads/${n}`, createdAt: (await stat(path.join(LOCAL_DIR, n))).mtime.toISOString() })),
    );
    files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error('Upload list error:', error);
    return NextResponse.json({ success: false, error: 'Could not list uploads.' }, { status: 500 });
  }
}
