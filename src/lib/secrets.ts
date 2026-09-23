/**
 * Placeholder shown instead of a stored secret (e.g. the Telegram bot token)
 * in admin forms. Sending it back means "keep the current value".
 */
export const MASKED_SECRET = '••••••••';

export function maskSecret(value: string | undefined | null): string {
  return value ? MASKED_SECRET : '';
}

/** True when a submitted form field still holds the placeholder (value unchanged). */
export function isMaskedSecret(value: unknown): boolean {
  return value === MASKED_SECRET;
}
