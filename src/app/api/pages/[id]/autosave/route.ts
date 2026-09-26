import { NextRequest, NextResponse } from 'next/server';
import { getPageById, saveAutosave } from '@/lib/storage';
import { requireAdmin } from '@/lib/auth';
import type { LandingPage } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Stores the editor's current state as a backup copy. The live page is not changed. */
export async function POST(req: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const page = body?.page as LandingPage | undefined;
  if (!page || typeof page !== 'object' || !page.builder) return NextResponse.json({ error: 'Nothing to back up' }, { status: 400 });
  if (JSON.stringify(page).length > 2_000_000) return NextResponse.json({ error: 'Too large' }, { status: 413 });
  const stored = await getPageById(id).catch(() => null);
  if (!stored) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  const savedAt = await saveAutosave(id, { ...page, id, slug: stored.slug });
  return NextResponse.json({ savedAt });
}
