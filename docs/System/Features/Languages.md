---
type: feature
tags: [system, feature, i18n, khmer]
updated: 2026-09-24
admin_path: /admin/settings#appearance
admin_menu: Settings & Security → Theme & Display → Portal language
source:
  - src/lib/i18n/index.ts
  - src/lib/i18n/dict
  - src/context/LanguageContext.tsx
  - src/components/common/LanguageSwitcher.tsx
  - src/lib/use-browser-state.ts
  - src/app/layout.tsx
  - src/app/[slug]/page.tsx
  - src/components/landing/Navbar.tsx
  - src/components/landing/SmartCityLandingPageView.tsx
  - src/components/landing/smart-city-content.ts
  - src/components/admin/KhmerTranslationEditor.tsx
  - src/components/common/PopupAds.tsx
  - src/lib/popup-ads.ts
  - src/lib/round-robin.ts
---

# Languages

## What it does for sales

Most of our customers read Khmer first. The portal speaks English and Khmer in two places:

1. **Public pages.** A visitor can read a landing page in Khmer. Ads can link straight to the Khmer version.
2. **The admin.** Every admin screen can be shown in Khmer, so sales staff can work in their own language.

Writing rules for Khmer copy: [[Copy Rules]]. Shared terms: [[Glossary]].

## Public pages

| How | Effect |
|---|---|
| Add `?lang=kh` to a page link | Opens the Smart City page in Khmer, including the page title and description used in link previews. On other pages only the title, description and popups change (see limits below) |
| Add `?lang=en` | Forces English |
| The language switch on the page | Changes the language and remembers the choice in the visitor's browser under `khb_lang` |

- Without `?lang=`, the Smart City page opens in English. Use `?lang=kh` in Khmer ads.
- Khmer text uses the fonts Kantumruy Pro and Hanuman.
- Popups follow the page language. Each popup's Khmer text falls back to English when empty. See [[Ads and Popups]].

### Where the Khmer page text comes from

| Page | Khmer source |
|---|---|
| Any CMS page | The **ភាសាខ្មែរ (Khmer)** tab in the page editor ([[Landing Pages CMS]]): title, subtitle, description, badge, hero texts, venue, urgency notice, risk note, core values, problems, audiences, itinerary, value stack, guarantee, FAQs, SEO title and description |
| Smart City page, built-in copy | `src/components/landing/smart-city-content.ts` (English and Khmer side by side). It feeds the Smart City content pack. See [[Content Packs]] |

When a Khmer field in the CMS is empty, the Smart City page falls back to its built-in Khmer copy.

## The admin (portal-wide language)

| How | Where |
|---|---|
| EN / ខ្មែរ switch | Top bar of every admin page, and on the login pages |
| Portal language | **Admin → Settings & Security → Theme & Display** |

- The choice is saved in this browser only (`khb_admin_lang`). Each device chooses for itself.
- The admin switch also writes `khb_lang`, so it changes the stored language of the public pages in the same browser too.
- In Khmer mode the page gets `lang="km"` and a Khmer font.

### How it works

- All admin text lives in dictionaries in `src/lib/i18n/dict/`, one file per screen (`common`, `nav`, `login`, `dashboard`, `pages`, `leads`, `settings`, `round-robin`, `ads`, `guide`, `editor`, `editor-extras`, `auth`). Each file has an `en` block and a `kh` block.
- `src/lib/i18n/index.ts` merges them. `LanguageProvider` in `src/context/LanguageContext.tsx` (mounted in `src/app/layout.tsx`) gives every screen a `t('key')` function.
- **Fallback:** a missing Khmer text shows the English text; a missing key shows the key itself. A half-translated screen never breaks.
- Text can hold placeholders like `{n}` or `{name}`, filled in by the screen.

## How to add or change a translation

For an admin label:

- [ ] Find the key. Search `src/lib/i18n/dict/` for the English text you see on screen.
- [ ] Change the text in the `kh` block (or the `en` block) of that file. Keep placeholders such as `{n}` unchanged.
- [ ] For a new label, add the same key to both `en` and `kh`, then use `t('your.key')` in the screen.
- [ ] For a new screen, create a new file in `dict/` and add it to the list in `src/lib/i18n/index.ts`.
- [ ] Check it with [[Verify Changes Locally]], then [[Deploy to Production]].

For page content, no code is needed: edit the **ភាសាខ្មែរ (Khmer)** tab of the page and save.

Telegram lead cards have their own language choice per salesperson (Khmer, English or Compact). See [[Round Robin]].

## Limits and gotchas

- At the time of writing, the generic page view (`DynamicLandingPageView.tsx`) used by pages other than the Smart City page does not show the Khmer tab's text. Its language switch reloads the page with `?lang=`, which only changes the page title and description. Check this before promising a Khmer version of a new trip page.
- The `?view=app` and `?view=optin` Smart City layouts read `?lang=kh` too.

## To confirm

- A Khmer translation of the whole admin was added. A native Khmer speaker should review the wording. Who reviews it, and by when? (See [[Open Tasks]].)
