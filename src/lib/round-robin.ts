import { 
  RoundRobinStaff, 
  RoundRobinSettings, 
  RoutingDeliveryStatus, 
  RememberVisitorMonths,
  Lead 
} from './types';
import { errorMessage } from '@/lib/errors';
import { toWhatsAppNumber } from './phone';
import { claimKeyboard } from './lead-response';
import { nextOpeningMs, withinHours } from './popup-ads';

/**
 * No staff ship by default: every routed visitor must land on a real person, so
 * the admin adds their own team in Round Robin. Until then clicks fall back to the
 * configured contact account (see resolveFallbackTelegramUrl).
 */
export const defaultStaffList: RoundRobinStaff[] = [];

/** Sample accounts from earlier builds. They are not real people, so routing to them loses the visitor. */
export const PLACEHOLDER_STAFF_USERNAMES = new Set([
  'sokhachen_khb', 'darakim_khb', 'vannakmeas_khb', 'sreyleak_khb', 'bophaheng_khb', 'khb_sales',
]);

/** Telegram bot the site uses when no other contact is configured. */
export const DEFAULT_BOT_USERNAME = 'khb_sale_admin_bot';

export const cleanTelegramUsername = (value?: string) => (value || '').trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//i, '');

export const isPlaceholderStaff = (staff: RoundRobinStaff) =>
  PLACEHOLDER_STAFF_USERNAMES.has(cleanTelegramUsername(staff.telegramUsername).toLowerCase());

export const DEFAULT_KHMER_TELEGRAM_TEMPLATE = `🎯 <b>មានអតិថិជនថ្មីត្រូវបានចាត់ចែងជូនអ្នក!</b> (NEW LEAD ASSIGNED)
━━━━━━━━━━━━━━━━━━━━
👤 <b>បុគ្គលិកទទួលបន្ទុក៖</b> <b>{staffName}</b> ({staffTelegram})
📊 <b>ចំណែកភាគរយ (Weight)៖</b> {weight}
🏷️ <b>លេខសម្គាល់ Lead ID៖</b> <code>#{leadId}</code>
📌 <b>យុទ្ធនាការ/ទំព័រ៖</b> <b>{pageTitle}</b>

📋 <b>ព័ត៌មានលម្អិតរបស់អតិថិជន៖</b>
• <b>ឈ្មោះអតិថិជន៖</b> <b>{clientName}</b>
• <b>លេខទូរស័ព្ទ (Phone)៖</b> <code>{phone}</code>
• <b>អ៊ីមែល (Email)៖</b> {email}
• <b>ក្រុមហ៊ុន/ស្ថាប័ន៖</b> {company}
• <b>ប្រភេទកម្មវិធី៖</b> {eventType}
• <b>កាលបរិច្ឆេទរំពឹងទុក៖</b> {date}
• <b>ចំនួនភ្ញៀវ/ទំហំ៖</b> {scale}
• <b>កញ្ចប់សេវា / ថវិកា៖</b> {budget}
• <b>សារ/សំណើបន្ថែម៖</b> <i>{note}</i>
🌐 <b>ប្រភពចូលមើល៖</b> {source}
⏰ <b>ពេលវេលាចាត់ចែង៖</b> {time}
━━━━━━━━━━━━━━━━━━━━
⚡ <b>សកម្មភាពរហ័ស (Quick Actions)៖</b>
👉 {whatsappLink}
👉 {crmLink}`;

export const DEFAULT_ENGLISH_TELEGRAM_TEMPLATE = `🎯 <b>NEW PROSPECT ASSIGNED TO YOU!</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>Assigned Rep:</b> <b>{staffName}</b> ({staffTelegram})
📊 <b>Allocation Weight:</b> {weight}
🏷️ <b>Lead ID:</b> <code>#{leadId}</code>
📌 <b>Campaign:</b> <b>{pageTitle}</b>

📋 <b>PROSPECT DETAILS:</b>
• <b>Client Name:</b> <b>{clientName}</b>
• <b>Phone:</b> <code>{phone}</code>
• <b>Email:</b> {email}
• <b>Company:</b> {company}
• <b>Event Type:</b> {eventType}
• <b>Target Date:</b> {date}
• <b>Scale:</b> {scale}
• <b>Budget / Interest:</b> {budget}
• <b>Client Note:</b> <i>{note}</i>
🌐 <b>Source:</b> {source}
⏰ <b>Routed At:</b> {time}
━━━━━━━━━━━━━━━━━━━━
⚡ <b>QUICK ACTIONS:</b>
👉 {whatsappLink}
👉 {crmLink}`;

