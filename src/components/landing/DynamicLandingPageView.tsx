'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import FloatingContact from './FloatingContact';
import Footer from './Footer';
import LeadForm from './LeadForm';
import { LandingPage, SystemSettings } from '@/lib/types';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Award, 
  Sparkles, 
  ArrowRight, 
  ChevronDown, 
  Star,
  CheckCircle2
} from 'lucide-react';

interface DynamicLandingPageViewProps {
  page: LandingPage;
  settings: SystemSettings;
}

export default function DynamicLandingPageView({ page, settings }: DynamicLandingPageViewProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: page.slug,
        referrer: typeof document !== 'undefined' ? document.referrer : ''
      })
    }).catch(() => {});

    if (page.countdownEnabled && page.eventDate) {
      const targetTime = new Date(`${page.eventDate}T09:00:00`).getTime();

      const updateCountdown = () => {
        const now = new Date().getTime();
        const diff = targetTime - now;

        if (diff > 0) {
          setTimeLeft({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000)
          });
        } else {
          setTimeLeft(null);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [page.slug, page.countdownEnabled, page.eventDate]);

  const handleSelectTier = (tierName: string, price: string) => {
    setSelectedPackage(`${tierName} (${price})`);
    const formElement = document.getElementById('booking-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070D0A] text-gray-100 flex flex-col selection:bg-amber-400 selection:text-black">
      <Navbar phone={settings.phone} whatsapp={settings.whatsappNumber} />

      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 border-b border-emerald-900/30">
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-emerald-900/20 via-transparent to-transparent pointer-events-none -z-10" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                {page.badge && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>{page.badge}</span>
                  </div>
                )}

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.2]">
                  {page.heroHeadline || page.title}
                </h1>

                <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl">
                  {page.heroSubheadline || page.subtitle || page.description}
                </p>

                {(page.eventDate || page.venue) && (
                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-emerald-200">
                    {page.eventDate && (
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span><strong>Date:</strong> {page.eventDate} {page.eventTime && `(${page.eventTime})`}</span>
                      </div>
                    )}
                    {page.venue && (
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span><strong>Venue:</strong> {page.venue}</span>
                      </div>
                    )}
                  </div>
                )}

                {timeLeft && (
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Registration Window Closes In:</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2.5 max-w-xs text-center">
                      <div className="p-2.5 rounded-xl bg-[#09150F] border border-emerald-800/60">
                        <div className="text-xl font-black text-white">{timeLeft.days}</div>
                        <div className="text-[9px] uppercase tracking-wider text-gray-400">Days</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#09150F] border border-emerald-800/60">
                        <div className="text-xl font-black text-white">{timeLeft.hours}</div>
                        <div className="text-[9px] uppercase tracking-wider text-gray-400">Hours</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#09150F] border border-emerald-800/60">
                        <div className="text-xl font-black text-white">{timeLeft.minutes}</div>
                        <div className="text-[9px] uppercase tracking-wider text-gray-400">Mins</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#09150F] border border-emerald-800/60">
                        <div className="text-xl font-black text-amber-400">{timeLeft.seconds}</div>
                        <div className="text-[9px] uppercase tracking-wider text-gray-400">Secs</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                  <a
                    href="#booking-form"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 shadow-xl shadow-amber-500/20 transition-all"
                  >
                    <span>{page.heroCtaText || 'Secure Your Pass'}</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </a>
                  {page.packages && page.packages.length > 0 && (
                    <a
                      href="#packages"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-xs text-emerald-200 bg-[#0C1B13] border border-emerald-800/60 hover:bg-[#12261b] transition-all"
                    >
                      <span>View Pricing &amp; Tiers</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative rounded-3xl overflow-hidden border border-emerald-700/50 shadow-2xl group">
                  <img
                    src={page.heroImage || '/images/events/photo_2026-09-16_22-01-09.jpg'}
                    alt={page.title}
                    className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070D0A] via-transparent to-transparent" />
                  
                  {page.venueAddress && (
                    <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-xs text-gray-200">
                      <div className="font-bold text-amber-400">Official Location:</div>
                      <div className="text-[11px] text-gray-300">{page.venueAddress}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {page.highlights && page.highlights.length > 0 && (
          <section className="py-20 bg-[#08130E]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full">
                  Program Highlights
                </span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  What Makes This Program Unrivaled
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {page.highlights.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="rounded-2xl bg-[#0B1A12] border border-emerald-900/50 p-6 space-y-3 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-amber-400 font-bold">
                      0{i + 1}
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {h.title}
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {h.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {page.packages && page.packages.length > 0 && (
          <section id="packages" className="py-20 bg-[#060B08] relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full">
                  Participation Options
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Select Your Delegate Pass
                </h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Transparent, all-inclusive pricing with complete corporate invoicing support.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {page.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`rounded-3xl p-7 flex flex-col justify-between transition-all relative ${
                      pkg.popular
                        ? 'bg-gradient-to-b from-[#10291D] to-[#0A1A12] border-2 border-amber-400 shadow-2xl shadow-amber-500/10 scale-105 z-10'
                        : 'bg-[#0B1711] border border-emerald-900/50 hover:border-emerald-700/50'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-1 rounded-full shadow-lg">
                          <Sparkles className="w-3.5 h-3.5" />
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="text-xs text-gray-400 min-h-[32px]">{pkg.description}</p>
                      )}

                      <div className="pt-2 pb-4 border-b border-emerald-950">
                        <div className="text-3xl sm:text-4xl font-black text-amber-400">
                          {pkg.price}
                        </div>
                        {pkg.period && (
                          <div className="text-xs text-gray-400 mt-0.5">{pkg.period}</div>
                        )}
                      </div>

                      <div className="space-y-2.5 pt-2">
                        <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                          Package Inclusions:
                        </div>
                        {pkg.features.map((f, fi) => (
                          <div key={fi} className="flex items-start gap-2.5 text-xs text-gray-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8">
                      <button
                        type="button"
                        onClick={() => handleSelectTier(pkg.name, pkg.price)}
                        className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          pkg.popular
                            ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-500/20'
                            : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/50'
                        }`}
                      >
                        {pkg.ctaText || 'Select This Pass'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {page.gallery && page.gallery.length > 0 && (
          <section className="py-20 bg-[#08120D] border-t border-emerald-900/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full">
                  Visual Highlights
                </span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  Inside The Event Experience
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {page.gallery.map((img, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden aspect-[4/3] bg-black/40 border border-emerald-900/40 group">
                    <img
                      src={img}
                      alt={`Gallery ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {page.testimonials && page.testimonials.length > 0 && (
          <section className="py-20 bg-[#060D09]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-3 mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full">
                  Participant Feedback
                </span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  What Previous Attendees Say
                </h2>
              </div>

              <div className="space-y-6">
                {page.testimonials.map((t, i) => (
                  <div
                    key={t.id || i}
                    className="rounded-2xl bg-[#0A1811] border border-emerald-900/40 p-6 sm:p-8 space-y-4"
                  >
                    <div className="flex items-center gap-1">
                      {[...Array(t.rating || 5)].map((_, si) => (
                        <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-300 italic leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div>
                      <div className="font-bold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-amber-300">{t.role} &mdash; {t.company}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div id="booking-form">
          <LeadForm
            landingPageSlug={page.slug}
            landingPageTitle={page.title}
            headline={page.formConfig?.headline || 'Reserve Your Registration / Inquire'}
            subheadline={page.formConfig?.subheadline || 'Submit your information below and our team will get in touch.'}
            submitButtonText={page.formConfig?.submitButtonText || 'Submit Reservation'}
            successMessage={page.formConfig?.successMessage || 'Thank you! Your registration has been received.'}
            prefillData={{
              packageInterest: selectedPackage
            }}
          />
        </div>

        {page.faqs && page.faqs.length > 0 && (
          <section className="py-20 bg-[#070D0A]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-3 mb-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Campaign Questions &amp; Answers
                </h2>
              </div>

              <div className="space-y-3">
                {page.faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={faq.id || idx}
                      className="rounded-2xl bg-[#0B1912] border border-emerald-900/40 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-bold text-white hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown className={`w-4 h-4 text-amber-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-emerald-950 pt-3">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <FloatingContact
        whatsappNumber={settings.whatsappNumber}
        telegramUsername={settings.telegramUsername}
        phone={settings.phone}
      />

      <Footer
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
      />
    </div>
  );
}
