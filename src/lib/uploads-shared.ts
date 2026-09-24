/**
 * Upload limits the browser also needs. Client-safe: no Node imports.
 */

/** Supabase Storage bucket for background videos. Public read, service-role signed uploads. */
export const VIDEO_BUCKET = 'page-videos';

/**
 * Videos go from the browser straight to storage through a signed upload URL, so
 * Vercel's 4.5 MB request limit does not apply. 50 MB matches Supabase's default
 * per-file limit; a 20 to 40 second 1080p clip fits easily.
 */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const VIDEO_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export const ALLOWED_VIDEO_TYPES = Object.keys(VIDEO_EXTENSIONS);

export function isAllowedVideoType(mime: unknown): mime is string {
  return typeof mime === 'string' && mime in VIDEO_EXTENSIONS;
}

/** Names the video routes create and serve. */
export const VIDEO_NAME = /^[a-z0-9][a-z0-9-]*\.(mp4|webm|mov)$/;