export const DEFAULT_COMPACT_TELEGRAM_TEMPLATE = `⚡ <b>អតិថិជនថ្មី (QUICK LEAD ALERT)</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>អ្នកទទួល៖</b> {staffName} ({weight})
👤 <b>អតិថិជន៖</b> <b>{clientName}</b>
📞 <b>ទូរស័ព្ទ៖</b> <code>{phone}</code>
🏢 <b>ក្រុមហ៊ុន៖</b> {company}
🎪 <b>កម្មវិធី៖</b> {eventType}
💰 <b>ថវិកា៖</b> {budget}
📌 <b>ទំព័រ៖</b> {pageTitle}
📝 <b>សារ៖</b> <i>{note}</i>
━━━━━━━━━━━━━━━━━━━━
👉 {whatsappLink} | {crmLink}`;

export const DEFAULT_KHMER_WHATSAPP_MESSAGE = `ជម្រាបសួរ {clientName}, ខ្ញុំបាទ/នាងខ្ញុំ {staffName} មកពី KHB Events ទាក់ទងនឹងការចុះឈ្មោះ/សាកសួរព័ត៌មានលើកម្មវិធី {pageTitle}។`;

export const defaultRoundRobinSettings: RoundRobinSettings = {
  enabled: true,
  algorithm: 'weighted_percentage',
  staffList: defaultStaffList,
  fallbackChatId: '',
  enableManagerNotification: true,
  managerChatId: '',
  directContactRoutingEnabled: true,
  lastAssignedIndex: 0,
  lastUpdated: new Date().toISOString(),
  customMessageTemplate: DEFAULT_KHMER_TELEGRAM_TEMPLATE,
  customWhatsappMessage: DEFAULT_KHMER_WHATSAPP_MESSAGE
};

/**
 * Resolves the correct Telegram alert template for a staff member
 * based on their individual preferred language, falling back to the global custom template.
 */
export function getTemplateForStaff(
  staff: RoundRobinStaff,
  globalCustomTemplate?: string
): string {
  // Per-staff language preference takes priority
  if (staff.preferredLanguage) {
    switch (staff.preferredLanguage) {
      case 'en':
        return DEFAULT_ENGLISH_TELEGRAM_TEMPLATE;
      case 'compact':
        return DEFAULT_COMPACT_TELEGRAM_TEMPLATE;
      case 'km':
        return DEFAULT_KHMER_TELEGRAM_TEMPLATE;
    }
  }

  // Fall back to global custom template, then default Khmer
  return (globalCustomTemplate && globalCustomTemplate.trim())
    ? globalCustomTemplate
    : DEFAULT_KHMER_TELEGRAM_TEMPLATE;
}

/** Choices for "remember a visitor": months, 0 turns the memory off. */
export const REMEMBER_VISITOR_OPTIONS: RememberVisitorMonths[] = [0, 1, 2, 3, 6];
export const DEFAULT_REMEMBER_VISITOR_MONTHS: RememberVisitorMonths = 1;

/** Memory window in milliseconds (0 when the memory is off). A month counts as 30 days. */
export function visitorMemoryMs(settings: Pick<RoundRobinSettings, 'rememberVisitorMonths'>): number {
  const months = settings.rememberVisitorMonths ?? DEFAULT_REMEMBER_VISITOR_MONTHS;
  return REMEMBER_VISITOR_OPTIONS.includes(months) ? months * 30 * 24 * 60 * 60 * 1000 : 0;
}

/** Phone digits that identify a customer regardless of formatting: last 8 digits, ignoring a leading 0 or +855. */
export function phoneKey(phone?: string | null): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 7) return '';
  return digits.slice(-8);
}

export const emailKey = (email?: string | null) => (email || '').trim().toLowerCase();

/** Two leads from the same customer: same phone, or same non-empty email. */
export function sameCustomer(a: { phone?: string; email?: string }, b: { phone?: string; email?: string }): boolean {
  const pa = phoneKey(a.phone);
  if (pa && pa === phoneKey(b.phone)) return true;
  const ea = emailKey(a.email);
  return Boolean(ea) && ea === emailKey(b.email);
}

/**
 * The salesperson a returning visitor or customer should stay with, if they are
 * still able to take the assignment. Null means: use the rotation.
 */
