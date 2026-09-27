import { describe, expect, it } from 'vitest';
import { summarize, webChatCode, webChatCodeIn, type WebChatMessage } from '../web-chat-types';

const T0 = Date.parse('2026-09-27T09:00:00Z');
const m = (from: WebChatMessage['from'], offsetS: number, text = 'x'): WebChatMessage => ({ id: `m${offsetS}`, from, text, at: new Date(T0 + offsetS * 1000).toISOString() });

describe('web chat codes', () => {
  it('derives a code from the id and finds it in a Telegram message', () => {
    expect(webChatCode('wc_abc123xyz789')).toBe('#WC-XYZ789');
    expect(webChatCodeIn('💬 Live chat · Reply here · #wc-xyz789')).toBe('#WC-XYZ789');
    expect(webChatCodeIn('no code here')).toBeUndefined();
    expect(webChatCodeIn(undefined)).toBeUndefined();
  });
});

describe('summarize', () => {
  it('counts both sides, the first reply time and the last message', () => {
    const s = summarize({ messages: [m('visitor', 0, 'hello'), m('staff', 240, 'hi'), m('visitor', 300, 'price?')] });
    expect(s).toMatchObject({ fromVisitor: 2, fromStaff: 1, firstReplySeconds: 240, lastFrom: 'visitor', lastText: 'price?' });
    expect(s.lastAt).toBe(new Date(T0 + 300_000).toISOString());
  });

  it('has no reply time before the team answers, and ignores system lines in the counts', () => {
    const s = summarize({ messages: [m('visitor', 0), m('system', 10, 'closed by Admin')] });
    expect(s).toMatchObject({ fromVisitor: 1, fromStaff: 0, lastFrom: 'system' });
    expect(s.firstReplySeconds).toBeUndefined();
  });

  it('handles an empty chat', () => {
    expect(summarize({ messages: [] })).toMatchObject({ fromVisitor: 0, fromStaff: 0, lastFrom: 'system', lastText: '' });
  });
});
