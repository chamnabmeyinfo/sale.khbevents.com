'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
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
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D0A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-amber-400 selection:text-black">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-700/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#0C1B13] border border-emerald-700/60 p-3 mx-auto flex items-center justify-center shadow-xl shadow-emerald-950/60">
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            KHB <span className="text-amber-400">PORTAL</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Landing Page CMS & Lead Management System
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0A1711] border border-emerald-800/50 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/60 text-xs text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#06100B] border border-emerald-900/80 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="admin@khbevents.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#06100B] border border-emerald-900/80 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
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
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>

          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-gray-300 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Default Credentials:
            </div>
            <div>Email: <code className="text-emerald-200 bg-emerald-950 px-1 py-0.5 rounded">admin@khbevents.com</code></div>
            <div>Password: <code className="text-emerald-200 bg-emerald-950 px-1 py-0.5 rounded">khbevents2026</code></div>
          </div>

          <div className="text-center">
            <a href="/" className="text-xs text-emerald-400 hover:underline">
              ← Return to public website
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
