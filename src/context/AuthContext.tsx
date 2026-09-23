'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const NOT_CONFIGURED = new Error('Sign-in is unavailable: Supabase is not configured.');

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [supabase] = useState(createClient);
  const [loading, setLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    async function getInitialSession() {
      try {
        const { data: { session } } = await client.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = client.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 1. Google OAuth
  const signInWithGoogle = async () => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error };
  };

  // 2. Email Sign In
  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // 3. Email Sign Up
  const signUpWithEmail = async (email: string, password: string, fullName: string, phone?: string) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    return { error };
  };

  // 4. Phone SMS OTP Sign In
  const signInWithPhone = async (phone: string) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    // Format phone with country code if needed (Cambodia default +855)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+855' + formattedPhone.slice(1);
      } else {
        formattedPhone = '+855' + formattedPhone;
      }
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    return { error };
  };

  // 5. Verify Phone SMS OTP
  const verifyPhoneOtp = async (phone: string, token: string) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+855' + formattedPhone.slice(1);
      } else {
        formattedPhone = '+855' + formattedPhone;
      }
    }
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: token.trim(),
      type: 'sms',
    });
    return { error };
  };

  // 6. Sign Out
  const signOut = async () => {
    await supabase?.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInWithPhone,
        verifyPhoneOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
