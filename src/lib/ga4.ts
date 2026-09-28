/**
 * Google Analytics 4 measurement IDs ("G-" and letters/digits). Not secret: they are
 * printed in every page that loads Google Analytics.
 */
const GA4_ID_RE = /^G-[A-Z0-9]{4,20}$/;

/** '' for an empty value, the cleaned ID when valid, null when it is not a GA4 measurement ID. */
export function normalizeGa4Id(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const clean = value.trim().toUpperCase();
  if (!clean) return '';
  return GA4_ID_RE.test(clean) ? clean : null;
}
