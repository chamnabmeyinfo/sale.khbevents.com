import { notFound } from 'next/navigation';
import { getPageBySlug, getSettings } from '@/lib/storage';
import DynamicLandingPageView from '@/components/landing/DynamicLandingPageView';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  const settings = await getSettings();

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
      images: [page.ogImage || page.heroImage || '/images/events/photo_2026-09-16_22-01-09.jpg']
    }
  };
}

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  const settings = await getSettings();

  if (!page || page.status === 'archived') {
    notFound();
  }

  return <DynamicLandingPageView page={page} settings={settings} />;
}
