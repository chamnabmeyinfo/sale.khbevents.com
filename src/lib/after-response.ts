import { after } from 'next/server';

/**
 * Runs side work (Telegram alerts, audit logs, webhooks) after the response has
 * been sent, without blocking it and without being cut off when it goes out.
 *
 * On serverless hosts a function can be frozen the moment the response is sent,
 * so a plain fire-and-forget `fetch().catch()` is often lost. Next's `after()`
 * keeps the function alive until the callback settles. Outside a request scope
 * (scripts, tests) `after()` throws, and the task simply runs in the background.
 */
export function runAfterResponse(task: () => Promise<unknown>): void {
  const safe = () => task().catch((err) => console.error('Deferred task failed:', err));
  try {
    after(safe);
  } catch {
    void safe();
  }
}
