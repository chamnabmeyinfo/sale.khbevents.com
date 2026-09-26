import { NextRequest, NextResponse } from 'next/server';
import { maybeSendDailySummary, runLeadResponseCheck, sendManagerMessage } from '@/lib/lead-followup';
import { maybeRunDailyAi } from '@/lib/ai-store';
import { maybeDailyBackup } from '@/lib/backups';
import { runAfterResponse } from '@/lib/after-response';
import { rateLimitByIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
// The daily AI campaign analysis runs after the answer and needs time.
export const maxDuration = 300;

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
    // Once a day the AI analyst reads the campaign report and sends the top actions.
    runAfterResponse(() => maybeRunDailyAi(sendManagerMessage));
    // Daily full backup (once per day); alerts the manager if data went missing.
    runAfterResponse(() => maybeDailyBackup());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Daily summary route error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
