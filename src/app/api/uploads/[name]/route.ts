import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requireAdmin } from '@/lib/auth';
import { getMediaMeta, saveMediaMeta } from '@/lib/storage';
import { isUploadName, labelFor, withLabel } from '@/lib/media-library';
import { LOCAL_UPLOAD_DIR, deleteUpload, fileExists, usageOf } from '@/lib/upload-store';

/**
 * One photo in the library.
 *
 * GET serves images uploaded in local development from public/uploads (`next start`
 * only serves files that existed at build time). Production stores images in
 * Supabase Storage and never hits it.
 * PATCH { label } renames the photo in the library (the file and its URL stay the same).
 * DELETE removes the file. When pages or popups still show it, it answers 409 with
 * `usedBy` unless called with ?force=1.
 */

export const runtime = 'nodejs';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };

type Ctx = { params: Promise<{ name: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  const { name } = await context.params;
  if (!isUploadName(name)) return new NextResponse('Not found', { status: 404 });
  try {
    const bytes = await readFile(path.join(LOCAL_UPLOAD_DIR, name));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': TYPES[name.split('.').pop() as string] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}

export async function PATCH(req: NextRequest, context: Ctx) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { name } = await context.params;
  if (!isUploadName(name)) return NextResponse.json({ success: false, error: 'Unknown photo.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.label !== 'string') {
    return NextResponse.json({ success: false, error: 'Send the new name as "label".' }, { status: 400 });
  }
  try {
    if (!(await fileExists(name))) return NextResponse.json({ success: false, error: 'This photo no longer exists.' }, { status: 404 });
    const meta = await saveMediaMeta(withLabel(await getMediaMeta(), name, body.label));
    return NextResponse.json({ success: true, name, label: labelFor(name, meta) });
  } catch (error) {
    console.error('Rename upload error:', error);
    return NextResponse.json({ success: false, error: 'Could not rename the photo. Try again.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { name } = await context.params;
  if (!isUploadName(name)) return NextResponse.json({ success: false, error: 'Unknown photo.' }, { status: 404 });

  try {
    if (!(await fileExists(name))) return NextResponse.json({ success: true, name, alreadyGone: true });
    const usedBy = await usageOf(name);
    const force = req.nextUrl.searchParams.get('force') === '1';
    if (usedBy.length > 0 && !force) {
      return NextResponse.json(
        { success: false, error: 'This photo is still shown on a page or popup.', usedBy },
        { status: 409 },
      );
    }
    await deleteUpload(name);
    return NextResponse.json({ success: true, name });
  } catch (error) {
    console.error('Delete upload error:', error);
    return NextResponse.json({ success: false, error: 'Could not delete the photo. Try again.' }, { status: 500 });
  }
}
