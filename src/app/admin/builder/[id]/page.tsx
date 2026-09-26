import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAuthenticated } from '@/lib/auth';
import { getPageById, getPublicSettings } from '@/lib/storage';
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
  const s = await getPublicSettings();
  // The company details the page falls back to (Settings → Company), for the editor's placeholders and preview.
  const companySettings = { companyName: s.companyName, brandTagline: s.brandTagline, logoUrl: s.logoUrl, phone: s.phone, whatsappNumber: s.whatsappNumber, telegramUsername: s.telegramUsername, email: s.email, address: s.address };
  return <BuilderEditorClient initialPage={page} initialDoc={doc} companySettings={companySettings} />;
}
