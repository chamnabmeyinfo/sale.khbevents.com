import { NextRequest, NextResponse } from 'next/server';
import { open, stat } from 'node:fs/promises';
import path from 'node:path';
import { VIDEO_NAME } from '@/lib/uploads';

/**
 * Serves background videos uploaded in local development from public/uploads-video,
 * with byte ranges (Safari needs them to play video). Production stores videos in
 * Supabase Storage and never hits this route.
 */

export const runtime = 'nodejs';

const LOCAL_VIDEO_DIR = path.join(process.cwd(), 'public', 'uploads-video');
const TYPES: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };

export async function GET(req: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!VIDEO_NAME.test(name)) return new NextResponse('Not found', { status: 404 });
  const file = path.join(LOCAL_VIDEO_DIR, name);
  const info = await stat(file).catch(() => null);
  if (!info) return new NextResponse('Not found', { status: 404 });

  const size = info.size;
  const type = TYPES[name.split('.').pop() as string];
  const range = req.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
  let start = 0;
  let end = size - 1;
  if (range) {
    start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
  }
  const length = end - start + 1;
  const handle = await open(file, 'r');
  try {
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, start);
    return new NextResponse(new Uint8Array(buffer), {
      status: range ? 206 : 200,
      headers: {
        'Content-Type': type,
        'Content-Length': String(length),
        'Accept-Ranges': 'bytes',
        ...(range ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } finally {
    await handle.close();
  }
}
