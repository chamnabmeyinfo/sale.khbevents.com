---
type: feature
tags: [system, feature, landing-pages, builder]
updated: 2026-09-25
admin_path: /admin/builder/<page id>
admin_menu: Landing Pages CMS → Create New Landing Page
source:
  - src/lib/classic-to-builder.ts
  - src/components/admin/create-builder-page.ts
  - src/lib/builder.ts
  - src/components/builder/BuilderBlocks.tsx
  - src/components/builder/BuilderPageView.tsx
  - src/components/admin/BuilderEditorClient.tsx
  - src/app/admin/builder/[id]/page.tsx
  - src/app/[slug]/page.tsx
  - src/styles/builder.css
  - src/lib/i18n/dict/builder.ts
---

# Page Builder (drag and drop)

## What it does for sales

Builds a sales page for anything (a product, a service, a trip) by dragging ready-made sections onto a page. Each section has one job, its "core value", shown in the editor. The editor shows the page exactly as a visitor sees it, in English or Khmer, on a phone or a desktop.

This started as the pilot of Phase 2 in [[Landing Page Builder Roadmap]]. Since 2026-09-25 **every page is edited here**, including the Vietnam page ([[Smart City Tea and Cafe Vietnam 2026]]). The old fixed layouts are no longer offered.

## How to use it

1. Admin → Landing Pages CMS → **Create New Landing Page** (also in the sidebar and dashboard). The page starts as a **draft** with a full sales page: Hero, Benefits, How it works, Offer card, FAQ and Final call to action. Replace the example text (a red number marks it).
2. Right panel, with no section selected: page name, web address, and the **Offer**: what is sold, price, previous price, currency ($ or ៛), offer end date, stock, and the button action (Telegram round robin or a link). Every section reads these facts, so they are typed once.
3. Drag a component from the left onto the page, or press **+** (it lands at the end, above the Final call to action). Drag sections to reorder them. Hover a section for move up/down, duplicate and delete.
4. Click a section to edit it: design (2 per component), colour theme, alignment, spacing, background photo, and the text in EN and KH. A red number shows tips (missing Khmer, sample text left, headline too long).
5. **Save** keeps it as it is. **Publish** makes it live at `/<web address>`. **Unpublish** hides it again (visitors get "not found").

Undo and redo cover the last 60 changes. The browser warns before leaving with unsaved changes.

**Top bar and screen fit** (since 2026-09-26): the bar with Save, Publish, Full preview and Page map stays at the top. On a computer the editor fits the screen height and each column (components, page, settings) scrolls on its own, so Save is always in view. On a phone or tablet the bar slides away while scrolling down and comes back on scrolling up.

**Keyboard shortcuts:** Ctrl+S (⌘S on Mac) saves, also while typing in a field. Outside text fields: Ctrl+Z undo, Ctrl+Shift+Z or Ctrl+Y redo, Esc deselects the section, Alt+↑ / Alt+↓ moves the selected section. The Save button's tooltip lists them.

## Brand & contact on this page

Page settings (no section selected) → **Brand & contact on this page**: this page's own logo, company name, phone, Telegram username, WhatsApp and email and address. An empty field uses the company settings (Settings → Company); the grey placeholder shows that value. They appear in the **Contact & company** section and on the printed agenda. The Telegram button of the page still goes to the next salesperson (round robin); only the contact section shows this username. Stored in the page's `isolatedSettings` (the same phone, Telegram and WhatsApp the old page editor used).

**Trip / event coordinator** (same group, or Landing Pages → the page → Dedicated settings → Communications → Dedicated Trip / Event Coordinator Profile): photo, name, title in English and Khmer, the coordinator's own phone and Telegram, and a short introduction (EN/KH). When a name is set it shows as a **Your coordinator** card on the printed agenda and in the Contact & company section, with tap-to-call and Telegram links. Leave the name empty, or turn off **Coordinator** under Show on this page, to hide it.

Also in that group (since 2026-09-26):
- **Show on this page:** turn off single lines (phone, Telegram, WhatsApp, email, address, the page link on the print). Hidden lines do not show in the Contact & company section or on the print.
- **Footer note** (EN/KH), for example office hours or a licence number, shown under the contact details and on the print.
- **Printed agenda: closing box**, a heading and text (EN/KH) that replace "Register or ask a question / Scan the QR code, or contact us…". Empty uses that default. The Entire page print uses the Final call to action instead when the page has one.

