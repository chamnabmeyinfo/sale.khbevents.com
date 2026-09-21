import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import PageEditor from '@/components/admin/PageEditor';

export const dynamic = 'force-dynamic';

export default async function NewLandingPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  return <PageEditor isNew={true} />;
}
