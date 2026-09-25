/**
 * Sends a new lead to the ad platforms' server APIs (see conversions.ts) and keeps a
 * short log of the answers for Admin → Campaigns → Tracking setup. Server only.
 */
import { effectiveOffer, normalizeBuilderDoc } from './builder';
import {
  conversionTokens,
  parseConversionSettings,
  sendMetaLead,
  sendTikTokLead,
  type ConversionLead,
  type ConversionResult,
  type ConversionSettings,
} from './conversions';
import { getMarker, getPageBySlug, setMarker } from './storage';

const LOG_ID = 'conversions_log';
const SETTINGS_ID = 'conversions_settings';
const LOG_SIZE = 40;

export async function getConversionSettings(): Promise<ConversionSettings> {
  try {
    return parseConversionSettings(JSON.parse((await getMarker(SETTINGS_ID)) || '{}'));
  } catch {
    return {};
  }
}

export async function saveConversionSettings(input: unknown): Promise<ConversionSettings> {
  const clean = parseConversionSettings(input);
  await setMarker(SETTINGS_ID, JSON.stringify(clean));
  return clean;
}

export async function getConversionLog(): Promise<ConversionResult[]> {
  try {
    const list = JSON.parse((await getMarker(LOG_ID)) || '[]');
    return Array.isArray(list) ? list.slice(0, LOG_SIZE) : [];
  } catch {
    return [];
  }
}

async function appendLog(results: ConversionResult[]) {
  if (!results.length) return;
  const log = await getConversionLog();
  await setMarker(LOG_ID, JSON.stringify([...results, ...log].slice(0, LOG_SIZE)));
}

/** Sends the lead to every platform whose pixel is on for the page and whose token is set. */
export async function sendLeadConversions(lead: Omit<ConversionLead, 'value' | 'currency' | 'pageTitle'>): Promise<ConversionResult[]> {
  const tokens = conversionTokens();
  if (!tokens.meta && !tokens.tiktok) return [];
  const page = await getPageBySlug(lead.pageSlug).catch(() => null);
  const tracking = page?.tracking;
  if (!page || !tracking) return [];

  // The price the visitor saw, for value-based optimisation (USD only).
  let value: number | undefined;
  if (page.template === 'builder' && page.builder) {
    const doc = normalizeBuilderDoc(page.builder);
    const price = effectiveOffer(doc.offer, lead.eventTimeMs).price;
    if (doc.offer.currency === 'USD' && price) value = price;
  }
  const full: ConversionLead = { ...lead, pageTitle: page.title, value, currency: value ? 'USD' : undefined };
  const settings = await getConversionSettings();
  const jobs: Array<Promise<ConversionResult>> = [];
  if (tokens.meta && tracking.facebookPixelId && tracking.facebookPixelEnabled !== false) {
    jobs.push(sendMetaLead(tracking.facebookPixelId.trim(), full, { token: process.env.META_CAPI_ACCESS_TOKEN!, testCode: settings.metaTestCode }));
  }
  if (tokens.tiktok && tracking.tiktokPixelId && tracking.tiktokPixelEnabled !== false) {
    jobs.push(sendTikTokLead(tracking.tiktokPixelId.trim(), full, { token: process.env.TIKTOK_EVENTS_ACCESS_TOKEN!, testCode: settings.tiktokTestCode }));
  }
  const results = await Promise.all(jobs);
  await appendLog(results);
  return results;
}
