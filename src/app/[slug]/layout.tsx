import type { ReactNode } from 'react';
import { getPublicSettings } from '@/lib/storage';
import { Ga4Tag } from '@/components/common/GoogleAnalytics';

/** Every landing page (and its app, opt-in and print views) loads the site-wide Google Analytics ID. */
export default async function LandingLayout({ children }: { children: ReactNode }) {
  const settings = await getPublicSettings().catch(() => null);
  return (
    <>
      <Ga4Tag id={settings?.ga4MeasurementId} />
      {children}
    </>
  );
}
