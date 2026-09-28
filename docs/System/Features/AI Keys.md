---
type: feature
tags: [system, feature, ai, security]
updated: 2026-09-28
admin_path: /admin/settings#ai
admin_menu: Settings & Security → AI & API keys
source:
  - src/lib/ai-keys.ts
  - src/lib/ai-text.ts
  - src/lib/gemini-models.ts
  - src/app/api/settings/ai/route.ts
  - src/components/admin/AiKeysPanel.tsx
  - src/lib/ai-analyst.ts
  - src/lib/lead-ai.ts
  - src/lib/transcribe.ts
  - src/lib/ai-poster-ideas.ts
---

# AI Keys

One place for the API keys of the AI services the portal uses: **Settings & Security → AI & API keys**.

## What each key powers

| Service | Key | Used by |
|---|---|---|
| Anthropic (Claude) | starts with `sk-ant-`, from console.anthropic.com → API keys | AI analyst ([[Campaigns and AI Analyst]]), AI coach ([[Customer Story and AI Coach]]), AI headline ideas in Ad posters, [[Gen Ads]], when it is the primary AI or the back-up |
| Google Gemini | from aistudio.google.com → Get API key | The same three features when it is the primary AI or the back-up; always voice messages to text when Telegram cannot transcribe them |

## Primary AI

- The **Primary AI** card picks which service writes the AI analyst report, the AI coach, the poster headline ideas and the [[Gen Ads]] package. Anthropic is the default until someone chooses.
- If the primary fails (key refused, no credits, service down, rate limit) and the other service has a key, the other one answers. A refused request or an unreadable answer does not switch; it shows the error.
- If the primary has no key, the other one answers; with no key at all, the AI features stay off.
- The choice is saved with the keys (`primary` in the `ai_keys` row) and works at once.
- Voice to text always uses Gemini: Claude does not take audio.
- Models: Claude Opus 5. For Gemini the portal asks Google which models the key can use and takes the newest general **Flash** model (not lite, image or audio models), rechecked every 6 hours. If Google answers that a model is gone (404), it picks again at once and retries. **Test the key in use** shows the model it will use. The Vercel variables `GEMINI_TEXT_MODEL` and `GEMINI_TRANSCRIBE_MODEL` override the choice. Each stored report and coach result records the model that wrote it.
- Why not a fixed name: on 2026-09-28 `gemini-2.5-flash` answered 404 "no longer available to new users" for a new key.

## How it works

- **Check and save:** the key's shape is checked, then the service is asked with a free call (Anthropic: list models; Gemini: list models). Only a key the service accepts is saved, so a typo never switches the AI off.
- **Never shown again:** after saving, the screen shows only where the key comes from and its last four characters. The API never sends a key to the browser.
- **Priority:** a key saved here wins over the Vercel variable (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`), which stays as the fallback. **Remove saved key** goes back to the Vercel variable, or switches the service off.
- **Works at once:** no redeploy. Servers pick up a change within 30 seconds.
- **Test the key in use** repeats the free check.
- **When Anthropic refuses a key**, the message shows Anthropic's own reason. The usual one is a 400 "credit balance is too low": the key is fine but the account has no credits. Fix it in console.anthropic.com → Settings → Billing, then save again.
- **Storage:** the `ai_keys` row of `system_settings`, next to the bot token and the Telegram sessions. Keep the database locked (RLS) and the Supabase service key private. Anyone with the admin password can replace or remove a key.
- **Cost:** every AI request is billed to the account that owns the key. Set a monthly spend limit in the Anthropic and Google consoles.

## When the AI says it is busy or out of quota

- **"Gemini: this model has no free quota for your key"** — Google's free tier gives the newest models little or no quota (Google's message says `limit: 0`). The portal cannot change that: it is a setting of the Google project the key belongs to. Fix: in Google AI Studio, turn on billing for that project (pay as you go; a few cents per run), or make Claude the primary AI and put credits on the Anthropic account.
- **"Gemini: today's quota is used up"** — the free tier's daily cap. Resets at midnight Pacific time; billing removes it.
- **"Gemini is busy (rate limit or quota)"** — a per-minute limit. The portal already waits as long as Google asks and retries once; if it still fails, wait a minute. Billing raises the per-minute limits too.
- **Claude "credit balance is too low"** — the Anthropic account has no credits: console.anthropic.com → Billing.
- When both services fail, the message shows both reasons, separated by "·". The portal's own limits are only there to stop accidental double clicks (Gen Ads: 6 runs per ten minutes; poster ideas: 6 per minute).

## Not built, on purpose

- **An AI chat that answers customers.** The owner decided on 2026-09-27 that AI helps the team read and answer chats faster but never talks to customers; the AI coach suggests replies that a person sends ([[Customer Story and AI Coach]]).
- **A free choice of model.** The screen picks the service, not the model: Claude Opus 5 with Anthropic's automatic fallback, or the Gemini model above.

## Related

[[Campaigns and AI Analyst]], [[Customer Story and AI Coach]], [[Admin and Security]].
