'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, MessageCircle, Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { UserNavButton } from '@/components/auth/UserNavButton';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';

interface NavbarProps {
  phone?: string;
  whatsapp?: string;
}

export default function Navbar({
  phone = '+855 12 888 999',
  whatsapp = '85512888999'
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#09140E]/85 border-b border-emerald-900/30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-700/40 p-2 flex items-center justify-center shadow-lg shadow-emerald-950/50 group-hover:border-emerald-500/60 transition-all">
              <Image
                src="/images/khb-logo.png"
                alt="KHB EVENTS Logo"
                width={38}
                height={38}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-amber-400 font-bold text-lg pointer-events-none -z-10">
                KHB
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-wider text-white font-sans">
                  KHB <span className="text-amber-400">EVENTS</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/40">
                  PRODUCTIONS
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/70 hidden sm:block tracking-wide">
                Cambodia&apos;s Leading Event Management Partner
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <Link href="/#services" className="hover:text-amber-400 transition-colors">
              Services
            </Link>
            <Link href="/#campaigns" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Featured Expos
            </Link>
            <Link href="/#portfolio" className="hover:text-amber-400 transition-colors">
              Past Events
            </Link>
            <Link href="/#estimator" className="hover:text-amber-400 transition-colors">
              Cost Calculator
            </Link>
            <Link href="/#faq" className="hover:text-amber-400 transition-colors">
              FAQ
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeSwitcher compact={true} />
            <UserNavButton />

            <a
              href={`https://wa.me/${whatsapp}?text=Hello%20KHB%20Events,%20I%20would%20like%20to%20inquire%20about%20event%20management%20and%20production%20services.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-800/60 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Chat</span>
            </a>

            <a
              href="#inquiry-form"
              className="relative group overflow-hidden rounded-xl p-[1px] focus:outline-none"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500 rounded-xl blur-sm group-hover:blur-md transition-all"></span>
              <span className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-900 to-[#0A2016] text-white text-xs font-bold uppercase tracking-wider group-hover:bg-emerald-800 transition-colors">
                <span>Get VIP Quote</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </a>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeSwitcher compact={true} />
            <UserNavButton />
            <a
              href={`https://wa.me/${whatsapp}`}
              className="p-2 text-emerald-400 hover:text-emerald-300"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-emerald-950/60 text-gray-300 hover:text-white border border-emerald-800/40 focus:outline-none cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a1811] border-b border-emerald-900/60 px-4 pt-3 pb-6 space-y-3 shadow-2xl">
          <Link
            href="/#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-emerald-900/40 hover:text-amber-400"
          >
            Services & Staging
          </Link>
          <Link
            href="/#campaigns"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-emerald-900/40 hover:text-amber-400"
          >
            Featured Expos & Delegations
          </Link>
          <Link
            href="/#portfolio"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-emerald-900/40 hover:text-amber-400"
          >
            Past Mega Events
          </Link>
          <Link
            href="/#estimator"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-emerald-900/40 hover:text-amber-400"
          >
            Instant Cost Calculator
          </Link>
          <Link
            href="/#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-emerald-900/40 hover:text-amber-400"
          >
            Frequently Asked Questions
          </Link>
          <div className="pt-4 border-t border-emerald-900/50 flex flex-col gap-2.5">
            <a
              href="#inquiry-form"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-md transition-colors"
            >
              Request Custom Proposal
            </a>
            <a
              href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-xs font-semibold"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Call Direct: {phone}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
