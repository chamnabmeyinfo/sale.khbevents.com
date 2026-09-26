import type { LandingPage } from '@/lib/types';
import { convertPageToBuilder } from './classic-to-builder';
import { normalizeBuilderDoc } from './builder';

/**
 * A content pack is a JSON file in `content/pages/<slug>.json` holding the copy of one
 * landing page. It carries only the fields it wants to change; everything else on the
 * page (deadlines, seat counts, phone numbers, bank details, tracking IDs, counters)
 * stays whatever the admin set.
 *
 * Packs are applied in two places with the same rules:
 *  - the production build (`scripts/sync-content-packs.ts`), once per file version;
 *  - Admin → Pages → "Import JSON", on demand.
 */
export type ContentPack = Partial<LandingPage> & {
  slug: string;
  /**
   * Move an old fixed-layout page to the drag-and-drop builder, built from the page's
   * own live text, price, deadlines and seats (see classic-to-builder.ts). Pages that
   * already are builder pages are left as they are.
   */
  convertToBuilder?: boolean;
  /**
   * Builder sections to swap in, matched by id. Each replaces the live section with the
   * same id (its type may change); every other section, the order and the offer
   * (price, deadlines, seats) stay as the admin left them. Ids not on the page are skipped.
   */
  replaceBuilderBlocks?: unknown[];
};

const PACK_ONLY_KEYS = ['convertToBuilder', 'replaceBuilderBlocks'];

function replaceBlocks(page: LandingPage, blocks: unknown[]): LandingPage {
  if (!page.builder) return page;
  const doc = normalizeBuilderDoc(page.builder);
  let changed = false;
  const next = doc.blocks.map((live) => {
    const raw = blocks.find((b) => isPlainObject(b) && b.id === live.id);
    if (!raw) return live;
    const [block] = normalizeBuilderDoc({ ...doc, blocks: [raw] }).blocks;
    if (!block || block.id !== live.id) return live;
    changed = true;
    return block;
  });
  return changed ? { ...page, builder: { ...doc, blocks: next } } : page;
}

/** Fields a pack can never carry into a page: they identify or count the page itself. */
const IDENTITY_FIELDS = ['id', 'viewsCount', 'leadsCount', 'createdAt', 'updatedAt'] as const;

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** True when the parsed JSON looks like a pack we can apply. */
export function isContentPack(value: unknown): value is ContentPack {
  return isPlainObject(value) && typeof value.slug === 'string' && value.slug.length > 0;
}

/**
 * Lay a pack over a page. Nested settings objects (urgency, formConfig, isolatedSettings,
 * sectionVisibility, valueStack, ...) merge key by key, so a pack that only sets
 * `urgency.regularPrice` leaves the deadlines the admin typed. Arrays and scalars are
 * replaced whole: a list in the pack is the whole list. Identity fields are ignored.
 */
export function mergeContentPack(base: LandingPage, pack: Partial<LandingPage> & { convertToBuilder?: boolean; replaceBuilderBlocks?: unknown[] }): LandingPage {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(pack)) {
    if ((IDENTITY_FIELDS as readonly string[]).includes(key) || PACK_ONLY_KEYS.includes(key)) continue;
    const current = out[key];
    out[key] = isPlainObject(value) && isPlainObject(current) ? { ...current, ...value } : value;
  }
  const merged = out as unknown as LandingPage;
  const converted = pack.convertToBuilder === true ? convertPageToBuilder(merged) : merged;
  return Array.isArray(pack.replaceBuilderBlocks) ? replaceBlocks(converted, pack.replaceBuilderBlocks) : converted;
}

/**
 * Suggested feature images (content/feature-images.json: { "<slug>": "<image address>" }).
 * A suggestion is applied once, and only to a page that has no feature image yet,
 * so an image the owner chose is never replaced.
 */
export type FeatureImageDecision = 'apply' | 'already-applied' | 'owner-chose';

export function featureImageDecision(currentOgImage: string | undefined, suggested: string, lastApplied: string | null): FeatureImageDecision {
  if (lastApplied === suggested) return 'already-applied';
  if (currentOgImage && currentOgImage.trim()) return 'owner-chose';
  return 'apply';
}

export function parseFeatureImages(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isPlainObject(value)) return out;
  for (const [slug, image] of Object.entries(value)) {
    if (/^[a-z0-9-]{1,120}$/.test(slug) && typeof image === 'string' && /^(\/(?!\/)|https:\/\/)\S+$/.test(image)) out[slug] = image;
  }
  return out;
}
