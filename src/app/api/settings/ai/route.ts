import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { AI_PROVIDERS, aiKeyShapeError, aiKeyStatuses, saveAiKey, testAiKey, type AiProvider } from '@/lib/ai-keys';
import { rateLimitByIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Which AI keys are set and where from (never the keys themselves). */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  return NextResponse.json({ success: true, keys: await aiKeyStatuses() });
}

/**
 * { provider, action: 'save', key } checks the key, then saves it;
 * { provider, action: 'remove' } removes the saved key (the Vercel variable, if any, applies again);
 * { provider, action: 'test' } checks the key in use.
 */
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  if (!rateLimitByIp('ai-keys', req.headers, 20, 60 * 1000).allowed) {
    return NextResponse.json({ success: false, error: 'Too many attempts. Wait a minute.' }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const provider = body.provider as AiProvider;
  if (!AI_PROVIDERS.includes(provider)) return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 400 });

  if (body.action === 'remove') {
    await saveAiKey(provider, null);
    return NextResponse.json({ success: true, keys: await aiKeyStatuses() });
  }
  if (body.action === 'test') {
    const result = await testAiKey(provider);
    return NextResponse.json({ success: result.ok, message: result.message, keys: await aiKeyStatuses() });
  }
  if (body.action === 'save') {
    const key = typeof body.key === 'string' ? body.key.trim() : '';
    const shape = aiKeyShapeError(provider, key);
    if (shape) return NextResponse.json({ success: false, error: shape }, { status: 400 });
    // Only a key the service accepts is saved, so a typo never switches the AI off.
    const result = await testAiKey(provider, key);
    if (!result.ok) return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    await saveAiKey(provider, key);
    return NextResponse.json({ success: true, message: result.message, keys: await aiKeyStatuses() });
  }
  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
}
