'use client';

import React, { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

interface FloatingContactProps {
  whatsappNumber?: string;
  telegramUsername?: string;
  phone?: string;
  pageSlug?: string;
}

export default function FloatingContact({
  whatsappNumber = '85512888999',
  pageSlug = 'home'
}: FloatingContactProps) {
  const [showTooltip, setShowTooltip] = useState(true);

  const telegramHref = `/api/round-robin?page=${encodeURIComponent(pageSlug)}&redirect=true`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {showTooltip && (
        <div className="relative hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-emerald-950/95 border border-emerald-500/50 text-slate-800 dark:text-white text-xs font-medium shadow-2xl backdrop-blur-md animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
          <span>Need fast quote? Chat with our event producer now!</span>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-gray-400 hover:text-white ml-1 cursor-pointer"
            aria-label="Close tooltip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2.5 items-end">
        <a
          href={telegramHref}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-[#2AABEE] hover:bg-[#229ED9] text-white flex items-center justify-center shadow-lg shadow-[#2AABEE]/30 hover:scale-110 transition-all group relative"
          aria-label="Chat on Telegram"
        >
          <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5" />
          <span className="absolute right-14 whitespace-nowrap bg-black/80 text-white text-xs font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            Chat on Telegram
          </span>
        </a>

        <a
          href={`https://wa.me/${whatsappNumber}?text=Hello%20KHB%20Events,%20I%20would%20like%20to%20inquire%20about%20event%20production.`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xl shadow-[#25D366]/40 hover:scale-110 transition-all group relative"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute right-16 whitespace-nowrap bg-black/80 text-white text-xs font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            Chat on WhatsApp
          </span>
        </a>
      </div>
    </div>
  );
}
