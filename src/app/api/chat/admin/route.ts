import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { checkAllAccountsWithin, INBOX_CHECK_EVERY_MS, listTelegramInbox } from '@/lib/telegram-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Telegram inbox: every customer who chats with the team on Telegram, newest activity first.
 * While the inbox is open (it asks every 10 s), the connected accounts are also checked for
 * new chats every 30 s, so a customer's first message appears here within about half a minute.
 * The check is capped so the list never waits long.
 */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    await checkAllAccountsWithin(8_000, { everyMs: INBOX_CHECK_EVERY_MS });
    return NextResponse.json({ success: true, chats: await listTelegramInbox() });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not load the inbox') }, { status: 500 });
  }
}
