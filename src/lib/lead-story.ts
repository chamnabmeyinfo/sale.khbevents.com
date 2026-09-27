/**
 * The story of one customer as a Markdown file: who they are, how they found us,
 * every message both ways (voice messages as text once transcribed), the team's
 * notes and the numbers. The AI coach reads exactly this; the admin can download it.
 */
import { getLeadById, getRoundRobinLogs, phnomPenhStamp } from './storage';
import { getStoredChat, spokenText, type StoredChat } from './chat-store';
import type { Lead, RoundRobinLog } from './types';
import { formatWait } from './lead-response';

export interface LeadStory {
  leadId: string;
  markdown: string;
  /** How many chat messages the story contains. */
  messages: number;
  /** Voice messages still without text. */
  pendingVoice: number;
  generatedAt: string;
}

const line = (label: string, value?: string | number | null) => (value === undefined || value === null || value === '' ? '' : `- **${label}:** ${String(value).replace(/\s+/g, ' ').trim()}\n`);
const when = (iso?: string) => (iso ? phnomPenhStamp(Date.parse(iso)) : '');

/** The customer's story from the lead, its clicks and its stored chat. Null when the lead does not exist. */
export async function buildLeadStory(leadId: string): Promise<LeadStory | null> {
  const lead = await getLeadById(leadId);
  if (!lead) return null;
  const [chat, logs] = await Promise.all([getStoredChat(leadId), getRoundRobinLogs(500).catch(() => [] as RoundRobinLog[])]);
  const clicks = logs.filter((l) => l.leadId === leadId || l.contact?.leadId === leadId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return { leadId, markdown: storyMarkdown(lead, chat, clicks), messages: chat?.messages.length || 0, pendingVoice: (chat?.messages || []).filter((m) => m.tstatus === 'pending').length, generatedAt: new Date().toISOString() };
}

export function storyMarkdown(lead: Lead, chat: StoredChat | null, clicks: RoundRobinLog[]): string {
  const staff = lead.routing?.staffName || 'unassigned';
  const c = lead.customFields || {};
  let md = `# ${lead.fullName}\n\n`;
  md += `## Customer\n\n`;
  md += line('Name', lead.fullName);
  md += line('Telegram', c.telegramUsername ? `@${c.telegramUsername}` : c.telegramUserId ? `user ${c.telegramUserId}` : '');
  md += line('Phone', lead.phone && !/^(none|n\/a|-)?$/i.test(lead.phone) ? lead.phone : '');
  md += line('Email', lead.email && !/@example\./i.test(lead.email) && lead.email !== 'none' ? lead.email : '');
  md += line('Company', lead.company);
  md += line('Interested in', lead.landingPageTitle || lead.landingPageSlug);
  md += line('Event / trip type', lead.eventType);
  md += line('Dates mentioned', lead.estimatedDate);
  md += line('Group size', lead.guestCount);
  md += line('Budget', lead.budgetRange);
  md += line('Package', lead.packageInterest);
  md += line('Deal status', lead.status);
  md += line('Salesperson', staff);
  md += line('First contact', when(lead.createdAt));
  md += line('Last update', when(lead.updatedAt));
  const source = [lead.utmSource && `source ${lead.utmSource}`, lead.utmMedium && `medium ${lead.utmMedium}`, lead.utmCampaign && `campaign ${lead.utmCampaign}`, lead.referrer && `from ${lead.referrer}`].filter(Boolean).join(', ');
  md += line('Came from', source);
  if (lead.tags?.length) md += line('Tags', lead.tags.join(', '));
  if (lead.message) md += `\n**First message / form note:** ${lead.message.trim()}\n`;

  if (clicks.length) {
    md += `\n## Journey (clicks on our pages)\n\n`;
    for (const l of clicks) {
      const v = l.visitor;
      const where = [v?.city, v?.country].filter(Boolean).join(', ');
      md += `- ${when(l.timestamp)}: ${l.routeType === 'FORM_SUBMISSION' ? 'sent the form on' : 'clicked "Chat on Telegram" on'} **${l.pageTitle || l.pageSlug}**${where ? ` (${where})` : ''}${v?.utmSource ? `, came from ${v.utmSource}` : v?.referrer ? `, came from ${v.referrer}` : ''}${l.contact ? `; wrote on Telegram at ${when(l.contact.at)} (${l.contact.match === 'ref' ? 'sure match' : 'probable match'})` : ''}\n`;
    }
  }

  const stats = lead.routing?.chat;
  if (stats && (stats.fromCustomer || stats.fromUs)) {
    md += `\n## Conversation numbers\n\n`;
    md += line('Messages from the customer', stats.fromCustomer);
    md += line('Messages from us', stats.fromUs);
    md += line('Our first reply took', stats.firstReplySeconds !== undefined ? formatWait(stats.firstReplySeconds) : 'no reply yet');
    md += line('Last message', stats.lastAt ? `${when(stats.lastAt)} from ${stats.lastFrom === 'us' ? 'us' : 'the customer'}` : '');
    md += line('Unread from the customer', stats.unread);
  }

  md += `\n## Conversation on Telegram\n\n`;
  if (!chat || !chat.messages.length) {
    md += `_No messages stored yet._\n`;
  } else {
    let day = '';
    for (const m of chat.messages) {
      const d = new Date(m.atMs).toLocaleDateString('en-GB', { timeZone: 'Asia/Phnom_Penh', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      if (d !== day) { md += `\n### ${d}\n\n`; day = d; }
      const time = new Date(m.atMs).toLocaleTimeString('en-GB', { timeZone: 'Asia/Phnom_Penh', hour: '2-digit', minute: '2-digit' });
      const who = m.out ? staff : 'Customer';
      let body = spokenText(m).trim();
      if (m.media === 'voice' || m.media === 'audio') {
        const dur = m.duration ? ` ${m.duration}s` : '';
        body = m.transcript ? `🎤 (voice${dur}) ${body}` : `🎤 voice message${dur}${m.tstatus === 'pending' ? ' (not yet transcribed)' : m.tstatus === 'failed' ? ' (could not be transcribed)' : ''}`;
      } else if (m.media) {
        body = `[${m.media}]${body ? ` ${body}` : ''}`;
      }
      md += `- **${time} ${who}:** ${body.replace(/\n+/g, ' / ')}\n`;
    }
  }

  if (lead.notes?.length) {
    md += `\n## Team notes\n\n`;
    for (const n of [...lead.notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) md += `- ${when(n.createdAt)} (${n.author}): ${n.text.replace(/\s+/g, ' ').trim()}\n`;
  }
  return md;
}

/** A safe file name for the download. */
export function storyFileName(lead: { fullName: string; id: string }): string {
  const base = lead.fullName.normalize('NFKD').replace(/[^\wក-៿]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'customer';
  return `${base}-${lead.id.replace(/^lead-/, '').slice(0, 12)}.md`;
}
