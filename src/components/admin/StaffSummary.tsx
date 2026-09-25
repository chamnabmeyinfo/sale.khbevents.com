'use client';

import React from 'react';
import { Clock, Gauge, LayoutTemplate, Pencil, RefreshCw, Send } from 'lucide-react';
import type { RoundRobinStaff } from '@/lib/types';
import { assignmentsOn, staffOnShift } from '@/lib/round-robin';
import { phnomPenhDay } from '@/lib/popup-analytics';
import { nextOpening } from '@/lib/popup-ads';
import { useLanguage } from '@/context/LanguageContext';
import AvatarUpload from './AvatarUpload';

export type StaffView = 'cards' | 'list' | 'grid';

interface Props {
  staff: RoundRobinStaff;
  index: number;
  view: Exclude<StaffView, 'cards'>;
  /** 0 until mounted. */
  nowMs: number;
  testing?: boolean;
  onChange: (patch: Partial<RoundRobinStaff>) => void;
  onEdit: () => void;
  onTest: () => void;
}

const CHIP = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border';

/** One salesperson as a compact row or a tile; Edit opens the full card. */
export default function StaffSummary({ staff, index, view, nowMs, testing, onChange, onEdit, onTest }: Props) {
  const { t } = useLanguage();
  const user = (staff.telegramUsername || '').replace(/^@/, '');
  const today = nowMs ? assignmentsOn(staff, phnomPenhDay(nowMs)) : 0;
  const onShift = nowMs ? staffOnShift(staff, nowMs) : true;
  const name = staff.name || t('rr.staff.defaultName', { n: index + 1 });

  const chips = (
    <>
      {staff.workHours && nowMs > 0 && (
        <span className={`${CHIP} ${onShift ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' : 'bg-slate-50 dark:bg-black/30 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-800'}`}>
          <Clock className="w-3 h-3" /> {onShift ? t('rr.avail.workingNow') : t('rr.avail.offNow', { when: nextOpening(staff.workHours, nowMs) || '—' })}
        </span>
      )}
      {staff.pages?.length ? (
        <span className={`${CHIP} bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900`}>
          <LayoutTemplate className="w-3 h-3" /> {t(staff.pages.length === 1 ? 'rr.view.page' : 'rr.view.pages', { n: staff.pages.length })}
        </span>
      ) : null}
      {staff.dailyLimit ? (
        <span className={`${CHIP} bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900`}>
          <Gauge className="w-3 h-3" /> {t('rr.view.limit', { n: today, max: staff.dailyLimit })}
        </span>
      ) : null}
      {!staff.telegramChatId && (
        <span className={`${CHIP} bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900`}>{t('rr.view.noChatId')}</span>
      )}
    </>
  );

  const activeSwitch = (
    <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold">
      <input type="checkbox" checked={staff.isActive} onChange={(e) => onChange({ isActive: e.target.checked })} className="w-4 h-4 accent-amber-400 cursor-pointer" />
      <span className={staff.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}>{staff.isActive ? t('rr.staff.active') : t('rr.staff.off')}</span>
    </label>
  );

  const actions = (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={onTest} disabled={testing || !staff.telegramChatId} title={t('rr.staff.testPingTitle')} aria-label={t('rr.staff.testPing')} className="p-1.5 rounded-lg bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-amber-600 dark:text-amber-400 cursor-pointer disabled:opacity-40">
        {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      </button>
      <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-[11px] font-bold text-slate-800 dark:text-emerald-300 cursor-pointer">
        <Pencil className="w-3 h-3" /> {t('rr.view.edit')}
      </button>
    </div>
  );

  const stats = (
    <span className="text-[11px] text-slate-500 dark:text-gray-400 pa-num">
      {t('rr.view.stats', { share: staff.percentage || 0, leads: staff.totalLeadsRouted || 0, clicks: staff.totalDirectClicks || 0 })}
    </span>
  );

  if (view === 'list') {
    return (
      <div className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 ${staff.isActive ? '' : 'opacity-70'}`}>
        <div className="flex items-center gap-3 min-w-0 sm:w-64">
          <AvatarUpload name={name} src={staff.avatar} size={40} onChange={(avatar) => onChange({ avatar })} />
          <div className="min-w-0">
            <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{name}</div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400 truncate">{user ? `@${user}` : t('rr.view.noUsername')}{staff.title ? ` · ${staff.title}` : ''}</div>
          </div>
        </div>
        <div className="flex-1 flex flex-wrap items-center gap-1.5">{stats}{chips}</div>
        <div className="flex items-center gap-3 justify-between sm:justify-end">{activeSwitch}{actions}</div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border bg-white dark:bg-[#0A1610] border-slate-200 dark:border-emerald-900/50 shadow-sm flex flex-col items-center text-center gap-2 ${staff.isActive ? '' : 'opacity-70'}`}>
      <div className="w-full flex items-center justify-between text-[10px] font-black text-slate-400">
        <span>#{index + 1}</span>
        {activeSwitch}
      </div>
      <AvatarUpload name={name} src={staff.avatar} size={72} onChange={(avatar) => onChange({ avatar })} />
      <div className="min-w-0 w-full">
        <div className="font-black text-slate-900 dark:text-white truncate">{name}</div>
        <div className="text-[11px] text-slate-500 dark:text-gray-400 truncate">{staff.title || t('rr.staff.defaultTitle')}</div>
        {user && <a href={`https://t.me/${user}`} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline">@{user}</a>}
      </div>
      <div className="w-full">
        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-gray-300 mb-1">
          <span>{t('rr.view.share')}</span>
          <strong className="text-amber-700 dark:text-amber-400 pa-num">{staff.percentage || 0}%</strong>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-emerald-950 overflow-hidden" aria-hidden="true">
          <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, staff.percentage || 0)}%` }} />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5 min-h-[20px]">{chips}</div>
      <div className="text-[11px] text-slate-500 dark:text-gray-400 pa-num">{t('rr.view.counts', { leads: staff.totalLeadsRouted || 0, clicks: staff.totalDirectClicks || 0 })}</div>
      <div className="mt-auto pt-1">{actions}</div>
    </div>
  );
}
