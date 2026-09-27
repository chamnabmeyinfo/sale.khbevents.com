import { describe, expect, it } from 'vitest';
import { CHAT_KEPT, mergeChat, pendingTranscripts, spokenText } from '../chat-store';
import { storyMarkdown } from '../lead-story';
import { normalizeInsight } from '../lead-ai';
import type { Lead } from '../types';

const T0 = Date.parse('2026-09-27T09:00:00Z');

describe('mergeChat', () => {
  it('adds new messages, keeps transcripts already made, marks voice as pending, orders oldest first', () => {
    const first = mergeChat(null, 'lead-1', 'staff-1', [
      { id: 2, out: true, atMs: T0 + 1000, text: 'Hello' },
      { id: 1, out: false, atMs: T0, text: '', media: 'voice', duration: 7 },
    ]);
    expect(first.messages.map((m) => m.id)).toEqual([1, 2]);
    expect(first.messages[0]).toMatchObject({ media: 'voice', duration: 7, tstatus: 'pending' });
    expect(pendingTranscripts(first, 5)).toHaveLength(1);
    first.messages[0].transcript = 'សួស្តី';
    first.messages[0].tstatus = 'done';
    const second = mergeChat(first, 'lead-1', 'staff-1', [
      { id: 3, out: false, atMs: T0 + 2000, text: 'Price?' },
      { id: 1, out: false, atMs: T0, text: '', media: 'voice', duration: 7 },
    ]);
    expect(second.messages.map((m) => m.id)).toEqual([1, 2, 3]);
    expect(second.messages[0]).toMatchObject({ transcript: 'សួស្តី', tstatus: 'done' });
    expect(pendingTranscripts(second, 5)).toHaveLength(0);
    expect(spokenText(second.messages[0])).toBe('សួស្តី');
  });

  it('keeps only the newest messages', () => {
    const many = Array.from({ length: CHAT_KEPT + 20 }, (_, i) => ({ id: i + 1, out: false, atMs: T0 + i * 1000, text: `m${i + 1}` }));
    const chat = mergeChat(null, 'lead-1', 'staff-1', many);
    expect(chat.messages).toHaveLength(CHAT_KEPT);
    expect(chat.messages[0].id).toBe(21);
  });
});

describe('storyMarkdown', () => {
  const lead: Lead = {
    id: 'lead-abc', landingPageSlug: 'vietnam', landingPageTitle: 'Vietnam Trip', fullName: 'Chan Srey', email: 'none', phone: '',
    eventType: 'Telegram chat', status: 'CONTACTED', notes: [{ id: 'n1', text: 'Asked for the agenda', author: 'Admin', createdAt: new Date(T0 + 5000).toISOString() }],
    customFields: { telegramUserId: 'u77', telegramUsername: 'chansrey' }, utmSource: 'facebook',
    routing: { staffId: 'staff-1', staffName: 'Dara', staffTelegram: '@dara', percentageWeight: 100, status: 'DELIVERED', routeType: 'DIRECT_CONTACT_CLICK', chat: { fromCustomer: 2, fromUs: 1, firstReplySeconds: 120, lastAt: new Date(T0 + 3000).toISOString(), lastFrom: 'us', updatedAt: '' } } as Lead['routing'],
    createdAt: new Date(T0).toISOString(), updatedAt: new Date(T0).toISOString(),
  };
  it('tells the whole story: profile, numbers, conversation with voice as text, notes', () => {
    const md = storyMarkdown(lead, {
      leadId: 'lead-abc', staffId: 'staff-1', updatedAt: '',
      messages: [
        { id: 1, out: false, atMs: T0, text: 'សួស្តី តម្លៃប៉ុន្មាន?' },
        { id: 2, out: false, atMs: T0 + 1000, text: '', media: 'voice', duration: 9, transcript: 'ខ្ញុំចង់ទៅថ្ងៃទី 12', tstatus: 'done' },
        { id: 3, out: true, atMs: T0 + 3000, text: '$550' },
        { id: 4, out: false, atMs: T0 + 4000, text: '', media: 'voice', duration: 4, tstatus: 'pending' },
      ],
    }, []);
    expect(md).toContain('# Chan Srey');
    expect(md).toContain('@chansrey');
    expect(md).toContain('**Came from:** source facebook');
    expect(md).toContain('**Our first reply took:** 2 min');
    expect(md).toContain('Customer:** សួស្តី តម្លៃប៉ុន្មាន?');
    expect(md).toContain('🎤 (voice 9s) ខ្ញុំចង់ទៅថ្ងៃទី 12');
    expect(md).toContain('Dara:** $550');
    expect(md).toContain('voice message 4s (not yet transcribed)');
    expect(md).toContain('Asked for the agenda');
    expect(md).not.toContain('none');
  });
});

describe('normalizeInsight', () => {
  it('keeps known fields only, with safe defaults', () => {
    const i = normalizeInsight({ summary: ' Wants Vietnam ', heat: 'boiling', objections: ['price', 7, 'dates', 'x', 'y', 'z'], confidence: 'high', extra: 1 });
    expect(i.summary).toBe('Wants Vietnam');
    expect(i.heat).toBe('warm');
    expect(i.objections).toEqual(['price', 'dates', 'x', 'y']);
    expect(i.confidence).toBe('high');
    expect((i as unknown as Record<string, unknown>).extra).toBeUndefined();
  });
});
