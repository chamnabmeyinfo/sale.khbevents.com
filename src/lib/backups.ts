/**
 * Whole-system backups: a snapshot is a full copy of every business table
 * (landing_pages, leads, system_settings, which also holds the campaign, AI, popup,
 * staff, page-history and autosave rows) as one JSON file in a PRIVATE storage bucket.
 *
 * Snapshots are taken before every deploy (build step), daily (cron), before destructive
 * actions (clear demo data, delete page, restore) and on demand. Each new snapshot is
 * compared with the previous one: fewer pages or leads raises a data-loss alert
 * (Telegram + admin banner), because a code update that drops data is the case this
 * exists for.
 *
 * This module must stay free of Next.js imports: the build step bundles it with esbuild.
 */
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

export type BackupKind = 'deploy' | 'daily' | 'before' | 'manual';
export type BackupTable = 'landing_pages' | 'leads' | 'system_settings';
export const BACKUP_TABLES: BackupTable[] = ['landing_pages', 'leads', 'system_settings'];
export const BACKUP_BUCKET = 'backups';
export const LOCAL_BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

/** How many snapshots of each kind are kept; older ones are deleted. */
export const RETENTION: Record<BackupKind, number> = { deploy: 20, daily: 30, before: 20, manual: 50 };

export interface BackupCounts {
  pages: number;
  leads: number;
  settingsRows: number;
  /** Page views are not backed up (analytics, regenerable); the count is kept for reference. */
  pageViews?: number;
}

export interface BackupEntry {
  name: string;
  kind: BackupKind;
  label: string;
  takenAt: string;
  counts: BackupCounts;
  bytes: number;
  /** Set when this snapshot had fewer pages or leads than the one before it. */
  drop?: DropReport;
}

export interface Snapshot {
  version: 1;
  source: 'supabase' | 'local';
  kind: BackupKind;
  label: string;
  takenAt: string;
  commit?: string;
  counts: BackupCounts;
  tables: Record<BackupTable, Array<Record<string, unknown>>>;
}

export interface DropReport {
  pagesBefore: number;
  pagesNow: number;
  leadsBefore: number;
  leadsNow: number;
  /** Slugs present before and missing now. */
  missingPages: string[];
}

export interface DataHealth {
  ok: boolean;
  now: BackupCounts;
  last?: BackupEntry;
  drop?: DropReport;
}

const INDEX_ID = 'backups_index';
const PAGE_SIZE = 1000;

// ─── Storage: Supabase private bucket, or data/backups locally ──────────────

function serviceClient(): SupabaseClient | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabase() : null;
}

async function ensureBucket(supabase: SupabaseClient): Promise<void> {
  const { data } = await supabase.storage.getBucket(BACKUP_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BACKUP_BUCKET, { public: false, fileSizeLimit: 200 * 1024 * 1024 });
  if (error && !/already exists/i.test(error.message)) throw new Error(`Could not create the backups bucket: ${error.message}`);
}

async function putFile(name: string, json: string): Promise<void> {
  const supabase = serviceClient();
  if (supabase) {
    await ensureBucket(supabase);
    const { error } = await supabase.storage.from(BACKUP_BUCKET).upload(name, Buffer.from(json, 'utf8'), { contentType: 'application/json', upsert: true });
    if (error) throw new Error(`Could not store the backup: ${error.message}`);
    return;
  }
  await mkdir(path.join(LOCAL_BACKUP_DIR, path.dirname(name)), { recursive: true });
  await writeFile(path.join(LOCAL_BACKUP_DIR, name), json, 'utf8');
}

async function getFile(name: string): Promise<string | null> {
  const supabase = serviceClient();
  if (supabase) {
    const { data, error } = await supabase.storage.from(BACKUP_BUCKET).download(name);
    if (error || !data) return null;
    return await data.text();
  }
  return readFile(path.join(LOCAL_BACKUP_DIR, name), 'utf8').catch(() => null);
}

async function removeFiles(names: string[]): Promise<void> {
  if (!names.length) return;
  const supabase = serviceClient();
  if (supabase) {
    await supabase.storage.from(BACKUP_BUCKET).remove(names);
    return;
  }
  await Promise.all(names.map((n) => unlink(path.join(LOCAL_BACKUP_DIR, n)).catch(() => undefined)));
}

// ─── Index: the list of snapshots, in one settings row (or a local file) ─────

