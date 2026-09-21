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
  Percent,
  Rocket,
  Dices,
  Zap,
  BarChart3,
  Play,
  FileText,
  Smartphone,
  RotateCcw,
  Code,
  Copy,
  UserPlus,
  Plus,
  Trash2
} from 'lucide-react';
import { 
  RoundRobinSettings, 
  RoundRobinStaff, 
  RoundRobinLog, 
  RoundRobinAlgorithm,
  SystemSettings,
  Lead
} from '@/lib/types';
import {
  DEFAULT_KHMER_TELEGRAM_TEMPLATE,
  DEFAULT_ENGLISH_TELEGRAM_TEMPLATE,
  DEFAULT_COMPACT_TELEGRAM_TEMPLATE,
  DEFAULT_KHMER_WHATSAPP_MESSAGE,
  renderLeadTemplate,
  renderWhatsappGreeting
} from '@/lib/round-robin';

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

const samplePresets = [
  {
    name: 'Oknha Bunleng Heng',
    company: 'Heng Global Logistics & Beverage',
    phone: '+855 12 777 666',
    email: 'bunleng.heng@enterprise.com.kh',
    eventType: 'VIP Trade Delegation',
    budget: '$6,600 (3 VIP Passes)',
    message: 'Interested in meeting with automated green tea machinery manufacturers in Da Lat.'
  },
  {
    name: 'Lok Chumteav Sopheak Vong',
    company: 'Vong Capital Investment Group',
    phone: '+855 12 888 123',
    email: 'sopheak.vong@capital.com.kh',
    eventType: 'Smart City & Retail Tech',
    budget: '$4,400 (2 Executive Passes)',
    message: 'Looking for smart retail kiosk suppliers and digital payment integrations.'
  },
  {
    name: 'Neak Oknha Chamroeun Ly',
    company: 'Prestige Cafe Chain Cambodia',
    phone: '+855 12 999 555',
    email: 'chamroeun@prestigecafe.kh',
    eventType: 'Specialty Coffee & Cafe Roastery',
    budget: '$2,200 (1 VIP Pass)',
    message: 'We want exclusive import rights for single-origin Vietnamese arabica beans.'
  },
  {
    name: 'Dara Pich',
    company: 'Phnom Penh Convention & Expo Ltd',
    phone: '+855 12 345 999',
    email: 'dara.pich@pp-expo.com',
    eventType: 'Exhibition & Trade Mission',
    budget: '$3,300',
    message: 'Coordinating a 5-member procurement delegation for agricultural tech.'
  }
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

  // Active tab in Round Robin Manager: 'config' | 'template' | 'logs'
  const [activeTab, setActiveTab] = useState<'config' | 'template' | 'logs'>('config');

  // Custom Message Alert Template State
  const [customTemplate, setCustomTemplate] = useState<string>(
    settings.customMessageTemplate || DEFAULT_KHMER_TELEGRAM_TEMPLATE
  );
  const [customWhatsappMessage, setCustomWhatsappMessage] = useState<string>(
    settings.customWhatsappMessage || DEFAULT_KHMER_WHATSAPP_MESSAGE
  );
  const [selectedTestStaffId, setSelectedTestStaffId] = useState<string>(() => {
    const configured = settings.staffList.find((s) => s.isActive && s.telegramChatId);
    return configured ? configured.id : settings.staffList[0]?.id || '';
  });
  const [isTestingCustomTemplate, setIsTestingCustomTemplate] = useState(false);
  const [customTemplateTestResult, setCustomTemplateTestResult] = useState<{
    success?: boolean;
    messageId?: number;
    error?: string;
    diagnostic?: string;
  } | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Connection test statuses for each staff member: [staffId]: { testing, success, message, diagnostic }
  const [testResults, setTestResults] = useState<
    Record<string, { testing?: boolean; success?: boolean; messageId?: number; error?: string; diagnostic?: string }>
  >({});

  // Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [logStaffFilter, setLogStaffFilter] = useState('ALL');
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');

  // Simulation Studio State
  const [showSimModal, setShowSimModal] = useState(false);
  const [simMode, setSimMode] = useState<'single_lead' | 'visitor_click' | 'batch_test'>('single_lead');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simPresetIdx, setSimPresetIdx] = useState(0);
  const [simForm, setSimForm] = useState({
    name: samplePresets[0].name,
    company: samplePresets[0].company,
    phone: samplePresets[0].phone,
    email: samplePresets[0].email,
    budget: samplePresets[0].budget,
    message: samplePresets[0].message,
    pageSlug: 'smart-city-tea-cafe'
  });
  const [batchCount, setBatchCount] = useState<number>(10);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

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

  // Add a new staff member
  const handleAddStaff = () => {
    const newId = `staff-${Date.now()}`;
    const nextNumber = settings.staffList.length + 1;
    const newStaff: RoundRobinStaff = {
      id: newId,
      name: `Staff Member #${nextNumber}`,
      title: 'Sales Representative',
      telegramUsername: '',
      telegramChatId: '',
      percentage: 0,
      isActive: true,
      phone: '',
      totalLeadsRouted: 0,
      totalDirectClicks: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0
    };

    setSettings((prev) => {
      const updatedList = [...prev.staffList, newStaff];
      // Auto-rebalance percentages across all active staff
      const activeStaff = updatedList.filter((s) => s.isActive);
      if (activeStaff.length > 0) {
        const share = Math.floor(100 / activeStaff.length);
        const remainder = 100 - share * activeStaff.length;
        let activeIdx = 0;
        const rebalanced = updatedList.map((s) => {
          if (!s.isActive) return { ...s, percentage: 0 };
          const pct = share + (activeIdx === 0 ? remainder : 0);
          activeIdx++;
          return { ...s, percentage: pct };
        });
        return { ...prev, staffList: rebalanced };
      }
      return { ...prev, staffList: updatedList };
    });
  };

  // Delete a staff member
  const handleDeleteStaff = (staffId: string, staffName: string) => {
    if (settings.staffList.length <= 1) {
      alert('ប្រព័ន្ធត្រូវមានយ៉ាងហោចណាស់គណនីបុគ្គលិក ១ នាក់ (You must maintain at least 1 staff account).');
      return;
    }

    const confirmDelete = window.confirm(
      `តើអ្នកពិតជាចង់លុបគណនីបុគ្គលិក "${staffName || 'Staff Member'}" នេះចេញពីប្រព័ន្ធមែនទេ?\n\nAre you sure you want to delete "${staffName || 'Staff Member'}"?`
    );
    if (!confirmDelete) return;

    setSettings((prev) => {
      const remaining = prev.staffList.filter((s) => s.id !== staffId);
      // Rebalance remaining active staff
      const activeStaff = remaining.filter((s) => s.isActive);
      if (activeStaff.length > 0) {
        const share = Math.floor(100 / activeStaff.length);
        const remainder = 100 - share * activeStaff.length;
        let activeIdx = 0;
        const rebalanced = remaining.map((s) => {
          if (!s.isActive) return { ...s, percentage: 0 };
          const pct = share + (activeIdx === 0 ? remainder : 0);
          activeIdx++;
          return { ...s, percentage: pct };
        });
        return { ...prev, staffList: rebalanced };
      }
      return { ...prev, staffList: remaining };
    });

    if (selectedTestStaffId === staffId) {
      const fallback = settings.staffList.find((s) => s.id !== staffId);
      if (fallback) {
        setSelectedTestStaffId(fallback.id);
      }
    }
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
          settings: {
            ...settings,
            customMessageTemplate: customTemplate,
            customWhatsappMessage: customWhatsappMessage
          },
          botToken
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        if (data.settings.customMessageTemplate) {
          setCustomTemplate(data.settings.customMessageTemplate);
        }
        if (data.settings.customWhatsappMessage) {
          setCustomWhatsappMessage(data.settings.customWhatsappMessage);
        }
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

  // Variable merge tags available for Telegram alert templates
  const variablePills = [
    { tag: '{clientName}', label: 'Client Name', khmer: 'ឈ្មោះអតិថិជន', icon: '👤' },
    { tag: '{phone}', label: 'Phone Number', khmer: 'លេខទូរស័ព្ទ', icon: '📞' },
    { tag: '{email}', label: 'Email Address', khmer: 'អ៊ីមែល', icon: '✉️' },
    { tag: '{company}', label: 'Company / Org', khmer: 'ក្រុមហ៊ុន/ស្ថាប័ន', icon: '🏢' },
    { tag: '{eventType}', label: 'Event Type', khmer: 'ប្រភេទកម្មវិធី', icon: '🎪' },
    { tag: '{budget}', label: 'Budget / Package', khmer: 'កញ្ចប់ថវិកា', icon: '💰' },
    { tag: '{date}', label: 'Target Date', khmer: 'កាលបរិច្ឆេទ', icon: '📅' },
    { tag: '{scale}', label: 'Guest Scale', khmer: 'ចំនួនភ្ញៀវ', icon: '👥' },
    { tag: '{note}', label: 'Client Message', khmer: 'សំណើ/សារបន្ថែម', icon: '📝' },
    { tag: '{pageTitle}', label: 'Landing Page Title', khmer: 'ចំណងជើងទំព័រ', icon: '📌' },
    { tag: '{pageSlug}', label: 'Landing Page Slug', khmer: 'Slug ទំព័រ', icon: '🔗' },
    { tag: '{staffName}', label: 'Staff Rep Name', khmer: 'ឈ្មោះបុគ្គលិក', icon: '👔' },
    { tag: '{staffTelegram}', label: 'Staff Telegram Tag', khmer: 'Telegram បុគ្គលិក', icon: '✈️' },
    { tag: '{weight}', label: 'Staff Allocation %', khmer: 'ភាគរយ %', icon: '📊' },
    { tag: '{leadId}', label: 'Lead ID', khmer: 'លេខកូដ Lead', icon: '🏷️' },
    { tag: '{whatsappLink}', label: '1-Click WhatsApp Link', khmer: 'តំណភ្ជាប់ WhatsApp', icon: '💬' },
    { tag: '{crmLink}', label: '1-Click CRM Link', khmer: 'តំណភ្ជាប់ CRM Lead', icon: '📂' },
    { tag: '{source}', label: 'Traffic Source', khmer: 'ប្រភពផ្សាយ (UTM)', icon: '🌐' },
    { tag: '{time}', label: 'Routed Time', khmer: 'ម៉ោងចាត់ចែង', icon: '⏰' }
  ];

  // Sample lead for live Telegram preview
  const samplePreviewLead = useMemo<Lead>(() => ({
    id: 'lead-preview-888',
    landingPageSlug: 'smart-city-tea-cafe',
    landingPageTitle: 'Smart City & Automated Beverage Expo 2026',
    fullName: 'លោកឧកញ៉ា ហេង ប៊ុនឡេង',
    email: 'bunleng.heng@enterprise.com.kh',
    phone: '+855 12 777 666',
    company: 'Heng Global Logistics & Beverage Co., Ltd.',
    eventType: 'ពិព័រណ៍ពាណិជ្ជកម្មកម្រិត VIP (B2B Trade Delegation)',
    estimatedDate: '15-18 តុលា 2026',
    guestCount: 'គណៈប្រតិភូ ៥ នាក់',
    budgetRange: '$6,600 (3 VIP Titanium Passes)',
    packageInterest: 'VIP Chairman Suite Pass',
    message: 'ចាប់អារម្មណ៍ទិញសិទ្ធិចែកចាយផ្តាច់មុខ និងគ្រឿងម៉ាស៊ីនតែបៃតងស្វ័យប្រវត្តិ។ សូមទាក់ទងមកបន្ទាន់។',
    status: 'NEW',
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    utmSource: 'facebook_lead_ad',
    utmCampaign: 'vietnam_cambodia_trade_mission_2026'
  }), []);

  // Staff member selected for preview and live test dispatch
  const currentTestStaff = useMemo<RoundRobinStaff>(() => {
    const found = settings.staffList.find((s) => s.id === selectedTestStaffId);
    if (found) return found;
    return settings.staffList[0] || {
      id: 'staff-1',
      name: 'Chamnab Mey',
      title: 'Senior Event Consultant',
      telegramUsername: 'chamnabmey',
      telegramChatId: '5746705393',
      percentage: 25,
      isActive: true,
      totalLeadsRouted: 0,
      totalDirectClicks: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0
    };
  }, [settings.staffList, selectedTestStaffId]);

  // Live Telegram message preview with HTML formatting
  const previewHtml = useMemo(() => {
    const rendered = renderLeadTemplate(customTemplate, samplePreviewLead, currentTestStaff, {
      leadUrl: 'https://sale.khbevents.com/admin/leads?id=lead-preview-888',
      whatsappUrl: `https://wa.me/85512777666?text=${encodeURIComponent(
        renderWhatsappGreeting(customWhatsappMessage, samplePreviewLead, currentTestStaff)
      )}`
    });
    return rendered.replace(/\n/g, '<br />');
  }, [customTemplate, customWhatsappMessage, samplePreviewLead, currentTestStaff]);

  // Pre-filled WhatsApp greeting preview
  const previewWhatsappText = useMemo(() => {
    return renderWhatsappGreeting(customWhatsappMessage, samplePreviewLead, currentTestStaff);
  }, [customWhatsappMessage, samplePreviewLead, currentTestStaff]);

  // Insert variable tag at cursor position in textarea
  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) {
      setCustomTemplate((prev) => prev + ' ' + tag);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = customTemplate;
    const next = text.substring(0, start) + tag + text.substring(end);
    setCustomTemplate(next);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // Apply template preset
  const handleApplyPreset = (preset: 'khmer' | 'english' | 'compact') => {
    if (preset === 'khmer') {
      setCustomTemplate(DEFAULT_KHMER_TELEGRAM_TEMPLATE);
      setCustomWhatsappMessage(DEFAULT_KHMER_WHATSAPP_MESSAGE);
    } else if (preset === 'english') {
      setCustomTemplate(DEFAULT_ENGLISH_TELEGRAM_TEMPLATE);
    } else if (preset === 'compact') {
      setCustomTemplate(DEFAULT_COMPACT_TELEGRAM_TEMPLATE);
    }
  };

  // Test send custom alert directly to Telegram
  const handleTestSendCustomTemplate = async () => {
    if (!currentTestStaff || !currentTestStaff.telegramChatId) {
      alert('សូមជ្រើសរើសបុគ្គលិកដែលមាន Telegram Chat ID (Please select a staff with a configured Telegram Chat ID).');
      return;
    }

    setIsTestingCustomTemplate(true);
    setCustomTemplateTestResult(null);

    try {
      const res = await fetch('/api/round-robin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentTestStaff.telegramChatId,
          staffName: currentTestStaff.name,
          username: currentTestStaff.telegramUsername,
          botToken,
          customTemplate: customTemplate
        })
      });

      const data = await res.json();
      setCustomTemplateTestResult(data);
    } catch (err: any) {
      setCustomTemplateTestResult({
        success: false,
        error: err?.message || 'Failed to send test alert to Telegram',
        diagnostic: 'Network error communicating with Telegram Bot API.'
      });
    } finally {
      setIsTestingCustomTemplate(false);
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

  // Randomize sample prospect preset
  const handleRandomizePreset = () => {
    const nextIdx = (simPresetIdx + 1) % samplePresets.length;
    setSimPresetIdx(nextIdx);
    const p = samplePresets[nextIdx];
    setSimForm((prev) => ({
      ...prev,
      name: p.name,
      company: p.company,
      phone: p.phone,
      email: p.email,
      budget: p.budget,
      message: p.message
    }));
  };

  // Run lead simulation
  const handleRunSimulation = async (mode: 'single_lead' | 'visitor_click' | 'batch_test') => {
    setIsSimulating(true);
    setSimulationResult(null);

    try {
      const res = await fetch('/api/round-robin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          clientName: simForm.name,
          company: simForm.company,
          phone: simForm.phone,
          email: simForm.email,
          budget: simForm.budget,
          message: simForm.message,
          pageSlug: simForm.pageSlug,
          count: batchCount
        })
      });

      const data = await res.json();
      setSimulationResult(data);

      if (data.success && (mode === 'single_lead' || mode === 'visitor_click')) {
        await handleRefreshLogs();
        try {
          const setRes = await fetch('/api/round-robin/settings');
          const setData = await setRes.json();
          if (setData.success && setData.settings) {
            setSettings(setData.settings);
          }
        } catch {}
      }
    } catch (err: any) {
      setSimulationResult({
        success: false,
        error: err?.message || 'Simulation execution failed'
      });
    } finally {
      setIsSimulating(false);
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
                  {settings.staffList.length} Staff Telegram Accounts
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
            onClick={() => {
              setShowSimModal(true);
              setSimulationResult(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all shadow-md hover:shadow-emerald-500/20 cursor-pointer"
            title="Launch Round Robin lead distribution simulation flight"
          >
            <Rocket className="w-4 h-4 text-amber-300" />
            <span>🚀 Run Simulation</span>
          </button>

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
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 font-semibold">
            <span>Total Leads Routed</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalLeadsRouted}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Form submissions distributed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 font-semibold">
            <span>Direct Telegram Clicks</span>
            <MessageCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalClicksRouted}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Visitor direct contacts</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 font-semibold">
            <span>Delivery Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {deliveryRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {totalDeliveries} delivered / {totalFailures} failed
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 font-semibold">
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
          onClick={() => setActiveTab('template')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'template'
              ? 'bg-amber-400 text-black shadow-xs'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>📝 Custom Alert Template (Telegram & WhatsApp)</span>
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

        <button
          type="button"
          onClick={() => {
            setShowSimModal(true);
            setSimulationResult(null);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-gradient-to-r from-emerald-600/15 to-amber-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 ml-auto"
        >
          <Rocket className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulation Studio</span>
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Quick Simulation Launch Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#0A2218] to-slate-900 border border-emerald-500/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-black shadow-md shrink-0">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <span>Round Robin Simulation &amp; Test Flight</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-black">
                    1-Click Test
                  </span>
                </h3>
                <p className="text-xs text-gray-300 mt-0.5 max-w-2xl">
                  Test the entire lead cycle: generate a VIP prospect, let the engine select an active staff member by percentage, deliver an authentic lead card to their Telegram, and inspect the real-time audit log.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setSimMode('single_lead');
                  setShowSimModal(true);
                  setSimulationResult(null);
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                <span>Simulate Lead Dispatch</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimMode('batch_test');
                  setShowSimModal(true);
                  setSimulationResult(null);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition-all cursor-pointer"
                title="Test 10-50 lead distributions"
              >
                <BarChart3 className="w-4 h-4 text-amber-300" />
                <span>Batch % Test</span>
              </button>
            </div>
          </div>

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

          {/* Staff Accounts Configurator Cards */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Staff Telegram Accounts</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    {settings.staffList.length} Reps
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                  បន្ថែម ឬលុបគណនីបុគ្គលិក កំណត់ភាគរយចែក Lead និងតេស្ត Telegram Ping ជាក់ស្តែង
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddStaff}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all shadow-md cursor-pointer hover:shadow-emerald-500/20 active:scale-95"
                >
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <span>+ Add Staff Account (បន្ថែមបុគ្គលិក)</span>
                </button>
              </div>
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

                      {/* Right controls: Active switch, Test button & Delete button */}
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleTestConnection(staff)}
                          disabled={testResult?.testing || !staff.telegramChatId}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 border border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-300 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-40"
                          title="Sends a test ping to this staff Telegram chat ID"
                        >
                          {testResult?.testing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          )}
                          <span>{testResult?.testing ? 'Pinging...' : '⚡ Test Ping'}</span>
                        </button>

                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-emerald-900/40 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={staff.isActive}
                            onChange={(e) => handleStaffChange(staff.id, { isActive: e.target.checked })}
                            className="w-4 h-4 accent-amber-400 cursor-pointer"
                          />
                          <span className={`text-xs font-bold ${staff.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {staff.isActive ? 'Active' : 'Off'}
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff.id, staff.name)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-all cursor-pointer"
                          title={`Delete ${staff.name} (លុបគណនីបុគ្គលិកនេះចេញ)`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

            {/* Add Another Staff Member dashed button */}
            <button
              type="button"
              onClick={handleAddStaff}
              className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-emerald-900/60 hover:border-amber-400 dark:hover:border-amber-400 text-slate-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer bg-slate-50/50 dark:bg-black/20 hover:bg-amber-500/5 active:scale-[0.99]"
            >
              <UserPlus className="w-4 h-4 text-amber-500" />
              <span>+ Add Another Staff Member (បន្ថែមគណនីបុគ្គលិកថ្មី)</span>
            </button>
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

      {/* ─────────────────────────────────────────────────────────────
          CUSTOM ALERT TEMPLATE BUILDER (TELEGRAM & WHATSAPP)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'template' && (
        <div className="space-y-6">
          {/* Header & Preset Selector Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-[#0A2218] to-slate-900 border border-emerald-500/30 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-black shadow-lg shrink-0 mt-0.5">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-white">
                    Telegram &amp; WhatsApp Custom Alert Message Builder
                  </h2>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-amber-400 text-black uppercase tracking-wider">
                    HTML Enabled
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Preview
                  </span>
                </div>
                <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                  រៀបចំទម្រង់សារជូនដំណឹងពេលមានអតិថិជនថ្មីចូលមកតាមពាក្យពេចន៍របស់អ្នក (ភាសាខ្មែរ រូបសញ្ញា Emojis និងទិន្នន័យអតិថិជនស្វ័យប្រវត្តិ)។ រាល់ការកែប្រែនឹងបង្ហាញក្នុងប្រអប់ Telegram Mockup ភ្លាមៗ។
                </p>
              </div>
            </div>

            {/* Quick Template Presets */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto bg-black/40 p-2 rounded-2xl border border-emerald-500/20">
              <span className="text-[11px] font-bold text-gray-400 px-2">គំរូសាររហ័ស (Presets):</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('khmer')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                title="ប្រើប្រាស់គំរូភាសាខ្មែរពេញលេញ (Full Khmer standard)"
              >
                <span>🇰🇭 គំរូខ្មែរ (Default)</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('english')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                title="Switch to English standard template"
              >
                <span>🇬🇧 English</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('compact')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                title="ប្រើប្រាស់គំរូខ្លីរហ័ស (Compact format)"
              >
                <span>⚡ ខ្លីរហ័ស (Compact)</span>
              </button>
            </div>
          </div>

          {/* 2-Column Layout: Editor on Left, Live Mockup on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Variable Tags + Editors */}
            <div className="lg:col-span-7 space-y-5">
              {/* Dynamic Variable Pills Palette */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Dynamic Variable Tags (ចុចដើម្បីបញ្ចូល Tag ដោយស្វ័យប្រវត្តិ)
                    </h3>
                  </div>
                  {copiedTag && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30 animate-fadeIn flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>បញ្ចូល {copiedTag} រួចរាល់!</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-gray-400">
                  ចុចលើ Tag ណាមួយខាងក្រោមដើម្បីបញ្ចូលទៅកាន់ទីតាំងទស្សន៍ទ្រនិច (Cursor) ក្នុងប្រអប់អត្ថបទ៖
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {variablePills.map((p) => (
                    <button
                      key={p.tag}
                      type="button"
                      onClick={() => handleInsertTag(p.tag)}
                      className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-emerald-950/60 hover:bg-amber-400/20 dark:hover:bg-amber-400/20 border border-slate-200 dark:border-emerald-900/60 hover:border-amber-400/50 text-slate-800 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-300 text-xs font-mono font-medium transition-all cursor-pointer shadow-2xs active:scale-95"
                      title={`${p.khmer} (${p.label}) - ចុចដើម្បីបញ្ចូល`}
                    >
                      <span className="text-[11px]">{p.icon}</span>
                      <strong className="text-[11px]">{p.tag}</strong>
                      <span className="text-[10px] text-slate-400 dark:text-gray-400 font-sans group-hover:text-amber-700 dark:group-hover:text-amber-300">
                        {p.khmer}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Telegram HTML Template Textarea */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-sky-500" />
                      <span>Telegram Alert Message Template (HTML Mode)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                      សារនេះនឹងត្រូវ Bot ផ្ញើជូនបុគ្គលិកភ្លាមៗនៅពេលមាន Lead ថ្មី។
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-[#06100B] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-emerald-950">
                    <Code className="w-3 h-3 text-amber-500" />
                    <span>Supports: &lt;b&gt;, &lt;i&gt;, &lt;code&gt;, &lt;a href&gt;</span>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={customTemplate}
                    onChange={(e) => setCustomTemplate(e.target.value)}
                    rows={16}
                    className="w-full p-4 rounded-2xl bg-slate-900 dark:bg-[#06100B] text-slate-100 font-mono text-xs leading-relaxed border border-slate-700 dark:border-emerald-900/80 focus:border-amber-400 focus:outline-none shadow-inner resize-y"
                    placeholder="បញ្ចូលទម្រង់សារ HTML សម្រាប់ Telegram..."
                    spellCheck={false}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">HTML Tags ដែលអាចប្រើបាន៖</span>
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-emerald-950 font-mono text-[10px] text-slate-800 dark:text-gray-200">&lt;b&gt;bold&lt;/b&gt;</code>
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-emerald-950 font-mono text-[10px] text-slate-800 dark:text-gray-200">&lt;i&gt;italic&lt;/i&gt;</code>
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-emerald-950 font-mono text-[10px] text-slate-800 dark:text-gray-200">&lt;code&gt;text&lt;/code&gt;</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('khmer')}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>ស្តារគំរូដើម (Reset to Default)</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Pre-Filled Greeting Template */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 shadow-sm space-y-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-500" />
                    <span>WhatsApp Pre-filled Greeting Template (សារស្វាគមន៍ WhatsApp ជាមុន)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                    អត្ថបទដែលបំពេញទុកជាមុននៅពេលបុគ្គលិកចុចប៊ូតុង "ផ្ញើសារ WhatsApp" ដើម្បីទាក់ទងទៅអតិថិជន។
                  </p>
                </div>

                <textarea
                  value={customWhatsappMessage}
                  onChange={(e) => setCustomWhatsappMessage(e.target.value)}
                  rows={3}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#06100B] text-slate-900 dark:text-white text-xs leading-relaxed border border-slate-200 dark:border-emerald-900/80 focus:border-amber-400 focus:outline-none"
                  placeholder="ជម្រាបសួរ {clientName}..."
                />

                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Tags ដែលគាំទ្រ៖</span>
                  <code className="font-mono text-emerald-600 dark:text-emerald-400">{'{clientName}'}</code>
                  <code className="font-mono text-emerald-600 dark:text-emerald-400">{'{staffName}'}</code>
                  <code className="font-mono text-emerald-600 dark:text-emerald-400">{'{pageTitle}'}</code>
                  <code className="font-mono text-emerald-600 dark:text-emerald-400">{'{company}'}</code>
                  <code className="font-mono text-emerald-600 dark:text-emerald-400">{'{phone}'}</code>
                </div>
              </div>

              {/* Actions: Save & Live Test Section */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>សាកល្បងផ្ញើ &amp; រក្សាទុក (Test &amp; Save Template)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                      ផ្ញើសារសាកល្បងជាមួយគំរូថ្មីនេះផ្ទាល់ទៅកាន់ Telegram បុគ្គលិក ដើម្បីពិនិត្យមើលរូបរាងពិតប្រាកដ។
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{isSaving ? 'កំពុងរក្សាទុក...' : '💾 Save Custom Template'}</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-emerald-950/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">
                      ជ្រើសរើសបុគ្គលិកទទួលសារសាកល្បង៖
                    </label>
                    <select
                      value={selectedTestStaffId}
                      onChange={(e) => setSelectedTestStaffId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#06100B] border border-slate-200 dark:border-emerald-900/60 text-slate-900 dark:text-white text-xs font-semibold focus:border-amber-400 focus:outline-none"
                    >
                      {settings.staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.telegramUsername ? `(@${s.telegramUsername})` : ''} {s.telegramChatId ? `[Chat ID: ${s.telegramChatId}]` : '[No Chat ID]'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:self-end">
                    <button
                      type="button"
                      onClick={handleTestSendCustomTemplate}
                      disabled={isTestingCustomTemplate}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isTestingCustomTemplate ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>⚡ Test Send to Telegram</span>
                    </button>
                  </div>
                </div>

                {/* Test Result Feedback */}
                {customTemplateTestResult && (
                  <div
                    className={`p-4 rounded-2xl border text-xs animate-fadeIn ${
                      customTemplateTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-2">
                        {customTemplateTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                        )}
                        <span>
                          {customTemplateTestResult.success
                            ? 'ការផ្ញើសារសាកល្បងទទួលបានជោគជ័យ ១០០%!'
                            : 'ការផ្ញើសារសាកល្បងមិនបានជោគជ័យ'}
                        </span>
                      </div>
                      {customTemplateTestResult.messageId && (
                        <span className="font-mono text-[10px] opacity-75">
                          Telegram Msg ID: #{customTemplateTestResult.messageId}
                        </span>
                      )}
                    </div>
                    {customTemplateTestResult.success ? (
                      <p className="mt-1 text-[11px] opacity-90">
                        សារសាកល្បងត្រូវបានបញ្ជូនទៅកាន់គណនី Telegram របស់ <strong>{currentTestStaff.name}</strong> រួចរាល់ហើយ។ សូមបើកមើល Telegram app របស់អ្នក!
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] opacity-90">
                        កំហុស៖ {customTemplateTestResult.error || 'Unknown error'}.{' '}
                        {customTemplateTestResult.diagnostic || ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Live Telegram Smartphone Bubble Mockup */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
              <div className="rounded-3xl bg-[#0e1621] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                {/* Telegram App Header */}
                <div className="px-4 py-3.5 bg-[#17212b] border-b border-slate-800/80 flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center font-black text-white text-sm shadow-md">
                      <Send className="w-5 h-5 -ml-0.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">KHB Events Lead Bot</span>
                        <span className="w-3.5 h-3.5 rounded-full bg-sky-400 text-black text-[9px] flex items-center justify-center font-black" title="Verified Bot">
                          ✓
                        </span>
                      </div>
                      <div className="text-[10px] text-sky-300/80">bot • @khbevent_sale_bot</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE PREVIEW
                    </span>
                    <div className="text-[9px] text-gray-400 mt-0.5">Recv: {currentTestStaff.name}</div>
                  </div>
                </div>

                {/* Telegram Chat Wallpaper Area */}
                <div className="p-4 sm:p-5 bg-[#0e1621] min-h-[420px] max-h-[640px] overflow-y-auto flex flex-col justify-end space-y-3">
                  {/* Telegram Date Chip */}
                  <div className="self-center">
                    <span className="px-3 py-1 rounded-full bg-black/40 text-gray-300 text-[10px] font-semibold backdrop-blur-xs border border-white/5">
                      ថ្ងៃនេះ • ពេលវេលាជាក់ស្តែង
                    </span>
                  </div>

                  {/* Telegram Message Bubble */}
                  <div className="self-start max-w-full sm:max-w-[94%] bg-[#182533] text-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-lg border border-sky-900/30 text-xs leading-relaxed space-y-2.5">
                    <div
                      className="prose prose-invert max-w-none text-xs leading-relaxed break-words [&_b]:text-white [&_b]:font-black [&_strong]:text-white [&_code]:bg-black/40 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-amber-300 [&_code]:font-mono [&_a]:text-sky-400 [&_a]:font-bold [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />

                    {/* Timestamp & Seen status */}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 pt-1 border-t border-white/5">
                      <span>12:45 PM</span>
                      <span className="text-sky-400 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* Telegram Input Simulation Footer */}
                <div className="p-3 bg-[#17212b] border-t border-slate-800/80 flex items-center gap-2 text-xs text-gray-400">
                  <div className="flex-1 px-3.5 py-2 rounded-xl bg-[#0e1621] text-gray-500 text-[11px] border border-slate-800">
                    សារស្វ័យប្រវត្តិនឹងផ្ញើជូនបុគ្គលិកនៅទីនេះ...
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* WhatsApp Greeting Preview Card */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Pre-filled Message Preview</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    wa.me
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0A2016] border border-emerald-900/60 text-emerald-100 text-[11px] italic font-sans">
                  "{previewWhatsappText}"
                </div>
              </div>
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

      {/* ─────────────────────────────────────────────────────────────
          SIMULATION STUDIO MODAL DIALOG
      ───────────────────────────────────────────────────────────── */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-800/70 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-emerald-950 flex items-start justify-between bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-black shadow-md">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Round Robin Simulation Studio</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                      Test Flight
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                    Test lead routing, verify Telegram bot delivery to your configured staff accounts, and benchmark percentage weights.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSimModal(false);
                  setSimulationResult(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="grid grid-cols-3 p-1.5 bg-slate-100 dark:bg-black/50 border-b border-slate-200 dark:border-emerald-950 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => {
                  setSimMode('single_lead');
                  setSimulationResult(null);
                }}
                className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  simMode === 'single_lead'
                    ? 'bg-white dark:bg-[#0A1610] text-emerald-800 dark:text-emerald-300 shadow-sm border border-slate-200 dark:border-emerald-800/60'
                    : 'text-slate-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-amber-500" />
                <span>Live Lead Dispatch</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimMode('visitor_click');
                  setSimulationResult(null);
                }}
                className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  simMode === 'visitor_click'
                    ? 'bg-white dark:bg-[#0A1610] text-emerald-800 dark:text-emerald-300 shadow-sm border border-slate-200 dark:border-emerald-800/60'
                    : 'text-slate-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Visitor Direct Click</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimMode('batch_test');
                  setSimulationResult(null);
                }}
                className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  simMode === 'batch_test'
                    ? 'bg-white dark:bg-[#0A1610] text-emerald-800 dark:text-emerald-300 shadow-sm border border-slate-200 dark:border-emerald-800/60'
                    : 'text-slate-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
                <span>Batch % Benchmark</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* MODE 1: LIVE LEAD DISPATCH */}
              {simMode === 'single_lead' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Live Telegram Delivery Flight</span>
                    </div>
                    <p className="text-[11px] opacity-90">
                      This simulates an authentic VIP prospect inquiry. The Round Robin engine calculates staff percentage weights, selects the winning staff member, fires a live lead notification directly to their Telegram bot chat, and records an audit log.
                    </p>
                  </div>

                  {/* Prospect Card & Randomizer */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-emerald-950 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black uppercase tracking-wider text-slate-700 dark:text-gray-300 text-[11px]">
                        Simulated VIP Prospect Details
                      </span>
                      <button
                        type="button"
                        onClick={handleRandomizePreset}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-slate-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-900 font-bold text-[11px] cursor-pointer"
                        title="Cycle between realistic VIP business profiles"
                      >
                        <Dices className="w-3.5 h-3.5 text-amber-500" />
                        <span>🎲 Randomize Prospect</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={simForm.name}
                          onChange={(e) => setSimForm({ ...simForm, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">
                          Company / Enterprise
                        </label>
                        <input
                          type="text"
                          value={simForm.company}
                          onChange={(e) => setSimForm({ ...simForm, company: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={simForm.phone}
                          onChange={(e) => setSimForm({ ...simForm, phone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 font-semibold text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">
                          Budget / Package
                        </label>
                        <input
                          type="text"
                          value={simForm.budget}
                          onChange={(e) => setSimForm({ ...simForm, budget: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 font-semibold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">
                        Inquiry Note (Tagged [SIMULATION TEST])
                      </label>
                      <input
                        type="text"
                        value={simForm.message}
                        onChange={(e) => setSimForm({ ...simForm, message: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Trigger Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleRunSimulation('single_lead')}
                      disabled={isSimulating}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Rocket className="w-4 h-4" />
                      )}
                      <span>
                        {isSimulating
                          ? 'Dispatching Real Lead to Telegram...'
                          : '🚀 Dispatch Simulated Lead Now'}
                      </span>
                    </button>
                  </div>

                  {/* Live Simulation Result Display */}
                  {simulationResult && simMode === 'single_lead' && (
                    <div className="pt-3 border-t border-slate-200 dark:border-emerald-950 animate-fadeIn space-y-3">
                      {simulationResult.success ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-slate-800 dark:text-gray-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-black text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              <span>Simulation Successful! Lead Created &amp; Distributed</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                              Live Test
                            </span>
                          </div>

                          {simulationResult.routing && (
                            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned Staff Member:</span>
                                <div className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                                  <span>{simulationResult.routing.staffName}</span>
                                  {simulationResult.routing.staffTelegram && (
                                    <a
                                      href={`https://t.me/${simulationResult.routing.staffTelegram.replace(/^@/, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                                    >
                                      <span>@{simulationResult.routing.staffTelegram.replace(/^@/, '')}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Telegram Chat ID: {simulationResult.routing.staffChatId}
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Telegram Alert Status:</span>
                                <div className="mt-1">
                                  {simulationResult.routing.status === 'DELIVERED' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>Delivered (Msg #{simulationResult.routing.telegramMessageId})</span>
                                    </span>
                                  ) : simulationResult.routing.status === 'FALLBACK' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Fallback Transmitted</span>
                                    </span>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30">
                                        <X className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Delivery Failed</span>
                                      </span>
                                      {simulationResult.routing.deliveryError && (
                                        <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                          {simulationResult.routing.deliveryError}
                                        </div>
                                      )}
                                      {simulationResult.routing.deliveryError?.includes('Bot Token') ? (
                                        <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30">
                                          <strong>Action Required:</strong> Enter your Telegram Bot Token (from <code>@BotFather</code>) in the <strong>&quot;Telegram Bot Token&quot;</strong> field below (under Advanced Rules) and click <em>Save All Settings</em>.
                                        </div>
                                      ) : simulationResult.routing.deliveryError?.includes('Chat ID') ? (
                                        <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30">
                                          <strong>Action Required:</strong> Enter the numeric Telegram Chat ID for this staff member (obtained via <code>@userinfobot</code>) and click <em>Save All Settings</em>.
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-slate-500 dark:text-gray-400 pt-1">
                                          💡 Tip: The staff member must open the Telegram bot and click <strong>START</strong> (/start) first before Telegram allows incoming alerts.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-1">
                                  Weight Share: {simulationResult.routing.percentageWeight}%
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-slate-500 dark:text-gray-400">
                              Lead recorded with ID: <span className="font-mono text-slate-700 dark:text-gray-300">{simulationResult.lead?.id}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowSimModal(false);
                                  setActiveTab('logs');
                                  handleRefreshLogs();
                                }}
                                className="px-3 py-1 rounded-lg bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-300 font-bold text-[11px] hover:underline cursor-pointer"
                              >
                                View in Audit Log →
                              </button>
                              <a
                                href={`/admin/leads?search=${encodeURIComponent(simForm.phone)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 rounded-lg bg-amber-400 text-black font-extrabold text-[11px] hover:bg-amber-300 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Open in CRM</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                          <div className="space-y-0.5">
                            <div className="font-bold">Simulation Failed</div>
                            <div className="text-[11px]">{simulationResult.error}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: VISITOR DIRECT CONTACT CLICK */}
              {simMode === 'visitor_click' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                      <span>Visitor &quot;Chat on Telegram&quot; Click Router</span>
                    </div>
                    <p className="text-[11px] opacity-90">
                      When a prospect visits any landing page (e.g. <code>/smart-city-tea-cafe</code>) and clicks the Telegram contact button, the router calculates the next staff member based on your percentages and redirects them to that staff member&apos;s direct Telegram handle.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleRunSimulation('visitor_click')}
                      disabled={isSimulating}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      <span>
                        {isSimulating
                          ? 'Calculating Target Telegram Route...'
                          : '💬 Simulate Visitor Telegram Click'}
                      </span>
                    </button>
                  </div>

                  {simulationResult && simMode === 'visitor_click' && (
                    <div className="pt-3 border-t border-slate-200 dark:border-emerald-950 animate-fadeIn space-y-3">
                      {simulationResult.success ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-slate-800 dark:text-gray-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-black text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              <span>Routing Calculated Successfully!</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                              Direct Contact
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1610] border border-slate-200 dark:border-emerald-900/60 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Selected Staff Rep:</span>
                                <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {simulationResult.staff?.name} ({simulationResult.staff?.role})
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Telegram Handle:</span>
                                <div className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                                  @{simulationResult.staff?.username?.replace(/^@/, '')}
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                Generated Redirect Link:
                              </span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={simulationResult.targetTelegramUrl || ''}
                                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-black font-mono text-[11px] text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-emerald-950"
                                />
                                <a
                                  href={simulationResult.targetTelegramUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] whitespace-nowrap inline-flex items-center gap-1"
                                >
                                  <span>Test Open</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                          <div className="space-y-0.5">
                            <div className="font-bold">Routing Failed</div>
                            <div className="text-[11px]">{simulationResult.error}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: BATCH PERCENTAGE DISTRIBUTION BENCHMARK */}
              {simMode === 'batch_test' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-900 dark:text-purple-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      <span>Batch Percentage Distribution Benchmark</span>
                    </div>
                    <p className="text-[11px] opacity-90">
                      Simulates multiple leads in rapid sequence without sending real Telegram alerts. Benchmark and verify that your configured percentages accurately apportion leads across your active staff members.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-emerald-950">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-gray-200 block">
                        Select Simulation Batch Size:
                      </span>
                      <span className="text-[11px] text-slate-400">
                        How many consecutive leads to simulate
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {[10, 20, 50].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setBatchCount(num)}
                          className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                            batchCount === num
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white dark:bg-[#0A1610] text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-emerald-900/60 hover:bg-slate-100 dark:hover:bg-emerald-950'
                          }`}
                        >
                          {num} Leads
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleRunSimulation('batch_test')}
                      disabled={isSimulating}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      <span>
                        {isSimulating
                          ? `Simulating ${batchCount} Leads...`
                          : `⚡ Run Batch Benchmark (${batchCount} Leads)`}
                      </span>
                    </button>
                  </div>

                  {simulationResult && simMode === 'batch_test' && (
                    <div className="pt-3 border-t border-slate-200 dark:border-emerald-950 animate-fadeIn space-y-4">
                      {simulationResult.success ? (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-900 dark:text-purple-300 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-black">
                              <CheckCircle2 className="w-5 h-5 text-purple-500" />
                              <span>Benchmark Complete: {simulationResult.totalSimulated} Leads Distributed</span>
                            </div>
                            <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/20">
                              Target vs Actual
                            </span>
                          </div>

                          {/* Distribution Summary Table */}
                          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-900/60">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 dark:bg-black/60 text-slate-600 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-emerald-950">
                                <tr>
                                  <th className="p-3">Staff Member</th>
                                  <th className="p-3">Configured %</th>
                                  <th className="p-3">Assigned Count</th>
                                  <th className="p-3">Actual %</th>
                                  <th className="p-3">Balance Visual</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/60 bg-white dark:bg-[#0A1610]">
                                {simulationResult.summary?.map((row: any, idx: number) => {
                                  const colorClass = staffColors[idx % staffColors.length];
                                  return (
                                    <tr key={row.staffId} className="hover:bg-slate-50 dark:hover:bg-emerald-950/20">
                                      <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                                        <span>{row.staffName}</span>
                                      </td>
                                      <td className="p-3 font-mono font-bold text-slate-600 dark:text-gray-300">
                                        {row.configuredWeight}%
                                      </td>
                                      <td className="p-3 font-bold text-amber-700 dark:text-amber-400">
                                        {row.assignedCount} / {simulationResult.totalSimulated}
                                      </td>
                                      <td className="p-3 font-mono font-black text-emerald-700 dark:text-emerald-400">
                                        {row.actualPercentage}%
                                      </td>
                                      <td className="p-3 w-40">
                                        <div className="w-full bg-slate-100 dark:bg-black/40 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-emerald-950">
                                          <div
                                            className={`${colorClass} h-full transition-all`}
                                            style={{ width: `${row.actualPercentage}%` }}
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Trace Sequence */}
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-emerald-950">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                              Sequential Routing Order (First 15 Leads):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {simulationResult.history?.slice(0, 15).map((h: any) => (
                                <span
                                  key={h.leadIndex}
                                  className="px-2 py-0.5 rounded-md bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-900/60 text-[10px] font-medium text-slate-700 dark:text-gray-300 font-mono"
                                >
                                  #{h.leadIndex} ➔ {h.assignedStaffName}
                                </span>
                              ))}
                              {simulationResult.history?.length > 15 && (
                                <span className="px-2 py-0.5 text-[10px] text-slate-400 font-bold">
                                  +{simulationResult.history.length - 15} more leads...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                          <div className="space-y-0.5">
                            <div className="font-bold">Benchmark Failed</div>
                            <div className="text-[11px]">{simulationResult.error}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
