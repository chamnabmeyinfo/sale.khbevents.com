import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { readLeadConversation, sendLeadMessage } from '@/lib/telegram-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * The live Telegram conversation behind a chat lead, read through the
 * salesperson's connected account. Admin only; nothing is stored.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const conversation = await readLeadConversation(id);
    if (!conversation) return NextResponse.json({ success: false, error: 'Not a Telegram chat lead' }, { status: 404 });
    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not read the chat') }, { status: 500 });
  }
}

/** A reply to the customer, sent from the salesperson's connected account. Body: { text, by }. */
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
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not send the message') }, { status: 400 });
  }
}