A Contact & company section may sit after the Final call to action; **+** adds it at the very bottom and the Page map treats it as the footer.

## Versions and protection against lost work (since 2026-09-26)

- **Autosave**, 4 seconds after the last change (the line under the top bar shows its state):
  - a **live** page gets a **backup copy** on the server; the live page changes only on **Save** or **Publish**;
  - a **draft** page is saved directly.
  - Backups are kept one per 2 minutes, the last 20 per page, and appear in **Versions** as "Auto-saved backup".
  - A copy also goes to this browser 1 second after each change. Reopening the editor with unsaved work offers **Restore / Discard**. Saving clears it.
- **Versions** (top bar): every save keeps the version it replaces (last 15 per page), plus the copy kept before an automatic content update. **Load into editor** puts a version in the editor as unsaved changes; check it, then **Save** (Undo also works). The live page does not change until you save.
- **Conflict guard:** each editor sends the version it opened. If the page was saved elsewhere since (another tab, or Landing Pages → the page → Dedicated settings), the save is refused with a message and a **Reload the latest version** button. Nothing is overwritten.
- The old page settings screen no longer sends a builder page's sections, so it cannot put back an older copy of them.
- A failed database read never writes the bundled sample page into the database any more (it used to, and that could wipe the owner's edits and photos). A save always merges over the latest stored page, and a failed database write shows "not saved".

Source: `src/lib/storage.ts` (`savePage`, `getPageHistory`, `PageConflictError`), `src/components/admin/BuilderVersions.tsx`, `src/app/api/pages/[id]/history/route.ts`.

## Full preview and Page map

- **Full preview** (top bar, next to the phone and computer buttons) shows the whole page over the full screen at a real computer width: **Laptop** 1280, **Desktop** 1440 or **Large screen** 1920 pixels. When the screen is narrower, the page is scaled down, so it keeps the computer layout. EN/ខ្មែរ switch inside. Close with the button or Esc. Buttons and the form do nothing in the preview.
- **Page map** (top bar) swaps the page for a list of small pictures of each section, in order. Drag a section or use the arrows to reorder; click one to edit it.
  - The **buyer's journey** strip: Attention (Hero) → Why (Benefits) → Details (What's included, Included & not included, How it works, Photo gallery) → Price (Offer card) → Sign up (Lead form) → Questions (FAQ) → Terms → Final push (Final call to action). Steps not on the page are faded.
  - Advice on each section: Hero not first, Final call to action not last, form or FAQ before the price, terms too early, explaining sections after the price (tip), no Hero or no form on the page.
  - **Suggested order** with **Use this order**: moves sections into the journey order; sections in the same step keep their order (Why and Details count as one step). Undo reverses it. The advice is guidance, not a rule: the owner decides.

Source: `src/lib/page-order.ts` (advice), `src/components/admin/BuilderPageMap.tsx`, `src/components/admin/BuilderFullPreview.tsx`.

## Components

| Component | Core value | Designs |
|---|---|---|
| Hero | Promise the result in one glance, with the main button on the first screen | Split with photo, Full photo |
| Offer card | Price, saving, stock bar and countdown, so the deadline is hard to miss | Card, Price banner |
| FAQ | Remove the doubts that stop people buying | Accordion, Two columns |
| Benefits | Answer "why should I care?" with the results the buyer gets; 24 icons to choose | Icon cards, Icon list |
| What's included | List exactly what the buyer gets | Checklist, Photo and list |
| How it works | Show buying is easy, in up to 8 steps (up to 1,000 characters each, line breaks kept, so a day of an itinerary fits); optional button | Numbered cards, Timeline |
| Lead form | Catch buyers who will not chat first | Form card, Offer and form |
| Final call to action | Close the page with the offer, countdown and button again | Centered, Split box |
| Included & not included | Show what the price covers and what it does not (flights, visa, personal spending…), so buyers compare fairly and nobody is surprised after paying; up to 30 items per list, each list's heading can be renamed, an empty list is hidden | Two columns (one under the other on a phone), One card |
| Contact & company | Show who is behind the offer: logo, company name, phone, Telegram, WhatsApp, email and address, each a tap-to-contact button. It uses the page's Brand & contact details, else the company settings; empty details are hidden | Footer, Contact card |
| Terms & Conditions | State payment, cancellation and refund rules up front, so there are no surprises after booking; up to 30 clauses, a **Last updated** date and a short note | Accordion, Full document |

