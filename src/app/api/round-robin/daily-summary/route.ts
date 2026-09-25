import { NextRequest, NextResponse } from 'next/server';
import { maybeSendDailySummary, runLeadResponseCheck } from '@/lib/lead-followup';
import { rateLimitByIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Daily safety net (Vercel cron, see vercel.json): sends the manager's daily
 * summary if it has not gone out yet today and the chosen hour has passed, and
 * runs the lead follow-up check. It sends at most once a day, so extra calls
 * do nothing. When CRON_SECRET is set on the server, only calls carrying it
 * are accepted.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!rateLimitByIp('rr-summary', req.headers, 10, 60 * 1000).allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  try {
    await runLeadResponseCheck();
    await maybeSendDailySummary();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Daily summary route error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
