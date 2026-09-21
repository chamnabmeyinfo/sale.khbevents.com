import { 
  RoundRobinStaff, 
  RoundRobinSettings, 
  RoutingDeliveryStatus, 
  Lead 
} from './types';

export const defaultStaffList: RoundRobinStaff[] = [
  {
    id: 'staff-1',
    name: 'Sokha Chen',
    title: 'Senior B2B Consultant',
    telegramUsername: 'sokhachen_khb',
    telegramChatId: '',
    percentage: 20,
    isActive: true,
    phone: '+855 12 111 222',
    totalLeadsRouted: 0,
    totalDirectClicks: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
  },
  {
    id: 'staff-2',
    name: 'Dara Kim',
    title: 'VIP Event Specialist',
    telegramUsername: 'darakim_khb',
    telegramChatId: '',
    percentage: 20,
    isActive: true,
    phone: '+855 12 333 444',
    totalLeadsRouted: 0,
    totalDirectClicks: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
  },
  {
    id: 'staff-3',
    name: 'Vannak Meas',
    title: 'Exhibition & Trade Director',
    telegramUsername: 'vannakmeas_khb',
    telegramChatId: '',
    percentage: 20,
    isActive: true,
    phone: '+855 12 555 666',
    totalLeadsRouted: 0,
    totalDirectClicks: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
  },
  {
    id: 'staff-4',
    name: 'Sreyleak Pov',
    title: 'Corporate Partnership Manager',
    telegramUsername: 'sreyleak_khb',
    telegramChatId: '',
    percentage: 20,
    isActive: true,
    phone: '+855 12 777 888',
    totalLeadsRouted: 0,
    totalDirectClicks: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
  },
  {
    id: 'staff-5',
    name: 'Bopha Heng',
    title: 'Client Relations & Ticketing',
    telegramUsername: 'bophaheng_khb',
    telegramChatId: '',
    percentage: 20,
    isActive: true,
    phone: '+855 12 999 000',
    totalLeadsRouted: 0,
    totalDirectClicks: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
  }
];

export const defaultRoundRobinSettings: RoundRobinSettings = {
  enabled: true,
  algorithm: 'weighted_percentage',
  staffList: defaultStaffList,
  fallbackChatId: '',
  enableManagerNotification: true,
  managerChatId: '',
  directContactRoutingEnabled: true,
  lastAssignedIndex: 0,
  lastUpdated: new Date().toISOString()
};

/**
 * Select the next staff member based on configured percentage weights or round robin
 */
export function selectNextStaff(
  settings: RoundRobinSettings
): { staff: RoundRobinStaff; effectivePercentage: number; nextIndex: number } | null {
  const activeStaff = settings.staffList.filter((s) => s.isActive);
  if (activeStaff.length === 0) return null;

  if (activeStaff.length === 1) {
    return {
      staff: activeStaff[0],
      effectivePercentage: 100,
      nextIndex: 0
    };
  }

  // Strict sequential round-robin
  if (settings.algorithm === 'strict_round_robin') {
    const currentIndex = (settings.lastAssignedIndex || 0) % activeStaff.length;
    const selected = activeStaff[currentIndex];
    const nextIndex = (currentIndex + 1) % activeStaff.length;
    return {
      staff: selected,
      effectivePercentage: Math.round(100 / activeStaff.length),
      nextIndex
    };
  }

  // Weighted Percentage algorithm (Smooth probabilistic weighted selection)
  const totalWeight = activeStaff.reduce((sum, s) => sum + Math.max(0, s.percentage || 0), 0);

  if (totalWeight <= 0) {
    // Fallback if weights are all 0: distribute equally
    const fallbackIdx = (settings.lastAssignedIndex || 0) % activeStaff.length;
    return {
      staff: activeStaff[fallbackIdx],
      effectivePercentage: Math.round(100 / activeStaff.length),
      nextIndex: (fallbackIdx + 1) % activeStaff.length
    };
  }

  const randomValue = Math.random() * totalWeight;
  let accumulated = 0;
  let selected = activeStaff[0];

  for (const staff of activeStaff) {
    accumulated += Math.max(0, staff.percentage || 0);
    if (randomValue <= accumulated) {
      selected = staff;
      break;
    }
  }

  const effectivePercentage = Math.round(((selected.percentage || 0) / totalWeight) * 100);
  const nextIndex = ((settings.lastAssignedIndex || 0) + 1) % activeStaff.length;

  return {
    staff: selected,
    effectivePercentage,
    nextIndex
  };
}

