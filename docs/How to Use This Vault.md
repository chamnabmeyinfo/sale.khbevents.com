---
type: guide
tags: [index, setup]
updated: 2026-09-24
---

# How to Use This Vault

The vault is the `docs` folder of the sale.khbevents.com GitHub repository. You edit it in Obsidian on your computer. Claude edits the same files in its sessions. Git keeps both in sync.

## One-time setup on your computer

1. **Install the tools.** Install [Obsidian](https://obsidian.md), [Git](https://git-scm.com/downloads) and, if you prefer buttons to commands, [GitHub Desktop](https://desktop.github.com).
2. **Download the repository.** In GitHub Desktop choose *File → Clone repository* and pick `chamnabmeyinfo/sale.khbevents.com`. Remember the folder it is saved to.
3. **Open the vault.** In Obsidian choose *Open folder as vault* and select the `docs` folder inside the repository. Open `docs`, not the whole repository, so code files stay out of the way.
4. **Trust the vault.** Obsidian asks whether to trust the author. The vault needs no community plugins, so either answer works.

The vault already has shared settings: new notes go to `Inbox`, pasted images go to `Attachments`, templates live in `Templates`, and four notes are bookmarked.

## Daily routine

1. **Before you start:** get the latest notes. In GitHub Desktop press *Fetch origin*, then *Pull*.
2. **Write.** Create notes, edit them, link them with `[[Note name]]`.
3. **When you finish:** in GitHub Desktop, write a short summary such as "notes: update FAQ answers" and press *Commit to main*, then *Push origin*.

Claude sees your notes in its next session after you push. You see Claude's notes after you pull.

## Automatic sync (optional)

The community plugin **Obsidian Git** can pull and push for you every few minutes. Install it from *Settings → Community plugins* if you want hands-free sync. Set its commit message to start with `notes:`. Plugins are installed per device and are not stored in the repository.

## Does saving a note redeploy the website?

No. A push that only changes files in `docs/` (and `CLAUDE.md`) skips the production build on Vercel, so the live site is not rebuilt for a note. Any push that also changes code builds as usual. The rule lives in `vercel.json` and `scripts/vercel-ignore-build.sh`.

## Working with Claude

- At the start of a session Claude reads [[00 Start Here]], [[Open Tasks]] and the notes that match the task.
- At the end of substantive work Claude adds a note in `Sessions`, ticks or adds items in [[Open Tasks]], and records decisions in [[Decision Log]].
- To give Claude context, write it here instead of repeating it in chat: a new trip, a price change, a customer objection, a rule for Khmer copy.
- To ask for something specific, add a task to [[Open Tasks]] with the tag `#for-claude`.

## Folder guide

| Folder | What goes in it |
|---|---|
| Business | Company facts and one note per trip or product |
| Sales | Playbook, FAQ answers, reply templates |
| Copywriting | Writing rules for English and Khmer |
| System | How the portal works: map, features, runbooks |
| Decisions | The decision log |
| Tasks | Open tasks |
| Project | Project history |
| Sessions | One log per working session |
| Templates | Blank notes to start from |
| Inbox | Quick notes to sort later |
| Attachments | Images and PDFs. Keep them small; large files slow down git |

## What never goes in the vault

Passwords, the Telegram bot token, Supabase keys, customer phone numbers or emails copied from the CRM, and anything else you would not want to see printed on a wall. Write where the secret is kept instead, for example "Vercel → Project → Environment Variables".
