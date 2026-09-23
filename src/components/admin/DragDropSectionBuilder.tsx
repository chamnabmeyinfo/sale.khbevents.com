'use client';

import React, { useState } from 'react';
import {
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Sparkles,
  RotateCcw,
  ExternalLink,
  Layers,
  LayoutTemplate,
  Flame,
  Gem,
  TrendingUp,
  AlertTriangle,
  Users,
  Target,
  Mic,
  Music,
  Calendar,
  Image as ImageIcon,
  Store,
  CreditCard,
  ShieldCheck,
  MessageSquareQuote,
  FileText,
  HelpCircle,
  LucideIcon
} from 'lucide-react';
import {
  SECTION_CATALOG,
  SectionCatalogItem,
  SectionVisibility,
  DEFAULT_SECTION_ORDER,
  B2B_DELEGATION_ORDER,
  TRADE_EXPO_ORDER,
  CORPORATE_SUMMIT_ORDER,
  CONCERT_FESTIVAL_ORDER,
  MINIMAL_LEAD_ORDER
} from '@/lib/types';

// Map icon strings to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutTemplate,
  Flame,
  Gem,
  TrendingUp,
  AlertTriangle,
  Users,
  Target,
  Mic,
  Music,
  Layers,
  Calendar,
  Image: ImageIcon,
  Store,
  CreditCard,
  ShieldCheck,
  MessageSquareQuote,
  FileText,
  HelpCircle,
};

