'use client';

import React from 'react';
import { Star, Quote, Building } from 'lucide-react';

const testimonials = [
  {
    name: 'Dara Pich',
    role: 'Head of Marketing & Corporate Affairs',
    company: 'Leading Commercial Bank Cambodia',
    quote: 'KHB Events handled our 15th Anniversary Mega Gala with over 1,200 attendees at Koh Pich. The staging was immaculate, audio clarity was outstanding, and their stage director kept the entire 4-hour live broadcast running without a second of delay.',
    stars: 5
  },
  {
    name: 'Channary Seng',
    role: 'Country Director',
    company: 'FMCG Regional Distribution Brand',
    quote: 'From designing our 18-booth expo pavilion to managing attendee flow and VIP ribbon cutting, KHB Events demonstrated sheer professionalism. They are our permanent event production partner in Cambodia.',
    stars: 5
  },
  {
    name: 'Vong Socheat',
    role: 'Executive Vice President',
    company: 'Cambodia Tech & Investment Summit',
    quote: 'Finding a production team in Phnom Penh that understands curved 4K LED mapping and complex multi-lingual audio translation used to be difficult until we hired KHB. Outstanding execution!',
    stars: 5
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-[#060D09] relative border-t border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full">
            Client Confidence
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Endorsed by Industry Leaders
          </h2>
          <p className="text-xs sm:text-sm text-gray-300">
            Hear directly from enterprise directors and brand leaders who trust KHB EVENTS.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#0A1811] border border-emerald-900/40 p-7 flex flex-col justify-between hover:border-emerald-700/50 transition-colors relative group"
            >
              <Quote className="w-8 h-8 text-emerald-800/60 mb-4 group-hover:text-amber-400/40 transition-colors" />
              
              <p className="text-xs sm:text-sm text-gray-300 italic leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="font-bold text-white text-sm">{t.name}</div>
                <div className="text-xs text-amber-300/80 font-medium">{t.role}</div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Building className="w-3 h-3 text-emerald-400" />
                  <span>{t.company}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
