import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { AiAnalystError } from '@/lib/ai-analyst';
import { analyzeLead, getLeadInsight, leadAiConfigured } from '@/lib/lead-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** The AI coach's stored verdict on this lead, and whether the coach is configured. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    return NextResponse.json({ success: true, insight: await getLeadInsight(id), configured: leadAiConfigured() });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not read the analysis') }, { status: 500 });
  }
}

/** Analyse now. Body: { lang?: 'en' | 'kh' }. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const lang = body.lang === 'kh' ? 'kh' : 'en';
    const insight = await analyzeLead(id, { lang, trigger: 'manual' });
    return NextResponse.json({ success: true, insight, configured: true });
  } catch (error) {
    if (error instanceof AiAnalystError) return NextResponse.json({ success: false, error: error.message, code: error.code, configured: leadAiConfigured() }, { status: error.code === 'no_key' ? 503 : 502 });
    return NextResponse.json({ success: false, error: errorMessage(error, 'The analysis failed') }, { status: 500 });
  }
}
