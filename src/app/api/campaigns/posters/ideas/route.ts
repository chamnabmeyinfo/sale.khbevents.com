import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPageBySlug } from '@/lib/storage';
import { POSTER_GOALS, goalBlocked, posterFacts, type PosterGoal } from '@/lib/ad-posters';
import { suggestPosterIdeas } from '@/lib/ai-poster-ideas';
import { AiAnalystError } from '@/lib/ai-analyst';
import { rateLimitByIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Ad Poster Kit → AI headline ideas. Body: { page, goal }. */
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  // Each run costs money: a few per minute at most.
  if (!rateLimitByIp('poster-ideas', req.headers, 6, 60 * 1000).allowed) {
    return NextResponse.json({ success: false, error: 'Please wait a minute before asking again.' }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = typeof body.page === 'string' ? body.page.trim().toLowerCase() : '';
  const goal = POSTER_GOALS.includes(body.goal as PosterGoal) ? (body.goal as PosterGoal) : 'launch';
  const page = slug ? await getPageBySlug(slug) : null;
  if (!page) return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
  const facts = posterFacts(page, Date.now());
  if (goalBlocked(goal, facts)) return NextResponse.json({ success: false, error: 'This goal does not fit the page right now.' }, { status: 400 });
  try {
    const ideas = await suggestPosterIdeas(facts, goal, (page.description || '').slice(0, 600));
    return NextResponse.json({ success: true, ideas });
  } catch (err) {
    const noKey = err instanceof AiAnalystError && err.code === 'no_key';
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'The AI request failed', code: noKey ? 'no_key' : 'failed' }, { status: noKey ? 503 : 502 });
  }
}
