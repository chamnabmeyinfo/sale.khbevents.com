'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Bell,
  Building,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Crown,
  Key,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { SystemSettings } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { errorMessage } from '@/lib/errors';

interface SettingsClientProps {
  initialSettings: SystemSettings;
}

type SettingsTab = 'profile' | 'social' | 'telegram' | 'appearance' | 'security';

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    companyName: initialSettings.companyName || 'KHB EVENTS',
    brandTagline: initialSettings.brandTagline || 'Creating Extraordinary Moments',
    phone: initialSettings.phone || '+855 12 888 999',
    whatsappNumber: initialSettings.whatsappNumber || '85512888999',
    telegramUsername: initialSettings.telegramUsername || 'khbevents',
    email: initialSettings.email || 'sale@khbevents.com',
    address: initialSettings.address || 'Diamond Island (Koh Pich), Phnom Penh, Cambodia',
    facebookUrl: initialSettings.facebookUrl || 'https://facebook.com/khbevents',
    tiktokUrl: initialSettings.tiktokUrl || 'https://tiktok.com/@khbevents',
    enableTelegramAlerts: initialSettings.enableTelegramAlerts ?? false,
    telegramBotToken: initialSettings.telegramBotToken || '',
    telegramChatId: initialSettings.telegramChatId || '',
    newPassword: '',
    confirmPassword: ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [webhookMessage, setWebhookMessage] = useState('');

  const handleRegisterWebhook = async () => {
    setWebhookStatus('working');
    setWebhookMessage('');
    try {
      const res = await fetch('/api/telegram/setup-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: window.location.origin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Registration failed');
      setWebhookStatus('done');
      setWebhookMessage(`Connected: ${data.webhookUrl}`);
    } catch (err) {
      setWebhookStatus('error');
      setWebhookMessage(errorMessage(err, 'Registration failed'));
    }
  };

  // Sync active tab with location hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['profile', 'social', 'telegram', 'appearance', 'security'].includes(hash)) {
        setActiveTab(hash as SettingsTab);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setFormData((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setError(errorMessage(err, 'Error saving settings'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-emerald-900/40">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <span>Brand & System Settings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Configure KHB Events contact points, instant lead notifications, and security credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4 text-black stroke-[3]" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* 2. Sub Menu Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-emerald-900/40 pb-3">
        {[
          { id: 'profile', label: '🏢 Company Profile & Contact', icon: Building },
          { id: 'social', label: '📢 Social & Media Channels', icon: Share2 },
          { id: 'telegram', label: '🤖 Instant Telegram Alerts', icon: Bell },
          { id: 'appearance', label: '🎨 Theme & Display', icon: Sun },
          { id: 'security', label: '🛡️ Roles & Security', icon: ShieldCheck }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as SettingsTab)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-500/10'
                  : 'bg-white dark:bg-[#0A1610] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-emerald-900/40'
              }`}
            >
              <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-slate-400 dark:text-zinc-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 shadow-sm dark:shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Settings successfully saved and synchronized across the portal!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 shadow-sm dark:shadow-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: Company Profile */}
        {activeTab === 'profile' && (
          <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-6 sm:p-8 space-y-5 shadow-sm dark:shadow-xl transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-emerald-950">
              <Building className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Company & Public Contact Information</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={formData.brandTagline}
                  onChange={(e) => setFormData({ ...formData, brandTagline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Hotline Phone Number (Display)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+855 12 888 999"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  WhatsApp Number (Digits only, e.g. 85512888999)
                </label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="85512888999"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Official Inquiries Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sale@khbevents.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  HQ Office & Staging Warehouse Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Social Channels */}
        {activeTab === 'social' && (
          <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-6 sm:p-8 space-y-5 shadow-sm dark:shadow-xl transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-emerald-950">
              <Share2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Social & Public Channels</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Facebook Page URL
                </label>
                <input
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/khbevents"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  TikTok Profile URL
                </label>
                <input
                  type="url"
                  value={formData.tiktokUrl}
                  onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                  placeholder="https://tiktok.com/@khbevents"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Telegram Public Channel / Username
                </label>
                <input
                  type="text"
                  value={formData.telegramUsername}
                  onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value.replace('@', '') })}
                  placeholder="khbevents"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1 block">
                  Used for public Telegram buttons on campaign pages (e.g. t.me/khbevents).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Telegram Alerts */}
        {activeTab === 'telegram' && (
          <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-6 sm:p-8 space-y-5 shadow-sm dark:shadow-xl transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-950">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Instant Telegram Lead Notifications</h2>
              </div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 font-bold">
                Real-time Push
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-gray-400">
              Receive an instant Telegram notification on your phone or sales group chat whenever a client submits an inquiry or delegate registration.
            </p>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-emerald-950/30 border border-slate-200 dark:border-emerald-900/40">
              <input
                type="checkbox"
                id="enableTelegram"
                checked={formData.enableTelegramAlerts}
                onChange={(e) => setFormData({ ...formData, enableTelegramAlerts: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 bg-white dark:bg-[#06100B] border-slate-300 dark:border-emerald-900 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="enableTelegram" className="text-xs text-emerald-800 dark:text-emerald-200 font-bold cursor-pointer">
                Enable Telegram Bot Notification Alerts for New Inquiries
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="text"
                  value={formData.telegramBotToken}
                  onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
                <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">
                  Created via @BotFather on Telegram.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Target Chat ID / Sales Group ID
                </label>
                <input
                  type="text"
                  value={formData.telegramChatId}
                  onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                  placeholder="e.g. -100123456789 or 987654321"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
                <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block">
                  Your personal ID or team sales group ID.
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-emerald-900/40 space-y-2">
              <p className="text-xs text-slate-600 dark:text-gray-400">
                Connect the bot to this website so it can answer visitors. Do this once, and again after changing the bot token (save the new token first).
              </p>
              <button
                type="button"
                onClick={handleRegisterWebhook}
                disabled={webhookStatus === 'working'}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60 transition-colors"
              >
                {webhookStatus === 'working' ? 'Registering…' : 'Register / secure bot webhook'}
              </button>
              {webhookMessage && (
                <p className={`text-xs ${webhookStatus === 'error' ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {webhookMessage}
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Theme & Display Mode */}
        {activeTab === 'appearance' && (
          <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-xl transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-950">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Portal Display & Theme Preferences</h2>
              </div>
              <span className="text-[10px] text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/70 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 font-bold uppercase">
                Active: {theme}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-gray-400">
              Customize your portal viewing experience. Choose between crisp daylight white, executive obsidian dark, or let the portal automatically match your device OS settings.
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  id: 'light' as const,
                  title: 'Light Mode',
                  desc: 'Crisp ivory white theme with clean contrast and emerald accents, perfect for daytime sales operations.',
                  icon: Sun,
                  iconBg: 'bg-amber-100 text-amber-700'
                },
                {
                  id: 'dark' as const,
                  title: 'Dark Mode',
                  desc: 'Signature KHB obsidian & emerald luxury theme, designed for eye comfort and focused evening workflow.',
                  icon: Moon,
                  iconBg: 'bg-emerald-950 text-emerald-300'
                },
                {
                  id: 'system' as const,
                  title: 'Automatic Follow System',
                  desc: 'Automatically switches between Light and Dark mode based on your device system settings in real time.',
                  icon: Laptop,
                  iconBg: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                }
              ].map((item) => {
                const ItemIcon = item.icon;
                const isSelected = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id)}
                    className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-400/15 border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                        : 'bg-slate-50 dark:bg-[#06100B] border-slate-200 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-700/60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                          <ItemIcon className="w-5 h-5" />
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-black">
                            Selected
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                        <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: Roles & Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Roles Matrix Card */}
            <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-6 sm:p-8 space-y-4 shadow-sm dark:shadow-xl transition-colors">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-emerald-950">
                <ShieldCheck className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">System Access & Roles Architecture</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* OWNER Card */}
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-amber-400 text-black flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      <span>OWNER</span>
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-mono font-semibold">Root Authority</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Chamnam Mey</h3>
                  <p className="text-xs text-amber-800 dark:text-amber-200/80 font-mono">chamnabmey.info@gmail.com</p>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    Full ownership permissions: complete CMS governance, financial pipeline access, settings & security control.
                  </p>
                </div>

                {/* SUPER ADMIN Card */}
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-blue-500 text-white flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>SUPER ADMIN</span>
                    </span>
                    <span className="text-[10px] text-blue-700 dark:text-blue-300 font-mono font-semibold">Full Operation</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Admin KHB</h3>
                  <p className="text-xs text-blue-800 dark:text-blue-200/80 font-mono">admin@khbevents.com</p>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    Lead CRM oversight, campaign management, landing page creation, sales team coordination.
                  </p>
                </div>
              </div>
            </div>

            {/* Password Update Card */}
            <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 p-6 sm:p-8 space-y-5 shadow-sm dark:shadow-xl transition-colors">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-emerald-950">
                <Key className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Update Portal Admin Password</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Enter new password (optional)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4 text-black stroke-[3]" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

