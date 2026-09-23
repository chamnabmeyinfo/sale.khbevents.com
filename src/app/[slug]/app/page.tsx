import SmartCityAppView from '@/components/landing/SmartCityAppView';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPageBySlug, getPublicSettings } from '@/lib/storage';

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
  const page = await getPageBySlug(cleanSlug);
  const settings = await getPublicSettings();

  return <SmartCityAppView page={page || undefined} settings={settings} initialLang={initialLang} />;
}

