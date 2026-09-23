import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, setAdminSession } from '@/lib/auth';
import { rateLimit, resetRateLimit, tooManyRequests, getClientIp } from '@/lib/rate-limit';

const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const ipKey = `login:ip:${getClientIp(req.headers)}`;
    const emailKey = `login:email:${String(email).toLowerCase().trim()}`;
    const byIp = rateLimit(ipKey, 10, WINDOW_MS);
    const byEmail = rateLimit(emailKey, 20, WINDOW_MS);
    if (!byIp.allowed) return tooManyRequests(byIp, 'Too many login attempts. Please wait 15 minutes and try again.');
    if (!byEmail.allowed) return tooManyRequests(byEmail, 'Too many login attempts. Please wait 15 minutes and try again.');

    const isValid = await verifyCredentials(email, password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    resetRateLimit(ipKey);
    resetRateLimit(emailKey);
    await setAdminSession(email);
    return NextResponse.json({ success: true, message: 'Logged in successfully' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
