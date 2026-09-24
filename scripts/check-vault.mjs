// Checks the Obsidian vault in docs/: every [[wikilink]] points to an existing
// note, every note has frontmatter, and no secret-looking text slipped in.
// Usage: npm run vault:check   (exit code 1 when something needs fixing)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'docs');
const SKIP_DIRS = new Set(['.obsidian', '.trash', 'Templates']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name) && !name.startsWith('.')) walk(full, out);
    } else if (name.endsWith('.md')) {
      out.push(rel);
    }
  }
  return out;
}

const notes = walk(ROOT);
const names = new Set(notes.map((n) => path.basename(n, '.md').toLowerCase()));
const attachments = new Set(
  readdirSync(path.join(ROOT, 'Attachments')).map((n) => n.toLowerCase()),
);

const SECRET_PATTERNS = [
  [/\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/, 'Telegram bot token'],
  [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, 'JWT / Supabase key'],
  [/\bsb_(secret|publishable)_[A-Za-z0-9_-]{10,}/, 'Supabase key'],
  [/\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{10,}/, 'API key'],
  [/https?:\/\/[a-z0-9]{15,}\.supabase\.co/i, 'Supabase project URL'],
  [/khbevents2026/i, 'seed admin password'],
  [/password\s*[:=]\s*\S{4,}/i, 'password value'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
];

const problems = [];
for (const rel of notes) {
  const text = readFileSync(path.join(ROOT, rel), 'utf8');
  if (!text.startsWith('---\n')) problems.push(`${rel}: missing frontmatter`);
  const body = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const m of body.matchAll(/!?\[\[([^\]|#^]+)(?:[#^][^\]|]*)?(?:\|[^\]]*)?\]\]/g)) {
    const target = m[1].trim();
    const isEmbed = m[0].startsWith('!');
    const base = path.basename(target).toLowerCase();
    const ok = names.has(base.replace(/\.md$/, '')) || (isEmbed && attachments.has(base));
    if (!ok) problems.push(`${rel}: broken link [[${target}]]`);
  }
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(text)) problems.push(`${rel}: looks like a ${label}; remove it and write where it is kept instead`);
  }
}

if (problems.length) {
  console.error(`Vault check found ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`Vault OK: ${notes.length} notes, links resolve, no secrets found.`);
