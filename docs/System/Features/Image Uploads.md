---
type: feature
tags: [system, feature, images, uploads]
updated: 2026-09-24
admin_path: /admin/pages
admin_menu: Landing Pages CMS → Photo Library, and every image field
source:
  - src/lib/uploads.ts
  - src/lib/image-upload-client.ts
  - src/app/api/uploads/route.ts
  - src/app/api/uploads/[name]/route.ts
  - src/components/admin/ImageField.tsx
  - src/components/admin/ImageManager.tsx
  - src/components/admin/MediaLibrary.tsx
  - src/app/admin/media/page.tsx
  - src/lib/media-library.ts
  - src/lib/upload-store.ts
  - src/components/admin/PageEditor.tsx
  - src/components/admin/IsolatedSettingsEditor.tsx
  - src/components/admin/AdsManagerClient.tsx
  - src/lib/i18n/dict/ads.ts
  - next.config.ts
---

# Image Uploads

## What it does for sales

Good photos sell trips. Any image on a page or popup can be uploaded straight from the admin, from a phone or a computer. There is no need to ask a developer or to host the picture somewhere else. The portal shrinks each photo before upload, so pages stay fast on mobile data.

The owner will provide real outcome photos later. Until then, use only photos we have the right to use, and never present a stock or unrelated photo as a past KHB trip. See [[Copy Rules]].

## Where it is in the admin

Every image field has an upload button next to the address box ("Paste an image URL or upload").

| Screen | Field | Longest side after shrinking |
|---|---|---|
| Page editor → Hero Section | **Hero slideshow photos** (several; the first is the cover) | 1920 px |
| Page editor → Visual Gallery | **Photos in order** (the same list as the hero slideshow) | 1920 px |
| Page editor → SEO & Social | **Social share image (Facebook, Telegram link preview)** | 1920 px |
| Page editor → Artists | Artist **Photo** | 1200 px |
| Page editor → Speakers | Speaker **Portrait** | 800 px |
| Page editor → Dedicated Settings | **Coordinator photo** | 512 px |
| Page editor → Dedicated Settings | **Partner logo** | 800 px |
| Page editor → Dedicated Settings | KHQR **QR code image** | 1200 px |
| Ads & Popups → Content | **Picture (optional)** | 1600 px |

## Photo Library (add, view, rename, delete)

Admin → Landing Pages CMS → **Photo Library** (`/admin/media`) lists every uploaded photo. The same library opens inside the page editor (under the photo list) and from the **library button** beside every single image field, including the drag and drop builder.

| Action | How | What happens |
|---|---|---|
| Add | **Upload to library**, or drop image files on the library | Shrunk and stored like any upload |
| Find | Search box: matches the display name or the file name | |
| View | Click a photo on the library page, or the open icon | Opens full size in a new tab |
| Use | In a picker, click a photo | Added to the page or field; photos already used there show **Added** |
| Rename | Pencil icon, or click the name; Enter saves, Esc cancels | Changes only the name shown in the library. The file and its address stay the same, so pages keep working |
| Delete | Bin icon | Deletes the file. If a page or popup still shows it, the library lists them and asks **Delete anyway** or **Cancel** |

A green **Used N×** tag shows how many pages and popups contain the photo (drafts included). Preset photos from the site itself are marked **Preset** and cannot be renamed or deleted here.

## How to use it

For one image:

- [ ] Click the upload button beside the field, or paste an image address.
- [ ] Wait for the preview. The field now holds the uploaded image's address.
- [ ] Save the page or popup.

For the hero slideshow and gallery:

- [ ] Click **Upload images** (several at once), or drop files onto the box, or click a photo in the **Library** below it.
- [ ] Drag photos, or use **Move earlier** / **Move later**, to set the order.
- [ ] Use **Make cover** for the photo that opens the slideshow.
- [ ] **Remove photo** takes it off this page only; the file stays in the library.
- [ ] Save the page.

## Key rules and defaults

| Rule | Value | Source |
|---|---|---|
| Storage | Supabase Storage bucket `page-images`, public read, created on first upload | `src/lib/uploads.ts` |
| Largest file accepted | 4 MB (Vercel rejects request bodies above 4.5 MB) | `MAX_UPLOAD_BYTES` |
| Accepted types | JPEG, PNG, WebP, GIF, AVIF. SVG is refused on purpose, because it can carry scripts | `ALLOWED_IMAGE_TYPES` |
| Shrinking in the browser | Longest side at most 1920 px by default; saved as WebP at quality 0.85, or JPEG if WebP is unavailable | `src/lib/image-upload-client.ts` |
| Small PNGs | PNGs under 400 KB stay PNG, so logos and QR codes keep crisp edges | same |
| GIFs | Sent as they are, so animation is kept | same |
| File names | `<time>-<random>-<cleaned name>.<type>`. The original name is only a readable hint, and the extension comes from the file's MIME type, not its name | `safeUploadName` |
| Library | Uploaded files newest first (up to 1000), plus preset photos | `src/lib/upload-store.ts`, `MediaLibrary.tsx` |
| Display names | Stored as the `media_library` JSON row in `system_settings` (locally in `data/db.json`), keyed by file name, 80 characters at most | `src/lib/media-library.ts` |
| Rename and delete | `PATCH` / `DELETE /api/uploads/<file name>`, admins only; only names the upload route creates are accepted | `src/app/api/uploads/[name]/route.ts` |
| Who can upload | Logged-in admins only | `requireAdmin` |

## How it works

1. The admin picks a file. `prepareForUpload` shrinks and re-encodes it in the browser.
2. The browser sends it to `POST /api/uploads`.
3. The server checks the type and size, gives it a safe name and stores it in the `page-images` bucket. It returns the public address, which the field saves on the page.
4. `GET /api/uploads` lists the library with display names and where each photo is used.

Without Supabase (local development) files go to `public/uploads` and are served by `/api/uploads/<name>`.

## Limits and gotchas

- Uploads on Vercel need `SUPABASE_SERVICE_ROLE_KEY` set in the Vercel environment variables. Without it the upload fails with "Image storage is not configured". The public anon key cannot write to storage.
- Deleting a photo from a page does not delete the file from the bucket.
- Old image links under `/photos/` are redirected to `/images/events/` (`next.config.ts`), because saved pages may still use them.
- Keep big originals out of `docs/Attachments`; the vault is in git. See [[How to Use This Vault]].

## Related

- Features: [[Landing Pages CMS]], [[Ads and Popups]], [[Admin and Security]]
- Runbooks: [[Launch a New Trip Page]], [[Create a Popup]]
- Map: [[System Map]]

- Staff photos in Staff Round Robin use the same upload (shrunk to 400 px) and count as "in use" in the photo library. See [[Round Robin]].
