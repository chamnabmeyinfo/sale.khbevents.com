'use client';

import React, { useState } from 'react';
import { Camera, MapPin } from 'lucide-react';

const galleryItems = [
  {
    image: '/images/events/photo_2026-09-16_22-01-09 (2).jpg',
    title: 'Smart City & Commercial Forum Stage',
    location: 'B2B Summit Hall',
    category: 'Exhibitions & Conferences'
  },
  {
    image: '/images/events/photo_2026-09-16_22-01-09 (3).jpg',
    title: 'VIP Delegate Bilateral Discussion',
    location: 'Grand Ballroom',
    category: 'Trade Delegations'
  },
  {
    image: '/images/events/photo_2026-09-16_22-01-09 (4).jpg',
    title: 'Agricultural & Tea Technology Pavilion',
    location: 'Exhibition Hall',
    category: 'Exhibitions & Conferences'
  },
  {
    image: '/images/events/photo_2026-09-16_22-01-09 (5).jpg',
    title: 'Enterprise MoU Signing Ceremony',
    location: 'Diamond Island (Koh Pich)',
    category: 'Corporate Events'
  },
  {
    image: '/images/events/photo_2026-09-16_22-01-09 (6).jpg',
    title: 'Celebrity Gala & Production Showcase',
    location: 'Koh Norea Waterfront',
    category: 'Concerts & Galas'
  },
  {
    image: '/images/events/photo_2026-09-16_22-01-09 (7).jpg',
    title: 'Executive Round-table & Networking Banquet',
    location: '5-Star Ballroom, Phnom Penh',
    category: 'Corporate Events'
  }
];

const categories = ['ALL', 'Corporate Events', 'Concerts & Galas', 'Exhibitions & Conferences', 'Trade Delegations'];

export default function PortfolioGallery() {
  const [activeCategory, setActiveCategory] = useState('ALL');

  const filtered = activeCategory === 'ALL'
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <section id="portfolio" className="py-20 bg-[#08130E] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/50 border border-amber-800/40 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            Visual Production Portfolio
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Proven Track Record of Excellence
          </h2>
          <p className="text-sm text-gray-300">
            Browse glimpses of prestigious high-profile events produced, managed, and staged by the KHB Events team.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                    : 'bg-emerald-950/60 text-gray-300 border border-emerald-800/40 hover:border-emerald-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl overflow-hidden bg-[#0a1610] border border-emerald-900/40 shadow-lg aspect-[4/3]"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09150E] via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
              
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-1 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-black/70 px-2 py-0.5 rounded">
                  {item.category}
                </span>
                <h3 className="text-base font-bold text-white leading-tight">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-emerald-300/80 pt-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{item.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