export function rememberedStaff(settings: RoundRobinSettings, staffId: string | undefined, need?: StaffRequirement): RoundRobinStaff | null {
  // Working hours and page teams do not apply here: a returning customer stays with "their" person.
  if (!staffId || visitorMemoryMs(settings) <= 0) return null;
  // Same eligibility as the rotation: a remembered person who could not take a
  // fresh assignment (inactive, no username for a click, no Chat ID while
  // colleagues have one) is not kept either.
  return eligibleStaff(settings, need).find((s) => s.id === staffId) || null;
}

/** What the assignee must have so the route actually reaches them. */
export type StaffRequirement = 'username' | 'chatId';

/**
 * Staff who can take an assignment right now. A direct-contact click needs a
 * Telegram username to redirect to; a form lead needs a Chat ID for the alert.
 * With a requirement nobody meets, form leads fall back to every active member
 * (the lead is still recorded and the manager alerted), clicks return nobody.
 */
export function eligibleStaff(settings: RoundRobinSettings, need?: StaffRequirement, ctx?: RoutingContext): RoundRobinStaff[] {
  const active = (settings.staffList || []).filter((s) => s.isActive);
  let pool: RoundRobinStaff[];
  if (!need) pool = active;
  else {
    const fit = active.filter((s) => (need === 'username' ? cleanTelegramUsername(s.telegramUsername) : (s.telegramChatId || '').trim()));
    pool = fit.length > 0 ? fit : need === 'chatId' ? active : [];
  }
  if (!ctx) return pool;
  // Preferences narrow the pool only when someone is left, so a lead or click is never lost:
  // first the page's team, then who is working now.
  pool = prefer(pool, (s) => staffServesPage(s, ctx.pageSlug));
  if (ctx.nowMs !== undefined) pool = prefer(pool, (s) => staffOnShift(s, ctx.nowMs!));
  return pool;
}

/** Where and when an assignment happens, for page teams and working hours. */
export interface RoutingContext {
  pageSlug?: string;
  nowMs?: number;
}

const prefer = <T,>(pool: T[], keep: (item: T) => boolean): T[] => {
  const kept = pool.filter(keep);
  return kept.length ? kept : pool;
};

/** True when the person serves this page (no pages chosen = every page). */
export function staffServesPage(s: Pick<RoundRobinStaff, 'pages'>, pageSlug?: string): boolean {
  if (!pageSlug || !s.pages || s.pages.length === 0) return true;
  return s.pages.includes(pageSlug.toLowerCase());
}

/** True when the person is working at this moment (no hours set = always). */
export function staffOnShift(s: Pick<RoundRobinStaff, 'workHours'>, nowMs: number): boolean {
  return withinHours(s.workHours, nowMs);
}

/**
 * When the person's response clock starts for a lead given at `fromMs`: right
 * away during their hours, otherwise when their next shift opens.
 */
export function shiftStartMs(s: Pick<RoundRobinStaff, 'workHours'>, fromMs: number): number {
  if (!s.workHours || withinHours(s.workHours, fromMs)) return fromMs;
  return nextOpeningMs(s.workHours, fromMs) ?? fromMs;
}

const assignments = (s: RoundRobinStaff) => (s.totalLeadsRouted || 0) + (s.totalDirectClicks || 0);

/**
 * Select the next staff member.
 *
 * - weighted_percentage: deterministic "smooth" weighting. Each member is owed
 *   share × total assignments so far; the one furthest behind gets the next one.
 *   Over time everybody ends up exactly at their percentage and nobody gets five
 *   leads in a row while a colleague waits.
 * - strict_round_robin: one after another, ignoring percentages.
 * - random_weighted: lottery in proportion to the percentages.
 */
