import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rows = new Map<string, string>();
vi.mock('../storage', () => ({
  getMarker: async (id: string) => rows.get(id) ?? null,
  setMarker: async (id: string, value: string) => { rows.set(id, value); },
}));

// A stand-in Anthropic client: `anthropicAnswer` decides what the next call returns.
let anthropicAnswer: () => unknown = () => { throw new Error('not set'); };
vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error { status?: number; }
  class AuthenticationError extends APIError {}
  class RateLimitError extends APIError {}
  class PermissionDeniedError extends APIError {}
  class Anthropic {
    static APIError = APIError;
    static AuthenticationError = AuthenticationError;
    static RateLimitError = RateLimitError;
    static PermissionDeniedError = PermissionDeniedError;
    beta = { messages: { create: async () => anthropicAnswer(), stream: () => ({ finalMessage: async () => anthropicAnswer() }) } };
  }
  return { default: Anthropic };
});

import { aiKeyStatuses, aiTextProviders, saveAiKey, setAiPrimary } from '../ai-keys';
import { AiAnalystError, generateJson, geminiBusyMessage, geminiRetryDelay } from '../ai-text';
import { pickFlashModel } from '../gemini-models';

const REQ = { system: 's', user: 'u', schema: { type: 'object' }, effort: 'medium' as const, maxTokens: 1000, timeoutMs: 5000 };
const geminiOk = (json: unknown) => new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(json) }] } }], modelVersion: 'gemini-test' }), { status: 200 });

