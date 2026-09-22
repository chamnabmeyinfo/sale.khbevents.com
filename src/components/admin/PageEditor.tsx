'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Save, 
  ArrowLeft, 
  ExternalLink, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Calendar,
  DollarSign,
  Clock,
  Star,
  Image as ImageIcon,
  HelpCircle,
  ShieldCheck,
  Users,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  FileText,
  Tag,
  AlertTriangle,
  Award,
  Layers,
  HeartHandshake,
  Store,
  Music,
  Mic,
  Briefcase,
  Globe
} from 'lucide-react';
import KhmerTranslationEditor from './KhmerTranslationEditor';
import TrackingAndPixelsEditor from './TrackingAndPixelsEditor';
import IsolatedSettingsEditor from './IsolatedSettingsEditor';
import { 
  LandingPage, 
  PackageTier, 
  HighlightItem, 
  FaqItem, 
  TestimonialItem, 
  CoreValueItem, 
  ProblemItem, 
  AudienceItem, 
  ItineraryDay, 
  InclusionItem, 
  FormField,
  SectionVisibility,
  PageTemplateType,
  ExpoBoothTier,
  ArtistItem,
  SpeakerItem,
  DEFAULT_SECTION_ORDER,
  B2B_DELEGATION_ORDER,
  TRADE_EXPO_ORDER,
  CORPORATE_SUMMIT_ORDER,
  CONCERT_FESTIVAL_ORDER,
  MINIMAL_LEAD_ORDER
} from '@/lib/types';
import DragDropSectionBuilder from './DragDropSectionBuilder';

interface PageEditorProps {
  initialData?: Partial<LandingPage>;
  isNew?: boolean;
}

const PRESET_PHOTOS = [
  '/photos/photo_2026-09-16_22-01-09 (2).jpg',
  '/photos/photo_2026-09-16_22-01-09 (7).jpg',
  '/photos/photo_2026-09-16_22-01-09 (4).jpg',
  '/photos/photo_2026-09-16_22-01-09 (6).jpg',
  '/photos/photo_2026-09-16_22-01-09 (11).jpg',
  '/photos/photo_2026-09-16_22-01-09 (9).jpg',
  '/photos/photo_2026-09-16_22-01-09 (3).jpg',
  '/photos/photo_2026-09-16_22-01-09 (8).jpg',
  '/photos/photo_2026-09-16_22-01-09 (5).jpg',
  '/photos/photo_2026-09-16_22-01-09 (10).jpg',
  '/photos/photo_2026-09-16_22-01-09.jpg',
];

const TEMPLATE_OPTIONS: {
  id: PageTemplateType;
  label: string;
  category: string;
  badge: string;
  description: string;
  icon: any;
  recommendedSections: string[];
}[] = [
  {
    id: 'b2b-delegation',
    label: 'B2B Trade Delegation',
    category: 'Trade Delegation',
    badge: 'Exclusive B2B Mission',
    description: 'Bilateral business matching, factory & plantation tours, 4D3N itinerary, 9-in-1 turnkey value stack & VIP delegate passes.',
    icon: HeartHandshake,
    recommendedSections: ['hero', 'urgency', 'coreValues', 'problems', 'audiences', 'itinerary', 'valueStack', 'packages', 'guarantee', 'form']
  },
  {
    id: 'trade-expo',
    label: 'Trade Expo & Exhibition',
    category: 'Exhibition & Trade Fair',
    badge: 'Exhibitor Spaces',
    description: 'Interactive exhibition booth tiers (Shell Scheme, Corner, Island Pavilion), floor specs, passes & exhibitor lead capture.',
    icon: Store,
    recommendedSections: ['hero', 'urgency', 'highlights', 'expoBooths', 'packages', 'gallery', 'testimonials', 'faqs', 'form']
  },
  {
    id: 'concert-festival',
    label: 'Concert & Music Festival',
    category: 'Concert & Entertainment',
    badge: 'Live Mega Stage',
    description: 'Artist & DJ lineup, performance set times, stage zones, VIP pit access passes, festival gallery & party reservations.',
    icon: Music,
    recommendedSections: ['hero', 'urgency', 'artists', 'packages', 'gallery', 'faqs', 'form']
  },
  {
    id: 'corporate-summit',
    label: 'Corporate Summit & Conference',
    category: 'Corporate Summit',
    badge: 'Executive Leadership',
    description: 'Keynote speakers & executive panelists, presentation tracks, plenary schedule, corporate delegate & table packages.',
    icon: Mic,
    recommendedSections: ['hero', 'highlights', 'speakers', 'itinerary', 'packages', 'testimonials', 'faqs', 'form']
  },
  {
    id: 'custom',
    label: 'Custom Campaign',
    category: 'Special Campaign',
    badge: 'Modular Campaign',
    description: 'Fully customizable modular sections tailored for custom brand activations, product reveals, or specialized events.',
    icon: Sparkles,
    recommendedSections: ['hero', 'highlights', 'packages', 'gallery', 'testimonials', 'form']
  }
];

const DEFAULT_EXPO_BOOTHS: ExpoBoothTier[] = [
  {
    id: 'booth-std',
    name: 'Standard Shell Scheme',
    size: '3m x 3m (9 sqm)',
    price: '$1,200',
    location: 'Exhibition Hall - Zone B',
    availableCount: 8,
    totalCount: 15,
    popular: false,
    features: [
      'Standard Fascia Name Board with Company Logo',
      '1x 13A Single Phase Power Socket',
      '2x 100W Spotlights',
      '1x Lockable Information Counter',
      '2x Standard Exhibition Chairs',
      'Needle-punch Floor Carpeting'
    ],
    ctaText: 'Reserve Shell Scheme'
  },
  {
    id: 'booth-corner',
    name: 'Prime Corner Dual-Open',
    size: '6m x 3m (18 sqm)',
    price: '$2,800',
    location: 'Main Aisle Intersection (Hall A)',
    availableCount: 3,
    totalCount: 6,
    popular: true,
    features: [
      'Dual Open Frontage on High-Footfall Intersection',
      'Enhanced Overhead Fascia Truss Branding',
      '2x 13A Power Sockets & High-Speed WiFi',
      '4x LED Directional Track Lights',
      '2x Glass Discussion Tables & 6x Leather Chairs',
      'Complimentary Digital Directory Listing & 4 Exhibitor Badges'
    ],
    ctaText: 'Reserve Prime Corner'
  },
  {
    id: 'booth-island',
    name: 'VIP Island Pavilion (Raw Space)',
    size: '6m x 6m (36 sqm)',
    price: '$5,500',
    location: 'Central Entrance Atrium',
    availableCount: 1,
    totalCount: 2,
    popular: false,
    features: [
      '360-Degree Four-Side Open Island Footprint',
      'Raw Space for Custom Architectural Staging & LED Pillars',
      'Heavy 3-Phase 32A Industrial Power Supply Hookup',
      'Unlimited VIP Exhibitor Badges & 100 Client Invitation Cards',
      'KHB Events AV & LED Wall Fabrication Discount (20% Off)'
    ],
    ctaText: 'Inquire Island Pavilion'
  }
];

const DEFAULT_FESTIVAL_ARTISTS: ArtistItem[] = [
  {
    id: 'art-1',
    name: 'ElectroPulse Collective',
    role: 'Headliner DJ & Audio-Visual Experience',
    genre: 'EDM / Progressive House',
    stageName: 'Main Stage Arena',
    stageTime: '22:00 - 23:30',
    image: '/photos/photo_2026-09-16_22-01-09 (6).jpg',
    bio: 'Chart-topping electronic dance music act featuring synchronized LED stage visuals, pyrotechnics, and bass drops.'
  },
  {
    id: 'art-2',
    name: 'Khmer Rhythm Syndicate',
    role: 'Featured Live Band',
    genre: 'Indie Fusion & Modern Rock',
    stageName: 'Main Stage Arena',
    stageTime: '20:15 - 21:45',
    image: '/photos/photo_2026-09-16_22-01-09 (11).jpg',
    bio: 'High-octane fusion ensemble blending traditional instruments with modern festival basslines and rock anthems.'
  },
  {
    id: 'art-3',
    name: 'DJ Solara',
    role: 'Sunset Session DJ',
    genre: 'Melodic Deep House & Chillout',
    stageName: 'Skyline Sunset Stage',
    stageTime: '17:30 - 19:30',
    image: '/photos/photo_2026-09-16_22-01-09 (9).jpg',
    bio: 'Atmospheric sunset melodies and deep rhythms designed for VIP terrace lounges and cocktail hours.'
  }
];

const DEFAULT_SUMMIT_SPEAKERS: SpeakerItem[] = [
  {
    id: 'spk-1',
    name: 'Oknha Bunthan Seng',
    title: 'Chairman & Group CEO',
    organization: 'Apex Trading Corp Cambodia',
    avatar: '/photos/photo_2026-09-16_22-01-09 (2).jpg',
    topic: 'Cross-Border Supply Chain Resilience & Regional Integration',
    track: 'Plenary Keynote',
    sessionTime: '09:30 - 10:15'
  },
  {
    id: 'spk-2',
    name: 'Dr. Minh Nguyen',
    title: 'Managing Director, Smart City Solutions',
    organization: 'Vietnam High-Tech Industry Consortium',
    avatar: '/photos/photo_2026-09-16_22-01-09 (3).jpg',
    topic: 'Automated Factory Infrastructures & IoT in Modern Manufacturing',
    track: 'Industry & Tech Track',
    sessionTime: '11:00 - 11:45'
  },
  {
    id: 'spk-3',
    name: 'Sophea Pich',
    title: 'Vice President of Business Development',
    organization: 'ASEAN Venture Partners',
    avatar: '/photos/photo_2026-09-16_22-01-09 (5).jpg',
    topic: 'Unlocking Bilateral Capital: Investment Vehicles & JV Structuring',
    track: 'Investment & Finance Track',
    sessionTime: '14:30 - 15:15'
  }
];

