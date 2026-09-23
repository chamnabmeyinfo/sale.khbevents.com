// Bundles scripts/sync-content-packs.ts with esbuild (a dev dependency via vitest) and runs
// it. Anything that goes wrong here is logged and ignored: this step must never break
// `next build`.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outfile = join(root, '.sync', 'sync-content-packs.mjs');

try {
  const require = createRequire(import.meta.url);
  const { buildSync } = require('esbuild');
  mkdirSync(join(root, '.sync'), { recursive: true });
  buildSync({
    absWorkingDir: root,
    entryPoints: [join(root, 'scripts', 'sync-content-packs.ts')],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    packages: 'external',
    logLevel: 'warning',
  });
  const run = spawnSync(process.execPath, [outfile], { cwd: root, stdio: 'inherit' });
  if (run.status !== 0) {
    console.warn(`[content-packs] sync exited with status ${run.status}; the build continues.`);
  }
} catch (error) {
  console.warn(`[content-packs] skipped: ${error instanceof Error ? error.message : String(error)}`);
}
process.exit(0);
