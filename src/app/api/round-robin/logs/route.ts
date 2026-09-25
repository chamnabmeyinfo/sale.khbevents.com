import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getRoundRobinLogsMarked } from '@/lib/storage';
import { errorMessage } from '@/lib/errors';

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const logs = await getRoundRobinLogsMarked(limit);

    return NextResponse.json({
      success: true,
      logs
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errorMessage(error, 'Failed to fetch logs') },
      { status: 500 }
    );
  }
}
