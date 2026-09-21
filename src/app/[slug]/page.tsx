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

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();
  const sp = searchParams ? await searchParams : {};
  const isKh = sp.lang === 'kh';
  const page = await getPageBySlug(cleanSlug);
  const settings = await getSettings();

  if (cleanSlug === 'smart-city-tea-cafe' && !page) {
    return {
      title: isKh ? 'គណៈប្រតិភូធុរកិច្ច Smart City, Tea & Cafe ២០២៦ | KHB EVENTS' : 'Smart City, Tea & Cafe Business Delegation 2026 | KHB EVENTS',
      description: isKh 
        ? 'ចូលរួមគណៈប្រតិភូធុរកិច្ច B2B ផ្តាច់មុខទៅកាន់ទីក្រុងហាណូយ និងឈូងសមុទ្រហាឡុង ប្រទេសវៀតណាម។ ទស្សនា Cafe Show Vietnam & Smart City Expo និងជួបដៃគូផ្គត់ផ្គង់ផ្ទាល់។'
        : 'Join the exclusive B2B Business Delegation to Hanoi and Halong Bay, Vietnam. Explore Cafe Show Vietnam & Smart City Expo, direct factory visits, and business matchmaking. Organized by KHB EVENTS.',
      openGraph: {
        title: isKh ? 'ដំណើរកម្សាន្តធុរកិច្ច Smart City, Tea & Cafe ទៅវៀតណាម ២០២៦ | KHB EVENTS' : 'Smart City, Tea & Cafe Business Trip to Vietnam 2026 | KHB EVENTS',
        description: isKh
          ? 'ដំណើរធុរកិច្ច B2B ផ្តាច់មុខ៖ ពិព័រណ៍អន្តរជាតិ ២, ទស្សនកិច្ចរោងចក្រផ្ទាល់, B2B Matching & កប៉ាល់ UNESCO ហាឡុងបេ។ ៨-១១ តុលា ២០២៦។ Early Bird $499។'
          : 'Exclusive B2B Trip to Vietnam: 2 Major Expos, Factory Visits, Business Matching & Halong Bay UNESCO Cruise. Oct 8-11, 2026. Early Bird $499.',
        images: ['/photos/photo_2026-09-16_22-01-09 (2).jpg']
      }
    };
  }

  if (!page) {
    return {
      title: `Page Not Found | ${settings.companyName}`
    };
  }

  const khTrans = isKh ? page.translations?.kh : undefined;
  const title = (khTrans?.metaTitle || khTrans?.title) || page.metaTitle || `${page.title} | ${settings.companyName}`;
  const description = (khTrans?.metaDescription || khTrans?.description) || page.metaDescription || page.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [page.ogImage || page.heroImage || '/photos/photo_2026-09-16_22-01-09 (2).jpg']
    }
  };
}

export default async function CampaignPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();
  const sp = searchParams ? await searchParams : {};
  const view = typeof sp.view === 'string' ? sp.view.toLowerCase() : '';
  const initialLang: 'en' | 'kh' = sp.lang === 'kh' ? 'kh' : 'en';
  const settings = await getSettings();
  const page = await getPageBySlug(cleanSlug);

  if (cleanSlug === 'smart-city-tea-cafe') {
    if (view === 'app') {
      return <SmartCityAppView page={page || undefined} settings={settings} initialLang={initialLang} />;
    }
    if (view === 'optin') {
      return <SmartCityOptinView page={page || undefined} settings={settings} initialLang={initialLang} />;
    }
    // If the template was customized to something other than b2b-delegation, render with template engine
    if (page?.template && page.template !== 'b2b-delegation') {
      return <DynamicLandingPageView page={page} settings={settings} />;
    }
    return <SmartCityLandingPageView page={page || undefined} settings={settings} initialLang={initialLang} />;
  }

  if (!page || page.status === 'archived') {
    notFound();
  }

  return <DynamicLandingPageView page={page} settings={settings} />;
}
