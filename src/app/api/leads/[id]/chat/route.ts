import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { AccountBusyError, ChatNotFoundError, FloodBlockedError, readLeadConversation, SendPaceError, sendLeadMessage } from '@/lib/telegram-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** A whole number from the query string, or undefined. */
function intParam(url: URL, key: string): number | undefined {
  const raw = url.searchParams.get(key);
  if (raw === null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

/**
 * The live Telegram conversation behind a chat lead, read through the
 * salesperson's connected account. Admin only; the lead keeps only the numbers.
 *
 * Query: `since` (the latest message id the browser has) and `unread` (the count it
 * saw) make an unchanged chat cheap: the answer then carries no messages and
 * `unchanged: true`. `view=1` says a person is looking (for Auto seen).
 * The answer is always 200 with `conversation.live` saying how it went:
 * ok, busy (another request holds the account), flood (Telegram asked to wait),
 * not_connected, or error.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const conversation = await readLeadConversation(id, {
      since: intParam(url, 'since'),
      unread: intParam(url, 'unread'),
      viewing: url.searchParams.get('view') === '1',
    });
    if (!conversation) return NextResponse.json({ success: false, error: 'Not a Telegram chat lead' }, { status: 404 });
    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not read the chat') }, { status: 500 });
  }
}

/**
 * A reply to the customer, sent from the salesperson's connected account. Body: { text, by }.
 * 409 when another request holds the account (retryInMs), 429 when sending too fast
 * or while Telegram asked the account to wait (retryInMs, floodUntil).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const by = typeof body.by === 'string' && body.by.trim() ? body.by.trim().slice(0, 60) : 'Admin';
    const conversation = await sendLeadMessage(id, String(body.text || ''), by);
    if (!conversation) return NextResponse.json({ success: false, error: 'Not a Telegram chat lead' }, { status: 404 });
    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    if (error instanceof ChatNotFoundError) return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    if (error instanceof AccountBusyError) return NextResponse.json({ success: false, error: error.message, retryInMs: error.retryInMs }, { status: 409 });
    if (error instanceof SendPaceError) return NextResponse.json({ success: false, error: error.message, retryInMs: error.retryInMs }, { status: 429 });
    if (error instanceof FloodBlockedError) return NextResponse.json({ success: false, error: error.message, retryInMs: error.retryInMs, floodUntil: error.floodUntil }, { status: 429 });
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not send the message') }, { status: 400 });
  }
}