/**
 * Dispatches a rich Lead alert card to a staff member's Telegram chat ID, verifying delivery
 */
export async function sendLeadToStaffTelegram(
  lead: Lead,
  staff: RoundRobinStaff,
  botToken: string,
  options?: {
    fallbackChatId?: string;
    managerChatId?: string;
    enableManagerNotification?: boolean;
  }
): Promise<{
  status: RoutingDeliveryStatus;
  messageId?: number;
  error?: string;
  fallbackSent?: boolean;
}> {
  if (!botToken || !staff.telegramChatId) {
    return {
      status: 'FAILED',
      error: !botToken 
        ? 'Telegram Bot Token is not configured' 
        : `Staff member ${staff.name} has no Telegram Chat ID configured`
    };
  }

  const cleanUsername = (staff.telegramUsername || '').replace(/^@/, '');
  const staffTag = cleanUsername ? `@${cleanUsername}` : staff.name;

  const leadUrl = `https://sale.khbevents.com/admin/leads?id=${lead.id}`;
  const whatsappUrl = `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hello ${lead.fullName}, this is ${staff.name} from KHB Events regarding your inquiry for ${lead.landingPageTitle}.`
  )}`;

  const text = `🎯 *NEW PROSPECT ASSIGNED TO YOU!*
━━━━━━━━━━━━━━━━━━━━
👤 *Assigned Rep:* *${staff.name}* (${staffTag})
📊 *Allocation Weight:* ${staff.percentage}%
🏷️ *Lead ID:* \`#${lead.id}\`
📌 *Campaign:* *${lead.landingPageTitle}*

📋 *PROSPECT DETAILS:*
• *Client Name:* *${lead.fullName}*
• *Phone:* \`${lead.phone}\`
• *Email:* ${lead.email || 'N/A'}
• *Company:* ${lead.company || 'Private Individual'}
• *Event Type:* ${lead.eventType}
• *Target Date:* ${lead.estimatedDate || 'TBD'}
• *Scale:* ${lead.guestCount || 'TBD'}
• *Budget / Interest:* ${lead.budgetRange || lead.packageInterest || 'TBD'}
${lead.message ? `• *Client Note:* _${lead.message.replace(/([_*[\]()~`>#+=|{}.!-])/g, '\\$1')}_\n` : ''}${lead.tags && lead.tags.length > 0 ? `🏷️ *Tags:* ${lead.tags.map(t => `#${t}`).join(' ')}\n` : ''}
🌐 *Source:* ${lead.utmSource || 'Direct'} ${lead.utmCampaign ? `(${lead.utmCampaign})` : ''}
⏰ *Routed At:* ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
⚡ *QUICK ACTIONS:*
👉 [Open WhatsApp Chat](${whatsappUrl})
👉 [Open in KHB Leads CRM](${leadUrl})`;

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const res = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: staff.telegramChatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      // Send CC to Manager if enabled
      if (options?.enableManagerNotification && options?.managerChatId) {
        const managerText = `🔔 *LEAD DISPATCH NOTIFICATION (CC)*
━━━━━━━━━━━━━━━━━━━━
Lead *#${lead.id}* from *${lead.landingPageTitle}* has been successfully routed to:
👤 *${staff.name}* (${staffTag})
📞 Client: *${lead.fullName}* (${lead.phone})
📊 Weight: ${staff.percentage}%`;

        fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: options.managerChatId,
            text: managerText,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          })
        }).catch((err) => console.error('Manager CC error:', err));
      }

      return {
        status: 'DELIVERED',
        messageId: data.result?.message_id
      };
    }

    // If delivery failed to staff, attempt fallback to manager if configured
    const errorDesc = data.description || `Telegram Error HTTP ${res.status}`;
    let fallbackSent = false;

    if (options?.fallbackChatId) {
      try {
        const fallbackText = `⚠️ *ROUTING DELIVERY FAILED - FALLBACK DISPATCH*
━━━━━━━━━━━━━━━━━━━━
Could not deliver lead to staff:
👤 *${staff.name}* (Chat ID: \`${staff.telegramChatId}\`)
❌ *Reason:* ${errorDesc}

📋 *LEAD DETAILS:*
• *Client:* *${lead.fullName}* (${lead.phone})
• *Campaign:* ${lead.landingPageTitle}
• *Event:* ${lead.eventType}
• *Budget:* ${lead.budgetRange || 'N/A'}
━━━━━━━━━━━━━━━━━━━━
⚠️ *Action Required:* Please assign an alternate staff representative.`;

        const fallbackRes = await fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: options.fallbackChatId,
            text: fallbackText,
            parse_mode: 'Markdown'
          })
        });
        const fallbackData = await fallbackRes.json();
        fallbackSent = Boolean(fallbackRes.ok && fallbackData.ok);
      } catch (fallbackErr) {
        console.error('Fallback dispatch error:', fallbackErr);
      }
    }

    return {
      status: fallbackSent ? 'FALLBACK' : 'FAILED',
      error: errorDesc,
      fallbackSent
    };
  } catch (err: any) {
    return {
      status: 'FAILED',
      error: err?.message || 'Network error connecting to Telegram Bot API'
    };
  }
}

