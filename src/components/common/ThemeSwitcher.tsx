'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

interface ThemeSwitcherProps {
  compact?: boolean;
  className?: string;
}

export default function ThemeSwitcher({ compact = false, className = '' }: ThemeSwitcherProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { id: ThemeMode; label: string; icon: any }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System (Auto)', icon: Laptop }
  ];

  // Compact segmented control version
  if (compact) {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-black/40 border border-emerald-900/40 backdrop-blur-sm ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              title={`Theme: ${opt.label}`}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-black shadow-sm font-bold scale-105'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-emerald-950/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown style with current mode display
  const CurrentIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-200 text-xs font-semibold transition-all shadow-sm cursor-pointer"
        title="Toggle Light / Dark / System Mode"
      >
        <CurrentIcon className="w-3.5 h-3.5 text-amber-400" />
        <span className="capitalize">{theme === 'system' ? 'Auto (System)' : theme}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-[#08150E] border border-emerald-900/70 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 border-b border-emerald-950 mb-1">
            Appearance
          </div>
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400/20 text-amber-300 font-bold'
                    : 'text-zinc-300 hover:bg-emerald-950/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
