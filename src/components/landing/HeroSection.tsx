'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2, Award, Zap } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/50 shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 tracking-wide uppercase">
                Cambodia&apos;s Leading Event Management &amp; Production Agency
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Engineering <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-emerald-600 to-amber-500 dark:from-amber-400 dark:via-emerald-300 dark:to-amber-300">Unforgettable</span> Experiences That Command Attention.
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              From luxury corporate galas and stadium mega-concerts to international B2B trade expos and bespoke booth fabrication—KHB EVENTS delivers end-to-end turnkey production across Cambodia.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-700 dark:text-gray-200 max-w-xl mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>Turnkey In-House LED, Sound &amp; Lighting</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>Official Venue Partner at Koh Pich &amp; Koh Norea</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>3D Stage Visualization Prior to Execution</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>Flawless VIP &amp; Dignitary Protocol Management</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a
                href="#inquiry-form"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-500 shadow-xl shadow-amber-500/20 transform hover:-translate-y-0.5 transition-all"
              >
                <span>Request Custom Proposal</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </a>

              <a
                href="#estimator"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-sm text-emerald-900 dark:text-emerald-200 bg-emerald-100/80 hover:bg-emerald-200/80 dark:bg-[#0c1f16] dark:hover:bg-[#132c21] border border-emerald-300 dark:border-emerald-700/50 transition-all shadow-sm"
              >
                <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Interactive Cost Calculator</span>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-emerald-900/40">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">500+</div>
                <div className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Successful Events</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400">250K+</div>
                <div className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Attendees Managed</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">99.4%</div>
                <div className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Client Satisfaction</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-3xl p-1 bg-gradient-to-b from-emerald-500/30 via-emerald-800/20 to-transparent shadow-2xl">
              <div className="relative rounded-[22px] overflow-hidden bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-800/40 p-5 space-y-5 shadow-sm">
                <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden group">
                  <img
                    src="/images/events/photo_2026-09-16_22-01-09.jpg"
                    alt="KHB Events Production Showcase"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09140E] via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-amber-300 border border-amber-500/30">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      Turnkey Production Standard
                    </span>
                    <span className="text-[11px] text-gray-300 bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
                      Phnom Penh, Cambodia
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/60 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span>UPCOMING HIGH-LEVEL CAMPAIGNS</span>
                    <span className="text-amber-600 dark:text-amber-400 animate-pulse">● ACTIVE NOW</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Vietnam Smart City, Tea &amp; Cafe B2B Business Delegation
                  </div>
                  <p className="text-xs text-slate-600 dark:text-gray-400">
                    Exclusive 30 VIP seats. Pre-arranged 1-on-1 business matching in Ho Chi Minh City &amp; Da Lat.
                  </p>
                  <Link
                    href="/smart-city-tea-cafe"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 pt-1"
                  >
                    <span>View Campaign Details &amp; Passes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-gray-300 pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-transparent">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    <span>Concert Grade Sound</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-transparent">
                    <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                    <span>Curved 4K LED Walls</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-transparent">
                    <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400" />
                    <span>Licensed Staging Rigs</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-transparent">
                    <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400" />
                    <span>24/7 Producer On-Site</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
