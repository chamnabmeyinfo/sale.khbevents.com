import { describe, expect, it } from 'vitest';
import { companyFor, DEFAULT_LOGO, safeLogo } from '../company';
import { createBlock, normalizeBuilderDoc, type BlockType, type BuilderBlock } from '../builder';
import { orderIssues, suggestedOrder } from '../page-order';

const settings = { companyName: 'KHB Events', brandTagline: 'Tagline', phone: '+855 12 000 000', whatsappNumber: '85512000000', telegramUsername: 'khbevents', email: 'sale@example.com', address: 'Phnom Penh' };

describe('company details', () => {
  it('uses the company settings, and the built-in logo until one is uploaded', () => {
    const c = companyFor(settings);
    expect(c).toMatchObject({ logo: DEFAULT_LOGO, name: 'KHB Events', phone: '+855 12 000 000', telegram: 'khbevents', whatsapp: '85512000000', email: 'sale@example.com', address: 'Phnom Penh' });
    expect(companyFor({ ...settings, logoUrl: 'https://cdn.example.com/logo.png' }).logo).toBe('https://cdn.example.com/logo.png');
  });

  it('a page field wins, an empty page field falls back to the company', () => {
    const c = companyFor({ ...settings, logoUrl: '/api/uploads/company.png' }, { isolatedSettings: { logoUrl: '/api/uploads/page.png', companyName: 'Partner Co', telegramUsername: '@partner', phone: '  ', whatsapp: '+855 99 111 222' } });
    expect(c.logo).toBe('/api/uploads/page.png');
    expect(c.name).toBe('Partner Co');
    expect(c.telegram).toBe('partner');
    expect(c.phone).toBe('+855 12 000 000');
    expect(c.whatsapp).toBe('85599111222');
  });

  it('refuses unsafe logo addresses', () => {
    expect(safeLogo('javascript:alert(1)')).toBeUndefined();
    expect(safeLogo('//evil.example.com/x.png')).toBeUndefined();
    expect(safeLogo('http://plain.example.com/x.png')).toBeUndefined();
    expect(companyFor({ ...settings, logoUrl: 'data:image/png;base64,xx' }).logo).toBe(DEFAULT_LOGO);
  });
});

describe('Contact & company section', () => {
  const page = (...types: BlockType[]): BuilderBlock[] => types.map((type, i) => ({ ...createBlock(type), id: `${type}-${i}` }));

  it('keeps its design and optional heading', () => {
    const [b] = normalizeBuilderDoc({ blocks: [{ type: 'contact', variant: 'card', title: 'Talk to us' }] }).blocks;
    expect(b).toMatchObject({ type: 'contact', variant: 'card', title: { en: 'Talk to us' } });
    const [d] = normalizeBuilderDoc({ blocks: [{ type: 'contact', variant: 'weird' }] }).blocks;
    expect(d.type === 'contact' && d.variant).toBe('footer');
  });

  it('may follow the final call to action, and the suggested order keeps it at the bottom', () => {
    const blocks = page('hero', 'offer', 'form', 'finalCta', 'contact');
    expect(orderIssues(blocks).map((i) => i.key)).not.toContain('finalLast');
    expect(suggestedOrder(page('contact', 'hero', 'finalCta')).map((b) => b.type)).toEqual(['hero', 'finalCta', 'contact']);
  });
});

describe('page footer options', () => {
  it('hides the lines the page turned off and keeps its note', () => {
    const c = companyFor(settings, { isolatedSettings: { contactHidden: ['telegram', 'website', 'address'], footerNote: { en: 'Open Mon–Sat', kh: 'បើក ច័ន្ទ–សៅរ៍' } } });
    expect(c.telegram).toBeUndefined();
    expect(c.address).toBeUndefined();
    expect(c.website).toBe(false);
    expect(c.phone).toBe('+855 12 000 000');
    expect(c.note).toEqual({ en: 'Open Mon–Sat', kh: 'បើក ច័ន្ទ–សៅរ៍' });
    expect(companyFor(settings).website).toBe(true);
    expect(companyFor(settings, { isolatedSettings: { footerNote: { en: '  ' } } }).note).toBeUndefined();
  });

  it('the print closing box uses the page wording, else the default', async () => {
    const { buildPrintPlan } = await import('../print-plan');
    const doc = normalizeBuilderDoc({ offer: { price: 100 }, blocks: [{ type: 'benefits', items: [{ title: 'A' }] }] });
    const closing = (o?: { title?: string; text?: string }) => buildPrintPlan(doc, { lang: 'en', mode: 'agenda', nowMs: Date.now(), closing: o }).sections.find((s) => s.id === 'print-register');
    expect(closing()).toMatchObject({ title: 'Register or ask a question' });
    expect(closing({ title: 'Book your seat', text: 'Call Sovann' })).toMatchObject({ title: 'Book your seat', text: 'Call Sovann' });
  });
});

describe('trip coordinator', () => {
  it('builds the coordinator from the page settings and can be hidden', () => {
    const iso = { coordinatorName: ' Sovann Meas ', coordinatorRole: 'Mission Director', coordinatorRoleKh: 'នាយកបេសកកម្ម', coordinatorAvatar: '/api/uploads/s.png', coordinatorPhone: '012 111 222', coordinatorTelegram: '@sovann', coordinatorBio: { en: 'Leads every trip.' } };
    expect(companyFor(settings, { isolatedSettings: iso }).coordinator).toEqual({
      name: 'Sovann Meas', role: { en: 'Mission Director', kh: 'នាយកបេសកកម្ម' }, photo: '/api/uploads/s.png', phone: '012 111 222', telegram: 'sovann', bio: { en: 'Leads every trip.' },
    });
    expect(companyFor(settings, { isolatedSettings: { ...iso, coordinatorTelegram: 'https://t.me/sovann_kh' } }).coordinator?.telegram).toBe('sovann_kh');
    expect(companyFor(settings, { isolatedSettings: { ...iso, contactHidden: ['coordinator'] } }).coordinator).toBeUndefined();
    expect(companyFor(settings, { isolatedSettings: { coordinatorRole: 'No name' } }).coordinator).toBeUndefined();
  });
});
