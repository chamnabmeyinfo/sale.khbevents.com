import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPopupAdStats } from '@/lib/storage';
import { errorMessage } from '@/lib/errors';

/** Live per-popup counters (views, clicks, closes) for the admin page. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    return NextResponse.json({ success: true, stats: await getPopupAdStats() });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Failed to load popup stats') }, { status: 500 });
  }
}
