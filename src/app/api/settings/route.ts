import { NextRequest, NextResponse } from 'next/server';
import { getSettings, getPublicSettings, updateSettings } from '@/lib/storage';
import { isAuthenticated, hashPassword, setAdminSession } from '@/lib/auth';
import { SystemSettings } from '@/lib/types';
import { isMaskedSecret, maskSecret } from '@/lib/secrets';
import { safeLogo } from '@/lib/company';
import { normalizeGa4Id } from '@/lib/ga4';

export async function GET() {
  const authed = await isAuthenticated();

  if (authed) {
    const settings = await getSettings();
    return NextResponse.json({
      settings: {
        ...settings,
        adminPasswordHash: undefined,
        telegramBotToken: maskSecret(settings.telegramBotToken)
      }
    });
  }

  return NextResponse.json({ settings: await getPublicSettings() });
}

export async function PUT(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const updateData: Partial<SystemSettings> = {};

    const text = (v: unknown) => (typeof v === 'string' ? v.trim() : undefined);

    // Required contact details: only replaced by a non-empty value.
    if (text(body.companyName)) updateData.companyName = text(body.companyName);
    if (text(body.phone)) updateData.phone = text(body.phone);
    if (text(body.whatsappNumber)) updateData.whatsappNumber = text(body.whatsappNumber)!.replace(/[^0-9]/g, '');
    if (text(body.telegramUsername)) updateData.telegramUsername = text(body.telegramUsername)!.replace('@', '');
    if (text(body.email)) updateData.email = text(body.email);

    // Optional fields: an empty value clears them.
    if (text(body.brandTagline) !== undefined) updateData.brandTagline = text(body.brandTagline);
    if (text(body.address) !== undefined) updateData.address = text(body.address);
    // Logo: an uploaded image or https link; empty goes back to the built-in logo.
    if (text(body.logoUrl) !== undefined) updateData.logoUrl = safeLogo(body.logoUrl) || '';
    // Google Analytics for the whole site: a G- measurement ID, or empty to switch it off.
    if (body.ga4MeasurementId !== undefined) {
      const ga4 = normalizeGa4Id(body.ga4MeasurementId);
      if (ga4 === null) return NextResponse.json({ error: 'The Google Analytics ID looks like G-XXXXXXXXXX (from GA4 → Admin → Data streams).' }, { status: 400 });
      updateData.ga4MeasurementId = ga4;
    }
    if (text(body.facebookUrl) !== undefined) updateData.facebookUrl = text(body.facebookUrl);
    if (text(body.tiktokUrl) !== undefined) updateData.tiktokUrl = text(body.tiktokUrl);
    if (text(body.telegramChatId) !== undefined) updateData.telegramChatId = text(body.telegramChatId);
    if (body.enableTelegramAlerts !== undefined) updateData.enableTelegramAlerts = !!body.enableTelegramAlerts;
    // The form shows a placeholder for the stored token; sending it back keeps the token.
    if (text(body.telegramBotToken) !== undefined && !isMaskedSecret(body.telegramBotToken)) {
      updateData.telegramBotToken = text(body.telegramBotToken);
    }

    if (body.newPassword && body.newPassword.length >= 6) {
      updateData.adminPasswordHash = hashPassword(body.newPassword);
    }

    const updated = await updateSettings(updateData);

    // A new password rotates the session signing key; keep the current admin signed in.
    if (updateData.adminPasswordHash) {
      await setAdminSession(updated.adminEmail);
    }

    return NextResponse.json({
      success: true,
      settings: { ...updated, adminPasswordHash: undefined, telegramBotToken: maskSecret(updated.telegramBotToken) }
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
