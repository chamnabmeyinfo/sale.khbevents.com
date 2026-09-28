import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isAuthenticated } from '@/lib/auth';
import { getPageById } from '@/lib/storage';
import { adPackageView } from '@/lib/gen-ads';
import GenAdsClient from '@/components/admin/GenAdsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gen Ads | KHB Portal',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Admin → Landing Pages CMS → Gen Ads: the ads package of one page. */
export default async function GenAdsPage({ params }: PageProps) {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');
  const { id } = await params;
  const page = await getPageById(id);
  if (!page) notFound();
  const view = await adPackageView(page);
  return <GenAdsClient page={{ id: page.id, slug: page.slug, title: page.title, status: page.status, template: page.template }} initial={view} />;
}
