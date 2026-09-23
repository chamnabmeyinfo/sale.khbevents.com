export type PageStatus = "published" | "draft" | "archived";

export interface PackageTier {
  id: string;
  name: string;
  price: string;
  period?: string;
  description?: string;
  popular?: boolean;
  features: string[];
  ctaText: string;
}

export interface HighlightItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  rating?: number;
  avatar?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "select" | "textarea";
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface FormConfig {
  headline: string;
  subheadline: string;
  submitButtonText: string;
  successMessage: string;
  fields: FormField[];
}

export interface CoreValueItem {
  id: string;
  num?: string;
  icon?: string;
  title: string;
  desc: string;
}

export interface ProblemItem {
  id: string;
  icon?: string;
  title: string;
  desc: string;
}

export interface AudienceItem {
  id: string;
  icon?: string;
  title: string;
  desc: string;
  tag?: string;
}

export interface ItineraryEvent {
  time: string;
  activity: string;
  desc?: string;
}

export interface ItineraryDay {
  id: string;
  day: number | string;
  date: string;
  title: string;
  events: ItineraryEvent[];
}

export interface InclusionItem {
  id: string;
  title: string;
  desc: string;
  standalonePrice?: number | string;
}

export interface ValueStackConfig {
  tag?: string;
  title?: string;
  subtitle?: string;
  note?: string;
  totalLabel?: string;
  totalValue?: string;
  payLabel?: string;
  inclusions: InclusionItem[];
}

export interface GuaranteeConfig {
  title?: string;
  subtitle?: string;
  badge?: string;
  points: string[];
}

export interface UrgencyConfig {
  totalSeats?: number;
  claimedSeats?: number;
  earlyBirdPrice?: number | string;
  regularPrice?: number | string;
  earlyBirdDeadline?: string;
  registrationDeadline?: string;
  noticeText?: string;
  riskNote?: string;
}

export interface SectionVisibility {
  hero?: boolean;
  urgency?: boolean;
  coreValues?: boolean;
  highlights?: boolean;
  problems?: boolean;
  audiences?: boolean;
  matchmaker?: boolean;
  itinerary?: boolean;
  valueStack?: boolean;
  packages?: boolean;
  expoBooths?: boolean;
  artists?: boolean;
  speakers?: boolean;
  gallery?: boolean;
  testimonials?: boolean;
  faqs?: boolean;
  guarantee?: boolean;
  form?: boolean;
}

export interface SectionCatalogItem {
  key: string;
  label: string;
  khLabel: string;
  description: string;
  category: 'hero' | 'offer' | 'program' | 'proof' | 'conversion';
  icon: string;
  tabId: string;
  defaultVisible: boolean;
}

