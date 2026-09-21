import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getSettings } from './storage';

const COOKIE_NAME = 'khb_admin_session';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateSessionToken(email: string): string {
  const secret = process.env.SESSION_SECRET || 'khb-events-secret-salt-2026';
  return crypto.createHmac('sha256', secret).update(`${email}:${Date.now()}`).digest('hex');
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return !!session && session.value.length > 20;
}

export async function setAdminSession(email: string): Promise<string> {
  const token = generateSessionToken(email);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });
  return token;
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifyCredentials(email: string, passwordAttempt: string): Promise<boolean> {
  const settings = await getSettings();
  if (email.toLowerCase().trim() !== settings.adminEmail.toLowerCase().trim()) {
    return false;
  }
  const attemptHash = hashPassword(passwordAttempt);
  return attemptHash === settings.adminPasswordHash;
}