The saving (for example "Save 25%") shows only when the previous price is higher than the price. The countdown hides itself when the date passes. Only use a real previous price and real stock: see [[Copy Rules]].

## Pricing, language and extra options

- **Early-bird price:** page settings → Offer → "Early-bird price" and "until". Before the date the price card shows the early-bird price with the normal price struck through and an "Early-bird price ends in" countdown; after it, the normal price and the offer countdown, with no edit needed.
- **Countdown heading:** for example "Registration closes in".
- **Language visitors see first:** English or ខ្មែរ per page. `?lang=en` or `?lang=kh` in a link overrides it.
- **Benefit links:** each benefit can link to a website ("Official website"), used for trade fairs.
- **Choice question on the lead form:** for example "Which sector interests you?". The answer is saved with the lead (`eventType`).
- **Button to a t.me link** counts as Telegram (icon and tracking).

## Feature image

Every campaign page has one **feature image**: the photo that stands for the page in Admin → Landing Pages CMS, on the home page's campaign list and in link previews on Facebook and Telegram (large card). Set it in the builder's page settings (click an empty spot of the page) or, for classic pages, in the editor's SEO tab ("Feature image"). Best size 1200 × 630.

- It is stored in the page's `ogImage` field.
- Until one is chosen, the first photo on the page is used (classic hero cover; builder hero photo, a section background, the first gallery photo or the offer photo). A page with no photo at all shows **No feature image** on its card in the page list.
- Link previews use the full address (`https://sale.khbevents.com/...`), which Facebook and Telegram need.

Suggested feature images ship in `content/feature-images.json` (`{ "<slug>": "<image address>" }`). The production build applies each suggestion once, and only to a page that has no feature image yet, so an image chosen in the admin is never replaced.

Source: `src/lib/feature-image.ts`, `featureImageDecision` in `src/lib/content-pack.ts`.

## Photos and animation

**Photos inside components** (select the component, then its content panel):

| Component | Photo |
|---|---|
| Benefits | Each item can have a photo; it replaces the icon |
| How it works | Each step can have a photo |
| Offer card | A product photo at the top of the card (beside the price in the banner) |
| FAQ | A photo beside the questions on computers, above them on phones |
| Lead form | A photo above the form, or beside the price in the "Offer and form" design |
| Hero, What's included | Already had a photo |

**Photo gallery** (component 9): designs **Photo grid** (the layout adapts to the number of photos so rows are always full) and **Sliding carousel** (swipe, or arrows). Add photos by upload, drag and drop or the photo library; drag to reorder; each photo can have a caption in EN and KH. Visitors can tap a photo to see it full screen (arrows and Esc work). A gallery without photos is not shown to visitors.

**Entrance animation** (Design → Entrance animation): Rise (default), Fade, Zoom, Slide or None, per section. The section animates when it scrolls into view and its cards and list items follow one after another; the hero animates on load. Clicking an option in the editor replays it. Cards lift and photos zoom gently under the mouse; the stock bar fills when it appears. Visitors whose device is set to reduce motion see no animation, and pages without JavaScript show everything.

Source: `src/components/builder/BuilderBlocks.tsx` (`useSectionReveal`, `Gallery`), `src/styles/builder.css`.

## Background video

Every section can play a silent, looping video behind its text: select the section → Design → **Background video**.

| Source | How | Notes |
|---|---|---|
| Upload | **Upload** beside the field: MP4, WebM or MOV, up to 50 MB | Plays most smoothly. Sent from the browser straight to Supabase Storage (bucket `page-videos`, created on the first upload), so Vercel's 4.5 MB limit does not apply |
| YouTube | Paste the link, a Shorts link or the embed code | Muted, looped, no controls; plays smoothly |
| Vimeo | Paste the link (unlisted links keep their code) or the embed code | Uses Vimeo's background mode |
| Facebook | Paste a video or reel link, or the embed code | May show Facebook's own buttons and may not play on some phones |
| TikTok | Paste a video link or the embed code | Vertical; may show TikTok's buttons and may not play on some phones |
| Video file link | Any https link ending in .mp4 or .webm | Hosted elsewhere |

