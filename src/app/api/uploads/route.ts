import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';
import { LOCAL_UPLOAD_DIR, listLibrary, uploadStorage } from '@/lib/upload-store';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, UPLOAD_BUCKET, isAllowedImageType, safeUploadName } from '@/lib/uploads';

/**
 * Admin image uploads for landing pages.
 *
 * POST multipart/form-data { file } → { url }. Files go to the public Supabase Storage
 * bucket `page-images` (created on first use). Without Supabase, local development
 * writes to public/uploads and serves them through /api/uploads/[name].
 *
 * GET → { files: [{ url, name, createdAt, label, usedBy }] } the photo library, newest first.
 * Rename and delete: /api/uploads/[name].
 */

export const runtime = 'nodejs';

const LOCAL_DIR = LOCAL_UPLOAD_DIR;
const storageReady = uploadStorage;

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
    return NextResponse.json({ success: true, files: await listLibrary() });
  } catch (error) {
    console.error('Upload list error:', error);
    return NextResponse.json({ success: false, error: 'Could not list uploads.' }, { status: 500 });
  }
}
