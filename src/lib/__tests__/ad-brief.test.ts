import { describe, expect, it } from 'vitest';
import { allowedNumbers, factLines, numbersIn, pageBrief, unbackedNumbers } from '../ad-brief';
import type { LandingPage } from '../types';

const NOW = Date.parse('2026-09-20T05:00:00Z');

function builderPage(): LandingPage {
  return {
    id: 'p1', slug: 'korea-b2b-trip-2026', title: 'Korea Business Trip 2026', subtitle: '', description: 'A 4-day business trip to Seoul.', category: 'Trade Delegation', status: 'published', template: 'builder',
    heroHeadline: '', heroSubheadline: '', heroCtaText: '', heroCtaLink: '', highlights: [], packages: [], gallery: [], testimonials: [], faqs: [], formConfig: {} as LandingPage['formConfig'],
    metaTitle: '', metaDescription: '', viewsCount: 0, leadsCount: 0, createdAt: '', updatedAt: '',
    translations: { kh: { title: 'ដំណើរកូរ៉េ ២០២៦', description: 'ដំណើរ ៤ ថ្ងៃ' } },
    isolatedSettings: { coordinatorName: 'Mr. Tim Vutha', phone: '012345678' },
    builder: {
      version: 1, defaultLang: 'kh',
      offer: { name: { en: 'Korea business trip, Seoul, 25 to 28 Nov 2026', kh: 'ដំណើរកូរ៉េ ២៥-២៨ វិច្ឆិកា ២០២៦' }, price: 799, compareAtPrice: null, currency: 'USD', priceNote: { en: 'per person', kh: 'ក្នុងម្នាក់' }, deadline: '2026-10-15T16:59:59.000Z', earlyPrice: 750, earlyUntil: '2026-09-30T16:59:59.000Z', stockTotal: null, stockLeft: null, stockLabel: { en: 'seats left', kh: 'កន្លែងនៅសល់' }, cta: { action: 'url', url: 'https://t.me/VuthaTim' } },
      brand: { accent: '#E5A93C', radius: 'soft' },
      blocks: [
        { id: 'h', type: 'hero', variant: 'fullbleed', headline: { en: 'Find Korean suppliers in three sectors, in one trip.', kh: 'រកអ្នកផ្គត់ផ្គង់កូរ៉េក្នុងវិស័យ ៣ ក្នុងដំណើរតែមួយ។' }, sub: { en: 'Three trade fairs in Seoul.', kh: 'ពិព័រណ៍ ៣ នៅសេអ៊ូល។' }, ctaLabel: { en: 'Chat on Telegram', kh: 'ជជែកតាម Telegram' }, riskNote: { en: 'No payment today', kh: 'មិនបង់ប្រាក់ថ្ងៃនេះ' }, style: {} },
        { id: 'b', type: 'benefits', variant: 'cards', title: { en: 'Three fairs', kh: 'ពិព័រណ៍ ៣' }, items: [{ icon: 'star', title: { en: 'Korea International Optic Fair', kh: 'Korea International Optic Fair' }, text: { en: 'Eyewear suppliers.', kh: 'អ្នកផ្គត់ផ្គង់វ៉ែនតា។' } }], style: {} },
        { id: 'i', type: 'included', variant: 'checklist', title: { en: 'Included', kh: 'រួមបញ្ចូល' }, items: [{ en: 'Return flights', kh: 'សំបុត្រយន្តហោះទៅមក' }, { en: 'Hotel 3 nights', kh: 'សណ្ឋាគារ ៣ យប់' }], style: {} },
        { id: 'f', type: 'form', variant: 'split', title: { en: 'Reserve a seat' }, askEmail: false, askMessage: true, interestLabel: { en: 'Which sector?' }, interestOptions: [{ en: 'Eyewear' }, { en: 'Camping gear' }], submitLabel: { en: 'Reserve my seat, no payment today' }, successTitle: { en: 'Thank you' }, successText: { en: 'Our coordinator calls you within a day.' }, style: {} },
        { id: 'q', type: 'faq', variant: 'accordion', title: { en: 'FAQ' }, items: [{ q: { en: 'Do I pay today?' }, a: { en: 'No. You pay after the call.' } }], style: {} },
        { id: 'c', type: 'finalCta', variant: 'centered', headline: { en: 'Seats are limited.' }, ctaLabel: { en: 'Reserve now' }, style: {} },
      ],
    } as unknown as LandingPage['builder'],
  } as LandingPage;
}

