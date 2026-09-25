/**
 * Follow-up on form leads after they are assigned (server only):
 * - a salesperson taps Contacted / No answer / Not interested under the lead
 *   card → the lead's status, a note and the response time are saved;
 * - a lead with no tap within the set minutes goes to a colleague, and the
 *   manager is told when nobody else can take it.
 *
 * The check runs after responses on normal traffic (throttled to about once a
 * minute) and on GET /api/round-robin/tick, so it works without a paid cron.
 */
import type { Lead, LeadClaimOutcome, RoundRobinLog, RoundRobinSettings, RoundRobinStaff } from './types';
import {
  claimedKeyboard,
  formatWait,
  handoverCandidate,
  HANDOVER_WINDOW_MS,
  leadIsOverdue,
  MAX_HANDOVERS,
  OUTCOME_LABEL,
  passedKeyboard,
  responseMinutes,
  assignedAtMs,
  statusAfterClaim,
  type InlineKeyboard,
} from './lead-response';
import { escapeHtml, readTelegramResponse, sendLeadToStaffTelegram, shiftStartMs, staffOnShift, staffServesPage } from './round-robin';
import {
  getDatabase,
  getLeadById,
  getLeads,
  getRoundRobinSettings,
  getSettings,
  saveDatabase,
  updateRoundRobinSettings,
} from './storage';
import { isSupabaseConfigured } from './supabase';
import {
  supabaseGetLeadsSince,
  supabaseGetMarker,
  supabaseSaveRoundRobinLog,
  supabaseSetMarker,
  supabaseUpdateLeadRouting,
} from './supabase-store';
import { runAfterResponse } from './after-response';

async function telegram(botToken: string, method: string, body: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await readTelegramResponse(res);
  } catch (err) {
    console.error(`Telegram ${method} error:`, err);
    return { ok: false as const };
  }
}

const sendText = (botToken: string, chatId: string, text: string) =>
  telegram(botToken, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true });

/** Saves a changed lead locally and in Supabase. */
export async function saveLeadChanges(lead: Lead): Promise<void> {
  lead.updatedAt = new Date().toISOString();
  const db = await getDatabase();
  const i = db.leads.findIndex((l) => l.id === lead.id);
  if (i >= 0) db.leads[i] = lead;
  await saveDatabase(db);
  if (isSupabaseConfigured()) await supabaseUpdateLeadRouting(lead);
}

function addNote(lead: Lead, text: string, author: string) {
  lead.notes = [{ id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, text, author, createdAt: new Date().toISOString() }, ...(lead.notes || [])];
}

// ─── Button taps ───────────────────────────────────────────────────────────

export interface ClaimResult {
  ok: boolean;
  /** Short answer shown to the salesperson in Telegram. */
  text: string;
  keyboard?: InlineKeyboard;
}

/** A tap on a lead card button. Only the salesperson who currently has the lead may answer. */
export async function claimLeadFromTelegram(input: { leadId: string; fromUserId: number | string; outcome: LeadClaimOutcome; nowMs?: number }): Promise<ClaimResult> {
  const nowMs = input.nowMs ?? Date.now();
  const lead = await getLeadById(input.leadId);
  const r = lead?.routing;
  if (!lead || !r) return { ok: false, text: 'Lead not found.' };

  const from = String(input.fromUserId).trim();
  if (!r.staffChatId || r.staffChatId.trim() !== from) {
    const passed = (r.handovers || []).length > 0;
    return { ok: false, text: passed ? `This lead was passed to ${r.staffName}.` : `This lead belongs to ${r.staffName}.` };
  }

  const first = !r.claim;
  const seconds = first ? Math.max(0, Math.round((nowMs - assignedAtMs(lead)) / 1000)) : r.claim!.seconds;
  r.claim = {
    outcome: input.outcome,
    at: first ? new Date(nowMs).toISOString() : r.claim!.at,
    staffId: r.staffId,
    staffName: r.staffName,
    seconds,
  };
  lead.status = statusAfterClaim(input.outcome, lead.status);
  addNote(lead, `${OUTCOME_LABEL[input.outcome]} (Telegram${first ? `, ${formatWait(seconds)} after assignment` : ''})`, r.staffName);
  await saveLeadChanges(lead);
  return { ok: true, text: `Saved: ${OUTCOME_LABEL[input.outcome]}`, keyboard: claimedKeyboard(r.claim, lead.id) };
}

// ─── Hand-over check ───────────────────────────────────────────────────────

const CHECK_EVERY_MS = 60 * 1000;
let lastLocalCheck = 0;

