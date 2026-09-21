import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getSettings } from './storage';
import { UserRole } from './types';
import { createServerClient } from '@supabase/ssr';

const COOKIE_NAME = 'khb_admin_session';

export const OWNER_EMAIL = 'chamnabmey.info@gmail.com';
export const SUPER_ADMIN_EMAIL = 'admin@khbevents.com';

export function getUserRole(email?: string | null): UserRole {
  if (!email) return 'client';
  const clean = email.toLowerCase().trim();
  if (clean === OWNER_EMAIL.toLowerCase()) return 'owner';
  if (clean === SUPER_ADMIN_EMAIL.toLowerCase()) return 'super_admin';
  if (clean.endsWith('@khbevents.com')) return 'admin';
  return 'client';
}

export function isStaffOrAdmin(email?: string | null): boolean {
  const role = getUserRole(email);
  return role === 'owner' || role === 'super_admin' || role === 'admin';
}

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
  if (session && session.value.length > 20) return true;

  // Also verify Supabase Auth session if logged in as Owner or Super Admin
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {},
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isStaffOrAdmin(user.email)) {
        return true;
      }
    } catch {}
  }

  return false;
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
  const clean = email.toLowerCase().trim();
  const isOwner = clean === OWNER_EMAIL.toLowerCase() || (settings.ownerEmail && clean === settings.ownerEmail.toLowerCase());
  const isAdmin = clean === settings.adminEmail.toLowerCase().trim();

  if (!isOwner && !isAdmin) {
    return false;
  }
  const attemptHash = hashPassword(passwordAttempt);
  return attemptHash === settings.adminPasswordHash;
}
