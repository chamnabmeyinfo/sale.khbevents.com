'use client';

import React, { useState } from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import CampaignsShowcase from './CampaignsShowcase';
import ServicesGrid from './ServicesGrid';
import InteractiveEstimator from './InteractiveEstimator';
import PortfolioGallery from './PortfolioGallery';
import TestimonialsSection from './TestimonialsSection';
import FaqSection from './FaqSection';
import LeadForm from './LeadForm';
import FloatingContact from './FloatingContact';
import Footer from './Footer';
import { LandingPage, SystemSettings } from '@/lib/types';

interface MainSalesViewProps {
  pages: LandingPage[];
  settings: SystemSettings;
}

export default function MainSalesView({ pages, settings }: MainSalesViewProps) {
  const [formPrefill, setFormPrefill] = useState<{
    eventType?: string;
    guestCount?: string;
    budgetRange?: string;
  }>({});

  const handleApplyEstimate = (data: {
    eventType: string;
    guestCount: string;
    estimatedBudget: string;
  }) => {
    setFormPrefill({
      eventType: data.eventType,
      guestCount: data.guestCount,
      budgetRange: data.estimatedBudget
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070D0A] text-slate-900 dark:text-gray-100 flex flex-col selection:bg-amber-400 selection:text-black transition-colors">
      <Navbar phone={settings.phone} whatsapp={settings.whatsappNumber} />

      <main className="flex-1">
        <HeroSection />
        <CampaignsShowcase pages={pages} />
        <ServicesGrid />
        <InteractiveEstimator onApplyEstimate={handleApplyEstimate} />
        <PortfolioGallery />
        <TestimonialsSection />
        <LeadForm
          landingPageSlug="main-sales"
          landingPageTitle="KHB Events Flagship Sales Portal"
          prefillData={formPrefill}
        />
        <FaqSection />
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
