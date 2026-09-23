'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  ShieldCheck, 
  Calendar, 
  Layers, 
  HeartHandshake, 
  Tag, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { LandingPage, LandingPageTranslation } from '@/lib/types';

interface KhmerTranslationEditorProps {
  formData: Partial<LandingPage>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<LandingPage>>>;
}

export const DEFAULT_KHMER_TRANSLATION: LandingPageTranslation = {
  title: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម Smart City, Tea & Cafe ២០២៦',
  subtitle: 'ត្រឡប់មកវិញជាមួយដៃគូផ្គត់ផ្គង់ មិនមែនគ្រាន់តែរូបភាព។',
  description: 'ភ្ជាប់ទំនាក់ទំនងជាមួយរោងចក្រផលិតឈានមុខគេ ទស្សនាពិព័រណ៍ Smart City Expo និង Cafe Show Vietnam ព្រមទាំងស្វែងរកដៃគូអាជីវកម្មបោះដុំនៅទីក្រុង ហាណូយ និង ហាឡុងបេ។',
  badge: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្មកម្រិត B2B ពិសេស ២០២៦',
  heroHeadline: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម Smart City, Tea & Cafe នៅប្រទេសវៀតណាម',
  heroSubheadline: 'ជួបជាមួយរោងចក្រផលិតផ្ទាល់ ទស្សនាពិព័រណ៍ Smart City Expo និង Cafe Show Vietnam ព្រមទាំងស្វែងរកដៃគូអាជីវកម្មបោះដុំនៅទីក្រុង ហាណូយ និង ហាឡុងបេ។',
  heroCtaText: 'កក់កៅអីឥឡូវនេះ',
  venue: 'ហាណូយ & ហាឡុងបេ វៀតណាម',
  urgencyNotice: 'តម្លៃពិសេស Early Bird: ចំណេញ $51 មុនថ្ងៃផុតកំណត់ | កំណត់ត្រឹម 30 នាក់ប៉ុណ្ណោះ',
  urgencyRiskNote: 'មិនត្រូវបង់ប្រាក់ថ្ងៃនេះ • កៅអីត្រូវបានកក់ទុកភ្លាមៗ • ឆ្លើយតបក្នុង ១៥ នាទី',
  metaTitle: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម វៀតណាម ២០២៦ | KHB EVENTS',
  metaDescription: 'ចូលរួមជាមួយ KHB EVENTS ក្នុងដំណើរទស្សនកិច្ចពាណិជ្ជកម្មផ្តាច់មុខទៅកាន់ប្រទេសវៀតណាម។ ការផ្គូផ្គងធុរកិច្ច 1-on-1 បច្ចេកវិទ្យាទីក្រុងឆ្លាតវៃ និងការវិនិយោគតែ & កាហ្វេកម្រិតខ្ពស់។',
  coreValues: [
    { id: 'cv-1', num: '01', icon: 'chart', title: 'អំណាចតម្លៃផ្ទាល់រោងចក្រ', desc: 'ទិញនៅប្រភពផ្ទាល់ កាត់បន្ថយ ២៥% - ៣៥% ពីតម្លៃឈ្មោះកណ្តាល។ គ្រាន់តែការចរចាទូកុងតឺន័រមួយ អាចសងថ្លៃដំណើរទាំងមូលវិញ។' },
    { id: 'cv-2', num: '02', icon: 'shield', title: 'ការជឿជាក់ដោយផ្ទាល់មុខ', desc: 'ដើរលើផ្ទៃរោងចក្រ ពិនិត្យមន្ទីរពិសោធន៍គុណភាព និងជួបផ្គត់ផ្គង់ដោយផ្ទាល់មុខ មុននឹងផ្ទេរប្រាក់នីមួយៗ។' },
    { id: 'cv-3', num: '03', icon: 'trophy', title: 'សិទ្ធិចែកចាយផ្តាច់មុខ', desc: 'កក់សិទ្ធិចែកចាយផ្តាច់មុខនៅកម្ពុជា មុនពេលអ្នកនាំចូលផ្សេងទៀតចុះកិច្ចសន្យាជាមួយផ្គត់ផ្គង់ដូចគ្នា។' },
    { id: 'cv-4', num: '04', icon: 'zap', title: 'ស្គាល់និន្នាការឆ្នាំ ២០២៦ មុនគេ', desc: 'ពិព័រណ៍អន្តរជាតិ ២ ក្នុងដំណើរតែមួយ — ទទួលបានផលិតផល ការវេចខ្ចប់ និងបច្ចេកវិទ្យាលក់រាយឆ្លាតវៃថ្មីៗ មុនដៃគូប្រកួត។' },
  ],
  problems: [
    { id: 'p1', icon: 'trend-down', title: 'ថ្លៃឈ្មោះកណ្តាល', desc: 'ការទិញតាមឈ្មោះកណ្តាលនិងអ្នកលក់បន្ត បន្ថែម ២៥% - ៣៥% លើការបញ្ជាទិញនីមួយៗ មុនដល់ឃ្លាំងរបស់លោកអ្នក។' },
    { id: 'p2', icon: 'chat', title: 'ឧបសគ្គីភាសា & ការជឿជាក់', desc: 'ដោយគ្មានភាសាដូចគ្នា កិច្ចសន្យាតូចៗចប់កណ្តាលផ្លូវ — ហើយលោកអ្នកមិនអាចផ្ទៀងផ្ទាត់បានថាណាមួយជារោងចក្រពិត ឬឈ្មោះកណ្តាល។' },
    { id: 'p3', icon: 'search', title: 'ទិញតាមអ៊ីនធឺណិតដោយគ្មានការផ្ទៀងផ្ទាត់', desc: 'បញ្ជាទិញដោយទុកចិត្តតែរូបភាព។ គ្មានផ្ទៃរោងចក្រ គ្មានមន្ទីរពិសោធន៍គុណភាព គ្មានការចរចាបរិមាណផ្ទាល់មុខ គ្មានទំនាក់ទំនង។' },
  ],
  audiences: [
    { id: 'a1', icon: 'cpu', title: 'អ្នកនាំចូលបច្ចេកវិទ្យា & Smart City', tag: 'Smart City & Tech', desc: 'ស្វែងរកបច្ចេកវិទ្យាទីក្រុងឆ្លាតវៃ ឧបករណ៍ IoT ប្រព័ន្ធសុវត្ថិភាព និងស្វ័យប្រវត្តិកម្មពីរោងចក្រស្តង់ដារអន្តរជាតិ។' },
    { id: 'a2', icon: 'coffee', title: 'ម្ចាស់ប្រេនហាងកាហ្វេ & តែ', tag: 'Cafe & Tea Brands', desc: 'ស្វែងរកប្រភពគ្រាប់កាហ្វេ តែវៀតណាមល្បីៗ ម៉ាស៊ីនឆុងកាហ្វេទំនើប សម្ភារៈវេចខ្ចប់ និងរូបមន្តភេសជ្ជៈថ្មីៗ។' },
    { id: 'a3', icon: 'truck', title: 'អ្នកបោះដុំ & ចែកចាយទូទាំងប្រទេស', tag: 'Wholesalers', desc: 'ទទួលបានសិទ្ធិចែកចាយផ្តាច់មុខ ចរចាតម្លៃបោះដុំផ្ទាល់ពីរោងចក្រ និងសេវាកម្មផលិតក្រោមម៉ាកយីហោផ្ទាល់ខ្លួន (OEM/ODM)។' },
    { id: 'a4', icon: 'users', title: 'សហគ្រិន & អ្នកវិនិយោគ F&B', tag: 'Investors', desc: 'ស្វែងយល់ពីប្រេនល្បីៗនៅវៀតណាម និងអន្តរជាតិ ម៉ូដែលអាជីវកម្មជោគជ័យ និងឱកាសទិញសិទ្ធិអាជីវកម្ម (Franchise)។' },
  ],
  itinerary: [
    {
      id: 'itin-1',
      day: 1,
      date: 'Oct 8, 2026',
      title: 'ភ្នំពេញ ទៅ ហាណូយ & រាត្រីស្វាគមន៍',
      events: [
        { time: '17:45 - 21:35', activity: 'ជើងហោះហើរពី ភ្នំពេញ ទៅ ហាណូយ (ព្រលានយន្តហោះ Noi Bai)' },
        { time: '22:30 - 23:00', activity: 'រថយន្តក្រុងឯកជនជូនទៅសណ្ឋាគារ & ចូលឆែកអ៊ីនស្នាក់នៅទីក្រុង ហាណូយ' },
        { time: '23:00 - 24:00', activity: 'ដើរទស្សនាកម្សាន្តពេលរាត្រីនៅទីក្រុងហាណូយ (កម្មវិធីស្រេចចិត្ត)' },
      ]
    },
    {
      id: 'itin-2',
      day: 2,
      date: 'Oct 9, 2026',
      title: 'ពិព័រណ៍ Cafe Show & ការផ្គូផ្គង B2B',
      events: [
        { time: '08:00 - 09:00', activity: 'អាហារប៊ូហ្វេពេលព្រឹកនៅសណ្ឋាគារ' },
        { time: '09:00 - 09:30', activity: 'ធ្វើដំណើរតាមរថយន្តក្រុងទេសចរណ៍ទៅមជ្ឈមណ្ឌលពិព័រណ៍' },
        { time: '10:00 - 12:00', activity: 'ទស្សនាពិព័រណ៍ Cafe Show Vietnam (តែ, កាហ្វេ, គ្រឿងចក្រ & គ្រឿងផ្សំ)' },
        { time: '12:00 - 13:00', activity: 'សម្រាកទទួលទានអាហារថ្ងៃត្រង់នៅមជ្ឈមណ្ឌលពិព័រណ៍' },
        { time: '13:00 - 16:00', activity: 'ការផ្គូផ្គងធុរកិច្ច B2B ផ្តោតគោលដៅ & ចរចាជាមួយរោងចក្រផ្គត់ផ្គង់' },
        { time: '16:00 - 17:00', activity: 'ត្រឡប់មកសណ្ឋាគារវិញ & សម្រាក' },
        { time: '18:00 - 22:00', activity: 'ដើរទស្សនាវប្បធម៌ Hanoi Old Quarter, ពិសាអាហារល្បីៗ និងកន្លែងទាក់ទាញសំខាន់ៗ' },
      ]
    },
    {
      id: 'itin-3',
      day: 3,
      date: 'Oct 10, 2026',
      title: 'Smart City Expo, ទស្សនារោងចក្រ & ដំណើរទៅ Halong Bay',
      events: [
        { time: '08:00 - 09:00', activity: 'អាហារពេលព្រឹកនៅសណ្ឋាគារ' },
        { time: '09:00 - 09:30', activity: 'រថយន្តក្រុងចេញដំណើរទៅមជ្ឈមណ្ឌលពិព័រណ៍' },
        { time: '10:00 - 12:00', activity: 'ស្វែងយល់ពិព័រណ៍ Smart City Expo (IoT, ប្រព័ន្ធភ្លើងឆ្លាតវៃ, ហេដ្ឋារចនាសម្ព័ន្ធ)' },
        { time: '12:00 - 13:00', activity: 'អាហារថ្ងៃត្រង់' },
        { time: '13:00 - 15:30', activity: 'ទស្សនកិច្ចរោងចក្រកាហ្វេ/តែផ្ទាល់ ឬជួបដៃគូបច្ចេកវិទ្យាកម្រិតខ្ពស់' },
        { time: '15:30 - 18:30', activity: 'ធ្វើដំណើរតាមរថយន្តក្រុងពិសេសឆ្ពោះទៅកាន់ឆ្នេរ Halong Bay' },
        { time: '19:00 - 21:30', activity: 'អាហារពេលល្ងាចគ្រឿងសមុទ្រស្រស់ & សម្រាកនៅសណ្ឋាគារជាប់មាត់សមុទ្រ Halong' },
      ]
    },
    {
      id: 'itin-4',
      day: 4,
      date: 'Oct 11, 2026',
      title: 'ជិះកប៉ាល់ UNESCO Halong Bay & ហោះហើរត្រឡប់មកភ្នំពេញ',
      events: [
        { time: '07:30 - 08:30', activity: 'អាហារពេលព្រឹក & ឆែកចេញពីសណ្ឋាគារ' },
        { time: '09:00 - 13:00', activity: 'ជិះកប៉ាល់ទេសចរណ៍ទស្សនាបេតិកភណ្ឌពិភពលោក UNESCO Halong Bay, រូងភ្នំ & អាហារលើកប៉ាល់' },
        { time: '13:30 - 16:30', activity: 'ធ្វើដំណើរតាមផ្លូវល្បឿនលឿនត្រឡប់ទៅព្រលានយន្តហោះ Noi Bai (ហាណូយ)' },
        { time: '17:00 - 18:30', activity: 'ឆែកអ៊ីនព្រលានយន្តហោះ & ទិញទំនិញរួចពន្ធ Duty Free' },
        { time: '19:00 - 20:50', activity: 'ជើងហោះហើរត្រឡប់មកដល់រាជធានីភ្នំពេញដោយសុវត្ថិភាព' },
      ]
    }
  ],
  guarantee: {
    title: 'ការធានាលើការផ្គូផ្គងដៃគូ ១០០%',
    subtitle: 'ប្រសិនបើលោកអ្នកមិនបានជួបអ្នកផ្គត់ផ្គង់ដែលត្រូវតាមតម្រូវការអាជីវកម្ម យើងនឹងជួយរៀបចំការប្រជុំបន្តដោយឥតគិតថ្លៃ។',
    badge: 'ការធានាពេញចិត្ត ១០០%',
    points: [
      'ធានាការណែនាំអ្នកផ្គត់ផ្គង់ផ្ទាល់',
      'អ្នកបកប្រែពាណិជ្ជកម្មផ្ទាល់ខ្លួនគ្រប់ជំនួប',
      'ជំនួយពិនិត្យកិច្ចសន្យា និងបែបបទច្បាប់',
    ],
  },
  valueStack: {
    tag: 'ប្រភេទសេវាកម្ម',
    title: 'តម្លៃតែមួយ។ ការដោះស្រាយ ៩ ចំណុចពេញលេញ។',
    subtitle: 'អ្វីៗទាំងអស់ខាងក្រោមមានបញ្ចូលក្នុងកៅអីរបស់លោកអ្នក។',
    totalLabel: 'តម្លៃសរុបប្រហាក់ប្រហែល',
    totalValue: '$910+',
    payLabel: 'ការវិនិយោគ Early Bird របស់លោកអ្នក',
    inclusions: [
      { id: 'inc-1', title: 'សំបុត្រយន្តហោះទៅមក', desc: 'សំបុត្រយន្តហោះទៅមក ភ្នំពេញ - ហាណូយ រួមបញ្ចូលរួចជាស្រេច។', standalonePrice: 220 },
      { id: 'inc-2', title: 'សណ្ឋាគារស្នាក់នៅ (៣យប់ / ៤ថ្ងៃ)', desc: 'ការស្នាក់នៅសណ្ឋាគារស្តង់ដារប្រណិតប្រកបដោយផាសុកភាព។', standalonePrice: 150 },
      { id: 'inc-3', title: 'អាហារពេលព្រឹកប្រចាំថ្ងៃ', desc: 'អាហារប៊ូហ្វេពេលព្រឹកនៅសណ្ឋាគារជារៀងរាល់ថ្ងៃ។', standalonePrice: 25 },
      { id: 'inc-4', title: 'រថយន្តក្រុងទេសចរណ៍ពិសេស', desc: 'រថយន្តក្រុងទំនើប ម៉ាស៊ីនត្រជាក់ សម្រាប់គ្រប់ការធ្វើដំណើរនៅវៀតណាម។', standalonePrice: 80 },
      { id: 'inc-5', title: 'មគ្គុទេសក៍ពាណិជ្ជកម្ម ៣ ភាសា', desc: 'មគ្គុទេសក៍ជំនាញនិយាយភាសា ខ្មែរ-អង់គ្លេស-វៀតណាម ជួយសម្រួលការចរចា។', standalonePrice: 60 },
      { id: 'inc-6', title: 'សំបុត្រ VIP ចូលពិព័រណ៍ទាំងអស់', desc: 'ការចុះឈ្មោះចូលទស្សនាពិព័រណ៍ Cafe Show និង Smart City Expo ទាំងមូល។', standalonePrice: 120 },
      { id: 'inc-7', title: 'សេវាសម្រួលបែបបទឆ្លងដែន', desc: 'ការសម្រួលបែបបទអន្តោប្រវេសន៍នៅព្រលានយន្តហោះយ៉ាងរហ័ស។', standalonePrice: 40 },
      { id: 'inc-8', title: 'ការទស្សនារោងចក្រ & កន្លែងបោះដុំផ្ទាល់', desc: 'ចូលទស្សនាខ្សែសង្វាក់ផលិតកម្មកាហ្វេ/តែ និងឃ្លាំងបោះដុំធំៗនៅវៀតណាម។', standalonePrice: 150 },
      { id: 'inc-9', title: 'ជិះកប៉ាល់ទេសចរណ៍ Halong Bay', desc: 'ទស្សនាតំបន់បេតិកភណ្ឌពិភពលោក UNESCO Halong Bay ជាមួយអាហារថ្ងៃត្រង់លើកប៉ាល់។', standalonePrice: 65 },
    ]
  },
  faqs: [
    { id: 'faq-1', question: 'តើខ្ញុំត្រូវបង់ប្រាក់ថ្ងៃនេះទេ?', answer: 'ទេ មិនត្រូវបង់ប្រាក់នៅថ្ងៃនេះទេ។ បន្ទាប់ពីលោកអ្នកបំពេញព័ត៌មានរួច ក្រុមការងារយើងនឹងទាក់ទងមកលោកអ្នកតាម Telegram ឬទូរស័ព្ទដើម្បីផ្ទៀងផ្ទាត់ និងបញ្ជាក់កៅអី។' },
    { id: 'faq-2', question: 'តើខ្ញុំត្រូវការទិដ្ឋាការ (Visa) ទៅប្រទេសវៀតណាមទេ?', answer: 'សម្រាប់អ្នកកាន់លិខិតឆ្លងដែនកម្ពុជា មិនត្រូវការទិដ្ឋាការ (Visa-Free) សម្រាប់រយៈពេលស្នាក់នៅក្រោម ៣០ ថ្ងៃនោះទេ។ លោកអ្នកគ្រាន់តែមានលិខិតឆ្លងដែនដែលមានសុពលភាពយ៉ាងតិច ៦ ខែប៉ុណ្ណោះ។' },
    { id: 'faq-3', question: 'តើមានអ្នកបកប្រែជួយសម្រួលការចរចាជាមួយរោងចក្រទេ?', answer: 'បាទ/ចាស មានមគ្គុទេសក៍ពាណិជ្ជកម្មជំនាញនិយាយ ៣ ភាសា (ខ្មែរ អង់គ្លេស និងវៀតណាម) អមដំណើរលោកអ្នកគ្រប់ពេល ដើម្បីជួយសម្រួលការចរចា និងការពិភាក្សាធុរកិច្ច។' }
  ]
};

