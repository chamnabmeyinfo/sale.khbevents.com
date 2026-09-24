import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPopupAds, getPopupAdStats, savePopupAds } from '@/lib/storage';
import { errorMessage } from '@/lib/errors';

/**
 * Admin → Ads & Popups. GET returns the saved popups with their counters;
 * PUT replaces the whole state (the editor always sends everything).
 */

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const [state, stats] = await Promise.all([getPopupAds(true), getPopupAdStats()]);
    return NextResponse.json({ success: true, state, stats });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Failed to load popups') }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const body = await req.json().catch(() => null);
    const input = body && typeof body === 'object' ? (body as { state?: unknown }).state ?? body : null;
    if (!input || typeof input !== 'object') {
      return NextResponse.json({ success: false, error: 'Send { state: { settings, ads } }' }, { status: 400 });
    }
    const state = await savePopupAds(input);
    return NextResponse.json({ success: true, state });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Failed to save popups') }, { status: 500 });
  }
}
