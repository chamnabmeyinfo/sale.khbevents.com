import { NextRequest, NextResponse } from 'next/server';
import { loadSnapshot, restoreSnapshot, type RestoreRequest } from '@/lib/backups';
import { requireAdmin } from '@/lib/auth';
import { reloadLocalDatabase, undeletePages } from '@/lib/storage';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ name: string }>;
}

/** Downloads one snapshot as a JSON file (the name is "<kind>/<file>", URL-encoded). */
export async function GET(_req: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { name } = await context.params;
  const snapshot = await loadSnapshot(decodeURIComponent(name)).catch(() => null);
  if (!snapshot) return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
  const file = `khb-backup-${snapshot.takenAt.replace(/[:.]/g, '-')}.json`;
  return new NextResponse(JSON.stringify(snapshot), {
    headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${file}"`, 'Cache-Control': 'no-store' },
  });
}

/** Restores from one snapshot. The word RESTORE must be typed; a backup is taken first. */
export async function POST(req: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { name } = await context.params;
  const body = await req.json().catch(() => ({}));
  if (body.confirm !== 'RESTORE') return NextResponse.json({ success: false, error: 'Type RESTORE to confirm.' }, { status: 400 });
  const request: RestoreRequest = {
    parts: { pages: body.parts?.pages === true, leads: body.parts?.leads === true, settings: body.parts?.settings === true },
    mode: body.mode === 'overwrite' ? 'overwrite' : 'add-missing',
  };
  if (!request.parts.pages && !request.parts.leads && !request.parts.settings) return NextResponse.json({ success: false, error: 'Choose what to restore.' }, { status: 400 });
  try {
    const result = await restoreSnapshot(decodeURIComponent(name), request);
    // The restore wrote the local file directly: drop the in-memory copy before touching it again.
    reloadLocalDatabase();
    // A page that had been deleted is marked as such in a separate list; restoring it must clear that mark.
    await undeletePages(result.restoredPages);
    // Restored rows must show at once: drop the cached reads.
    for (const tag of ['pages', 'settings', 'popup-ads']) revalidateTag(tag, { expire: 0 });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Restore failed' }, { status: 500 });
  }
}
