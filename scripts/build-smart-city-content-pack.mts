/**
 * Builds the Smart City page content pack from the copy module and writes it to
 *   content/pages/smart-city-tea-cafe.json   (import via Admin → Pages → Import JSON)
 * and merges the same fields into data/db.json (the bundled fallback).
 *
 * Run: node --experimental-strip-types scripts/build-smart-city-content-pack.mts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { CONTENT } from '../src/components/landing/smart-city-content.ts';

const en = CONTENT.en;
const kh = CONTENT.kh;
const withIds = <T extends object>(prefix: string, items: T[]) => items.map((it, i) => ({ id: `${prefix}-${i + 1}`, ...it }));

const dbPath = 'data/db.json';
const db = JSON.parse(readFileSync(dbPath, 'utf8'));
const page = db.pages.find((p: { slug: string }) => p.slug === 'smart-city-tea-cafe');
if (!page) throw new Error('smart-city-tea-cafe not in data/db.json');

const coordinator = page.isolatedSettings?.coordinatorName || 'Our coordinator';

const enValueStack = {
  tag: en.valueStackTag, title: en.valueStackTitle, subtitle: en.valueStackSubtitle, note: en.valueStackNote,
  totalLabel: en.valueStackTotalLabel, totalValue: en.valueStackTotalValue, payLabel: en.valueStackPayLabel,
  inclusions: en.inclusions.map((inc, i) => ({ id: `inc-${i + 1}`, title: inc.title, desc: inc.desc, standalonePrice: en.valueStackPrices[i] })),
};
const khValueStack = {
  tag: kh.valueStackTag, title: kh.valueStackTitle, subtitle: kh.valueStackSubtitle, note: kh.valueStackNote,
  totalLabel: kh.valueStackTotalLabel, totalValue: kh.valueStackTotalValue, payLabel: kh.valueStackPayLabel,
  inclusions: kh.inclusions.map((inc, i) => ({ id: `inc-${i + 1}`, title: inc.title, desc: inc.desc, standalonePrice: kh.valueStackPrices[i] })),
};

// FAQ in the CMS cannot hold live numbers, so the price question is phrased without one.
const cmsFaqs = (copy: typeof en) => copy.faqs({
  phase: 'standard', earlyBirdPrice: 0, regularPrice: 0, currentPrice: 0, savings: 0,
  totalSeats: 30, claimedSeats: 0, seatsLeft: 0, earlyBirdDeadline: '', registrationDeadline: '', departureDate: '',
  coordinatorName: coordinator,
}).map((f, i) => ({ id: `f${i + 1}`, question: f.q, answer: f.a }));
const enFaqs = cmsFaqs(en).map(f => (f.question.startsWith('What is not included') ? { ...f, question: 'What is not included in the price?' } : f));
const khFaqs = cmsFaqs(kh).map(f => (f.question.startsWith('តើអ្វីមិនរួមបញ្ចូល') ? { ...f, question: 'តើអ្វីមិនរួមបញ្ចូលក្នុងតម្លៃ?' } : f));

const extraCoreValuesEn = [
  { num: '05', icon: 'chart', title: 'Business and leisure in one trip', desc: 'Two expo days and a factory visit, then Hanoi\'s Old Quarter and a Halong Bay cruise. You come home with deals and a rest.' },
  { num: '06', icon: 'chart', title: 'See your market from outside', desc: 'Walking a foreign market shows you where Cambodia\'s café and retail scene is heading, and how to strengthen your business at home.' },
];
const extraCoreValuesKh = [
  { num: '05', icon: 'chart', title: 'អាជីវកម្ម និងកម្សាន្តក្នុងដំណើរតែមួយ', desc: 'ពិព័រណ៍ ២ ថ្ងៃ និងទស្សនារោងចក្រ បន្ទាប់មកទីក្រុងចាស់ហាណូយ និងកប៉ាល់ហាឡុងបេ។ លោកអ្នកត្រឡប់មកជាមួយកិច្ចព្រមព្រៀង និងការសម្រាក។' },
  { num: '06', icon: 'chart', title: 'មើលទីផ្សារលោកអ្នកពីខាងក្រៅ', desc: 'ការដើរមើលទីផ្សារបរទេស បង្ហាញលោកអ្នកថាវិស័យកាហ្វេ និងលក់រាយកម្ពុជាកំពុងទៅទិសណា និងរបៀបពង្រឹងអាជីវកម្មនៅផ្ទះ។' },
];
const extraAudienceEn = { tag: 'Explorers', icon: 'users', title: 'Anyone exploring IoT, coffee or tea businesses', desc: 'Looking for your next business idea in smart-city tech, coffee or tea? Four days inside the market beats four months of research.' };
const extraAudienceKh = { tag: 'អ្នកស្វែងរក', icon: 'users', title: 'អ្នកដែលស្វែងរកអាជីវកម្ម IoT កាហ្វេ ឬតែ', desc: 'កំពុងរកគំនិតអាជីវកម្មបន្ទាប់ក្នុងបច្ចេកវិទ្យា Smart City កាហ្វេ ឬតែ? បួនថ្ងៃក្នុងទីផ្សារ ល្អជាងបួនខែស្រាវជ្រាវ។' };

const audienceTags = ['IoT & Tech', 'F&B Roasters', 'Supply Chain', 'Franchise & Retail'];

const pack = {
  slug: page.slug,
  title: 'Smart City, Tea & Cafe Business Trip to Vietnam 2026',
  subtitle: 'Smart City, Tea & Cafe Business Trip to Vietnam · 8 to 11 October 2026',
  description: 'A 4-day B2B delegation to Hanoi and Halong Bay for Cambodian café, tea and retail-tech owners: Cafe Show Vietnam, Smart City Expo, a factory visit and matched supplier meetings with a trilingual guide.',
  category: page.category,
  badge: 'Cambodia\'s B2B delegation to Vietnam · 30 seats',
  heroHeadline: en.heroTitle,
  heroSubheadline: en.heroSubtitle,
  heroCtaText: en.heroCtaDiscover,
  heroCtaLink: '#register',
  metaTitle: 'Smart City, Tea & Cafe Business Trip to Vietnam 2026 | KHB Events',
  metaDescription: '4-day B2B delegation to Hanoi and Halong Bay for Cambodian café, tea and retail-tech owners. Two expos, a factory visit, matched supplier meetings and a trilingual guide. 30 seats. Reserve with no payment today.',
  // Only the fields the copy owns. Deadlines and seat counts stay whatever the admin set;
  // the import merges nested objects key by key.
  urgency: {
    riskNote: en.heroRiskNote,
    // Left empty on purpose: the page writes the notice itself from the live phase, price and seat count.
    noticeText: '',
    // Confirmed selling price. Equal prices mean "no early-bird window", and the page shows one plan.
    earlyBirdPrice: 550,
    regularPrice: 550,
  },
  coreValues: withIds('cv', [...en.coreValues, ...extraCoreValuesEn]),
  problems: withIds('prob', en.problems),
  audiences: withIds('aud', [...en.audiences.map((a, i) => ({ ...a, tag: audienceTags[i] })), extraAudienceEn]),
  valueStack: enValueStack,
  // Empty so the page renders pricing from urgency.earlyBirdPrice / regularPrice, the single source of truth.
  packages: [],
  // No real quotes yet. The section is hidden until genuine testimonials are added in the admin.
  testimonials: [],
  // Speakers, artists and booths have no real entries either; the template shows nothing for them.
  sectionVisibility: { testimonials: false, speakers: false, artists: false, expoBooths: false },
  // The order a buyer decides in: outcome, proof, problem, fit, what you get, who you meet,
  // the days, the photos, then scarcity, price, the three steps, the form, and objections last.
  sectionOrder: [
    'hero', 'highlights', 'coreValues', 'problems', 'audiences', 'valueStack', 'matchmaker',
    'itinerary', 'gallery', 'urgency', 'testimonials', 'packages', 'guarantee', 'form', 'faqs',
    'speakers', 'artists', 'expoBooths',
  ],
  guarantee: { badge: '100% risk-free reservation', title: en.guaranteeTitle, subtitle: en.guaranteeText, points: en.guaranteePoints },
  faqs: enFaqs,
  formConfig: {
    headline: en.registrationSectionTitle,
    subheadline: `${coordinator} calls you within 15 minutes. Nothing to pay today.`,
    submitButtonText: en.formSubmitBtn,
    successMessage: `Thank you. ${coordinator} from KHB Events will call or message you within 15 minutes to confirm the details.`,
    fields: (page.formConfig?.fields || []).map((f: { id: string; placeholder?: string }) =>
      f.id === 'fullName' ? { ...f, placeholder: 'e.g. Sok Sovann' }
      : f.id === 'phone' ? { ...f, label: 'Phone (Telegram or WhatsApp)', placeholder: 'e.g. 012 345 678' }
      : f.id === 'email' ? { ...f, label: 'Work email (optional)', placeholder: 'name@company.com.kh' } : f),
  },
  isolatedSettings: {
    customCtaText: en.formSubmitBtn,
    customThankYouMessage: `Thank you. ${coordinator} from KHB Events will call or message you within 15 minutes to confirm the details.`,
  },
  translations: {
    kh: {
      title: kh.heroHeadlineHighlight,
      subtitle: kh.heroHeadlineHighlight,
      description: kh.heroSubtitle,
      badge: 'ប្រតិភូ B2B កម្ពុជាទៅវៀតណាម · ៣០ កៅអី',
      heroHeadline: kh.heroTitle,
      heroSubheadline: kh.heroSubtitle,
      heroCtaText: kh.heroCtaDiscover,
      venue: kh.pillDest,
      urgencyRiskNote: kh.heroRiskNote,
      urgencyNotice: '',
      coreValues: withIds('cv', [...kh.coreValues, ...extraCoreValuesKh]),
      problems: withIds('prob', kh.problems),
      audiences: withIds('aud', [...kh.audiences, extraAudienceKh]),
      itinerary: withIds('itin', kh.itinerary),
      valueStack: khValueStack,
      guarantee: { badge: 'កក់គ្មានហានិភ័យ ១០០%', title: kh.guaranteeTitle, subtitle: kh.guaranteeText, points: kh.guaranteePoints },
      faqs: khFaqs,
      metaTitle: 'ដំណើរអាជីវកម្ម Smart City, Tea & Cafe ទៅវៀតណាម ២០២៦ | KHB Events',
      metaDescription: 'ដំណើរ B2B ៤ ថ្ងៃទៅហាណូយ និងហាឡុងបេ សម្រាប់ម្ចាស់ហាងកាហ្វេ តែ និងបច្ចេកវិទ្យាលក់រាយកម្ពុជា។ ពិព័រណ៍ ២ ទស្សនារោងចក្រ ជួបអ្នកផ្គត់ផ្គង់ មគ្គុទ្ទេសក៍ ៣ ភាសា។ ៣០ កៅអី។ កក់ដោយមិនបង់ប្រាក់ថ្ងៃនេះ។',
    },
  },
};

writeFileSync('content/pages/smart-city-tea-cafe.json', JSON.stringify(pack, null, 2) + '\n');
// Same one-level merge the admin "Import JSON" button performs.
for (const [key, value] of Object.entries(pack)) {
  const current = page[key];
  const plain = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v);
  page[key] = plain(value) && plain(current) ? { ...current, ...(value as object) } : value;
}
page.updatedAt = new Date().toISOString();
writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n');
console.log('content pack written; keys:', Object.keys(pack).join(', '));