export function selectNextStaff(
  settings: RoundRobinSettings,
  options: { need?: StaffRequirement; ctx?: RoutingContext } = {}
): { staff: RoundRobinStaff; effectivePercentage: number; nextIndex: number } | null {
  const activeStaff = eligibleStaff(settings, options.need, options.ctx);
  if (activeStaff.length === 0) return null;

  if (activeStaff.length === 1) {
    return { staff: activeStaff[0], effectivePercentage: 100, nextIndex: 0 };
  }

  if (settings.algorithm === 'strict_round_robin') {
    const currentIndex = (settings.lastAssignedIndex || 0) % activeStaff.length;
    return {
      staff: activeStaff[currentIndex],
      effectivePercentage: Math.round(100 / activeStaff.length),
      nextIndex: (currentIndex + 1) % activeStaff.length
    };
  }

  const weights = activeStaff.map((s) => Math.max(0, s.percentage || 0));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const nextIndex = ((settings.lastAssignedIndex || 0) + 1) % activeStaff.length;

  if (totalWeight <= 0) {
    // No percentages set: plain rotation.
    const idx = (settings.lastAssignedIndex || 0) % activeStaff.length;
    return { staff: activeStaff[idx], effectivePercentage: Math.round(100 / activeStaff.length), nextIndex: (idx + 1) % activeStaff.length };
  }

  const share = (i: number) => weights[i] / totalWeight;

  if (settings.algorithm === 'random_weighted') {
    const randomValue = Math.random() * totalWeight;
    let accumulated = 0;
    let picked = 0;
    for (let i = 0; i < activeStaff.length; i++) {
      accumulated += weights[i];
      if (randomValue <= accumulated) { picked = i; break; }
    }
    return { staff: activeStaff[picked], effectivePercentage: Math.round(share(picked) * 100), nextIndex };
  }

  // weighted_percentage: largest deficit wins; ties go to whoever waited longest, then list order.
  const total = activeStaff.reduce((sum, s) => sum + assignments(s), 0) + 1;
  let picked = -1;
  let bestDeficit = -Infinity;
  for (let i = 0; i < activeStaff.length; i++) {
    if (weights[i] <= 0) continue;
    const deficit = share(i) * total - assignments(activeStaff[i]);
    const waitedLonger =
      picked >= 0 && Math.abs(deficit - bestDeficit) < 1e-9 &&
      (activeStaff[i].lastAssignedAt || '') < (activeStaff[picked].lastAssignedAt || '');
    if (deficit > bestDeficit + 1e-9 || waitedLonger) {
      bestDeficit = deficit;
      picked = i;
    }
  }
  if (picked < 0) picked = 0;
  return { staff: activeStaff[picked], effectivePercentage: Math.round(share(picked) * 100), nextIndex };
}

/**
 * Where a visitor goes when nobody can take the click: the page's or the site's
 * contact account, or the bot with a deep link so it can greet them by campaign.
 */
export function resolveFallbackTelegramUrl(params: { pageSlug: string; contactUsername?: string; botUsername?: string }): string {
  const bot = cleanTelegramUsername(params.botUsername) || DEFAULT_BOT_USERNAME;
  const contact = cleanTelegramUsername(params.contactUsername);
  if (contact && contact.toLowerCase() !== bot.toLowerCase()) return `https://t.me/${contact}`;
  // Telegram deep-link payloads only allow [A-Za-z0-9_-], max 64 chars.
  const payload = `khb_${params.pageSlug}`.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 64);
  return `https://t.me/${bot}?start=${payload}`;
}

export interface RoundRobinHealthItem {
  level: 'error' | 'warning' | 'ok';
  title: string;
  detail: string;
}

/**
 * Readiness check shown at the top of the Round Robin admin page: everything
 * that would make a visitor or a lead land nowhere.
 */
