import { NextRequest, NextResponse } from 'next/server';
import { runLeadResponseCheck } from '@/lib/lead-followup';
import { rateLimitByIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Runs the lead follow-up check (hand-over of unanswered leads). Safe to call
 * from anywhere: it only acts on leads that are already overdue and runs at
 * most once a minute. Point a free scheduler (for example cron-job.org) at
 * https://sale.khbevents.com/api/round-robin/tick every 2–5 minutes for exact
 * timing; without it the check still runs on normal site traffic.
 */
export async function GET(req: NextRequest) {
  if (!rateLimitByIp('rr-tick', req.headers, 30, 60 * 1000).allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  try {
    await runLeadResponseCheck();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Round robin tick error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
