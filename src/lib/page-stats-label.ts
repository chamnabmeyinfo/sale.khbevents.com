import type { PageStats } from './page-stats';

/** "last 30 days", or "since 25 Sep" while tracking has less history than that. */
export function statsWindowLabel(stats: PageStats, lang: string, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const fullWindowStart = stats.nowMs - stats.days * 86_400_000;
  if (stats.sinceMs <= fullWindowStart + 86_400_000) return t('stats.window.days', { n: stats.days });
  const date = new Date(stats.sinceMs).toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Phnom_Penh' });
  return t('stats.window.since', { date });
}
