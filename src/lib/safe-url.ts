/**
 * The URL if it is safe to send a visitor to (http/https, or a site-relative
 * path), otherwise null. Blocks javascript:, data: and protocol-relative URLs
 * that an admin-entered "redirect after submit" value could otherwise carry.
 */
export function safeRedirectUrl(url: string | undefined | null): string | null {
  const value = (url || '').trim();
  if (!value) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}