/**
 * Test a Telegram account connection by sending a verification ping
 */
export async function testStaffTelegramConnection(
  botToken: string,
  chatId: string,
  staffName: string,
  username?: string
): Promise<{
  success: boolean;
  messageId?: number;
  error?: string;
  diagnostic?: string;
}> {
  if (!botToken) {
    return {
      success: false,
      error: 'Telegram Bot Token is missing. Set it in Settings > Telegram Alert Bot.'
    };
  }

  if (!chatId) {
    return {
      success: false,
      error: 'Telegram Chat ID is empty. Enter the numeric Chat ID for this staff member.'
    };
  }

  const cleanUser = (username || '').replace(/^@/, '');
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const text = `🔔 *KHB EVENTS - TELEGRAM ROUTING TEST*
━━━━━━━━━━━━━━━━━━━━
Hello *${staffName}* ${cleanUser ? `(@${cleanUser})` : ''}!

✅ *Connection Verified Successfully!*
Your Telegram account is active and connected to the *KHB Lead Distribution System*. You are ready to receive real-time visitor inquiries.

⏱️ *Verification Time:* ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
_KHB Events • Cambodia's Premier Event Production_`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      })
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      return {
        success: true,
        messageId: data.result?.message_id
      };
    }

    const desc = data.description || `HTTP Error ${res.status}`;
    let diagnostic = desc;

    if (desc.includes('chat not found')) {
      diagnostic = `Chat ID "${chatId}" was not found. Please ask ${staffName} to open your Telegram Bot and click "Start" (send /start). Then retry.`;
    } else if (desc.includes('bot was blocked')) {
      diagnostic = `The Telegram Bot was blocked by ${staffName}. Ask them to unblock the bot.`;
    } else if (desc.includes('Unauthorized')) {
      diagnostic = 'Invalid Telegram Bot Token. Verify your token with @BotFather.';
    }

    return {
      success: false,
      error: desc,
      diagnostic
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network failure reaching api.telegram.org',
      diagnostic: 'Network error or timeout reaching Telegram servers.'
    };
  }
}

/**
 * Normalizes staff percentages so they sum to exactly 100%
 */
export function normalizeStaffPercentages(staffList: RoundRobinStaff[]): RoundRobinStaff[] {
  const active = staffList.filter((s) => s.isActive);
  if (active.length === 0) return staffList;

  const equalShare = Math.floor(100 / active.length);
  const remainder = 100 - equalShare * active.length;

  let activeIndex = 0;
  return staffList.map((s) => {
    if (!s.isActive) {
      return { ...s, percentage: 0 };
    }
    const pct = equalShare + (activeIndex === 0 ? remainder : 0);
    activeIndex++;
    return { ...s, percentage: pct };
  });
}
