import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPageById, savePage, deletePage, PageConflictError, PageSlugError } from '@/lib/storage';
import { isAuthenticated, requireAdmin } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const page = await getPageById(id);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  return NextResponse.json({ page });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.slug) {
    return NextResponse.json({ error: 'Title and Slug are required' }, { status: 400 });
  }

  // The version the editor opened; a page saved elsewhere since is not overwritten.
  const { expectedUpdatedAt, ...pageData } = body;
  let saved;
  try {
    saved = await savePage({ ...pageData, id }, { expectedUpdatedAt: typeof expectedUpdatedAt === 'string' ? expectedUpdatedAt : undefined });
  } catch (error) {
    if (error instanceof PageSlugError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof PageConflictError) {
      return NextResponse.json({ error: error.message, conflict: true, currentUpdatedAt: error.currentUpdatedAt }, { status: 409 });
    }
    console.error('Update page error:', error);
    return NextResponse.json({ error: 'Could not save: the database did not answer. Nothing was changed; try again.' }, { status: 500 });
  }

  try {
    revalidatePath(`/${saved.slug}`);
    revalidatePath(`/${saved.slug}/app`);
    revalidatePath(`/${saved.slug}/optin`);
    revalidatePath('/smart-city-tea-cafe');
    revalidatePath('/[slug]', 'page');
    revalidatePath('/');
  } catch (err) {
    console.warn('Revalidation notice:', err);
  }

  return NextResponse.json({ success: true, page: saved });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const page = await getPageById(id);
  const deleted = await deletePage(id);
  if (!deleted) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  if (page) {
    try {
      revalidatePath(`/${page.slug}`);
      revalidatePath('/[slug]', 'page');
      revalidatePath('/');
    } catch {}
  }

  return NextResponse.json({ success: true });
}