export default function KhmerTranslationEditor({ formData, setFormData }: KhmerTranslationEditorProps) {
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'values' | 'problems' | 'audiences' | 'itinerary' | 'valuestack' | 'guarantee' | 'seo'>('hero');

  const kh = formData.translations?.kh || {};

  const updateField = <K extends keyof LandingPageTranslation>(field: K, val: LandingPageTranslation[K]) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...(prev.translations || {}),
        kh: {
          ...(prev.translations?.kh || {}),
          [field]: val
        }
      }
    }));
  };

  const handleAutoFill = () => {
    if (confirm('Are you sure you want to load the standard Khmer copy? It will fill in all missing or default Khmer text.')) {
      setFormData(prev => ({
        ...prev,
        translations: {
          ...(prev.translations || {}),
          kh: {
            ...DEFAULT_KHMER_TRANSLATION,
            ...(prev.translations?.kh || {})
          }
        }
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-400 text-black shrink-0 mt-0.5">
            <span className="text-base font-bold">🇰🇭</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Khmer Translation Manager (កម្មវិធីគ្រប់គ្រងខ្លឹមសារជាភាសាខ្មែរ)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                Active
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
              Information entered here will appear when visitors toggle <strong>ភាសាខ្មែរ</strong> on the public website and mobile app. If a field is left empty, the system automatically uses the standard Khmer dictionary.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAutoFill}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Load Standard Khmer Copy</span>
        </button>
      </div>

      {/* Sub-tabs for Khmer sections */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-emerald-900/40 pb-2">
        {[
          { id: 'hero', label: '1. Hero & Overview', icon: FileText },
          { id: 'values', label: '2. Core Values', icon: HeartHandshake },
          { id: 'problems', label: '3. Problems', icon: AlertCircle },
          { id: 'audiences', label: '4. Audiences', icon: Tag },
          { id: 'itinerary', label: '5. Itinerary', icon: Calendar },
          { id: 'valuestack', label: '6. 9-in-1 Stack', icon: Layers },
          { id: 'guarantee', label: '7. Guarantee & FAQs', icon: ShieldCheck },
          { id: 'seo', label: '8. SEO / Meta', icon: HelpCircle },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-emerald-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: HERO & GENERAL */}
      {activeSubTab === 'hero' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                Campaign Title in Khmer (ចំណងជើងយុទ្ធនាការ)
              </label>
              <span className="text-[11px] text-slate-400">English: &ldquo;{formData.title}&rdquo;</span>
            </div>
            <input
              type="text"
              value={kh.title || ''}
              onChange={e => updateField('title', e.target.value)}
              placeholder="ឧ. ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម Smart City, Tea & Cafe ២០២៦"
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                Top Badge / Tag (ស្លាកសញ្ញា)
              </label>
              <span className="text-[11px] text-slate-400">English: &ldquo;{formData.badge}&rdquo;</span>
            </div>
            <input
              type="text"
              value={kh.badge || ''}
              onChange={e => updateField('badge', e.target.value)}
              placeholder="ឧ. ដំណើរទស្សនកិច្ចពាណិជ្ជកម្មកម្រិត B2B ពិសេស ២០២៦"
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                Hero Main Headline (ចំណងជើងធំផ្នែកខាងលើ)
              </label>
              <span className="text-[11px] text-slate-400">English: &ldquo;{formData.heroHeadline || formData.title}&rdquo;</span>
            </div>
            <input
              type="text"
              value={kh.heroHeadline || ''}
              onChange={e => updateField('heroHeadline', e.target.value)}
              placeholder="ឧ. ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម Smart City, Tea & Cafe នៅប្រទេសវៀតណាម"
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                Headline Highlight (ពាក្យស្លោកលេចធ្លោ / ចំណងជើងរង)
              </label>
              <span className="text-[11px] text-slate-400">English: &ldquo;{formData.subtitle}&rdquo;</span>
            </div>
            <input
              type="text"
              value={kh.subtitle || ''}
              onChange={e => updateField('subtitle', e.target.value)}
              placeholder="ឧ. ត្រឡប់មកវិញជាមួយដៃគូផ្គត់ផ្គង់ មិនមែនគ្រាន់តែរូបភាព។"
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                Hero Subheadline / Paragraph (ការពិពណ៌នាលម្អិតផ្នែកខាងលើ)
              </label>
              <span className="text-[11px] text-slate-400">English: &ldquo;{formData.heroSubheadline || formData.description}&rdquo;</span>
            </div>
            <textarea
              rows={3}
              value={kh.heroSubheadline || ''}
              onChange={e => updateField('heroSubheadline', e.target.value)}
              placeholder="ឧ. ជួបជាមួយរោងចក្រផលិតផ្ទាល់ ទស្សនាពិព័រណ៍ Smart City Expo និង Cafe Show Vietnam ព្រមទាំងស្វែងរកដៃគូអាជីវកម្មបោះដុំនៅទីក្រុង ហាណូយ និង ហាឡុងបេ។"
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                CTA Button Text (អត្ថបទប៊ូតុងចុះឈ្មោះ)
              </label>
              <input
                type="text"
                value={kh.heroCtaText || ''}
                onChange={e => updateField('heroCtaText', e.target.value)}
                placeholder="ឧ. កក់កៅអីឥឡូវនេះ"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                Destination Pill (ទីតាំង / គោលដៅ)
              </label>
              <input
                type="text"
                value={kh.venue || ''}
                onChange={e => updateField('venue', e.target.value)}
                placeholder="ឧ. ហាណូយ & ហាឡុងបេ វៀតណាម"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                Urgency / Early Bird Notice (សារ Early Bird បន្ទាន់)
              </label>
              <input
                type="text"
                value={kh.urgencyNotice || ''}
                onChange={e => updateField('urgencyNotice', e.target.value)}
                placeholder="ឧ. តម្លៃពិសេស Early Bird: ចំណេញ $51 | កំណត់ត្រឹម 30 នាក់ប៉ុណ្ណោះ"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                Risk Note (កំណត់សម្គាល់ការជឿជាក់)
              </label>
              <input
                type="text"
                value={kh.urgencyRiskNote || ''}
                onChange={e => updateField('urgencyRiskNote', e.target.value)}
                placeholder="ឧ. មិនត្រូវបង់ប្រាក់ថ្ងៃនេះ • កៅអីកក់ទុកភ្លាមៗ • ឆ្លើយតបក្នុង ១៥ នាទី"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CORE VALUES */}
      {activeSubTab === 'values' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Translate the 4 core business outcomes into Khmer.
          </p>
          {(kh.coreValues || DEFAULT_KHMER_TRANSLATION.coreValues || []).map((v, i) => {
            const enItem = formData.coreValues?.[i];
            return (
              <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Outcome #{v.num || `0${i + 1}`}
                  </span>
                  {enItem && (
                    <span className="text-[11px] text-slate-400">EN: &ldquo;{enItem.title}&rdquo;</span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Title (ចំណងជើង)</label>
                  <input
                    type="text"
                    value={v.title}
                    onChange={e => {
                      const updated = [...(kh.coreValues || DEFAULT_KHMER_TRANSLATION.coreValues || [])];
                      updated[i] = { ...updated[i], title: e.target.value };
                      updateField('coreValues', updated);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Description (ការពន្យល់)</label>
                  <textarea
                    rows={2}
                    value={v.desc}
                    onChange={e => {
                      const updated = [...(kh.coreValues || DEFAULT_KHMER_TRANSLATION.coreValues || [])];
                      updated[i] = { ...updated[i], desc: e.target.value };
                      updateField('coreValues', updated);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 3: PROBLEMS */}
      {activeSubTab === 'problems' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Translate the 3 sourcing pain points into Khmer.
          </p>
          {(kh.problems || DEFAULT_KHMER_TRANSLATION.problems || []).map((p, i) => {
            const enItem = formData.problems?.[i];
            return (
              <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Problem #{i + 1}
                  </span>
                  {enItem && (
                    <span className="text-[11px] text-slate-400">EN: &ldquo;{enItem.title}&rdquo;</span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Title (ចំណងជើង)</label>
                  <input
                    type="text"
                    value={p.title}
                    onChange={e => {
                      const updated = [...(kh.problems || DEFAULT_KHMER_TRANSLATION.problems || [])];
                      updated[i] = { ...updated[i], title: e.target.value };
                      updateField('problems', updated);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Description (ការពន្យល់)</label>
                  <textarea
                    rows={2}
                    value={p.desc}
                    onChange={e => {
                      const updated = [...(kh.problems || DEFAULT_KHMER_TRANSLATION.problems || [])];
                      updated[i] = { ...updated[i], desc: e.target.value };
                      updateField('problems', updated);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 4: AUDIENCES */}
      {activeSubTab === 'audiences' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Translate the 4 target audience participant profiles into Khmer.
          </p>
          {(kh.audiences || DEFAULT_KHMER_TRANSLATION.audiences || []).map((a, i) => {
            const enItem = formData.audiences?.[i];
            return (
              <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    Audience Profile #{i + 1}
                  </span>
                  {enItem && (
                    <span className="text-[11px] text-slate-400">EN: &ldquo;{enItem.title}&rdquo;</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Title (ចំណងជើង)</label>
                    <input
                      type="text"
                      value={a.title}
                      onChange={e => {
                        const updated = [...(kh.audiences || DEFAULT_KHMER_TRANSLATION.audiences || [])];
                        updated[i] = { ...updated[i], title: e.target.value };
                        updateField('audiences', updated);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Tag / Category (ស្លាក)</label>
                    <input
                      type="text"
                      value={a.tag || ''}
                      onChange={e => {
                        const updated = [...(kh.audiences || DEFAULT_KHMER_TRANSLATION.audiences || [])];
                        updated[i] = { ...updated[i], tag: e.target.value };
                        updateField('audiences', updated);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Description (ការពន្យល់)</label>
                  <textarea
                    rows={2}
                    value={a.desc}
                    onChange={e => {
                      const updated = [...(kh.audiences || DEFAULT_KHMER_TRANSLATION.audiences || [])];
                      updated[i] = { ...updated[i], desc: e.target.value };
                      updateField('audiences', updated);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 5: ITINERARY */}
      {activeSubTab === 'itinerary' && (
        <div className="space-y-5">
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Translate each day&apos;s title and key activities in Khmer.
          </p>
          {(kh.itinerary || DEFAULT_KHMER_TRANSLATION.itinerary || []).map((day, dIdx) => (
            <div key={dIdx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Day {day.day} &bull; {day.date}
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Day Title (ចំណងជើងប្រចាំថ្ងៃ)</label>
                <input
                  type="text"
                  value={day.title}
                  onChange={e => {
                    const updated = [...(kh.itinerary || DEFAULT_KHMER_TRANSLATION.itinerary || [])];
                    updated[dIdx] = { ...updated[dIdx], title: e.target.value };
                    updateField('itinerary', updated);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2 mt-2">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-gray-400">Schedule Events</label>
                {day.events.map((ev, evIdx) => (
                  <div key={evIdx} className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-slate-200 dark:bg-emerald-950 font-mono text-[10px] text-slate-600 dark:text-emerald-300 shrink-0">
                      {ev.time}
                    </span>
                    <input
                      type="text"
                      value={ev.activity}
                      onChange={e => {
                        const updated = [...(kh.itinerary || DEFAULT_KHMER_TRANSLATION.itinerary || [])];
                        const events = [...updated[dIdx].events];
                        events[evIdx] = { ...events[evIdx], activity: e.target.value };
                        updated[dIdx] = { ...updated[dIdx], events };
                        updateField('itinerary', updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 6: VALUE STACK */}
      {activeSubTab === 'valuestack' && (
        <div className="space-y-5">
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Translate the 9-in-1 turnkey value stack and each included service into Khmer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">Value Stack Title</label>
              <input
                type="text"
                value={kh.valueStack?.title || DEFAULT_KHMER_TRANSLATION.valueStack?.title || ''}
                onChange={e => {
                  const current = kh.valueStack || DEFAULT_KHMER_TRANSLATION.valueStack!;
                  updateField('valueStack', { ...current, title: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">Value Stack Subtitle</label>
              <input
                type="text"
                value={kh.valueStack?.subtitle || DEFAULT_KHMER_TRANSLATION.valueStack?.subtitle || ''}
                onChange={e => {
                  const current = kh.valueStack || DEFAULT_KHMER_TRANSLATION.valueStack!;
                  updateField('valueStack', { ...current, subtitle: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-400">9 Inclusions in Khmer</h4>
            {((kh.valueStack?.inclusions && kh.valueStack.inclusions.length > 0)
              ? kh.valueStack.inclusions
              : DEFAULT_KHMER_TRANSLATION.valueStack!.inclusions
            ).map((inc, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 flex flex-col sm:flex-row gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-2 w-full">
                  <input
                    type="text"
                    value={inc.title}
                    onChange={e => {
                      const current = kh.valueStack || DEFAULT_KHMER_TRANSLATION.valueStack!;
                      const updated = [...(current.inclusions || [])];
                      updated[i] = { ...updated[i], title: e.target.value };
                      updateField('valueStack', { ...current, inclusions: updated });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={inc.desc}
                    onChange={e => {
                      const current = kh.valueStack || DEFAULT_KHMER_TRANSLATION.valueStack!;
                      const updated = [...(current.inclusions || [])];
                      updated[i] = { ...updated[i], desc: e.target.value };
                      updateField('valueStack', { ...current, inclusions: updated });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-700 dark:text-gray-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 7: GUARANTEE & FAQS */}
      {activeSubTab === 'guarantee' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Guarantee Section in Khmer</h4>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Guarantee Title</label>
              <input
                type="text"
                value={kh.guarantee?.title || DEFAULT_KHMER_TRANSLATION.guarantee?.title || ''}
                onChange={e => {
                  const current = kh.guarantee || DEFAULT_KHMER_TRANSLATION.guarantee!;
                  updateField('guarantee', { ...current, title: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Guarantee Subtitle / Promise</label>
              <textarea
                rows={2}
                value={kh.guarantee?.subtitle || DEFAULT_KHMER_TRANSLATION.guarantee?.subtitle || ''}
                onChange={e => {
                  const current = kh.guarantee || DEFAULT_KHMER_TRANSLATION.guarantee!;
                  updateField('guarantee', { ...current, subtitle: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-400">Frequently Asked Questions in Khmer</h4>
            {((kh.faqs && kh.faqs.length > 0) ? kh.faqs : DEFAULT_KHMER_TRANSLATION.faqs!).map((faq, i) => (
              <div key={i} className="p-3.5 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 space-y-2">
                <input
                  type="text"
                  value={faq.question}
                  onChange={e => {
                    const currentFaqs = [...((kh.faqs && kh.faqs.length > 0) ? kh.faqs : DEFAULT_KHMER_TRANSLATION.faqs!)];
                    currentFaqs[i] = { ...currentFaqs[i], question: e.target.value };
                    updateField('faqs', currentFaqs);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs font-bold text-slate-900 dark:text-white"
                />
                <textarea
                  rows={2}
                  value={faq.answer}
                  onChange={e => {
                    const currentFaqs = [...((kh.faqs && kh.faqs.length > 0) ? kh.faqs : DEFAULT_KHMER_TRANSLATION.faqs!)];
                    currentFaqs[i] = { ...currentFaqs[i], answer: e.target.value };
                    updateField('faqs', currentFaqs);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900 text-xs text-slate-700 dark:text-gray-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 8: SEO & METADATA */}
      {activeSubTab === 'seo' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Customize how Google and Telegram/Facebook show this page when shared in Khmer.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                Khmer Meta Title (ចំណងជើងលើ Google / Telegram)
              </label>
              <span className="text-[11px] text-slate-400">English: &ldquo;{formData.metaTitle}&rdquo;</span>
            </div>
            <input
              type="text"
              value={kh.metaTitle || ''}
              onChange={e => updateField('metaTitle', e.target.value)}
              placeholder="ឧ. ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម វៀតណាម ២០២៦ | KHB EVENTS"
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                Khmer Meta Description (ការពិពណ៌នាលើ Google / Telegram)
              </label>
              <span className="text-[11px] text-slate-400">English: &ldquo;{formData.metaDescription}&rdquo;</span>
            </div>
            <textarea
              rows={3}
              value={kh.metaDescription || ''}
              onChange={e => updateField('metaDescription', e.target.value)}
              placeholder="ឧ. ចូលរួមជាមួយ KHB EVENTS ក្នុងដំណើរទស្សនកិច្ចពាណិជ្ជកម្មផ្តាច់មុខ..."
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#040C07] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
