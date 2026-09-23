/**
 * Digits for a wa.me link. Visitors usually type Cambodian numbers in local
 * form (012 345 678), which WhatsApp cannot open, so local numbers get the
 * 855 country code. Numbers already in international form are kept.
 */
export function toWhatsAppNumber(phone: string | undefined | null): string {
  const raw = (phone || '').trim();
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (raw.startsWith('+') || digits.startsWith('855')) return digits;
  if (digits.startsWith('0')) return `855${digits.slice(1)}`;
  // 8–9 digits without a trunk 0 is still a Cambodian mobile number (12 345 678).
  if (digits.length === 8 || digits.length === 9) digits = `855${digits}`;
  return digits;
}
