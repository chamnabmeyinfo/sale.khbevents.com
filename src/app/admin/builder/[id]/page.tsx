import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAuthenticated } from '@/lib/auth';
import { getPageById } from '@/lib/storage';
import { defaultBuilderDoc, normalizeBuilderDoc } from '@/lib/builder';
import BuilderEditorClient from '@/components/admin/BuilderEditorClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Page Builder | KHB Portal',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BuilderEditorPage({ params }: PageProps) {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  const { id } = await params;
  const page = await getPageById(id);
  if (!page) notFound();
  // Pages made with the classic editor keep using it.
  if (page.template !== 'builder') redirect(`/admin/pages/${page.id}`);

  const doc = page.builder ? normalizeBuilderDoc(page.builder) : defaultBuilderDoc();
  return <BuilderEditorClient initialPage={page} initialDoc={doc} />;
}
