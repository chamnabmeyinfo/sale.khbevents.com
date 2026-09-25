import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { AiAnalystError, aiConfigured } from '@/lib/ai-analyst';
import { getAiHistory, getAiSettings, getLatestAiReport, runAndStoreAiReport, saveAiSettings } from '@/lib/ai-store';
import { rateLimitByIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
// The analysis reads the whole report and thinks before answering: allow time.
export const maxDuration = 300;

const DAYS = [7, 14, 30, 60, 90];

/** Latest AI analysis, history and settings. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const [latest, history, settings] = await Promise.all([getLatestAiReport(), getAiHistory(), getAiSettings()]);
  return NextResponse.json({ success: true, configured: aiConfigured(), latest, history, settings });
}

/** { action: 'run', days, lang, page } runs a new analysis; { action: 'settings', settings } saves settings. */
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const body = await req.json().catch(() => ({}));
  if (body?.action === 'settings') {
    return NextResponse.json({ success: true, settings: await saveAiSettings(body.settings) });
  }
  // Each run costs money: a few per minute at most.
  if (!rateLimitByIp('ai-analyst', req.headers, 3, 60 * 1000).allowed) {
    return NextResponse.json({ success: false, error: 'Please wait a minute before running the analysis again.' }, { status: 429 });
  }
  const days = DAYS.includes(Number(body?.days)) ? Number(body.days) : 14;
  const lang = body?.lang === 'en' ? 'en' : 'kh';
  const page = typeof body?.page === 'string' && /^[a-z0-9-_]{1,200}$/.test(body.page) ? body.page : undefined;
  try {
    const latest = await runAndStoreAiReport({ days, lang, pageSlug: page, trigger: 'manual' });
    return NextResponse.json({ success: true, latest, history: await getAiHistory() });
  } catch (err) {
    const status = err instanceof AiAnalystError && err.code === 'no_key' ? 503 : 502;
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'AI analysis failed' }, { status });
  }
}
