/**
 * Creates (or updates) the Korea robot and food business trip page
 * /korea-robot-food-trip-2026 as a drag-and-drop builder page in data/db.json.
 *
 * The page is new, so there is no CMS record for a content pack to update:
 * production copies bundled pages that are missing from Supabase on first read
 * (see getPages / getPageBySlug in src/lib/storage.ts). After that, edit it in
 * Admin → Landing Pages CMS → Edit (the builder); re-running this script does
 * not change the live copy.
 *
 * Every fact comes from the owner's caption for this trip (see
 * docs/Business/Trips/Korea Robot and Food Trip Seoul 2026.md). Nothing is
 * invented: no testimonials, seat counts, partners, itinerary or savings claims.
 *
 * Run: npx jiti scripts/build-korea-robot-food-page.mts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { normalizeBuilderDoc, type BuilderDoc } from '../src/lib/builder';

const ID = 'page-korea-robot-food-2026';
const SLUG = 'korea-robot-food-trip-2026';
const TELEGRAM = 'https://t.me/VuthaTim';

// Cambodia time (UTC+7). The caption says "before 31/9/26"; September has 30 days,
// so the early-bird price runs to the end of 30 September. To confirm with the owner.
const EARLY_UNTIL = '2026-09-30T23:59:59+07:00';
const REGISTRATION_CLOSES = '2026-10-10T23:59:59+07:00';

const style = (theme: 'dark' | 'light' | 'brand', align: 'left' | 'center' = 'left') => ({ theme, align, spacing: 'normal' });
const cta = { en: 'Chat with Mr. Tim Vutha on Telegram', kh: 'ជជែកជាមួយ Mr. Tim Vutha តាម Telegram' };
const food = { en: 'Food and beverages', kh: 'អាហារ និងភេសជ្ជៈ' };
const robots = { en: 'Robots, AI and machinery', kh: 'រ៉ូបូត AI និងគ្រឿងយន្ត' };

const draft = {
  version: 1,
  defaultLang: 'kh',
  brand: { accent: '#E5A93C', radius: 'soft' },
  offer: {
    name: { en: 'Korea robot and food business trip, Seoul, 4 to 7 Nov 2026', kh: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្មកូរ៉េ រ៉ូបូត និងអាហារ ៤-៧ វិច្ឆិកា ២០២៦' },
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
      id: 'krf-hero',
      type: 'hero',
      variant: 'fullbleed',
      style: style('dark'),
      badge: { en: 'Seoul · 4 to 7 Nov 2026', kh: 'សេអ៊ូល • ៤-៧ វិច្ឆិកា ២០២៦' },
      headline: { en: 'Find Korean suppliers of robots, AI and food, in one trip', kh: 'ស្វែងរកដៃគូ និងអ្នកផ្គត់ផ្គង់កូរ៉េ ផ្នែករ៉ូបូត និងអាហារ ក្នុងដំណើរតែមួយ' },
      sub: {
        en: 'A 4-day business trip to Seoul for Cambodian businesses sourcing food and beverages, and robot, AI and machinery technology. Visit three trade fairs with a guide who speaks Korean, English and Khmer.',
        kh: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម ៤ ថ្ងៃ ៣ យប់ នៅទីក្រុងសេអ៊ូល សម្រាប់អាជីវកម្មដែលស្វែងរកផលិតផលអាហារ និងភេសជ្ជៈ ព្រមទាំងបច្ចេកវិទ្យារ៉ូបូត AI និងគ្រឿងយន្ត។ ទស្សនាពិព័រណ៍ ៣ ជាមួយមគ្គុទេសក៍និយាយភាសាកូរ៉េ អង់គ្លេស និងខ្មែរ។',
      },
      ctaLabel: cta,
      riskNote: { en: 'Flights, hotel and registration for 3 fairs included', kh: 'រួមបញ្ចូលសំបុត្រយន្តហោះ សណ្ឋាគារ និងការចុះឈ្មោះចូលពិព័រណ៍ ៣' },
    },
    {
      id: 'krf-for',
      type: 'benefits',
      variant: 'cards',
      style: style('light', 'center'),
      title: { en: 'Who this trip is for', kh: 'កម្មវិធីនេះសម្រាប់លោកអ្នកដែលស្វែងរក' },
      sub: { en: 'Businesses looking for products in two sectors.', kh: 'ផលិតផលបោះដុំលើ ២ វិស័យធំៗ នៅប្រទេសកូរ៉េខាងត្បូង។' },
      items: [
        { icon: 'utensils', title: food, text: { en: 'Wholesale food and beverages of every kind, from Korea and around the world.', kh: 'ផលិតផលបោះដុំពាក់ព័ន្ធនឹងអាហារ និងភេសជ្ជៈគ្រប់ប្រភេទ មានប្រភពពីកូរ៉េ និងពិភពលោក។' } },
        { icon: 'robot', title: robots, text: { en: 'Wholesale products and technology for robots, AI and machinery.', kh: 'ផលិតផលបោះដុំ និងបច្ចេកវិទ្យាពាក់ព័ន្ធនឹងរ៉ូបូត AI និងគ្រឿងយន្ត។' } },
      ],
    },
    {
      id: 'krf-fairs',
      type: 'benefits',
      variant: 'rows',
      style: style('dark'),
      title: { en: 'Three trade fairs in Seoul', kh: 'ពិព័រណ៍ពាណិជ្ជកម្ម ៣ នៅទីក្រុងសេអ៊ូល' },
      sub: { en: 'Registration for all three fairs is included. Open each official website for details.', kh: 'តម្លៃរួមបញ្ចូលការចុះឈ្មោះចូលទស្សនាពិព័រណ៍ទាំង ៣។ សូមមើលព័ត៌មានបន្ថែមនៅគេហទំព័រផ្លូវការ។' },
      items: [
        { icon: 'robot', title: { en: 'Robot World 2026', kh: 'Robot World 2026' }, text: { en: 'Robots, AI and machinery.', kh: 'រ៉ូបូត AI និងគ្រឿងយន្ត។' }, link: 'https://eng.robotworld.or.kr/exhibition/introduction.php' },
        { icon: 'utensils', title: { en: 'Food Week Korea 2026', kh: 'Food Week Korea 2026' }, text: { en: 'Food and beverages.', kh: 'អាហារ និងភេសជ្ជៈ។' }, link: 'https://www.foodweek.co.kr/?hl=en' },
        { icon: 'utensils', title: { en: 'World Food Tech 2026', kh: 'World Food Tech 2026' }, text: { en: 'Food and beverages.', kh: 'អាហារ និងភេសជ្ជៈ។' }, link: 'https://www.luminik.io/events/world-foodtech-expo-korea-seoul/' },
      ],
    },
    {
      id: 'krf-included',
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
        { en: 'Registration to visit 3 fairs', kh: 'ការចុះឈ្មោះចូលទស្សនាពិព័រណ៍ចំនួន ៣' },
        { en: 'Help with border-crossing formalities', kh: 'សេវាសម្រួលបែបបទឆ្លងដែន' },
        { en: 'Help finding suppliers in Korea', kh: 'ការជួយស្វែងរកអ្នកផ្គត់ផ្គង់នៅកូរ៉េ' },
      ],
    },
    {
      id: 'krf-offer',
      type: 'offer',
      variant: 'card',
      style: style('light', 'center'),
      title: { en: 'One price, everything above included', kh: 'តម្លៃតែមួយ រួមបញ្ចូលទាំងអស់ខាងលើ' },
      features: [
        { en: 'Return flights and 3 nights in a hotel', kh: 'សំបុត្រយន្តហោះទៅមក និងសណ្ឋាគារ ៣ យប់' },
        { en: 'Hotel breakfast and an MRT card', kh: 'អាហារពេលព្រឹក និងកាតជិះ MRT' },
        { en: 'Registration for 3 fairs and a trilingual guide', kh: 'ការចុះឈ្មោះចូលពិព័រណ៍ ៣ និងមគ្គុទេសក៍ ៣ ភាសា' },
        { en: 'Help finding suppliers in Korea', kh: 'ការជួយស្វែងរកអ្នកផ្គត់ផ្គង់នៅកូរ៉េ' },
      ],
      ctaLabel: cta,
      note: { en: 'Registration closes on 10 October 2026, or earlier when the 25 seats are filled.', kh: 'ឈប់ទទួលចុះឈ្មោះត្រឹមថ្ងៃទី ១០ តុលា ២០២៦ ឬពេលគ្រប់ចំនួនកំណត់ ២៥ នាក់។' },
    },
    {
      id: 'krf-steps',
      type: 'steps',
      variant: 'numbered',
      style: style('light', 'center'),
      title: { en: 'How to join', kh: 'របៀបចុះឈ្មោះ' },
      items: [
        { title: { en: 'Send your details', kh: 'ផ្ញើព័ត៌មានរបស់លោកអ្នក' }, text: { en: 'Fill in the form below, or chat with Mr. Tim Vutha on Telegram.', kh: 'បំពេញទម្រង់ខាងក្រោម ឬជជែកជាមួយ Mr. Tim Vutha តាម Telegram។' } },
        { title: { en: 'Confirm your seat', kh: 'បញ្ជាក់កន្លែងរបស់លោកអ្នក' }, text: { en: 'Our team contacts you to confirm the details and the price.', kh: 'ក្រុមការងាររបស់យើងទាក់ទងលោកអ្នក ដើម្បីបញ្ជាក់ព័ត៌មាន និងតម្លៃ។' } },
        { title: { en: 'Travel to Seoul', kh: 'ធ្វើដំណើរទៅសេអ៊ូល' }, text: { en: 'Fly with the group on 4 November 2026. We help with the border formalities.', kh: 'ធ្វើដំណើរជាមួយក្រុមនៅថ្ងៃទី ៤ វិច្ឆិកា ២០២៦។ យើងជួយសម្រួលបែបបទឆ្លងដែន។' } },
      ],
    },
    {
      id: 'krf-form',
      type: 'form',
      variant: 'split',
      style: style('dark'),
      title: { en: 'Register your interest', kh: 'ចុះឈ្មោះចូលរួម' },
      sub: { en: 'Leave your name and phone number. Our team will contact you about the trip.', kh: 'ទុកឈ្មោះ និងលេខទូរស័ព្ទ។ ក្រុមការងាររបស់យើងនឹងទាក់ទងលោកអ្នកអំពីដំណើរនេះ។' },
      askEmail: false,
      askMessage: true,
      interestLabel: { en: 'Which sector interests you?', kh: 'តើលោកអ្នកចាប់អារម្មណ៍វិស័យណា?' },
      interestOptions: [food, robots, { en: 'Both sectors', kh: 'ទាំង ២ វិស័យ' }],
      submitLabel: { en: 'Send my details', kh: 'ផ្ញើព័ត៌មានរបស់ខ្ញុំ' },
      successTitle: { en: 'Thank you! We received your details.', kh: 'អរគុណ! យើងបានទទួលព័ត៌មានរបស់លោកអ្នកហើយ។' },
      successText: { en: 'Our team will contact you soon. For a faster answer, message Mr. Tim Vutha on Telegram.', kh: 'ក្រុមការងាររបស់យើងនឹងទាក់ទងលោកអ្នកឆាប់ៗនេះ។ ដើម្បីទទួលចម្លើយលឿន សូមផ្ញើសារទៅ Mr. Tim Vutha តាម Telegram។' },
      privacyNote: { en: 'We only use your details to contact you about this trip.', kh: 'យើងប្រើព័ត៌មានរបស់លោកអ្នក សម្រាប់តែទាក់ទងអំពីដំណើរនេះប៉ុណ្ណោះ។' },
    },
    {
      id: 'krf-faq',
      type: 'faq',
      variant: 'accordion',
      style: style('light'),
      title: { en: 'Questions', kh: 'សំណួរញឹកញាប់' },
      items: [
        { q: { en: 'When is the trip?', kh: 'តើដំណើរនេះនៅពេលណា?' }, a: { en: '4 to 7 November 2026: 4 days and 3 nights in Seoul, South Korea.', kh: 'ថ្ងៃទី ៤ ដល់ ៧ ខែវិច្ឆិកា ឆ្នាំ ២០២៦ រយៈពេល ៤ ថ្ងៃ ៣ យប់ នៅទីក្រុងសេអ៊ូល ប្រទេសកូរ៉េខាងត្បូង។' } },
        { q: { en: 'How much does it cost?', kh: 'តើតម្លៃប៉ុន្មាន?' }, a: { en: '$799 per person. Register early and the price is $750 per person: the price card above shows how long the early-bird price lasts.', kh: '$799 ក្នុងម្នាក់។ ចុះឈ្មោះមុន តម្លៃត្រឹម $750 ក្នុងម្នាក់។ កាតតម្លៃខាងលើបង្ហាញរយៈពេលដែលតម្លៃពិសេសនៅសល់។' } },
        { q: { en: 'What does the price include?', kh: 'តើតម្លៃរួមបញ្ចូលអ្វីខ្លះ?' }, a: { en: 'Return flights Cambodia to South Korea, 3 nights in a hotel with breakfast, an MRT card, a tour guide speaking Korean, English and Khmer, registration for 3 fairs, help with border formalities and help finding suppliers in Korea.', kh: 'សំបុត្រយន្តហោះទៅមក កម្ពុជា-កូរ៉េខាងត្បូង សណ្ឋាគារ ៣ យប់ និងអាហារពេលព្រឹក កាតជិះ MRT មគ្គុទេសក៍និយាយភាសាកូរ៉េ អង់គ្លេស និងខ្មែរ ការចុះឈ្មោះចូលពិព័រណ៍ ៣ សេវាសម្រួលបែបបទឆ្លងដែន និងការជួយស្វែងរកអ្នកផ្គត់ផ្គង់នៅកូរ៉េ។' } },
        { q: { en: 'When does registration close?', kh: 'តើឈប់ទទួលចុះឈ្មោះនៅពេលណា?' }, a: { en: 'On 10 October 2026, or earlier when the 25 seats are filled.', kh: 'ត្រឹមថ្ងៃទី ១០ តុលា ២០២៦ ឬមុននោះ ពេលគ្រប់ចំនួនកំណត់ ២៥ នាក់។' } },
        { q: { en: 'Which fairs will we visit?', kh: 'តើយើងនឹងទស្សនាពិព័រណ៍ណាខ្លះ?' }, a: { en: 'Robot World 2026, Food Week Korea 2026 and World Food Tech 2026. Their official websites are linked above.', kh: 'Robot World 2026, Food Week Korea 2026 និង World Food Tech 2026។ តំណគេហទំព័រផ្លូវការមាននៅខាងលើ។' } },
        { q: { en: 'Do you help me find suppliers?', kh: 'តើមានជួយស្វែងរកអ្នកផ្គត់ផ្គង់ទេ?' }, a: { en: 'Yes. Help finding suppliers in Korea is included, and the guide speaks Korean, English and Khmer.', kh: 'បាទ/ចាស។ ការជួយស្វែងរកអ្នកផ្គត់ផ្គង់នៅកូរ៉េ ត្រូវបានរួមបញ្ចូល ហើយមគ្គុទេសក៍និយាយភាសាកូរ៉េ អង់គ្លេស និងខ្មែរ។' } },
        { q: { en: 'Who can I talk to?', kh: 'តើអាចទាក់ទងនរណា?' }, a: { en: 'Mr. Tim Vutha: 060 815 515, or on Telegram at t.me/VuthaTim.', kh: 'Mr. Tim Vutha៖ 060 815 515 ឬតាម Telegram៖ t.me/VuthaTim។' } },
      ],
    },
    {
      id: 'krf-final',
      type: 'finalCta',
      variant: 'split',
      style: style('brand'),
      headline: { en: 'The group is limited to 25 people', kh: 'ក្រុមមានកំណត់ត្រឹម ២៥ នាក់' },
      sub: { en: 'Registration closes on 10 October 2026 or when the group is full. Ask Mr. Tim Vutha your questions today.', kh: 'ឈប់ទទួលចុះឈ្មោះត្រឹមថ្ងៃទី ១០ តុលា ២០២៦ ឬពេលគ្រប់ចំនួន។ សួរ Mr. Tim Vutha ថ្ងៃនេះ។' },
      ctaLabel: cta,
    },
  ],
};

const builder: BuilderDoc = normalizeBuilderDoc(draft);
if (builder.blocks.length !== draft.blocks.length) throw new Error('a block was dropped by normalizeBuilderDoc');
if (builder.offer.cta.action !== 'url' || builder.offer.cta.url !== TELEGRAM) throw new Error('Telegram link was dropped');
const fairs = builder.blocks.find((b) => b.id === 'krf-fairs');
if (!fairs || fairs.type !== 'benefits' || fairs.items.some((i) => !i.link)) throw new Error('a fair link was dropped');

const now = new Date().toISOString();
const fields = {
  id: ID,
  slug: SLUG,
  template: 'builder',
  status: 'published',
  title: 'Korea Business Trip 2026: Robots, AI & Food (Seoul)',
  subtitle: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្មកូរ៉េខាងត្បូង ៤-៧ វិច្ឆិកា ២០២៦',
  description: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម ៤ ថ្ងៃ ៣ យប់ ទៅទីក្រុងសេអ៊ូល ទស្សនាពិព័រណ៍ ៣ លើវិស័យរ៉ូបូត AI គ្រឿងយន្ត និងអាហារ និងភេសជ្ជៈ។',
  category: 'Trade Delegation',
  badge: 'សេអ៊ូល • ៤-៧ វិច្ឆិកា ២០២៦',
  heroHeadline: 'ស្វែងរកដៃគូ និងអ្នកផ្គត់ផ្គង់កូរ៉េ ផ្នែករ៉ូបូត និងអាហារ ក្នុងដំណើរតែមួយ',
  heroSubheadline: '',
  heroCtaText: 'ជជែកជាមួយ Mr. Tim Vutha តាម Telegram',
  heroCtaLink: TELEGRAM,
  heroImage: '',
  ogImage: '',
  eventDate: '2026-11-04',
  eventTime: '4 ថ្ងៃ / 3 យប់ (4-7 វិច្ឆិកា 2026)',
  venue: 'ទីក្រុងសេអ៊ូល ប្រទេសកូរ៉េខាងត្បូង',
  venueAddress: 'Seoul, South Korea',
  countdownEnabled: false,
  // The owner's numbers, kept in the usual fields too (the builder shows its own offer).
  urgency: {
    regularPrice: '799',
    earlyBirdPrice: '750',
    earlyBirdDeadline: EARLY_UNTIL,
    registrationDeadline: REGISTRATION_CLOSES,
    totalSeats: 25,
  },
  sectionVisibility: { testimonials: false },
  testimonials: [],
  faqs: [],
  gallery: [],
  metaTitle: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្មកូរ៉េ រ៉ូបូត AI និងអាហារ ៤-៧ វិច្ឆិកា ២០២៦ | KHB Events',
  metaDescription: 'ទស្សនាពិព័រណ៍ ៣ នៅសេអ៊ូល៖ Robot World, Food Week Korea និង World Food Tech។ រួមបញ្ចូលសំបុត្រយន្តហោះ សណ្ឋាគារ និងមគ្គុទេសក៍ ៣ ភាសា។ $799 ឬ $750 ចុះឈ្មោះមុន។',
  isolatedSettings: { coordinatorName: 'Mr. Tim Vutha', phone: '060 815 515' },
  builder,
};

const dbPath = 'data/db.json';
const db = JSON.parse(readFileSync(dbPath, 'utf8'));
if (db.pages.some((p: { slug: string; id: string }) => p.slug === SLUG && p.id !== ID)) throw new Error(`another page already uses /${SLUG}`);
const existing = db.pages.find((p: { id: string }) => p.id === ID);
if (existing) Object.assign(existing, fields, { updatedAt: now });
else db.pages.push({ ...fields, viewsCount: 0, leadsCount: 0, createdAt: now, updatedAt: now });
writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n');
console.log(`${existing ? 'updated' : 'created'} /${SLUG}: ${builder.blocks.length} sections`);
