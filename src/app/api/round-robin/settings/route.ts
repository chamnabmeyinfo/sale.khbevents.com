import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getRoundRobinSettings, updateRoundRobinSettings, getSettings, updateSettings } from '@/lib/storage';
import { normalizeStaffPercentages } from '@/lib/round-robin';
import { normalizeHours } from '@/lib/popup-ads';
import { RESPONSE_MINUTE_CHOICES } from '@/lib/lead-response';
import { isMaskedSecret } from '@/lib/secrets';
import { RoundRobinStaff } from '@/lib/types';
import { errorMessage } from '@/lib/errors';

/** A staff photo: an upload on this site or an https image address. Anything else is dropped. */
function safeAvatar(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().slice(0, 1000);
  if (/^\/api\/uploads\/[A-Za-z0-9._-]+$/.test(v)) return v;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

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

    // Working hours and page teams: only valid values are stored.
    let staffList = (Array.isArray(settings.staffList) ? settings.staffList : []).map((s: RoundRobinStaff) => {
      const pages = Array.isArray(s.pages)
        ? Array.from(new Set(s.pages.map((p) => String(p).toLowerCase().trim()).filter((p) => /^[a-z0-9_-]{1,120}$/.test(p))))
        : [];
      const limit = Math.round(Number(s.dailyLimit) || 0);
      return { ...s, avatar: safeAvatar(s.avatar), workHours: normalizeHours(s.workHours), pages: pages.length ? pages : undefined, dailyLimit: limit > 0 ? Math.min(limit, 500) : undefined };
    });
    const minutes = Number(settings.responseMinutes);
    settings.responseMinutes = (RESPONSE_MINUTE_CHOICES as readonly number[]).includes(minutes) ? minutes : 0;
    const hour = Number(settings.dailySummaryHour);
    settings.dailySummaryHour = settings.dailySummaryHour !== undefined && settings.dailySummaryHour !== null && [17, 18, 19, 20].includes(hour) ? hour : undefined;
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
        ? { ...s, totalLeadsRouted: c.totalLeadsRouted, totalDirectClicks: c.totalDirectClicks, lastAssignedAt: c.lastAssignedAt, todayDay: c.todayDay, todayCount: c.todayCount }
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
