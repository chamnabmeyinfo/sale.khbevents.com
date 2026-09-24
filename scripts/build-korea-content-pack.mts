/**
 * Builds the Korea business trip page (/korea-b2b-trip-2026) as a drag-and-drop
 * builder page and writes it to
 *   content/pages/korea-b2b-trip-2026.json   (applied on the next production build)
 * and merges the same fields into data/db.json (the bundled fallback).
 *
 * Every fact comes from the owner's caption for this trip (see
 * docs/Business/Trips/Korea Sourcing Trip Seoul 2026.md). Nothing is invented:
 * no testimonials, seat counts, partners or savings claims.
 *
 * Run: npx jiti scripts/build-korea-content-pack.mts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { normalizeBuilderDoc, type BuilderDoc } from '../src/lib/builder';

const SLUG = 'korea-b2b-trip-2026';
const TELEGRAM = 'https://t.me/VuthaTim';

// Cambodia time (UTC+7). The caption says "before 31/9/26"; September has 30 days,
// so the early-bird price runs to the end of 30 September. To confirm with the owner.
const EARLY_UNTIL = '2026-09-30T23:59:59+07:00';
const REGISTRATION_CLOSES = '2026-10-15T23:59:59+07:00';

const style = (theme: 'dark' | 'light' | 'brand', align: 'left' | 'center' = 'left', spacing: 'compact' | 'normal' | 'roomy' = 'normal') => ({ theme, align, spacing });
const cta = { en: 'Chat with Mr. Tim Vutha on Telegram', kh: 'ជជែកជាមួយ Mr. Tim Vutha តាម Telegram' };

const draft = {
  version: 1,
  defaultLang: 'kh',
  brand: { accent: '#E5A93C', radius: 'soft' },
  offer: {
    name: { en: 'Korea business trip, Seoul, 25 to 28 Nov 2026', kh: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្មកូរ៉េខាងត្បូង ២៥-២៨ វិច្ឆិកា ២០២៦' },
    price: 799,
    compareAtPrice: null,
    earlyPrice: 750,
    earlyUntil: EARLY_UNTIL,
    currency: 'USD',
    priceNote: { en: 'per person', kh: 'ក្នុងម្នាក់' },
    deadline: REGISTRATION_CLOSES,
    deadlineLabel: { en: 'Registration closes in', kh: 'បិទការចុះឈ្មោះក្នុងរយៈពេល' },
    stockTotal: null,
    stockLeft: null,
    stockLabel: { en: 'seats left', kh: 'កន្លែងនៅសល់' },
    cta: { action: 'url', url: TELEGRAM },
  },
  blocks: [
    {
      id: 'kr-hero',
      type: 'hero',
      variant: 'fullbleed',
      style: style('dark'),
      badge: { en: 'Seoul · 25 to 28 Nov 2026', kh: 'សេអ៊ូល • ២៥-២៨ វិច្ឆិកា ២០២៦' },
      headline: { en: 'Find Korean suppliers in three sectors, in one trip', kh: 'ស្វែងរកដៃគូ និងអ្នកផ្គត់ផ្គង់កូរ៉េ ៣ វិស័យ ក្នុងដំណើរតែមួយ' },
      sub: {
        en: 'A 4-day business trip to Seoul for Cambodian businesses sourcing camping and travel gear, eyewear, office supplies and premium gifts. Visit three trade fairs with a guide who speaks Korean, English and Khmer.',
        kh: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម ៤ ថ្ងៃ ៣ យប់ នៅទីក្រុងសេអ៊ូល សម្រាប់អាជីវកម្មដែលស្វែងរកសម្ភារៈបោះតង់ និងដំណើរកម្សាន្ត វ៉ែនតា សម្ភារៈការិយាល័យ និង Premium Gifts។ ទស្សនាពិព័រណ៍ ៣ ជាមួយមគ្គុទេសក៍និយាយភាសាកូរ៉េ អង់គ្លេស និងខ្មែរ។',
      },
      ctaLabel: cta,
      riskNote: { en: 'Flights, hotel and fair registration included', kh: 'រួមបញ្ចូលសំបុត្រយន្តហោះ សណ្ឋាគារ និងការចុះឈ្មោះចូលពិព័រណ៍' },
    },
    {
      id: 'kr-for',
      type: 'benefits',
      variant: 'cards',
      style: style('light', 'center'),
      title: { en: 'Who this trip is for', kh: 'កម្មវិធីនេះសម្រាប់លោកអ្នកដែលស្វែងរក' },
      sub: { en: 'Businesses looking for wholesale products in one of three sectors.', kh: 'ផលិតផលបោះដុំលើ ៣ វិស័យធំៗ ពីប្រទេសកូរ៉េខាងត្បូង។' },
      items: [
        { icon: 'tent', title: { en: 'Camping and travel gear', kh: 'សម្ភារៈបោះតង់ និងដំណើរកម្សាន្ត' }, text: { en: 'Wholesale products for camping and travel.', kh: 'ផលិតផលបោះដុំពាក់ព័ន្ធនឹងសម្ភារៈបោះតង់ និងដំណើរកម្សាន្ត។' } },
        { icon: 'glasses', title: { en: 'Eyewear and eye protection', kh: 'វ៉ែនតា និងសម្ភារៈការពារភ្នែក' }, text: { en: 'Wholesale eyewear and eye-protection products.', kh: 'ផលិតផលបោះដុំពាក់ព័ន្ធនឹងវ៉ែនតា និងសម្ភារៈការពារភ្នែក។' } },
        { icon: 'gift', title: { en: 'Office, household and premium gifts', kh: 'សម្ភារៈការិយាល័យ ក្នុងផ្ទះ និង Premium Gifts' }, text: { en: 'Office supplies, household products and premium gifts for businesses.', kh: 'សម្ភារៈការិយាល័យ សម្ភារៈប្រើប្រាស់ក្នុងផ្ទះ និង Premium Gifts សម្រាប់អាជីវកម្ម។' } },
      ],
    },
    {
      id: 'kr-fairs',
      type: 'benefits',
      variant: 'rows',
      style: style('dark'),
      title: { en: 'Three trade fairs in Seoul', kh: 'ពិព័រណ៍ពាណិជ្ជកម្ម ៣ នៅទីក្រុងសេអ៊ូល' },
      sub: { en: 'Your fair registration is included. Open each official website for details.', kh: 'តម្លៃរួមបញ្ចូលការចុះឈ្មោះចូលទស្សនាពិព័រណ៍។ សូមមើលព័ត៌មានបន្ថែមនៅគេហទំព័រផ្លូវការ។' },
      items: [
        { icon: 'glasses', title: { en: 'Korea International Optic Fair', kh: 'Korea International Optic Fair' }, text: { en: 'Eyewear and eye-protection products.', kh: 'វ៉ែនតា និងសម្ភារៈការពារភ្នែក។' }, link: 'https://kopticsfair.com/en/kopticsfairen/' },
        { icon: 'tent', title: { en: 'Global Outdoor Camping and Leisure Sports Fair', kh: 'Global Outdoor Camping and Leisure Sports Fair' }, text: { en: 'Camping, outdoor and leisure products.', kh: 'សម្ភារៈបោះតង់ សម្ភារៈក្រៅផ្ទះ និងកីឡាកម្សាន្ត។' }, link: 'https://gocaf.kr/eng/' },
        { icon: 'briefcase', title: { en: 'Seoul International Sourcing Fair', kh: 'Seoul International Sourcing Fair' }, text: { en: 'Office supplies, household products and premium gifts.', kh: 'សម្ភារៈការិយាល័យ សម្ភារៈប្រើប្រាស់ក្នុងផ្ទះ និង Premium Gifts។' }, link: 'https://globy.com/events-calendar/sipremium-seoul-international-sourcing-fair-b295f8' },
      ],
    },
    {
      id: 'kr-included',
      type: 'included',
      variant: 'checklist',
      style: style('light'),
      title: { en: 'Everything in the price', kh: 'កម្មវិធីនេះផ្ដល់ជូនលោកអ្នកនូវ' },
      items: [
        { en: 'Return flights Cambodia to South Korea', kh: 'សំបុត្រយន្តហោះទៅមក កម្ពុជា-កូរ៉េខាងត្បូង' },
        { en: 'Hotel for 3 nights, 4 days', kh: 'សណ្ឋាគារស្នាក់នៅ ៣ យប់ ៤ ថ្ងៃ' },
        { en: 'Breakfast at the hotel', kh: 'អាហារពេលព្រឹកនៅសណ្ឋាគារ' },
        { en: 'MRT card for travel in South Korea', kh: 'កាតជិះ MRT នៅកូរ៉េខាងត្បូង' },
        { en: 'Tour guide speaking Korean, English and Khmer', kh: 'មគ្គុទេសក៍ទេសចរណ៍និយាយភាសាកូរ៉េ អង់គ្លេស និងខ្មែរ' },
        { en: 'Registration to visit the fairs', kh: 'ការចុះឈ្មោះចូលទស្សនាពិព័រណ៍' },
        { en: 'Help with border-crossing formalities', kh: 'សេវាសម្រួលបែបបទឆ្លងដែន' },
        { en: 'Help finding suppliers in Korea', kh: 'ការជួយស្វែងរកអ្នកផ្គត់ផ្គង់នៅកូរ៉េ' },
      ],
    },
    {
      id: 'kr-offer',
      type: 'offer',
      variant: 'card',
      style: style('light', 'center'),
      title: { en: 'One price, everything above included', kh: 'តម្លៃតែមួយ រួមបញ្ចូលទាំងអស់ខាងលើ' },
      features: [
        { en: 'Return flights and 3 nights in a hotel', kh: 'សំបុត្រយន្តហោះទៅមក និងសណ្ឋាគារ ៣ យប់' },
        { en: 'Hotel breakfast and an MRT card', kh: 'អាហារពេលព្រឹក និងកាតជិះ MRT' },
        { en: 'Fair registration and a trilingual guide', kh: 'ការចុះឈ្មោះចូលពិព័រណ៍ និងមគ្គុទេសក៍ ៣ ភាសា' },
        { en: 'Help finding suppliers in Korea', kh: 'ការជួយស្វែងរកអ្នកផ្គត់ផ្គង់នៅកូរ៉េ' },
      ],
      ctaLabel: cta,
      note: { en: 'Registration closes on 15 October 2026, or earlier when the 30 seats are filled.', kh: 'ឈប់ទទួលចុះឈ្មោះត្រឹមថ្ងៃទី ១៥ តុលា ២០២៦ ឬពេលគ្រប់ចំនួនកំណត់ ៣០ នាក់។' },
    },
    {
      id: 'kr-steps',
      type: 'steps',
      variant: 'numbered',
      style: style('light', 'center'),
      title: { en: 'How to join', kh: 'របៀបចុះឈ្មោះ' },
      items: [
        { title: { en: 'Send your details', kh: 'ផ្ញើព័ត៌មានរបស់លោកអ្នក' }, text: { en: 'Fill in the form below, or chat with Mr. Tim Vutha on Telegram.', kh: 'បំពេញទម្រង់ខាងក្រោម ឬជជែកជាមួយ Mr. Tim Vutha តាម Telegram។' } },
        { title: { en: 'Confirm your seat', kh: 'បញ្ជាក់កន្លែងរបស់លោកអ្នក' }, text: { en: 'Our team contacts you to confirm the details and the price.', kh: 'ក្រុមការងាររបស់យើងទាក់ទងលោកអ្នក ដើម្បីបញ្ជាក់ព័ត៌មាន និងតម្លៃ។' } },
        { title: { en: 'Travel to Seoul', kh: 'ធ្វើដំណើរទៅសេអ៊ូល' }, text: { en: 'Fly with the group on 25 November 2026. We help with the border formalities.', kh: 'ធ្វើដំណើរជាមួយក្រុមនៅថ្ងៃទី ២៥ វិច្ឆិកា ២០២៦។ យើងជួយសម្រួលបែបបទឆ្លងដែន។' } },
      ],
    },
    {
      id: 'kr-form',
      type: 'form',
      variant: 'split',
      style: style('dark'),
      title: { en: 'Register your interest', kh: 'ចុះឈ្មោះចូលរួម' },
      sub: { en: 'Leave your name and phone number. Our team will contact you about the Korea trip.', kh: 'ទុកឈ្មោះ និងលេខទូរស័ព្ទ។ ក្រុមការងាររបស់យើងនឹងទាក់ទងលោកអ្នកអំពីដំណើរទៅកូរ៉េ។' },
      askEmail: false,
      askMessage: true,
      interestLabel: { en: 'Which sector interests you?', kh: 'តើលោកអ្នកចាប់អារម្មណ៍វិស័យណា?' },
      interestOptions: [
        { en: 'Camping and travel gear', kh: 'សម្ភារៈបោះតង់ និងដំណើរកម្សាន្ត' },
        { en: 'Eyewear and eye protection', kh: 'វ៉ែនតា និងសម្ភារៈការពារភ្នែក' },
        { en: 'Office, household and premium gifts', kh: 'សម្ភារៈការិយាល័យ ក្នុងផ្ទះ និង Premium Gifts' },
        { en: 'All three sectors', kh: 'ទាំង ៣ វិស័យ' },
      ],
      submitLabel: { en: 'Send my details', kh: 'ផ្ញើព័ត៌មានរបស់ខ្ញុំ' },
      successTitle: { en: 'Thank you! We received your details.', kh: 'អរគុណ! យើងបានទទួលព័ត៌មានរបស់លោកអ្នកហើយ។' },
      successText: { en: 'Our team will contact you soon. For a faster answer, message Mr. Tim Vutha on Telegram.', kh: 'ក្រុមការងាររបស់យើងនឹងទាក់ទងលោកអ្នកឆាប់ៗនេះ។ ដើម្បីទទួលចម្លើយលឿន សូមផ្ញើសារទៅ Mr. Tim Vutha តាម Telegram។' },
      privacyNote: { en: 'We only use your details to contact you about this trip.', kh: 'យើងប្រើព័ត៌មានរបស់លោកអ្នក សម្រាប់តែទាក់ទងអំពីដំណើរនេះប៉ុណ្ណោះ។' },
    },
    {
      id: 'kr-faq',
      type: 'faq',
      variant: 'accordion',
      style: style('light'),
      title: { en: 'Questions', kh: 'សំណួរញឹកញាប់' },
      items: [
        { q: { en: 'When is the trip?', kh: 'តើដំណើរនេះនៅពេលណា?' }, a: { en: '25 to 28 November 2026: 4 days and 3 nights in Seoul, South Korea.', kh: 'ថ្ងៃទី ២៥ ដល់ ២៨ ខែវិច្ឆិកា ឆ្នាំ ២០២៦ រយៈពេល ៤ ថ្ងៃ ៣ យប់ នៅទីក្រុងសេអ៊ូល ប្រទេសកូរ៉េខាងត្បូង។' } },
        { q: { en: 'How much does it cost?', kh: 'តើតម្លៃប៉ុន្មាន?' }, a: { en: '$799 per person. Register early and the price is $750 per person: the price card above shows how long the early-bird price lasts.', kh: '$799 ក្នុងម្នាក់។ ចុះឈ្មោះមុន តម្លៃត្រឹម $750 ក្នុងម្នាក់។ កាតតម្លៃខាងលើបង្ហាញរយៈពេលដែលតម្លៃពិសេសនៅសល់។' } },
        { q: { en: 'What does the price include?', kh: 'តើតម្លៃរួមបញ្ចូលអ្វីខ្លះ?' }, a: { en: 'Return flights Cambodia to South Korea, 3 nights in a hotel with breakfast, an MRT card, a tour guide speaking Korean, English and Khmer, fair registration, help with border formalities and help finding suppliers in Korea.', kh: 'សំបុត្រយន្តហោះទៅមក កម្ពុជា-កូរ៉េខាងត្បូង សណ្ឋាគារ ៣ យប់ និងអាហារពេលព្រឹក កាតជិះ MRT មគ្គុទេសក៍និយាយភាសាកូរ៉េ អង់គ្លេស និងខ្មែរ ការចុះឈ្មោះចូលពិព័រណ៍ សេវាសម្រួលបែបបទឆ្លងដែន និងការជួយស្វែងរកអ្នកផ្គត់ផ្គង់នៅកូរ៉េ។' } },
        { q: { en: 'When does registration close?', kh: 'តើឈប់ទទួលចុះឈ្មោះនៅពេលណា?' }, a: { en: 'On 15 October 2026, or earlier when the 30 seats are filled.', kh: 'ត្រឹមថ្ងៃទី ១៥ តុលា ២០២៦ ឬមុននោះ ពេលគ្រប់ចំនួនកំណត់ ៣០ នាក់។' } },
        { q: { en: 'Which fairs will we visit?', kh: 'តើយើងនឹងទស្សនាពិព័រណ៍ណាខ្លះ?' }, a: { en: 'Korea International Optic Fair, Global Outdoor Camping and Leisure Sports Fair, and Seoul International Sourcing Fair. Their official websites are linked above.', kh: 'Korea International Optic Fair, Global Outdoor Camping and Leisure Sports Fair និង Seoul International Sourcing Fair។ តំណគេហទំព័រផ្លូវការមាននៅខាងលើ។' } },
        { q: { en: 'Do you help me find suppliers?', kh: 'តើមានជួយស្វែងរកអ្នកផ្គត់ផ្គង់ទេ?' }, a: { en: 'Yes. Help finding suppliers in Korea is included, and the guide speaks Korean, English and Khmer.', kh: 'បាទ/ចាស។ ការជួយស្វែងរកអ្នកផ្គត់ផ្គង់នៅកូរ៉េ ត្រូវបានរួមបញ្ចូល ហើយមគ្គុទេសក៍និយាយភាសាកូរ៉េ អង់គ្លេស និងខ្មែរ។' } },
        { q: { en: 'Who can I talk to?', kh: 'តើអាចទាក់ទងនរណា?' }, a: { en: 'Mr. Tim Vutha: 060 815 515, or on Telegram at t.me/VuthaTim.', kh: 'Mr. Tim Vutha៖ 060 815 515 ឬតាម Telegram៖ t.me/VuthaTim។' } },
      ],
    },
    {
      id: 'kr-final',
      type: 'finalCta',
      variant: 'split',
      style: style('brand'),
      headline: { en: 'The group is limited to 30 people', kh: 'ក្រុមមានកំណត់ត្រឹម ៣០ នាក់' },
      sub: { en: 'Registration closes on 15 October 2026 or when the group is full. Ask Mr. Tim Vutha your questions today.', kh: 'ឈប់ទទួលចុះឈ្មោះត្រឹមថ្ងៃទី ១៥ តុលា ២០២៦ ឬពេលគ្រប់ចំនួន។ សួរ Mr. Tim Vutha ថ្ងៃនេះ។' },
      ctaLabel: cta,
    },
  ],
};

const builder: BuilderDoc = normalizeBuilderDoc(draft);
if (builder.blocks.length !== draft.blocks.length) throw new Error('a block was dropped by normalizeBuilderDoc');
if (builder.offer.cta.action !== 'url' || builder.offer.cta.url !== TELEGRAM) throw new Error('Telegram link was dropped');

const pack = {
  slug: SLUG,
  template: 'builder',
  status: 'published',
  title: 'Korea Business Trip 2026: Camping, Eyewear, Office & Premium Gifts (Seoul)',
  subtitle: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្មកូរ៉េខាងត្បូង ២៥-២៨ វិច្ឆិកា ២០២៦',
  description: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម ៤ ថ្ងៃ ៣ យប់ ទៅទីក្រុងសេអ៊ូល ទស្សនាពិព័រណ៍ ៣ លើសម្ភារៈបោះតង់ និងដំណើរកម្សាន្ត វ៉ែនតា សម្ភារៈការិយាល័យ និង Premium Gifts។',
  category: 'Trade Delegation',
  badge: 'សេអ៊ូល • ២៥-២៨ វិច្ឆិកា ២០២៦',
  eventDate: '2026-11-25',
  eventTime: '4 ថ្ងៃ / 3 យប់ (25-28 វិច្ឆិកា 2026)',
  venue: 'ទីក្រុងសេអ៊ូល ប្រទេសកូរ៉េខាងត្បូង',
  // The old values pointed at invented venues and a photo file that does not exist.
  venueAddress: 'Seoul, South Korea',
  heroImage: '',
  ogImage: '',
  metaTitle: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្មកូរ៉េខាងត្បូង ២៥-២៨ វិច្ឆិកា ២០២៦ | KHB Events',
  metaDescription: 'ទស្សនាពិព័រណ៍ ៣ នៅសេអ៊ូល៖ សម្ភារៈបោះតង់ និងដំណើរកម្សាន្ត វ៉ែនតា សម្ភារៈការិយាល័យ និង Premium Gifts។ រួមបញ្ចូលសំបុត្រយន្តហោះ សណ្ឋាគារ និងមគ្គុទេសក៍ ៣ ភាសា។ $799 ឬ $750 ចុះឈ្មោះមុន។',
  // Invented or outdated content from the earlier version of this page, removed.
  // The builder template does not show these fields; clearing them keeps them from coming back.
  testimonials: [],
  coreValues: [],
  problems: [],
  audiences: [],
  itinerary: [],
  packages: [],
  highlights: [],
  faqs: [],
  valueStack: { note: '', totalValue: '', inclusions: [] },
  guarantee: { badge: '', points: [] },
  sectionVisibility: { testimonials: false },
  isolatedSettings: {
    coordinatorName: 'Mr. Tim Vutha',
    coordinatorRole: '',
    partnerName: '',
    phone: '060 815 515',
  },
  builder,
};

writeFileSync(`content/pages/${SLUG}.json`, JSON.stringify(pack, null, 2) + '\n');

const dbPath = 'data/db.json';
const db = JSON.parse(readFileSync(dbPath, 'utf8'));
const page = db.pages.find((p: { slug: string }) => p.slug === SLUG);
if (!page) throw new Error(`${SLUG} not in data/db.json`);
// Same one-level merge the admin "Import JSON" button and the production sync perform.
for (const [key, value] of Object.entries(pack)) {
  const current = page[key];
  const plain = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v);
  page[key] = plain(value) && plain(current) ? { ...current, ...(value as object) } : value;
}
page.updatedAt = new Date().toISOString();
writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n');
console.log(`content pack written for /${SLUG}: ${builder.blocks.length} sections`);