export default function PageEditor({ initialData, isNew = false }: PageEditorProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<LandingPage>>({
    id: initialData?.id,
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    subtitle: initialData?.subtitle || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Trade Delegation',
    badge: initialData?.badge || '',
    template: initialData?.template || 'b2b-delegation',
    status: initialData?.status || 'published',
    heroHeadline: initialData?.heroHeadline || '',
    heroSubheadline: initialData?.heroSubheadline || '',
    heroCtaText: initialData?.heroCtaText || 'Reserve Your Seat ($499)',
    heroCtaLink: initialData?.heroCtaLink || '#booking-form',
    heroImage: initialData?.heroImage || '/photos/photo_2026-09-16_22-01-09 (2).jpg',
    videoUrl: initialData?.videoUrl || '',
    eventDate: initialData?.eventDate || '2026-10-08',
    eventTime: initialData?.eventTime || '4 Days / 3 Nights',
    venue: initialData?.venue || 'Hanoi & Halong Bay, Vietnam',
    venueAddress: initialData?.venueAddress || 'Vietnam Exhibition Center & Halong Bay UNESCO World Heritage Site',
    countdownEnabled: initialData?.countdownEnabled ?? true,
    urgency: initialData?.urgency || {
      totalSeats: 30,
      claimedSeats: 19,
      earlyBirdPrice: 499,
      regularPrice: 550,
      earlyBirdDeadline: '2026-09-08T23:59:59',
      registrationDeadline: '2026-09-20T23:59:59',
      noticeText: 'Early Bird Special: Save $51 before Sept 8, 2026 | Strictly limited to 30 seats',
      riskNote: 'No payment today • Seat held instantly • Reply within 15 mins'
    },
    sectionVisibility: initialData?.sectionVisibility || {
      hero: true,
      urgency: true,
      coreValues: true,
      problems: true,
      audiences: true,
      itinerary: true,
      valueStack: true,
      packages: true,
      expoBooths: true,
      artists: true,
      speakers: true,
      gallery: true,
      testimonials: true,
      faqs: true,
      guarantee: true,
      form: true
    },
    sectionOrder: initialData?.sectionOrder || DEFAULT_SECTION_ORDER,
    expoBooths: initialData?.expoBooths || [],
    artists: initialData?.artists || [],
    speakers: initialData?.speakers || [],
    highlights: initialData?.highlights || [
      { id: 'h1', title: '2 International Trade Expos', description: 'VIP Passes to Cafe Show & Smart City Expo.', icon: 'Building2' }
    ],
    coreValues: initialData?.coreValues || [
      { id: 'cv-1', num: '01', icon: 'chart', title: 'Factory-Direct Pricing Power', desc: 'Buy at the source and cut 25% - 35% off what middlemen charge.' }
    ],
    problems: initialData?.problems || [
      { id: 'p1', icon: 'trending-down', title: 'Middleman Markups', desc: 'Buying through brokers adds 25% - 35% to every order.' }
    ],
    audiences: initialData?.audiences || [
      { id: 'a1', icon: 'coffee', title: 'Cafe & Tea Brand Owners', tag: 'F&B Roasters', desc: 'Discover premium Vietnamese tea, coffee beans, and commercial espresso machinery.' }
    ],
    itinerary: initialData?.itinerary || [
      {
        id: 'itin-1',
        day: 1,
        date: 'Oct 8, 2026',
        title: 'Phnom Penh to Hanoi & Welcome Night',
        events: [
          { time: '17:45 - 21:35', activity: 'Flight from Phnom Penh to Hanoi (Noi Bai International Airport)' }
        ]
      }
    ],
    valueStack: initialData?.valueStack || {
      tag: 'Value Stack',
      title: 'One Price. Nine Things Fully Handled.',
      subtitle: 'Everything below is included in your seat. Arrange each of these yourself and the same trip would cost you far more.',
      totalLabel: 'Total standalone value',
      totalValue: '$910+',
      payLabel: 'Your Early Bird investment',
      inclusions: [
        { id: 'inc-1', title: 'Roundtrip Flight Tickets', desc: 'Phnom Penh - Hanoi roundtrip flights included.', standalonePrice: 220 }
      ]
    },
    packages: initialData?.packages || [
      {
        id: 'pkg-1',
        name: 'Early Bird Admission',
        price: '$499',
        period: 'per delegate (save $51)',
        description: 'Most popular choice for founders, importers, and F&B entrepreneurs.',
        popular: true,
        features: ['Roundtrip Flights', 'Hotel 4D/3N Stay', 'VIP Expo Passes', 'Halong Bay Cruise'],
        ctaText: 'Lock In $499 Early Bird Rate'
      }
    ],
    gallery: initialData?.gallery || [
      '/photos/photo_2026-09-16_22-01-09 (2).jpg',
      '/photos/photo_2026-09-16_22-01-09 (7).jpg',
      '/photos/photo_2026-09-16_22-01-09 (4).jpg'
    ],
    testimonials: initialData?.testimonials || [
      { id: 't1', name: 'Dara S.', role: 'Cafe Chain CEO', company: 'Phnom Penh Roastery', quote: 'I met five roasters in one day and cut my bean sourcing cost by 30%.', rating: 5 }
    ],
    faqs: initialData?.faqs || [
      { id: 'f1', question: 'Do I need a visa for Vietnam?', answer: 'Cambodian passport holders can enter Vietnam visa-free for up to 30 days.' }
    ],
    guarantee: initialData?.guarantee || {
      title: 'Your Reservation is 100% Risk-Free',
      subtitle: 'You pay nothing today until you have spoken with our team and decided this delegation is right for your business.',
      badge: '100% Risk Reversal Guarantee',
      points: [
        'No payment today — reserve with just your name & phone number',
        'Official corporate tax invoice & complete itinerary sent via Telegram',
        'Full refund if the organizer cancels the delegation'
      ]
    },
    formConfig: initialData?.formConfig || {
      headline: 'Reserve Your Delegation Seat',
      subheadline: 'Strictly limited to 30 seats cohort. Our trip coordinator responds in under 15 minutes.',
      submitButtonText: 'Reserve My Seat Now',
      successMessage: 'Thank you! Your seat reservation request has been received.',
      fields: [
        { id: 'fullName', label: 'Full Name', type: 'text', placeholder: 'e.g. Sok Sovann', required: true },
        { id: 'phone', label: 'Phone / Telegram', type: 'tel', placeholder: 'e.g. 012 345 678', required: true }
      ]
    },
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    ogImage: initialData?.ogImage || '',
    isolatedSettings: initialData?.isolatedSettings || {}
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  
  type TabType = 
    | 'general' 
    | 'layout'
    | 'hero' 
    | 'event' 
    | 'packages' 
    | 'itinerary' 
    | 'values' 
    | 'problems' 
    | 'audiences' 
    | 'valueStack' 
    | 'expoBooths'
    | 'artists'
    | 'speakers'
    | 'testimonials' 
    | 'gallery' 
    | 'faqs' 
    | 'guarantee' 
    | 'form' 
    | 'seo'
    | 'tracking'
    | 'isolatedSettings';

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [langTab, setLangTab] = useState<'en' | 'kh'>('en');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newFeatureText, setNewFeatureText] = useState<{ [pkgIdx: number]: string }>({});

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get('tab');
      if (t === 'tracking') setActiveTab('tracking');
      else if (t === 'settings' || t === 'isolatedSettings') setActiveTab('isolatedSettings');
      else if (window.location.hash === '#tracking') setActiveTab('tracking');
      else if (window.location.hash === '#settings' || window.location.hash === '#isolatedSettings') setActiveTab('isolatedSettings');
    } catch {}
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // SAVE HANDLER
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSaveSuccess(false);

    if (!formData.title || !formData.slug) {
      setError('Title and Slug are required to publish the landing page.');
      setSaving(false);
      return;
    }

    try {
      const endpoint = isNew ? '/api/pages' : `/api/pages/${formData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save page');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);

      if (isNew && data.page?.id) {
        router.push(`/admin/pages/${data.page.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE SELECTION
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSelectTemplate = (tmpl: typeof TEMPLATE_OPTIONS[0]) => {
    const isDefaultOrEmptyCategory = !formData.category || TEMPLATE_OPTIONS.some(t => t.category === formData.category);
    const isDefaultOrEmptyBadge = !formData.badge || TEMPLATE_OPTIONS.some(t => t.badge === formData.badge);

    const updated: Partial<LandingPage> = {
      ...formData,
      template: tmpl.id,
      category: isDefaultOrEmptyCategory ? tmpl.category : formData.category,
      badge: isDefaultOrEmptyBadge ? tmpl.badge : formData.badge,
    };

    if (tmpl.id === 'trade-expo') {
      if (!updated.expoBooths || updated.expoBooths.length === 0) {
        updated.expoBooths = DEFAULT_EXPO_BOOTHS;
      }
      updated.sectionOrder = TRADE_EXPO_ORDER;
      updated.sectionVisibility = {
        ...(updated.sectionVisibility || {}),
        expoBooths: true,
        speakers: true,
      };
    } else if (tmpl.id === 'concert-festival') {
      if (!updated.artists || updated.artists.length === 0) {
        updated.artists = DEFAULT_FESTIVAL_ARTISTS;
      }
      updated.sectionOrder = CONCERT_FESTIVAL_ORDER;
      updated.sectionVisibility = {
        ...(updated.sectionVisibility || {}),
        artists: true,
      };
    } else if (tmpl.id === 'corporate-summit') {
      if (!updated.speakers || updated.speakers.length === 0) {
        updated.speakers = DEFAULT_SUMMIT_SPEAKERS;
      }
      updated.sectionOrder = CORPORATE_SUMMIT_ORDER;
      updated.sectionVisibility = {
        ...(updated.sectionVisibility || {}),
        speakers: true,
      };
    } else if (tmpl.id === 'b2b-delegation') {
      updated.sectionOrder = B2B_DELEGATION_ORDER;
    }

    setFormData(updated);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION VISIBILITY TOGGLES
  // ─────────────────────────────────────────────────────────────────────────────
  const toggleSection = (sectionKey: keyof SectionVisibility) => {
    const current = formData.sectionVisibility || {};
    const updated = {
      ...current,
      [sectionKey]: current[sectionKey] === false ? true : false
    };
    setFormData({ ...formData, sectionVisibility: updated });
  };

  const setAllSections = (visible: boolean) => {
    const allKeys: (keyof SectionVisibility)[] = [
      'hero', 'urgency', 'coreValues', 'highlights', 'problems', 'audiences', 'matchmaker',
      'itinerary', 'valueStack', 'expoBooths', 'artists', 'speakers', 'packages', 'gallery',
      'testimonials', 'faqs', 'guarantee', 'form'
    ];
    const updated: SectionVisibility = {};
    allKeys.forEach((k) => {
      updated[k] = visible;
    });
    setFormData({ ...formData, sectionVisibility: updated });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PACKAGES CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addPackage = () => {
    const newPkg: PackageTier = {
      id: `pkg-${Date.now()}`,
      name: 'New Package Tier',
      price: '$500',
      period: 'per delegate',
      description: 'Full all-inclusive access to expos and business meetings.',
      popular: false,
      features: ['Roundtrip Flights', 'Hotel 4D/3N Stay', 'VIP Expo Passes'],
      ctaText: 'Select Pass'
    };
    setFormData({ ...formData, packages: [...(formData.packages || []), newPkg] });
  };

  const updatePackage = (index: number, field: keyof PackageTier, value: any) => {
    const arr = [...(formData.packages || [])];
    arr[index] = { ...arr[index], [field]: value };
    setFormData({ ...formData, packages: arr });
  };

  const removePackage = (index: number) => {
    const arr = (formData.packages || []).filter((_, i) => i !== index);
    setFormData({ ...formData, packages: arr });
  };

  const addPackageFeature = (pkgIdx: number) => {
    const text = (newFeatureText[pkgIdx] || '').trim();
    if (!text) return;
    const arr = [...(formData.packages || [])];
    arr[pkgIdx].features = [...(arr[pkgIdx].features || []), text];
    setFormData({ ...formData, packages: arr });
    setNewFeatureText({ ...newFeatureText, [pkgIdx]: '' });
  };

  const removePackageFeature = (pkgIdx: number, fIdx: number) => {
    const arr = [...(formData.packages || [])];
    arr[pkgIdx].features = (arr[pkgIdx].features || []).filter((_, i) => i !== fIdx);
    setFormData({ ...formData, packages: arr });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ITINERARY CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addDay = () => {
    const nextDayNum = (formData.itinerary?.length || 0) + 1;
    const newDay: ItineraryDay = {
      id: `itin-${Date.now()}`,
      day: nextDayNum,
      date: `Day ${nextDayNum} Date`,
      title: `Day ${nextDayNum} Agenda Title`,
      events: [
        { time: '08:00 - 09:00', activity: 'Buffet breakfast at hotel', desc: '' },
        { time: '09:30 - 12:00', activity: 'Morning Expo / Factory Session', desc: '' }
      ]
    };
    setFormData({ ...formData, itinerary: [...(formData.itinerary || []), newDay] });
  };

  const updateDay = (dayIdx: number, field: keyof ItineraryDay, value: any) => {
    const arr = [...(formData.itinerary || [])];
    arr[dayIdx] = { ...arr[dayIdx], [field]: value };
    setFormData({ ...formData, itinerary: arr });
  };

  const removeDay = (dayIdx: number) => {
    const arr = (formData.itinerary || []).filter((_, i) => i !== dayIdx);
    setFormData({ ...formData, itinerary: arr });
  };

  const addEventToDay = (dayIdx: number) => {
    const arr = [...(formData.itinerary || [])];
    arr[dayIdx].events = [
      ...(arr[dayIdx].events || []),
      { time: '14:00 - 16:00', activity: 'New Itinerary Session / Meeting', desc: '' }
    ];
    setFormData({ ...formData, itinerary: arr });
  };

  const updateEventInDay = (dayIdx: number, eventIdx: number, field: string, value: string) => {
    const arr = [...(formData.itinerary || [])];
    arr[dayIdx].events[eventIdx] = { ...arr[dayIdx].events[eventIdx], [field]: value };
    setFormData({ ...formData, itinerary: arr });
  };

  const removeEventFromDay = (dayIdx: number, eventIdx: number) => {
    const arr = [...(formData.itinerary || [])];
    arr[dayIdx].events = arr[dayIdx].events.filter((_, i) => i !== eventIdx);
    setFormData({ ...formData, itinerary: arr });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // CORE VALUES & HIGHLIGHTS CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addCoreValue = () => {
    const nextNum = String((formData.coreValues?.length || 0) + 1).padStart(2, '0');
    const newCV: CoreValueItem = {
      id: `cv-${Date.now()}`,
      num: nextNum,
      icon: 'chart',
      title: 'New Core Outcome',
      desc: 'Explain the tangible business outcome the client gets.'
    };
    setFormData({ ...formData, coreValues: [...(formData.coreValues || []), newCV] });
  };

  const updateCoreValue = (idx: number, field: keyof CoreValueItem, value: string) => {
    const arr = [...(formData.coreValues || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setFormData({ ...formData, coreValues: arr });
  };

  const removeCoreValue = (idx: number) => {
    const arr = (formData.coreValues || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, coreValues: arr });
  };

  const addHighlight = () => {
    const newH: HighlightItem = {
      id: `h-${Date.now()}`,
      title: 'New Program Highlight',
      description: 'Key benefit or differentiator for delegates.',
      icon: 'Sparkles'
    };
    setFormData({ ...formData, highlights: [...(formData.highlights || []), newH] });
  };

  const updateHighlight = (idx: number, field: keyof HighlightItem, value: string) => {
    const arr = [...(formData.highlights || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setFormData({ ...formData, highlights: arr });
  };

  const removeHighlight = (idx: number) => {
    const arr = (formData.highlights || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, highlights: arr });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PROBLEMS CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addProblem = () => {
    const newP: ProblemItem = {
      id: `p-${Date.now()}`,
      icon: 'trending-down',
      title: 'Costly Problem or Obstacle',
      desc: 'Explain what currently costs the client time or money.'
    };
    setFormData({ ...formData, problems: [...(formData.problems || []), newP] });
  };

  const updateProblem = (idx: number, field: keyof ProblemItem, value: string) => {
    const arr = [...(formData.problems || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setFormData({ ...formData, problems: arr });
  };

  const removeProblem = (idx: number) => {
    const arr = (formData.problems || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, problems: arr });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIENCES CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addAudience = () => {
    const newA: AudienceItem = {
      id: `aud-${Date.now()}`,
      icon: 'users',
      title: 'Target Buyer / Industry Group',
      tag: 'Industry Tag',
      desc: 'Who should participate and why this is engineered for them.'
    };
    setFormData({ ...formData, audiences: [...(formData.audiences || []), newA] });
  };

  const updateAudience = (idx: number, field: keyof AudienceItem, value: string) => {
    const arr = [...(formData.audiences || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setFormData({ ...formData, audiences: arr });
  };

  const removeAudience = (idx: number) => {
    const arr = (formData.audiences || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, audiences: arr });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // VALUE STACK & INCLUSIONS CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addInclusion = () => {
    const newInc: InclusionItem = {
      id: `inc-${Date.now()}`,
      title: 'Included Item / Service',
      desc: 'Details of this inclusion provided to delegates.',
      standalonePrice: 100
    };
    const currentStack = formData.valueStack || {
      tag: 'Value Stack',
      title: 'One Price. Nine Things Fully Handled.',
      subtitle: 'Everything below is included in your seat.',
      totalLabel: 'Total standalone value',
      totalValue: '$900+',
      inclusions: []
    };
    setFormData({
      ...formData,
      valueStack: {
        ...currentStack,
        inclusions: [...(currentStack.inclusions || []), newInc]
      }
    });
  };

  const updateInclusion = (idx: number, field: keyof InclusionItem, value: any) => {
    const currentStack = formData.valueStack;
    if (!currentStack) return;
    const arr = [...currentStack.inclusions];
    arr[idx] = { ...arr[idx], [field]: value };
    setFormData({
      ...formData,
      valueStack: { ...currentStack, inclusions: arr }
    });
  };

  const removeInclusion = (idx: number) => {
    const currentStack = formData.valueStack;
    if (!currentStack) return;
    const arr = currentStack.inclusions.filter((_, i) => i !== idx);
    setFormData({
      ...formData,
      valueStack: { ...currentStack, inclusions: arr }
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TESTIMONIALS CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addTestimonial = () => {
    const newT: TestimonialItem = {
      id: `t-${Date.now()}`,
      name: 'Client Name',
      role: 'Founder / CEO',
      company: 'Company Ltd.',
      quote: 'Attending this event gave our business incredible returns and direct contacts.',
      rating: 5
    };
    setFormData({ ...formData, testimonials: [...(formData.testimonials || []), newT] });
  };

  const updateTestimonial = (idx: number, field: keyof TestimonialItem, value: any) => {
    const arr = [...(formData.testimonials || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setFormData({ ...formData, testimonials: arr });
  };

  const removeTestimonial = (idx: number) => {
    const arr = (formData.testimonials || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, testimonials: arr });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // GALLERY CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addGalleryImage = (url: string) => {
    const clean = url.trim();
    if (!clean) return;
    setFormData({ ...formData, gallery: [...(formData.gallery || []), clean] });
    setNewGalleryUrl('');
  };

  const removeGalleryImage = (idx: number) => {
    const arr = (formData.gallery || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, gallery: arr });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FAQS CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addFaq = () => {
    const newF: FaqItem = {
      id: `f-${Date.now()}`,
      question: 'Frequently Asked Question?',
      answer: 'Clear, reassuring answer for prospective delegates.'
    };
    setFormData({ ...formData, faqs: [...(formData.faqs || []), newF] });
  };

  const updateFaq = (idx: number, field: keyof FaqItem, value: string) => {
    const arr = [...(formData.faqs || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setFormData({ ...formData, faqs: arr });
  };

  const removeFaq = (idx: number) => {
    const arr = (formData.faqs || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, faqs: arr });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // GUARANTEE CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addGuaranteePoint = () => {
    const currentG = formData.guarantee || {
      title: '100% Risk-Free Reservation',
      subtitle: 'You pay nothing today until your seat is confirmed.',
      points: []
    };
    setFormData({
      ...formData,
      guarantee: {
        ...currentG,
        points: [...(currentG.points || []), 'No upfront payment required — reserve with your name & phone number']
      }
    });
  };

  const updateGuaranteePoint = (idx: number, text: string) => {
    const currentG = formData.guarantee;
    if (!currentG) return;
    const arr = [...(currentG.points || [])];
    arr[idx] = text;
    setFormData({
      ...formData,
      guarantee: { ...currentG, points: arr }
    });
  };

  const removeGuaranteePoint = (idx: number) => {
    const currentG = formData.guarantee;
    if (!currentG) return;
    const arr = (currentG.points || []).filter((_, i) => i !== idx);
    setFormData({
      ...formData,
      guarantee: { ...currentG, points: arr }
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FORM FIELDS CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addFormField = () => {
    const currentForm = formData.formConfig || {
      headline: 'Reserve Your Registration',
      subheadline: 'Fill in your details below.',
      submitButtonText: 'Submit Registration',
      successMessage: 'Thank you! We will get in touch shortly.',
      fields: []
    };
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: 'New Field Label',
      type: 'text',
      placeholder: 'Enter details...',
      required: false
    };
    setFormData({
      ...formData,
      formConfig: {
        ...currentForm,
        fields: [...(currentForm.fields || []), newField]
      }
    });
  };

  const updateFormField = (idx: number, field: keyof FormField, value: any) => {
    const currentForm = formData.formConfig;
    if (!currentForm) return;
    const arr = [...currentForm.fields];
    arr[idx] = { ...arr[idx], [field]: value };
    setFormData({
      ...formData,
      formConfig: { ...currentForm, fields: arr }
    });
  };

  const removeFormField = (idx: number) => {
    const currentForm = formData.formConfig;
    if (!currentForm) return;
    const arr = currentForm.fields.filter((_, i) => i !== idx);
    setFormData({
      ...formData,
      formConfig: { ...currentForm, fields: arr }
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPO BOOTHS CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const [newBoothFeatureText, setNewBoothFeatureText] = useState<{ [boothIdx: number]: string }>({});

  const addExpoBooth = () => {
    const newBooth: ExpoBoothTier = {
      id: `booth-${Date.now()}`,
      name: 'Standard Shell Scheme',
      size: '3m x 3m (9 sqm)',
      price: '$1,200',
      location: 'Exhibition Hall - Zone B',
      availableCount: 8,
      totalCount: 15,
      popular: false,
      features: [
        'Standard Fascia Name Board with Logo',
        '1x 13A Single Phase Power Socket',
        '2x Spotlights',
        '1x Information Counter & 2x Chairs',
        'Needle-punch Floor Carpet'
      ],
      ctaText: 'Reserve This Booth'
    };
    setFormData({
      ...formData,
      expoBooths: [...(formData.expoBooths || []), newBooth]
    });
  };

  const updateExpoBooth = (idx: number, field: keyof ExpoBoothTier, value: any) => {
    const arr = [...(formData.expoBooths || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setFormData({ ...formData, expoBooths: arr });
  };

  const removeExpoBooth = (idx: number) => {
    const arr = (formData.expoBooths || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, expoBooths: arr });
  };

  const addBoothFeature = (boothIdx: number) => {
    const text = (newBoothFeatureText[boothIdx] || '').trim();
    if (!text) return;
    const arr = [...(formData.expoBooths || [])];
    arr[boothIdx].features = [...(arr[boothIdx].features || []), text];
    setFormData({ ...formData, expoBooths: arr });
    setNewBoothFeatureText({ ...newBoothFeatureText, [boothIdx]: '' });
  };

  const removeBoothFeature = (boothIdx: number, fIdx: number) => {
    const arr = [...(formData.expoBooths || [])];
    arr[boothIdx].features = (arr[boothIdx].features || []).filter((_, i) => i !== fIdx);
    setFormData({ ...formData, expoBooths: arr });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ARTISTS CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addArtist = () => {
    const newArtist: ArtistItem = {
      id: `artist-${Date.now()}`,
      name: 'Artist / DJ Name',
      role: 'Headlining Act',
      genre: 'EDM / Dance Pop',
      stageName: 'Main Stage',
      stageTime: '21:30 - 23:00',
      image: '/photos/photo_2026-09-16_22-01-09 (6).jpg',
      bio: 'Renowned international performer delivering festival soundscapes and lighting shows.'
    };
    setFormData({
      ...formData,
      artists: [...(formData.artists || []), newArtist]
    });
  };

  const updateArtist = (idx: number, field: keyof ArtistItem, value: any) => {
    const arr = [...(formData.artists || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setFormData({ ...formData, artists: arr });
  };

  const removeArtist = (idx: number) => {
    const arr = (formData.artists || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, artists: arr });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SPEAKERS CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addSpeaker = () => {
    const newSpeaker: SpeakerItem = {
      id: `speaker-${Date.now()}`,
      name: 'Speaker Full Name',
      title: 'Managing Director / CEO',
      organization: 'Enterprise Group Cambodia',
      avatar: '/photos/photo_2026-09-16_22-01-09 (2).jpg',
      topic: 'Future of Regional Business & Cross-Border Growth',
      track: 'Plenary Keynote',
      sessionTime: '09:30 - 10:15'
    };
    setFormData({
      ...formData,
      speakers: [...(formData.speakers || []), newSpeaker]
    });
  };

  const updateSpeaker = (idx: number, field: keyof SpeakerItem, value: any) => {
    const arr = [...(formData.speakers || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setFormData({ ...formData, speakers: arr });
  };

  const removeSpeaker = (idx: number) => {
    const arr = (formData.speakers || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, speakers: arr });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB DEFINITIONS (Dynamically tuned to the selected template)
  // ─────────────────────────────────────────────────────────────────────────────
  const currentTemplate = formData.template || 'b2b-delegation';

  const baseTabs: { id: TabType; label: string; count?: number; highlight?: boolean }[] = [
    { id: 'general', label: 'General & Template' },
    { id: 'layout', label: '🧩 Page Layout & Sections', count: formData.sectionOrder?.length, highlight: true },
    { id: 'hero', label: 'Hero Section' },
    { id: 'event', label: 'Date & Venue' }
  ];

  const templateTabs: { id: TabType; label: string; count?: number; highlight?: boolean }[] = [];

  if (currentTemplate === 'trade-expo') {
    templateTabs.push({ 
      id: 'expoBooths', 
      label: '🎪 Exhibition Booth Tiers', 
      count: formData.expoBooths?.length,
      highlight: true 
    });
  } else if (currentTemplate === 'concert-festival') {
    templateTabs.push({ 
      id: 'artists', 
      label: '🎵 Artist Lineup & Stages', 
      count: formData.artists?.length,
      highlight: true 
    });
  } else if (currentTemplate === 'corporate-summit') {
    templateTabs.push({ 
      id: 'speakers', 
      label: '🎤 Keynote Speakers', 
      count: formData.speakers?.length,
      highlight: true 
    });
  } else if (currentTemplate === 'b2b-delegation') {
    templateTabs.push(
      { id: 'itinerary', label: '📅 Itinerary (4D3N)', count: formData.itinerary?.length, highlight: true },
      { id: 'valueStack', label: '💎 9-in-1 Value Stack', count: formData.valueStack?.inclusions?.length, highlight: true },
      { id: 'values', label: 'Core Values', count: (formData.coreValues?.length || 0) + (formData.highlights?.length || 0) },
      { id: 'problems', label: 'Problem vs Solution', count: formData.problems?.length },
      { id: 'audiences', label: 'Target Audience', count: formData.audiences?.length }
    );
  }

  // Allow editing template sections if enabled in visibility OR if they have items
  if (currentTemplate !== 'b2b-delegation' && ((formData.itinerary?.length || 0) > 0 || formData.sectionVisibility?.itinerary)) {
    templateTabs.push({ id: 'itinerary', label: 'Itinerary / Schedule', count: formData.itinerary?.length });
  }
  if (currentTemplate !== 'trade-expo' && ((formData.expoBooths?.length || 0) > 0 || formData.sectionVisibility?.expoBooths)) {
    templateTabs.push({ id: 'expoBooths', label: 'Booth Tiers', count: formData.expoBooths?.length });
  }
  if (currentTemplate !== 'concert-festival' && ((formData.artists?.length || 0) > 0 || formData.sectionVisibility?.artists)) {
    templateTabs.push({ id: 'artists', label: 'Artists', count: formData.artists?.length });
  }
  if (currentTemplate !== 'corporate-summit' && ((formData.speakers?.length || 0) > 0 || formData.sectionVisibility?.speakers)) {
    templateTabs.push({ id: 'speakers', label: 'Speakers', count: formData.speakers?.length });
  }

  const commonTabs: { id: TabType; label: string; count?: number; highlight?: boolean }[] = [
    { id: 'packages', label: 'Pricing Packages', count: formData.packages?.length },
    { id: 'gallery', label: 'Visual Gallery', count: formData.gallery?.length },
    { id: 'testimonials', label: 'Testimonials', count: formData.testimonials?.length },
    { id: 'faqs', label: 'FAQs', count: formData.faqs?.length },
    { id: 'guarantee', label: 'Guarantee', count: formData.guarantee?.points?.length },
    { id: 'form', label: 'Lead Form', count: formData.formConfig?.fields?.length },
    { id: 'seo', label: 'SEO & Social' },
    { id: 'tracking', label: '📊 Tracking & Pixels', highlight: true },
    { id: 'isolatedSettings', label: '⚙️ Dedicated Settings', highlight: true }
  ];

  const tabs = [...baseTabs, ...templateTabs, ...commonTabs];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-emerald-900/40">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pages"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-gray-300 hover:text-black dark:hover:text-white border border-slate-200 dark:border-emerald-800/50 transition-colors shadow-sm"
            title="Back to Landing Pages"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isNew ? 'Create New Landing Page' : `Edit: ${formData.title || 'Untitled Campaign'}`}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                formData.status === 'published' 
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
              }`}>
                {formData.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-mono flex items-center gap-1 mt-0.5">
              <span>Path:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">/{formData.slug || 'your-slug'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isNew && formData.slug && (
            <Link
              href={`/${formData.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 border border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-300 text-xs font-semibold transition-colors shadow-sm"
            >
              <span>Preview Live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer transition-all hover:scale-102"
          >
            <Save className="w-4 h-4 text-black" />
            <span>{saving ? 'Saving...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <strong>Success!</strong> All landing page sections and changes have been saved and published live.
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 shadow-md flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* LANGUAGE SELECTOR BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-100 via-amber-50/50 to-emerald-50/30 dark:from-[#06120B] dark:via-[#08170F] dark:to-[#0A1D13] border border-slate-200 dark:border-emerald-800/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-emerald-300">
            <Globe className="w-4 h-4 text-amber-500" />
            <span>Editing Language:</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#040C07] p-1 rounded-xl border border-slate-200 dark:border-emerald-900/60 shadow-inner">
            <button
              type="button"
              onClick={() => setLangTab('en')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                langTab === 'en'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="text-sm">🇬🇧</span>
              <span>English (Default)</span>
            </button>
            <button
              type="button"
              onClick={() => setLangTab('kh')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                langTab === 'kh'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="text-sm">🇰🇭</span>
              <span>ភាសាខ្មែរ (Khmer)</span>
              {Boolean(formData.translations?.kh?.heroHeadline || formData.translations?.kh?.title) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-200" title="Khmer translations configured" />
              )}
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-gray-400">
          {langTab === 'en' ? (
            <span>Editing primary English copy &bull; numbers (prices, dates, seats) sync across all languages.</span>
          ) : (
            <span>Editing Khmer version &bull; visitors who click <b>ខ្មែរ</b> will see this content.</span>
          )}
        </div>
      </div>

      {langTab === 'en' ? (
        <>
          {/* Tabs list with counters */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-emerald-900/40 pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-emerald-900/40'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-black text-amber-300' : 'bg-slate-200 dark:bg-emerald-900 text-slate-700 dark:text-emerald-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Container */}
      <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-xl transition-colors">
        
        {/* 1. GENERAL & TOGGLES */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* BUSINESS TYPE & TEMPLATE ARCHITECTURE */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-500/5 dark:from-[#07130D] dark:to-[#0C1F15] border border-slate-200 dark:border-emerald-800/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Business Type &amp; Landing Page Template</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400">
                    Each business type has its own unique layout, sections, and conversion architecture.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-amber-400 text-black font-extrabold self-start sm:self-auto">
                  Active: {TEMPLATE_OPTIONS.find(t => t.id === (formData.template || 'b2b-delegation'))?.label}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {TEMPLATE_OPTIONS.map((tmpl) => {
                  const isSelected = (formData.template || 'b2b-delegation') === tmpl.id;
                  const Icon = tmpl.icon;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-500 dark:border-amber-400 ring-1 ring-amber-400 shadow-md'
                          : 'bg-white dark:bg-[#060F0A] border-slate-200 dark:border-emerald-950 hover:border-emerald-700/60 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-amber-400 text-black' : 'bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white pt-1">
                          {tmpl.label}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Page Title <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Smart City, Tea & Cafe Business Delegation 2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  URL Slug (sale.khbevents.com/...) <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') })}
                  placeholder="e.g. smart-city-tea-cafe"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-amber-700 dark:text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Trade Delegation, Corporate, Exhibition"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Badge / Top Pill Text
                </label>
                <input
                  type="text"
                  value={formData.badge || ''}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g. Strictly 30 Seats Cohort"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Publishing Status
                </label>
                <select
                  value={formData.status || 'published'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="published">Published (Active & Live)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Campaign Summary / Brief Overview
              </label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Overview of this delegation or sales event..."
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* SECTION VISIBILITY TOGGLES PANEL */}
            <div className="pt-4 border-t border-slate-200 dark:border-emerald-900/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>Landing Page Section Display Toggles</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Easily turn individual landing page sections on or off to tailor the page flow.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllSections(true)}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                  >
                    Enable All
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllSections(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Disable All
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <DragDropSectionBuilder
                  sectionOrder={formData.sectionOrder || DEFAULT_SECTION_ORDER}
                  sectionVisibility={formData.sectionVisibility || {}}
                  onChangeOrder={(newOrder) => setFormData({ ...formData, sectionOrder: newOrder })}
                  onChangeVisibility={(newVis) => setFormData({ ...formData, sectionVisibility: newVis })}
                  onJumpToTab={(tabId) => setActiveTab(tabId as TabType)}
                  currentTemplate={formData.template}
                />
              </div>
            </div>
          </div>
        )}

        {/* 1B. PAGE LAYOUT & SECTIONS (DRAG & DROP CANVAS) */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5 flex items-start gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  Interactive Drag-and-Drop Page Layout Builder
                </h3>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                  Design the exact visitor journey for this landing page. Drag any section by its handle to position it higher or lower, add missing components from the library, or apply 1-click recommended flows.
                </p>
              </div>
            </div>

            <DragDropSectionBuilder
              sectionOrder={formData.sectionOrder || DEFAULT_SECTION_ORDER}
              sectionVisibility={formData.sectionVisibility || {}}
              onChangeOrder={(newOrder) => setFormData({ ...formData, sectionOrder: newOrder })}
              onChangeVisibility={(newVis) => setFormData({ ...formData, sectionVisibility: newVis })}
              onJumpToTab={(tabId) => setActiveTab(tabId as TabType)}
              currentTemplate={formData.template}
            />
          </div>
        )}

        {/* 2. HERO SECTION */}
        {activeTab === 'hero' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Hero Headline
              </label>
              <input
                type="text"
                value={formData.heroHeadline || ''}
                onChange={(e) => setFormData({ ...formData, heroHeadline: e.target.value })}
                placeholder="e.g. Vietnam Smart City, Tea & Cafe B2B Business Delegation 2026"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Hero Subheadline / Value Proposition
              </label>
              <textarea
                rows={3}
                value={formData.heroSubheadline || ''}
                onChange={(e) => setFormData({ ...formData, heroSubheadline: e.target.value })}
                placeholder="Expand on why delegates must attend..."
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Hero CTA Button Text
                </label>
                <input
                  type="text"
                  value={formData.heroCtaText || ''}
                  onChange={(e) => setFormData({ ...formData, heroCtaText: e.target.value })}
                  placeholder="e.g. Reserve Your Seat ($499)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Hero CTA Button Target Link / Anchor
                </label>
                <input
                  type="text"
                  value={formData.heroCtaLink || ''}
                  onChange={(e) => setFormData({ ...formData, heroCtaLink: e.target.value })}
                  placeholder="e.g. #booking-form or https://t.me/khbevents"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Hero Image Selection */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Hero Image URL
              </label>
              <input
                type="text"
                value={formData.heroImage || ''}
                onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                placeholder="/photos/photo_2026-09-16_22-01-09 (2).jpg"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
              />

              <div className="text-[11px] text-slate-500 dark:text-gray-400 font-semibold pt-1">
                Quick Select from Event Photo Library:
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 pt-1">
                {PRESET_PHOTOS.map((photo, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({ ...formData, heroImage: photo })}
                    className={`rounded-xl overflow-hidden aspect-[4/3] border-2 transition-all cursor-pointer ${
                      formData.heroImage === photo ? 'border-amber-400 scale-105 shadow-md' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. EVENT & URGENCY */}
        {activeTab === 'event' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Event Start Date
                </label>
                <input
                  type="text"
                  value={formData.eventDate || ''}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  placeholder="e.g. 2026-10-08 or Oct 8-11, 2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Duration / Time
                </label>
                <input
                  type="text"
                  value={formData.eventTime || ''}
                  onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                  placeholder="e.g. 4 Days / 3 Nights"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={formData.venue || ''}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. Hanoi & Halong Bay, Vietnam"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Venue Address / City
                </label>
                <input
                  type="text"
                  value={formData.venueAddress || ''}
                  onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                  placeholder="e.g. Vietnam Exhibition Center & Halong Bay"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="countdownEnabled"
                checked={formData.countdownEnabled ?? false}
                onChange={(e) => setFormData({ ...formData, countdownEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 bg-white dark:bg-[#06100B] border-slate-300 dark:border-emerald-900 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="countdownEnabled" className="text-xs text-slate-700 dark:text-gray-200 font-semibold cursor-pointer">
                Enable live countdown timer banner on landing page
              </label>
            </div>

            {/* Quota & Urgency Settings */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Seats Quota & Early Bird Pricing Anchor
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Total Seats</label>
                  <input
                    type="number"
                    value={formData.urgency?.totalSeats ?? 30}
                    onChange={(e) => setFormData({
                      ...formData,
                      urgency: { ...formData.urgency, totalSeats: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Claimed Seats</label>
                  <input
                    type="number"
                    value={formData.urgency?.claimedSeats ?? 19}
                    onChange={(e) => setFormData({
                      ...formData,
                      urgency: { ...formData.urgency, claimedSeats: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-amber-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Early Bird Price ($)</label>
                  <input
                    type="text"
                    value={formData.urgency?.earlyBirdPrice ?? 499}
                    onChange={(e) => setFormData({
                      ...formData,
                      urgency: { ...formData.urgency, earlyBirdPrice: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Regular Price ($)</label>
                  <input
                    type="text"
                    value={formData.urgency?.regularPrice ?? 550}
                    onChange={(e) => setFormData({
                      ...formData,
                      urgency: { ...formData.urgency, regularPrice: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Urgency Notice Banner Text</label>
                <input
                  type="text"
                  value={formData.urgency?.noticeText || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    urgency: { ...formData.urgency, noticeText: e.target.value }
                  })}
                  placeholder="Early Bird Special: Save $51 before Sept 8, 2026 | Strictly limited to 30 seats"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Risk-Free Note</label>
                <input
                  type="text"
                  value={formData.urgency?.riskNote || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    urgency: { ...formData.urgency, riskNote: e.target.value }
                  })}
                  placeholder="No payment today • Seat held instantly • Reply within 15 mins"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. PACKAGES & PRICING */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ticket Passes & Pricing Tiers ({formData.packages?.length || 0})
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Create, edit, or delete the admission and delegate passes.
                </p>
              </div>
              <button
                type="button"
                onClick={addPackage}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Package Tier</span>
              </button>
            </div>

            <div className="space-y-4">
              {(formData.packages || []).map((pkg, idx) => (
                <div key={pkg.id || idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/70 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-900/40 pb-3">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Tier #{idx + 1}: {pkg.name || 'Unnamed Tier'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePackage(idx)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Tier</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Package Name</label>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => updatePackage(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Price</label>
                      <input
                        type="text"
                        value={pkg.price}
                        onChange={(e) => updatePackage(idx, 'price', e.target.value)}
                        placeholder="e.g. $499 or $1,450"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-amber-600 dark:text-amber-300 font-black text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Period / Unit Note</label>
                      <input
                        type="text"
                        value={pkg.period || ''}
                        onChange={(e) => updatePackage(idx, 'period', e.target.value)}
                        placeholder="e.g. per delegate"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id={`pop-${idx}`}
                      checked={pkg.popular || false}
                      onChange={(e) => updatePackage(idx, 'popular', e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-white dark:bg-[#050C08] border-slate-300 dark:border-emerald-900 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor={`pop-${idx}`} className="text-xs text-amber-700 dark:text-amber-300 font-semibold cursor-pointer">
                      Mark as &quot;Most Popular / Recommended&quot; (Gold Highlight)
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Short Description</label>
                    <input
                      type="text"
                      value={pkg.description || ''}
                      onChange={(e) => updatePackage(idx, 'description', e.target.value)}
                      placeholder="e.g. Most popular choice for founders, importers, and F&B entrepreneurs."
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  {/* Features List CRUD */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-emerald-950">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300">
                      Package Features & Inclusions ({pkg.features?.length || 0})
                    </label>
                    <div className="space-y-1.5">
                      {(pkg.features || []).map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 bg-white dark:bg-[#050C08] p-2 rounded-lg border border-slate-200 dark:border-emerald-900/40 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => {
                              const updated = [...pkg.features];
                              updated[fIdx] = e.target.value;
                              updatePackage(idx, 'features', updated);
                            }}
                            className="flex-1 bg-transparent border-none text-slate-900 dark:text-white focus:outline-none text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removePackageFeature(idx, fIdx)}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"
                            title="Remove feature"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newFeatureText[idx] || ''}
                        onChange={(e) => setNewFeatureText({ ...newFeatureText, [idx]: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPackageFeature(idx); } }}
                        placeholder="Add a new feature bullet point..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => addPackageFeature(idx)}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 text-black font-bold text-xs cursor-pointer hover:bg-amber-300"
                      >
                        + Add Feature
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Button CTA Text</label>
                      <input
                        type="text"
                        value={pkg.ctaText || ''}
                        onChange={(e) => updatePackage(idx, 'ctaText', e.target.value)}
                        placeholder="e.g. Lock In $499 Early Bird Rate"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPO BOOTHS TAB */}
        {activeTab === 'expoBooths' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-500" />
                  <span>Exhibition Booth Tiers &amp; Floor Space ({formData.expoBooths?.length || 0})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Dedicated for Trade Expo landing pages. Manage booth sizes, pricing, footfall zones, inventory and inclusions.
                </p>
              </div>
              <button
                type="button"
                onClick={addExpoBooth}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Booth Tier</span>
              </button>
            </div>

            {(!formData.expoBooths || formData.expoBooths.length === 0) && (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#07130D] border border-dashed border-slate-300 dark:border-emerald-900/60 text-center space-y-3">
                <Store className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-gray-400">No booth tiers added yet.</p>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, expoBooths: DEFAULT_EXPO_BOOTHS })}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer shadow-md"
                >
                  Load 3 Turnkey Expo Booth Presets
                </button>
              </div>
            )}

            <div className="space-y-4">
              {(formData.expoBooths || []).map((booth, idx) => (
                <div key={booth.id || idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/70 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-900/40 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Booth #{idx + 1}: {booth.name}
                      </span>
                      {booth.popular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-black">
                          Popular
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExpoBooth(idx)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Booth</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Booth Tier Name</label>
                      <input
                        type="text"
                        value={booth.name}
                        onChange={(e) => updateExpoBooth(idx, 'name', e.target.value)}
                        placeholder="e.g. Standard Shell Scheme"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Dimensions &amp; Area</label>
                      <input
                        type="text"
                        value={booth.size}
                        onChange={(e) => updateExpoBooth(idx, 'size', e.target.value)}
                        placeholder="e.g. 3m x 3m (9 sqm)"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Booth Price</label>
                      <input
                        type="text"
                        value={booth.price}
                        onChange={(e) => updateExpoBooth(idx, 'price', e.target.value)}
                        placeholder="e.g. $1,200"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-amber-600 dark:text-amber-400 font-black text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Floor Location / Hall Zone</label>
                      <input
                        type="text"
                        value={booth.location || ''}
                        onChange={(e) => updateExpoBooth(idx, 'location', e.target.value)}
                        placeholder="e.g. Zone A - Main Walkway"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Available Count</label>
                      <input
                        type="number"
                        value={booth.availableCount ?? 5}
                        onChange={(e) => updateExpoBooth(idx, 'availableCount', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Total Count in Hall</label>
                      <input
                        type="number"
                        value={booth.totalCount ?? 10}
                        onChange={(e) => updateExpoBooth(idx, 'totalCount', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={booth.popular || false}
                          onChange={(e) => updateExpoBooth(idx, 'popular', e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500"
                        />
                        <span className="font-semibold">Highlight as Prime Footfall / Popular</span>
                      </label>
                    </div>
                  </div>

                  {/* Booth features */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-emerald-950">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                      Standard Booth Inclusions &amp; Fit-Out:
                    </div>
                    <div className="space-y-1.5">
                      {(booth.features || []).map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/40 text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-slate-800 dark:text-gray-200">{feat}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBoothFeature(idx, fIdx)}
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newBoothFeatureText[idx] || ''}
                        onChange={(e) => setNewBoothFeatureText({ ...newBoothFeatureText, [idx]: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBoothFeature(idx); } }}
                        placeholder="Add included item (e.g. 2x Spotlights, 1x Counter, Fascia board)..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => addBoothFeature(idx)}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 text-black font-bold text-xs cursor-pointer hover:bg-amber-300"
                      >
                        + Add Inclusion
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ARTISTS TAB */}
        {activeTab === 'artists' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-400" />
                  <span>Artist &amp; Performer Lineup ({formData.artists?.length || 0})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Dedicated for Concert &amp; Festival landing pages. Manage performers, set times, stage zones, and artist photos.
                </p>
              </div>
              <button
                type="button"
                onClick={addArtist}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 hover:bg-purple-200 text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Performer</span>
              </button>
            </div>

            {(!formData.artists || formData.artists.length === 0) && (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#07130D] border border-dashed border-slate-300 dark:border-emerald-900/60 text-center space-y-3">
                <Music className="w-8 h-8 text-purple-400 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-gray-400">No performers added yet.</p>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, artists: DEFAULT_FESTIVAL_ARTISTS })}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer shadow-md"
                >
                  Load 3 Sample Headliners &amp; DJs
                </button>
              </div>
            )}

            <div className="space-y-4">
              {(formData.artists || []).map((artist, idx) => (
                <div key={artist.id || idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/70 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-900/40 pb-3">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      Artist #{idx + 1}: {artist.name || 'Unnamed Performer'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeArtist(idx)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Artist</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Artist / DJ Name</label>
                      <input
                        type="text"
                        value={artist.name}
                        onChange={(e) => updateArtist(idx, 'name', e.target.value)}
                        placeholder="e.g. ElectroPulse"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Role / Billing</label>
                      <input
                        type="text"
                        value={artist.role}
                        onChange={(e) => updateArtist(idx, 'role', e.target.value)}
                        placeholder="e.g. Headliner DJ, Live Band"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Stage Name</label>
                      <input
                        type="text"
                        value={artist.stageName || ''}
                        onChange={(e) => updateArtist(idx, 'stageName', e.target.value)}
                        placeholder="e.g. Main Stage Arena"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Performance Set Time</label>
                      <input
                        type="text"
                        value={artist.stageTime || ''}
                        onChange={(e) => updateArtist(idx, 'stageTime', e.target.value)}
                        placeholder="e.g. 21:30 - 23:00"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-amber-600 dark:text-amber-400 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Music Genre</label>
                      <input
                        type="text"
                        value={artist.genre || ''}
                        onChange={(e) => updateArtist(idx, 'genre', e.target.value)}
                        placeholder="e.g. EDM / Progressive House"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Photo Image URL</label>
                      <input
                        type="text"
                        value={artist.image || ''}
                        onChange={(e) => updateArtist(idx, 'image', e.target.value)}
                        placeholder="/photos/photo_2026-09-16_22-01-09 (6).jpg"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Short Bio</label>
                    <textarea
                      rows={2}
                      value={artist.bio || ''}
                      onChange={(e) => updateArtist(idx, 'bio', e.target.value)}
                      placeholder="Brief bio or performance description..."
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SPEAKERS TAB */}
        {activeTab === 'speakers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Mic className="w-4 h-4 text-amber-500" />
                  <span>Keynote Speakers &amp; Panelists ({formData.speakers?.length || 0})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Dedicated for Corporate Summit landing pages. Manage VIP speakers, keynote titles, tracks, and credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={addSpeaker}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 hover:bg-amber-200 text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Speaker</span>
              </button>
            </div>

            {(!formData.speakers || formData.speakers.length === 0) && (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#07130D] border border-dashed border-slate-300 dark:border-emerald-900/60 text-center space-y-3">
                <Mic className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-gray-400">No keynote speakers added yet.</p>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, speakers: DEFAULT_SUMMIT_SPEAKERS })}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer shadow-md"
                >
                  Load 3 Sample Keynote Speakers
                </button>
              </div>
            )}

            <div className="space-y-4">
              {(formData.speakers || []).map((speaker, idx) => (
                <div key={speaker.id || idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/70 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-900/40 pb-3">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Speaker #{idx + 1}: {speaker.name || 'Unnamed Speaker'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSpeaker(idx)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Speaker</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Speaker Full Name</label>
                      <input
                        type="text"
                        value={speaker.name}
                        onChange={(e) => updateSpeaker(idx, 'name', e.target.value)}
                        placeholder="e.g. Oknha Sokha Meng"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Professional Title</label>
                      <input
                        type="text"
                        value={speaker.title}
                        onChange={(e) => updateSpeaker(idx, 'title', e.target.value)}
                        placeholder="e.g. Chairman &amp; Group CEO"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Organization / Company</label>
                      <input
                        type="text"
                        value={speaker.organization}
                        onChange={(e) => updateSpeaker(idx, 'organization', e.target.value)}
                        placeholder="e.g. Apex Trading Corp"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Conference Track</label>
                      <input
                        type="text"
                        value={speaker.track || ''}
                        onChange={(e) => updateSpeaker(idx, 'track', e.target.value)}
                        placeholder="e.g. Plenary Keynote, Smart City Track"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Session Presentation Time</label>
                      <input
                        type="text"
                        value={speaker.sessionTime || ''}
                        onChange={(e) => updateSpeaker(idx, 'sessionTime', e.target.value)}
                        placeholder="e.g. 09:30 - 10:15"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-amber-600 dark:text-amber-400 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Avatar Photo URL</label>
                      <input
                        type="text"
                        value={speaker.avatar || ''}
                        onChange={(e) => updateSpeaker(idx, 'avatar', e.target.value)}
                        placeholder="/photos/photo_2026-09-16_22-01-09 (2).jpg"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Presentation / Keynote Topic</label>
                    <input
                      type="text"
                      value={speaker.topic || ''}
                      onChange={(e) => updateSpeaker(idx, 'topic', e.target.value)}
                      placeholder="e.g. Cross-Border Supply Chain Resilience &amp; Automation"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs italic"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. ITINERARY & AGENDA */}
        {activeTab === 'itinerary' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Program Itinerary & Schedule ({formData.itinerary?.length || 0} Days)
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Manage the daily timetable, expo visits, and matching sessions.
                </p>
              </div>
              <button
                type="button"
                onClick={addDay}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Day</span>
              </button>
            </div>

            <div className="space-y-6">
              {(formData.itinerary || []).map((day, dayIdx) => (
                <div key={day.id || dayIdx} className="p-5 rounded-2xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/70 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-900/40 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center">
                        {day.day}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Day {day.day}: {day.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDay(dayIdx)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Day</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Day Number</label>
                      <input
                        type="text"
                        value={day.day}
                        onChange={(e) => updateDay(dayIdx, 'day', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Date</label>
                      <input
                        type="text"
                        value={day.date}
                        onChange={(e) => updateDay(dayIdx, 'date', e.target.value)}
                        placeholder="e.g. Oct 8, 2026"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Day Title</label>
                      <input
                        type="text"
                        value={day.title}
                        onChange={(e) => updateDay(dayIdx, 'title', e.target.value)}
                        placeholder="e.g. Cafe Show Expo & B2B Matchmaking"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Day Events / Schedule CRUD */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-emerald-950">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Events &amp; Timetable Slots ({day.events?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => addEventToDay(dayIdx)}
                        className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        + Add Time Slot
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(day.events || []).map((ev, evIdx) => (
                        <div key={evIdx} className="p-3 rounded-xl bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
                          <input
                            type="text"
                            value={ev.time}
                            onChange={(e) => updateEventInDay(dayIdx, evIdx, 'time', e.target.value)}
                            placeholder="08:00 - 09:00"
                            className="w-full sm:w-36 px-2 py-1 rounded bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-900/50 font-mono text-[11px] text-amber-600 dark:text-amber-300 font-bold"
                          />
                          <input
                            type="text"
                            value={ev.activity}
                            onChange={(e) => updateEventInDay(dayIdx, evIdx, 'activity', e.target.value)}
                            placeholder="Activity / Session headline"
                            className="flex-1 w-full px-2 py-1 rounded bg-transparent border border-slate-200 dark:border-emerald-900/50 text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeEventFromDay(dayIdx, evIdx)}
                            className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer self-end sm:self-center"
                            title="Delete time slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. CORE VALUES & HIGHLIGHTS */}
        {activeTab === 'values' && (
          <div className="space-y-8">
            {/* Core Values */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Core Value Outcomes ({formData.coreValues?.length || 0})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    The 4 fundamental commercial outcomes delegates take home.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCoreValue}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Core Value</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {(formData.coreValues || []).map((cv, idx) => (
                  <div key={cv.id || idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-500">Outcome #{cv.num || idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeCoreValue(idx)}
                        className="text-rose-500 text-xs cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={cv.num || ''}
                        onChange={(e) => updateCoreValue(idx, 'num', e.target.value)}
                        placeholder="01"
                        className="col-span-1 px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-amber-500 font-bold"
                      />
                      <input
                        type="text"
                        value={cv.title}
                        onChange={(e) => updateCoreValue(idx, 'title', e.target.value)}
                        placeholder="Outcome Title"
                        className="col-span-3 px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={cv.desc}
                      onChange={(e) => updateCoreValue(idx, 'desc', e.target.value)}
                      placeholder="Outcome Description"
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-emerald-950">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Program Highlights ({formData.highlights?.length || 0})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Key features that make this program unrivaled.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addHighlight}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Highlight</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {(formData.highlights || []).map((h, idx) => (
                  <div key={h.id || idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Highlight #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeHighlight(idx)}
                        className="text-rose-500 text-xs cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                    <input
                      type="text"
                      value={h.title}
                      onChange={(e) => updateHighlight(idx, 'title', e.target.value)}
                      placeholder="Title"
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <textarea
                      rows={2}
                      value={h.description}
                      onChange={(e) => updateHighlight(idx, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. PROBLEMS & SOLUTIONS */}
        {activeTab === 'problems' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pain Points &amp; Obstacles Solved ({formData.problems?.length || 0})
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  The frustrating problems importers face when sourcing alone.
                </p>
              </div>
              <button
                type="button"
                onClick={addProblem}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pain Point</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {(formData.problems || []).map((p, idx) => (
                <div key={p.id || idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-500">Problem #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeProblem(idx)}
                      className="text-rose-500 text-xs cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                  <input
                    type="text"
                    value={p.title}
                    onChange={(e) => updateProblem(idx, 'title', e.target.value)}
                    placeholder="e.g. Middleman Markups"
                    className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <textarea
                    rows={3}
                    value={p.desc}
                    onChange={(e) => updateProblem(idx, 'desc', e.target.value)}
                    placeholder="Describe how this costs the importer money..."
                    className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. TARGET AUDIENCE */}
        {activeTab === 'audiences' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Target Audience &amp; Personas ({formData.audiences?.length || 0})
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  The specific profiles engineered to participate in this delegation.
                </p>
              </div>
              <button
                type="button"
                onClick={addAudience}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Persona</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {(formData.audiences || []).map((aud, idx) => (
                <div key={aud.id || idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-500">Persona #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeAudience(idx)}
                      className="text-rose-500 text-xs cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={aud.title}
                      onChange={(e) => updateAudience(idx, 'title', e.target.value)}
                      placeholder="e.g. Cafe & Tea Brand Owners"
                      className="col-span-2 px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={aud.tag || ''}
                      onChange={(e) => updateAudience(idx, 'tag', e.target.value)}
                      placeholder="Tag e.g. F&B"
                      className="col-span-1 px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-emerald-600 dark:text-emerald-400 font-bold"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={aud.desc}
                    onChange={(e) => updateAudience(idx, 'desc', e.target.value)}
                    placeholder="Describe what opportunities await this profile..."
                    className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. VALUE STACK */}
        {activeTab === 'valueStack' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Value Stack &amp; Inclusions ({formData.valueStack?.inclusions?.length || 0} items)
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Build the high-converting &quot;9-in-1 Everything Handled&quot; package stack with standalone price anchors.
                </p>
              </div>
              <button
                type="button"
                onClick={addInclusion}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Inclusion Item</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/50">
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Stack Headline</label>
                <input
                  type="text"
                  value={formData.valueStack?.title || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    valueStack: { ...(formData.valueStack || { inclusions: [] }), title: e.target.value }
                  })}
                  placeholder="One Price. Nine Things Fully Handled."
                  className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Total Standalone Value Anchor</label>
                <input
                  type="text"
                  value={formData.valueStack?.totalValue || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    valueStack: { ...(formData.valueStack || { inclusions: [] }), totalValue: e.target.value }
                  })}
                  placeholder="e.g. $910+"
                  className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs font-bold text-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Pay Anchor Label</label>
                <input
                  type="text"
                  value={formData.valueStack?.payLabel || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    valueStack: { ...(formData.valueStack || { inclusions: [] }), payLabel: e.target.value }
                  })}
                  placeholder="e.g. Your Early Bird investment"
                  className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              {(formData.valueStack?.inclusions || []).map((inc, idx) => (
                <div key={inc.id || idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={inc.title}
                    onChange={(e) => updateInclusion(idx, 'title', e.target.value)}
                    placeholder="Title e.g. Roundtrip Flight Tickets"
                    className="w-full sm:w-64 px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={inc.desc}
                    onChange={(e) => updateInclusion(idx, 'desc', e.target.value)}
                    placeholder="Details e.g. Phnom Penh - Hanoi roundtrip included."
                    className="flex-1 w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <span className="text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      value={inc.standalonePrice ?? 50}
                      onChange={(e) => updateInclusion(idx, 'standalonePrice', Number(e.target.value))}
                      className="w-20 px-2 py-1 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-amber-500 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => removeInclusion(idx)}
                      className="text-rose-500 p-1 cursor-pointer"
                      title="Delete inclusion"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. TESTIMONIALS */}
        {activeTab === 'testimonials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Testimonials &amp; Reviews ({formData.testimonials?.length || 0})
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Participant quotes, social proof, and verified delegate feedback.
                </p>
              </div>
              <button
                type="button"
                onClick={addTestimonial}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Testimonial</span>
              </button>
            </div>

            <div className="space-y-4">
              {(formData.testimonials || []).map((t, idx) => (
                <div key={t.id || idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-500">Review #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeTestimonial(idx)}
                      className="text-rose-500 text-xs cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => updateTestimonial(idx, 'name', e.target.value)}
                        placeholder="Dara S."
                        className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Role</label>
                      <input
                        type="text"
                        value={t.role}
                        onChange={(e) => updateTestimonial(idx, 'role', e.target.value)}
                        placeholder="Cafe Chain CEO"
                        className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Company</label>
                      <input
                        type="text"
                        value={t.company}
                        onChange={(e) => updateTestimonial(idx, 'company', e.target.value)}
                        placeholder="Phnom Penh Roastery"
                        className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Rating (1-5)</label>
                      <select
                        value={t.rating || 5}
                        onChange={(e) => updateTestimonial(idx, 'rating', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-amber-500 font-bold"
                      >
                        <option value={5}>★★★★★ (5 Stars)</option>
                        <option value={4}>★★★★☆ (4 Stars)</option>
                        <option value={3}>★★★☆☆ (3 Stars)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-gray-400 mb-1">Review Quote</label>
                    <textarea
                      rows={2}
                      value={t.quote}
                      onChange={(e) => updateTestimonial(idx, 'quote', e.target.value)}
                      placeholder="Attending this event gave us..."
                      className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. PHOTO GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Visual Gallery ({formData.gallery?.length || 0} Photos)
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Photos of previous editions, expo floors, VIP transfers, and scenery.
                </p>
              </div>
            </div>

            {/* Add Custom URL */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                placeholder="Enter image URL or path (/photos/...)"
                className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => addGalleryImage(newGalleryUrl)}
                className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs cursor-pointer hover:bg-amber-300"
              >
                + Add Image
              </button>
            </div>

            {/* Quick 1-Click Library Presets */}
            <div className="space-y-1 pt-2">
              <div className="text-[11px] text-slate-500 dark:text-gray-400 font-semibold">
                Click any photo to instantly add it to this page gallery:
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {PRESET_PHOTOS.map((photo, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addGalleryImage(photo)}
                    className="rounded-xl overflow-hidden aspect-[4/3] border border-slate-200 dark:border-emerald-900/40 hover:border-amber-400 hover:scale-105 transition-all cursor-pointer group relative"
                    title="Click to add to gallery"
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold">
                      + Add
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Gallery Grid */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-emerald-950">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Current Gallery Items:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {(formData.gallery || []).map((img, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-emerald-900/50 bg-slate-100 dark:bg-black/30 relative group shadow-sm">
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full aspect-[4/3] object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 cursor-pointer shadow"
                      title="Delete image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-2 text-[10px] text-slate-500 dark:text-gray-400 truncate bg-white dark:bg-[#07130D]">
                      {img}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 12. FAQS */}
        {activeTab === 'faqs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Frequently Asked Questions ({formData.faqs?.length || 0})</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">Directly resolve objections and doubts.</p>
              </div>
              <button
                type="button"
                onClick={addFaq}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-3">
              {(formData.faqs || []).map((faq, idx) => (
                <div key={faq.id || idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">FAQ #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeFaq(idx)}
                      className="text-rose-600 text-xs cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                    placeholder="Question"
                    className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                    placeholder="Answer"
                    className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-amber-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 13. GUARANTEE & TRUST */}
        {activeTab === 'guarantee' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Risk-Free Guarantee &amp; Confidence ({formData.guarantee?.points?.length || 0} Points)</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">Reassure clients that their seat reservation has zero financial risk.</p>
              </div>
              <button
                type="button"
                onClick={addGuaranteePoint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Guarantee Point</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Guarantee Section Title</label>
                <input
                  type="text"
                  value={formData.guarantee?.title || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    guarantee: { ...(formData.guarantee || { points: [] }), title: e.target.value }
                  })}
                  placeholder="Your Reservation is 100% Risk-Free"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Badge / Tag</label>
                <input
                  type="text"
                  value={formData.guarantee?.badge || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    guarantee: { ...(formData.guarantee || { points: [] }), badge: e.target.value }
                  })}
                  placeholder="100% Risk Reversal Guarantee"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-xs text-amber-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Guarantee Explanation Subtitle</label>
              <textarea
                rows={2}
                value={formData.guarantee?.subtitle || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  guarantee: { ...(formData.guarantee || { points: [] }), subtitle: e.target.value }
                })}
                placeholder="You pay nothing today until you have spoken with our team..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white resize-none"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-emerald-950">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Guarantee Bullets / Safeguards:</span>
              <div className="space-y-2">
                {(formData.guarantee?.points || []).map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-[#07130D] p-2.5 rounded-xl border border-slate-200 dark:border-emerald-900/50">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updateGuaranteePoint(idx, e.target.value)}
                      className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeGuaranteePoint(idx)}
                      className="text-rose-500 p-1 cursor-pointer"
                      title="Delete bullet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 14. LEAD FORM */}
        {activeTab === 'form' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lead Capture Form Configuration</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">Configure the headline, fields, and success feedback.</p>
              </div>
              <button
                type="button"
                onClick={addFormField}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Form Field</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Form Headline</label>
                <input
                  type="text"
                  value={formData.formConfig?.headline || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    formConfig: { ...(formData.formConfig || { fields: [], successMessage: '', submitButtonText: '', subheadline: '' }), headline: e.target.value }
                  })}
                  placeholder="Reserve Your Registration"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Submit Button Text</label>
                <input
                  type="text"
                  value={formData.formConfig?.submitButtonText || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    formConfig: { ...(formData.formConfig || { fields: [], successMessage: '', headline: '', subheadline: '' }), submitButtonText: e.target.value }
                  })}
                  placeholder="Submit Registration Now"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Form Subheadline / Instructions</label>
              <input
                type="text"
                value={formData.formConfig?.subheadline || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  formConfig: { ...(formData.formConfig || { fields: [], successMessage: '', headline: '', submitButtonText: '' }), subheadline: e.target.value }
                })}
                placeholder="Fill in your details below and our team will get in touch within 15 minutes."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Success Message (Shown after submit)</label>
              <input
                type="text"
                value={formData.formConfig?.successMessage || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  formConfig: { ...(formData.formConfig || { fields: [], subheadline: '', headline: '', submitButtonText: '' }), successMessage: e.target.value }
                })}
                placeholder="Thank you! Your registration has been received."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-xs text-emerald-600 dark:text-emerald-400 font-bold"
              />
            </div>

            {/* Custom fields list */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-emerald-950">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Form Input Fields ({formData.formConfig?.fields?.length || 0}):</div>
              {(formData.formConfig?.fields || []).map((f, fIdx) => (
                <div key={f.id || fIdx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 grid sm:grid-cols-4 gap-3 items-center">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Field Label</label>
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => updateFormField(fIdx, 'label', e.target.value)}
                      placeholder="Label"
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Type</label>
                    <select
                      value={f.type}
                      onChange={(e) => updateFormField(fIdx, 'type', e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs"
                    >
                      <option value="text">Text</option>
                      <option value="tel">Phone / Tel</option>
                      <option value="email">Email</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Dropdown Select</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Placeholder</label>
                    <input
                      type="text"
                      value={f.placeholder || ''}
                      onChange={(e) => updateFormField(fIdx, 'placeholder', e.target.value)}
                      placeholder="e.g. Enter name..."
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#050C08] border border-slate-200 dark:border-emerald-900/60 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-3 sm:pt-0">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => updateFormField(fIdx, 'required', e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-amber-500"
                      />
                      <span>Required</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeFormField(fIdx)}
                      className="text-rose-500 p-1 cursor-pointer"
                      title="Delete field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 15. SEO & SOCIAL */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Meta Title (Search engines &amp; browser tab)
              </label>
              <input
                type="text"
                value={formData.metaTitle || ''}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="e.g. Smart City, Tea & Cafe Business Delegation 2026 | KHB EVENTS"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Meta Description (Search snippet &amp; social previews)
              </label>
              <textarea
                rows={3}
                value={formData.metaDescription || ''}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="Brief summary shown on Google and Telegram link previews..."
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Open Graph / Social Share Image URL
              </label>
              <input
                type="text"
                value={formData.ogImage || ''}
                onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                placeholder="/photos/photo_2026-09-16_22-01-09 (2).jpg"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}

        {/* 16. TRACKING & PIXELS */}
        {activeTab === 'tracking' && (
          <TrackingAndPixelsEditor formData={formData} setFormData={setFormData} />
        )}

        {/* 17. DEDICATED CAMPAIGN SETTINGS */}
        {activeTab === 'isolatedSettings' && (
          <IsolatedSettingsEditor formData={formData} setFormData={setFormData} />
        )}

        {/* Bottom Save bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-gray-400">
            {isNew ? 'Ready to create page' : `Editing ${formData.title || 'Landing Page'}`} &bull; All changes save to real-time storage.
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer transition-all hover:scale-102"
          >
            <Save className="w-4 h-4 text-black" />
            <span>{saving ? 'Saving...' : 'Save & Publish Landing Page'}</span>
          </button>
        </div>
      </div>
    </>
  ) : (
        <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-xl transition-colors">
          <KhmerTranslationEditor formData={formData} setFormData={setFormData} />

          {/* Bottom Save bar */}
          <div className="pt-6 border-t border-slate-200 dark:border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-gray-400">
              Editing Khmer translations for <strong>{formData.title || 'Landing Page'}</strong> &bull; All changes save to real-time storage.
            </div>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer transition-all hover:scale-102"
            >
              <Save className="w-4 h-4 text-black" />
              <span>{saving ? 'Saving...' : 'Save & Publish All Changes'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
