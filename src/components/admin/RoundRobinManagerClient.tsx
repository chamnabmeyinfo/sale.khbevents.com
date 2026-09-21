'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  ExternalLink, 
  MessageCircle, 
  Clock, 
  Sparkles, 
  Search, 
  X,
  Check,
  Building,
  Activity,
  ArrowRight,
  Shield,
  HelpCircle,
  TrendingUp,
  Percent
} from 'lucide-react';
import { 
  RoundRobinSettings, 
  RoundRobinStaff, 
  RoundRobinLog, 
  RoundRobinAlgorithm,
  SystemSettings 
} from '@/lib/types';

interface RoundRobinManagerClientProps {
  initialSettings: RoundRobinSettings;
  initialLogs: RoundRobinLog[];
  systemSettings: SystemSettings;
}

const staffColors = [
  'bg-emerald-500',
  'bg-amber-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-indigo-500',
];

export default function RoundRobinManagerClient({
  initialSettings,
  initialLogs,
  systemSettings
}: RoundRobinManagerClientProps) {
  const [settings, setSettings] = useState<RoundRobinSettings>(initialSettings);
  const [logs, setLogs] = useState<RoundRobinLog[]>(initialLogs);
  const [botToken, setBotToken] = useState<string>(systemSettings.telegramBotToken || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active tab in Round Robin Manager: 'config' | 'logs'
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');

  // Connection test statuses for each staff member: [staffId]: { testing, success, message, diagnostic }
  const [testResults, setTestResults] = useState<
    Record<string, { testing?: boolean; success?: boolean; messageId?: number; error?: string; diagnostic?: string }>
  >({});

  // Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [logStaffFilter, setLogStaffFilter] = useState('ALL');
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');

  // Compute total percentage
  const totalPercentage = useMemo(() => {
    return settings.staffList
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + (Number(s.percentage) || 0), 0);
  }, [settings.staffList]);

  // Performance totals
  const totalLeadsRouted = useMemo(() => {
    return settings.staffList.reduce((sum, s) => sum + (s.totalLeadsRouted || 0), 0);
  }, [settings.staffList]);

  const totalClicksRouted = useMemo(() => {
    return settings.staffList.reduce((sum, s) => sum + (s.totalDirectClicks || 0), 0);
  }, [settings.staffList]);

  const totalDeliveries = useMemo(() => {
    return settings.staffList.reduce((sum, s) => sum + (s.successfulDeliveries || 0), 0);
  }, [settings.staffList]);

  const totalFailures = useMemo(() => {
    return settings.staffList.reduce((sum, s) => sum + (s.failedDeliveries || 0), 0);
  }, [settings.staffList]);

  const deliveryRate = useMemo(() => {
    const total = totalDeliveries + totalFailures;
    if (total === 0) return 100;
    return Math.round((totalDeliveries / total) * 100);
  }, [totalDeliveries, totalFailures]);

  // Update staff member property
  const handleStaffChange = (staffId: string, updates: Partial<RoundRobinStaff>) => {
    setSettings((prev) => ({
      ...prev,
      staffList: prev.staffList.map((s) => (s.id === staffId ? { ...s, ...updates } : s))
    }));
  };

  // Auto-Balance percentages equally across active staff
  const handleAutoBalance = () => {
    const activeStaff = settings.staffList.filter((s) => s.isActive);
    if (activeStaff.length === 0) return;

    const share = Math.floor(100 / activeStaff.length);
    const remainder = 100 - share * activeStaff.length;

    let activeIdx = 0;
    const balanced = settings.staffList.map((s) => {
      if (!s.isActive) return { ...s, percentage: 0 };
      const pct = share + (activeIdx === 0 ? remainder : 0);
      activeIdx++;
      return { ...s, percentage: pct };
    });

    setSettings((prev) => ({ ...prev, staffList: balanced }));
  };

  // Test Telegram connection for a specific staff member
  const handleTestConnection = async (staff: RoundRobinStaff) => {
    setTestResults((prev) => ({
      ...prev,
      [staff.id]: { testing: true }
    }));

    try {
      const res = await fetch('/api/round-robin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: staff.telegramChatId,
          staffName: staff.name,
          username: staff.telegramUsername,
          botToken
        })
      });

      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [staff.id]: {
          testing: false,
          success: data.success,
          messageId: data.messageId,
          error: data.error,
          diagnostic: data.diagnostic
        }
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [staff.id]: {
          testing: false,
          success: false,
          error: err?.message || 'Failed to ping Telegram'
        }
      }));
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/round-robin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          botToken
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch {
      alert('Error saving Round Robin settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Refresh logs
  const handleRefreshLogs = async () => {
    try {
      const res = await fetch('/api/round-robin/logs?limit=150');
      const data = await res.json();
      if (res.ok && data.logs) {
        setLogs(data.logs);
      }
    } catch {
      // ignore
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = logSearch.toLowerCase();
      const matchesSearch =
        !q ||
        log.staffName.toLowerCase().includes(q) ||
        (log.clientName && log.clientName.toLowerCase().includes(q)) ||
        (log.clientPhone && log.clientPhone.includes(q)) ||
        (log.pageTitle && log.pageTitle.toLowerCase().includes(q)) ||
        (log.pageSlug && log.pageSlug.toLowerCase().includes(q)) ||
        (log.deliveryError && log.deliveryError.toLowerCase().includes(q));

      const matchesStaff = logStaffFilter === 'ALL' || log.staffId === logStaffFilter;
      const matchesStatus = logStatusFilter === 'ALL' || log.status === logStatusFilter;
      const matchesType = logTypeFilter === 'ALL' || log.routeType === logTypeFilter;

      return matchesSearch && matchesStaff && matchesStatus && matchesType;
    });
  }, [logs, logSearch, logStaffFilter, logStatusFilter, logTypeFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Master Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-emerald-950 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-500 dark:text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Round Robin Lead Distribution</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  5 Staff Telegram Accounts
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Automatically distribute incoming visitor inquiries and Telegram contacts with weighted percentage sharing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 cursor-pointer shadow-xs">
            <span className="text-xs font-bold text-slate-700 dark:text-gray-300">System Enabled:</span>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="w-4 h-4 accent-amber-400 cursor-pointer"
            />
            <span className={`text-xs font-black ${settings.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
              {settings.enabled ? 'ACTIVE' : 'PAUSED'}
            </span>
          </label>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{isSaving ? 'Saving Configuration...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Round Robin configuration successfully saved and synchronized across all landing pages!</span>
          </div>
          <button onClick={() => setSaveSuccess(false)} className="cursor-pointer text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs">
            <span>Total Leads Routed</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalLeadsRouted}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Form inquiries assigned</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs">
            <span>Direct Telegram Clicks</span>
            <MessageCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalClicksRouted}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Visitor contact clicks</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs">
            <span>Telegram Delivery Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{deliveryRate}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{totalDeliveries} delivered, {totalFailures} failed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/40 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs">
            <span>Active Staff Reps</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {settings.staffList.filter((s) => s.isActive).length} / {settings.staffList.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Receiving leads currently</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-emerald-950 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'config'
              ? 'bg-amber-400 text-black shadow-xs'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/40'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Staff Accounts & Percentage Allocation</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('logs');
            handleRefreshLogs();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-amber-400 text-black shadow-xs'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/40'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Real-Time Routing Audit Log ({logs.length})</span>
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Percentage Allocation Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-amber-500" />
                  <span>Lead Routing Weight Allocation</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                  Higher percentages receive a larger share of prospective clients.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                    totalPercentage === 100
                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40'
                  }`}
                >
                  Total: {totalPercentage}% {totalPercentage === 100 ? '✓ Balanced' : `(Diff: ${100 - totalPercentage}%)`}
                </span>

                <button
                  type="button"
                  onClick={handleAutoBalance}
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 border border-slate-200 dark:border-emerald-800 text-[11px] font-bold text-slate-800 dark:text-emerald-300 cursor-pointer transition-colors"
                >
                  ⚖️ Auto-Balance to 100%
                </button>
              </div>
            </div>

            {/* Visual multi-colored progress bar */}
            <div className="w-full h-4 bg-slate-100 dark:bg-[#06100B] rounded-full overflow-hidden flex border border-slate-200 dark:border-emerald-950">
              {settings.staffList
                .filter((s) => s.isActive && s.percentage > 0)
                .map((staff, idx) => {
                  const widthPercent = totalPercentage > 0 ? (staff.percentage / totalPercentage) * 100 : 0;
                  const colorClass = staffColors[idx % staffColors.length];

                  return (
                    <div
                      key={staff.id}
                      style={{ width: `${widthPercent}%` }}
                      className={`${colorClass} h-full transition-all duration-300 relative group cursor-pointer`}
                      title={`${staff.name}: ${staff.percentage}%`}
                    />
                  );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {settings.staffList.map((staff, idx) => (
                <div key={staff.id} className="flex items-center gap-1.5 text-[11px]">
                  <span className={`w-2.5 h-2.5 rounded-full ${staff.isActive ? staffColors[idx % staffColors.length] : 'bg-slate-300 dark:bg-gray-700'}`} />
                  <span className={`font-semibold ${staff.isActive ? 'text-slate-800 dark:text-gray-200' : 'text-slate-400 line-through'}`}>
                    {staff.name}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-gray-400">({staff.isActive ? `${staff.percentage}%` : 'Off'})</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5 Staff Accounts Configurator Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Configure 5 Staff Telegram Accounts
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-gray-400">
                Click &quot;⚡ Test Telegram Ping&quot; to verify each staff connection in real-time
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {settings.staffList.map((staff, idx) => {
                const color = staffColors[idx % staffColors.length];
                const testResult = testResults[staff.id];
                const cleanUser = (staff.telegramUsername || '').replace(/^@/, '');

                return (
                  <div
                    key={staff.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      staff.isActive
                        ? 'bg-white dark:bg-[#0A1610] border-slate-200 dark:border-emerald-900/50 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#060D09] border-slate-200 dark:border-gray-800/40 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-emerald-950">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${color} text-black font-black flex items-center justify-center text-sm shadow-sm`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{staff.name || `Staff #${idx + 1}`}</h3>
                            {cleanUser && (
                              <a
                                href={`https://t.me/${cleanUser}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                              >
                                <span>@{cleanUser}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-gray-400">{staff.title || 'Sales Representative'}</p>
                        </div>
                      </div>

                      {/* Right controls: Active switch & Test button */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleTestConnection(staff)}
                          disabled={testResult?.testing || !staff.telegramChatId}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 border border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-300 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-40"
                          title="Sends a test ping to this staff Telegram chat ID"
                        >
                          {testResult?.testing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          )}
                          <span>{testResult?.testing ? 'Pinging...' : '⚡ Test Telegram Ping'}</span>
                        </button>

                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-emerald-900/40 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={staff.isActive}
                            onChange={(e) => handleStaffChange(staff.id, { isActive: e.target.checked })}
                            className="w-4 h-4 accent-amber-400 cursor-pointer"
                          />
                          <span className={`text-xs font-bold ${staff.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {staff.isActive ? 'Receiving Leads' : 'On Leave / Off'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Test result banner if available */}
                    {testResult && !testResult.testing && (
                      <div
                        className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                          testResult.success
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                        )}
                        <div className="flex-1 space-y-0.5">
                          <div className="font-bold">
                            {testResult.success
                              ? `Connection Verified! Telegram Message #${testResult.messageId} delivered to ${staff.name}.`
                              : `Failed to Ping ${staff.name}: ${testResult.error}`}
                          </div>
                          {testResult.diagnostic && (
                            <div className="text-[11px] opacity-90">{testResult.diagnostic}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Editable fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-gray-400 mb-1">
                          Staff Full Name
                        </label>
                        <input
                          type="text"
                          value={staff.name}
                          onChange={(e) => handleStaffChange(staff.id, { name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white font-medium focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-gray-400 mb-1">
                          Role / Title
                        </label>
                        <input
                          type="text"
                          value={staff.title || ''}
                          onChange={(e) => handleStaffChange(staff.id, { title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white font-medium focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-gray-400 mb-1">
                          Telegram @Username
                        </label>
                        <input
                          type="text"
                          value={staff.telegramUsername}
                          placeholder="e.g. sokhachen_khb"
                          onChange={(e) => handleStaffChange(staff.id, { telegramUsername: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white font-mono focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-gray-400">
                            Telegram Chat ID
                          </label>
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">via @userinfobot</span>
                        </div>
                        <input
                          type="text"
                          value={staff.telegramChatId}
                          placeholder="e.g. 589218293"
                          onChange={(e) => handleStaffChange(staff.id, { telegramChatId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white font-mono focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Percentage Slider & Performance stats */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-emerald-950/60 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      <div className="lg:col-span-6 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1">
                            <span>Routing Percentage Share:</span>
                            <strong className="text-amber-600 dark:text-amber-400 text-sm font-black font-mono">
                              {staff.percentage}%
                            </strong>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {staff.isActive ? 'Active weight' : 'Paused (0%)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={staff.percentage}
                            disabled={!staff.isActive}
                            onChange={(e) => handleStaffChange(staff.id, { percentage: Number(e.target.value) })}
                            className="flex-1 accent-amber-400 h-2 bg-slate-200 dark:bg-emerald-950 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={staff.percentage}
                            disabled={!staff.isActive}
                            onChange={(e) => handleStaffChange(staff.id, { percentage: Number(e.target.value) })}
                            className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-center font-bold text-xs"
                          />
                        </div>
                      </div>

                      {/* Cumulative stats for this staff */}
                      <div className="lg:col-span-6 flex flex-wrap items-center justify-end gap-3 text-[11px] text-slate-600 dark:text-gray-400">
                        <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#06100B] border border-slate-200 dark:border-emerald-950">
                          Form Leads: <strong className="text-slate-900 dark:text-white">{staff.totalLeadsRouted || 0}</strong>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#06100B] border border-slate-200 dark:border-emerald-950">
                          Direct Clicks: <strong className="text-slate-900 dark:text-white">{staff.totalDirectClicks || 0}</strong>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#06100B] border border-slate-200 dark:border-emerald-950">
                          Delivered: <strong className="text-emerald-600 dark:text-emerald-400">{staff.successfulDeliveries || 0}</strong>
                        </div>
                        {staff.failedDeliveries ? (
                          <div className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                            Failed: <strong>{staff.failedDeliveries}</strong>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced Engine Settings */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Advanced Routing Engine Rules & Fallbacks</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">
                  Distribution Algorithm
                </label>
                <select
                  value={settings.algorithm}
                  onChange={(e) => setSettings({ ...settings, algorithm: e.target.value as RoundRobinAlgorithm })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-semibold focus:border-amber-400 focus:outline-none"
                >
                  <option value="weighted_percentage">Weighted Percentage (Recommended)</option>
                  <option value="strict_round_robin">Strict Round Robin (Sequential 1-by-1)</option>
                  <option value="random_weighted">Random Weighted Sampling</option>
                </select>
                <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">
                  Matches each staff member proportionally to their configured share %.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">
                  Fallback Manager Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={settings.fallbackChatId || ''}
                  placeholder="e.g. -1001234567890 (Group ID)"
                  onChange={(e) => setSettings({ ...settings, fallbackChatId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">
                  If delivery to staff fails, the lead is immediately forwarded here.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  value={botToken}
                  placeholder="Bot token from @BotFather"
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">
                  Shared Telegram bot used to dispatch direct lead alerts.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-emerald-950/60 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.directContactRoutingEnabled}
                  onChange={(e) => setSettings({ ...settings, directContactRoutingEnabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-gray-200">
                  Enable Direct Visitor Contact Routing (Chat on Telegram clicks)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableManagerNotification}
                  onChange={(e) => setSettings({ ...settings, enableManagerNotification: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-gray-200">
                  Carbon-Copy (CC) Lead Dispatch Alerts to Manager Group
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Logs Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search routing records by prospect name, phone, campaign, or error reason..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={logStaffFilter}
                onChange={(e) => setLogStaffFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
              >
                <option value="ALL">All Staff</option>
                {settings.staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={logTypeFilter}
                onChange={(e) => setLogTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
              >
                <option value="ALL">All Touchpoints</option>
                <option value="FORM_SUBMISSION">Form Submissions</option>
                <option value="DIRECT_CONTACT_CLICK">Telegram Clicks</option>
              </select>

              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FALLBACK">Fallback</option>
                <option value="FAILED">Failed</option>
              </select>

              <button
                type="button"
                onClick={handleRefreshLogs}
                className="p-2 rounded-xl bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 border border-slate-200 dark:border-emerald-800 text-slate-700 dark:text-emerald-300 cursor-pointer transition-colors"
                title="Refresh Logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-gray-300">
                <thead className="bg-slate-50 dark:bg-[#06100B] text-slate-600 dark:text-gray-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-emerald-950">
                  <tr>
                    <th className="p-4">Time & Touchpoint</th>
                    <th className="p-4">Prospect / Visitor</th>
                    <th className="p-4">Campaign</th>
                    <th className="p-4">Assigned Staff</th>
                    <th className="p-4">Share %</th>
                    <th className="p-4">Telegram Delivery</th>
                    <th className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/80">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        No routing records matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const cleanUser = (log.staffTelegram || '').replace(/^@/, '');

                      return (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/30 transition-colors">
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400 ml-1">
                                [{log.routeType === 'FORM_SUBMISSION' ? 'FORM' : 'CLICK'}]
                              </span>
                            </div>
                          </td>

                          <td className="p-4">
                            {log.clientName ? (
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">{log.clientName}</div>
                                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">{log.clientPhone}</div>
                                {log.clientCompany && (
                                  <div className="text-[10px] text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Building className="w-2.5 h-2.5" />
                                    <span>{log.clientCompany}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="text-[11px] text-slate-600 dark:text-gray-300 font-medium">Visitor Click</span>
                                <div className="text-[10px] font-mono text-slate-400">IP: {log.visitorIp || 'Anonymous'}</div>
                              </div>
                            )}
                          </td>

                          <td className="p-4">
                            <div className="font-semibold text-slate-800 dark:text-gray-200 line-clamp-1">
                              {log.pageTitle || log.pageSlug}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">/{log.pageSlug}</div>
                          </td>

                          <td className="p-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{log.staffName}</span>
                              {cleanUser && (
                                <a
                                  href={`https://t.me/${cleanUser}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                  @{cleanUser}
                                </a>
                              )}
                            </div>
                            {log.staffChatId && (
                              <div className="text-[10px] text-slate-400 font-mono">ID: {log.staffChatId}</div>
                            )}
                          </td>

                          <td className="p-4 font-mono font-bold text-amber-700 dark:text-amber-400">
                            {log.percentageWeight}%
                          </td>

                          <td className="p-4">
                            {log.status === 'DELIVERED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Delivered {log.telegramMessageId ? `(#${log.telegramMessageId})` : ''}</span>
                              </span>
                            ) : log.status === 'FALLBACK' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Fallback Sent</span>
                              </span>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30">
                                  <X className="w-3 h-3" />
                                  <span>Failed</span>
                                </span>
                                {log.deliveryError && (
                                  <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 max-w-xs line-clamp-2">
                                    {log.deliveryError}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            {log.targetTelegramUrl ? (
                              <a
                                href={log.targetTelegramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:text-black dark:hover:text-white border border-slate-200 dark:border-emerald-800/60 text-[10px] font-bold"
                              >
                                <span>Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : log.leadId ? (
                              <a
                                href={`/admin/leads?search=${encodeURIComponent(log.clientPhone || log.clientName || '')}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:text-black dark:hover:text-white border border-slate-200 dark:border-emerald-800/60 text-[10px] font-bold"
                              >
                                <span>View Lead</span>
                                <ArrowRight className="w-3 h-3" />
                              </a>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
