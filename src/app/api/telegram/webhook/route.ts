import { NextRequest, NextResponse } from 'next/server';
import { getSettings, getRoundRobinSettings, updateRoundRobinSettings, getPageBySlug, isTelegramWebhookSecured, recordStaffClick, getRoundRobinLogs, updateRoundRobinLogs, findLeadByTelegramUserId, createLeadFromTelegramChat, addLeadNote, setLeadPhone } from '@/lib/storage';
import { refCodeFromStartPayload } from '@/lib/contact-verify';
import type { Lead } from '@/lib/types';
import { selectNextStaff, escapeHtml, readTelegramResponse, countAssignment } from '@/lib/round-robin';
import { runAfterResponse } from '@/lib/after-response';
import type { RoundRobinSettings, RoundRobinStaff } from '@/lib/types';
import { isValidTelegramWebhookSecret } from '@/lib/auth';
import { parseClaimData } from '@/lib/lead-response';
import { claimLeadFromTelegram, scheduleLeadResponseCheck } from '@/lib/lead-followup';

/**
 * Telegram Bot Webhook Handler for @khb_sale_admin_bot
 * 
 * Flow:
 * 1. Visitor clicks floating Telegram button on a landing page
 * 2. Redirects to: https://t.me/khb_sale_admin_bot?start=<pageSlug>_<staffId>_<logId>
 * 3. Visitor opens chat with bot, Telegram sends /start <payload> to this webhook
 * 4. Bot greets the visitor with page context
 * 5. Bot notifies the assigned staff member about the new visitor
 */

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
    /** The customer tapped "share my phone number". */
    contact?: { phone_number: string; first_name?: string; last_name?: string; user_id?: number };
    entities?: Array<{
      type: string;
      offset: number;
      length: number;
    }>;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name?: string; username?: string };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number | string,
  text: string,
  options?: { replyMarkup?: object }
) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (options?.replyMarkup) {
    body.reply_markup = options.replyMarkup;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return readTelegramResponse(res);
}

async function telegramCall(botToken: string, method: string, body: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await readTelegramResponse(res);
  } catch (err) {
    console.error(`Telegram ${method} error:`, err);
    return null;
  }
}

/** Records a bot-side assignment so the rotation and the fairness counters move on. */
async function commitBotAssignment(rrSettings: RoundRobinSettings, staff: RoundRobinStaff, nextIndex: number) {
  staff.totalDirectClicks = (staff.totalDirectClicks || 0) + 1;
  countAssignment(staff, Date.now());
  staff.lastAssignedAt = new Date().toISOString();
  await updateRoundRobinSettings({ staffList: rrSettings.staffList, lastAssignedIndex: nextIndex });
  await recordStaffClick(staff.id, Date.now());
}

