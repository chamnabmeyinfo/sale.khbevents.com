import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { readLeadConversation } from '@/lib/telegram-account';

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
