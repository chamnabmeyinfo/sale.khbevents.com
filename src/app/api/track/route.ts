import { NextRequest, NextResponse } from 'next/server';
import { recordPageView } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const { slug, referrer } = await req.json();
    if (slug) {
      await recordPageView(slug, referrer);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
