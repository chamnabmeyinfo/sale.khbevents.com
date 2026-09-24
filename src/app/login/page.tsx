import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { LoginBackLink } from '@/components/auth/LoginBackLink';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

export const metadata = {
  title: 'Client Sign In | KHB EVENTS Cambodia',
  description: 'Sign in with Google, Email, or Phone to access your KHB event bookings and inquiries.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Language switcher (dark-theme override so the pill is readable on zinc-950 in light mode) */}
      <div className="absolute top-4 right-4 z-10 [&_.lang-switcher]:bg-zinc-800/80 [&_.lang-switcher]:border-zinc-700 [&_.lang-btn]:text-zinc-400 [&_.lang-btn:hover]:text-white [&_.lang-btn.active]:bg-amber-500 [&_.lang-btn.active]:text-zinc-950">
        <LanguageSwitcher />
      </div>

      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <div className="w-full max-w-md mb-4 z-10">
        <LoginBackLink />
      </div>

      <div className="w-full max-w-md z-10">
        <AuthForm />
      </div>
    </div>
  );
}
