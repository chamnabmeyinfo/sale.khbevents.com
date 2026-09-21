import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getSettings } from '@/lib/storage';

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json({ authenticated: true, email: settings.adminEmail });
}
