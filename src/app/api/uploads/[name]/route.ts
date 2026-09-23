import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Serves images uploaded in local development from public/uploads. `next start` only
 * serves files that existed at build time, so uploads made afterwards need this route.
 * Production stores images in Supabase Storage and never hits it.
 */

export const runtime = 'nodejs';

const LOCAL_DIR = path.join(process.cwd(), 'public', 'uploads');
const SAFE_NAME = /^[a-z0-9][a-z0-9-]*\.(jpg|png|webp|gif|avif)$/;
const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };

export async function GET(_req: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!SAFE_NAME.test(name)) return new NextResponse('Not found', { status: 404 });
  try {
    const bytes = await readFile(path.join(LOCAL_DIR, name));
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
