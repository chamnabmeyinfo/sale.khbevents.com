#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json → ignoreCommand).
#   exit 0 → skip this build      exit 1 → build as usual
#
# Skips production builds for pushes that only touch the Obsidian vault
# (docs/) or CLAUDE.md, so saving a note never redeploys the site. Anything
# uncertain (no previous deployment, commit missing from the shallow clone,
# git error, no changes at all such as a manual redeploy) builds, so a code
# change can never be skipped by mistake.

base="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$base" ]; then
  echo "No previous successful deployment known: build."
  exit 1
fi

if ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo "Previous deployment ${base} is not in this clone: build."
  exit 1
fi

if ! changed="$(git diff --name-only "$base" HEAD)"; then
  echo "git diff failed: build."
  exit 1
fi

if [ -z "$changed" ]; then
  echo "No file changes since ${base} (manual redeploy?): build."
  exit 1
fi

outside="$(printf '%s\n' "$changed" | grep -v -E '^(docs/|CLAUDE\.md$)' || true)"
if [ -z "$outside" ]; then
  echo "Only notes changed since ${base}: skipping the build."
  printf '%s\n' "$changed" | sed 's/^/  /'
  exit 0
fi

echo "Code changed since ${base}: build."
exit 1
