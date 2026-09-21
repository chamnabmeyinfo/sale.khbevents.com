'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const defaultFaqs = [
  {
    q: 'Why choose KHB EVENTS over renting separate equipment vendors?',
    a: 'KHB EVENTS is a unified turnkey agency. Instead of managing 5 different vendors for sound, LED, lighting, stage fabrication, and event staff, we own the inventory and in-house technical crew. This guarantees synchronized cueing, zero finger-pointing, and significant cost savings.'
  },
  {
    q: 'Do you provide 3D visual stage mockups before we sign?',
    a: 'Yes! Upon initial requirement briefing, our CAD designers create realistic 3D renderings of the stage, seating layout, entrance photobooth, and lighting perspective so your leadership team can visualize the experience beforehand.'
  },
  {
    q: 'Can you handle events outside Phnom Penh (e.g. Siem Reap, Sihanoukville)?',
    a: 'Absolutely. We operate transport fleets and mobile staging crews that regularly produce galas, beach festivals, and summits across Siem Reap, Sihanoukville, Kampot, and border provinces.'
  },
  {
    q: 'What is your payment and booking confirmation terms?',
    a: 'Typically, a 50% deposit secures equipment reservation, technical crew, and venue prep, with the balance scheduled prior to event load-in. Official VAT invoices and contracts are provided for corporate compliance.'
  },
  {
    q: 'How fast can you mobilize for an urgent event?',
    a: 'Our emergency mobilization team has successfully deployed full ballroom LED & audio-visual productions within 48 hours notice. Contact our hotline or WhatsApp directly for rush inquiries.'
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-[#070D0A] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Clear answers on how we plan, price, and execute world-class events in Cambodia.
          </p>
        </div>

        <div className="space-y-4">
          {defaultFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-[#0C1912] border border-emerald-900/40 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-white hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-amber-400 transition-transform duration-300 shrink-0 ml-4 ${
                      isOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-emerald-950/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
