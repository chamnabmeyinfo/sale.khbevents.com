import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/storage';
import { isAuthenticated, hashPassword } from '@/lib/auth';

export async function GET() {
  const settings = await getSettings();
  const authed = await isAuthenticated();

  const { adminPasswordHash, telegramBotToken, ...safeSettings } = settings;

  if (authed) {
    return NextResponse.json({
      settings: {
        ...settings,
        adminPasswordHash: undefined,
        telegramBotToken: telegramBotToken ? '••••••••' : ''
      }
    });
  }

  return NextResponse.json({ settings: safeSettings });
}

export async function PUT(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.companyName) updateData.companyName = body.companyName;
    if (body.brandTagline) updateData.brandTagline = body.brandTagline;
    if (body.phone) updateData.phone = body.phone;
    if (body.whatsappNumber) updateData.whatsappNumber = body.whatsappNumber.replace(/[^0-9]/g, '');
    if (body.telegramUsername) updateData.telegramUsername = body.telegramUsername.replace('@', '');
    if (body.email) updateData.email = body.email;
    if (body.address) updateData.address = body.address;
    if (body.facebookUrl) updateData.facebookUrl = body.facebookUrl;
    if (body.tiktokUrl) updateData.tiktokUrl = body.tiktokUrl;
    if (body.enableTelegramAlerts !== undefined) updateData.enableTelegramAlerts = !!body.enableTelegramAlerts;
    if (body.telegramChatId) updateData.telegramChatId = body.telegramChatId;
    if (body.telegramBotToken && body.telegramBotToken !== '••••••••') {
      updateData.telegramBotToken = body.telegramBotToken;
    }

    if (body.newPassword && body.newPassword.length >= 6) {
      updateData.adminPasswordHash = hashPassword(body.newPassword);
    }

    const updated = await updateSettings(updateData);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