export function roundRobinHealth(
  settings: RoundRobinSettings,
  context: { telegramConfigured: boolean; contactUsername?: string },
  lang: 'en' | 'kh' = 'en'
): RoundRobinHealthItem[] {
  const items: RoundRobinHealthItem[] = [];
  const active = (settings.staffList || []).filter((s) => s.isActive);
  const placeholders = (settings.staffList || []).filter(isPlaceholderStaff);
  const noUsername = active.filter((s) => !cleanTelegramUsername(s.telegramUsername));
  const noChatId = active.filter((s) => !(s.telegramChatId || '').trim());
  const contact = cleanTelegramUsername(context.contactUsername);
  const fallbackIsBot = !contact || contact.toLowerCase() === DEFAULT_BOT_USERNAME.toLowerCase();
  const kh = lang === 'kh';
  const target = fallbackIsBot ? (kh ? 'Bot' : 'the bot') : '@' + contact;
  const names = (list: RoundRobinStaff[]) => list.map((s) => s.name).join(', ');

  if (placeholders.length > 0) {
    items.push({
      level: 'error',
      title: kh
        ? `នៅមានគណនីគំរូ ${placeholders.length} នៅក្នុងក្រុម`
        : `${placeholders.length} sample account${placeholders.length > 1 ? 's' : ''} still in the team`,
      detail: kh
        ? `${names(placeholders)} ជាគណនីគំរូ មិនមែនមនុស្សពិតទេ។ អ្នកទស្សនាដែលបញ្ជូនទៅពួកគេនឹងមិនដល់នរណាឡើយ។ សូមជំនួសដោយក្រុមរបស់លោកអ្នក ឬលុបចេញ។`
        : `${names(placeholders)} are demo entries, not real people. Visitors routed to them reach nobody. Replace them with your team or delete them.`,
    });
  }
  if (!settings.enabled) {
    items.push({
      level: 'warning',
      title: kh ? 'Round Robin កំពុងផ្អាក' : 'Round Robin is paused',
      detail: kh
        ? `រាល់ការចុច Telegram ទៅកាន់ ${target} ហើយ Lead ពីទម្រង់ទៅដល់តែក្រុម Chat ប៉ុណ្ណោះ។`
        : `Every Telegram click goes to ${target} and form leads only reach the group chat.`,
    });
  } else if (active.length === 0) {
    items.push({
      level: 'error',
      title: kh ? 'គ្មានបុគ្គលិកសកម្ម' : 'No active staff',
      detail: kh
        ? `គ្មាននរណាទទួល Lead ទេ។ សូមបន្ថែមយ៉ាងហោចណាស់ម្នាក់ដែលមាន Telegram Username។ រហូតដល់ពេលនោះ ការចុចនឹងទៅកាន់ ${target}។`
        : `Nobody receives leads. Add at least one person with a Telegram username. Until then clicks go to ${target}.`,
    });
  }
  if (noUsername.length > 0) {
    items.push({
      level: 'error',
      title: kh
        ? `សមាជិកសកម្ម ${noUsername.length} នាក់គ្មាន Telegram Username`
        : `${noUsername.length} active member${noUsername.length > 1 ? 's' : ''} without a Telegram username`,
      detail: kh
        ? `${names(noUsername)}៖ មិនអាចបញ្ជូនអ្នកទស្សនាទៅពួកគេបានទេ ដូច្នេះត្រូវរំលងពេលមានការចុច។`
        : `${names(noUsername)}: visitors cannot be redirected to them, so they are skipped for clicks.`,
    });
  }
  if (!context.telegramConfigured) {
    items.push({
      level: 'warning',
      title: kh ? 'បាត់ Bot Token' : 'Bot token missing',
      detail: kh
        ? 'ការចុចនៅតែបញ្ជូនទៅបុគ្គលិក ប៉ុន្តែគ្មាននរណាទទួលការជូនដំណឹង ហើយ Lead ពីទម្រង់មិនផ្ញើទៅ Telegram ទេ។ សូមបញ្ចូល Token ពី @BotFather ខាងក្រោម។'
        : 'Clicks still redirect to staff, but nobody gets an alert and form leads are not delivered to Telegram. Add the token from @BotFather below.',
    });
  } else if (noChatId.length > 0) {
    items.push({
      level: 'warning',
      title: kh
        ? `សមាជិកសកម្ម ${noChatId.length} នាក់គ្មាន Chat ID`
        : `${noChatId.length} active member${noChatId.length > 1 ? 's' : ''} without a Chat ID`,
      detail: kh
        ? `${names(noChatId)}៖ ពួកគេមិនទទួលការជូនដំណឹងពេលអ្នកទស្សនាត្រូវបញ្ជូនមក ហើយ Lead ពីទម្រង់នឹងរំលងពួកគេ។ សូមឱ្យម្នាក់ៗផ្ញើ /start ទៅ Bot រួចបិទភ្ជាប់ Chat ID ហើយចុច Test។`
        : `${names(noChatId)}: they get no alert when a visitor is sent to them, and form leads skip them. Ask each to send /start to the bot, then paste their Chat ID and press Test.`,
    });
  }
  if (settings.directContactRoutingEnabled === false) {
    items.push({
      level: 'warning',
      title: kh ? 'ការបញ្ជូនទំនាក់ទំនងផ្ទាល់ត្រូវបានបិទ' : 'Direct contact routing is off',
      detail: kh
        ? `ការចុច "Chat on Telegram" រំលងក្រុម ហើយទៅកាន់ ${target}។`
        : `"Chat on Telegram" clicks bypass the team and go to ${target}.`,
    });
  }
  if (settings.enabled && active.length > 0 && !settings.managerChatId && !settings.fallbackChatId) {
    items.push({
      level: 'warning',
      title: kh ? 'គ្មានច្បាប់ចម្លងទៅអ្នកគ្រប់គ្រង' : 'No manager copy',
      detail: kh
        ? 'សូមកំណត់ Chat ID អ្នកគ្រប់គ្រង ឬ Fallback ដើម្បីឃើញគ្រប់ Lead ទោះការជូនដំណឹងទៅបុគ្គលិកបរាជ័យក៏ដោយ។'
        : 'Set a Manager or Fallback Chat ID so you see every routed lead even when a staff alert fails.',
    });
  }
  if (items.length === 0) {
    items.push({
      level: 'ok',
      title: kh ? 'រួចរាល់' : 'Ready',
      detail: kh
        ? `សមាជិកសកម្ម ${active.length} នាក់ ទាក់ទងបានទាំងអស់ ការជូនដំណឹងបើក។`
        : `${active.length} active member${active.length > 1 ? 's' : ''}, every one reachable, alerts on.`,
    });
  }
  return items;
}

