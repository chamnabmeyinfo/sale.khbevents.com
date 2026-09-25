import { popupStorageKeys } from '@/lib/popup-ads';

/**
 * Which popups this visitor saw (1) or clicked (2) during the visit, so a form
 * sent afterwards can be credited to them as a lead in the popup analytics.
 * Kept in sessionStorage: one browser tab, one visit.
 */
const VISIT_KEY = 'khb_popup_visit';

function readVisit(): Record<string, number> {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(VISIT_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/** The main place this visit came from (telegram, facebook…), or direct. */
export function visitSource(): string {
  try {
    return (window.sessionStorage.getItem(popupStorageKeys.visitSources) || '').split(',').filter(Boolean)[0] || 'direct';
  } catch {
    return 'direct';
  }
}

export function rememberPopupSeen(adId: string, clicked: boolean): void {
  try {
    const visit = readVisit();
    visit[adId] = Math.max(visit[adId] || 0, clicked ? 2 : 1);
    window.sessionStorage.setItem(VISIT_KEY, JSON.stringify(visit));
  } catch {
    // Storage blocked: the lead is simply not credited to the popup.
  }
}

/**
 * The popups to credit with a lead, and forgets them so a second form in the
 * same visit is not counted twice. Called by trackClientEvent on form_submit.
 */
export function takePopupLeads(): Array<{ adId: string; clicked: boolean; source: string }> {
  const visit = readVisit();
  const ids = Object.keys(visit);
  if (!ids.length) return [];
  try {
    window.sessionStorage.removeItem(VISIT_KEY);
  } catch {
    // ignore
  }
  const source = visitSource();
  return ids.map((adId) => ({ adId, clicked: visit[adId] === 2, source }));
}
