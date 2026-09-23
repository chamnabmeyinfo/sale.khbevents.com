import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getTelegramWebhookSecret } from '@/lib/auth';
import { getSettings } from '@/lib/storage';
import { readTelegramResponse } from '@/lib/round-robin';
import { errorMessage } from '@/lib/errors';

/**
 * One-time setup: Register or check the Telegram Bot webhook URL.
 * 
 * GET  → Check current webhook status
 * POST → Register the webhook URL with Telegram
 * DELETE → Remove the webhook
 * 
 * Usage: Call POST /api/telegram/setup-webhook once after deployment.
 * The webhook URL will be set to: https://sale.khbevents.com/api/telegram/webhook
 */

const WEBHOOK_PATH = '/api/telegram/webhook';

async function getBotToken(): Promise<string | null> {
  const settings = await getSettings();
  return settings.telegramBotToken || null;
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const botToken = await getBotToken();
    if (!botToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'No Telegram Bot Token configured. Set it in Admin → Settings.' 
      }, { status: 400 });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await readTelegramResponse(res);

    return NextResponse.json({
      success: true,
      webhookInfo: data.result,
      isActive: Boolean(data.result?.url),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Telegram request failed') }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const botToken = await getBotToken();
    if (!botToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'No Telegram Bot Token configured. Set it in Admin → Settings.' 
      }, { status: 400 });
    }

    // Allow custom domain override, default to sale.khbevents.com
    let webhookBaseUrl = 'https://sale.khbevents.com';
    try {
      const body = await req.json();
      if (body?.baseUrl) {
        webhookBaseUrl = body.baseUrl.replace(/\/$/, '');
      }
    } catch {
      // No body provided, use default
    }

    const webhookUrl = `${webhookBaseUrl}${WEBHOOK_PATH}`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: getTelegramWebhookSecret(botToken),
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
      }),
    });

    const data = await readTelegramResponse(res);

    if (data.ok) {
      return NextResponse.json({
        success: true,
        message: `Webhook registered successfully!`,
        webhookUrl,
        telegramResponse: data,
      });
    }

    return NextResponse.json({
      success: false,
      error: data.description || 'Failed to set webhook',
      telegramResponse: data,
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Telegram request failed') }, { status: 500 });
  }
}

export async function DELETE() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const botToken = await getBotToken();
    if (!botToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'No Telegram Bot Token configured.' 
      }, { status: 400 });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true }),
    });

    const data = await readTelegramResponse(res);

    return NextResponse.json({
      success: data.ok,
      message: data.ok ? 'Webhook removed' : data.description,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Telegram request failed') }, { status: 500 });
  }
}