export const SECTION_CATALOG: SectionCatalogItem[] = [
  {
    key: 'hero',
    label: 'Hero Banner & Headline',
    khLabel: 'បដាធំ និងចំណងជើងចម្បង',
    description: 'High-impact value proposition, event date/venue badges, hero background slider, and main CTA.',
    category: 'hero',
    icon: 'LayoutTemplate',
    tabId: 'hero',
    defaultVisible: true,
  },
  {
    key: 'urgency',
    label: 'Urgency Bar & Quota',
    khLabel: 'របារបន្ទាន់ & កូតាកៅអី',
    description: 'Live claimed seat count, avatar social proof stack, and early bird price savings notification.',
    category: 'conversion',
    icon: 'Flame',
    tabId: 'event',
    defaultVisible: true,
  },
  {
    key: 'coreValues',
    label: '4 Core Value Pillars',
    khLabel: 'សសរស្តម្ភតម្លៃស្នូលទាំង ៤',
    description: 'Direct factory pricing, bilateral networking, market intelligence, and executive logistics.',
    category: 'offer',
    icon: 'Gem',
    tabId: 'values',
    defaultVisible: true,
  },
  {
    key: 'highlights',
    label: 'Key Highlights & Verification',
    khLabel: 'ស្ថិតិ & ចំណុចលេចធ្លោសំខាន់ៗ',
    description: 'Verified numbers: 2 international expos, direct factory inspections, and UNESCO cruise.',
    category: 'proof',
    icon: 'TrendingUp',
    tabId: 'values',
    defaultVisible: true,
  },
  {
    key: 'problems',
    label: 'Problem vs Solution',
    khLabel: 'បញ្ហាប្រឈម & ដំណោះស្រាយ',
    description: 'Why sourcing online costs 25-35% more vs. direct face-to-face factory representation.',
    category: 'offer',
    icon: 'AlertTriangle',
    tabId: 'problems',
    defaultVisible: true,
  },
  {
    key: 'audiences',
    label: 'Target Audience & Cohort',
    khLabel: 'ទស្សនិកជនគោលដៅ',
    description: 'Profiles of who should join: Cafe & tea brand owners, retailers, tech founders, and distributors.',
    category: 'offer',
    icon: 'Users',
    tabId: 'audiences',
    defaultVisible: true,
  },
  {
    key: 'matchmaker',
    label: 'Interactive ROI Matchmaker',
    khLabel: 'ការផ្គូផ្គងផលចំណេញអាជីវកម្ម',
    description: 'Interactive track selector showing suppliers met, margins captured, and prepared sessions.',
    category: 'offer',
    icon: 'Target',
    tabId: 'audiences',
    defaultVisible: true,
  },
  {
    key: 'speakers',
    label: 'Keynote Speakers & Mentors',
    khLabel: 'វាគ្មិនកិត្តិយស & អ្នកជំនាញ',
    description: 'Chamber leaders, trade compliance directors, and regional corporate executives.',
    category: 'program',
    icon: 'Mic',
    tabId: 'speakers',
    defaultVisible: false,
  },
  {
    key: 'artists',
    label: 'Artist Lineup & Cultural Gala',
    khLabel: 'សិល្បករ & កម្មវិធីកម្សាន្ត',
    description: 'Acoustic performers, authentic cultural ensembles, and networking banquet entertainment.',
    category: 'program',
    icon: 'Music',
    tabId: 'artists',
    defaultVisible: false,
  },
  {
    key: 'valueStack',
    label: '9-in-1 Turnkey Value Stack',
    khLabel: 'កញ្ចប់អត្ថប្រយោជន៍ ៩-ក្នុង-១',
    description: 'Itemized value calculation: Flights, 5-star hotel, expo VIP passes, cruise, meals, guide.',
    category: 'offer',
    icon: 'Layers',
    tabId: 'valueStack',
    defaultVisible: true,
  },
  {
    key: 'itinerary',
    label: '4D3N Agenda & Itinerary',
    khLabel: 'កាលវិភាគ ៤ថ្ងៃ/៣យប់',
    description: 'Hour-by-hour delegation schedule across trade expos, factory tours, and UNESCO Halong Bay.',
    category: 'program',
    icon: 'Calendar',
    tabId: 'itinerary',
    defaultVisible: true,
  },
  {
    key: 'gallery',
    label: 'Visual Photo Gallery',
    khLabel: 'កម្រងរូបភាពសកម្មភាព',
    description: 'Live delegation impressions, conference floors, factory inspections, and executive events.',
    category: 'proof',
    icon: 'Image',
    tabId: 'gallery',
    defaultVisible: true,
  },
  {
    key: 'expoBooths',
    label: 'Exhibition Booth Tiers',
    khLabel: 'ស្តង់ពិព័រណ៍ពាណិជ្ជកម្ម',
    description: 'Commercial booth packages: Shell schemes, corner booths, and raw island pavilions with pricing.',
    category: 'program',
    icon: 'Store',
    tabId: 'expoBooths',
    defaultVisible: false,
  },
  {
    key: 'testimonials',
    label: 'Executive Testimonials',
    khLabel: 'មតិកែលម្អពីប្រតិភូមុនៗ',
    description: 'Verified 5-star reviews and quotes from enterprise CEOs and beverage importers.',
    category: 'proof',
    icon: 'MessageSquareQuote',
    tabId: 'testimonials',
    defaultVisible: true,
  },
  {
    key: 'packages',
    label: 'Pricing Passes & Investment',
    khLabel: 'កញ្ចប់តម្លៃ & ការវិនិយោគ',
    description: 'Tiered passes with early bird rates, inclusions, features, and countdown timer.',
    category: 'conversion',
    icon: 'CreditCard',
    tabId: 'packages',
    defaultVisible: true,
  },
  {
    key: 'guarantee',
    label: 'Zero-Risk Guarantee & Steps',
    khLabel: 'ការធានាសុវត្ថិភាព & ៣ជំហាន',
    description: '3-step frictionless reservation flow, money-back pledge, and invoice support.',
    category: 'proof',
    icon: 'ShieldCheck',
    tabId: 'guarantee',
    defaultVisible: true,
  },
  {
    key: 'form',
    label: 'VIP Boarding Pass & Form',
    khLabel: 'សំបុត្រឡើងយន្តហោះ VIP & ទម្រង់បែបបទ',
    description: 'Live interactive VIP boarding pass preview synced with instant seat reservation form.',
    category: 'conversion',
    icon: 'FileText',
    tabId: 'form',
    defaultVisible: true,
  },
  {
    key: 'faqs',
    label: 'Frequently Asked Questions',
    khLabel: 'សំណួរដែលសួរញឹកញាប់',
    description: 'Accordions addressing visa-free entry, corporate billing, single rooms, and payment terms.',
    category: 'proof',
    icon: 'HelpCircle',
    tabId: 'faqs',
    defaultVisible: true,
  },
];

