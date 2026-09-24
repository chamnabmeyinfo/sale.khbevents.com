'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { errorMessage } from '@/lib/errors';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('admin@khbevents.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('login.invalid'));
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, t('login.failed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login min-h-screen bg-slate-50 dark:bg-[#070D0A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-amber-400 selection:text-black transition-colors">
      <div className="absolute top-4 right-4 z-10"><LanguageSwitcher /></div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-700/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#0C1B13] border border-slate-200 dark:border-emerald-700/60 p-3 mx-auto flex items-center justify-center shadow-xl shadow-slate-200/50 dark:shadow-emerald-950/60">
          <Image
            src="/images/khb-logo.png"
            alt="KHB Logo"
            width={40}
            height={40}
            className="object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            KHB <span className="text-amber-500 dark:text-amber-400">PORTAL</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            {t('login.tagline')}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#0A1711] border border-slate-200 dark:border-emerald-800/50 py-8 px-6 sm:px-10 rounded-3xl shadow-xl space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                {t('login.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="admin@khbevents.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                {t('login.password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <span>{t('login.loading')}</span>
              ) : (
                <>
                  <span>{t('login.submit')}</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <Link href="/" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
              {t('login.back')}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
