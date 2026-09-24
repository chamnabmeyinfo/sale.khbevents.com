import SmartCityAppView from '@/components/landing/SmartCityAppView';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getActivePopupAds, getPublicSettings } from '@/lib/storage';
import { loadPublicPage } from '@/lib/page-access';
import PageLockScreen from '@/components/common/PageLockScreen';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug.toLowerCase().trim() === 'smart-city-tea-cafe') {
    return {
      title: 'KHB Business Trip App — Vietnam Delegation 2026',
      description: 'Book your seat for the Smart City, Tea & Cafe Business Delegation to Vietnam. Fast mobile booking experience by KHB EVENTS.',
    };
  }
  return { title: 'App View | KHB EVENTS' };
}

export default async function SlugAppPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();
  if (cleanSlug !== 'smart-city-tea-cafe') {
    notFound();
  }
  const sp = searchParams ? await searchParams : {};
  const initialLang: 'en' | 'kh' = sp.lang === 'kh' ? 'kh' : 'en';
  const result = await loadPublicPage(cleanSlug);
  if (result.kind === 'not_found') notFound();
  if (result.kind === 'locked') return <PageLockScreen page={result.stub} />;
  const page = result.page;
  const settings = await getPublicSettings();
  const popupPreviewId = typeof sp.popup_preview === 'string' ? sp.popup_preview : undefined;
  const popupAds = await getActivePopupAds(cleanSlug, popupPreviewId);

  return <SmartCityAppView page={page || undefined} settings={settings} initialLang={initialLang} popupAds={popupAds} popupPreviewId={popupPreviewId} />;
}

