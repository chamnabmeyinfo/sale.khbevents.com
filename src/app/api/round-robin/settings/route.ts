import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getRoundRobinSettings, updateRoundRobinSettings, getSettings, updateSettings } from '@/lib/storage';
import { normalizeStaffPercentages } from '@/lib/round-robin';
import { isMaskedSecret } from '@/lib/secrets';
import { RoundRobinStaff } from '@/lib/types';
import { errorMessage } from '@/lib/errors';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const roundRobinSettings = await getRoundRobinSettings();
    const systemSettings = await getSettings();

    return NextResponse.json({
      success: true,
      settings: roundRobinSettings,
      telegramConfigured: Boolean(systemSettings.telegramBotToken),
      botTokenMasked: systemSettings.telegramBotToken 
        ? `${systemSettings.telegramBotToken.slice(0, 7)}...${systemSettings.telegramBotToken.slice(-4)}`
        : null
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errorMessage(error, 'Failed to get settings') },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { settings, autoNormalize, botToken } = body;

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Settings payload is required' },
        { status: 400 }
      );
    }

    let staffList = settings.staffList || [];
    if (autoNormalize) {
      staffList = normalizeStaffPercentages(staffList);
    }

    // Routing counters keep changing while the admin page is open, so they come
    // from the server's current state, never from the (possibly stale) form.
    const current = await getRoundRobinSettings();
    const live = new Map(current.staffList.map((s) => [s.id, s]));
    staffList = staffList.map((s: RoundRobinStaff) => {
      const c = live.get(s.id);
      return c
        ? { ...s, totalLeadsRouted: c.totalLeadsRouted, totalDirectClicks: c.totalDirectClicks, lastAssignedAt: c.lastAssignedAt }
        : s;
    });

    const updated = await updateRoundRobinSettings({
      ...settings,
      staffList,
      lastAssignedIndex: current.lastAssignedIndex
    });

    // If botToken was also updated in the form, update global settings too
    if (typeof botToken === 'string' && botToken.trim() !== '' && !isMaskedSecret(botToken)) {
      await updateSettings({ telegramBotToken: botToken.trim() });
    }

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Round robin configuration saved successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errorMessage(error, 'Failed to update settings') },
      { status: 500 }
    );
  }
}
