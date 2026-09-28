/**
 * Voice message → text, for the stored chat and the AI coach.
 *
 * Two ways, tried in order:
 * 1. Telegram's own transcription (messages.TranscribeAudio) through the
 *    salesperson's account: free trials on ordinary accounts, unlimited with
 *    Telegram Premium. No audio leaves Telegram.
 * 2. Gemini, when a Gemini key is set (Settings → AI & API keys, or GEMINI_API_KEY in
 *    Vercel): the voice file is downloaded
 *    through the account and sent to Google for transcription. Model from
 *    GEMINI_TRANSCRIBE_MODEL (default gemini-2.5-flash).
 * With neither, the message stays "pending" and shows as a voice message.
 */

export interface Transcriber {
  name: string;
  transcribe(audio: Buffer, mimeType: string, hint: string): Promise<string>;
}

import { aiKey } from './ai-keys';

export async function geminiConfigured(): Promise<boolean> {
  return Boolean(await aiKey('gemini'));
}

const GEMINI_MODEL = () => process.env.GEMINI_TRANSCRIBE_MODEL || 'gemini-2.5-flash';

export const geminiTranscriber: Transcriber = {
  name: 'gemini',
  async transcribe(audio, mimeType, hint) {
    const key = await aiKey('gemini');
    if (!key) throw new Error('No Gemini API key is set');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL())}:generateContent`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: audio.toString('base64') } },
            { text: `Transcribe this voice message word for word in the language spoken (usually Khmer or English; ${hint}). Return only the transcript, no notes. If nothing is said, return an empty string.` },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
      signal: AbortSignal.timeout(40_000),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 160)}`);
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    return text.slice(0, 4000);
  },
};

/** The external transcriber to use, or null when none is configured. */
export async function externalTranscriber(): Promise<Transcriber | null> {
  return (await geminiConfigured()) ? geminiTranscriber : null;
}
