import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getCampaignReport } from '@/lib/campaign-store';

export const dynamic = 'force-dynamic';

const DAYS = [7, 14, 30, 60, 90];

/** The campaign report for the chosen period (and page). */
export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const sp = new URL(req.url).searchParams;
  const days = DAYS.includes(Number(sp.get('days'))) ? Number(sp.get('days')) : 30;
  const page = sp.get('page') || undefined;
  const { report, pages } = await getCampaignReport(days, page && /^[a-z0-9-_]{1,200}$/.test(page) ? page : undefined);
  return NextResponse.json({ success: true, report, pages });
}
