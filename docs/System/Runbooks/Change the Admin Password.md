---
type: runbook
tags: [runbook, security, admin]
updated: 2026-09-24
who: Owner
source:
  - src/components/admin/SettingsClient.tsx
  - src/app/api/settings/route.ts
  - src/lib/auth.ts
  - src/app/api/auth/login/route.ts
  - src/lib/i18n/dict/settings.ts
  - src/lib/i18n/dict/nav.ts
  - CPANEL_DEPLOYMENT.md
---

# Change the Admin Password

## What this is for

The admin holds every lead, every customer phone number and the Telegram bot token. Its login must be private. The password that ships with the code is written in the repository, so anyone who has seen the code knows it. The production admin may still use it. Changing it is an open task in [[Open Tasks]].

**Who normally does it:** the owner.

## Before you start

- [ ] Choose a new password that is long, unique and not used anywhere else. A password manager helps.
- [ ] Store it in your password manager. Never write it in this vault, in a chat, or in code.
- [ ] Tell other admins that they will be signed out and need the new password from you in person or through the password manager.

## Steps

- [ ] **1.** Log in to the admin at `sale.khbevents.com/admin`.
- [ ] **2.** Open **Settings & Security** in the sidebar, then the tab **🛡️ Roles & Security** (sidebar shortcut **Owner & Super Admin**, or `/admin/settings#security`).
- [ ] **3.** Find the card **Update Portal Admin Password**.
- [ ] **4.** Type the new password in **New Password**. Use at least 6 characters; longer is much better.
- [ ] **5.** Type it again in **Confirm New Password**.
- [ ] **6.** Press **Save All Settings** (bottom) or **Save Settings** (top).
- [ ] **7.** Wait for "Settings successfully saved and synchronized across the portal!".

## What changes when you save

| Effect | Detail |
|---|---|
| One password for both admin logins | The owner login and the admin login check the same stored password. |
| Stored safely | The new password is stored salted and hashed (scrypt), never as plain text. |
| Other sessions end | Every other admin session is signed out. Your own session stays signed in. |

## Check it worked

- [ ] Log out, then log in again with the new password.
- [ ] The old password no longer works.
- [ ] Tick the task in [[Open Tasks]].

## If something goes wrong

| Problem | What to do |
|---|---|
| "New passwords do not match" | The two boxes differ. Type both again. |
| Saved, but the old password still works | The new password was shorter than 6 characters. The server ignores a password that short without an error. Choose a longer one and save again. |
| "Too many login attempts. Please wait 15 minutes and try again." | Wait 15 minutes, then try again carefully. |
| You forgot the new password | Ask a developer. The password can only be reset by someone with access to the database or the server. |

This setting changes the password of the admin login page (`/admin/login`). The code also accepts a confirmed Supabase account with an admin email; such an account has its own password in Supabase, which this setting does not change. Session signing also depends on `SESSION_SECRET`, which is set in Vercel → Project → Settings → Environment Variables. See [[Admin and Security]].

## Related

- [[Admin and Security]], [[Rotate the Telegram Bot Token]], [[Run the RLS Lockdown Migration]]
- [[Open Tasks]]
