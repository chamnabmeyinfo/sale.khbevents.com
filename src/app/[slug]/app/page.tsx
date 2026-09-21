import SmartCityAppView from '@/components/landing/SmartCityAppView';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
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

export default async function SlugAppPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug.toLowerCase().trim() !== 'smart-city-tea-cafe') {
    notFound();
  }
  return <SmartCityAppView />;
}
