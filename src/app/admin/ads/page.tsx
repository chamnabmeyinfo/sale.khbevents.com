import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAuthenticated } from '@/lib/auth';
import { getPages, getPopupAdStats, getPopupAds } from '@/lib/storage';
import { HOME_SLUG, serverNowMs } from '@/lib/popup-ads';
import AdsManagerClient from '@/components/admin/AdsManagerClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ads & Popups | KHB Portal',
};

export default async function AdminAdsPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  const [state, stats, pages] = await Promise.all([getPopupAds(true), getPopupAdStats(), getPages()]);
  const targets = [
    { slug: HOME_SLUG, title: 'Home page (/)' },
    ...pages.map((p) => ({ slug: p.slug, title: `${p.title} (/${p.slug})` })),
  ];

  return <AdsManagerClient initialState={state} initialStats={stats} pages={targets} nowMs={serverNowMs()} />;
}
