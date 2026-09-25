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
