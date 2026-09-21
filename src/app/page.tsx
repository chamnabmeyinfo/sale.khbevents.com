import { getPages, getSettings } from '@/lib/storage';
import MainSalesView from '@/components/landing/MainSalesView';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `${settings.companyName} | Premium Event Management & Production in Cambodia`,
    description: settings.brandTagline || 'Turnkey 4K LED staging, audio-visual engineering, corporate gala dinners, concert production and exhibition booths across Cambodia.',
    openGraph: {
      title: `${settings.companyName} | Turnkey Event Management & Production`,
      description: settings.brandTagline,
      images: ['/images/events/photo_2026-09-16_22-01-09.jpg']
    }
  };
}

export default async function HomePage() {
  const pages = await getPages();
  const settings = await getSettings();

  return <MainSalesView pages={pages} settings={settings} />;
}
