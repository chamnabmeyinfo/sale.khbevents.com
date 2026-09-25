'use client';

import React from 'react';
import { Clock, LayoutTemplate } from 'lucide-react';
import type { RoundRobinStaff } from '@/lib/types';
import { nextOpening } from '@/lib/popup-ads';
import { staffOnShift } from '@/lib/round-robin';
import { useLanguage } from '@/context/LanguageContext';

const DAY_KEYS = ['ads.day.sun', 'ads.day.mon', 'ads.day.tue', 'ads.day.wed', 'ads.day.thu', 'ads.day.fri', 'ads.day.sat'];
const DEFAULT_HOURS = { days: [1, 2, 3, 4, 5, 6], from: '08:00', to: '18:00' };
const TIME_INPUT = 'px-2 py-1 rounded-lg bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono';

/**
 * Per-salesperson availability on the Round Robin staff card: working hours
 * (Phnom Penh time) and the landing pages they serve. Either one only narrows
 * who is preferred; when nobody qualifies, the normal rotation still applies.
 */
export default function StaffAvailability({
  staff,
  pages,
  nowMs,
  onChange,
}: {
  staff: RoundRobinStaff;
  pages: Array<{ slug: string; title: string }>;
  /** 0 until the page has mounted (keeps the server HTML stable). */
  nowMs: number;
  onChange: (patch: Partial<RoundRobinStaff>) => void;
}) {
  const { t } = useLanguage();
  const hours = staff.workHours;
  const chosen = staff.pages || [];
  const onShift = nowMs ? staffOnShift(staff, nowMs) : true;

  const toggleDay = (d: number) => {
    if (!hours) return;
    const days = hours.days.includes(d) ? hours.days.filter((x) => x !== d) : [...hours.days, d].sort();
    onChange({ workHours: days.length ? { ...hours, days } : undefined });
  };
  const togglePage = (slug: string) => {
    const next = chosen.includes(slug) ? chosen.filter((s) => s !== slug) : [...chosen, slug];
    onChange({ pages: next.length ? next : undefined });
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-emerald-950/60 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
      <div>
        <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-amber-400" checked={Boolean(hours)} onChange={(e) => onChange({ workHours: e.target.checked ? { ...DEFAULT_HOURS } : undefined })} />
          <Clock className="w-3.5 h-3.5" /> {t('rr.avail.hours')}
        </label>
        {hours ? (
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-1" role="group" aria-label={t('rr.avail.days')}>
              {DAY_KEYS.map((k, d) => {
                const on = hours.days.includes(d);
                return (
                  <button key={k} type="button" aria-pressed={on} onClick={() => toggleDay(d)} className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${on ? 'bg-amber-400 text-black border-amber-400' : 'bg-white dark:bg-[#06100B] text-slate-500 dark:text-gray-400 border-slate-200 dark:border-emerald-900/60'}`}>
                    {t(k)}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-gray-300">
              <input type="time" aria-label={t('rr.avail.from')} className={TIME_INPUT} value={hours.from} onChange={(e) => e.target.value && onChange({ workHours: { ...hours, from: e.target.value } })} />
              <span>–</span>
              <input type="time" aria-label={t('rr.avail.to')} className={TIME_INPUT} value={hours.to} onChange={(e) => e.target.value && onChange({ workHours: { ...hours, to: e.target.value } })} />
              <span className="text-[10px] text-slate-500 dark:text-gray-400">{t('ads.phnomPenh')}</span>
            </div>
            {nowMs > 0 && (
              <p className={`text-[11px] font-semibold ${onShift ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-400'}`}>
                {onShift ? t('rr.avail.workingNow') : t('rr.avail.offNow', { when: nextOpening(hours, nowMs) || '—' })}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-1 text-[10px] text-slate-500 dark:text-gray-400">{t('rr.avail.alwaysHint')}</p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-gray-300">
          <LayoutTemplate className="w-3.5 h-3.5" /> {t('rr.avail.pages')}
          <span className="font-normal text-[10px] text-slate-500 dark:text-gray-400">{chosen.length ? t('rr.avail.pagesCount', { n: chosen.length }) : t('rr.avail.allPages')}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pages.map((p) => {
            const on = chosen.includes(p.slug);
            return (
              <button key={p.slug} type="button" aria-pressed={on} onClick={() => togglePage(p.slug)} title={`/${p.slug}`} className={`max-w-full truncate px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${on ? 'bg-amber-400 text-black border-amber-400' : 'bg-white dark:bg-[#06100B] text-slate-600 dark:text-gray-300 border-slate-200 dark:border-emerald-900/60'}`}>
                {p.title}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[10px] text-slate-500 dark:text-gray-400">{t('rr.avail.pagesHint')}</p>
      </div>
    </div>
  );
}