- Anything else (another site's embed code, a normal web page) is refused, so an embed can never put an unknown site inside the page.
- The video covers the whole section without black bars and is darkened like a background photo. Choose **Dark** or **Brand** colours so the text stays readable.
- The **Background photo** is the poster: it shows while the video loads, and instead of the video for visitors whose phone or computer is set to reduce motion.
- Short (10 to 30 seconds), calm clips work best. A video uses mobile data; keep uploads small.
- **On phones** (since 2026-09-25) an uploaded video starts by itself on most phones. Some phones block autoplay: the in-app browsers of Telegram, Facebook, Messenger and Instagram on Android, iPhone Low Power Mode and Android Data Saver. There the photo shows, and the video starts at the visitor's first tap anywhere on the page. Videos pause when scrolled off screen, to save battery and data.
- **Upload MP4.** MOV files from an iPhone often do not play on Android phones, and the editor warns when one is used. Export or share the clip as MP4 (H.264) instead.

Source: `src/lib/video-embed.ts` (accepted sources), `src/components/builder/BackgroundVideo.tsx` (phone playback), `src/app/api/uploads/video/route.ts` (upload), `src/components/admin/VideoField.tsx`.

## Public page

- The Telegram button goes through `/api/round-robin?page=<web address>&redirect=true`, so leads are shared fairly. See [[Round Robin]].
- EN / ខ្មែរ switch at the top; missing Khmer falls back to English. See [[Languages]].
- Tracking (page views, button clicks with placement `builder_<component>`) and popups work as on other pages. See [[Tracking and Analytics]], [[Ads and Popups]].

## Lead form

- Asks name and phone (always), and optionally email and a message. The visitor's page language is saved with the lead.
- Sends to the same place as other page forms: the lead appears in Leads & CRM Pipeline and goes to the next salesperson in [[Round Robin]] (a returning visitor stays with the same salesperson).
- After sending: a thank-you message and, when the page button is Telegram, a "Continue on Telegram" button. Popups set to hide after a lead stop showing.
- Tracking records `form_submit` with the placement only, never the name or phone. See [[Leads CRM]].
- **Ask visitors to agree to the Terms & Conditions** (form content panel, since 2026-09-26): adds a tick box that must be ticked before sending. Its label can be changed in EN and KH, and it links to the page's Terms & Conditions section when there is one. The lead records when the visitor agreed and the terms' **Last updated** date (the version), shown in the lead's details in Leads & CRM Pipeline.

## Terms & Conditions

- Add it from the component library. The starter clauses (booking and payment, cancellation and refunds, programme changes, travel documents) are placeholders only: the editor flags "sample text left" until they are replaced. Write the real terms and have them checked before publishing; never copy terms from another company.
- Change the **Last updated** date whenever the terms change: leads keep the date they agreed to.
- Printing: **Entire page** includes the terms; the **Agenda** leaves them out.

Source: `src/lib/builder.ts` (`TermsBlock`), `src/components/builder/BuilderBlocks.tsx` (`Terms`, `LeadFormBlock`).

## Pages made from a content pack

A builder page can also ship as a content pack (`content/pages/<slug>.json` with `template: builder` and a `builder` document), like [[Korea Sourcing Trip Seoul 2026]]. It is applied once per file version on the production build. After that, edit the page in the builder: a new version of the pack file would replace the builder edits.

## How it is stored

A builder page is a normal landing page with `template: builder` and a `builder` document (offer, brand colour, list of sections). In Supabase it sits in the page's `form_config._extra`, so no database migration was needed. Input is cleaned on save (`normalizeBuilderDoc`): unsafe links are dropped and at most 40 sections are kept.

## Limits of the pilot

- No gallery, packages, guarantee or about-us components yet.
- The classic Smart City page cannot be opened in the builder.

Related: [[Landing Pages CMS]], [[Landing Page Builder Roadmap]].

## Moving an old page to the builder

A page still on an old fixed layout shows **Move to drag-and-drop** at the top of its old editor. The conversion is in `src/lib/classic-to-builder.ts` and moves only what the page already says:

- **Text:** the hero, value, problem and audience cards, what is included, itinerary (as a timeline), photos, guarantee, form, FAQ and Khmer translation.
- **Numbers:** price, early-bird price and date, registration deadline and seats, from the page's own admin settings.

Dates without a time zone count as Cambodia time. A content pack can do the same on the next production build with `"convertToBuilder": true` (see [[Content Packs]]).

For a builder page, the old editor keeps only **SEO & Social**, **Tracking & Pixels** and **Dedicated Settings**. Everything else is edited in the builder.

## Printing

Every builder page has a printable agenda with a QR code: see [[Print Agenda]].