describe('primary AI', () => {
  beforeEach(async () => {
    rows.clear();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    await saveAiKey('anthropic', null); // also clears the 30 s key cache
    rows.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('orders providers primary first, and skips providers without a key', async () => {
    expect(await aiTextProviders()).toEqual([]);
    await saveAiKey('gemini', 'AIzaSy-test-gemini-key-000000000');
    expect(await aiTextProviders()).toEqual(['gemini']);
    await saveAiKey('anthropic', 'sk-ant-test-anthropic-key-00000000');
    expect(await aiTextProviders()).toEqual(['anthropic', 'gemini']);
    await setAiPrimary('gemini');
    expect(await aiTextProviders()).toEqual(['gemini', 'anthropic']);
    expect((await aiKeyStatuses()).map((s) => [s.provider, s.primary])).toEqual([['anthropic', false], ['gemini', true]]);
    // Saving a key keeps the choice.
    await saveAiKey('anthropic', 'sk-ant-test-anthropic-key-11111111');
    expect(await aiTextProviders()).toEqual(['gemini', 'anthropic']);
  });

  it('answers with Gemini when it is primary', async () => {
    await saveAiKey('gemini', 'AIzaSy-test-gemini-key-000000000');
    await saveAiKey('anthropic', 'sk-ant-test-anthropic-key-00000000');
    await setAiPrimary('gemini');
    const fetchMock = vi.fn(async () => geminiOk({ ideas: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const answer = await generateJson(REQ);
    expect(answer).toMatchObject({ provider: 'gemini', model: 'gemini-test', data: { ideas: [] } });
    const gen = (fetchMock.mock.calls as unknown as Array<[string, RequestInit]>).find(([u]) => u.includes(':generateContent'))!;
    const body = JSON.parse(gen[1].body as string);
    expect(body.generationConfig).toMatchObject({ responseMimeType: 'application/json', responseJsonSchema: { type: 'object' } });
  });

  it('falls back to the other AI when the primary fails', async () => {
    await saveAiKey('gemini', 'AIzaSy-test-gemini-key-000000000');
    await saveAiKey('anthropic', 'sk-ant-test-anthropic-key-00000000');
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const ApiError = Anthropic.APIError as unknown as new (m: string) => Error;
    anthropicAnswer = () => { const e = new ApiError('no credits'); (e as { status?: number }).status = 400; throw e; };
    vi.stubGlobal('fetch', vi.fn(async () => geminiOk({ ok: 1 })));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await generateJson(REQ)).toMatchObject({ provider: 'gemini', data: { ok: 1 } });
  });

  it('uses Claude when it is primary and works, and reports no key when none is set', async () => {
    await expect(generateJson(REQ)).rejects.toMatchObject({ code: 'no_key' });
    await saveAiKey('anthropic', 'sk-ant-test-anthropic-key-00000000');
    anthropicAnswer = () => ({ stop_reason: 'end_turn', model: 'claude-test', content: [{ type: 'text', text: '{"a":1}' }] });
    expect(await generateJson({ ...REQ, stream: true })).toMatchObject({ provider: 'anthropic', model: 'claude-test', data: { a: 1 } });
  });

  it('does not spend the back-up on an unreadable answer', async () => {
    await saveAiKey('anthropic', 'sk-ant-test-anthropic-key-00000000');
    await saveAiKey('gemini', 'AIzaSy-test-gemini-key-000000000');
    anthropicAnswer = () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'not json' }] });
    const fetchMock = vi.fn(async () => geminiOk({}));
    vi.stubGlobal('fetch', fetchMock);
    const err = await generateJson(REQ).catch((e) => e);
    expect(err).toBeInstanceOf(AiAnalystError);
    expect(err.code).toBe('bad_output');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks Google for the current Flash model and retries when a model is retired', async () => {
    await saveAiKey('gemini', 'AIzaSy-test-gemini-key-000000000');
    await setAiPrimary('gemini');
    const list = { models: [
      { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
    ] };
    let listCalls = 0;
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      urls.push(url);
      if (url.includes('/models?')) {
        listCalls += 1;
        // First list is stale (only the retired model); the refreshed one has the new model.
        return new Response(JSON.stringify(listCalls === 1 ? { models: [list.models[0]] } : list), { status: 200 });
      }
      if (url.includes('gemini-2.5-flash')) return new Response(JSON.stringify({ error: { message: 'This model models/gemini-2.5-flash is no longer available to new users.' } }), { status: 404 });
      return geminiOk({ ok: 1 });
    }));
    expect(await generateJson(REQ)).toMatchObject({ provider: 'gemini', data: { ok: 1 } });
    expect(urls.filter((u) => u.includes(':generateContent')).map((u) => u.split('/models/')[1])).toEqual(['gemini-2.5-flash:generateContent', 'gemini-3.8-flash:generateContent']);
  });

  it('explains a Gemini 429: no free quota, daily cap, or a short limit that is retried once', async () => {
    const noQuota = 'You exceeded your current quota, please check your plan and billing details. * Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-3.8-flash';
    expect(geminiBusyMessage(noQuota)).toMatch(/no free quota for your key/);
    expect(geminiBusyMessage(noQuota)).toMatch(/Turn on billing/);
    expect(geminiBusyMessage('Quota exceeded for metric: generate_content_free_tier_requests_per_day, limit: 250')).toMatch(/today's quota is used up/);
    expect(geminiBusyMessage('Quota exceeded for metric: generate_content_free_tier_requests, limit: 250', 'GenerateRequestsPerDayPerProjectPerModel-FreeTier')).toMatch(/today's quota is used up/);
    expect(geminiBusyMessage('Resource has been exhausted (e.g. check quota).')).toMatch(/busy \(rate limit or quota\)/);
    expect(geminiRetryDelay('{"error":{"details":[{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"2.5s"}]}}')).toBe(3);
    expect(geminiRetryDelay('{}')).toBeNull();

    await saveAiKey('gemini', 'AIzaSy-test-gemini-key-000000000');
    await setAiPrimary('gemini');
    let calls = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/models?')) return new Response(JSON.stringify({ models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }] }), { status: 200 });
      calls += 1;
      if (calls === 1) return new Response(JSON.stringify({ error: { code: 429, message: 'Resource has been exhausted', details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '0.1s' }] } }), { status: 429 });
      return geminiOk({ ok: 1 });
    }));
    expect(await generateJson({ ...REQ, timeoutMs: 60_000 })).toMatchObject({ provider: 'gemini', data: { ok: 1 } });
    expect(calls).toBe(2);
  });

  it('when both services fail, the message carries both reasons', async () => {
    await saveAiKey('anthropic', 'sk-ant-test-anthropic-key-00000000');
    await saveAiKey('gemini', 'AIzaSy-test-gemini-key-000000000');
    await setAiPrimary('anthropic');
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const ApiError = Anthropic.APIError as unknown as new (m: string) => Error;
    anthropicAnswer = () => {
      const e = new ApiError('credit balance is too low');
      Object.assign(e, { status: 400, error: { error: { message: 'Your credit balance is too low to access the Anthropic API.' } } });
      throw e;
    };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/models?')) return new Response(JSON.stringify({ models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }] }), { status: 200 });
      return new Response(JSON.stringify({ error: { code: 429, message: 'Quota exceeded for metric: generate_content_free_tier_requests, limit: 0' } }), { status: 429 });
    }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = await generateJson(REQ).catch((e) => e);
    expect(err.code).toBe('api');
    expect(err.message).toMatch(/Anthropic: the account has no credits.*credit balance is too low.* · Gemini: this model has no free quota/);
  });

  it('does not wait and retry a daily-cap 429, which cannot succeed', async () => {
    await saveAiKey('gemini', 'AIzaSy-test-gemini-key-000000000');
    await setAiPrimary('gemini');
    let calls = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/models?')) return new Response(JSON.stringify({ models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }] }), { status: 200 });
      calls += 1;
      return new Response(JSON.stringify({ error: { code: 429, message: 'Quota exceeded, limit: 250', details: [{ violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] }, { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '30s' }] } }), { status: 429 });
    }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = await generateJson({ ...REQ, timeoutMs: 120_000 }).catch((e) => e);
    expect(err.message).toMatch(/today's quota is used up/);
    expect(calls).toBe(1);
  });
});

describe('pickFlashModel', () => {
  const m = (name: string, methods = ['generateContent']) => ({ name: `models/${name}`, supportedGenerationMethods: methods });
  it('takes the newest general Flash model, stable before preview', () => {
    expect(pickFlashModel([m('gemini-2.5-flash'), m('gemini-3.8-flash'), m('gemini-3.8-flash-lite'), m('gemini-4.0-flash-image'), m('gemini-3.5-pro')])).toBe('gemini-3.8-flash');
    expect(pickFlashModel([m('gemini-3.8-flash-preview-09-2026'), m('gemini-3.8-flash')])).toBe('gemini-3.8-flash');
    expect(pickFlashModel([m('gemini-3.8-flash'), m('gemini-3.10-flash-preview')])).toBe('gemini-3.10-flash-preview');
    expect(pickFlashModel([m('gemini-3.8-flash', ['embedContent']), m('text-embedding-004')])).toBeNull();
  });
});
