import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import NewBuilderPage from '@/components/admin/NewBuilderPage';

export const dynamic = 'force-dynamic';

/** Every new page is a drag-and-drop builder page. */
export default async function NewLandingPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  return <NewBuilderPage />;
}
