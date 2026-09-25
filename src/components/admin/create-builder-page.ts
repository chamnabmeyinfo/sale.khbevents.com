import { defaultBuilderDoc } from '@/lib/builder';

/**
 * Every new page is a drag-and-drop builder page: one editor for all pages.
 * Creates a draft and returns its id (the caller opens /admin/builder/<id>).
 */
export async function createBuilderPage(title: string): Promise<string> {
  const suffix = Date.now().toString(36).slice(-5);
  const res = await fetch('/api/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      slug: `new-page-${suffix}`,
      status: 'draft',
      template: 'builder',
      category: 'General',
      testimonials: [],
      builder: defaultBuilderDoc(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.page?.id) throw new Error(data.error || 'Could not create the page');
  return data.page.id as string;
}
