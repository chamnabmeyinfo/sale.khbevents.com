'use client';

import React, { useState } from 'react';
import { 
  LandingPage, 
  IsolatedPageSettings 
} from '@/lib/types';
import { 
  Phone, 
  Bell, 
  Webhook, 
  Tag, 
  Shield, 
  Palette, 
  Building, 
  CreditCard, 
  QrCode, 
  Sparkles, 
  Sliders, 
  Key, 
  Users, 
  Share2, 
  Plus, 
  X, 
  Check 
} from 'lucide-react';

interface IsolatedSettingsEditorProps {
  formData: Partial<LandingPage>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<LandingPage>>>;
}

type PaymentMethod = NonNullable<IsolatedPageSettings['acceptedPaymentMethods']>[number];

const PRESET_ACCENTS = [
  { name: 'Emerald (Default)', value: '#10B981' },
  { name: 'Gold / Amber', value: '#F59E0B' },
  { name: 'Royal Indigo', value: '#6366F1' },
  { name: 'Rose Red', value: '#F43F5E' },
  { name: 'Ocean Cyan', value: '#06B6D4' },
  { name: 'Midnight Purple', value: '#8B5CF6' }
];

export default function IsolatedSettingsEditor({ formData, setFormData }: IsolatedSettingsEditorProps) {
  const settings: IsolatedPageSettings = formData.isolatedSettings || {};
  const [newTagInput, setNewTagInput] = useState('');
  const [activeSection, setActiveSection] = useState<'comms' | 'routing' | 'postsubmit' | 'branding' | 'access' | 'payment'>('comms');

  const updateSetting = <K extends keyof IsolatedPageSettings>(key: K, value: IsolatedPageSettings[K]) => {
    setFormData((prev) => ({
      ...prev,
      isolatedSettings: {
        ...(prev.isolatedSettings || {}),
        [key]: value
      }
    }));
  };

  const addTag = () => {
    const trimmed = newTagInput.trim().toLowerCase();
    if (!trimmed) return;
    const current = settings.leadTags || [];
    if (!current.includes(trimmed)) {
      updateSetting('leadTags', [...current, trimmed]);
    }
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    const current = settings.leadTags || [];
    updateSetting('leadTags', current.filter(t => t !== tagToRemove));
  };

  const togglePaymentMethod = (method: 'khqr' | 'bank_transfer' | 'cash' | 'card') => {
    const current = settings.acceptedPaymentMethods || ['khqr', 'bank_transfer'];
    if (current.includes(method)) {
      updateSetting('acceptedPaymentMethods', current.filter((m: string) => m !== method));
    } else {
      updateSetting('acceptedPaymentMethods', [...current, method]);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Top Header Banner ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-[#0B1E14] dark:via-[#091810] dark:to-[#08121E] border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <Sliders className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Dedicated Landing Page Settings
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300 max-w-2xl">
              Configure independent communication lines, custom Telegram lead routing, post-conversion actions, VIP password protection, and campaign-specific invoicing details.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 self-start md:self-auto shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Isolated Page Scope</span>
          </div>
        </div>
      </div>

      {/* ── Quick Tab Navigation ── */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-emerald-900/40 pb-3">
        {[
          { id: 'comms', label: '📞 Communications', icon: Phone },
          { id: 'routing', label: '🔔 Lead Routing & Webhooks', icon: Bell },
          { id: 'postsubmit', label: '🚀 Post-Conversion Actions', icon: Share2 },
          { id: 'branding', label: '🎨 Co-Branding & Accent', icon: Palette },
          { id: 'access', label: '🔒 VIP Access & Privacy', icon: Shield },
          { id: 'payment', label: '💳 Invoicing & KHQR', icon: CreditCard }
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id as typeof activeSection)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-emerald-950/40 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-emerald-900/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── SECTION 1: COMMUNICATIONS & COORDINATOR ── */}
      {activeSection === 'comms' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#07130C] border border-slate-200 dark:border-emerald-900/60 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-emerald-900/40 pb-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Phone className="w-4 h-4" />
              <span>Dedicated Campaign Hotline & Social Contacts</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Override global support numbers so prospective attendees contact this campaign’s specific sales representative directly. Leave blank to use global defaults.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                Campaign Hotline Phone
              </label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={e => updateSetting('phone', e.target.value)}
                placeholder="e.g. +855 12 345 678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">Displayed on sticky CTA and contact sections.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                Dedicated WhatsApp Number / Link
              </label>
              <input
                type="text"
                value={settings.whatsapp || ''}
                onChange={e => updateSetting('whatsapp', e.target.value)}
                placeholder="e.g. +855 12 345 678 or https://wa.me/85512345678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">Direct WhatsApp chat routing for international leads.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                Campaign Telegram Handle / Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400">@</span>
                <input
                  type="text"
                  value={(settings.telegramUsername || '').replace(/^@/, '')}
                  onChange={e => updateSetting('telegramUsername', `@${e.target.value.replace(/^@/, '')}`)}
                  placeholder="khbevents_b2b"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                Direct Telegram Channel / Group Link
              </label>
              <input
                type="text"
                value={settings.telegramUrl || ''}
                onChange={e => updateSetting('telegramUrl', e.target.value)}
                placeholder="https://t.me/khbevents_delegation"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dedicated Trip Coordinator Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-gray-200">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Dedicated Trip / Event Coordinator Profile</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">Coordinator Name</label>
                <input
                  type="text"
                  value={settings.coordinatorName || ''}
                  onChange={e => updateSetting('coordinatorName', e.target.value)}
                  placeholder="e.g. Sovann Meas"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">Coordinator Title / Role</label>
                <input
                  type="text"
                  value={settings.coordinatorRole || ''}
                  onChange={e => updateSetting('coordinatorRole', e.target.value)}
                  placeholder="e.g. Senior B2B Delegation Lead"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={settings.coordinatorAvatar || ''}
                  onChange={e => updateSetting('coordinatorAvatar', e.target.value)}
                  placeholder="/images/events/photo_2026-09-16_22-01-09 (2).jpg"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2: LEAD ROUTING & WEBHOOKS ── */}
      {activeSection === 'routing' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#07130C] border border-slate-200 dark:border-emerald-900/60 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-emerald-900/40 pb-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Bell className="w-4 h-4" />
              <span>Isolated Telegram Lead Alerts & Webhooks</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Route inquiries from this page to dedicated Telegram groups (e.g. B2B Trade Team vs. Concert Ticket Sales) and sync to Zapier/Make in real time.
            </p>
          </div>

          {/* Telegram Alert Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-white">Enable Instant Telegram Alerts for this Campaign</span>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">Receive lead notifications immediately as soon as a visitor submits the form.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableTelegramAlerts ?? true}
                onChange={e => updateSetting('enableTelegramAlerts', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                  Dedicated Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={settings.telegramChatId || ''}
                  onChange={e => updateSetting('telegramChatId', e.target.value.trim())}
                  placeholder="e.g. -100192837465 or 987654321"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">
                  Send leads directly to your campaign&apos;s dedicated Telegram group. (Leave empty to use global setting).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                  Custom Telegram Bot Token (Optional)
                </label>
                <input
                  type="password"
                  value={settings.telegramBotToken || ''}
                  onChange={e => updateSetting('telegramBotToken', e.target.value.trim())}
                  placeholder="bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">
                  Optional. Overrides the default system bot with a dedicated campaign bot.
                </span>
              </div>
            </div>
          </div>

          {/* Outgoing Webhook */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-gray-200">
              <Webhook className="w-4 h-4 text-emerald-500" />
              <span>Real-Time Outgoing Webhook (Zapier / Make / Sheets / n8n)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">
                  Webhook Endpoint URL
                </label>
                <input
                  type="url"
                  value={settings.webhookUrl || ''}
                  onChange={e => updateSetting('webhookUrl', e.target.value.trim())}
                  placeholder="https://hooks.zapier.com/hooks/catch/123456/abcdef"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono"
                />
                <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">
                  Every lead submitted on this page will be POSTed immediately to this URL.
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">
                  Webhook Secret (HMAC-SHA256 Signature)
                </label>
                <input
                  type="text"
                  value={settings.webhookSecret || ''}
                  onChange={e => updateSetting('webhookSecret', e.target.value.trim())}
                  placeholder="e.g. whsec_9a8b7c6d5e"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono"
                />
                <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">
                  Sent as <code className="text-[10px] bg-slate-200 dark:bg-emerald-900/40 px-1 py-0.5 rounded">X-KHB-Signature</code> header.
                </span>
              </div>
            </div>
          </div>

          {/* CRM Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
              Automatic CRM Lead Tags
            </label>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">
              Assign automatic categorization tags to leads originating from this landing page for downstream filtering and pipeline segmentation.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(settings.leadTags || []).map((tag, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="p-0.5 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="e.g. vietnam-delegation"
                  className="px-3 py-1 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs w-44"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3: POST-SUBMISSION ACTIONS ── */}
      {activeSection === 'postsubmit' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#07130C] border border-slate-200 dark:border-emerald-900/60 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-emerald-900/40 pb-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Share2 className="w-4 h-4" />
              <span>Post-Conversion & Form Submission Behavior</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Choose whether submitters see an inline thank-you screen or get automatically redirected to a private VIP Telegram group, WhatsApp group, or external checkout page.
            </p>
          </div>

          {/* Action Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => updateSetting('postSubmitAction', 'inline')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                (settings.postSubmitAction || 'inline') === 'inline'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-emerald-900/30 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Inline Success State</span>
                {(settings.postSubmitAction || 'inline') === 'inline' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                Shows confirmation and booking summary directly inside the landing page container without redirecting the user away.
              </p>
            </div>

            <div 
              onClick={() => updateSetting('postSubmitAction', 'redirect')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                settings.postSubmitAction === 'redirect'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-emerald-900/30 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Auto-Redirect to External URL</span>
                {settings.postSubmitAction === 'redirect' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                Immediately redirects the visitor to a custom URL (e.g. VIP Telegram channel invite, payment gateway, or calendar scheduling).
              </p>
            </div>
          </div>

          {settings.postSubmitAction === 'redirect' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                Redirect Destination URL
              </label>
              <input
                type="url"
                value={settings.redirectUrl || ''}
                onChange={e => updateSetting('redirectUrl', e.target.value.trim())}
                placeholder="https://t.me/+AbCdEfGhIjKlMnOp or https://checkout.stripe.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500 dark:text-gray-400 block">
                The user will be redirected within 1.5 seconds of submitting the reservation form.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
              Custom Thank You Message
            </label>
            <textarea
              rows={3}
              value={settings.customThankYouMessage || ''}
              onChange={e => updateSetting('customThankYouMessage', e.target.value)}
              placeholder="Thank you for reserving your seat! Our coordinator will contact you via Telegram within 15 minutes with the official mission dossier."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Sold Out Gate */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Sold Out / Registration Closed Mode</span>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">Lock the reservation form and display a sold-out or waitlist banner.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.isSoldOut || false}
                onChange={e => updateSetting('isSoldOut', e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>
            {settings.isSoldOut && (
              <div>
                <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-300 mb-1">Sold Out Notice</label>
                <input
                  type="text"
                  value={settings.soldOutMessage || ''}
                  onChange={e => updateSetting('soldOutMessage', e.target.value)}
                  placeholder="All 30 delegation passes for this cohort have been fully claimed. Waitlist registration only."
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SECTION 4: CO-BRANDING & ACCENT THEMING ── */}
      {activeSection === 'branding' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#07130C] border border-slate-200 dark:border-emerald-900/60 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-emerald-900/40 pb-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Palette className="w-4 h-4" />
              <span>Campaign Accent Color & Partner Co-Branding</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Customize the visual palette for this landing page and attach co-organizer branding.
            </p>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
              Primary Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {PRESET_ACCENTS.map(preset => {
                const isSelected = (settings.accentColor || '#10B981').toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => updateSetting('accentColor', preset.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-slate-800 dark:border-white shadow-md'
                        : 'border-slate-200 dark:border-emerald-900/40 hover:border-slate-300'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-black/20" 
                      style={{ backgroundColor: preset.value }}
                    />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="color"
                value={settings.accentColor || '#10B981'}
                onChange={e => updateSetting('accentColor', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-emerald-800 bg-transparent"
              />
              <input
                type="text"
                value={settings.accentColor || '#10B981'}
                onChange={e => updateSetting('accentColor', e.target.value)}
                placeholder="#10B981"
                className="w-32 px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono uppercase"
              />
            </div>
          </div>

          {/* Partner Co-Branding */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-gray-200">
              <Building className="w-4 h-4 text-emerald-500" />
              <span>Co-Organizer / Official Partner Branding</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">
                  Partner / Co-Organizer Name
                </label>
                <input
                  type="text"
                  value={settings.partnerName || ''}
                  onChange={e => updateSetting('partnerName', e.target.value)}
                  placeholder="e.g. Vietnam Tea Association"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">
                  Partner Logo URL
                </label>
                <input
                  type="text"
                  value={settings.partnerLogo || ''}
                  onChange={e => updateSetting('partnerLogo', e.target.value)}
                  placeholder="https://example.com/partner-logo.png"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
              Custom Primary CTA Button Label Override
            </label>
            <input
              type="text"
              value={settings.customCtaText || ''}
              onChange={e => updateSetting('customCtaText', e.target.value)}
              placeholder="e.g. Claim Your VIP Buyer Pass Today"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs"
            />
          </div>
        </div>
      )}

      {/* ── SECTION 5: ACCESS CONTROL & PRIVACY ── */}
      {activeSection === 'access' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#07130C] border border-slate-200 dark:border-emerald-900/60 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-emerald-900/40 pb-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Campaign Access Control & Privacy Gate</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Gate private VIP campaigns with a passcode/PIN or hide exclusive corporate invitation pages from Google search indexing.
            </p>
          </div>

          {/* Access Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => updateSetting('accessProtection', 'public')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                (settings.accessProtection || 'public') === 'public'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-emerald-900/30 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Public Access</span>
                {(settings.accessProtection || 'public') === 'public' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                Accessible to any visitor who has the link or visits your website.
              </p>
            </div>

            <div 
              onClick={() => updateSetting('accessProtection', 'password')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                settings.accessProtection === 'password'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-emerald-900/30 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">VIP PIN / Password Protected</span>
                {settings.accessProtection === 'password' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                Visitors must enter an exclusive invite PIN code before they can view event pricing, itinerary, or submit leads.
              </p>
            </div>
          </div>

          {settings.accessProtection === 'password' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                VIP Access Passcode / PIN
              </label>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-500" />
                <input
                  type="text"
                  value={settings.passwordPin || ''}
                  onChange={e => updateSetting('passwordPin', e.target.value.trim())}
                  placeholder="e.g. KHBVIP2026"
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono tracking-wider w-64"
                />
              </div>
              <span className="text-[10px] text-slate-500 dark:text-gray-400 block">
                Share this passcode only with verified delegates or private partners.
              </span>
            </div>
          )}

          {/* Search Indexing */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-white">Search Engine Indexing Control</span>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">Prevent Google and Bing from indexing this campaign page if it is for internal/exclusive partners.</p>
              </div>
              <select
                value={settings.searchEngineIndexing === false || settings.searchEngineIndexing === 'noindex' ? 'noindex' : 'index'}
                onChange={e => updateSetting('searchEngineIndexing', e.target.value as IsolatedPageSettings['searchEngineIndexing'])}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-bold"
              >
                <option value="index">Indexable (Public SEO)</option>
                <option value="noindex">Private (noindex, nofollow)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 6: INVOICING & KHQR ── */}
      {activeSection === 'payment' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#07130C] border border-slate-200 dark:border-emerald-900/60 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-emerald-900/40 pb-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <CreditCard className="w-4 h-4" />
              <span>Campaign Payment & KHQR Invoicing Details</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Provide dedicated bank accounts or Bakong KHQR QR images for attendees who wish to wire deposits directly for this specific campaign.
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
              Accepted Payment Methods
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'khqr', label: 'Bakong KHQR', icon: QrCode },
                { id: 'bank_transfer', label: 'Bank Wire Transfer', icon: Building },
                { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                { id: 'cash', label: 'Cash on Arrival / Office', icon: Check }
              ].map(method => {
                const Icon = method.icon;
                const isChecked = (settings.acceptedPaymentMethods || ['khqr', 'bank_transfer']).includes(method.id as PaymentMethod);
                return (
                  <div
                    key={method.id}
                    onClick={() => togglePaymentMethod(method.id as PaymentMethod)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-emerald-900/30 text-slate-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold">{method.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KHQR Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
              Campaign KHQR QR Code Image URL
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={settings.khqrImageUrl || ''}
                onChange={e => updateSetting('khqrImageUrl', e.target.value)}
                placeholder="/images/events/khqr-delegation.png"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono"
              />
              {settings.khqrImageUrl && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-500/40 shrink-0 bg-white p-0.5">
                  <img src={settings.khqrImageUrl} alt="KHQR Preview" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Bank Account Wire Information */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-gray-200">
              <Building className="w-4 h-4 text-emerald-500" />
              <span>Official Bank Account Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={settings.bankName || ''}
                  onChange={e => updateSetting('bankName', e.target.value)}
                  placeholder="e.g. ABA Bank / Canadia Bank"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={settings.bankAccountName || ''}
                  onChange={e => updateSetting('bankAccountName', e.target.value)}
                  placeholder="e.g. KHB EVENTS CO., LTD"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={settings.bankAccountNumber || ''}
                  onChange={e => updateSetting('bankAccountNumber', e.target.value)}
                  placeholder="e.g. 000 123 456"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
