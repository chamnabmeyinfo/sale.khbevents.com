'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Send, CheckCircle2, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';

interface LeadFormProps {
  landingPageSlug?: string;
  landingPageTitle?: string;
  prefillData?: {
    eventType?: string;
    guestCount?: string;
    budgetRange?: string;
    packageInterest?: string;
  };
  headline?: string;
  subheadline?: string;
  submitButtonText?: string;
  successMessage?: string;
}

function LeadFormInner({
  landingPageSlug = 'main-sales',
  landingPageTitle = 'KHB Events Main Portal',
  prefillData,
  headline = 'Request Your Tailored Event Proposal',
  subheadline = 'Receive custom 3D visual concepts, equipment itemization, and pricing within 24 hours.',
  submitButtonText = 'Submit Inquiry & Lock In Rates',
  successMessage = 'Thank you! Your event inquiry has been received. A KHB Senior Producer will contact you within 2 hours.'
}: LeadFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    eventType: prefillData?.eventType || 'Corporate Gala / Annual Dinner',
    estimatedDate: '',
    guestCount: prefillData?.guestCount || '150 - 300 guests',
    budgetRange: prefillData?.budgetRange || '$6,000 - $12,000',
    packageInterest: prefillData?.packageInterest || '',
    message: ''
  });

  const [utm, setUtm] = useState<{ source?: string; medium?: string; campaign?: string; content?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setUtm({
        source: params.get('utm_source') || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
        content: params.get('utm_content') || undefined
      });
    }
  }, []);

  useEffect(() => {
    if (prefillData) {
      setFormData((prev) => ({
        ...prev,
        eventType: prefillData.eventType || prev.eventType,
        guestCount: prefillData.guestCount || prev.guestCount,
        budgetRange: prefillData.budgetRange || prev.budgetRange,
        packageInterest: prefillData.packageInterest || prev.packageInterest
      }));
    }
  }, [prefillData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          landingPageSlug,
          landingPageTitle,
          utmSource: utm.source,
          utmMedium: utm.medium,
          utmCampaign: utm.campaign,
          utmContent: utm.content,
          referrer: typeof document !== 'undefined' ? document.referrer : ''
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please call or WhatsApp us.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div id="inquiry-form" className="py-16 scroll-mt-20">
        <div className="max-w-2xl mx-auto rounded-3xl bg-white dark:bg-[#0B1A13] border border-emerald-500/60 p-8 sm:p-12 text-center space-y-6 shadow-xl dark:shadow-2xl">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-400/40">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Inquiry Received!
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
              {successMessage}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/50 text-xs text-slate-700 dark:text-gray-300 space-y-1 text-left">
            <div><strong className="text-slate-900 dark:text-white">Client:</strong> {formData.fullName}</div>
            <div><strong className="text-slate-900 dark:text-white">Phone / Telegram:</strong> {formData.phone}</div>
            <div><strong className="text-slate-900 dark:text-white">Event Type:</strong> {formData.eventType}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={`https://wa.me/85512888999?text=Hello%20KHB%20Events,%20I%20just%20submitted%20an%20inquiry%20for%20${encodeURIComponent(formData.eventType)}.%20My%20name%20is%20${encodeURIComponent(formData.fullName)}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Message On WhatsApp Directly</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  fullName: '',
                  phone: '',
                  email: '',
                  company: '',
                  eventType: 'Corporate Gala / Annual Dinner',
                  estimatedDate: '',
                  guestCount: '150 - 300 guests',
                  budgetRange: '$6,000 - $12,000',
                  packageInterest: '',
                  message: ''
                });
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Submit Another Inquiry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section id="inquiry-form" className="py-20 bg-white dark:bg-[#060C09] relative scroll-mt-20 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-50 dark:bg-gradient-to-b dark:from-[#0F2218] dark:via-[#0B1912] dark:to-[#08130E] border border-slate-200 dark:border-emerald-700/40 p-6 sm:p-12 shadow-xl dark:shadow-2xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Direct Senior Producer Channel
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {headline}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 max-w-xl mx-auto">
              {subheadline}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-200">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1.5">
                  Your Full Name <span className="text-amber-500 dark:text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oknha Sokha Meng"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1.5">
                  Phone / Telegram / WhatsApp <span className="text-amber-500 dark:text-amber-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 012 345 678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1.5">
                  Work Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@company.com.kh"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1.5">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  placeholder="Enterprise or Agency"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1.5">
                  Event Category
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="Corporate Gala / Annual Dinner">Corporate Gala / Annual Dinner</option>
                  <option value="Music Concert & Festival">Music Concert &amp; Festival</option>
                  <option value="Product Launch & Brand Reveal">Product Launch &amp; Brand Reveal</option>
                  <option value="Trade Expo & Exhibition Booth">Trade Expo &amp; Exhibition Booth</option>
                  <option value="B2B Business Delegation">B2B Business Delegation</option>
                  <option value="Private Luxury Wedding / Celebration">Private Luxury Wedding / Celebration</option>
                  <option value="Audio-Visual & Staging Rental Only">Audio-Visual &amp; Staging Rental Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1.5">
                  Target Date (Approximate)
                </label>
                <input
                  type="date"
                  value={formData.estimatedDate}
                  onChange={(e) => setFormData({ ...formData, estimatedDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1.5">
                  Expected Guests
                </label>
                <select
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="50 - 150 guests">50 - 150 guests</option>
                  <option value="150 - 300 guests">150 - 300 guests</option>
                  <option value="300 - 600 guests">300 - 600 guests</option>
                  <option value="600 - 1,500 guests">600 - 1,500 guests</option>
                  <option value="Over 1,500 guests (Stadium/Outdoor)">Over 1,500 guests (Stadium/Outdoor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1.5">
                  Budget Guideline
                </label>
                <select
                  value={formData.budgetRange}
                  onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="$2,500 - $5,000">$2,500 - $5,000</option>
                  <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                  <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                  <option value="$25,000 - $50,000+">$25,000 - $50,000+</option>
                  <option value="Flexible / Open to Proposal">Flexible / Open to Proposal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1.5">
                Specific Vision or Special Equipment Requirements
              </label>
              <textarea
                rows={3}
                placeholder="Tell us about your preferred venue (e.g. Koh Pich, Sokha, NagaWorld), theme ideas, LED size, artist preferences..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-4 px-8 rounded-xl font-bold text-sm uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-500 shadow-xl shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Transmitting Inquiry to KHB Team...</span>
                ) : (
                  <>
                    <span>{submitButtonText}</span>
                    <Send className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-gray-400 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Your privacy is 100% protected. Strict NDA adherence for enterprise &amp; government events.</span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function LeadForm(props: LeadFormProps) {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-gray-500">Loading form...</div>}>
      <LeadFormInner {...props} />
    </Suspense>
  );
}
