---
type: session
date: 2026-09-24
tags: [session]
---

# Background video for builder sections

## Asked for

- Owner: allow a background video, uploaded or embedded from social media or another source.

## Done

- Every builder section has a **Background video** field: upload (MP4, WebM, MOV up to 50 MB) or paste a YouTube, Vimeo, Facebook or TikTok link or embed code, or a video file link. See [[Page Builder]].
- Uploads go from the browser straight to Supabase Storage with a signed upload URL (bucket `page-videos`), because Vercel refuses request bodies over 4.5 MB. Local development stores them in `public/uploads-video`.
- Only recognised sources are saved; pasted embed code from any other site is refused.
- The video covers the section, plays muted on a loop, never takes clicks, and is hidden for visitors who reduce motion (the background photo shows instead).

## Verified

- Typecheck, lint (no errors), all tests (6 new, 107 in total), production build.
- Browser test (local): unsupported link refused, YouTube embed code recognised and shown muted and covering the section, a recorded WebM clip uploaded and shown in the editor, public page plays it muted on a loop on a phone with no sideways scroll, reduced motion hides it, byte-range serving, anonymous, non-video and over-50 MB uploads refused.
- Not tested here: playback of real YouTube, Vimeo, Facebook and TikTok videos (this sandbox cannot reach those sites) and the Supabase signed upload in production. Check once on the live site.

## Follow-ups

- Try one uploaded video and one YouTube link on the live site. In [[Open Tasks]].
