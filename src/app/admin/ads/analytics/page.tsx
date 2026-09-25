import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAuthenticated } from '@/lib/auth';
import { getPages, getPopupAdStats, getPopupAds } from '@/lib/storage';
import { HOME_SLUG, serverNowMs } from '@/lib/popup-ads';
import PopupAnalyticsClient from '@/components/admin/PopupAnalyticsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Popup analytics | KHB Portal',
};

export default async function PopupAnalyticsPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  const [state, stats, pages] = await Promise.all([getPopupAds(true), getPopupAdStats(), getPages()]);
  const ads = state.ads.map((a) => ({ id: a.id, name: a.name, enabled: a.enabled }));
  const titles = [{ slug: HOME_SLUG, title: 'Home page (/)' }, ...pages.map((p) => ({ slug: p.slug, title: p.title }))];

  return <PopupAnalyticsClient ads={ads} stats={stats} pages={titles} nowMs={serverNowMs()} />;
}