export async function POST(req: NextRequest) {
  try {
    // Same settings source as the admin pages and setup-webhook (Supabase first).
    const settings = await getSettings();
    const botToken = settings.telegramBotToken;

    if (!botToken) {
      console.error('Telegram webhook: No bot token configured');
      return NextResponse.json({ ok: true });
    }

    // Reject calls that did not come from Telegram. The secret is registered via
    // POST /api/telegram/setup-webhook; until that has been done for this bot
    // token, unsigned calls are still accepted so the bot keeps working.
    if (!isValidTelegramWebhookSecret(botToken, req.headers.get('x-telegram-bot-api-secret-token'))) {
      if (await isTelegramWebhookSecured(botToken)) {
        return NextResponse.json({ ok: false }, { status: 401 });
      }
      console.warn('Telegram webhook is not secured yet: register it via POST /api/telegram/setup-webhook.');
    }

    const update: TelegramUpdate = await req.json();
    scheduleLeadResponseCheck();

    // ─── Buttons under a lead card: Contacted / No answer / Not interested ───
    if (update.callback_query) {
      const cq = update.callback_query;
      const claim = parseClaimData(cq.data);
      let answer = '';
      if (claim) {
        const result = await claimLeadFromTelegram({ leadId: claim.leadId, fromUserId: cq.from.id, outcome: claim.outcome });
        answer = result.text;
        if (result.ok && result.keyboard && cq.message) {
          await telegramCall(botToken, 'editMessageReplyMarkup', { chat_id: cq.message.chat.id, message_id: cq.message.message_id, reply_markup: result.keyboard });
        }
      }
      await telegramCall(botToken, 'answerCallbackQuery', { callback_query_id: cq.id, text: answer.slice(0, 190) });
      return NextResponse.json({ ok: true });
    }

    const message = update.message;

    // ─── A bot-entry customer shared their phone number ───
    if (message?.contact?.phone_number && (!message.contact.user_id || message.contact.user_id === message.from.id)) {
      const lead = await findLeadByTelegramUserId(String(message.from.id)).catch(() => null);
      if (lead) await handleSharedPhone(botToken, lead, message);
      return NextResponse.json({ ok: true });
    }

    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const visitorName = [message.from.first_name, message.from.last_name].filter(Boolean).join(' ');
    const visitorUsername = message.from.username ? `@${message.from.username}` : '';

    // ─── Handle /start with deep link payload ───────────────────────
    if (text.startsWith('/start')) {
      const payload = text.replace('/start', '').trim();

      // ─── Bot first (Round Robin → "To the sales bot first"): the link carries the click's code ───
      const clickCode = refCodeFromStartPayload(payload);
      if (clickCode) {
        const handled = await handleBotEntry(botToken, settings.telegramChatId, message, clickCode);
        if (handled) return NextResponse.json({ ok: true });
      }

      // Plain /start without payload — route to sales rep using round robin
      if (!payload) {
        const rrSettings = await getRoundRobinSettings();
        const selection = rrSettings?.enabled ? selectNextStaff(rrSettings, { need: 'username', ctx: { nowMs: Date.now() } }) : null;
        if (selection) await commitBotAssignment(rrSettings, selection.staff, selection.nextIndex);
        const rep = selection?.staff;
        const repButtons: Array<Array<{ text: string; url?: string; callback_data?: string }>> = [
          [{ text: '🎪 សាកសួរអំពីកម្មវិធី / Event Inquiry', url: 'https://sale.khbevents.com' }],
        ];
        if (rep?.telegramUsername) {
          const cleanUser = rep.telegramUsername.replace(/^@/, '');
          repButtons.push([
            { text: `💬 ជជែកផ្ទាល់ជាមួយ ${rep.name} (ផ្នែកលក់)`, url: `https://t.me/${cleanUser}` }
          ]);
        }
        await sendTelegramMessage(botToken, chatId, 
          `👋 <b>សួស្តី ${escapeHtml(visitorName)}!</b>\n\n` +
          `សូមស្វាគមន៍មកកាន់ <b>KHB EVENTS</b> 🎪\n` +
          `Cambodia's Premier Event Management, Staging & Exhibition Production.\n\n` +
          (rep ? `👤 <b>អ្នកប្រឹក្សាផ្នែកលក់របស់អ្នក៖</b> <b>${escapeHtml(rep.name)}</b>\n\n` : '') +
          `📌 សូមចុចប៊ូតុងខាងក្រោមដើម្បីជជែកផ្ទាល់ ឬសាកសួរព័ត៌មាន៖`,
          {
            replyMarkup: {
              inline_keyboard: repButtons
            }
          }
        );
        return NextResponse.json({ ok: true });
      }

      // Parse deep-link payload: khb_<pageSlug>_<staffId>_<logId>
      // Format: khb_smart-city-tea-cafe_staff-1_rr-click-xxx
      const parts = payload.split('_');
      
      // Extract components — payload starts with "khb" prefix
      let pageSlug = '';
      let staffId = '';

      if (parts[0] === 'khb' && parts.length >= 2) {
        // Find the staff-N part to split page slug from staff ID
        const staffPartIndex = parts.findIndex((p, i) => i > 0 && p === 'staff');
        
        if (staffPartIndex > 0 && staffPartIndex + 1 < parts.length) {
          // Page slug is everything between 'khb' and 'staff'
          pageSlug = parts.slice(1, staffPartIndex).join('_');
          staffId = `staff-${parts[staffPartIndex + 1]}`;
        } else {
          // Legacy format: khb_<pageSlug>_<timestamp> (no staff info)
          pageSlug = parts.slice(1, -1).join('_') || parts.slice(1).join('_');
        }
      }

      // Links from this site are exactly `khb_<slug>`, and slugs may contain '_',
      // so try the whole remainder as a slug before the heuristics above.
      const exactPage = payload.startsWith('khb_') ? await getPageBySlug(payload.slice(4)) : null;
      if (exactPage) {
        pageSlug = exactPage.slug;
        staffId = '';
      }

      // Look up the page
      const page = exactPage || (pageSlug ? await getPageBySlug(pageSlug) : null);
      const pageTitle = page?.title || pageSlug || 'KHB Events';
      const pageCategory = page?.category || 'Event';

      // Look up the assigned staff, or select next via Round Robin
      const rrSettings = await getRoundRobinSettings();
      let assignedStaff = staffId 
        ? rrSettings?.staffList?.find((s) => s.id === staffId)
        : null;

      if (!assignedStaff && rrSettings?.enabled) {
        const sel = selectNextStaff(rrSettings, { need: 'username', ctx: { pageSlug: page?.slug || pageSlug || undefined, nowMs: Date.now() } });
        if (sel) {
          assignedStaff = sel.staff;
          await commitBotAssignment(rrSettings, sel.staff, sel.nextIndex);
        }
      }

      // ─── Send welcome message to visitor ──────────────────────────
      const staffLine = assignedStaff 
        ? `\n👤 <b>អ្នកប្រឹក្សាជំនាញរបស់អ្នក៖</b> <b>${escapeHtml(assignedStaff.name)}</b> (${escapeHtml(assignedStaff.title || 'Sales Consultant')})`
        : '';

      const welcomeButtons: Array<Array<{ text: string; url?: string; callback_data?: string }>> = [];
      
      if (page) {
        welcomeButtons.push([
          { text: `🌐 មើលព័ត៌មានលម្អិត / View ${pageCategory}`, url: `https://sale.khbevents.com/${pageSlug}` }
        ]);
      }
      
      if (assignedStaff?.telegramUsername) {
        const cleanStaffUser = assignedStaff.telegramUsername.replace(/^@/, '');
        welcomeButtons.push([
          { text: `💬 ជជែកផ្ទាល់ជាមួយ ${assignedStaff.name}`, url: `https://t.me/${cleanStaffUser}` }
        ]);
      }

      if (assignedStaff?.phone) {
        welcomeButtons.push([
          { text: `📞 ទូរស័ព្ទ / Call ${assignedStaff.name}`, url: `tel:${assignedStaff.phone.replace(/\s/g, '')}` }
        ]);
      }

      await sendTelegramMessage(botToken, chatId,
        `🎉 <b>សួស្តី ${escapeHtml(visitorName)}!</b>\n\n` +
        `សូមអរគុណដែលបានទាក់ទងមកកាន់ <b>KHB EVENTS</b> 🎪\n\n` +
        `📌 <b>អ្នកកំពុងសាកសួរអំពី៖</b>\n` +
        `🏷️ <b>${escapeHtml(pageTitle)}</b>` +
        `${staffLine}\n\n` +
        `⏱️ ក្រុមលក់របស់យើងនឹងទាក់ទងអ្នកក្នុងរយៈពេល <b>15 នាទី</b>!\n\n` +
        `សូមផ្ញើសារអ្វីដែលអ្នកចង់សាកសួរនៅទីនេះ ហើយយើងនឹងជួយអ្នកភ្លាមៗ 🙏`,
        welcomeButtons.length > 0 ? { replyMarkup: { inline_keyboard: welcomeButtons } } : undefined
      );

      // ─── Notify the assigned staff member ─────────────────────────
      if (assignedStaff?.telegramChatId) {
        const staffNotification = 
          `🔔 <b>អតិថិជនថ្មីមកពី Telegram Bot!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 <b>ទំព័រ/យុទ្ធនាការ៖</b> <b>${escapeHtml(pageTitle)}</b>\n` +
          `👤 <b>អតិថិជន៖</b> <b>${escapeHtml(visitorName)}</b> ${visitorUsername ? `(${escapeHtml(visitorUsername)})` : ''}\n` +
          `🆔 <b>Telegram ID:</b> <code>${message.from.id}</code>\n` +
          `🌐 <b>ភាសា:</b> ${escapeHtml(message.from.language_code || 'N/A')}\n` +
          `⏰ <b>ពេលវេលា៖</b> ${new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `⚡ <b>សកម្មភាព៖</b> សូមទាក់ទងអតិថិជននេះឆាប់បំផុត!\n` +
          (visitorUsername 
            ? `👉 <a href="https://t.me/${message.from.username}">💬 ផ្ញើសារទៅអតិថិជន</a>\n`
            : '') +
          `👉 <a href="https://sale.khbevents.com/admin/leads">📂 បើកប្រព័ន្ធ CRM</a>`;

        await sendTelegramMessage(botToken, assignedStaff.telegramChatId, staffNotification);
      }

      // ─── Also notify manager / global chat ────────────────────────
      const managerChatId = rrSettings?.managerChatId || settings.telegramChatId;
      if (managerChatId && managerChatId !== assignedStaff?.telegramChatId) {
        const managerNotification = 
          `🔔 <b>Telegram Bot Click — អតិថិជនថ្មី</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 <b>ទំព័រ៖</b> ${escapeHtml(pageTitle)}\n` +
          `👤 <b>អតិថិជន៖</b> ${escapeHtml(visitorName)} ${visitorUsername ? `(${escapeHtml(visitorUsername)})` : ''}\n` +
          `👨‍💼 <b>ចាត់ចែងជូន៖</b> ${assignedStaff ? escapeHtml(assignedStaff.name) : 'មិនទាន់ចាត់ចែង'}\n` +
          `⏰ ${new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}`;

        runAfterResponse(() => sendTelegramMessage(botToken, managerChatId, managerNotification));
      }

      return NextResponse.json({ ok: true });
    }

    // ─── A customer who came through the bot writes to the bot instead of the salesperson ───
    const botLead = await findLeadByTelegramUserId(String(message.from.id)).catch(() => null);
    if (botLead?.routing) {
      await handleBotLeadMessage(botToken, botLead, message, text);
      return NextResponse.json({ ok: true });
    }

    // ─── Handle regular messages (visitor chatting) ─────────────────
    // Forward to the global chat / manager so someone can respond
    const forwardChatId = settings.telegramChatId;
    if (forwardChatId && String(chatId) !== forwardChatId) {
      const forwardText = 
        `📩 <b>សារពីអតិថិជនតាម Bot</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>${escapeHtml(visitorName)}</b> ${visitorUsername ? `(${escapeHtml(visitorUsername)})` : ''}\n` +
        `💬 ${escapeHtml(text)}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        (visitorUsername 
          ? `👉 <a href="https://t.me/${message.from.username}">ផ្ញើសារឆ្លើយតប</a>`
          : `🆔 Telegram ID: <code>${message.from.id}</code>`);

      runAfterResponse(() => sendTelegramMessage(botToken, forwardChatId, forwardText));
    }

    // Auto-reply to visitor
    await sendTelegramMessage(botToken, chatId,
      `✅ សាររបស់អ្នកត្រូវបានទទួល! ក្រុមលក់យើងនឹងឆ្លើយតបក្នុងពេលឆាប់ៗ 🙏\n\n` +
      `Your message has been received! Our team will respond shortly.`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Always return 200 to Telegram to avoid retry storms
    return NextResponse.json({ ok: true });
  }
}


type BotMessage = NonNullable<TelegramUpdate['message']>;

const khmerSpeaker = (m: BotMessage) => /^km/i.test(m.from.language_code || '');
const staffChatUrl = (staff: RoundRobinStaff | undefined) => {
  const u = (staff?.telegramUsername || '').replace(/^@/, '').trim();
  return u ? `https://t.me/${u}` : '';
};

/** The one-tap hand-over: greet, name the salesperson, one button to their chat. */
function handOverMessage(m: BotMessage, staff: RoundRobinStaff | undefined, pageTitle: string, again = false): { text: string; replyMarkup?: object } {
  const name = escapeHtml([m.from.first_name, m.from.last_name].filter(Boolean).join(' ') || '');
  const url = staffChatUrl(staff);
  const kh = khmerSpeaker(m);
  const lines = kh
    ? [
        `សួស្តី ${name} 👋`,
        again ? `សូមចុចប៊ូតុងខាងក្រោម ដើម្បីជជែកផ្ទាល់ជាមួយ <b>${escapeHtml(staff?.name || 'ក្រុមលក់')}</b>៖` : (staff ? `<b>${escapeHtml(staff.name)}</b> នឹងជួយអ្នកអំពី <b>${escapeHtml(pageTitle)}</b>។ សូមចុចប៊ូតុងខាងក្រោម ដើម្បីជជែកផ្ទាល់៖` : `ក្រុមលក់យើងនឹងទាក់ទងអ្នកអំពី <b>${escapeHtml(pageTitle)}</b> ឆាប់ៗនេះ 🙏`),
      ]
    : [
        `Hello ${name} 👋`,
        again ? `Tap the button below to chat directly with <b>${escapeHtml(staff?.name || 'our sales team')}</b>:` : (staff ? `<b>${escapeHtml(staff.name)}</b> will help you with <b>${escapeHtml(pageTitle)}</b>. Tap the button below to chat directly:` : `Our sales team will contact you about <b>${escapeHtml(pageTitle)}</b> shortly 🙏`),
      ];
  const button = url && staff ? { inline_keyboard: [[{ text: kh ? `💬 ជជែកជាមួយ ${staff.name}` : `💬 Chat with ${staff.name}`, url }]] } : undefined;
  return { text: lines.join('\n'), replyMarkup: button };
}

/**
 * /start k_<code>: the visitor clicked a page and opened the sales bot. The click is
 * found by its code, the lead is made at once (we know exactly who this is), the
 * click is marked as a real chat, the salesperson is told, and the visitor gets one
 * button to the salesperson's chat. False when the code is unknown (old link).
 */
async function handleBotEntry(botToken: string, managerFallbackChatId: string | undefined, m: BotMessage, code: string): Promise<boolean> {
  // The click's log entry is written right after the page redirected; a very fast tap may beat it.
  let log = (await getRoundRobinLogs(500)).find((l) => l.refCode === code);
  if (!log) {
    await new Promise((r) => setTimeout(r, 1500));
    log = (await getRoundRobinLogs(500)).find((l) => l.refCode === code);
  }
  if (!log) return false;
  const rr = await getRoundRobinSettings();
  const staff = rr.staffList.find((s) => s.id === log.staffId);
  const userId = String(m.from.id);
  const username = m.from.username || undefined;
  const name = [m.from.first_name, m.from.last_name].filter(Boolean).join(' ') || undefined;
  const now = new Date().toISOString();
  const pageTitle = log.pageTitle || log.pageSlug || 'KHB Events';

  // The lead, now: one per Telegram user.
  let lead: Lead | null = await findLeadByTelegramUserId(userId).catch(() => null);
  if (lead) {
    await addLeadNote(lead.id, `Clicked again (through the bot): ${pageTitle}${log.refCode ? ` (${log.refCode})` : ''}`, 'Sales bot').catch(() => null);
  } else if (!log.demo) {
    try {
      lead = await createLeadFromTelegramChat({ log, contact: { at: now, userId, username, name, text: '', match: 'ref' }, staff: staff || null });
      await addLeadNote(lead.id, `Came through the sales bot: ${pageTitle}`, 'Sales bot').catch(() => null);
    } catch (err) {
      console.error('Bot entry lead error:', err);
    }
  }
  // The click is a real contact from this moment.
  if (!log.contact) {
    await updateRoundRobinLogs((all) => all.map((l) => (l.id === log.id && !l.contact ? { ...l, contact: { at: now, userId, username, name, text: '', match: 'ref', checkedAt: now, ...(lead ? { leadId: lead.id } : {}) } } : l))).catch(() => undefined);
  }
  // The click itself was counted when the page routed it; nothing to count again here.

  // The visitor: greeting and one button.
  const hand = handOverMessage(m, staff, pageTitle);
  await sendTelegramMessage(botToken, m.chat.id, hand.text, hand.replyMarkup ? { replyMarkup: hand.replyMarkup } : undefined);
  // No public @username: the salesperson cannot write first, so offer a one-tap phone share.
  if (!username) {
    const kh = khmerSpeaker(m);
    await sendTelegramMessage(botToken, m.chat.id, kh ? 'ឬចែករំលែកលេខទូរស័ព្ទ ដើម្បីឱ្យបុគ្គលិកទាក់ទងអ្នក 👇' : 'Or share your phone number so the salesperson can reach you 👇', {
      replyMarkup: { keyboard: [[{ text: kh ? '📱 ចែករំលែកលេខទូរស័ព្ទ' : '📱 Share my phone number', request_contact: true }]], one_time_keyboard: true, resize_keyboard: true },
    }).catch(() => undefined);
  }

  // The salesperson (and the manager CC): who is coming.
  const who = [name, username ? `(@${username})` : ''].filter(Boolean).join(' ') || 'អតិថិជន';
  const alert = [
    '👤 <b>អតិថិជនថ្មីមកពី bot</b>',
    `${escapeHtml(who)}`,
    `📌 សេវា៖ <b>${escapeHtml(pageTitle)}</b>`,
    `⏰ ${new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}`,
    '👉 គេនឹងផ្ញើសារមកអ្នក; សូមឆ្លើយឆាប់!',
    lead ? `📋 CRM: https://sale.khbevents.com/admin/leads?id=${encodeURIComponent(lead.id)}` : '',
  ].filter(Boolean).join('\n');
  const tasks: Promise<unknown>[] = [];
  if (staff?.telegramChatId) tasks.push(sendTelegramMessage(botToken, staff.telegramChatId, alert));
  const manager = rr.managerChatId || managerFallbackChatId;
  if (manager && String(manager) !== String(staff?.telegramChatId) && (rr.enableManagerNotification || !staff?.telegramChatId)) tasks.push(sendTelegramMessage(botToken, manager, alert));
  runAfterResponse(() => Promise.allSettled(tasks).then(() => undefined));
  return true;
}

/** A bot-entry customer wrote to the bot: keep the words on the lead, tell the salesperson, repeat the button. */
async function handleBotLeadMessage(botToken: string, lead: Lead, m: BotMessage, text: string): Promise<void> {
  const rr = await getRoundRobinSettings();
  const staff = rr.staffList.find((s) => s.id === lead.routing?.staffId);
  await addLeadNote(lead.id, `💬 Wrote to the bot: “${text.slice(0, 300)}${text.length > 300 ? '…' : ''}”`, 'Sales bot').catch(() => null);
  const hand = handOverMessage(m, staff, lead.landingPageTitle || 'KHB Events', true);
  await sendTelegramMessage(botToken, m.chat.id, hand.text, hand.replyMarkup ? { replyMarkup: hand.replyMarkup } : undefined);
  const who = [lead.fullName, lead.customFields?.telegramUsername ? `(@${lead.customFields.telegramUsername})` : ''].filter(Boolean).join(' ');
  const alert = [`💬 <b>${escapeHtml(who)}</b> សរសេរមក bot៖`, `“${escapeHtml(text.slice(0, 300))}”`, '👉 សូមឆ្លើយគេក្នុងការជជែករបស់អ្នក។', `📋 CRM: https://sale.khbevents.com/admin/leads?id=${encodeURIComponent(lead.id)}`].join('\n');
  const to = staff?.telegramChatId || rr.managerChatId;
  if (to) runAfterResponse(() => sendTelegramMessage(botToken, to, alert).then(() => undefined));
}

/** The customer shared their phone through the bot: onto the lead, and the salesperson can call or write. */
async function handleSharedPhone(botToken: string, lead: Lead, m: BotMessage): Promise<void> {
  const phone = m.contact!.phone_number;
  await setLeadPhone(lead.id, phone).catch(() => undefined);
  await addLeadNote(lead.id, `📱 Shared phone number through the bot`, 'Sales bot').catch(() => null);
  const kh = khmerSpeaker(m);
  await sendTelegramMessage(botToken, m.chat.id, kh ? 'អរគុណ! បុគ្គលិកយើងនឹងទាក់ទងអ្នកឆាប់ៗ 🙏' : 'Thank you! Our salesperson will contact you shortly 🙏', { replyMarkup: { remove_keyboard: true } });
  const rr = await getRoundRobinSettings();
  const staff = rr.staffList.find((s) => s.id === lead.routing?.staffId);
  const alert = [`📱 <b>${escapeHtml(lead.fullName)}</b> បានចែករំលែកលេខទូរស័ព្ទ៖ <code>${escapeHtml(phone)}</code>`, `📌 ${escapeHtml(lead.landingPageTitle || 'KHB Events')}`, '👉 សូមទាក់ទងគេឥឡូវ។', `📋 CRM: https://sale.khbevents.com/admin/leads?id=${encodeURIComponent(lead.id)}`].join('\n');
  const to = staff?.telegramChatId || rr.managerChatId;
  if (to) runAfterResponse(() => sendTelegramMessage(botToken, to, alert).then(() => undefined));
}
