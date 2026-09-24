import { redirect, notFound } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getPageById, getPageAnalytics } from '@/lib/storage';
import PageAnalyticsClient from '@/components/admin/PageAnalyticsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PageAnalyticsDashboard({ params }: PageProps) {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  const { id } = await params;
  const page = await getPageById(id);

  if (!page) {
    notFound();
  }

  const analytics = await getPageAnalytics(page.slug);

  return <PageAnalyticsClient page={page} analytics={analytics} />;
}
