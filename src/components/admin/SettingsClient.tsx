'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Bell, 
  Lock, 
  Building, 
  CheckCircle2,
  Share2,
  ShieldCheck,
  Crown,
  Key,
  Smartphone
} from 'lucide-react';
import { SystemSettings } from '@/lib/types';

interface SettingsClientProps {
  initialSettings: SystemSettings;
}

type SettingsTab = 'profile' | 'social' | 'telegram' | 'security';

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

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

  // Sync active tab with location hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['profile', 'social', 'telegram', 'security'].includes(hash)) {
        setActiveTab(hash as SettingsTab);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
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
    } catch (err: any) {
      setError(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-900/40">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <span>Brand & System Settings</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
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
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-900/40 pb-3">
        {[
          { id: 'profile', label: '🏢 Company Profile & Contact', icon: Building },
          { id: 'social', label: '📢 Social & Media Channels', icon: Share2 },
          { id: 'telegram', label: '🤖 Instant Telegram Alerts', icon: Bell },
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
                  : 'bg-[#0A1610] text-zinc-400 hover:text-white hover:bg-emerald-950/60 border border-emerald-900/40'
              }`}
            >
              <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs text-emerald-200 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Settings successfully saved and synchronized across the portal!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/60 text-xs text-rose-200 shadow-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: Company Profile */}
        {activeTab === 'profile' && (
          <div className="rounded-2xl bg-[#0A1610] border border-emerald-900/50 p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-emerald-950">
              <Building className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">Company & Public Contact Information</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={formData.brandTagline}
                  onChange={(e) => setFormData({ ...formData, brandTagline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Hotline Phone Number (Display)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+855 12 888 999"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  WhatsApp Number (Digits only, e.g. 85512888999)
                </label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="85512888999"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-emerald-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Official Inquiries Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sale@khbevents.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  HQ Office & Staging Warehouse Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Social Channels */}
        {activeTab === 'social' && (
          <div className="rounded-2xl bg-[#0A1610] border border-emerald-900/50 p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-emerald-950">
              <Share2 className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">Social & Public Channels</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Facebook Page URL
                </label>
                <input
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/khbevents"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  TikTok Profile URL
                </label>
                <input
                  type="url"
                  value={formData.tiktokUrl}
                  onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                  placeholder="https://tiktok.com/@khbevents"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Telegram Public Channel / Username
                </label>
                <input
                  type="text"
                  value={formData.telegramUsername}
                  onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value.replace('@', '') })}
                  placeholder="khbevents"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Used for public Telegram buttons on campaign pages (e.g. t.me/khbevents).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Telegram Alerts */}
        {activeTab === 'telegram' && (
          <div className="rounded-2xl bg-[#0A1610] border border-emerald-900/50 p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-bold text-white">Instant Telegram Lead Notifications</h2>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                Real-time Push
              </span>
            </div>

            <p className="text-xs text-gray-400">
              Receive an instant Telegram notification on your phone or sales group chat whenever a client submits an inquiry or delegate registration.
            </p>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40">
              <input
                type="checkbox"
                id="enableTelegram"
                checked={formData.enableTelegramAlerts}
                onChange={(e) => setFormData({ ...formData, enableTelegramAlerts: e.target.checked })}
                className="w-4 h-4 rounded text-amber-400 bg-[#06100B] border-emerald-900 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="enableTelegram" className="text-xs text-emerald-200 font-bold cursor-pointer">
                Enable Telegram Bot Notification Alerts for New Inquiries
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="text"
                  value={formData.telegramBotToken}
                  onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Created via @BotFather on Telegram.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Target Chat ID / Sales Group ID
                </label>
                <input
                  type="text"
                  value={formData.telegramChatId}
                  onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                  placeholder="e.g. -100123456789 or 987654321"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Your personal ID or team sales group ID.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Roles & Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Roles Matrix Card */}
            <div className="rounded-2xl bg-[#0A1610] border border-emerald-900/50 p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-emerald-950">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">System Access & Roles Architecture</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* OWNER Card */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-amber-400 text-black flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      <span>OWNER</span>
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono">Root Authority</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Chamnam Mey</h3>
                  <p className="text-xs text-amber-200/80 font-mono">chamnabmey.info@gmail.com</p>
                  <p className="text-[11px] text-zinc-400">
                    Full ownership permissions: complete CMS governance, financial pipeline access, settings & security control.
                  </p>
                </div>

                {/* SUPER ADMIN Card */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-blue-500 text-white flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>SUPER ADMIN</span>
                    </span>
                    <span className="text-[10px] text-blue-300 font-mono">Full Operation</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Admin KHB</h3>
                  <p className="text-xs text-blue-200/80 font-mono">admin@khbevents.com</p>
                  <p className="text-[11px] text-zinc-400">
                    Lead CRM oversight, campaign management, landing page creation, sales team coordination.
                  </p>
                </div>
              </div>
            </div>

            {/* Password Update Card */}
            <div className="rounded-2xl bg-[#0A1610] border border-emerald-900/50 p-6 sm:p-8 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-emerald-950">
                <Key className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-bold text-white">Update Portal Admin Password</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Enter new password (optional)"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#06100B] border border-emerald-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
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

