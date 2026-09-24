import { notFound } from 'next/navigation';
import { getPublicSettings, getActivePopupAds } from '@/lib/storage';
import { loadPublicPage } from '@/lib/page-access';
import PageLockScreen from '@/components/common/PageLockScreen';
import DynamicLandingPageView from '@/components/landing/DynamicLandingPageView';
import SmartCityLandingPageView from '@/components/landing/SmartCityLandingPageView';
import SmartCityAppView from '@/components/landing/SmartCityAppView';
import SmartCityOptinView from '@/components/landing/SmartCityOptinView';
import BuilderPageView from '@/components/builder/BuilderPageView';
import { normalizeBuilderDoc } from '@/lib/builder';
import { serverNowMs } from '@/lib/popup-ads';
import { Metadata } from 'next';
import type { LandingPage } from '@/lib/types';

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
  const access = await loadPublicPage(cleanSlug);
  const settings = await getPublicSettings();
  if (access.kind === 'locked') {
    // Only what the lock screen shows; keep locked content out of link previews.
    return { title: `${access.stub.title} | ${settings.companyName}`, robots: { index: false, follow: false } };
  }
  const page = access.kind === 'ok' ? access.page : null;

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
        images: ['/images/events/photo_2026-09-16_22-01-09 (2).jpg']
      }
    };
  }

  if (!page || page.status !== 'published') {
    return {
      title: `Page Not Found | ${settings.companyName}`
    };
  }

  const khTrans = isKh ? page.translations?.kh : undefined;
  const title = (khTrans?.metaTitle || khTrans?.title) || page.metaTitle || `${page.title} | ${settings.companyName}`;
  const description = (khTrans?.metaDescription || khTrans?.description) || page.metaDescription || page.description;

  const isNoIndex = page.isolatedSettings?.searchEngineIndexing === 'noindex' || page.isolatedSettings?.accessProtection === 'password';

  return {
    title,
    description,
    robots: isNoIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      images: [page.ogImage || page.heroImage || '/images/events/photo_2026-09-16_22-01-09 (2).jpg']
    }
  };
}

export default async function CampaignPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();
  const sp = searchParams ? await searchParams : {};
  const view = typeof sp.view === 'string' ? sp.view.toLowerCase() : '';
  const initialLang: 'en' | 'kh' = sp.lang === 'kh' ? 'kh' : 'en';
  const result = await loadPublicPage(cleanSlug);
  if (result.kind === 'not_found') notFound();
  if (result.kind === 'locked') return <PageLockScreen page={result.stub} />;
  const page = result.page;
  const settings = await getPublicSettings();
  const popupPreviewId = typeof sp.popup_preview === 'string' ? sp.popup_preview : undefined;
  const popupAds = await getActivePopupAds(cleanSlug, popupPreviewId);
  const popupProps = { popupAds, popupPreviewId };

  // Pages made with the drag-and-drop builder render their own components.
  if (page?.template === 'builder' && page.builder) {
    const builderLang = sp.lang === 'kh' || sp.lang === 'en' ? sp.lang : normalizeBuilderDoc(page.builder).defaultLang || 'en';
    // Send the browser only what a builder page uses: the rest of the record (form and
    // contact settings, old template copy) is admin data, not page content.
    const publicPage = {
      id: page.id,
      slug: page.slug,
      title: page.title,
      category: page.category,
      status: page.status,
      template: page.template,
      tracking: page.tracking,
      builder: page.builder,
    } as LandingPage;
    return <BuilderPageView page={publicPage} initialLang={builderLang} serverNowMs={serverNowMs()} {...popupProps} />;
  }

  if (cleanSlug === 'smart-city-tea-cafe') {
    if (view === 'app') {
      return <SmartCityAppView page={page || undefined} settings={settings} initialLang={initialLang} {...popupProps} />;
    }
    if (view === 'optin') {
      return <SmartCityOptinView page={page || undefined} settings={settings} initialLang={initialLang} {...popupProps} />;
    }
    // If the template was customized to something other than b2b-delegation, render with template engine
    if (page?.template && page.template !== 'b2b-delegation') {
      return <DynamicLandingPageView page={page} settings={settings} {...popupProps} />;
    }
    return <SmartCityLandingPageView page={page || undefined} settings={settings} initialLang={initialLang} {...popupProps} />;
  }

  if (!page) {
    notFound();
  }

  return <DynamicLandingPageView page={page} settings={settings} {...popupProps} />;
}
