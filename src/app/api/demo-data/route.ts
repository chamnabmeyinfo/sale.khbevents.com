import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { clearDemoData, scanDemoData } from '@/lib/storage';
import { parseClearRequest } from '@/lib/demo-data';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/** Admin → Settings & Security → Clear demo data. GET lists what would be removed. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    return NextResponse.json({ success: true, scan: await scanDemoData() });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not scan for demo data') }, { status: 500 });
  }
}

/** Deletes the chosen demo data. The body must carry confirm: "DELETE". */
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const request = parseClearRequest(await req.json().catch(() => null));
  if (!request) {
    return NextResponse.json({ success: false, error: 'Type DELETE to confirm.' }, { status: 400 });
  }
  try {
    const result = await clearDemoData(request);
    return NextResponse.json({ success: true, result, scan: await scanDemoData() });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not clear demo data') }, { status: 500 });
  }
}
