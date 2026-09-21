'use client';

import React, { useState } from 'react';
import { Calculator, Check, ArrowRight, Sparkles } from 'lucide-react';

interface EstimatorProps {
  onApplyEstimate?: (details: {
    eventType: string;
    guestCount: string;
    estimatedBudget: string;
    specs: string[];
  }) => void;
}

export default function InteractiveEstimator({ onApplyEstimate }: EstimatorProps) {
  const [eventType, setEventType] = useState('Corporate Gala / Annual Dinner');
  const [scale, setScale] = useState('300 - 600 guests');
  const [options, setOptions] = useState<string[]>([
    'High-Res 4K LED Screen Wall',
    'Concert Line-Array Audio System',
    'Intelligent Moving Lighting & Trusses'
  ]);

  const toggleOption = (opt: string) => {
    if (options.includes(opt)) {
      setOptions(options.filter((o) => o !== opt));
    } else {
      setOptions([...options, opt]);
    }
  };

  const calculateEstimate = () => {
    let base = 3500;
    if (eventType.includes('Concert')) base = 9000;
    if (eventType.includes('Expo')) base = 5000;
    if (eventType.includes('Wedding')) base = 4000;

    if (scale.includes('150 - 300')) base *= 1.2;
    if (scale.includes('300 - 600')) base *= 1.6;
    if (scale.includes('600 - 1,500')) base *= 2.4;
    if (scale.includes('1,500+')) base *= 4.0;

    base += options.length * 800;

    const min = Math.round(base / 500) * 500;
    const max = Math.round((base * 1.35) / 500) * 500;
    return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  };

  const estimatedBudget = calculateEstimate();

  const handleApply = () => {
    if (onApplyEstimate) {
      onApplyEstimate({
        eventType,
        guestCount: scale,
        estimatedBudget,
        specs: options
      });
    }
    const form = document.getElementById('inquiry-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="estimator" className="py-20 bg-[#08130E] relative border-y border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/50 border border-amber-800/40 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5" />
            Instant Budget Estimator
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Plan Your Event Production In 60 Seconds
          </h2>
          <p className="text-sm text-gray-300">
            Configure your event requirements below to get an immediate estimated production guideline and customized equipment proposal.
          </p>
        </div>

        <div className="max-w-4xl mx-auto rounded-3xl bg-[#0C1A13] border border-emerald-800/40 p-6 sm:p-10 shadow-2xl">
          <div className="space-y-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3">
                1. Select Event Type
              </label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  'Corporate Gala / Annual Dinner',
                  'Music Concert & Festival',
                  'Trade Expo & Booths',
                  'Product Launch / Luxury Reveal'
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEventType(type)}
                    className={`text-left p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      eventType === type
                        ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                        : 'bg-[#09150F] border-emerald-900/40 text-gray-300 hover:border-emerald-700/60'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3">
                2. Expected Audience / Guests
              </label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  '50 - 150 guests',
                  '150 - 300 guests',
                  '300 - 600 guests',
                  '600 - 1,500+ guests'
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    className={`text-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      scale === s
                        ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                        : 'bg-[#09150F] border-emerald-900/40 text-gray-300 hover:border-emerald-700/60'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3">
                3. Equipment &amp; Technical Specs (Select All Required)
              </label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  'High-Res 4K LED Screen Wall',
                  'Concert Line-Array Audio System',
                  'Intelligent Moving Lighting & Trusses',
                  'Custom 3D Themed Stage Build',
                  'Multi-Cam Live Broadcast & Streaming',
                  'VIP Red Carpet & Photo Backdrop Zone',
                  'Professional MC & Guest Artist Booking',
                  'Special Effects (Haze, Sparklers, Confetti)'
                ].map((opt) => {
                  const selected = options.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleOption(opt)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-emerald-900/50 border-emerald-400 text-white'
                          : 'bg-[#09150F] border-emerald-900/30 text-gray-400 hover:border-emerald-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                        selected ? 'bg-amber-400 border-amber-400 text-black' : 'border-gray-600'
                      }`}>
                        {selected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-medium">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-[#0A2217] to-emerald-950 border border-emerald-600/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="text-center sm:text-left space-y-1">
                <div className="text-xs uppercase tracking-widest text-emerald-300 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Estimated Production Guideline
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight">
                  {estimatedBudget}
                </div>
                <p className="text-[11px] text-gray-400">
                  Includes full technician crew, transportation, rigging, safety permits &amp; rehearsal.
                </p>
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <span>Lock In Estimate &amp; Get Proposal</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
