import React from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KHB Events Portal | Admin CMS & CRM',
  description: 'Landing page system and lead management for sale.khbevents.com'
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
