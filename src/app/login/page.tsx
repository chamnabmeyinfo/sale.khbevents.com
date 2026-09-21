import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Client Sign In | KHB EVENTS Cambodia',
  description: 'Sign in with Google, Email, or Phone to access your KHB event bookings and inquiries.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <div className="w-full max-w-md mb-4 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to KHB Home</span>
        </Link>
      </div>

      <div className="w-full max-w-md z-10">
        <AuthForm />
      </div>
    </div>
  );
}
