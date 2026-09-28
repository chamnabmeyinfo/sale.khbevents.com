/**
 * One way for every text AI feature (AI analyst, AI coach, poster ideas) to ask for a
 * JSON answer, on the provider set as primary in Settings → AI & API keys. When the
 * primary fails (key refused, no credits, service down) and the other provider has a
 * key, the other one answers instead.
 *
 * Server only.
 */
import Anthropic from '@anthropic-ai/sdk';
import { aiKey, aiTextProviders, type AiProvider } from './ai-keys';

export const AI_MODEL = 'claude-opus-5';
/** Gemini model for text features; override with GEMINI_TEXT_MODEL. */
export const geminiTextModel = () => process.env.GEMINI_TEXT_MODEL?.trim() || 'gemini-2.5-flash';

export class AiAnalystError extends Error {
  constructor(message: string, public code: 'no_key' | 'refused' | 'bad_output' | 'api') {
    super(message);
  }
}

export const NO_AI_KEY = 'No AI key: add an Anthropic or Gemini key in Settings → AI & API keys.';

export interface JsonRequest {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  effort: 'low' | 'medium' | 'high';
  maxTokens: number;
  timeoutMs: number;
  /** Stream the Anthropic answer (needed for long answers). */
  stream?: boolean;
}

export interface JsonAnswer {
  data: unknown;
  provider: AiProvider;
  model: string;
}

/** Asks the primary AI, then the other one if the primary fails. Throws AiAnalystError. */
export async function generateJson(req: JsonRequest): Promise<JsonAnswer> {
  const providers = await aiTextProviders();
  if (!providers.length) throw new AiAnalystError(NO_AI_KEY, 'no_key');
  let last: AiAnalystError | null = null;
  for (const provider of providers) {
    const key = await aiKey(provider);
    if (!key) continue;
    try {
      return provider === 'anthropic' ? await askAnthropic(key, req) : await askGemini(key, req);
    } catch (err) {
      last = err instanceof AiAnalystError ? err : new AiAnalystError(err instanceof Error ? err.message : String(err), 'api');
      // A refusal or an unreadable answer is not the key's fault: do not spend the back-up on it.
      if (last.code !== 'api') throw last;
      console.error(`AI ${provider} failed:`, last.message);
    }
  }
  throw last ?? new AiAnalystError(NO_AI_KEY, 'no_key');
}

async function askAnthropic(apiKey: string, req: JsonRequest): Promise<JsonAnswer> {
  const client = new Anthropic({ apiKey, timeout: req.timeoutMs, maxRetries: 1 });
  const params = {
    model: AI_MODEL,
    max_tokens: req.maxTokens,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default' as const,
    thinking: { type: 'adaptive' as const },
    output_config: { effort: req.effort, format: { type: 'json_schema' as const, schema: req.schema } },
    system: req.system,
    messages: [{ role: 'user' as const, content: req.user }],
  };
  let message: Anthropic.Beta.BetaMessage;
  try {
    message = req.stream ? await client.beta.messages.stream(params).finalMessage() : await client.beta.messages.create(params);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new AiAnalystError('The Anthropic API key was rejected.', 'api');
    if (err instanceof Anthropic.RateLimitError) throw new AiAnalystError('The AI service is busy (rate limit). Try again in a minute.', 'api');
    if (err instanceof Anthropic.APIError) throw new AiAnalystError(`Anthropic error ${err.status ?? ''}`.trim(), 'api');
    throw new AiAnalystError(err instanceof Error ? err.message : String(err), 'api');
  }
  if (message.stop_reason === 'refusal') throw new AiAnalystError('The AI declined this request.', 'refused');
  const text = message.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('');
  return { data: parseJson(text, message.stop_reason === 'max_tokens'), provider: 'anthropic', model: message.model || AI_MODEL };
}

interface GeminiResponse {
  candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  promptFeedback?: { blockReason?: string };
  modelVersion?: string;
}

async function askGemini(key: string, req: JsonRequest): Promise<JsonAnswer> {
  const model = geminiTextModel();
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts: [{ text: req.user }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: req.schema,
          maxOutputTokens: req.maxTokens,
        },
      }),
      signal: AbortSignal.timeout(req.timeoutMs),
    });
  } catch (err) {
    throw new AiAnalystError(`Gemini could not be reached (${err instanceof Error ? err.message : String(err)}).`, 'api');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let reason = '';
    try { reason = String((JSON.parse(body) as { error?: { message?: unknown } }).error?.message || ''); } catch {}
    if (res.status === 429) throw new AiAnalystError('Gemini is busy (rate limit or quota). Try again in a minute.', 'api');
    throw new AiAnalystError(`Gemini error ${res.status}${reason ? `: ${reason.slice(0, 200)}` : ''}`, 'api');
  }
  const data = (await res.json()) as GeminiResponse;
  const c = data.candidates?.[0];
  if (data.promptFeedback?.blockReason || c?.finishReason === 'SAFETY' || c?.finishReason === 'PROHIBITED_CONTENT') {
    throw new AiAnalystError('The AI declined this request.', 'refused');
  }
  const text = (c?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
  return { data: parseJson(text, c?.finishReason === 'MAX_TOKENS'), provider: 'gemini', model: data.modelVersion || model };
}

function parseJson(text: string, cutOff: boolean): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new AiAnalystError(cutOff ? 'The answer was cut off. Try again.' : 'The AI answer could not be read.', 'bad_output');
  }
}
