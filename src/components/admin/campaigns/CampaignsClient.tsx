'use client';

import React from 'react';
import { BarChart3, Bot, Link2, Settings2, Target } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useUrlParam } from '@/lib/use-browser-state';
import OverviewTab from './OverviewTab';
import ManageTab from './ManageTab';
import AiTab from './AiTab';
import SetupTab from './SetupTab';

export interface PageOption {
  slug: string;
  title: string;
  id: string;
}

const TABS = ['overview', 'manage', 'ai', 'setup'] as const;
type Tab = (typeof TABS)[number];

/** Admin → Campaigns: performance report, campaigns and links, AI analyst, tracking setup. */
export default function CampaignsClient({ pages }: { pages: PageOption[] }) {
  const { t } = useLanguage();
  const urlTab = useUrlParam('tab');
  // The tab lives in the address (?tab=ai), so sidebar links and reloads open the right one.
  const tab: Tab = (TABS as readonly string[]).includes(urlTab || '') ? (urlTab as Tab) : 'overview';

  const choose = (next: Tab) => {
    const u = new URL(window.location.href);
    if (next === 'overview') u.searchParams.delete('tab');
    else u.searchParams.set('tab', next);
    window.history.replaceState(null, '', u.toString());
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const icons: Record<Tab, React.ReactNode> = {
    overview: <BarChart3 className="w-4 h-4" />,
    manage: <Link2 className="w-4 h-4" />,
    ai: <Bot className="w-4 h-4" />,
    setup: <Settings2 className="w-4 h-4" />,
  };

  return (
    <div className="pa-root space-y-5 max-w-7xl mx-auto pb-16">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Target className="w-5 h-5 text-amber-500" /> {t('cp.title')}</h1>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{t('cp.subtitle')}</p>
      </div>
      <nav className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-emerald-900/40 pb-2" aria-label={t('cp.title')}>
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => choose(id)}
            aria-current={tab === id ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${tab === id ? 'bg-amber-400 text-black shadow' : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'}`}
          >
            {icons[id]} {t(`cp.tab.${id}`)}
          </button>
        ))}
      </nav>
      {tab === 'overview' && <OverviewTab pages={pages} />}
      {tab === 'manage' && <ManageTab pages={pages} />}
      {tab === 'ai' && <AiTab pages={pages} />}
      {tab === 'setup' && <SetupTab />}
    </div>
  );
}
