'use client';

import React from 'react';
import { 
  Building2, 
  Music2, 
  Store, 
  MonitorCheck, 
  Sparkles, 
  TicketCheck, 
  ArrowUpRight 
} from 'lucide-react';

const services = [
  {
    icon: Building2,
    title: 'Corporate Galas & Annual Dinners',
    desc: 'Bespoke event themes, VIP red carpet protocol, awards trophies, stage rundown choreography, and multi-camera live broadcast.',
    badge: 'Enterprise Choice',
    tag: '50 - 2,500 Guests'
  },
  {
    icon: Music2,
    title: 'Concerts & Mega Music Festivals',
    desc: 'Heavy-duty certified truss staging, high-power line-array acoustic arrays, moving beam lightshows, and special effects pyrotechnics.',
    badge: 'Stadium Scale',
    tag: 'Up to 50,000+ Crowd'
  },
  {
    icon: Store,
    title: 'Exhibitions & Custom Booth Fabrication',
    desc: 'Modular and wooden bespoke booth design, turnkey electrical distribution, banner printing, and attendee badge systems.',
    badge: 'Trade & Expo',
    tag: 'Koh Pich & Koh Norea'
  },
  {
    icon: MonitorCheck,
    title: 'Indoor & Outdoor 4K LED Screens',
    desc: 'High-refresh P2.6, P2.9, and P3.9 LED panels with curved rigging, Novastar controllers, visual switching, and live camera integration.',
    badge: 'Crystal Clear',
    tag: 'Over 300+ sqm Inventory'
  },
  {
    icon: Sparkles,
    title: 'B2B Trade Delegations & Business Summits',
    desc: 'Curated bilateral trade trips, pre-arranged 1-on-1 enterprise match-making, 5-star logistics, and bilingual business interpreters.',
    badge: 'International',
    tag: 'Vietnam, China, ASEAN'
  },
  {
    icon: TicketCheck,
    title: 'Smart Ticketing & Onsite Registration',
    desc: 'High-speed QR code e-ticketing, automated wristband scanners, delegate check-in kiosks, and real-time attendance analytics.',
    badge: 'Digital Tech',
    tag: 'Instant Scanning'
  }
];

export default function ServicesGrid() {
  return (
    <section id="services" className="py-20 bg-[#070D0A] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full">
            Complete Turnkey Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            End-To-End Event Production Services
          </h2>
          <p className="text-gray-300 text-sm sm:text-base">
            Whether organizing an intimate VIP summit or a massive public festival across Cambodia, our in-house engineering and production team handles every detail with perfection.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group relative rounded-2xl bg-[#0B1711] border border-emerald-900/40 p-7 hover:border-emerald-500/50 hover:bg-[#0E1F17] transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-950/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-900/80 to-emerald-950 border border-emerald-700/50 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:text-amber-300 transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-emerald-950/80 flex items-center justify-between text-xs text-gray-400">
                  <span className="font-medium text-emerald-400/80">{item.tag}</span>
                  <a
                    href="#inquiry-form"
                    className="inline-flex items-center gap-1 font-semibold text-amber-400 group-hover:text-amber-300"
                  >
                    <span>Inquire</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
