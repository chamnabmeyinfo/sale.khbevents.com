/**
 * Master AI keys: the Anthropic (Claude) and Google Gemini API keys every AI feature uses.
 *
 * Set in Admin → Settings & Security → AI & API keys, stored in the `ai_keys` row of
 * system_settings (server only, like the bot token and the Telegram sessions: lock the
 * database with RLS). A key saved there wins over the Vercel environment variable
 * (ANTHROPIC_API_KEY / GEMINI_API_KEY), which stays as the fallback. Keys never go back to
 * the browser: the admin sees only whether a key is set, where it comes from, and its last
 * four characters.
 *
 * Server only.
 */
import Anthropic from '@anthropic-ai/sdk';
import { getMarker, setMarker } from './storage';

export type AiProvider = 'anthropic' | 'gemini';
export const AI_PROVIDERS: AiProvider[] = ['anthropic', 'gemini'];

const ROW = 'ai_keys';
const ENV: Record<AiProvider, string> = { anthropic: 'ANTHROPIC_API_KEY', gemini: 'GEMINI_API_KEY' };

interface StoredKeys {
  anthropic?: string;
  gemini?: string;
  updatedAt?: Partial<Record<AiProvider, string>>;
}

// Read often (the AI coach runs after site traffic): a short cache, cleared on save.
let cache: { at: number; value: StoredKeys } | null = null;
const CACHE_MS = 30_000;

async function stored(): Promise<StoredKeys> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  let value: StoredKeys = {};
  try {
    const raw = await getMarker(ROW);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') value = parsed as StoredKeys;
  } catch {
    value = {};
  }
  cache = { at: Date.now(), value };
  return value;
}

/** The key to use for a provider: the one saved in Settings, else the environment variable. */
export async function aiKey(provider: AiProvider): Promise<string | undefined> {
  const saved = (await stored())[provider]?.trim();
  return saved || process.env[ENV[provider]]?.trim() || undefined;
}

export interface AiKeyStatus {
  provider: AiProvider;
  set: boolean;
  source: 'settings' | 'env' | null;
  /** Last four characters, to recognise the key without showing it. */
  last4?: string;
  updatedAt?: string;
  envName: string;
}

export async function aiKeyStatuses(): Promise<AiKeyStatus[]> {
  const s = await stored();
  return AI_PROVIDERS.map((provider) => {
    const saved = s[provider]?.trim();
    const env = process.env[ENV[provider]]?.trim();
    const key = saved || env;
    return {
      provider,
      set: Boolean(key),
      source: saved ? 'settings' : env ? 'env' : null,
      ...(key ? { last4: key.slice(-4) } : {}),
      ...(saved && s.updatedAt?.[provider] ? { updatedAt: s.updatedAt[provider] } : {}),
      envName: ENV[provider],
    };
  });
}

/** A basic shape check, so a pasted label or half a key is refused before it is saved. */
export function aiKeyShapeError(provider: AiProvider, key: string): string | null {
  const k = key.trim();
  if (k.length < 20 || k.length > 300 || /\s/.test(k)) return 'That does not look like an API key.';
  if (provider === 'anthropic' && !k.startsWith('sk-ant-')) return 'An Anthropic API key starts with "sk-ant-" (console.anthropic.com → API keys).';
  // Google keys are "AIza…" or, in the newer format, "AQ.…" (with a dot): letters, digits, ".", "-", "_".
  if (provider === 'gemini' && !/^[A-Za-z0-9._-]+$/.test(k)) return 'A Gemini API key has only letters, digits, ".", "-" and "_" (aistudio.google.com → Get API key).';
  return null;
}

/** Saves (or, with null, removes) the key kept in Settings. */
export async function saveAiKey(provider: AiProvider, key: string | null): Promise<void> {
  cache = null;
  const current = await stored();
  const next: StoredKeys = { ...current, updatedAt: { ...current.updatedAt } };
  if (key && key.trim()) {
    next[provider] = key.trim();
    next.updatedAt![provider] = new Date().toISOString();
  } else {
    delete next[provider];
    delete next.updatedAt![provider];
  }
  await setMarker(ROW, JSON.stringify(next));
  cache = null;
}

/** Checks a key with a free call (no tokens spent). Uses the given key, else the one in use. */
export async function testAiKey(provider: AiProvider, key?: string): Promise<{ ok: boolean; message: string }> {
  const k = key?.trim() || (await aiKey(provider));
  if (!k) return { ok: false, message: 'No key is set.' };
  // Local rehearsals only: no call leaves the machine; a key containing "good" passes.
  if (process.env.AI_KEYS_MOCK === '1') return k.includes('good') ? { ok: true, message: 'Mock: key accepted.' } : { ok: false, message: 'Mock: key rejected.' };
  try {
    if (provider === 'anthropic') {
      const client = new Anthropic({ apiKey: k, maxRetries: 0, timeout: 15_000 });
      await client.models.list({ limit: 1 });
      return { ok: true, message: 'The Anthropic key works.' };
    }
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', {
      headers: { 'x-goog-api-key': k },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return { ok: true, message: 'The Gemini key works.' };
    return { ok: false, message: res.status === 400 || res.status === 403 ? 'Google rejected this key.' : `Google answered ${res.status}.` };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return { ok: false, message: 'Anthropic rejected this key.' };
    if (err instanceof Anthropic.PermissionDeniedError) return { ok: false, message: 'This key has no access to the API (check its workspace and billing).' };
    if (err instanceof Anthropic.APIError) return { ok: false, message: `Anthropic answered ${err.status ?? 'an error'}.` };
    return { ok: false, message: 'The check could not reach the service.' };
  }
}
