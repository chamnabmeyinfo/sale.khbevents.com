import type { ContactLine, IsolatedPageSettings, SystemSettings } from './types';

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
  /** Show the page's web address (print). */
  website: boolean;
  /** The page's footer note, EN/KH. */
  note?: { en: string; kh?: string };
  /** The page's trip / event coordinator, when a name is set and not hidden. */
  coordinator?: Coordinator;
}

export interface Coordinator {
  name: string;
  role?: { en: string; kh?: string };
  photo?: string;
  phone?: string;
  /** Without the @. */
  telegram?: string;
  bio?: { en: string; kh?: string };
}

export const CONTACT_LINES: ContactLine[] = ['coordinator', 'phone', 'telegram', 'whatsapp', 'email', 'address', 'website'];

const bi = (v: unknown): { en: string; kh?: string } | undefined => {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  const en = clean(o.en, 300) || '';
  const kh = clean(o.kh, 300);
  return en || kh ? { en: en || kh || '', ...(kh ? { kh } : {}) } : undefined;
};
/** A page's EN/KH text setting, or undefined when empty. */
export const pageText = bi;

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
  const whatsapp = (clean(p.whatsapp) || clean(p.whatsappNumber) || clean(s.whatsappNumber))?.replace(/[^0-9]/g, '');
  const hidden = new Set(Array.isArray(p.contactHidden) ? p.contactHidden : []);
  const show = <T,>(line: ContactLine, v: T): T | undefined => (hidden.has(line) ? undefined : v);
  return {
    logo: safeLogo(p.logoUrl) || safeLogo(s.logoUrl) || DEFAULT_LOGO,
    name: clean(p.companyName, 120) || clean(s.companyName, 120) || 'KHB Events',
    tagline: clean(s.brandTagline, 160),
    phone: show('phone', clean(p.phone, 60) || clean(s.phone, 60)),
    whatsapp: show('whatsapp', whatsapp || undefined),
    telegram: show('telegram', telegram?.replace(/^@/, '') || undefined),
    email: show('email', clean(p.email, 160) || clean(s.email, 160)),
    address: show('address', clean(p.address) || clean(s.address)),
    website: !hidden.has('website'),
    note: bi(p.footerNote),
    coordinator: hidden.has('coordinator') ? undefined : coordinatorOf(p),
  };
}

function coordinatorOf(p: IsolatedPageSettings): Coordinator | undefined {
  const name = clean(p.coordinatorName, 120);
  if (!name) return undefined;
  const roleEn = clean(p.coordinatorRole, 120);
  const roleKh = clean(p.coordinatorRoleKh, 120);
  return {
    name,
    role: roleEn || roleKh ? { en: roleEn || roleKh || '', ...(roleKh ? { kh: roleKh } : {}) } : undefined,
    photo: safeLogo(p.coordinatorAvatar),
    phone: clean(p.coordinatorPhone, 60),
    telegram: clean(p.coordinatorTelegram, 60)?.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '') || undefined,
    bio: bi(p.coordinatorBio),
  };
}
