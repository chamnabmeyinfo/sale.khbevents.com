import React from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Metadata } from 'next';
import { getPublicSettings } from '@/lib/storage';
import { companyFor } from '@/lib/company';

// The logo comes from the settings, so even the login page is rendered per request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'KHB Events Portal | Admin CMS & CRM',
  description: 'Landing page system and lead management for sale.khbevents.com'
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const logo = companyFor(await getPublicSettings().catch(() => undefined)).logo;
  return <AdminShell logo={logo}>{children}</AdminShell>;
}
