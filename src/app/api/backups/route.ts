import { NextRequest, NextResponse } from 'next/server';
import { dataHealth, listBackups, takeSnapshot } from '@/lib/backups';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** The backup list and the data health check (current counts against the last snapshot). */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const [backups, health] = await Promise.all([listBackups(), dataHealth()]);
    return NextResponse.json({ success: true, backups, health });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Could not read the backups' }, { status: 500 });
  }
}

/** "Back up now". */
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const body = await req.json().catch(() => ({}));
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 60) : 'manual';
  try {
    const entry = await takeSnapshot('manual', label);
    return NextResponse.json({ success: true, entry });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Backup failed' }, { status: 500 });
  }
}
