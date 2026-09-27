import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { listTelegramInbox } from '@/lib/telegram-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Telegram inbox: every customer who chats with the team on Telegram, newest activity first. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    return NextResponse.json({ success: true, chats: await listTelegramInbox() });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not load the inbox') }, { status: 500 });
  }
}
