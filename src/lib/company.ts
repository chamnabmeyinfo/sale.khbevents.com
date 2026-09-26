import type { IsolatedPageSettings, SystemSettings } from './types';

/** The built-in logo, used until the owner uploads one. */
export const DEFAULT_LOGO = '/images/khb-logo.png';

/** Logo, name and public contact details shown on a page, its print and the admin. */
export interface CompanyInfo {
  logo: string;
  name: string;
  tagline?: string;
  phone?: string;
  /** Digits only, for wa.me links. */
  whatsapp?: string;
  /** Without the @. */
  telegram?: string;
  email?: string;
  address?: string;
}

const clean = (v: unknown, max = 300): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const s = v.trim().slice(0, max);
  return s || undefined;
};

/** Only uploaded images, site paths and https links can be a logo. */
export const safeLogo = (v: unknown): string | undefined => {
  const s = clean(v, 1000);
  return s && /^(\/(?!\/)|https:\/\/)\S+$/.test(s) ? s : undefined;
};

/**
 * The company details for one page: each field the page sets itself wins, the rest
 * comes from Settings → Company. Without a page, the company settings alone.
 */
export function companyFor(settings: Partial<SystemSettings> | undefined, page?: { isolatedSettings?: IsolatedPageSettings } | null): CompanyInfo {
  const s = settings || {};
  const p = page?.isolatedSettings || {};
  const telegram = clean(p.telegramUsername) || clean(s.telegramUsername);
  const whatsapp = (clean(p.whatsappNumber) || clean(p.whatsapp) || clean(s.whatsappNumber))?.replace(/[^0-9]/g, '');
  return {
    logo: safeLogo(p.logoUrl) || safeLogo(s.logoUrl) || DEFAULT_LOGO,
    name: clean(p.companyName, 120) || clean(s.companyName, 120) || 'KHB Events',
    tagline: clean(s.brandTagline, 160),
    phone: clean(p.phone, 60) || clean(s.phone, 60),
    whatsapp: whatsapp || undefined,
    telegram: telegram?.replace(/^@/, '') || undefined,
    email: clean(p.email, 160) || clean(s.email, 160),
    address: clean(p.address) || clean(s.address),
  };
}
