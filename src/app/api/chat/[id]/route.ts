import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByIp } from '@/lib/rate-limit';
import { getWebChatForVisitor, markVisitorRead, postVisitorMessage, viewFor } from '@/lib/web-chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The visitor's view of their chat: ?token=…&since=<ISO> returns only newer messages. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimitByIp('webchat-poll', req.headers, 240, 60 * 1000).allowed) return NextResponse.json({ success: false }, { status: 429 });
  const { id } = await params;
  const url = new URL(req.url);
  const chat = await getWebChatForVisitor(id, url.searchParams.get('token') || '');
  if (!chat) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  await markVisitorRead(chat);
  return NextResponse.json({ success: true, chat: viewFor(chat, url.searchParams.get('since') || undefined) });
}

/** A further message from the visitor. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimitByIp('webchat-msg', req.headers, 40, 10 * 60 * 1000).allowed) return NextResponse.json({ success: false, error: 'Too many messages. Please wait a moment.' }, { status: 429 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const view = await postVisitorMessage(id, String(body.token || ''), String(body.text || ''));
  if (!view) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, chat: view });
}
