'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import FloatingContact from './FloatingContact';
import Footer from './Footer';
import LeadForm from './LeadForm';
import { LandingPage, SystemSettings } from '@/lib/types';
import LandingPageTracking from '@/components/common/LandingPageTracking';
import PagePasswordGate from '@/components/common/PagePasswordGate';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Award, 
  Sparkles, 
  ArrowRight, 
  ChevronDown, 
  Star,
  CheckCircle2,
  TrendingDown,
  Users,
  ShieldCheck,
  Zap,
  Coffee,
  Check,
  Building2,
  Tag,
  Mic,
  Music,
  Store,
  Layers
} from 'lucide-react';

interface DynamicLandingPageViewProps {
  page: LandingPage;
  settings: SystemSettings;
}

export default function DynamicLandingPageView({ page, settings }: DynamicLandingPageViewProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeDayTab, setActiveDayTab] = useState<number>(0);

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (page.countdownEnabled && (page.eventDate || page.urgency?.earlyBirdDeadline)) {
      const targetString = page.urgency?.earlyBirdDeadline || `${page.eventDate}T09:00:00`;
      const targetTime = new Date(targetString).getTime();

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
  }, [page.countdownEnabled, page.eventDate, page.urgency?.earlyBirdDeadline]);

  const handleSelectTier = (tierName: string, price: string) => {
    setSelectedPackage(`${tierName} (${price})`);
    const formElement = document.getElementById('booking-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isVisible = (sectionKey: string) => {
    if (!page.sectionVisibility) return true;
    return (page.sectionVisibility as any)[sectionKey] !== false;
  };

  const totalSeats = page.urgency?.totalSeats || 30;
  const claimedSeats = page.urgency?.claimedSeats || 19;
  const seatsRemaining = Math.max(0, totalSeats - claimedSeats);

  const effPhone = page?.isolatedSettings?.phone || settings?.phone;
  const effWhatsapp = page?.isolatedSettings?.whatsapp || settings?.whatsappNumber;
  const effTelegramUsername = page?.isolatedSettings?.telegramUsername || settings?.telegramUsername;

  return (
    <PagePasswordGate page={page}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070D0A] text-slate-900 dark:text-gray-100 flex flex-col selection:bg-amber-400 selection:text-black transition-colors">
        <LandingPageTracking page={page} />
        <Navbar phone={effPhone} whatsapp={effWhatsapp} />

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        {isVisible('hero') && (
          <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200 dark:border-emerald-900/30">
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-emerald-500/10 dark:from-emerald-900/20 via-transparent to-transparent pointer-events-none -z-10" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-6">
                  {page.badge && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider shadow-sm">
                      <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span>{page.badge}</span>
                    </div>
                  )}

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.2]">
                    {page.heroHeadline || page.title}
                  </h1>

                  <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                    {page.heroSubheadline || page.subtitle || page.description}
                  </p>

                  {(page.eventDate || page.venue) && (
                    <div className="flex flex-wrap gap-3 pt-1 text-xs text-emerald-800 dark:text-emerald-200">
                      {page.eventDate && (
                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                          <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                          <span><strong>Date:</strong> {page.eventDate} {page.eventTime && `(${page.eventTime})`}</span>
                        </div>
                      )}
                      {page.venue && (
                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                          <MapPin className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                          <span><strong>Venue:</strong> {page.venue}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {timeLeft && (
                    <div className="pt-2">
                      <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Registration Window Closes In:</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2.5 max-w-xs text-center">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#09150F] border border-slate-200 dark:border-emerald-800/60 shadow-sm">
                          <div className="text-xl font-black text-slate-900 dark:text-white">{timeLeft.days}</div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Days</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#09150F] border border-slate-200 dark:border-emerald-800/60 shadow-sm">
                          <div className="text-xl font-black text-slate-900 dark:text-white">{timeLeft.hours}</div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Hours</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#09150F] border border-slate-200 dark:border-emerald-800/60 shadow-sm">
                          <div className="text-xl font-black text-slate-900 dark:text-white">{timeLeft.minutes}</div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Mins</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#09150F] border border-slate-200 dark:border-emerald-800/60 shadow-sm">
                          <div className="text-xl font-black text-amber-600 dark:text-amber-400">{timeLeft.seconds}</div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Secs</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex flex-col sm:flex-row items-center gap-4">
                    <a
                      href={page.heroCtaLink || '#booking-form'}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <span>{page.heroCtaText || 'Secure Your Pass'}</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </a>
                    {page.packages && page.packages.length > 0 && (
                      <a
                        href="#packages"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-xs text-slate-800 dark:text-emerald-200 bg-slate-100 dark:bg-[#0C1B13] border border-slate-200 dark:border-emerald-800/60 hover:bg-slate-200 dark:hover:bg-[#12261b] transition-all cursor-pointer shadow-sm"
                      >
                        <span>View Pricing &amp; Tiers</span>
                      </a>
                    )}
                  </div>

                  {page.urgency?.riskNote && (
                    <div className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-2 pt-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>{page.urgency.riskNote}</span>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5">
                  <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-emerald-700/50 shadow-2xl group">
                    <img
                      src={page.heroImage || '/photos/photo_2026-09-16_22-01-09 (2).jpg'}
                      alt={page.title}
                      className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 dark:from-[#070D0A] via-transparent to-transparent" />
                    
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
        )}

        {/* 2. URGENCY & SEATS STRIP */}
        {isVisible('urgency') && page.urgency && (
          <section className="py-6 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border-b border-slate-200 dark:border-emerald-900/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-800 dark:text-emerald-200 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>
                  {page.urgency.noticeText || `Limited Cohort: Only ${seatsRemaining} seats remaining out of ${totalSeats}.`}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                {page.urgency.earlyBirdPrice && (
                  <div className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black font-extrabold shadow-sm">
                    Early Bird: ${page.urgency.earlyBirdPrice}
                  </div>
                )}
                {page.urgency.regularPrice && (
                  <div className="text-slate-500 dark:text-gray-400 line-through">
                    Standard: ${page.urgency.regularPrice}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 3. CORE VALUES FIRST */}
        {isVisible('coreValues') && page.coreValues && page.coreValues.length > 0 && (
          <section className="py-20 bg-white dark:bg-[#08130E] border-b border-slate-200 dark:border-emerald-900/30 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full shadow-sm">
                  Core Value First
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  What This Delegation Buys Your Business
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                  Four fundamental commercial outcomes no online search or middleman can ever deliver.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {page.coreValues.map((cv, i) => (
                  <div
                    key={cv.id || i}
                    className="rounded-2xl bg-slate-50 dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/50 p-6 space-y-3 hover:border-amber-400/50 transition-colors shadow-sm relative group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-black font-extrabold flex items-center justify-center text-sm shadow-md">
                      {cv.num || `0${i + 1}`}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {cv.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                      {cv.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. PROBLEMS & PAIN POINTS */}
        {isVisible('problems') && page.problems && page.problems.length > 0 && (
          <section className="py-20 bg-slate-50 dark:bg-[#060D09] border-b border-slate-200 dark:border-emerald-900/30 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 px-3 py-1 rounded-full shadow-sm">
                  The Real Cost of Sourcing Alone
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Why Importers Who Source Online Pay Up to 35% More
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                  Screenshots can&apos;t negotiate prices. Photos can&apos;t verify factory quality.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {page.problems.map((p, i) => (
                  <div
                    key={p.id || i}
                    className="rounded-2xl bg-white dark:bg-[#0A1811] border border-rose-200/60 dark:border-rose-900/30 p-6 space-y-3 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. TARGET AUDIENCE / WHO SHOULD ATTEND */}
        {isVisible('audiences') && page.audiences && page.audiences.length > 0 && (
          <section className="py-20 bg-white dark:bg-[#08130E] border-b border-slate-200 dark:border-emerald-900/30 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full shadow-sm">
                  Curated Cohort
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Who Should Join This Delegation?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                  Engineered specifically for business owners seeking direct factory sources and high-margin products.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {page.audiences.map((aud, i) => (
                  <div
                    key={aud.id || i}
                    className="rounded-2xl bg-slate-50 dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/50 p-6 space-y-3 shadow-sm hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      {aud.tag && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800/50">
                          {aud.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {aud.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                      {aud.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 6. PROGRAM HIGHLIGHTS */}
        {isVisible('highlights') && page.highlights && page.highlights.length > 0 && (
          <section className="py-20 bg-slate-50 dark:bg-[#060D09] border-b border-slate-200 dark:border-emerald-900/30 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full shadow-sm">
                  Program Highlights
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  What Makes This Program Unrivaled
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {page.highlights.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="rounded-2xl bg-white dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/50 p-6 space-y-3 hover:border-emerald-500/40 transition-colors shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800/60 flex items-center justify-center text-amber-500 dark:text-amber-400 font-bold shadow-sm">
                      0{i + 1}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {h.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                      {h.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 6B. KEYNOTE SPEAKERS & PANELISTS (Corporate Summit) */}
        {isVisible('speakers') && page.speakers && page.speakers.length > 0 && (
          <section className="py-20 bg-white dark:bg-[#07130D] border-b border-slate-200 dark:border-emerald-900/30 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full shadow-sm inline-flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  Distinguished Keynotes
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Featured Speakers &amp; Panelists
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                  Hear directly from premier industry leaders, policy shapers, and corporate enterprise decision-makers.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {page.speakers.map((speaker, i) => (
                  <div
                    key={speaker.id || i}
                    className="rounded-3xl bg-slate-50 dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/50 p-6 flex flex-col justify-between hover:border-amber-400/50 transition-all shadow-sm group"
                  >
                    <div>
                      <div className="relative rounded-2xl overflow-hidden aspect-square mb-4 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-emerald-950">
                        <img
                          src={speaker.avatar || '/photos/photo_2026-09-16_22-01-09 (2).jpg'}
                          alt={speaker.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {speaker.track && (
                          <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider bg-black/75 backdrop-blur-md text-amber-400 px-2.5 py-1 rounded-full border border-amber-400/30">
                            {speaker.track}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                        {speaker.name}
                      </h3>
                      <p className="text-xs text-amber-600 dark:text-amber-300 font-medium mt-0.5">
                        {speaker.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                        {speaker.organization}
                      </p>
                      {speaker.topic && (
                        <div className="mt-4 p-3 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/40 text-xs">
                          <span className="font-bold text-slate-800 dark:text-gray-200 block mb-0.5">Session Topic:</span>
                          <span className="text-slate-600 dark:text-gray-400 italic">&ldquo;{speaker.topic}&rdquo;</span>
                        </div>
                      )}
                    </div>
                    {speaker.sessionTime && (
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-emerald-950/60 flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{speaker.sessionTime}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 6C. ARTIST & PERFORMER LINEUP (Concerts & Festivals) */}
        {isVisible('artists') && page.artists && page.artists.length > 0 && (
          <section className="py-20 bg-slate-900 text-white relative overflow-hidden border-b border-emerald-900/40">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-emerald-950/40 pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full shadow-sm inline-flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" />
                  Live Entertainment
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Official Artist &amp; Performer Lineup
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  World-class sound staging, festival lighting, and electric live performances.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {page.artists.map((artist, i) => (
                  <div
                    key={artist.id || i}
                    className="rounded-3xl bg-black/60 backdrop-blur-md border border-white/10 overflow-hidden hover:border-amber-400/60 transition-all shadow-xl group flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={artist.image || '/photos/photo_2026-09-16_22-01-09 (6).jpg'}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                        {artist.stageName && (
                          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-black px-2.5 py-0.5 rounded-full shadow">
                            {artist.stageName}
                          </span>
                        )}
                        {artist.stageTime && (
                          <span className="absolute bottom-3 left-3 text-[11px] font-mono font-bold bg-black/80 backdrop-blur-md text-amber-300 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {artist.stageTime}
                          </span>
                        )}
                      </div>
                      <div className="p-5 space-y-2">
                        <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                          {artist.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-amber-400">{artist.role}</span>
                          {artist.genre && (
                            <>
                              <span className="text-gray-500">•</span>
                              <span className="text-xs text-gray-400">{artist.genre}</span>
                            </>
                          )}
                        </div>
                        {artist.bio && (
                          <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed pt-1">
                            {artist.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="p-5 pt-0">
                      <a
                        href="#booking-form"
                        className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Get VIP Access</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 7. ITINERARY & AGENDA */}
        {isVisible('itinerary') && page.itinerary && page.itinerary.length > 0 && (
          <section className="py-20 bg-white dark:bg-[#08130E] border-b border-slate-200 dark:border-emerald-900/30 transition-colors">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full shadow-sm">
                  Full Schedule
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Curated Business Itinerary
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                  Balanced agenda packed with expo discovery, direct factory tours, and bilateral matchmaking.
                </p>
              </div>

              {/* Day Tabs */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {page.itinerary.map((day, dIdx) => (
                  <button
                    key={day.id || dIdx}
                    type="button"
                    onClick={() => setActiveDayTab(dIdx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeDayTab === dIdx
                        ? 'bg-amber-400 text-black shadow-md'
                        : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-emerald-900/50'
                    }`}
                  >
                    <span>Day {day.day}: {day.date}</span>
                  </button>
                ))}
              </div>

              {/* Active Day Details */}
              {page.itinerary[activeDayTab] && (
                <div className="rounded-3xl bg-slate-50 dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/50 p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="border-b border-slate-200 dark:border-emerald-900/40 pb-4">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                      Day {page.itinerary[activeDayTab].day} &bull; {page.itinerary[activeDayTab].date}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {page.itinerary[activeDayTab].title}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {(page.itinerary[activeDayTab].events || []).map((ev, evIdx) => (
                      <div key={evIdx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/40 text-xs">
                        <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono font-bold shrink-0">
                          {ev.time}
                        </span>
                        <div className="flex-1 text-slate-800 dark:text-gray-200 font-medium">
                          {ev.activity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 8. VALUE STACK (9-IN-1) */}
        {isVisible('valueStack') && page.valueStack && page.valueStack.inclusions?.length > 0 && (
          <section className="py-20 bg-slate-50 dark:bg-[#060D09] border-b border-slate-200 dark:border-emerald-900/30 transition-colors">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full shadow-sm">
                  {page.valueStack.tag || 'Value Stack'}
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {page.valueStack.title || 'One Price. Nine Things Fully Handled.'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                  {page.valueStack.subtitle || 'Everything below is included in your seat. Arrange each yourself and it would cost far more.'}
                </p>
              </div>

              <div className="space-y-3">
                {page.valueStack.inclusions.map((inc, i) => (
                  <div
                    key={inc.id || i}
                    className="p-4 rounded-2xl bg-white dark:bg-[#0B1A12] border border-slate-200 dark:border-emerald-900/50 flex items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{inc.title}</div>
                        <div className="text-xs text-slate-500 dark:text-gray-400">{inc.desc}</div>
                      </div>
                    </div>
                    {inc.standalonePrice && (
                      <div className="text-xs text-slate-400 dark:text-gray-500 line-through shrink-0 font-mono">
                        ${inc.standalonePrice}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {page.valueStack.totalValue && (
                <div className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                      {page.valueStack.totalLabel || 'Total Standalone Value'}
                    </div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {page.valueStack.totalValue}
                    </div>
                  </div>
                  <a
                    href="#booking-form"
                    className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider shadow-md"
                  >
                    Claim Delegation Seat
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 8B. EXHIBITION BOOTHS (Trade Expo) */}
        {isVisible('expoBooths') && page.expoBooths && page.expoBooths.length > 0 && (
          <section id="expo-booths" className="py-20 bg-white dark:bg-[#07110C] border-b border-slate-200 dark:border-emerald-900/30 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 px-3 py-1 rounded-full shadow-sm inline-flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  Exhibitor Space Selection
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Exhibition Booth Tiers &amp; Floor Packages
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                  Turnkey shell scheme and raw space options engineered for maximum commercial foot traffic.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {page.expoBooths.map((booth) => {
                  const avail = booth.availableCount !== undefined ? booth.availableCount : 5;
                  const total = booth.totalCount || 10;
                  return (
                    <div
                      key={booth.id}
                      className={`rounded-3xl p-7 flex flex-col justify-between transition-all relative shadow-sm ${
                        booth.popular
                          ? 'bg-gradient-to-b from-amber-500/10 to-amber-500/5 dark:from-[#112D1F] dark:to-[#0A1A12] border-2 border-amber-500 dark:border-amber-400 shadow-xl scale-105 z-10'
                          : 'bg-white dark:bg-[#0B1711] border border-slate-200 dark:border-emerald-900/50 hover:border-emerald-500/50'
                      }`}
                    >
                      {booth.popular && (
                        <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-1 rounded-full shadow-lg">
                            <Sparkles className="w-3.5 h-3.5" />
                            High Footfall Corner
                          </span>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{booth.name}</h3>
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-slate-700 dark:text-emerald-300">
                            {booth.size}
                          </span>
                        </div>

                        {booth.location && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{booth.location}</span>
                          </div>
                        )}

                        <div className="pt-2 pb-4 border-b border-slate-100 dark:border-emerald-950">
                          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                            {booth.price}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-gray-400 mt-1 flex items-center justify-between">
                            <span>Availability:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {avail} / {total} booths remaining
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-emerald-950/80 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.max(10, Math.min(100, (avail / total) * 100))}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2.5 pt-2">
                          <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                            Booth Inclusions &amp; Fit-Out:
                          </div>
                          {booth.features.map((f, fi) => (
                            <div key={fi} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-gray-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-8">
                        <button
                          type="button"
                          onClick={() => handleSelectTier(booth.name, `${booth.size} - ${booth.price}`)}
                          className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            booth.popular
                              ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-500/20'
                              : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700/50 shadow-sm'
                          }`}
                        >
                          {booth.ctaText || 'Reserve This Booth'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 9. PACKAGES & PRICING */}
        {isVisible('packages') && page.packages && page.packages.length > 0 && (
          <section id="packages" className="py-20 bg-white dark:bg-[#060B08] relative transition-colors border-b border-slate-200 dark:border-emerald-900/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full shadow-sm">
                  Participation Options
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Select Your Delegate Pass
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                  Transparent, all-inclusive pricing with complete corporate invoicing support.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {page.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`rounded-3xl p-7 flex flex-col justify-between transition-all relative shadow-sm ${
                      pkg.popular
                        ? 'bg-gradient-to-b from-amber-500/10 to-amber-500/5 dark:from-[#10291D] dark:to-[#0A1A12] border-2 border-amber-500 dark:border-amber-400 shadow-xl dark:shadow-2xl dark:shadow-amber-500/10 scale-105 z-10'
                        : 'bg-white dark:bg-[#0B1711] border border-slate-200 dark:border-emerald-900/50 hover:border-emerald-500/50'
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
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="text-xs text-slate-500 dark:text-gray-400 min-h-[32px]">{pkg.description}</p>
                      )}

                      <div className="pt-2 pb-4 border-b border-slate-100 dark:border-emerald-950">
                        <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
                          {pkg.price}
                        </div>
                        {pkg.period && (
                          <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{pkg.period}</div>
                        )}
                      </div>

                      <div className="space-y-2.5 pt-2">
                        <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                          Package Inclusions:
                        </div>
                        {pkg.features.map((f, fi) => (
                          <div key={fi} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-gray-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
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
                            : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700/50 shadow-sm'
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

        {/* 10. PHOTO GALLERY */}
        {isVisible('gallery') && page.gallery && page.gallery.length > 0 && (
          <section className="py-20 bg-slate-50 dark:bg-[#08120D] border-b border-slate-200 dark:border-emerald-900/30 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full shadow-sm">
                  Visual Highlights
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Inside The Event Experience
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {page.gallery.map((img, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-emerald-900/40 group shadow-sm">
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

        {/* 11. TESTIMONIALS */}
        {isVisible('testimonials') && page.testimonials && page.testimonials.length > 0 && (
          <section className="py-20 bg-white dark:bg-[#060D09] border-b border-slate-200 dark:border-emerald-900/30 transition-colors">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-3 mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full shadow-sm">
                  Participant Feedback
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  What Previous Attendees Say
                </h2>
              </div>

              <div className="space-y-6">
                {page.testimonials.map((t, i) => (
                  <div
                    key={t.id || i}
                    className="rounded-2xl bg-slate-50 dark:bg-[#0A1811] border border-slate-200 dark:border-emerald-900/40 p-6 sm:p-8 space-y-4 shadow-sm"
                  >
                    <div className="flex items-center gap-1">
                      {[...Array(t.rating || 5)].map((_, si) => (
                        <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-gray-300 italic leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</div>
                      <div className="text-xs text-amber-600 dark:text-amber-300">{t.role} &mdash; {t.company}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 12. GUARANTEE & TRUST */}
        {isVisible('guarantee') && page.guarantee && page.guarantee.points?.length > 0 && (
          <section className="py-16 bg-slate-50 dark:bg-[#060D09] border-b border-slate-200 dark:border-emerald-900/30 transition-colors">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{page.guarantee.badge || '100% Risk Reversal Guarantee'}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {page.guarantee.title || 'Your Reservation is 100% Risk-Free'}
              </h2>

              {page.guarantee.subtitle && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 max-w-xl mx-auto">
                  {page.guarantee.subtitle}
                </p>
              )}

              <div className="grid sm:grid-cols-3 gap-3 text-left pt-2">
                {page.guarantee.points.map((pt, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-white dark:bg-[#0A1811] border border-slate-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-slate-700 dark:text-gray-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 13. LEAD CAPTURE FORM */}
        {isVisible('form') && (
          <div id="booking-form">
            <LeadForm
              landingPageSlug={page.slug}
              landingPageTitle={page.title}
              headline={page.formConfig?.headline || 'Reserve Your Registration / Inquire'}
              subheadline={page.formConfig?.subheadline || 'Submit your information below and our team will get in touch.'}
              submitButtonText={page.isolatedSettings?.customCtaText || page.formConfig?.submitButtonText || 'Submit Reservation'}
              successMessage={page.formConfig?.successMessage || 'Thank you! Your registration has been received.'}
              isolatedSettings={page.isolatedSettings}
              prefillData={{
                packageInterest: selectedPackage
              }}
            />
          </div>
        )}

        {/* 14. FAQS */}
        {isVisible('faqs') && page.faqs && page.faqs.length > 0 && (
          <section className="py-20 bg-white dark:bg-[#070D0A] transition-colors">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-3 mb-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-3">
                {page.faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={faq.id || idx}
                      className="rounded-2xl bg-slate-50 dark:bg-[#0B1912] border border-slate-200 dark:border-emerald-900/40 overflow-hidden shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown className={`w-4 h-4 text-amber-500 dark:text-amber-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-gray-300 leading-relaxed border-t border-slate-200 dark:border-emerald-950 pt-3">
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
        whatsappNumber={effWhatsapp}
        telegramUsername={effTelegramUsername}
        phone={effPhone}
      />

      <Footer
        phone={effPhone}
        email={settings.email}
        address={settings.address}
      />
    </div>
    </PagePasswordGate>
  );
}
