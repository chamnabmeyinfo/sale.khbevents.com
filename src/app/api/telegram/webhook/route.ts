import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/storage';
import { selectNextStaff } from '@/lib/round-robin';
import { isValidTelegramWebhookSecret } from '@/lib/auth';

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
    entities?: Array<{
      type: string;
      offset: number;
      length: number;
    }>;
  };
}

function escapeHtml(str: string): string {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDatabase();
    const botToken = db.settings.telegramBotToken;

    if (!botToken) {
      console.error('Telegram webhook: No bot token configured');
      return NextResponse.json({ ok: true });
    }

    // Reject calls that did not come from Telegram. The secret is registered via
    // POST /api/telegram/setup-webhook.
    if (!isValidTelegramWebhookSecret(botToken, req.headers.get('x-telegram-bot-api-secret-token'))) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const update: TelegramUpdate = await req.json();
    const message = update.message;

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

      // Plain /start without payload — route to sales rep using round robin
      if (!payload) {
        const rrSettings = db.settings.roundRobinSettings;
        const selection = rrSettings?.enabled ? selectNextStaff(rrSettings) : null;
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

      // Look up the page
      const page = db.pages.find((p) => p.slug === pageSlug);
      const pageTitle = page?.title || pageSlug || 'KHB Events';
      const pageCategory = page?.category || 'Event';

      // Look up the assigned staff, or select next via Round Robin
      const rrSettings = db.settings.roundRobinSettings;
      let assignedStaff = staffId 
        ? rrSettings?.staffList?.find((s) => s.id === staffId)
        : null;

      if (!assignedStaff && rrSettings?.enabled) {
        const sel = selectNextStaff(rrSettings);
        if (sel) {
          assignedStaff = sel.staff;
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
      const managerChatId = rrSettings?.managerChatId || db.settings.telegramChatId;
      if (managerChatId && managerChatId !== assignedStaff?.telegramChatId) {
        const managerNotification = 
          `🔔 <b>Telegram Bot Click — អតិថិជនថ្មី</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 <b>ទំព័រ៖</b> ${escapeHtml(pageTitle)}\n` +
          `👤 <b>អតិថិជន៖</b> ${escapeHtml(visitorName)} ${visitorUsername ? `(${escapeHtml(visitorUsername)})` : ''}\n` +
          `👨‍💼 <b>ចាត់ចែងជូន៖</b> ${assignedStaff ? escapeHtml(assignedStaff.name) : 'មិនទាន់ចាត់ចែង'}\n` +
          `⏰ ${new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}`;

        sendTelegramMessage(botToken, managerChatId, managerNotification).catch((err) => 
          console.error('Manager notification error:', err)
        );
      }

      return NextResponse.json({ ok: true });
    }

    // ─── Handle regular messages (visitor chatting) ─────────────────
    // Forward to the global chat / manager so someone can respond
    const forwardChatId = db.settings.telegramChatId;
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

      sendTelegramMessage(botToken, forwardChatId, forwardText).catch((err) => 
        console.error('Forward to manager error:', err)
      );
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
