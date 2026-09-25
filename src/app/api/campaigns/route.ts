import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { deleteCampaign, getCampaigns, upsertCampaign } from '@/lib/campaign-store';

export const dynamic = 'force-dynamic';

/** Campaigns (Admin → Campaigns): list, create or update, delete. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  return NextResponse.json({ success: true, campaigns: await getCampaigns() });
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const body = await req.json().catch(() => null);
  const campaign = await upsertCampaign(body?.campaign);
  if (!campaign) return NextResponse.json({ success: false, error: 'A campaign needs a name and a page.' }, { status: 400 });
  return NextResponse.json({ success: true, campaign, campaigns: await getCampaigns() });
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const id = new URL(req.url).searchParams.get('id') || '';
  const ok = await deleteCampaign(id);
  return NextResponse.json({ success: ok, campaigns: await getCampaigns() }, { status: ok ? 200 : 404 });
}
