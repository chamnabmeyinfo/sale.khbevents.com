import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { getLeadById } from '@/lib/storage';
import { buildLeadStory, storyFileName } from '@/lib/lead-story';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The customer's story as Markdown: profile, clicks, the stored Telegram
 * conversation (voice messages as text), notes and numbers. `?download=1` sends
 * it as a .md file. Admin only.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const story = await buildLeadStory(id);
    if (!story) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    if (new URL(req.url).searchParams.get('download') === '1') {
      const lead = await getLeadById(id);
      return new NextResponse(story.markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${storyFileName(lead || { fullName: 'customer', id })}"`,
          'Cache-Control': 'no-store',
        },
      });
    }
    return NextResponse.json({ success: true, story });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not build the story') }, { status: 500 });
  }
}
