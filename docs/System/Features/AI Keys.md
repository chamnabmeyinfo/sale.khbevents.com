---
type: feature
tags: [system, feature, ai, security]
updated: 2026-09-28
admin_path: /admin/settings#ai
admin_menu: Settings & Security → AI & API keys
source:
  - src/lib/ai-keys.ts
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
| Anthropic (Claude) | starts with `sk-ant-`, from console.anthropic.com → API keys | AI analyst ([[Campaigns and AI Analyst]]), AI coach ([[Customer Story and AI Coach]]), AI headline ideas in Ad posters |
| Google Gemini | from aistudio.google.com → Get API key | Voice messages to text when Telegram cannot transcribe them |

## How it works

- **Check and save:** the key's shape is checked, then the service is asked with a free call (Anthropic: list models; Gemini: list models). Only a key the service accepts is saved, so a typo never switches the AI off.
- **Never shown again:** after saving, the screen shows only where the key comes from and its last four characters. The API never sends a key to the browser.
- **Priority:** a key saved here wins over the Vercel variable (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`), which stays as the fallback. **Remove saved key** goes back to the Vercel variable, or switches the service off.
- **Works at once:** no redeploy. Servers pick up a change within 30 seconds.
- **Test the key in use** repeats the free check.
- **When Anthropic refuses a key**, the message shows Anthropic's own reason. The usual one is a 400 "credit balance is too low": the key is fine but the account has no credits. Fix it in console.anthropic.com → Settings → Billing, then save again.
- **Storage:** the `ai_keys` row of `system_settings`, next to the bot token and the Telegram sessions. Keep the database locked (RLS) and the Supabase service key private. Anyone with the admin password can replace or remove a key.
- **Cost:** every AI request is billed to the account that owns the key. Set a monthly spend limit in the Anthropic and Google consoles.

## Not built, on purpose

- **An AI chat that answers customers.** The owner decided on 2026-09-27 that AI helps the team read and answer chats faster but never talks to customers; the AI coach suggests replies that a person sends ([[Customer Story and AI Coach]]).
- **A choice of model.** The features use Claude Opus 5 with Anthropic's automatic fallback; cheaper models do not support every option the features use.

## Related

[[Campaigns and AI Analyst]], [[Customer Story and AI Coach]], [[Admin and Security]].
