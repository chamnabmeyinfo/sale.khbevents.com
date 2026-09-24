import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAuthenticated } from '@/lib/auth';
import MediaLibraryPageClient from '@/components/admin/MediaLibraryPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Photo Library | KHB Portal',
};

export default async function AdminMediaPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');
  return <MediaLibraryPageClient />;
}
