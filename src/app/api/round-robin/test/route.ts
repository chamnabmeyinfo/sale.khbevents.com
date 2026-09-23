import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/storage';
import { testStaffTelegramConnection } from '@/lib/round-robin';
import { errorMessage } from '@/lib/errors';
import { isMaskedSecret } from '@/lib/secrets';

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { chatId, staffName, username, botToken: customToken, preferredLanguage } = body;

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'Telegram Chat ID is required.' },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const botToken = (customToken && !isMaskedSecret(customToken) ? customToken : '') || settings.telegramBotToken;

    if (!botToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Telegram Bot Token is missing.',
          diagnostic: 'Please enter a valid Telegram Bot Token in System Settings or in the field above.' 
        },
        { status: 400 }
      );
    }

    const result = await testStaffTelegramConnection(
      botToken,
      String(chatId).trim(),
      staffName || 'Staff Member',
      username,
      body.customTemplate,
      preferredLanguage
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Test telegram connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage(error, 'Verification test failed'),
        diagnostic: 'Failed to connect to Telegram API servers.' 
      },
      { status: 500 }
    );
  }
}
