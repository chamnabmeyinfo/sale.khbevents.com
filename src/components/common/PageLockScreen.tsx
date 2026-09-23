'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, KeyRound, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import type { LockedPageStub } from '@/lib/page-access';

/**
 * Passcode screen for protected landing pages. The page content is never sent
 * to the browser until the server has verified the passcode and set an
 * unlock cookie; after that a refresh renders the real page.
 */
export default function PageLockScreen({ page }: { page: LockedPageStub }) {
  const router = useRouter();
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/pages/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: page.slug, pin: pinInput }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Invalid invitation passcode. Please check and try again.');
    } catch {
      setError('Connection problem. Please try again.');
    }
    setSubmitting(false);
  };

  const { partnerLogo, partnerName } = page;

  return (
    <div className="min-h-screen bg-[#050E09] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0A1A11] border border-emerald-900/60 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 text-center space-y-6">
        {/* Partner or Event Branding */}
        {partnerLogo ? (
          <div className="flex justify-center">
            <img src={partnerLogo} alt={partnerName || 'Partner'} className="h-12 object-contain" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Lock className="w-7 h-7" />
          </div>
        )}

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30">
            <Sparkles className="w-3 h-3" />
            <span>Exclusive VIP Campaign</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {page.title || 'Private Access Portal'}
          </h1>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            This delegation briefing and registration portal is restricted to invited delegates. Please enter your access code below.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4 pt-2">
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-500">
              <KeyRound className="w-4 h-4" />
            </span>
            <input
              type="password"
              autoFocus
              value={pinInput}
              onChange={e => {
                setPinInput(e.target.value);
                setError('');
              }}
              placeholder="Enter Invitation Passcode"
              className={`w-full pl-11 pr-4 py-3 rounded-xl bg-[#040C07] border text-sm text-center tracking-widest text-white placeholder-gray-600 focus:outline-none focus:ring-2 ${
                error 
                  ? 'border-rose-500 focus:ring-rose-500 text-rose-200' 
                  : 'border-emerald-900/80 focus:border-emerald-500 focus:ring-emerald-500/40'
              }`}
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{submitting ? 'Checking…' : 'Unlock Invitation'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-emerald-950/60 text-[11px] text-gray-500">
          Need assistance? Contact our delegation team at{' '}
          <span className="text-gray-300 font-medium">
            {page.phone || 'support@khbevents.com'}
          </span>
        </div>
      </div>
    </div>
  );
}
