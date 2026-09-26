import { NextRequest, NextResponse } from 'next/server';
import { getPackBackup, getPageById, getPageHistory } from '@/lib/storage';
import { requireAdmin } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Earlier versions of a page, for the builder's Versions panel: the versions kept on each
 * save (newest first) and the copy kept before the last content pack. Restoring happens in
 * the editor (load a version, check it, Save), so nothing here writes.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const page = await getPageById(id);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  const [versions, packBackup] = await Promise.all([getPageHistory(id), getPackBackup(page.slug)]);
  return NextResponse.json({ versions, packBackup });
}
