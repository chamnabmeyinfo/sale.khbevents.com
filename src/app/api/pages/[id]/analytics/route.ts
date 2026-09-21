import { NextRequest, NextResponse } from 'next/server';
import { getPageById, getPageBySlug, getPageAnalytics } from '@/lib/storage';
import { isAuthenticated } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  let page = await getPageById(id);
  if (!page) {
    page = await getPageBySlug(id);
  }

  if (!page) {
    return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
  }

  const analytics = await getPageAnalytics(page.slug);
  return NextResponse.json({ success: true, analytics, pageTitle: page.title, pageSlug: page.slug });
}
