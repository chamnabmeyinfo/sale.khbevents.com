/**
 * Campaigns and the campaign report, server side: reads the campaign list, visits,
 * real leads and pages, and builds the report (campaign-analytics.ts).
 */
import { normalizeBuilderDoc, pick } from './builder';
import { classicToBuilder } from './classic-to-builder';
import { buildCampaignReport, type CampaignReport, type PageInfo } from './campaign-analytics';
import { normalizeCampaign, parseCampaigns, uniqueSlug, type Campaign } from './campaigns';
import { getMarker, getPages, getRealLeads, getVisits, setMarker } from './storage';
import type { LandingPage } from './types';

const CAMPAIGNS_ID = 'campaigns';

export async function getCampaigns(): Promise<Campaign[]> {
  return parseCampaigns(await getMarker(CAMPAIGNS_ID).catch(() => null));
}

async function saveCampaigns(list: Campaign[]): Promise<void> {
  await setMarker(CAMPAIGNS_ID, JSON.stringify(list));
}

/** Creates or updates a campaign. Returns null when the input is not valid. */
export async function upsertCampaign(input: unknown): Promise<Campaign | null> {
  const list = await getCampaigns();
  const id = input && typeof input === 'object' ? (input as { id?: unknown }).id : undefined;
  const existing = typeof id === 'string' ? list.find((c) => c.id === id) : undefined;
  const clean = normalizeCampaign(input, new Date().toISOString(), existing);
  if (!clean) return null;
  clean.slug = uniqueSlug(clean.slug, list.filter((c) => c.id !== clean.id).map((c) => c.slug));
  const next = existing ? list.map((c) => (c.id === clean.id ? clean : c)) : [clean, ...list];
  await saveCampaigns(next);
  return clean;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const list = await getCampaigns();
  if (!list.some((c) => c.id === id)) return false;
  await saveCampaigns(list.filter((c) => c.id !== id));
  return true;
}

/** Section list and deadline of a page, for the "how far they read" chart. */
export function pageInfo(page: LandingPage): PageInfo {
  const doc = page.template === 'builder' && page.builder ? normalizeBuilderDoc(page.builder) : classicToBuilder(page);
  const titleOf = (b: (typeof doc.blocks)[number]): string | undefined => {
    const t = 'title' in b ? b.title : 'headline' in b ? b.headline : undefined;
    return t ? pick(t, 'en').slice(0, 80) || undefined : undefined;
  };
  return {
    slug: page.slug,
    title: page.title,
    sections: doc.blocks.map((b) => ({ id: b.id, type: b.type, title: titleOf(b) })),
    deadline: doc.offer.deadline,
  };
}

export async function getCampaignReport(days: number, pageSlug?: string, nowMs: number = Date.now()): Promise<{ report: CampaignReport; campaigns: Campaign[]; pages: PageInfo[] }> {
  const [visits, leads, campaigns, pages] = await Promise.all([getVisits(days + 1, pageSlug, nowMs), getRealLeads(pageSlug ? { pageSlug } : undefined), getCampaigns(), getPages()]);
  const infos = pages.filter((p) => p.status !== 'archived').map(pageInfo);
  const report = buildCampaignReport({ visits, leads, campaigns, pages: infos, days, nowMs, pageSlug });
  return { report, campaigns, pages: infos };
}
