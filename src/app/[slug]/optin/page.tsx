import SmartCityOptinView from '@/components/landing/SmartCityOptinView';
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
      title: 'Reserve Your Seat | Smart City, Tea & Cafe Delegation 2026',
      description: '30-seat executive delegation. No payment today — reserve with just your name and phone.',
    };
  }
  return { title: 'Fast Opt-in | KHB EVENTS' };
}

export default async function SlugOptinPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug.toLowerCase().trim() !== 'smart-city-tea-cafe') {
    notFound();
  }
  return <SmartCityOptinView />;
}
