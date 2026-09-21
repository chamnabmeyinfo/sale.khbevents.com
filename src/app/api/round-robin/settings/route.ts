import { NextRequest, NextResponse } from 'next/server';
import { getRoundRobinSettings, updateRoundRobinSettings, getSettings, updateSettings } from '@/lib/storage';
import { normalizeStaffPercentages } from '@/lib/round-robin';

export async function GET() {
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const updated = await updateRoundRobinSettings({
      ...settings,
      staffList
    });

    // If botToken was also updated in the form, update global settings too
    if (botToken !== undefined && botToken.trim() !== '') {
      await updateSettings({ telegramBotToken: botToken.trim() });
    }

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Round robin configuration saved successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
