import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { conversionTokens } from '@/lib/conversions';
import { getConversionLog, getConversionSettings, saveConversionSettings } from '@/lib/conversions-server';
import { getPages } from '@/lib/storage';
import { aiConfigured } from '@/lib/ai-analyst';

export const dynamic = 'force-dynamic';

/** Tracking setup: which tokens are set (never their values), pixels per page, test codes, recent sends. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const [pages, settings, log] = await Promise.all([getPages(), getConversionSettings(), getConversionLog()]);
  return NextResponse.json({
    success: true,
    tokens: { ...conversionTokens(), anthropic: aiConfigured() },
    settings,
    log,
    pixels: pages.filter((p) => p.status !== 'archived').map((p) => ({
      slug: p.slug,
      title: p.title,
      meta: p.tracking?.facebookPixelId && p.tracking.facebookPixelEnabled !== false ? p.tracking.facebookPixelId : '',
      tiktok: p.tracking?.tiktokPixelId && p.tracking.tiktokPixelEnabled !== false ? p.tracking.tiktokPixelId : '',
      id: p.id,
    })),
  });
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const body = await req.json().catch(() => null);
  return NextResponse.json({ success: true, settings: await saveConversionSettings(body?.settings) });
}
