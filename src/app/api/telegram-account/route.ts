import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { getRoundRobinSettings } from '@/lib/storage';
import { checkAccount, disconnectAccount, finishLogin, listAccountStatuses, startLogin, statusOf, getAccountRecord, updateAccountOptions } from '@/lib/telegram-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Talking to Telegram can take a few seconds.
export const maxDuration = 60;

/** Admin → Settings → Telegram account check: connection status per salesperson. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    return NextResponse.json({ success: true, accounts: await listAccountStatuses(), mock: process.env.TELEGRAM_ACCOUNT_MOCK === '1' });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not read the accounts') }, { status: 500 });
  }
}

/**
 * Actions: start (send the code), verify (code and optional password), disconnect,
 * check (read the chats now). The secrets never leave the server.
 */
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const staffId = typeof body.staffId === 'string' ? body.staffId : '';
    const rr = await getRoundRobinSettings();
    const staff = rr.staffList.find((s) => s.id === staffId);
    if (!staff) return NextResponse.json({ success: false, error: 'Unknown salesperson' }, { status: 400 });
    const action = body.action;
    const named = async (status: Awaited<ReturnType<typeof startLogin>>) => ({ ...status, staffName: staff.name });

    if (action === 'start') {
      const status = await startLogin(staffId, {
        apiId: Number(body.apiId),
        apiHash: String(body.apiHash || ''),
        phone: String(body.phone || ''),
      });
      return NextResponse.json({ success: true, account: await named(status) });
    }
    if (action === 'verify') {
      const status = await finishLogin(staffId, String(body.code || ''), typeof body.password === 'string' && body.password ? body.password : undefined);
      return NextResponse.json({ success: true, account: await named(status) });
    }
    if (action === 'disconnect') {
      return NextResponse.json({ success: true, account: await named(await disconnectAccount(staffId)) });
    }
    if (action === 'options') {
      return NextResponse.json({ success: true, account: await named(await updateAccountOptions(staffId, { trackAll: body.trackAll === true })) });
    }
    if (action === 'check') {
      const result = await checkAccount(staffId, { force: true });
      const status = statusOf(await getAccountRecord(staffId), staff.name);
      return NextResponse.json({ success: !result.error, result, account: status, error: result.error });
    }
    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Telegram account action failed') }, { status: 400 });
  }
}
