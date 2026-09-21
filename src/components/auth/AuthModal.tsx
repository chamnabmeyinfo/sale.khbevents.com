'use client';

import React from 'react';
import { X } from 'lucide-react';
import { AuthForm } from './AuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
}

export function AuthModal({ isOpen, onClose, redirectUrl }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-sm"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <AuthForm onSuccess={onClose} redirectUrl={redirectUrl} />
      </div>
    </div>
  );
}