async function recentFormLeads(nowMs: number): Promise<Lead[]> {
  const since = new Date(nowMs - HANDOVER_WINDOW_MS).toISOString();
  if (isSupabaseConfigured()) {
    const remote = await supabaseGetLeadsSince(since).catch(() => null);
    if (remote) return remote;
  }
  return (await getLeads()).filter((l) => l.createdAt >= since);
}

function managerChat(rr: RoundRobinSettings, fallback?: string): string {
  return (rr.managerChatId || rr.fallbackChatId || fallback || '').trim();
}

export interface CheckResult {
  skipped?: boolean;
  checked: number;
  handedOver: number;
  managerAlerts: number;
}

/**
 * Passes overdue leads on. `canTake` lets working hours, page teams and daily
 * limits (see round-robin.ts) exclude people who should not get a lead now.
 */
export async function runLeadResponseCheck(options: { force?: boolean; nowMs?: number; canTake?: (s: RoundRobinStaff, lead: Lead) => boolean } = {}): Promise<CheckResult> {
  const nowMs = options.nowMs ?? Date.now();
  const rr = await getRoundRobinSettings();
  const minutes = responseMinutes(rr);
  if (!rr.enabled || !minutes) return { checked: 0, handedOver: 0, managerAlerts: 0 };

  // One check a minute across all server instances.
  if (!options.force && isSupabaseConfigured()) {
    const last = Number(await supabaseGetMarker('rr_response_check').catch(() => null)) || 0;
    if (nowMs - last < CHECK_EVERY_MS - 5000) return { skipped: true, checked: 0, handedOver: 0, managerAlerts: 0 };
    await supabaseSetMarker('rr_response_check', String(nowMs)).catch(() => false);
  }

  const settings = await getSettings();
  const botToken = settings.telegramBotToken;
  // The response clock of a lead given outside someone's hours starts when their shift opens.
  const clockStart = (l: Lead) => {
    const owner = rr.staffList.find((s) => s.id === l.routing?.staffId);
    return owner ? shiftStartMs(owner, assignedAtMs(l)) : assignedAtMs(l);
  };
  const overdue = (l: Lead) => leadIsOverdue(l, rr, nowMs, clockStart(l));
  const leads = (await recentFormLeads(nowMs)).filter(overdue);
  const result: CheckResult = { checked: leads.length, handedOver: 0, managerAlerts: 0 };
  if (!leads.length || !botToken) return result;

  const manager = managerChat(rr, settings.telegramChatId);
  let staffChanged = false;

  for (const lead of leads) {
    const r = lead.routing!;
    // Re-read: another instance may have handled it a moment ago.
    const fresh = await getLeadById(lead.id);
    if (!fresh || !overdue(fresh)) continue;

    const previous = rr.staffList.find((s) => s.id === r.staffId);
    // Only people working now; the page's team first, then anyone working.
    const extra = (s: RoundRobinStaff) => (options.canTake ? options.canTake(s, fresh) : true) && staffOnShift(s, nowMs);
    const next =
      handoverCandidate(rr, fresh, (s) => extra(s) && staffServesPage(s, fresh.landingPageSlug)) ||
      handoverCandidate(rr, fresh, extra);

    if (!next) {
      if (fresh.routing!.managerAlerted) continue;
      fresh.routing!.managerAlerted = true;
      addNote(fresh, `No response within ${minutes} min and nobody else could take it. Manager alerted.`, 'Round Robin');
      await saveLeadChanges(fresh);
      if (manager) {
        const tried = [r.staffName, ...(r.handovers || []).map((h) => h.toName)].filter((v, i, a) => a.indexOf(v) === i).join(', ');
        await sendText(botToken, manager, `⚠️ <b>Lead waiting for a reply</b>\n━━━━━━━━━━━━━━━━━━━━\n👤 <b>${escapeHtml(fresh.fullName)}</b> · <code>${escapeHtml(fresh.phone)}</code>\n📌 ${escapeHtml(fresh.landingPageTitle)}\n⏱️ No button tapped within ${minutes} min.\n🙋 Tried: ${escapeHtml(tried)}\n${(r.handovers?.length || 0) >= MAX_HANDOVERS ? 'Passed on the maximum number of times.' : 'Nobody else is available right now.'}\n👉 <a href="https://sale.khbevents.com/admin/leads?id=${encodeURIComponent(fresh.id)}">Open in CRM</a>`);
      }
      result.managerAlerts += 1;
      continue;
    }

    const at = new Date(nowMs).toISOString();
    const noteLine = `⏱️ <b>ផ្ទេរមកអ្នក · Passed to you:</b> ${escapeHtml(r.staffName)} did not respond within ${minutes} min. Please contact this customer now.`;
    const sent = await sendLeadToStaffTelegram(fresh, next, botToken, {
      fallbackChatId: rr.fallbackChatId || settings.telegramChatId,
      enableManagerNotification: false,
      customTemplate: rr.customMessageTemplate,
      customWhatsappMessage: rr.customWhatsappMessage,
      noteLine,
    });

    const oldChat = r.staffChatId;
    const oldMessage = r.telegramMessageId;
    fresh.routing = {
      ...r,
      staffId: next.id,
      staffName: next.name,
      staffTelegram: next.telegramUsername,
      staffChatId: next.telegramChatId,
      percentageWeight: next.percentage || 0,
      status: sent.status,
      telegramMessageId: sent.messageId,
      deliveryError: sent.error,
      // A failed send is due again at the next check, so the lead moves on quickly.
      assignedAt: sent.status === 'DELIVERED' ? at : new Date(nowMs - minutes * 60 * 1000).toISOString(),
      assignmentReason: 'handover',
      handovers: [...(r.handovers || []), { fromStaffId: r.staffId, fromName: r.staffName, toStaffId: next.id, toName: next.name, at, reason: 'no_response' }],
    };
    addNote(fresh, `Passed from ${r.staffName} to ${next.name}: no response within ${minutes} min.`, 'Round Robin');
    await saveLeadChanges(fresh);
    result.handedOver += 1;

    next.totalLeadsRouted = (next.totalLeadsRouted || 0) + 1;
    if (sent.status === 'DELIVERED') next.successfulDeliveries = (next.successfulDeliveries || 0) + 1;
    else next.failedDeliveries = (next.failedDeliveries || 0) + 1;
    next.lastAssignedAt = at;
    staffChanged = true;

    // The first salesperson's buttons now say where the lead went.
    if (oldChat && oldMessage) {
      await telegram(botToken, 'editMessageReplyMarkup', { chat_id: oldChat, message_id: oldMessage, reply_markup: passedKeyboard(next.name) });
    }
    if (previous?.telegramChatId) {
      await sendText(botToken, previous.telegramChatId, `⏱️ Lead <b>${escapeHtml(fresh.fullName)}</b> (${escapeHtml(fresh.landingPageTitle)}) was passed to <b>${escapeHtml(next.name)}</b> because no button was tapped within ${minutes} min.`);
    }
    if (manager && rr.enableManagerNotification) {
      await sendText(botToken, manager, `🔁 <b>Lead passed on</b>: ${escapeHtml(fresh.fullName)} · ${escapeHtml(fresh.landingPageTitle)}\n${escapeHtml(r.staffName)} → <b>${escapeHtml(next.name)}</b> (no response within ${minutes} min)`);
    }

    const log: RoundRobinLog = {
      id: `rr-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: at,
      routeType: 'FORM_SUBMISSION',
      pageSlug: fresh.landingPageSlug,
      pageTitle: fresh.landingPageTitle,
      leadId: fresh.id,
      clientName: fresh.fullName,
      clientPhone: fresh.phone,
      clientCompany: fresh.company,
      staffId: next.id,
      staffName: next.name,
      staffTelegram: next.telegramUsername,
      staffChatId: next.telegramChatId,
      percentageWeight: next.percentage || 0,
      status: sent.status,
      telegramMessageId: sent.messageId,
      deliveryError: sent.error,
      assignmentReason: 'handover',
    };
    const db = await getDatabase();
    db.roundRobinLogs = [log, ...(db.roundRobinLogs || [])].slice(0, 500);
    await saveDatabase(db);
    if (isSupabaseConfigured()) await supabaseSaveRoundRobinLog(log).catch(() => false);
  }

  if (staffChanged) await updateRoundRobinSettings({ staffList: rr.staffList });
  return result;
}

/**
 * Called on ordinary traffic: runs the check after the response, at most once
 * a minute per server instance (and once a minute overall via the marker).
 */
export function scheduleLeadResponseCheck(canTake?: (s: RoundRobinStaff, lead: Lead) => boolean): void {
  const now = Date.now();
  if (now - lastLocalCheck < CHECK_EVERY_MS) return;
  lastLocalCheck = now;
  runAfterResponse(async () => {
    try {
      await runLeadResponseCheck({ canTake });
    } catch (err) {
      console.error('Lead response check error:', err);
    }
  });
}