describe('page brief for Gen Ads', () => {
  it('reads every block of a builder page in both languages, with the live facts', () => {
    const b = pageBrief(builderPage(), NOW);
    expect(b.defaultLang).toBe('kh');
    expect(b.ctaKind).toBe('telegram');
    expect(b.coordinatorName).toBe('Mr. Tim Vutha');
    expect(b.sections.en.map((s) => s.kind)).toEqual(['hero', 'benefits', 'included', 'form', 'faq', 'finalCta']);
    expect(b.text.en).toContain('Headline: Find Korean suppliers in three sectors, in one trip.');
    expect(b.text.en).toContain('Q: Do I pay today? A: No. You pay after the call.');
    expect(b.text.en).toContain('Question asked: Which sector? (Eyewear / Camping gear)');
    expect(b.text.en).toContain('Price today: $750 per person');
    expect(b.text.en).toContain('Early-bird price until 30 September 2026 (then $799)');
    expect(b.text.en).toContain('Registration closes 15 October 2026');
    expect(b.text.kh).toContain('ចំណងជើង'.length ? 'Headline: រកអ្នកផ្គត់ផ្គង់កូរ៉េ' : '');
    expect(b.text.kh).toContain('តម្លៃពិសេសដំបូងដល់ថ្ងៃ 30 កញ្ញា 2026');
    // The phone number is not part of the brief.
    expect(b.text.en).not.toContain('012345678');
    expect(b.text.kh).not.toContain('012345678');
  });

  it('after the early-bird date the facts show the regular price and no early-bird line', () => {
    const later = Date.parse('2026-10-05T05:00:00Z');
    const lines = factLines(pageBrief(builderPage(), later).facts, 'en');
    expect(lines).toEqual(['Price today: $799 per person', 'Registration closes 15 October 2026']);
  });

  it('reads a classic page from its fields and Khmer translations', () => {
    const p = { ...builderPage(), template: undefined, builder: undefined, heroHeadline: 'Meet 30 roasters in one hall', heroSubheadline: 'Cafe Show Vietnam', heroCtaText: 'Reserve a seat', heroCtaLink: '/register', coreValues: [{ id: '1', title: 'Factory-direct prices', desc: 'Walk the floor.' }], faqs: [{ id: 'f', question: 'Visa?', answer: 'Not needed.' }], translations: { kh: { heroHeadline: 'ជួបអ្នកលីងកាហ្វេ ៣០', faqs: [{ id: 'f', question: 'វីសា?', answer: 'មិនត្រូវការ។' }] } } } as unknown as LandingPage;
    const b = pageBrief(p, NOW);
    expect(b.ctaKind).toBe('form');
    expect(b.facts.builder).toBe(false);
    expect(b.text.en).toContain('Headline: Meet 30 roasters in one hall');
    expect(b.text.en).toContain('Factory-direct prices: Walk the floor.');
    expect(b.text.kh).toContain('Headline: ជួបអ្នកលីងកាហ្វេ ៣០');
    expect(b.text.kh).toContain('Q: វីសា? A: មិនត្រូវការ។');
    expect(b.text.en).toContain('No price, dates or seats are set on this page.');
  });

  it('checks numbers against the page in both scripts, plus the owner notes', () => {
    const b = pageBrief(builderPage(), NOW);
    const allowed = allowedNumbers(b, 'We have 12 seats left');
    expect(unbackedNumbers('Early-bird $750 until 30 September, 3 fairs, 4 days', allowed)).toEqual([]);
    expect(unbackedNumbers('១២ កន្លែង $750', allowed)).toEqual([]);
    // "25" is on the page (25 to 28 Nov), so only the invented numbers are flagged.
    expect(unbackedNumbers('Join 120 business owners, save 25% or 40%', allowed)).toEqual(['120', '40']);
    expect(numbersIn('2,500 and 1.5 and $799.00')).toEqual(['2500', '1.5', '799']);
    // Digits glued to letters are not numbers; the code-added step numbering never backs anything.
    expect(numbersIn('B2B sourcing, 4K photos, COVID-19')).toEqual(['19']);
    expect(unbackedNumbers('A B2B trip for 1 owner', new Set(['4']))).toEqual(['1']);
  });
});
