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
