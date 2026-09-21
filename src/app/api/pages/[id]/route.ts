import { NextRequest, NextResponse } from 'next/server';
import { getPageById, savePage, deletePage } from '@/lib/storage';
import { isAuthenticated } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const page = await getPageById(id);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  return NextResponse.json({ page });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();

  const saved = await savePage({ ...body, id });
  return NextResponse.json({ success: true, page: saved });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const deleted = await deletePage(id);
  if (!deleted) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
