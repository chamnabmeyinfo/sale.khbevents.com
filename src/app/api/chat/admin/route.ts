import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { getRoundRobinSettings, isLiveChatEnabled, LIVE_CHAT_MARKER, setMarker } from '@/lib/storage';
import { getWebChat, listWebChats, markStaffRead, postStaffMessage, setWebChatStatus } from '@/lib/web-chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admin inbox: ?id=<chat> for one chat (marks it read), otherwise the list. */
export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (id) {
      const chat = await markStaffRead(id);
      if (!chat) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      const { token: _token, ...safe } = chat;
      void _token;
      return NextResponse.json({ success: true, chat: safe });
    }
    const [chats, enabled, rr] = await Promise.all([listWebChats(), isLiveChatEnabled(), getRoundRobinSettings()]);
    return NextResponse.json({ success: true, chats, enabled, staff: rr.staffList.map((s) => ({ id: s.id, name: s.name, hasChatId: Boolean(s.telegramChatId) })) });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not load the chats') }, { status: 500 });
  }
}

/** Actions: reply, close, reopen, toggle (live chat on/off). */
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action;
    if (action === 'toggle') {
      await setMarker(LIVE_CHAT_MARKER, body.enabled === false ? 'off' : 'on');
      return NextResponse.json({ success: true, enabled: body.enabled !== false });
    }
    const id = typeof body.id === 'string' ? body.id : '';
    if (!(await getWebChat(id))) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const by = typeof body.by === 'string' && body.by.trim() ? body.by.trim().slice(0, 60) : 'Admin';
    let chat = null;
    if (action === 'reply') chat = await postStaffMessage(id, String(body.text || ''), by, { staffId: typeof body.staffId === 'string' ? body.staffId : undefined });
    else if (action === 'close') chat = await setWebChatStatus(id, 'closed', by);
    else if (action === 'reopen') chat = await setWebChatStatus(id, 'open', by);
    else return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    if (!chat) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const { token: _token, ...safe } = chat;
    void _token;
    return NextResponse.json({ success: true, chat: safe });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Chat action failed') }, { status: 400 });
  }
}