/**
 * Parses a Telegram Bot API response. A proxy error page or outage returns
 * HTML instead of JSON; report that plainly rather than as a JSON parse error.
 */
export interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
  result?: { message_id?: number; url?: string; [key: string]: unknown };
}

export async function readTelegramResponse(res: Response): Promise<TelegramApiResponse> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error_code: res.status, description: `Could not reach the Telegram API (HTTP ${res.status}). Check the server's internet access and try again.` };
  }
}

/** Escapes text for Telegram messages sent with parse_mode 'HTML'. */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Renders a customizable Telegram message template with lead and staff variables
 */
export function renderLeadTemplate(
  template: string,
  lead: Lead,
  staff: RoundRobinStaff,
  options?: {
    leadUrl?: string;
    whatsappUrl?: string;
  }
): string {
  const tpl = (template && template.trim()) ? template : DEFAULT_KHMER_TELEGRAM_TEMPLATE;
  const cleanUsername = (staff.telegramUsername || '').replace(/^@/, '');
  const staffTag = cleanUsername ? `@${cleanUsername}` : staff.name;
  const leadUrl = options?.leadUrl || `https://sale.khbevents.com/admin/leads?id=${lead.id}`;
  const whatsappUrl = options?.whatsappUrl || `https://wa.me/${toWhatsAppNumber(lead.phone)}`;
  const timeFormatted = new Date(lead.createdAt || Date.now()).toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' });

  return tpl
    .replace(/\{clientName\}/gi, escapeHtml(lead.fullName || 'N/A'))
    .replace(/\{phone\}/gi, escapeHtml(lead.phone || 'N/A'))
    .replace(/\{email\}/gi, escapeHtml(lead.email || 'មិនមាន'))
    .replace(/\{company\}/gi, escapeHtml(lead.company || 'រូបវន្តបុគ្គល / ទូទៅ'))
    .replace(/\{eventType\}/gi, escapeHtml(lead.eventType || 'N/A'))
    .replace(/\{budget\}/gi, escapeHtml(lead.budgetRange || lead.packageInterest || 'មិនទាន់កំណត់'))
    .replace(/\{package\}/gi, escapeHtml(lead.packageInterest || lead.budgetRange || 'មិនទាន់កំណត់'))
    .replace(/\{date\}/gi, escapeHtml(lead.estimatedDate || 'មិនទាន់កំណត់'))
    .replace(/\{scale\}/gi, escapeHtml(lead.guestCount || 'មិនទាន់កំណត់'))
    .replace(/\{note\}/gi, escapeHtml(lead.message || 'មិនមាន'))
    .replace(/\{pageTitle\}/gi, escapeHtml(lead.landingPageTitle || 'KHB Events'))
    .replace(/\{pageSlug\}/gi, escapeHtml(lead.landingPageSlug || ''))
    .replace(/\{staffName\}/gi, escapeHtml(staff.name || 'Staff'))
    .replace(/\{staffTelegram\}/gi, escapeHtml(staffTag))
    .replace(/\{weight\}/gi, `${staff.percentage || 0}%`)
    .replace(/\{leadId\}/gi, escapeHtml(lead.id || ''))
    .replace(/\{whatsappLink\}/gi, `<a href="${whatsappUrl}">💬 ចុចទីនេះដើម្បីផ្ញើសារ WhatsApp</a>`)
    .replace(/\{whatsappUrl\}/gi, whatsappUrl)
    .replace(/\{crmLink\}/gi, `<a href="${leadUrl}">📂 បើកមើលក្នុងប្រព័ន្ធ KHB Leads CRM</a>`)
    .replace(/\{crmUrl\}/gi, leadUrl)
    .replace(/\{source\}/gi, escapeHtml(lead.utmSource || 'Direct'))
    .replace(/\{campaign\}/gi, escapeHtml(lead.utmCampaign || 'N/A'))
    .replace(/\{location\}/gi, escapeHtml([lead.customFields?.visitorCity, lead.customFields?.visitorCountry].filter(Boolean).join(', ') || 'N/A'))
    .replace(/\{time\}/gi, timeFormatted);
}

