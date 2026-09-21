import { notFound } from 'next/navigation';
import { getPageBySlug, getSettings } from '@/lib/storage';
import DynamicLandingPageView from '@/components/landing/DynamicLandingPageView';
import SmartCityLandingPageView from '@/components/landing/SmartCityLandingPageView';
import SmartCityAppView from '@/components/landing/SmartCityAppView';
import SmartCityOptinView from '@/components/landing/SmartCityOptinView';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();
  const page = await getPageBySlug(cleanSlug);
  const settings = await getSettings();

  if (cleanSlug === 'smart-city-tea-cafe' && !page) {
    return {
      title: 'Smart City, Tea & Cafe Business Delegation 2026 | KHB EVENTS',
      description: 'Join the exclusive B2B Business Delegation to Hanoi and Halong Bay, Vietnam. Explore Cafe Show Vietnam & Smart City Expo, direct factory visits, and business matchmaking. Organized by KHB EVENTS.',
      openGraph: {
        title: 'Smart City, Tea & Cafe Business Trip to Vietnam 2026 | KHB EVENTS',
        description: 'Exclusive B2B Trip to Vietnam: 2 Major Expos, Factory Visits, Business Matching & Halong Bay UNESCO Cruise. Oct 8-11, 2026. Early Bird $499.',
        images: ['/photos/photo_2026-09-16_22-01-09 (2).jpg']
      }
    };
  }

  if (!page) {
    return {
      title: `Page Not Found | ${settings.companyName}`
    };
  }

  return {
    title: page.metaTitle || `${page.title} | ${settings.companyName}`,
    description: page.metaDescription || page.description,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.description,
      images: [page.ogImage || page.heroImage || '/photos/photo_2026-09-16_22-01-09 (2).jpg']
    }
  };
}

export default async function CampaignPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();
  const sp = searchParams ? await searchParams : {};
  const view = typeof sp.view === 'string' ? sp.view.toLowerCase() : '';
  const settings = await getSettings();
  const page = await getPageBySlug(cleanSlug);

  if (cleanSlug === 'smart-city-tea-cafe') {
    if (view === 'app') {
      return <SmartCityAppView page={page || undefined} settings={settings} />;
    }
    if (view === 'optin') {
      return <SmartCityOptinView page={page || undefined} settings={settings} />;
    }
    // If the template was customized to something other than b2b-delegation, render with template engine
    if (page?.template && page.template !== 'b2b-delegation') {
      return <DynamicLandingPageView page={page} settings={settings} />;
    }
    return <SmartCityLandingPageView page={page || undefined} settings={settings} />;
  }

  if (!page || page.status === 'archived') {
    notFound();
  }

  return <DynamicLandingPageView page={page} settings={settings} />;
}
