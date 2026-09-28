import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPageBySlug } from '@/lib/storage';
import { posterFacts } from '@/lib/ad-posters';

export const dynamic = 'force-dynamic';

/** Ad Poster Kit: the live facts of one page (price, early-bird date, seats, deadline) for its prompts. */
export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const slug = (new URL(req.url).searchParams.get('page') || '').trim().toLowerCase();
  const page = slug ? await getPageBySlug(slug) : null;
  if (!page) return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
  return NextResponse.json({ success: true, facts: posterFacts(page, Date.now()), nowMs: Date.now() });
}