/**
 * Renders a customizable WhatsApp pre-filled greeting text
 */
export function renderWhatsappGreeting(
  template: string,
  lead: Lead,
  staff: RoundRobinStaff
): string {
  const tpl = (template && template.trim()) ? template : DEFAULT_KHMER_WHATSAPP_MESSAGE;
  return tpl
    .replace(/\{clientName\}/gi, lead.fullName || '')
    .replace(/\{staffName\}/gi, staff.name || '')
    .replace(/\{pageTitle\}/gi, lead.landingPageTitle || 'KHB Events')
    .replace(/\{company\}/gi, lead.company || '')
    .replace(/\{phone\}/gi, lead.phone || '');
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
    customTemplate?: string;
    customWhatsappMessage?: string;
    /** Runs the manager copy after the response (server passes runAfterResponse); default is fire-and-forget. */
    defer?: (task: () => Promise<unknown>) => void;
    /** Extra line shown above the lead card, e.g. "returning customer". */
    noteLine?: string;
    /** Contacted / No answer / Not interested buttons under the card (default on). */
    claimButtons?: boolean;
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
  const whatsappGreeting = renderWhatsappGreeting(
    options?.customWhatsappMessage || '',
    lead,
    staff
  );
  const whatsappUrl = `https://wa.me/${toWhatsAppNumber(lead.phone)}?text=${encodeURIComponent(whatsappGreeting)}`;

  const staffTemplate = getTemplateForStaff(staff, options?.customTemplate);
  const card = renderLeadTemplate(
    staffTemplate,
    lead,
    staff,
    { leadUrl, whatsappUrl }
  );
  const text = options?.noteLine ? `${options.noteLine}\n\n${card}` : card;

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const res = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: staff.telegramChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(options?.claimButtons === false ? {} : { reply_markup: claimKeyboard(lead.id) }),
      })
    });

    const data = await readTelegramResponse(res);

    if (res.ok && data.ok) {
      // Send CC to Manager if enabled
      if (options?.enableManagerNotification && options?.managerChatId) {
        const managerText = `🔔 <b>ការជូនដំណឹងអំពីការចាត់ចែង Lead ថ្មី (CC សម្រាប់ថ្នាក់ដឹកនាំ)</b>
━━━━━━━━━━━━━━━━━━━━
Lead <b>#${escapeHtml(lead.id)}</b> ពីទំព័រ <b>${escapeHtml(lead.landingPageTitle)}</b> ត្រូវបានចាត់ចែងជូន៖
👤 <b>បុគ្គលិកទទួលបន្ទុក៖</b> <b>${escapeHtml(staff.name)}</b> (${escapeHtml(staffTag)})
📞 <b>អតិថិជន៖</b> <b>${escapeHtml(lead.fullName)}</b> (${escapeHtml(lead.phone)})
📊 <b>ចំណែកភាគរយ៖</b> ${staff.percentage}%
⏰ <b>ពេលវេលា៖</b> ${new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}`;

        const sendManagerCopy = () => fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: options.managerChatId,
            text: managerText,
            parse_mode: 'HTML',
            disable_web_page_preview: true
          })
        });
        if (options.defer) options.defer(sendManagerCopy);
        else sendManagerCopy().catch((err) => console.error('Manager CC error:', err));
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
        const fallbackText = `⚠️ <b>ការបញ្ជូនទៅបុគ្គលិកមិនជោគជ័យ - បញ្ជូនបន្តមកអ្នកគ្រប់គ្រង (FALLBACK)</b>
━━━━━━━━━━━━━━━━━━━━
មិនអាចផ្ញើជូនបុគ្គលិក៖
👤 <b>${escapeHtml(staff.name)}</b> (Chat ID: <code>${escapeHtml(staff.telegramChatId)}</code>)
❌ <b>មូលហេតុ៖</b> ${escapeHtml(errorDesc)}

📋 <b>ព័ត៌មានអតិថិជន៖</b>
• <b>ឈ្មោះអតិថិជន៖</b> <b>${escapeHtml(lead.fullName)}</b> (${escapeHtml(lead.phone)})
• <b>យុទ្ធនាការ៖</b> ${escapeHtml(lead.landingPageTitle)}
• <b>ប្រភេទកម្មវិធី៖</b> ${escapeHtml(lead.eventType)}
• <b>កញ្ចប់សេវា/ថវិកា៖</b> ${escapeHtml(lead.budgetRange || 'មិនមាន')}
━━━━━━━━━━━━━━━━━━━━
⚠️ <b>សកម្មភាពចាំបាច់៖</b> សូមចាត់ចែងបុគ្គលិកផ្សេងទៀតដើម្បីទាក់ទងអតិថិជននេះជាបន្ទាន់។
👉 <a href="${leadUrl}">📂 បើកមើលក្នុងប្រព័ន្ធ KHB Leads CRM</a>`;

        const fallbackRes = await fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: options.fallbackChatId,
            text: fallbackText,
            parse_mode: 'HTML'
          })
        });
        const fallbackData = await readTelegramResponse(fallbackRes);
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
  } catch (err) {
    console.error('Round Robin Telegram dispatch error:', err);
    return {
      status: 'FAILED',
      error: errorMessage(err, 'Network error connecting to Telegram')
    };
  }
}

