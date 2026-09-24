/**
 * Apply committed content packs (content/pages/*.json) to the CMS in Supabase.
 *
 * Runs after `next build` succeeds (see scripts/sync-content-packs.mjs, which bundles
 * and executes this file), so content only changes when the new code compiled. It
 * only writes during a Vercel *production* build, so a
 * preview branch can never change live content, and it applies each pack once per
 * file version: a marker `content_pack:<slug>` in system_settings remembers the hash
 * of the last applied file. Editing the page in the admin afterwards sticks until the
 * pack file itself changes in git.
 *
 * Before changing a page it saves the page as it was to `content_pack_backup:<slug>`
 * in system_settings; if that backup cannot be written, the pack is not applied.
 *
 * It never fails the build: every problem is logged and the process exits 0.
 *
 * Force a run outside Vercel with:  CONTENT_PACK_SYNC=1 npm run sync:content
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { featureImageDecision, isContentPack, mergeContentPack, parseFeatureImages } from '../src/lib/content-pack';
import {
  supabaseGetMarker,
  supabaseGetPageBySlug,
  supabaseSavePage,
  supabaseSetMarker,
} from '../src/lib/supabase-store';

const PACK_DIR = 'content/pages';
const log = (message: string) => console.log(`[content-packs] ${message}`);

async function main(): Promise<void> {
  const vercelEnv = process.env.VERCEL_ENV;
  const forced = process.env.CONTENT_PACK_SYNC === '1';
  if (!forced && vercelEnv !== 'production') {
    log(`skipped: VERCEL_ENV is "${vercelEnv ?? 'unset'}". Packs apply only on production builds (CONTENT_PACK_SYNC=1 forces a run).`);
    return;
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log('skipped: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not both available to this build.');
    return;
  }
  if (!existsSync(PACK_DIR)) {
    log(`skipped: no ${PACK_DIR} directory.`);
    return;
  }

  const files = readdirSync(PACK_DIR).filter(f => f.endsWith('.json')).sort();
  if (files.length === 0) log('nothing to apply: no packs found.');

  for (const file of files) {
    const raw = readFileSync(join(PACK_DIR, file), 'utf8');
    const hash = createHash('sha256').update(raw).digest('hex').slice(0, 16);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      log(`${file}: not valid JSON, skipped.`);
      continue;
    }
    if (!isContentPack(parsed)) {
      log(`${file}: no "slug" field, skipped.`);
      continue;
    }

    const markerId = `content_pack:${parsed.slug}`;
    const applied = await supabaseGetMarker(markerId);
    if (applied === hash) {
      log(`${file}: already applied (${hash}).`);
      continue;
    }

    const page = await supabaseGetPageBySlug(parsed.slug);
    if (!page) {
      log(`${file}: no page with slug "${parsed.slug}" in the CMS, skipped.`);
      continue;
    }

    // Keep the page as it was, so the change can be undone.
    const backedUp = await supabaseSetMarker(`content_pack_backup:${parsed.slug}`, JSON.stringify(page));
    if (!backedUp) {
      log(`${file}: could not save a backup of /${parsed.slug}, so the pack was not applied.`);
      continue;
    }

    const merged = mergeContentPack(page, parsed);
    merged.updatedAt = new Date().toISOString();
    await supabaseSavePage(merged);
    const remembered = await supabaseSetMarker(markerId, hash);
    log(`${file}: applied to /${parsed.slug} (${hash})${remembered ? '' : ', but the marker could not be saved so it will be re-applied next build'}.`);
  }

  await applyFeatureImages();
}

/** Suggested feature images: set once, only on pages that have none (never replaces the owner's choice). */
async function applyFeatureImages(): Promise<void> {
  const file = 'content/feature-images.json';
  if (!existsSync(file)) return;
  let suggestions: Record<string, string>;
  try {
    suggestions = parseFeatureImages(JSON.parse(readFileSync(file, 'utf8')));
  } catch {
    log(`${file}: not valid JSON, skipped.`);
    return;
  }
  for (const [slug, image] of Object.entries(suggestions)) {
    const markerId = `feature_image:${slug}`;
    const page = await supabaseGetPageBySlug(slug);
    if (!page) {
      log(`feature image: no page /${slug}, skipped.`);
      continue;
    }
    const decision = featureImageDecision(page.ogImage, image, await supabaseGetMarker(markerId));
    if (decision === 'already-applied') continue;
    if (decision === 'owner-chose') {
      log(`feature image: /${slug} already has one, left as it is.`);
      await supabaseSetMarker(markerId, image);
      continue;
    }
    await supabaseSavePage({ ...page, ogImage: image, updatedAt: new Date().toISOString() });
    await supabaseSetMarker(markerId, image);
    log(`feature image: set on /${slug}.`);
  }
}

main()
  .catch((error: unknown) => {
    log(`failed: ${error instanceof Error ? error.message : String(error)}. The build continues.`);
  })
  .finally(() => process.exit(0));
