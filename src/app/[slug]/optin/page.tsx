import SmartCityOptinView from '@/components/landing/SmartCityOptinView';
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
      title: 'Reserve Your Seat | Smart City, Tea & Cafe Delegation 2026',
      description: '30-seat executive delegation. No payment today — reserve with just your name and phone.',
    };
  }
  return { title: 'Fast Opt-in | KHB EVENTS' };
}

export default async function SlugOptinPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();
  if (cleanSlug !== 'smart-city-tea-cafe') {
    notFound();
  }
  const sp = searchParams ? await searchParams : {};
  const initialLang: 'en' | 'kh' = sp.lang === 'kh' ? 'kh' : 'en';
  const page = await getPageBySlug(cleanSlug);
  const settings = await getPublicSettings();

  return <SmartCityOptinView page={page || undefined} settings={settings} initialLang={initialLang} />;
}