export const DEFAULT_SECTION_ORDER = [
  'hero',
  'urgency',
  'coreValues',
  'highlights',
  'problems',
  'audiences',
  'matchmaker',
  'speakers',
  'artists',
  'valueStack',
  'itinerary',
  'gallery',
  'expoBooths',
  'testimonials',
  'packages',
  'guarantee',
  'form',
  'faqs',
];

export const B2B_DELEGATION_ORDER = [
  'hero',
  'urgency',
  'coreValues',
  'highlights',
  'problems',
  'audiences',
  'matchmaker',
  'valueStack',
  'itinerary',
  'gallery',
  'testimonials',
  'packages',
  'guarantee',
  'form',
  'faqs',
];

export const TRADE_EXPO_ORDER = [
  'hero',
  'highlights',
  'expoBooths',
  'speakers',
  'itinerary',
  'gallery',
  'packages',
  'testimonials',
  'form',
  'faqs',
];

export const CORPORATE_SUMMIT_ORDER = [
  'hero',
  'urgency',
  'speakers',
  'highlights',
  'itinerary',
  'packages',
  'testimonials',
  'guarantee',
  'form',
  'faqs',
];

export const CONCERT_FESTIVAL_ORDER = [
  'hero',
  'urgency',
  'artists',
  'gallery',
  'packages',
  'testimonials',
  'faqs',
  'form',
];

export const MINIMAL_LEAD_ORDER = [
  'hero',
  'urgency',
  'highlights',
  'packages',
  'form',
  'faqs',
];

export type PageTemplateType = 
  | "b2b-delegation" 
  | "trade-expo" 
  | "concert-festival" 
  | "corporate-summit" 
  | "custom";

export interface ExpoBoothTier {
  id: string;
  name: string;
  size: string;
  price: string;
  location?: string;
  availableCount?: number;
  totalCount?: number;
  popular?: boolean;
  features: string[];
  ctaText?: string;
}

export interface ArtistItem {
  id: string;
  name: string;
  role: string;
  genre?: string;
  image?: string;
  stageName?: string;
  stageTime?: string;
  bio?: string;
}

export interface SpeakerItem {
  id: string;
  name: string;
  title: string;
  organization: string;
  avatar?: string;
  topic?: string;
  track?: string;
  sessionTime?: string;
}

