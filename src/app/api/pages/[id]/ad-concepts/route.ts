import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPageById } from '@/lib/storage';
import { POSTER_GOALS, type PosterGoal } from '@/lib/ad-posters';
import { adPackageView, ensureAdCampaigns, generateAdPackage, restorePreviousAdPackage } from '@/lib/gen-ads';
import { AiAnalystError } from '@/lib/ai-text';
import { rateLimitByIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Gen Ads: the stored package of a page with its flags and the page's live facts (no AI call). */
export async function GET(_req: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const page = await getPageById(id);
  if (!page) return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
  return NextResponse.json({ success: true, view: await adPackageView(page) });
}

/**
 * { action: 'generate', goal?: 'auto' | PosterGoal, notes?, direction? } runs the AI (one paid call);
 * { action: 'restore' } puts the previous package back;
 * { action: 'links' } creates or completes the page's tracked-link campaigns (one per channel, one ad version per concept).
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const page = await getPageById(id);
  if (!page) return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = body.action;

  if (action === 'links') {
    if (!rateLimitByIp('gen-ads-links', req.headers, 20, 60 * 1000).allowed) return NextResponse.json({ success: false, error: 'Too many attempts. Wait a minute.' }, { status: 429 });
    await ensureAdCampaigns(page);
    return NextResponse.json({ success: true, view: await adPackageView(page) });
  }
  if (action === 'restore') {
    const restored = await restorePreviousAdPackage(page.slug);
    if (!restored) return NextResponse.json({ success: false, error: 'There is no previous version.' }, { status: 404 });
    return NextResponse.json({ success: true, view: await adPackageView(page) });
  }
  if (action === 'generate') {
    // Each run is a paid AI call: a few per ten minutes at most.
    if (!rateLimitByIp('gen-ads', req.headers, 6, 10 * 60 * 1000).allowed) {
      return NextResponse.json({ success: false, error: 'Please wait a few minutes before generating again.' }, { status: 429 });
    }
    const goal = body.goal === 'auto' || POSTER_GOALS.includes(body.goal as PosterGoal) ? (body.goal as PosterGoal | 'auto') : 'auto';
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 1500) : '';
    const direction = typeof body.direction === 'string' ? body.direction.trim().slice(0, 300) : '';
    try {
      const fresh = await generateAdPackage(page, { goal, notes, direction });
      return NextResponse.json({ success: true, view: await adPackageView(page, Date.now(), fresh) });
    } catch (err) {
      const code = err instanceof AiAnalystError ? err.code : (err as { code?: string })?.code || 'failed';
      return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'The AI request failed', code }, { status: code === 'no_key' ? 503 : code === 'busy' ? 409 : 502 });
    }
  }
  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
}
