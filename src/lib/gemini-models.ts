/**
 * Which Gemini model to call. Google retires model names for new keys (gemini-2.5-flash
 * answered 404 "no longer available to new users" in September 2026), so the name is not
 * hard-coded: the portal asks Google which models the key can use and takes the newest
 * "Flash" one that writes text. A Vercel variable (GEMINI_TEXT_MODEL,
 * GEMINI_TRANSCRIBE_MODEL) still wins when set.
 *
 * Server only.
 */

const API = 'https://generativelanguage.googleapis.com/v1beta';
const CACHE_MS = 6 * 60 * 60_000;
let cache: { at: number; keyEnd: string; model: string } | null = null;

interface ListedModel { name?: string; supportedGenerationMethods?: string[] }

/**
 * Picks the newest general Flash model from Google's list: "gemini-<version>-flash",
 * a stable name before a preview of the same version; never lite, image, audio, live or
 * other special models. Null when none fits.
 */
export function pickFlashModel(models: ListedModel[]): string | null {
  let best: { name: string; version: number[]; preview: boolean } | null = null;
  for (const m of models) {
    if (!m.supportedGenerationMethods?.includes('generateContent')) continue;
    const name = (m.name || '').replace(/^models\//, '');
    const hit = /^gemini-(\d+(?:\.\d+)*)-flash(-preview(?:-[\d-]+)?)?$/.exec(name);
    if (!hit) continue;
    const version = hit[1].split('.').map(Number);
    const preview = Boolean(hit[2]);
    if (!best || compare(version, best.version) > 0 || (compare(version, best.version) === 0 && best.preview && !preview)) {
      best = { name, version, preview };
    }
  }
  return best?.name ?? null;
}

function compare(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/** Google's model list for this key. Throws on a refused key or a network error. */
export async function listGeminiModels(key: string, timeoutMs = 15_000): Promise<{ status: number; models: ListedModel[] }> {
  const res = await fetch(`${API}/models?pageSize=1000`, { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) return { status: res.status, models: [] };
  const data = (await res.json().catch(() => ({}))) as { models?: ListedModel[] };
  return { status: res.status, models: data.models || [] };
}

/** The model to use for text or voice. `refresh` forgets the cached choice (after a 404). */
export async function geminiModel(key: string, use: 'text' | 'transcribe', refresh = false): Promise<string> {
  const override = (use === 'text' ? process.env.GEMINI_TEXT_MODEL : process.env.GEMINI_TRANSCRIBE_MODEL)?.trim();
  if (override) return override;
  const keyEnd = key.slice(-6);
  if (!refresh && cache && cache.keyEnd === keyEnd && Date.now() - cache.at < CACHE_MS) return cache.model;
  try {
    const { models } = await listGeminiModels(key);
    const model = pickFlashModel(models);
    if (model) {
      cache = { at: Date.now(), keyEnd, model };
      return model;
    }
  } catch {}
  // Google's own alias for its current Flash model, if the list could not be read.
  return 'gemini-flash-latest';
}

/** True when Google says the model name is gone or unknown, so a fresh pick may help. */
export const isModelGone = (status: number, body: string) => status === 404 || (status === 400 && /model/i.test(body) && /not (found|available|supported)/i.test(body));
