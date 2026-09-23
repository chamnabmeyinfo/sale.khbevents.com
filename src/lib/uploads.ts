import { randomBytes } from 'node:crypto';

/** Supabase Storage bucket that holds admin-uploaded page images. Public read, service-role write. */
export const UPLOAD_BUCKET = 'page-images';

/**
 * Vercel functions reject request bodies above 4.5 MB, and the admin downscales photos
 * to at most 1920px before sending, so 4 MB leaves headroom for the multipart envelope.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

/** Raster image types the upload route accepts. SVG is excluded on purpose (it can carry scripts). */
export const ALLOWED_IMAGE_TYPES = Object.keys(EXTENSIONS);

export function isAllowedImageType(mime: string): boolean {
  return mime in EXTENSIONS;
}

/**
 * A storage file name the client cannot influence beyond a readable hint:
 * `<time>-<random>-<slug>.<ext>`, extension taken from the MIME type, never from the name.
 */
export function safeUploadName(originalName: string, mime: string, now: number = Date.now()): string {
  const ext = EXTENSIONS[mime] ?? 'bin';
  const base = originalName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image';
  return `${now.toString(36)}-${randomBytes(4).toString('hex')}-${base}.${ext}`;
}
