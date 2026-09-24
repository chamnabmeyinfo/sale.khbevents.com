---
type: runbook
tags: [runbook, popups, marketing]
updated: 2026-09-24
who: Owner or Sales lead
source:
  - src/components/admin/AdsManagerClient.tsx
  - src/lib/popup-ads.ts
  - src/lib/i18n/dict/ads.ts
  - src/lib/i18n/dict/common.ts
  - README.md
---

# Create a Popup

## What this is for

A popup gives a hesitating visitor one clear next step: ask on Telegram, reserve a seat, or come back before leaving. At most one popup shows per page view, it is easy to close, and it never shows to someone who already sent the form. How popups work: [[Ads and Popups]].

**Who normally does it:** the owner or the sales lead. No developer and no deploy needed. Live pages update within a minute of saving.

## Before you start

- [ ] Decide the one action you want: chat on Telegram, go to the form, open a link, or just a message.
- [ ] Write the words. Title under 12 words. One to three short sentences. A button that says what happens next. Rules: [[Copy Rules]].
- [ ] Optional picture, about 1200×800, with no words in it. See [[Image Uploads]].
- [ ] No invented numbers, quotes or claims. Seats left and deadlines must match the page, which follows the admin.

## Steps

- [ ] **1.** Open **Admin → Ads & Popups** (`/admin/ads`).
- [ ] **2.** Click a starter (**Ask us on Telegram**, **Reserve a seat**, **Before you go**) or **New popup**. The editor opens with a live preview.
- [ ] **3.** Tab **Content** (English required, **ភាសាខ្មែរ** optional and falls back to English):
  - **Internal name** (only you see it), **Small badge**, **Title**, **Text**, **Picture (optional)**.
  - **Button text** and **Button does**: Chat on Telegram (round-robin routed), Go to the registration form, Open a link, or Just close the popup.
  - **Dismiss link** (for example "Not now").
- [ ] **4.** Tab **Design:** **Layout** (Centered card, Bottom sheet, Bottom banner, Image first), **Colours** (Dark green matches the page, or Light), **Button colour** (keep Gold unless the offer needs its own colour).
- [ ] **5.** Tab **Rules:**
  - **Show on:** all pages, or pick the pages.
  - **Devices** and **Language**.
  - **Show it:** as soon as the page loads, after a few seconds, after scrolling down, or when the visitor is about to leave.
  - **How often per visitor:** from every page view to only once, ever.
  - **Start** and **End** (your local time). Empty start means now; empty end means until paused.
  - **Priority:** the higher number wins when two popups could show.
  - Keep **Hide from visitors who already sent the form** ticked.
- [ ] **6.** Tick **Enabled** at the bottom of the Rules tab.
- [ ] **7.** Press **Done** to close the editor.
- [ ] **8.** Press **Save all** at the top of the screen. The message "Popups saved. Live pages update within a minute." confirms it.
- [ ] **9.** Check the master switch **Popups enabled** at the top is **ON**. It switches every popup on or off.
- [ ] **10.** In the **Popups & performance** list, press the **Preview** (eye) button on your popup. It opens the live page with the popup shown at once.

## Check it worked

- [ ] Preview shows the popup on the real page, in the right layout, on a phone and on a desktop.
- [ ] The button does what you chose. A Telegram button opens a salesperson's chat through [[Round Robin]] (a real assignment).
- [ ] The status in the list is **active** (or **scheduled** if the start is in the future).
- [ ] After a day or two, check **Popup views**, **Button clicks** and **Click rate**. Treat them as close estimates.

Preview works even when a popup is paused, and it does not count a view or a click. Add `?nopopup=1` to a page link to hide all popups, for screenshots and demos.

## If something goes wrong

| Problem | What to do |
|---|---|
| **Done** is greyed out | The popup needs an English **Title** and English **Button text**. |
| "Saved. 1 popup was dropped …" | A popup without an English title or button text is removed on save. Add them and save again. |
| The popup does not show on the live page | Check the master switch is ON, the popup is Enabled, today is inside Start and End, and the page, device and language match. You may also have seen it already: frequency and the 12-hour cooldown between popups apply. Use **Preview** to see it anyway. |
| The popup annoys visitors | Press **Pause** in the list, then **Save all**. |
| Changing "Cooldown between popups (hours)" has no effect | Known limit at the time of writing: the live site uses the built-in 12 hours. See [[Ads and Popups]]. |

## Related

- [[Ads and Popups]], [[Round Robin]], [[Tracking and Analytics]]
- [[Launch a New Trip Page]], [[Copy Rules]], [[Image Uploads]]
- [[Open Tasks]]
