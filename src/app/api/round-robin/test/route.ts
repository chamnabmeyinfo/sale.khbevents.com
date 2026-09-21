import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/storage';
import { testStaffTelegramConnection } from '@/lib/round-robin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId, staffName, username, botToken: customToken } = body;

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'Telegram Chat ID is required.' },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const botToken = customToken || settings.telegramBotToken;

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
      username
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test telegram connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Verification test failed',
        diagnostic: 'Failed to connect to Telegram API servers.' 
      },
      { status: 500 }
    );
  }
}