export interface LandingPageTranslation {
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  heroCtaText?: string;
  venue?: string;
  urgencyNotice?: string;
  urgencyRiskNote?: string;
  coreValues?: CoreValueItem[];
  problems?: ProblemItem[];
  audiences?: AudienceItem[];
  itinerary?: ItineraryDay[];
  valueStack?: ValueStackConfig;
  guarantee?: GuaranteeConfig;
  faqs?: FaqItem[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface ExternalTrackingConfig {
  facebookPixelId?: string;
  facebookPixelEnabled?: boolean;
  gtmContainerId?: string;
  gtmEnabled?: boolean;
  ga4MeasurementId?: string;
  ga4Enabled?: boolean;
  tiktokPixelId?: string;
  tiktokPixelEnabled?: boolean;
  customHeadScript?: string;
  customBodyScript?: string;
}

export type TrackingEventType = 
  | 'page_view'
  | 'scroll_depth'
  | 'cta_click'
  | 'telegram_click'
  | 'seat_select'
  | 'form_submit'
  | 'lang_toggle';

export interface TrackingEvent {
  id: string;
  pageSlug: string;
  sessionId: string;
  eventType: TrackingEventType;
  eventData?: Record<string, unknown>;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  os?: string;
  lang?: 'en' | 'kh';
  timestamp: string;
}

export interface PageAnalyticsSummary {
  pageSlug: string;
  totalViews: number;
  uniqueVisitors: number;
  totalLeads: number;
  conversionRate: number;
  funnel: {
    views: number;
    scrolled50: number;
    clickedCta: number;
    telegramClicks: number;
    leadsSubmitted: number;
  };
  topSources: Array<{ source: string; count: number; percentage: number }>;
  topCampaigns: Array<{ campaign: string; count: number }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  languageBreakdown: {
    en: number;
    kh: number;
  };
  recentEvents: TrackingEvent[];
}

export interface IsolatedPageSettings {
  // 1. Dedicated Communications & Support
  phone?: string;
  whatsapp?: string;
  whatsappNumber?: string;
  telegramUsername?: string;
  telegramUrl?: string;
  coordinatorName?: string;
  coordinatorAvatar?: string;
  coordinatorRole?: string;
  email?: string;

  // 2. Lead Routing & Notifications
  telegramBotToken?: string;
  telegramChatId?: string;
  enableTelegramAlerts?: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  leadTags?: string[];

  // 3. Post-Conversion & Form Actions
  postSubmitAction?: 'inline' | 'redirect';
  redirectUrl?: string;
  customSuccessHeadline?: string;
  customSuccessMessage?: string;
  customThankYouMessage?: string;
  isSoldOut?: boolean;
  soldOutMessage?: string;
  soldOutAction?: 'waitlist' | 'sold_out_badge' | 'redirect';
  soldOutRedirectUrl?: string;

  // 4. Branding, Theming & Sponsorship
  accentColor?: string;
  partnerName?: string;
  partnerLogo?: string;
  coBrandingText?: string;
  customNavbarCtaText?: string;
  customNavbarCtaLink?: string;
  customFooterText?: string;
  customCtaText?: string;

  // 5. Access Control & Privacy
  accessProtection?: 'public' | 'password';
  accessPassword?: string;
  passwordPin?: string;
  searchEngineIndexing?: 'index' | 'noindex' | boolean;

  // 6. Payment & Invoicing
  paymentMethods?: Array<'khqr' | 'bank_transfer' | 'invoice' | 'cash' | 'card'>;
  acceptedPaymentMethods?: Array<'khqr' | 'bank_transfer' | 'cash' | 'card'>;
  paymentInstructions?: string;
  khqrQrImage?: string;
  khqrImageUrl?: string;
  bankAccountDetails?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;

  // 7. Round Robin & Sales Routing Override
  useCustomRoundRobin?: boolean;
  customRoundRobin?: RoundRobinSettings;
}

export interface LandingPage {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  badge?: string;
  template?: PageTemplateType;
  status: PageStatus;
  
  // Multilingual translations (e.g. kh for Khmer)
  translations?: {
    kh?: LandingPageTranslation;
    [langCode: string]: LandingPageTranslation | undefined;
  };
  
  // Third-Party and Internal Tracking Configuration
  tracking?: ExternalTrackingConfig;

  // Isolated Campaign Settings
  isolatedSettings?: IsolatedPageSettings;
  
  // Hero section
  heroHeadline: string;
  heroSubheadline: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroImage?: string;
  videoUrl?: string;

  // Event specific attributes (optional)
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  venueAddress?: string;
  countdownEnabled?: boolean;

  // Quota & Urgency
  urgency?: UrgencyConfig;

  // Section visibility toggles & dynamic ordering
  sectionVisibility?: SectionVisibility;
  sectionOrder?: string[];

  // Structured content sections
  highlights: HighlightItem[];
  coreValues?: CoreValueItem[];
  problems?: ProblemItem[];
  audiences?: AudienceItem[];
  itinerary?: ItineraryDay[];
  valueStack?: ValueStackConfig;
  packages: PackageTier[];
  gallery: string[];
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  guarantee?: GuaranteeConfig;
  expoBooths?: ExpoBoothTier[];
  artists?: ArtistItem[];
  speakers?: SpeakerItem[];
  formConfig: FormConfig;

  // SEO & Social
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;

  // Analytics counters
  viewsCount: number;
  leadsCount: number;

  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = "NEW" | "CONTACTED" | "PROPOSAL_SENT" | "NEGOTIATING" | "WON" | "LOST";

export interface LeadNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  landingPageId?: string;
  landingPageSlug: string;
  landingPageTitle: string;

  fullName: string;
  email: string;
  phone: string;
  company?: string;
  
  eventType: string;
  estimatedDate?: string;
  guestCount?: string;
  budgetRange?: string;
  packageInterest?: string;
  message?: string;

  customFields?: Record<string, string>;

  status: LeadStatus;
  notes: LeadNote[];

  // Marketing attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
  tags?: string[];
  ip?: string;
  userAgent?: string;

  // Round Robin distribution detail
  routing?: RoutingDetail;

  createdAt: string;
  updatedAt: string;
}

export type UserRole = "owner" | "super_admin" | "admin" | "client";

export interface SystemSettings {
  companyName: string;
  brandTagline: string;
  phone: string;
  whatsappNumber: string;
  telegramUsername: string;
  email: string;
  address: string;
  googleMapsUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  
  // Notifications
  telegramBotToken?: string;
  telegramChatId?: string;
  enableTelegramAlerts: boolean;

  // Global Staff Round Robin System
  roundRobinSettings?: RoundRobinSettings;

  // Admin & Owner auth
  ownerEmail?: string;
  adminEmail: string;
  adminPasswordHash: string;
}

export interface DatabaseSchema {
  pages: LandingPage[];
  leads: Lead[];
  settings: SystemSettings;
  pageViews: Array<{
    pageSlug: string;
    timestamp: string;
    referrer?: string;
    sessionId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    deviceType?: string;
    lang?: string;
  }>;
  trackingEvents?: TrackingEvent[];
  roundRobinLogs?: RoundRobinLog[];
  // Tombstones (`id:<id>` / `slug:<slug>`) so deleted pages are not re-seeded from the bundled db.json.
  deletedPages?: string[];
  // Fingerprint of the bot token whose webhook was registered with a secret token.
  telegramWebhookSecuredFor?: string;
  // Leads whose Supabase insert failed; shown in the CRM and retried until they sync.
  unsyncedLeadIds?: string[];
}

export interface RoundRobinStaff {
  id: string;
  name: string;
  title?: string;
  telegramUsername: string; // e.g. "sokhachen_khb" (without @)
  telegramChatId: string; // Numeric Chat ID for private bot delivery, e.g. "123456789"
  percentage: number; // Configured percentage weight (e.g. 20)
  isActive: boolean; // Active receiving status
  phone?: string;
  email?: string;
  avatar?: string;
  notes?: string;
  preferredLanguage?: 'km' | 'en' | 'compact'; // Preferred alert language for this staff member
  
  // Real-time tracking counters
  totalLeadsRouted: number;
  totalDirectClicks: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  lastAssignedAt?: string;
}

export type RoundRobinAlgorithm = 'weighted_percentage' | 'strict_round_robin' | 'random_weighted';

export interface RoundRobinSettings {
  enabled: boolean;
  algorithm: RoundRobinAlgorithm;
  staffList: RoundRobinStaff[];
  fallbackChatId?: string; // Fallback manager Telegram Chat ID if staff send fails
  enableManagerNotification?: boolean; // Send CC copy to manager group
  managerChatId?: string;
  directContactRoutingEnabled?: boolean; // Route landing page "Chat on Telegram" clicks
  lastAssignedIndex?: number;
  lastUpdated?: string;
  customMessageTemplate?: string; // Customizable template for staff Telegram alerts
  customWhatsappMessage?: string; // Customizable pre-filled WhatsApp greeting text
}

export type RoutingDeliveryStatus = 'DELIVERED' | 'FAILED' | 'FALLBACK' | 'PENDING';

export interface RoutingDetail {
  staffId: string;
  staffName: string;
  staffTelegram: string;
  staffChatId?: string;
  percentageWeight: number;
  status: RoutingDeliveryStatus;
  telegramMessageId?: number;
  telegramResponse?: string;
  deliveryError?: string;
  fallbackChatId?: string;
  fallbackSent?: boolean;
  routedAt: string;
  routeType: 'FORM_SUBMISSION' | 'DIRECT_CONTACT_CLICK';
}

export interface RoundRobinLog {
  id: string;
  timestamp: string;
  routeType: 'FORM_SUBMISSION' | 'DIRECT_CONTACT_CLICK';
  pageSlug: string;
  pageTitle?: string;
  leadId?: string;
  clientName?: string;
  clientPhone?: string;
  clientCompany?: string;
  staffId: string;
  staffName: string;
  staffTelegram: string;
  staffChatId?: string;
  percentageWeight: number;
  status: RoutingDeliveryStatus;
  telegramMessageId?: number;
  deliveryError?: string;
  targetTelegramUrl?: string;
  visitorIp?: string;
  userAgent?: string;
}
