import { redirect, notFound } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getPageById } from '@/lib/storage';
import PageEditor from '@/components/admin/PageEditor';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLandingPage({ params }: PageProps) {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  const { id } = await params;
  const page = await getPageById(id);

  if (!page) {
    notFound();
  }

  return <PageEditor initialData={page} isNew={false} />;
}
