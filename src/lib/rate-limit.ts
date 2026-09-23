import { NextResponse } from 'next/server';

/**
 * Fixed-window in-memory rate limiter. State lives in the Node process, which
 * is exact for the single-process cPanel deployment and best-effort on
 * serverless hosts where each instance keeps its own counters.
 */

interface RateWindow {
  count: number;
  resetAt: number;
}

// Shared on globalThis so every Next.js bundle in the process uses one set of counters.
const store = globalThis as typeof globalThis & { __khbRateLimits?: Map<string, RateWindow> };
const windows = (store.__khbRateLimits ??= new Map<string, RateWindow>());
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, w] of windows) {
    if (w.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  sweep(now);
  let w = windows.get(key);
  if (!w || w.resetAt <= now) {
    w = { count: 0, resetAt: now + windowMs };
    windows.set(key, w);
  }
  w.count += 1;
  return {
    allowed: w.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((w.resetAt - now) / 1000)),
  };
}

/** Clears counters for a key, e.g. after a successful login. */
export function resetRateLimit(key: string) {
  windows.delete(key);
}

export function tooManyRequests(result: RateLimitResult, message = 'Too many attempts. Please try again later.') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
  );
}

/**
 * Best guess at the visitor's IP. Proxy-set headers come first; for
 * X-Forwarded-For the right-most entry is the one appended by our own proxy,
 * so a client cannot dodge limits by sending a fake header.
 */
export function getClientIp(headers: Headers): string {
  const direct = headers.get('cf-connecting-ip') || headers.get('x-real-ip');
  if (direct) return direct.trim();
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return 'unknown';
}
