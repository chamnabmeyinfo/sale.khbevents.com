'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User as UserIcon, LogOut, Shield, ChevronDown, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { AuthModal } from './AuthModal';

export function UserNavButton() {
  const { user, signOut, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />;
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-white hover:border-amber-400 hover:bg-amber-500/30 transition-all shadow-sm"
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>
        <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    user.phone ||
    'Client';

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const isAdmin = user.email === 'admin@khbevents.com' || user.email?.endsWith('@khbevents.com');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 hover:border-amber-500/50 transition-all text-xs font-semibold text-white"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover border border-amber-400"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px] border border-amber-500/30">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className="max-w-[100px] truncate">{displayName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
          <div className="p-2.5 border-b border-zinc-800">
            <p className="font-bold text-white truncate">{displayName}</p>
            <p className="text-zinc-400 text-[11px] truncate">{user.email || user.phone}</p>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Signed in via {user.app_metadata.provider || 'Supabase'}
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-500/10 font-semibold transition-all mt-1"
            >
              <Shield className="w-4 h-4" />
              <span>Admin CRM Portal</span>
            </Link>
          )}

          <button
            onClick={() => {
              signOut();
              setDropdownOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 font-semibold transition-all mt-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