// Category styling metadata
const CATEGORY_META: Record<string, { label: string; color: string; badgeCls: string }> = {
  hero: { label: 'Hero & Intro', color: '#6366F1', badgeCls: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40' },
  offer: { label: 'Core Offer & ROI', color: '#F59E0B', badgeCls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40' },
  program: { label: 'Program & Logistics', color: '#3B82F6', badgeCls: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40' },
  proof: { label: 'Proof & Trust', color: '#10B981', badgeCls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' },
  conversion: { label: 'Conversion & Form', color: '#EC4899', badgeCls: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/40' },
};

interface DragDropSectionBuilderProps {
  sectionOrder: string[];
  sectionVisibility: SectionVisibility;
  onChangeOrder: (newOrder: string[]) => void;
  onChangeVisibility: (newVisibility: SectionVisibility) => void;
  onJumpToTab?: (tabId: string) => void;
  currentTemplate?: string;
}

export default function DragDropSectionBuilder({
  sectionOrder = [],
  sectionVisibility = {},
  onChangeOrder,
  onChangeVisibility,
  onJumpToTab,
}: DragDropSectionBuilderProps) {
  // Ensure we have a working active order (respect empty array if user cleared sections)
  const activeKeys = Array.isArray(sectionOrder) ? sectionOrder : DEFAULT_SECTION_ORDER;

  // Drag & drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lookup map for fast retrieval of catalog items
  const catalogMap = React.useMemo(() => {
    const map = new Map<string, SectionCatalogItem>();
    SECTION_CATALOG.forEach(item => map.set(item.key, item));
    return map;
  }, []);

  // Items currently on the page
  const activeItems = React.useMemo(() => {
    return activeKeys
      .map(key => catalogMap.get(key))
      .filter((item): item is SectionCatalogItem => Boolean(item));
  }, [activeKeys, catalogMap]);

  // Items in catalog but NOT on the page
  const availableItems = React.useMemo(() => {
    const activeSet = new Set(activeKeys);
    return SECTION_CATALOG.filter(item => !activeSet.has(item.key)).filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.khLabel.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeKeys, selectedCategory, searchQuery]);

  // ── Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set transparent drag ghost or standard payload
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...activeKeys];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    onChangeOrder(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // ── Up / Down Quick Actions
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeKeys.length) return;

    const reordered = [...activeKeys];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    onChangeOrder(reordered);
  };

  // ── Add Item to Active Layout
  const addItem = (key: string) => {
    const updated = [...activeKeys, key];
    onChangeOrder(updated);

    // Turn visibility on when added
    onChangeVisibility({
      ...sectionVisibility,
      [key]: true,
    });
  };

  // ── Remove Item from Active Layout
  const removeItem = (key: string) => {
    const updated = activeKeys.filter(k => k !== key);
    onChangeOrder(updated);

    // Sync visibility off when removed from layout flow
    onChangeVisibility({
      ...sectionVisibility,
      [key]: false,
    });
  };

  // ── Toggle Visibility
  const toggleVisibility = (key: string) => {
    const currentVal = sectionVisibility[key as keyof SectionVisibility] !== false;
    onChangeVisibility({
      ...sectionVisibility,
      [key]: !currentVal,
    });
  };

  // ── Bulk Visibility & Flow Helpers
  const handleEnableAll = () => {
    const updatedVis: SectionVisibility = { ...sectionVisibility };
    activeKeys.forEach(k => {
      updatedVis[k as keyof SectionVisibility] = true;
    });
    onChangeVisibility(updatedVis);
  };

  const handleDisableAll = () => {
    const updatedVis: SectionVisibility = { ...sectionVisibility };
    SECTION_CATALOG.forEach(item => {
      updatedVis[item.key as keyof SectionVisibility] = false;
    });
    onChangeVisibility(updatedVis);
  };

  const handleClearFlow = () => {
    onChangeOrder([]);
    const updatedVis: SectionVisibility = { ...sectionVisibility };
    SECTION_CATALOG.forEach(item => {
      updatedVis[item.key as keyof SectionVisibility] = false;
    });
    onChangeVisibility(updatedVis);
  };

  // ── Apply Preset Flow
  const applyPreset = (presetKeys: string[]) => {
    onChangeOrder(presetKeys);
    // Ensure all preset items are set to visible: true
    const updatedVis: SectionVisibility = { ...sectionVisibility };
    presetKeys.forEach(k => {
      updatedVis[k as keyof SectionVisibility] = true;
    });
    onChangeVisibility(updatedVis);
  };

  return (
    <div className="space-y-6">
      {/* ── Preset Flow Template Buttons ── */}
      <div className="bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1-Click Recommended Layout Presets
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-gray-400">
            Clicking a preset automatically arranges &amp; enables recommended sections
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            type="button"
            onClick={() => applyPreset(B2B_DELEGATION_ORDER)}
            className="px-3 py-2 rounded-xl text-left bg-white dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/40 hover:border-amber-400 dark:hover:border-amber-400/60 transition-all text-xs cursor-pointer shadow-sm group"
          >
            <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
              💼 B2B Delegation
            </div>
            <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate">15-section full turnkey</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(TRADE_EXPO_ORDER)}
            className="px-3 py-2 rounded-xl text-left bg-white dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/40 hover:border-amber-400 dark:hover:border-amber-400/60 transition-all text-xs cursor-pointer shadow-sm group"
          >
            <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
              🎪 Trade Expo
            </div>
            <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate">Booths &amp; commercial floor</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(CORPORATE_SUMMIT_ORDER)}
            className="px-3 py-2 rounded-xl text-left bg-white dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/40 hover:border-amber-400 dark:hover:border-amber-400/60 transition-all text-xs cursor-pointer shadow-sm group"
          >
            <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
              🎤 Corporate Summit
            </div>
            <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate">Keynotes &amp; panelists</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(CONCERT_FESTIVAL_ORDER)}
            className="px-3 py-2 rounded-xl text-left bg-white dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/40 hover:border-amber-400 dark:hover:border-amber-400/60 transition-all text-xs cursor-pointer shadow-sm group"
          >
            <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
              🎵 Music &amp; Festival
            </div>
            <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate">Artists &amp; stage passes</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(MINIMAL_LEAD_ORDER)}
            className="px-3 py-2 rounded-xl text-left bg-white dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/40 hover:border-amber-400 dark:hover:border-amber-400/60 transition-all text-xs cursor-pointer shadow-sm group"
          >
            <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
              ⚡ Direct Opt-In
            </div>
            <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate">Fast 6-section funnel</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(DEFAULT_SECTION_ORDER)}
            className="px-3 py-2 rounded-xl text-left bg-white dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/40 hover:border-emerald-400 transition-all text-xs cursor-pointer shadow-sm flex items-center gap-1.5 justify-center"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-gray-400" />
            <span className="font-bold text-slate-700 dark:text-gray-200">Reset All (19)</span>
          </button>
        </div>
      </div>

      {/* ── Main Dual-Panel Workspace ── */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* ── LEFT PANEL: ACTIVE PAGE FLOW (DRAGGABLE CANVAS) ── */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-emerald-900/40">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Active Page Flow ({activeItems.length} Sections)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                Drag the grip handles (⋮⋮) or use (▲/▼) to reorder sections. Order on this list is exact visitor display sequence.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEnableAll}
                className="px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
                title="Enable all sections in the flow"
              >
                Enable All
              </button>
              <button
                type="button"
                onClick={handleDisableAll}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Hide all sections"
              >
                Disable All
              </button>
              <button
                type="button"
                onClick={handleClearFlow}
                className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                title="Remove all sections from the page layout"
              >
                Clear Flow
              </button>
            </div>
          </div>

          {activeItems.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-emerald-900/50 rounded-2xl">
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">No active sections on this page.</p>
              <button
                type="button"
                onClick={() => applyPreset(DEFAULT_SECTION_ORDER)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                Load Default 19 Sections
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeItems.map((item, idx) => {
                const isVisible = sectionVisibility[item.key as keyof SectionVisibility] !== false;
                const IconComponent = ICON_MAP[item.icon] || Layers;
                const cat = CATEGORY_META[item.category] || CATEGORY_META.hero;
                const isBeingDragged = draggedIndex === idx;
                const isDropTarget = dragOverIndex === idx && draggedIndex !== idx;

                return (
                  <div
                    key={item.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`group relative rounded-2xl border transition-all duration-150 p-3.5 flex items-center gap-3 select-none ${
                      isBeingDragged
                        ? 'opacity-40 scale-[0.98] border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                        : isDropTarget
                        ? 'border-t-4 border-t-amber-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : isVisible
                        ? 'bg-white dark:bg-[#0A1811] border-slate-200 dark:border-emerald-900/60 hover:border-emerald-400/80 dark:hover:border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#060D0A] border-slate-200/60 dark:border-emerald-950/40 opacity-55'
                    }`}
                  >
                    {/* Drag Grip Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-400 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-400 p-1 -ml-1 rounded-lg transition-colors"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Step Position Number */}
                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/50 text-[11px] font-black text-slate-600 dark:text-gray-300 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>

                    {/* Section Icon & Info */}
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/40 text-slate-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.label}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cat.badgeCls}`}>
                          {cat.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate">
                        {item.description}
                      </p>
                    </div>

                    {/* Right-Side Actions Bar */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Jump to content edit tab */}
                      {onJumpToTab && (
                        <button
                          type="button"
                          onClick={() => onJumpToTab(item.tabId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#07130D] transition-colors"
                          title={`Edit ${item.label} content`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#07130D] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'down')}
                        disabled={idx === activeItems.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#07130D] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleVisibility(item.key)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isVisible
                            ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-[#07130D]'
                        }`}
                        title={isVisible ? 'Visible (Click to hide)' : 'Hidden (Click to show)'}
                      >
                        {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Remove from Page */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove section from page layout"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: AVAILABLE SECTIONS LIBRARY ── */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          <div className="pb-2 border-b border-slate-200 dark:border-emerald-900/40">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Component Library</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-gray-400">
                {availableItems.length} available
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
              Sections waiting to be added to this page flow. Click (+ Add) to include.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            />

            <div className="flex flex-wrap gap-1">
              {['all', 'hero', 'offer', 'program', 'proof', 'conversion'].map(cKey => (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setSelectedCategory(cKey)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer capitalize ${
                    selectedCategory === cKey
                      ? 'bg-slate-900 dark:bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-[#07130D] text-slate-600 dark:text-gray-400 hover:bg-slate-200'
                  }`}
                >
                  {cKey}
                </button>
              ))}
            </div>
          </div>

          {availableItems.length === 0 ? (
            <div className="p-6 text-center border border-slate-200 dark:border-emerald-900/40 rounded-2xl bg-slate-50 dark:bg-[#07130D]">
              <div className="text-2xl mb-1">🎉</div>
              <p className="text-xs font-bold text-slate-700 dark:text-gray-300">All available components are in use!</p>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">
                Every section in the catalog is currently positioned on your landing page.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {availableItems.map((item) => {
                const IconComponent = ICON_MAP[item.icon] || Layers;
                const cat = CATEGORY_META[item.category] || CATEGORY_META.hero;

                return (
                  <div
                    key={item.key}
                    className="p-3 rounded-2xl bg-white dark:bg-[#0A1811] border border-slate-200 dark:border-emerald-900/40 hover:border-amber-400 dark:hover:border-emerald-500/60 transition-all flex items-center justify-between gap-2 shadow-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/40 text-slate-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.label}
                          </span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${cat.badgeCls}`}>
                            {cat.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-gray-400 truncate">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addItem(item.key)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs transition-colors"
                      title={`Add ${item.label} to active page flow`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
