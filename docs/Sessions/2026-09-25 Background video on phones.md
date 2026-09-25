---
type: session
date: 2026-09-25
tags: [session, builder, video, mobile]
---

# Background video on phones

## Asked for

- Owner: uploaded MP4 background videos do not autoplay on mobile.

## Done

- **Cause:** the page tried to start the video once. Phones that block autoplay refuse that single try, and the video never started. These include the Telegram, Facebook, Messenger and Instagram in-app browsers on Android, iPhone Low Power Mode and Android Data Saver.
- **Fix:** a new background video player, `src/components/builder/BackgroundVideo.tsx`.
  - It retries playback at the visitor's first tap, touch or key press anywhere on the page. One tap starts every waiting video.
  - It also retries when the file has loaded and when the tab comes back.
  - It pauses videos that are off screen and resumes them when they scroll back.
  - It adds the inline-play settings that older in-app browsers need.
- **Editor:** MOV files (usually from an iPhone) now show a warning, because many Android phones cannot play them. Upload MP4 (H.264) instead. The background video hint explains the first-tap behaviour.

## Verified

- tsc, eslint, 181 unit tests, `npm run build`.
- Playwright with an emulated iPhone and Pixel:
  - the video plays by itself;
  - it pauses off screen and resumes on screen;
  - in a simulated strict in-app browser (no playback before a tap), the photo shows first and the first tap starts the video. The old code stayed on the photo.
- Real Telegram, Low Power Mode and Data Saver were not tested; the strict in-app browser case above was simulated.

## Decisions

- Visitors whose device asks for reduced motion still see the photo instead of the video (accessibility).

## Follow-ups

- If the live video is a MOV file, re-upload it as MP4. See [[Open Tasks]].
