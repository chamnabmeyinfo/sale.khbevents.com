'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, Phone, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function AuthForm({ onSuccess, redirectUrl = '/' }: AuthFormProps) {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInWithPhone, verifyPhoneOtp } = useAuth();

  const [authMethod, setAuthMethod] = useState<'google' | 'email' | 'phone'>('google');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // Flow states
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Google OAuth
  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError((err as Error).message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  // 2. Email Sign In / Sign Up
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const cleanEmail = email.toLowerCase().trim();
      const isPrivileged = cleanEmail === 'chamnabmey.info@gmail.com' || cleanEmail === 'admin@khbevents.com' || cleanEmail.endsWith('@khbevents.com');

      if (emailMode === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        setSuccessMsg('Successfully signed in!');
        if (onSuccess) onSuccess();
        router.push(isPrivileged ? '/admin' : redirectUrl);
      } else {
        if (!fullName.trim()) throw new Error('Please enter your full name');
        const { error } = await signUpWithEmail(email, password, fullName, phone);
        if (error) throw error;

        // Auto-login immediately after sign up
        const { error: loginErr } = await signInWithEmail(email, password);
        if (!loginErr) {
          setSuccessMsg('Account created and signed in successfully!');
          if (onSuccess) onSuccess();
          router.push(isPrivileged ? '/admin' : redirectUrl);
        } else {
          setSuccessMsg('Account created successfully! Please sign in with your password.');
          setEmailMode('signin');
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. Phone Sign In - Request OTP
  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!phone.trim()) throw new Error('Please enter a valid phone number');
      const { error } = await signInWithPhone(phone);
      if (error) throw error;
      setOtpSent(true);
      setSuccessMsg(`SMS verification code sent to ${phone}`);
    } catch (err) {
      setError((err as Error).message || 'Failed to send SMS code');
    } finally {
      setLoading(false);
    }
  };

  // 4. Phone Sign In - Verify OTP
  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!otpCode.trim()) throw new Error('Please enter the 6-digit code');
      const { error } = await verifyPhoneOtp(phone, otpCode);
      if (error) throw error;
      setSuccessMsg('Phone verified successfully!');
      if (onSuccess) onSuccess();
      router.push(redirectUrl);
    } catch (err) {
      setError((err as Error).message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-zinc-900/95 border border-slate-200 dark:border-amber-500/20 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-900 dark:text-white transition-colors">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          KHB Events Portal
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Welcome to <span className="text-amber-500 dark:text-amber-400">KHB EVENTS</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Access your bookings, event passes, inquiries, and VIP services.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-transparent rounded-xl mb-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => { setAuthMethod('google'); setError(null); }}
          className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMethod === 'google'
              ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Google
        </button>
        <button
          type="button"
          onClick={() => { setAuthMethod('email'); setError(null); }}
          className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMethod === 'email'
              ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" /> Email
        </button>
        <button
          type="button"
          onClick={() => { setAuthMethod('phone'); setError(null); }}
          className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMethod === 'phone'
              ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Phone className="w-3.5 h-3.5" /> Phone
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-red-950/50 border border-rose-200 dark:border-red-500/30 text-rose-700 dark:text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: GOOGLE AUTH */}
      {authMethod === 'google' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-zinc-400 text-center">
            Sign in with your Google account for instantaneous 1-click access with no password required.
          </p>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-white dark:hover:bg-zinc-100 border border-slate-200 dark:border-transparent text-slate-900 dark:text-zinc-900 font-semibold rounded-xl transition-all shadow-sm dark:shadow-lg hover:shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-800 dark:text-zinc-800" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* TAB 2: EMAIL AUTH */}
      {authMethod === 'email' && (
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
            <span>{emailMode === 'signin' ? 'Sign In to existing account' : 'Create a new client account'}</span>
            <button
              type="button"
              onClick={() => { setEmailMode(emailMode === 'signin' ? 'signup' : 'signin'); setError(null); }}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-semibold underline cursor-pointer"
            >
              {emailMode === 'signin' ? 'Need an account? Sign Up' : 'Already registered? Sign In'}
            </button>
          </div>

          {emailMode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chamnan Mey"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>
          </div>

          {emailMode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+855 12 888 999"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{emailMode === 'signin' ? 'Sign In with Email' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* TAB 3: PHONE OTP AUTH */}
      {authMethod === 'phone' && (
        <div>
          {!otpSent ? (
            <form onSubmit={handlePhoneSendOtp} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Enter your mobile number to receive a one-time SMS verification code. Supports Cambodian (+855) and international numbers.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Mobile Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="012 888 999 or +855 12 888 999"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send SMS Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneVerifyOtp} className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span>Code sent to <b className="text-slate-900 dark:text-white">{phone}</b></span>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpCode(''); }}
                  className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-bold py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Verify & Sign In</span>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-500 dark:text-zinc-500">
        By continuing, you agree to KHB EVENTS Terms of Service and Privacy Policy.
      </div>
    </div>
  );
}
