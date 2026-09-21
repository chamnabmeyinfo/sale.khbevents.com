'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LandingPage, SystemSettings } from '@/lib/types';
import LandingPageTracking, { trackLandingEvent } from '@/components/common/LandingPageTracking';
import PagePasswordGate from '@/components/common/PagePasswordGate';

export default function SmartCityOptinView({ page, settings, initialLang }: { page?: LandingPage; settings?: SystemSettings; initialLang?: 'en' | 'kh' } = {}) {
  const [lang, setLang] = useState<'en' | 'kh'>(initialLang || 'en');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang === 'kh' || urlLang === 'en') {
        setLang(urlLang);
      } else if (initialLang) {
        setLang(initialLang);
      }
    } catch {}
  }, []);

  const effTotalSeats = page?.urgency?.totalSeats ?? 30;
  const effEarlyBirdPrice = page?.urgency?.earlyBirdPrice ? (Number(page.urgency.earlyBirdPrice) || 499) : 499;
  const effTgUrl = `/api/round-robin?page=${encodeURIComponent(page?.slug || 'smart-city-tea-cafe')}&redirect=true`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name.trim(),
          phone: phone.trim(),
          landingPageSlug: page?.slug || 'smart-city-tea-cafe',
          landingPageTitle: page?.title || 'Smart City, Tea & Cafe Delegation (Fast Opt-in)',
          source: 'optin_funnel',
          message: 'Direct Opt-in Lead (Express Booking)',
          packageInterest: `Early Bird $${effEarlyBirdPrice}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        trackLandingEvent(page, 'form_submit', { profile: 'Fast Opt-in', value: effEarlyBirdPrice }, lang);

        if (page?.isolatedSettings?.postSubmitAction === 'redirect' && page?.isolatedSettings?.redirectUrl) {
          setTimeout(() => {
            window.location.href = page.isolatedSettings!.redirectUrl!;
          }, 1500);
        }
      } else {
        alert(data.error || 'Submission failed. Please try again.');
      }
    } catch {
      alert('Network error. Please try again or reach out on Telegram.');
    } finally {
      setSubmitting(false);
    }
  };

  const isKh = lang === 'kh';

  return (
    <PagePasswordGate page={page}>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(160deg, #0F2E20 0%, #091E14 70%)',
        fontFamily: isKh ? "'Hanuman', 'Kantumruy Pro', sans-serif" : "'Plus Jakarta Sans', sans-serif"
      }}>
        <LandingPageTracking page={page} lang={lang} />
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '36px 30px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)'
        }}>

          {!submitted ? (
            <div>
              <div style={{
                display: 'inline-block',
                background: '#EDFAF3',
                color: '#1E5E44',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '6px 14px',
                borderRadius: '999px',
                marginBottom: '16px'
              }}>
                ⏳ {isKh ? `កៅអីកំណត់ត្រឹម ${effTotalSeats}` : `Strictly ${effTotalSeats} Seats Cohort`}
              </div>

              <h1 style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#091E14',
                lineHeight: isKh ? 1.4 : 1.22,
                letterSpacing: '-0.02em',
                marginBottom: '10px'
              }}>
                {isKh ? (page?.translations?.kh?.title || 'កក់កៅអីរបស់លោកអ្នក') : (page?.title || 'Reserve Your Seat')}
              </h1>

              <p style={{
                fontSize: '0.92rem',
                color: '#5E7166',
                lineHeight: isKh ? 1.8 : 1.6,
                marginBottom: '16px'
              }}>
                {isKh
                  ? (page?.translations?.kh?.urgencyRiskNote || 'បញ្ចូលឈ្មោះ និងលេខទូរស័ព្ទរបស់អ្នក។ អ្នកសម្របសម្រួលយើងនឹងទូរស័ព្ទមកក្នុងរយៈពេល ១៥ នាទីដើម្បីបញ្ជាក់កៅអី។ មិនត្រូវបង់ប្រាក់ថ្ងៃនេះទេ។')
                  : (page?.urgency?.riskNote || 'Enter your name and phone number. Our coordinator will call you within 15 minutes to confirm your seat. No payment today.')}
              </p>

              <div style={{
                background: '#FDF0D5',
                border: '1px solid #F5DFA8',
                color: '#7A5410',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '20px',
                lineHeight: 1.5
              }}>
                💥 {isKh ? `តម្លៃ Early Bird $${effEarlyBirdPrice} អនុវត្តសម្រាប់កៅអីបញ្ជាក់មុនគេ` : `Early Bird $${effEarlyBirdPrice} rate applies to the first confirmed seats`}
              </div>

              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#2F3E35', marginBottom: '6px' }}>
                  {isKh ? 'ឈ្មោះពេញរបស់អ្នក *' : 'Your Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isKh ? 'ឧ. សុខ សុវណ្ណ' : 'e.g. Sok Sovann / Johnathan Doe'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 15px',
                    border: '1.5px solid #E7E2D6',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    outline: 'none',
                    marginBottom: '14px',
                    color: '#0D1912'
                  }}
                />

                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#2F3E35', marginBottom: '6px' }}>
                  {isKh ? 'លេខទូរស័ព្ទ (Telegram / WhatsApp) *' : 'Phone (Telegram / WhatsApp) *'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="012 345 678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 15px',
                    border: '1.5px solid #E7E2D6',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    outline: 'none',
                    marginBottom: '20px',
                    color: '#0D1912'
                  }}
                />

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #277856, #1E5E44)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '15px',
                    borderRadius: '999px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: '0 8px 20px rgba(39,120,86,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {submitting
                    ? (isKh ? 'កំពុងបញ្ជូន...' : 'Holding your seat...')
                    : (isKh ? `កក់កៅអីឥឡូវនេះ ($${effEarlyBirdPrice})` : `Reserve My Seat Now ($${effEarlyBirdPrice})`)}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#8A9A90', marginTop: '14px' }}>
                  🔒 {isKh ? 'មិនត្រូវបង់ប្រាក់ថ្ងៃនេះ • កៅអីកក់ទុកភ្លាមៗ • ឆ្លើយតបក្នុង ១៥ នាទី' : 'No payment today • Seat held instantly • Reply within 15 mins'}
                </p>
              </form>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                background: '#D3F2E4',
                color: '#1E5E44',
                fontSize: '2rem',
                fontWeight: 800,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                ✓
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#091E14', marginBottom: '10px' }}>
                {isKh ? 'ទទួលបានការចុះឈ្មោះជោគជ័យ!' : 'Registration Received!'}
              </h2>

              <p style={{ fontSize: '0.92rem', color: '#5E7166', lineHeight: 1.6, marginBottom: '24px' }}>
                {isKh
                  ? 'ក្រុមការងារ KHB EVENTS ទទួលបានព័ត៌មានរបស់អ្នករួចហើយ ហើយនឹងទាក់ទងមកលោកអ្នកក្នុងពេលបន្តិចទៀតនេះ។'
                  : 'Our team has received your details and will call or message you shortly to confirm your booking.'}
              </p>

              <Link
                href={`/${page?.slug || 'smart-city-tea-cafe'}`}
                style={{
                  display: 'block',
                  background: '#277856',
                  color: '#ffffff',
                  padding: '14px 20px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  marginBottom: '14px',
                  fontSize: '0.95rem'
                }}
              >
                {isKh ? 'មើលកម្មវិធីដំណើរពេញលេញ →' : 'See the Full Program →'}
              </Link>

              <a
                href={effTgUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  color: '#229ED9',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  padding: '8px'
                }}
              >
                ✈️ {isKh ? 'បើកការជជែក Telegram ផ្ទាល់' : 'Open Telegram VIP Chat'}
              </a>
            </div>
          )}

          {/* Language Switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            <button
              onClick={() => setLang('en')}
              style={{
                background: lang === 'en' ? '#091E14' : '#F4F0E8',
                color: lang === 'en' ? '#FFFFFF' : '#5E7166',
                border: 'none',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              EN
            </button>
            <button
              onClick={() => setLang('kh')}
              style={{
                background: lang === 'kh' ? '#091E14' : '#F4F0E8',
                color: lang === 'kh' ? '#FFFFFF' : '#5E7166',
                border: 'none',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ភាសាខ្មែរ
            </button>
          </div>

        </div>
      </div>
    </div>
    </PagePasswordGate>
  );
}