async function readIndex(): Promise<BackupEntry[]> {
  const supabase = serviceClient();
  let raw: string | null = null;
  if (supabase) {
    const { data } = await supabase.from('system_settings').select('brand_tagline').eq('id', INDEX_ID).maybeSingle();
    raw = (data as { brand_tagline?: string } | null)?.brand_tagline || null;
  } else {
    raw = await readFile(path.join(LOCAL_BACKUP_DIR, 'index.json'), 'utf8').catch(() => null);
  }
  try {
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((e) => e && typeof e.name === 'string') : [];
  } catch {
    return [];
  }
}

async function writeIndex(list: BackupEntry[]): Promise<void> {
  const json = JSON.stringify(list);
  const supabase = serviceClient();
  if (supabase) {
    const { error } = await supabase.from('system_settings').upsert({ id: INDEX_ID, brand_tagline: json, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Could not save the backup list: ${error.message}`);
    return;
  }
  await mkdir(LOCAL_BACKUP_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_BACKUP_DIR, 'index.json'), json, 'utf8');
}

// ─── Reading the live data ────────────────────────────────────────────────────

async function readTable(supabase: SupabaseClient, table: BackupTable): Promise<Array<Record<string, unknown>>> {
  const rows: Array<Record<string, unknown>> = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true }).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    rows.push(...((data || []) as Array<Record<string, unknown>>));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

async function countRows(supabase: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
  if (error) throw new Error(`Could not count ${table}: ${error.message}`);
  return count || 0;
}

/** The local db.json in table shape, so backups work without Supabase (dev, tests). */
async function readLocalTables(): Promise<Snapshot['tables']> {
  const file = path.join(process.cwd(), 'data', 'db.json');
  const db = JSON.parse(await readFile(file, 'utf8'));
  const settingsRows: Array<Record<string, unknown>> = [{ id: 'default', ...db.settings }];
  for (const [id, value] of Object.entries((db.markers || {}) as Record<string, string>)) settingsRows.push({ id, brand_tagline: value });
  return { landing_pages: db.pages || [], leads: db.leads || [], system_settings: settingsRows };
}

const isSettingsRow = (r: Record<string, unknown>) => r.id === 'default';
const countsOf = (tables: Snapshot['tables'], pageViews?: number): BackupCounts => ({
  pages: tables.landing_pages.length,
  leads: tables.leads.length,
  settingsRows: tables.system_settings.length,
  ...(pageViews !== undefined ? { pageViews } : {}),
});

/** Current row counts (cheap), for the health check. */
export async function currentCounts(): Promise<BackupCounts> {
  const supabase = serviceClient();
  if (supabase) {
    const [pages, leads, settingsRows, pageViews] = await Promise.all(['landing_pages', 'leads', 'system_settings', 'page_views'].map((t) => countRows(supabase, t)));
    return { pages, leads, settingsRows, pageViews };
  }
  return countsOf(await readLocalTables());
}

// ─── Snapshots ────────────────────────────────────────────────────────────────

const safe = (s: string) => s.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'backup';

export function compareCounts(previous: Snapshot['tables'] | BackupCounts | undefined, current: Snapshot['tables'], previousSlugs?: string[]): DropReport | undefined {
  if (!previous) return undefined;
  const prevCounts: BackupCounts = 'landing_pages' in previous ? countsOf(previous) : previous;
  const now = countsOf(current);
  const nowSlugs = new Set(current.landing_pages.map((r) => String(r.slug)));
  const beforeSlugs = previousSlugs || ('landing_pages' in previous ? previous.landing_pages.map((r) => String(r.slug)) : []);
  const missingPages = beforeSlugs.filter((s) => !nowSlugs.has(s));
  // Pages: any page gone is a drop. Leads: a real fall (more than 5 and more than 10 %), since
  // clearing demo data legitimately removes a few.
  const leadsDrop = prevCounts.leads - now.leads;
  const dropped = now.pages < prevCounts.pages || missingPages.length > 0 || (leadsDrop > 5 && leadsDrop > prevCounts.leads * 0.1);
  return dropped ? { pagesBefore: prevCounts.pages, pagesNow: now.pages, leadsBefore: prevCounts.leads, leadsNow: now.leads, missingPages } : undefined;
}

/**
 * Takes a full snapshot, stores it, prunes old ones of the same kind and compares it
 * with the previous snapshot. Never modifies business data.
 */
export async function takeSnapshot(kind: BackupKind, label: string, opts: { commit?: string; nowMs?: number } = {}): Promise<BackupEntry> {
  const nowMs = opts.nowMs ?? Date.now();
  const takenAt = new Date(nowMs).toISOString();
  const supabase = serviceClient();
  let tables: Snapshot['tables'];
  let pageViews: number | undefined;
  if (supabase) {
    const [lp, ld, ss, pv] = await Promise.all([readTable(supabase, 'landing_pages'), readTable(supabase, 'leads'), readTable(supabase, 'system_settings'), countRows(supabase, 'page_views').catch(() => undefined)]);
    // The backup list itself is not part of a backup.
    tables = { landing_pages: lp, leads: ld, system_settings: ss.filter((r) => r.id !== INDEX_ID) };
    pageViews = pv;
  } else {
    tables = await readLocalTables();
  }
  const snapshot: Snapshot = { version: 1, source: supabase ? 'supabase' : 'local', kind, label, takenAt, commit: opts.commit, counts: countsOf(tables, pageViews), tables };
  const json = JSON.stringify(snapshot);
  const name = `${kind}/${takenAt.replace(/[:.]/g, '-')}-${safe(label)}.json`;

  const index = await readIndex();
  const previous = index[0];
  let drop: DropReport | undefined;
  if (previous) {
    const prevSnapshot = await loadSnapshot(previous.name).catch(() => null);
    drop = compareCounts(prevSnapshot ? prevSnapshot.tables : previous.counts, tables);
  }

  await putFile(name, json);
  const entry: BackupEntry = { name, kind, label, takenAt, counts: snapshot.counts, bytes: Buffer.byteLength(json, 'utf8'), ...(drop ? { drop } : {}) };
  const next = [entry, ...index.filter((e) => e.name !== name)].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  // Prune per kind.
  const keep: BackupEntry[] = [];
  const perKind: Record<string, number> = {};
  const toRemove: string[] = [];
  for (const e of next) {
    perKind[e.kind] = (perKind[e.kind] || 0) + 1;
    if (perKind[e.kind] <= (RETENTION[e.kind] || 20)) keep.push(e);
    else toRemove.push(e.name);
  }
  await writeIndex(keep);
  await removeFiles(toRemove).catch(() => undefined);
  return entry;
}

export async function listBackups(): Promise<BackupEntry[]> {
  return readIndex();
}

export async function loadSnapshot(name: string): Promise<Snapshot | null> {
  if (!/^(deploy|daily|before|manual)\/[A-Za-z0-9._-]+\.json$/.test(name)) return null;
  const raw = await getFile(name);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Snapshot;
  return parsed && parsed.version === 1 && parsed.tables ? parsed : null;
}

/** Whether data has gone missing since the last snapshot. */
export async function dataHealth(): Promise<DataHealth> {
  const [now, index] = await Promise.all([currentCounts(), readIndex()]);
  const last = index[0];
  if (!last) return { ok: true, now };
  const supabase = serviceClient();
  let drop: DropReport | undefined;
  if (supabase) {
    const { data } = await supabase.from('landing_pages').select('slug');
    const nowTables = { landing_pages: (data || []) as Array<Record<string, unknown>>, leads: new Array(now.leads).fill({}), system_settings: [] };
    const prev = await loadSnapshot(last.name).catch(() => null);
    drop = compareCounts(prev ? prev.tables : last.counts, nowTables);
  } else {
    const tables = await readLocalTables();
    const prev = await loadSnapshot(last.name).catch(() => null);
    drop = compareCounts(prev ? prev.tables : last.counts, tables);
  }
  return { ok: !drop, now, last, drop };
}

// ─── Restore ──────────────────────────────────────────────────────────────────

export interface RestoreRequest {
  parts: { pages: boolean; leads: boolean; settings: boolean };
  /** add-missing: only rows whose id is gone now; overwrite: every row of the snapshot. Nothing present now is ever deleted. */
  mode: 'add-missing' | 'overwrite';
}

export interface RestoreResult {
  restored: Record<BackupTable, number>;
  backupBefore: string;
  /** Pages put back, so the caller can clear their "deleted" marks. */
  restoredPages: Array<{ id: string; slug: string }>;
}

export async function restoreSnapshot(name: string, req: RestoreRequest): Promise<RestoreResult> {
  const snapshot = await loadSnapshot(name);
  if (!snapshot) throw new Error('Backup not found');
  const supabase = serviceClient();
  if ((snapshot.source === 'supabase') !== Boolean(supabase)) throw new Error('This backup was taken from a different database and cannot be restored here.');
  // Undo point first.
  const before = await takeSnapshot('before', `restore-${path.basename(name, '.json')}`);

  const restored: Record<BackupTable, number> = { landing_pages: 0, leads: 0, system_settings: 0 };
  const restoredPages: Array<{ id: string; slug: string }> = [];
  const wanted: BackupTable[] = [
    ...(req.parts.pages ? (['landing_pages'] as BackupTable[]) : []),
    ...(req.parts.leads ? (['leads'] as BackupTable[]) : []),
    ...(req.parts.settings ? (['system_settings'] as BackupTable[]) : []),
  ];
  if (supabase) {
    for (const table of wanted) {
      let rows = snapshot.tables[table].filter((r) => r.id !== INDEX_ID);
      if (req.mode === 'add-missing') {
        const { data, error } = await supabase.from(table).select('id');
        if (error) throw new Error(`Could not read ${table}: ${error.message}`);
        const present = new Set((data || []).map((r: { id: unknown }) => String(r.id)));
        rows = rows.filter((r) => !present.has(String(r.id)));
      }
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase.from(table).upsert(rows.slice(i, i + 200));
        if (error) throw new Error(`Could not restore ${table}: ${error.message}`);
      }
      restored[table] = rows.length;
      if (table === 'landing_pages') restoredPages.push(...rows.map((r) => ({ id: String(r.id), slug: String(r.slug) })));
    }
    return { restored, backupBefore: before.name, restoredPages };
  }
  // Local file database.
  const file = path.join(process.cwd(), 'data', 'db.json');
  const db = JSON.parse(await readFile(file, 'utf8'));
  const merge = (current: Array<Record<string, unknown>>, rows: Array<Record<string, unknown>>) => {
    const byId = new Map(current.map((r) => [String(r.id), r]));
    const put: Array<Record<string, unknown>> = [];
    for (const r of rows) {
      const id = String(r.id);
      if (req.mode === 'add-missing' && byId.has(id)) continue;
      byId.set(id, r);
      put.push(r);
    }
    return { list: Array.from(byId.values()), put };
  };
  if (req.parts.pages) {
    const m = merge(db.pages || [], snapshot.tables.landing_pages);
    db.pages = m.list;
    restored.landing_pages = m.put.length;
    restoredPages.push(...m.put.map((r) => ({ id: String(r.id), slug: String(r.slug) })));
  }
  if (req.parts.leads) { const m = merge(db.leads || [], snapshot.tables.leads); db.leads = m.list; restored.leads = m.put.length; }
  if (req.parts.settings) {
    for (const r of snapshot.tables.system_settings) {
      if (isSettingsRow(r)) { const { id: _id, ...rest } = r; void _id; if (req.mode === 'overwrite') db.settings = { ...db.settings, ...rest }; }
      else if (req.mode === 'overwrite' || !(db.markers || {})[String(r.id)]) db.markers = { ...(db.markers || {}), [String(r.id)]: String(r.brand_tagline ?? '') };
      restored.system_settings++;
    }
  }
  await writeFile(file, JSON.stringify(db, null, 2) + '\n', 'utf8');
  return { restored, backupBefore: before.name, restoredPages };
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

/** Sends the data-loss alert to the Telegram chat in Settings (without importing the app's storage). */
export async function alertDataLoss(entry: BackupEntry, appUrl = 'https://sale.khbevents.com'): Promise<boolean> {
  if (!entry.drop) return false;
  const supabase = serviceClient();
  if (!supabase) return false;
  const { data } = await supabase.from('system_settings').select('telegram_bot_token, telegram_chat_id').eq('id', 'default').maybeSingle();
  const row = data as { telegram_bot_token?: string; telegram_chat_id?: string } | null;
  if (!row?.telegram_bot_token || !row.telegram_chat_id) return false;
  const d = entry.drop;
  const lines = [
    '⚠️ Data check: something is missing since the last backup.',
    `Pages: ${d.pagesBefore} → ${d.pagesNow}${d.missingPages.length ? ` (missing: ${d.missingPages.join(', ')})` : ''}`,
    `Leads: ${d.leadsBefore} → ${d.leadsNow}`,
    `Backup "${entry.label}" (${entry.kind}) was taken at ${entry.takenAt}.`,
    `Restore: ${appUrl}/admin/settings#backups`,
  ];
  try {
    const res = await fetch(`https://api.telegram.org/bot${row.telegram_bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: row.telegram_chat_id, text: lines.join('\n') }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Takes the daily snapshot once per day (Phnom Penh date). */
export async function maybeDailyBackup(nowMs: number = Date.now()): Promise<BackupEntry | null> {
  const day = new Date(nowMs + 7 * 3600_000).toISOString().slice(0, 10);
  const index = await readIndex();
  if (index.some((e) => e.kind === 'daily' && e.label === day)) return null;
  const entry = await takeSnapshot('daily', day, { nowMs });
  if (entry.drop) await alertDataLoss(entry);
  return entry;
}
