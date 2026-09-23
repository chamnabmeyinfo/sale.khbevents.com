import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSettings } from './storage';
import { UserRole } from './types';
import { createServerClient } from '@supabase/ssr';

const COOKIE_NAME = 'khb_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Passwords are stored as `scrypt$<salt>$<hash>`. Older installs stored a bare
// unsalted SHA-256 hex digest, which verifyPassword still accepts so existing
// credentials keep working until the password is next changed.
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith('scrypt$')) {
    const [, salt, hash] = stored.split('$');
    if (!salt || !hash) return false;
    const attempt = crypto.scryptSync(password, salt, 64).toString('hex');
    return safeEqual(attempt, hash);
  }
  const legacy = crypto.createHash('sha256').update(password).digest('hex');
  return safeEqual(legacy, stored);
}

// The signing key mixes the server secret with the current password hash, so
// changing the admin password invalidates every existing session.
async function getSessionKey(): Promise<string> {
  const settings = await getSettings();
  const secret = process.env.SESSION_SECRET || 'khb-events-secret-salt-2026';
  return crypto.createHmac('sha256', secret).update(settings.adminPasswordHash || '').digest('hex');
}

function signSession(key: string, email: string, expires: number): string {
  return crypto.createHmac('sha256', key).update(`${email}.${expires}`).digest('hex');
}

export async function generateSessionToken(email: string): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const key = await getSessionKey();
  const encodedEmail = Buffer.from(email).toString('base64url');
  return `${encodedEmail}.${expires}.${signSession(key, email, expires)}`;
}

async function verifySessionToken(token: string): Promise<boolean> {
  const [encodedEmail, expiresRaw, signature] = token.split('.');
  if (!encodedEmail || !expiresRaw || !signature) return false;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const email = Buffer.from(encodedEmail, 'base64url').toString();
  const key = await getSessionKey();
  return safeEqual(signSession(key, email, expires), signature);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (session?.value && (await verifySessionToken(session.value))) return true;

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

/**
 * Secret Telegram echoes back in the X-Telegram-Bot-Api-Secret-Token header,
 * proving a webhook call really came from Telegram. Derived from the bot token
 * so rotating the token rotates it too.
 */
export function getTelegramWebhookSecret(botToken: string): string {
  return crypto.createHmac('sha256', botToken).update('khb-telegram-webhook').digest('hex');
}

export function isValidTelegramWebhookSecret(botToken: string, header: string | null): boolean {
  return Boolean(header) && safeEqual(getTelegramWebhookSecret(botToken), header!);
}

/** Returns a 401 response when the caller is not an admin, otherwise null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAuthenticated()) return null;
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export async function setAdminSession(email: string): Promise<string> {
  const token = await generateSessionToken(email.toLowerCase().trim());
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
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
  return verifyPassword(passwordAttempt, settings.adminPasswordHash);
}
