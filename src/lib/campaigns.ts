/**
 * Marketing campaigns: an ad or a post that sends people to one landing page.
 * A campaign gives staff clean tracked links (utm_source, utm_medium, utm_campaign,
 * utm_content per ad), a QR code, and a place to write down what was spent, so the
 * report can show cost per lead and per customer. Stored as one JSON row (`campaigns`).
 * Pure helpers; storage in storage.ts, screen in Admin → Campaigns.
 */

export type CampaignChannel = 'facebook' | 'instagram' | 'messenger' | 'tiktok' | 'telegram' | 'google' | 'youtube' | 'print' | 'other';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended';

export interface CampaignAd {
  id: string;
  /** Shown to staff and sent as utm_content, e.g. "video-1" or "carousel-price". */
  name: string;
  content: string;
}

export interface CampaignSpend {
  /** YYYY-MM-DD */
  date: string;
  amount: number;
  note?: string;
}

export interface Campaign {
  id: string;
  name: string;
  /** Sent as utm_campaign; lower-case letters, digits and dashes. */
  slug: string;
  pageSlug: string;
  channel: CampaignChannel;
  /** utm_source and utm_medium; defaults come from the channel. */
  source: string;
  medium: string;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  /** Planned budget in USD. */
  budget?: number;
  spend: CampaignSpend[];
  ads: CampaignAd[];
  /** Who it targets, what the ad says: context for the AI analyst. */
  audience?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const CHANNELS: Record<CampaignChannel, { source: string; medium: string }> = {
  facebook: { source: 'facebook', medium: 'paid_social' },
  instagram: { source: 'instagram', medium: 'paid_social' },
  messenger: { source: 'messenger', medium: 'paid_social' },
  tiktok: { source: 'tiktok', medium: 'paid_social' },
  telegram: { source: 'telegram', medium: 'social' },
  google: { source: 'google', medium: 'cpc' },
  youtube: { source: 'youtube', medium: 'video' },
  print: { source: 'print', medium: 'qr' },
  other: { source: 'other', medium: 'referral' },
};
export const CHANNEL_IDS = Object.keys(CHANNELS) as CampaignChannel[];
export const STATUSES: CampaignStatus[] = ['draft', 'active', 'paused', 'ended'];

export function slugify(v: string, max = 60): string {
  return v
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const money = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined;
};
const newId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Cleans a campaign from the admin screen. Returns null when it has no name or page. */
export function normalizeCampaign(input: unknown, nowIso: string, existing?: Campaign): Campaign | null {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const name = str(o.name, 120);
  const pageSlug = str(o.pageSlug, 200);
  if (!name || !/^[a-z0-9-_]{1,200}$/.test(pageSlug)) return null;
  const channel = (CHANNEL_IDS as string[]).includes(o.channel as string) ? (o.channel as CampaignChannel) : 'facebook';
  const slug = slugify(str(o.slug, 80) || name) || newId('c');
  const def = CHANNELS[channel];
  const ads: CampaignAd[] = (Array.isArray(o.ads) ? o.ads : []).slice(0, 30).flatMap((raw) => {
    const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const adName = str(a.name, 80);
    if (!adName) return [];
    return [{ id: str(a.id, 40) || newId('ad'), name: adName, content: slugify(str(a.content, 80) || adName) || 'ad' }];
  });
  const spend: CampaignSpend[] = (Array.isArray(o.spend) ? o.spend : []).slice(0, 400).flatMap((raw) => {
    const x = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const amount = money(x.amount);
    const date = str(x.date, 10);
    if (amount === undefined || !DAY.test(date)) return [];
    const note = str(x.note, 120);
    return [{ date, amount, ...(note ? { note } : {}) }];
  });
  const day = (v: unknown) => (DAY.test(str(v, 10)) ? str(v, 10) : undefined);
  return {
    id: existing?.id || str(o.id, 40) || newId('c'),
    name,
    slug,
    pageSlug,
    channel,
    source: slugify(str(o.source, 40)) || def.source,
    medium: slugify(str(o.medium, 40)).replace(/-/g, '_') || def.medium,
    status: (STATUSES as string[]).includes(o.status as string) ? (o.status as CampaignStatus) : 'active',
    startDate: day(o.startDate),
    endDate: day(o.endDate),
    budget: money(o.budget),
    spend: spend.sort((a, b) => a.date.localeCompare(b.date)),
    ads,
    audience: str(o.audience, 500) || undefined,
    notes: str(o.notes, 1000) || undefined,
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
  };
}

export function parseCampaigns(raw: string | null | undefined): Campaign[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((c) => c && typeof c.id === 'string' && typeof c.slug === 'string') : [];
  } catch {
    return [];
  }
}

/** The tracked link for a campaign (and one ad of it). */
export function campaignLink(origin: string, c: Pick<Campaign, 'pageSlug' | 'slug' | 'source' | 'medium'>, ad?: Pick<CampaignAd, 'content'>, lang?: 'kh' | 'en'): string {
  const q = new URLSearchParams({ utm_source: c.source, utm_medium: c.medium, utm_campaign: c.slug });
  if (ad?.content) q.set('utm_content', ad.content);
  if (lang === 'kh') q.set('lang', 'kh');
  return `${origin.replace(/\/$/, '')}/${c.pageSlug}?${q}`;
}

/** Money spent between two days (inclusive), all days when not given. */
export function spendBetween(c: Pick<Campaign, 'spend'>, from?: string, to?: string): number {
  return Math.round(c.spend.filter((s) => (!from || s.date >= from) && (!to || s.date <= to)).reduce((sum, s) => sum + s.amount, 0) * 100) / 100;
}

/** A campaign slug must be unique: the report matches visits and leads by it. */
export function uniqueSlug(slug: string, taken: string[]): string {
  if (!taken.includes(slug)) return slug;
  for (let i = 2; i < 100; i++) if (!taken.includes(`${slug}-${i}`)) return `${slug}-${i}`;
  return `${slug}-${Date.now().toString(36)}`;
}
