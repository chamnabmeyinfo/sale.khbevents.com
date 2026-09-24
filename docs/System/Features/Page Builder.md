---
type: feature
tags: [system, feature, landing-pages, builder]
updated: 2026-09-24
admin_path: /admin/builder/<page id>
admin_menu: Landing Pages CMS → New drag & drop page
source:
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

This is the pilot of Phase 2 in [[Landing Page Builder Roadmap]]. The Smart City page still uses the classic editor in [[Landing Pages CMS]].

## How to use it

1. Admin → Landing Pages CMS → **New drag & drop page**. The page starts as a **draft** with a Hero, an Offer card and an FAQ.
2. Right panel, with no section selected: page name, web address, and the **Offer**: what is sold, price, previous price, currency ($ or ៛), offer end date, stock, and the button action (Telegram round robin or a link). Every section reads these facts, so they are typed once.
3. Drag a component from the left onto the page, or press **+**. Drag sections to reorder them. Hover a section for move up/down, duplicate and delete.
4. Click a section to edit it: design (2 per component), colour theme, alignment, spacing, background photo, and the text in EN and KH. A red number shows tips (missing Khmer, sample text left, headline too long).
5. **Save** keeps it as it is. **Publish** makes it live at `/<web address>`. **Unpublish** hides it again (visitors get "not found").

Undo and redo cover the last 60 changes. The browser warns before leaving with unsaved changes.

## Components in the pilot

| Component | Core value | Designs |
|---|---|---|
| Hero | Promise the result in one glance, with the main button on the first screen | Split with photo, Full photo |
| Offer card | Price, saving, stock bar and countdown, so the deadline is hard to miss | Card, Price banner |
| FAQ | Remove the doubts that stop people buying | Accordion, Two columns |

The saving (for example "Save 25%") shows only when the previous price is higher than the price. The countdown hides itself when the date passes. Only use a real previous price and real stock: see [[Copy Rules]].

## Public page

- The Telegram button goes through `/api/round-robin?page=<web address>&redirect=true`, so leads are shared fairly. See [[Round Robin]].
- EN / ខ្មែរ switch at the top; missing Khmer falls back to English. See [[Languages]].
- Tracking (page views, button clicks with placement `builder_<component>`) and popups work as on other pages. See [[Tracking and Analytics]], [[Ads and Popups]].

## How it is stored

A builder page is a normal landing page with `template: builder` and a `builder` document (offer, brand colour, list of sections). In Supabase it sits in the page's `form_config._extra`, so no database migration was needed. Input is cleaned on save (`normalizeBuilderDoc`): unsafe links are dropped and at most 40 sections are kept.

## Limits of the pilot

- Only three components. Benefits, gallery, how it works, guarantee and a lead form are next.
- No form section yet; the page sells through the button action.
- The classic Smart City page cannot be opened in the builder.

Related: [[Landing Pages CMS]], [[Landing Page Builder Roadmap]].
