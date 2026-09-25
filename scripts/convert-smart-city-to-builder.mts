/**
 * Moves the Vietnam page (/smart-city-tea-cafe) to the drag-and-drop builder.
 *
 * - content/pages/smart-city-tea-cafe.json becomes { slug, convertToBuilder: true }.
 *   On the next production build the pack sync converts the LIVE page in the CMS
 *   (its current text, price, deadlines and seats), once, after saving a backup.
 * - data/db.json (the bundled fallback) gets the same conversion now.
 *
 * The conversion itself is src/lib/classic-to-builder.ts. Nothing is invented.
 *
 * Run: npx jiti scripts/convert-smart-city-to-builder.mts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { convertPageToBuilder } from '../src/lib/classic-to-builder';

const SLUG = 'smart-city-tea-cafe';

writeFileSync(`content/pages/${SLUG}.json`, JSON.stringify({ slug: SLUG, convertToBuilder: true }, null, 2) + '\n');

const dbPath = 'data/db.json';
const db = JSON.parse(readFileSync(dbPath, 'utf8'));
const index = db.pages.findIndex((p: { slug: string }) => p.slug === SLUG);
if (index < 0) throw new Error(`${SLUG} not in data/db.json`);
const page = convertPageToBuilder(db.pages[index]);
if (!page.builder) throw new Error('conversion failed');
db.pages[index] = { ...page, updatedAt: new Date().toISOString() };
writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n');
console.log(`/${SLUG} is now a builder page: ${page.builder.blocks.map((b) => b.type).join(', ')}`);
