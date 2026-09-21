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
  problems?: boolean;
  audiences?: boolean;
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
  eventData?: Record<string, any>;
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

  // Section visibility toggles
  sectionVisibility?: SectionVisibility;

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
}
