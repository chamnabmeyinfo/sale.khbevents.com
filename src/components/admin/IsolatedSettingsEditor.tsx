'use client';

import React, { useState } from 'react';
import ImageField from './ImageField';
import { useLanguage } from '@/context/LanguageContext';
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
  { nameKey: 'isolated.accent.emerald', value: '#10B981' },
  { nameKey: 'isolated.accent.gold', value: '#F59E0B' },
  { nameKey: 'isolated.accent.indigo', value: '#6366F1' },
  { nameKey: 'isolated.accent.rose', value: '#F43F5E' },
  { nameKey: 'isolated.accent.cyan', value: '#06B6D4' },
  { nameKey: 'isolated.accent.purple', value: '#8B5CF6' }
];

export default function IsolatedSettingsEditor({ formData, setFormData }: IsolatedSettingsEditorProps) {
  const { t } = useLanguage();
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
                {t('isolated.title')}
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300 max-w-2xl">
              {t('isolated.desc')}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 self-start md:self-auto shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{t('isolated.scope')}</span>
          </div>
        </div>
      </div>

      {/* ── Quick Tab Navigation ── */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-emerald-900/40 pb-3">
        {[
          { id: 'comms', label: t('isolated.tab.comms'), icon: Phone },
          { id: 'routing', label: t('isolated.tab.routing'), icon: Bell },
          { id: 'postsubmit', label: t('isolated.tab.postsubmit'), icon: Share2 },
          { id: 'branding', label: t('isolated.tab.branding'), icon: Palette },
          { id: 'access', label: t('isolated.tab.access'), icon: Shield },
          { id: 'payment', label: t('isolated.tab.payment'), icon: CreditCard }
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
              <span>{t('isolated.comms.title')}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              {t('isolated.comms.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                {t('isolated.phone.label')}
              </label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={e => updateSetting('phone', e.target.value)}
                placeholder="e.g. +855 12 345 678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">{t('isolated.phone.hint')}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                {t('isolated.whatsapp.label')}
              </label>
              <input
                type="text"
                value={settings.whatsapp || ''}
                onChange={e => updateSetting('whatsapp', e.target.value)}
                placeholder="e.g. +855 12 345 678 or https://wa.me/85512345678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">{t('isolated.whatsapp.hint')}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                {t('isolated.tgHandle.label')}
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
                {t('isolated.tgUrl.label')}
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
              <span>{t('isolated.coordinator.title')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">{t('isolated.coordinator.name')}</label>
                <input
                  type="text"
                  value={settings.coordinatorName || ''}
                  onChange={e => updateSetting('coordinatorName', e.target.value)}
                  placeholder="e.g. Sovann Meas"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">{t('isolated.coordinator.role')}</label>
                <input
                  type="text"
                  value={settings.coordinatorRole || ''}
                  onChange={e => updateSetting('coordinatorRole', e.target.value)}
                  placeholder={t('isolated.coordinator.rolePlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <ImageField
                compact
                label={t('isolated.coordinator.photo')}
                value={settings.coordinatorAvatar || ''}
                onChange={url => updateSetting('coordinatorAvatar', url)}
                placeholder={t('isolated.coordinator.photoPlaceholder')}
                preview="square"
                maxEdge={512}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">{t('isolated.coordinator.roleKh')}</label>
                <input type="text" value={settings.coordinatorRoleKh || ''} onChange={e => updateSetting('coordinatorRoleKh', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">{t('isolated.coordinator.phone')}</label>
                <input type="text" value={settings.coordinatorPhone || ''} onChange={e => updateSetting('coordinatorPhone', e.target.value)} placeholder="012 345 678" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">{t('isolated.coordinator.telegram')}</label>
                <input type="text" value={settings.coordinatorTelegram || ''} onChange={e => updateSetting('coordinatorTelegram', e.target.value.replace(/^@/, ''))} placeholder="username" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">{t('isolated.coordinator.bio')} (EN)</label>
                <textarea value={settings.coordinatorBio?.en || ''} onChange={e => updateSetting('coordinatorBio', { ...(settings.coordinatorBio || { en: '' }), en: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">{t('isolated.coordinator.bio')} (ខ្មែរ)</label>
                <textarea value={settings.coordinatorBio?.kh || ''} onChange={e => updateSetting('coordinatorBio', { en: settings.coordinatorBio?.en || '', kh: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-gray-400">{t('isolated.coordinator.where')}</p>
          </div>
        </div>
      )}

      {/* ── SECTION 2: LEAD ROUTING & WEBHOOKS ── */}
      {activeSection === 'routing' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#07130C] border border-slate-200 dark:border-emerald-900/60 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-emerald-900/40 pb-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Bell className="w-4 h-4" />
              <span>{t('isolated.routing.title')}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              {t('isolated.routing.desc')}
            </p>
          </div>

          {/* Telegram Alert Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-white">{t('isolated.alerts.title')}</span>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">{t('isolated.alerts.desc')}</p>
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
                  {t('isolated.chatId.label')}
                </label>
                <input
                  type="text"
                  value={settings.telegramChatId || ''}
                  onChange={e => updateSetting('telegramChatId', e.target.value.trim())}
                  placeholder="e.g. -100192837465 or 987654321"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">
                  {t('isolated.chatId.hint')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                  {t('isolated.botToken.label')}
                </label>
                <input
                  type="password"
                  value={settings.telegramBotToken || ''}
                  onChange={e => updateSetting('telegramBotToken', e.target.value.trim())}
                  placeholder="bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">
                  {t('isolated.botToken.hint')}
                </span>
              </div>
            </div>
          </div>

          {/* Outgoing Webhook */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-gray-200">
              <Webhook className="w-4 h-4 text-emerald-500" />
              <span>{t('isolated.webhook.title')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">
                  {t('isolated.webhook.url')}
                </label>
                <input
                  type="url"
                  value={settings.webhookUrl || ''}
                  onChange={e => updateSetting('webhookUrl', e.target.value.trim())}
                  placeholder="https://hooks.zapier.com/hooks/catch/123456/abcdef"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono"
                />
                <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">
                  {t('isolated.webhook.urlHint')}
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">
                  {t('isolated.webhook.secret')}
                </label>
                <input
                  type="text"
                  value={settings.webhookSecret || ''}
                  onChange={e => updateSetting('webhookSecret', e.target.value.trim())}
                  placeholder="e.g. whsec_9a8b7c6d5e"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono"
                />
                <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">
                  {t('isolated.webhook.secretHintBefore')} <code className="text-[10px] bg-slate-200 dark:bg-emerald-900/40 px-1 py-0.5 rounded">X-KHB-Signature</code> {t('isolated.webhook.secretHintAfter')}
                </span>
              </div>
            </div>
          </div>

          {/* CRM Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
              {t('isolated.tags.label')}
            </label>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">
              {t('isolated.tags.desc')}
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
                  {t('common.add')}
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
              <span>{t('isolated.postsubmit.title')}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              {t('isolated.postsubmit.desc')}
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
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('isolated.inline.title')}</span>
                {(settings.postSubmitAction || 'inline') === 'inline' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                {t('isolated.inline.desc')}
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
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('isolated.redirect.title')}</span>
                {settings.postSubmitAction === 'redirect' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                {t('isolated.redirect.desc')}
              </p>
            </div>
          </div>

          {settings.postSubmitAction === 'redirect' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                {t('isolated.redirectUrl.label')}
              </label>
              <input
                type="url"
                value={settings.redirectUrl || ''}
                onChange={e => updateSetting('redirectUrl', e.target.value.trim())}
                placeholder="https://t.me/+AbCdEfGhIjKlMnOp or https://checkout.stripe.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500 dark:text-gray-400 block">
                {t('isolated.redirectUrl.hint')}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
              {t('isolated.thankYou.label')}
            </label>
            <textarea
              rows={3}
              value={settings.customThankYouMessage || ''}
              onChange={e => updateSetting('customThankYouMessage', e.target.value)}
              placeholder={t('isolated.thankYou.placeholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Sold Out Gate */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">{t('isolated.soldOut.title')}</span>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">{t('isolated.soldOut.desc')}</p>
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
                <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-300 mb-1">{t('isolated.soldOut.notice')}</label>
                <input
                  type="text"
                  value={settings.soldOutMessage || ''}
                  onChange={e => updateSetting('soldOutMessage', e.target.value)}
                  placeholder={t('isolated.soldOut.placeholder')}
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
              <span>{t('isolated.branding.title')}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              {t('isolated.branding.desc')}
            </p>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
              {t('isolated.accent.label')}
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
                    <span>{t(preset.nameKey)}</span>
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
              <span>{t('isolated.partner.title')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">
                  {t('isolated.partner.name')}
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
                <ImageField
                  compact
                  label={t('isolated.partner.logo')}
                  value={settings.partnerLogo || ''}
                  onChange={url => updateSetting('partnerLogo', url)}
                  placeholder={t('isolated.partner.logoPlaceholder')}
                  preview="contain"
                  maxEdge={800}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
              {t('isolated.cta.label')}
            </label>
            <input
              type="text"
              value={settings.customCtaText || ''}
              onChange={e => updateSetting('customCtaText', e.target.value)}
              placeholder={t('isolated.cta.placeholder')}
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
              <span>{t('isolated.access.title')}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              {t('isolated.access.desc')}
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
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('isolated.public.title')}</span>
                {(settings.accessProtection || 'public') === 'public' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                {t('isolated.public.desc')}
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
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('isolated.password.title')}</span>
                {settings.accessProtection === 'password' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                {t('isolated.password.desc')}
              </p>
            </div>
          </div>

          {settings.accessProtection === 'password' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                {t('isolated.pin.label')}
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
                {t('isolated.pin.hint')}
              </span>
            </div>
          )}

          {/* Search Indexing */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-white">{t('isolated.indexing.title')}</span>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">{t('isolated.indexing.desc')}</p>
              </div>
              <select
                value={settings.searchEngineIndexing === false || settings.searchEngineIndexing === 'noindex' ? 'noindex' : 'index'}
                onChange={e => updateSetting('searchEngineIndexing', e.target.value as IsolatedPageSettings['searchEngineIndexing'])}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-emerald-900/60 bg-white dark:bg-[#040C07] text-slate-900 dark:text-white text-xs font-bold"
              >
                <option value="index">{t('isolated.indexing.index')}</option>
                <option value="noindex">{t('isolated.indexing.noindex')}</option>
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
              <span>{t('isolated.payment.title')}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              {t('isolated.payment.desc')}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
              {t('isolated.methods.label')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'khqr', label: t('isolated.method.khqr'), icon: QrCode },
                { id: 'bank_transfer', label: t('isolated.method.bank'), icon: Building },
                { id: 'card', label: t('isolated.method.card'), icon: CreditCard },
                { id: 'cash', label: t('isolated.method.cash'), icon: Check }
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

          {/* KHQR image */}
          <div>
            <ImageField
              compact
              label={t('isolated.qr.label')}
              value={settings.khqrImageUrl || ''}
              onChange={url => updateSetting('khqrImageUrl', url)}
              placeholder={t('isolated.qr.placeholder')}
              preview="contain"
              maxEdge={1200}
            />
          </div>

          {/* Bank Account Wire Information */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-gray-200">
              <Building className="w-4 h-4 text-emerald-500" />
              <span>{t('isolated.bank.title')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">
                  {t('isolated.bank.name')}
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
                  {t('isolated.bank.accountName')}
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
                  {t('isolated.bank.accountNumber')}
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
