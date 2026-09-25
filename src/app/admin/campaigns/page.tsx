import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAuthenticated } from '@/lib/auth';
import { getPages } from '@/lib/storage';
import CampaignsClient from '@/components/admin/campaigns/CampaignsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Campaigns | KHB Portal',
};

export default async function CampaignsPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');
  const pages = (await getPages()).filter((p) => p.status !== 'archived').map((p) => ({ slug: p.slug, title: p.title, id: p.id }));
  return <CampaignsClient pages={pages} />;
}
