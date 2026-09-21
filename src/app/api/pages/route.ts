import { NextRequest, NextResponse } from 'next/server';
import { getPages, savePage } from '@/lib/storage';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  const pages = await getPages();
  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Title and Slug are required' }, { status: 400 });
    }

    const saved = await savePage(body);
    return NextResponse.json({ success: true, page: saved });
  } catch (error) {
    console.error('Save page error:', error);
    return NextResponse.json({ error: 'Failed to save landing page' }, { status: 500 });
  }
}
