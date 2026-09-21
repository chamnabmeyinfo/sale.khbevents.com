'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, MapPin, Sparkles, Award } from 'lucide-react';
import { LandingPage } from '@/lib/types';

interface CampaignsShowcaseProps {
  pages: LandingPage[];
}

export default function CampaignsShowcase({ pages }: CampaignsShowcaseProps) {
  const publishedPages = pages.filter((p) => p.status === 'published');

  if (publishedPages.length === 0) return null;

  return (
    <section id="campaigns" className="py-20 bg-[#060B08] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Special Event Registrations &amp; Delegations
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Featured Campaigns &amp; Pass Bookings
            </h2>
            <p className="text-gray-300 text-sm max-w-2xl">
              Direct access to KHB exclusive international delegations, premium festivals, and specialized booking channels.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publishedPages.map((page) => (
            <div
              key={page.id}
              className="group rounded-3xl bg-[#0C1912] border border-emerald-900/50 overflow-hidden hover:border-emerald-500/60 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-emerald-950/50"
            >
              <div>
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={page.heroImage || '/images/events/photo_2026-09-16_22-01-09.jpg'}
                    alt={page.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C1912] via-transparent to-transparent" />
                  
                  {page.badge && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-black bg-amber-400 px-3 py-1 rounded-full shadow-md">
                        <Award className="w-3 h-3" />
                        {page.badge}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-emerald-300 font-medium">
                    <span className="bg-black/60 backdrop-blur-sm px-2.5 py-0.5 rounded-md">
                      {page.category}
                    </span>
                    {page.eventDate && (
                      <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-amber-300">
                        <Calendar className="w-3 h-3" />
                        {page.eventDate}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                    {page.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 line-clamp-3 leading-relaxed">
                    {page.heroSubheadline || page.description}
                  </p>

                  {page.venue && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{page.venue}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link
                  href={`/${page.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-900 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 border border-emerald-700/50 text-emerald-200 text-xs font-bold uppercase tracking-wider group-hover:text-white transition-all shadow-md"
                >
                  <span>Explore Campaign &amp; Passes</span>
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
