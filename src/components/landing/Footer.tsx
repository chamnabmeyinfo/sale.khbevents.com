import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Lock, ArrowUpRight } from 'lucide-react';
import { DEFAULT_LOGO } from '@/lib/company';

interface FooterProps {
  phone?: string;
  email?: string;
  address?: string;
  /** Company or page logo (see companyFor). */
  logo?: string;
}

export default function Footer({
  phone = '+855 12 888 999',
  email = 'sale@khbevents.com',
  address = 'Diamond Island (Koh Pich), Phnom Penh, Cambodia',
  logo = DEFAULT_LOGO,
}: FooterProps) {
  return (
    <footer className="bg-slate-100 dark:bg-[#040806] border-t border-slate-200 dark:border-emerald-950 text-slate-600 dark:text-gray-400 text-xs py-14 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200 dark:border-emerald-950">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 p-2 flex items-center justify-center shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded logos may live on another host */}
                <img src={logo} alt="Logo" width={30} height={30} className="w-[30px] h-[30px] object-contain" />
              </div>
              <span className="text-lg font-black tracking-wider text-slate-900 dark:text-white">
                KHB <span className="text-amber-500 dark:text-amber-400">EVENTS</span>
              </span>
            </div>
            
            <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed max-w-sm">
              Cambodia&apos;s foremost event production, 4K LED staging, audio-visual engineering, and exhibition management agency. Official staging partner for major venues in Phnom Penh.
            </p>

            <div className="space-y-2 pt-2 text-xs text-slate-700 dark:text-gray-300">
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>Hotline: {phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>Email: {email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>HQ: {address}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
              Production Services
            </h4>
            <ul className="space-y-2">
              <li><a href="#services" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Corporate Galas &amp; Dinners</a></li>
              <li><a href="#services" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Music Concerts &amp; Festivals</a></li>
              <li><a href="#services" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">4K LED Wall &amp; Screen Rental</a></li>
              <li><a href="#services" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Exhibition Booth Fabrication</a></li>
              <li><a href="#services" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Stage Truss &amp; Architectural Lighting</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
              KHB Ecosystem
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="https://khbevents.com" target="_blank" rel="noreferrer" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1">
                  <span>Main Website</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 dark:text-gray-500" />
                </a>
              </li>
              <li>
                <a href="https://system.khbevents.com" target="_blank" rel="noreferrer" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1">
                  <span>Booth Management</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 dark:text-gray-500" />
                </a>
              </li>
              <li>
                <a href="https://shopping.khbevents.com" target="_blank" rel="noreferrer" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1">
                  <span>KHB Shopping Platform</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 dark:text-gray-500" />
                </a>
              </li>
              <li>
                <Link href="/smart-city-tea-cafe" className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors">
                  Vietnam B2B Trade Delegation
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
              Management Portal
            </h4>
            <p className="text-slate-600 dark:text-gray-400 text-[11px]">
              Internal landing page CMS, leads pipeline CRM, and campaign analytics.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:text-slate-900 dark:hover:text-white hover:border-amber-400 text-xs font-semibold transition-all shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Admin CMS Login</span>
            </Link>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-gray-400">
          <div>
            &copy; {new Date().getFullYear()} KHB EVENTS (sale.khbevents.com). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Phnom Penh, Kingdom of Cambodia</span>
            <span>&bull;</span>
            <a href="#inquiry-form" className="text-amber-600 dark:text-amber-400 hover:underline">
              Book Consultation
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