/**
 * Test a Telegram account connection by sending a verification ping or custom template preview
 */
export async function testStaffTelegramConnection(
  botToken: string,
  chatId: string,
  staffName: string,
  username?: string,
  customTemplate?: string,
  preferredLanguage?: 'km' | 'en' | 'compact'
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
  
  let text = '';
  if (customTemplate && customTemplate.trim()) {
    const sampleLead: Lead = {
      id: 'lead-test-sample',
      landingPageId: 'sample-page',
      landingPageSlug: 'smart-city-tea-cafe',
      landingPageTitle: 'Smart City, Tea & Cafe Delegation 2026',
      fullName: 'ឧកញ៉ា ហេង ប៊ុនឡេង (Mr. Bunleng Heng)',
      email: 'bunleng.heng@enterprise.com.kh',
      phone: '+855 12 777 666',
      company: 'Heng Global Logistics & Beverage',
      eventType: 'VIP Trade Delegation',
      budgetRange: '$6,600 (3 VIP Passes)',
      packageInterest: 'VIP Chairman Suite Pass',
      message: '[សារសាកល្បង] ចាប់អារម្មណ៍ទិញគ្រឿងម៉ាស៊ីនតែបៃតងស្វ័យប្រវត្តិ។',
      status: 'NEW',
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      utmSource: 'facebook_ads',
      utmCampaign: 'vietnam_b2b_trade'
    };
    const sampleStaff: RoundRobinStaff = {
      id: 'sample-staff',
      name: staffName,
      title: 'Sales Representative',
      telegramUsername: username || 'khb_sales',
      telegramChatId: chatId,
      percentage: 20,
      isActive: true,
      preferredLanguage,
      totalLeadsRouted: 0,
      totalDirectClicks: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0
    };
    const resolvedTemplate = getTemplateForStaff(sampleStaff, customTemplate);
    text = renderLeadTemplate(resolvedTemplate, sampleLead, sampleStaff);
  } else {
    text = `🔔 <b>KHB EVENTS - តេស្តប្រព័ន្ធតភ្ជាប់ TELEGRAM</b>
━━━━━━━━━━━━━━━━━━━━
ជម្រាបសួរ <b>${escapeHtml(staffName)}</b> ${cleanUser ? `(@${escapeHtml(cleanUser)})` : ''}!

✅ <b>ការតភ្ជាប់ទទួលបានជោគជ័យ ១០០%!</b>
គណនី Telegram របស់អ្នកត្រូវបានភ្ជាប់ជាមួយ <b>ប្រព័ន្ធចាត់ចែង Lead ដោយស្វ័យប្រវត្តិនៃ KHB Events</b>។ អ្នករួចរាល់ក្នុងការទទួលព័ត៌មានអតិថិជនថ្មីៗតាមពេលវេលាជាក់ស្តែង។

⏱️ <b>ពេលវេលាផ្ទៀងផ្ទាត់៖</b> ${new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}
━━━━━━━━━━━━━━━━━━━━
<i>KHB Events • Cambodia's Premier Event Production</i>`;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });

    const data = await readTelegramResponse(res);

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
  } catch (err) {
    return {
      success: false,
      error: errorMessage(err, 'Network failure reaching api.telegram.org'),
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
