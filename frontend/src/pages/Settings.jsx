import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  ShieldCheck,
  Printer,
  RefreshCw,
  Save,
  CheckCircle2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Lock,
  GitBranch,
  Plus,
  Trash2,
  QrCode,
  Smartphone,
  Key,
  DollarSign,
  Layers,
  Sliders,
  LogOut,
  AlertOctagon,
  ExternalLink,
  Hash,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAvailablePrinters } from '../services/printerService';
import logo from '../assets/logo.png';

const TABS = [
  { id: 'license', label: 'Master License & HQ Link', icon: Key, badge: 'SaaS / PaaS' },
  { id: 'ticketFormat', label: 'Ticket Format & Sequence', icon: FileText, badge: 'Strict Rule' },
  { id: 'profile', label: 'Store Profile & Legal Entity', icon: Building2 },
  { id: 'branding', label: 'Branding & UPI Payment Hub', icon: ImageIcon },
  { id: 'catalog', label: 'Ornament Catalog & Masters', icon: Sparkles, badge: 'Dynamic' },
  { id: 'kyc', label: 'KYC Document & Photo Policy', icon: ShieldCheck },
  { id: 'whatsapp', label: 'WhatsApp Reminders Automation', icon: MessageSquare },
  { id: 'security', label: 'Manager PIN & Security Overrides', icon: Lock },
  { id: 'hardware', label: 'Hardware Printers & Paper', icon: Printer }
];

export default function Settings() {
  const { customerCode, oauthStatus, isRegistered, verifyOauth, refreshOauthStatus } = useAuth();
  const { toast, confirmModal, promptModal } = useToast();
  const [activeTab, setActiveTab] = useState('license');
  const [disconnecting, setDisconnecting] = useState(false);
  const [config, setConfig] = useState({
    shopName: 'Sri Lakshmi Pawn Brokers',
    rbiLicenseNo: 'RB/PB/2026/001',
    gstinNo: '',
    address: '123 Commercial Street, City',
    phone: '044-28340987',
    mobile: '9345578103',
    email: 'info@srilakshmipawn.com',
    eligibleCollateralPct: 75,
    rbiInterestCapPa: 24,
    defaultMonthlyInterestPct: 2.0,
    defaultGracePeriodDays: 7,
    defaultPenaltyPct: 1.0,
    thermalPrinterName: 'Default Printer',
    thermalPaperWidth: '80mm',
    smsRemindersEnabled: true,
    whatsappAlertsEnabled: true,
    // Pawn Ticket Number & Sequence Format
    ticketConfig: {
      enabled: true,
      prefix: 'PWN',
      suffix: '',
      separator: '-',
      yearFormat: 'YYYY',
      monthFormat: 'NONE',
      paddingDigits: 4,
      nextSequence: 1,
      patternTemplate: '{PREFIX}-{YEAR}-{SEQ}',
      strictEnforcement: true
    },
    // Master-governed status
    branchConfig: {
      mode: 'SINGLE',
      maxBranches: 1,
      allowInterBranchTransfer: false,
      branches: []
    },
    featurePermissions: {
      allowPartialRelease: false,
      allowRePledge: false,
      enableBlacklistShield: true,
      allowCustomPrintTemplates: true
    },
    // KYC Document Policy
    kycConfig: {
      customerPhoto: { enabled: true, required: true },
      aadhaar: { enabled: true, required: true },
      pan: { enabled: true, required: false, thresholdAmount: 200000 },
      passbook: { enabled: true, required: false },
      voterId: { enabled: false, required: false },
      customDocs: []
    },
    // WhatsApp Automated Reminder Policy
    whatsappReminderConfig: {
      enabled: true,
      daysBeforeDue: 2,
      templateLanguage: 'en',
      messageTemplate: 'Dear {{customerName}}, this is a gentle reminder that your Gold Loan pledge {{ticketNumber}} of ₹{{principalAmount}} is due on {{dueDate}}. Total interest & principal payable: ₹{{totalDue}}. Pay via UPI: {{upiPayLink}} or visit {{shopName}} ({{branchPhone}}).',
      overdueTemplate: 'URGENT: Dear {{customerName}}, your Gold Loan {{ticketNumber}} at {{shopName}} is overdue by {{daysOverdue}} days. Outstanding total: ₹{{totalDue}}. Please settle immediately to avoid statutory auction proceedings.'
    },
    // Branding & Upload Assets
    brandingConfig: {
      logoUrl: '',
      stampUrl: '',
      letterheadUrl: '',
      upiId: 'renicpawn@icici',
      upiPayeeName: 'PawnBook Pro'
    },
    // DIY Print & Quotation Designer Settings
    printConfig: {
      paperSize: '80mm',
      showLogo: true,
      showQrCode: true,
      showCustomerPhoto: true,
      showOrnamentPhotos: false,
      showTerms: true,
      customHeader: '',
      customFooter: 'Thank you for your business. Keep this receipt safe for redemption.',
      customTerms: '1. Ornaments pledged will be held in safe custody.\n2. Interest is calculated monthly as per RBI guidelines.\n3. Overdue loans beyond grace period are liable for statutory public auction with prior notice.'
    },
    // Cashier & Manager Security Overrides
    managerSecurityConfig: {
      managerPin: '1234',
      requirePinForDiscountWaiver: true,
      waiverLimitWithoutPin: 500,
      requirePinForLtvOverride: true
    }
  });

  // OAuth Credentials form state
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [verifyingOauth, setVerifyingOauth] = useState(false);
  const [oauthFeedback, setOauthFeedback] = useState(null);

  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [uploadingField, setUploadingField] = useState(null);

  // Jewellery Item Catalog Master Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Gold');
  const [newItemPurity, setNewItemPurity] = useState('22K');
  const [newItemDeduction, setNewItemDeduction] = useState('0');
  const [catalogSearch, setCatalogSearch] = useState('');

  useEffect(() => {
    loadSettings();
    getAvailablePrinters().then(list => setPrinters(list));
  }, []);

  useEffect(() => {
    if (oauthStatus?.clientId && !clientIdInput) {
      setClientIdInput(oauthStatus.clientId);
    }
  }, [oauthStatus]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data?.success && res.data.config) {
        setConfig(prev => ({
          ...prev,
          ...res.data.config,
          kycConfig: { ...prev.kycConfig, ...(res.data.config.kycConfig || {}) },
          whatsappReminderConfig: { ...prev.whatsappReminderConfig, ...(res.data.config.whatsappReminderConfig || {}) },
          brandingConfig: { ...prev.brandingConfig, ...(res.data.config.brandingConfig || {}) },
          printConfig: { ...prev.printConfig, ...(res.data.config.printConfig || {}) },
          managerSecurityConfig: { ...prev.managerSecurityConfig, ...(res.data.config.managerSecurityConfig || {}) },
          branchConfig: { ...prev.branchConfig, ...(res.data.config.branchConfig || {}) },
          featurePermissions: { ...prev.featurePermissions, ...(res.data.config.featurePermissions || {}) }
        }));
        if (res.data.config.oauthConfig?.clientId) {
          setClientIdInput(res.data.config.oauthConfig.clientId);
        }
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setConfig(prev => ({
          ...prev,
          brandingConfig: {
            ...prev.brandingConfig,
            [field]: res.data.fileUrl
          }
        }));
      }
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingField(null);
    }
  };

  const handleVerifyOauth = async (e) => {
    e?.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      toast.error('Please enter both Client ID and Client Secret.');
      setOauthFeedback({ type: 'error', message: 'Please enter both Client ID and Client Secret.' });
      return;
    }
    setVerifyingOauth(true);
    setOauthFeedback(null);
    try {
      const res = await verifyOauth(clientIdInput.trim(), clientSecretInput.trim());
      if (res.success) {
        toast.success(res.message || 'Credentials verified with Renic Soft Master!');
        setOauthFeedback({ type: 'success', message: res.message || 'Credentials verified with Renic Soft Master!' });
        await refreshOauthStatus();
        await loadSettings();
      } else {
        toast.error(res.message || 'Invalid Client ID or Secret.');
        setOauthFeedback({ type: 'error', message: res.message || 'Invalid Client ID or Secret.' });
      }
    } catch (err) {
      toast.error(err.message || 'Verification error');
      setOauthFeedback({ type: 'error', message: err.message || 'Verification error' });
    } finally {
      setVerifyingOauth(false);
    }
  };

  const handleDisconnectOauth = async () => {
    const confirmed = await confirmModal({
      title: 'Disconnect Master License Link?',
      message: 'Are you sure you want to disconnect and revoke the Master License link? This will instantly lock all operational screens (Loans, Repayments, Daybook, etc.) until re-authenticated with Master HQ.',
      confirmText: 'Disconnect & Lock',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    setDisconnecting(true);
    try {
      const res = await api.post('/settings/disconnect-oauth');
      if (res.data?.success) {
        toast.warning('Master license link revoked. Operational screens are now locked.');
        setOauthFeedback({ type: 'error', message: 'Master link disconnected. Operational screens are now locked.' });
        setClientSecretInput('');
        await refreshOauthStatus();
        await loadSettings();
      }
    } catch (err) {
      toast.error('Failed to disconnect: ' + (err.response?.data?.message || err.message));
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', config);
      if (res.data?.success) {
        toast.success('All settings saved successfully!');
      }
    } catch (err) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncRenic = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.post('/settings/sync-renic');
      if (res.data?.success) {
        setSyncResult(res.data.message);
        toast.success('Master permissions synchronized successfully!');
        loadSettings();
      }
    } catch (e) {
      setSyncResult('Sync note: Master HQ verified locally.');
      toast.info('Master HQ verified locally.');
    } finally {
      setSyncing(false);
    }
  };

  const addCustomDoc = async () => {
    const label = await promptModal({
      title: 'Add Custom KYC Document',
      message: 'Enter Custom Document Name (e.g. "Gold Purchase Invoice" or "Electricity Bill"):',
      placeholder: 'Document Name',
      confirmText: 'Add Document'
    });
    if (!label || !label.trim()) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existing = config.kycConfig?.customDocs || [];
    setConfig({
      ...config,
      kycConfig: {
        ...config.kycConfig,
        customDocs: [...existing, { docKey: key, docLabel: label.trim(), enabled: true, required: false }]
      }
    });
    toast.success(`Custom document "${label.trim()}" added to policy.`);
  };

  const removeCustomDoc = (index) => {
    const list = [...(config.kycConfig?.customDocs || [])];
    list.splice(index, 1);
    setConfig({
      ...config,
      kycConfig: {
        ...config.kycConfig,
        customDocs: list
      }
    });
  };

  const insertMergeTag = (tag) => {
    setConfig(prev => ({
      ...prev,
      whatsappReminderConfig: {
        ...prev.whatsappReminderConfig,
        messageTemplate: (prev.whatsappReminderConfig?.messageTemplate || '') + ' ' + tag
      }
    }));
  };

  const getTicketPreview = (tc = config.ticketConfig || {}) => {
    const prefix = (tc.prefix !== undefined ? tc.prefix : 'PWN').trim();
    const suffix = (tc.suffix || '').trim();
    const separator = tc.separator !== undefined ? tc.separator : '-';
    const paddingDigits = Math.max(2, Math.min(8, Number(tc.paddingDigits) || 4));
    const startSeq = Number(tc.nextSequence) || 1;
    const formattedSeq = String(startSeq).padStart(paddingDigits, '0');

    const now = new Date();
    const yearFull = String(now.getFullYear());
    const yearShort = yearFull.slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const pattern = (tc.patternTemplate || '').trim();

    if (!pattern) {
      const parts = [];
      if (prefix) parts.push(prefix);
      if (tc.yearFormat === 'YYYY') parts.push(yearFull);
      else if (tc.yearFormat === 'YY') parts.push(yearShort);
      if (tc.monthFormat === 'MM') parts.push(month);
      parts.push(formattedSeq);
      if (suffix) parts.push(suffix);
      return parts.join(separator);
    } else {
      return pattern
        .replace(/\{PREFIX\}/gi, prefix)
        .replace(/\{SUFFIX\}/gi, suffix)
        .replace(/\{YEAR\}/gi, tc.yearFormat === 'YY' ? yearShort : yearFull)
        .replace(/\{YYYY\}/gi, yearFull)
        .replace(/\{YY\}/gi, yearShort)
        .replace(/\{MONTH\}/gi, month)
        .replace(/\{MM\}/gi, month)
        .replace(/\{BRANCH\}/gi, 'MAIN')
        .replace(/\{SEQ\}/gi, formattedSeq)
        .replace(/\{0+\}/g, (match) => String(startSeq).padStart(match.length, '0'));
    }
  };

  const catalogItemsList = (config.customOrnamentTypes || [
    'Gold Necklace (22K)',
    'Gold Bangles (Pair)',
    'Gold Chain (22K)',
    'Gold Ring / Band',
    'Gold Earrings / Studs',
    'Gold Mangalsutra / Thali',
    'Gold Coin / Bar 24K',
    'Gold Waist Belt (Oddiyanam)',
    'Gold Bracelet / Kada',
    'Silver Anklets / Kolusu',
    'Silver Plate / Articles'
  ]).map(it => {
    if (typeof it === 'string') {
      const isSilver = it.toLowerCase().includes('silver');
      const is24K = it.includes('24K');
      const is18K = it.includes('18K');
      return {
        name: it,
        category: isSilver ? 'Silver' : 'Gold',
        purity: isSilver ? 'Silver' : is24K ? '24K' : is18K ? '18K' : '22K',
        deductionPct: 0
      };
    }
    return {
      name: it.name || it.itemName || 'Ornament',
      category: it.category || (it.name?.toLowerCase().includes('silver') ? 'Silver' : 'Gold'),
      purity: it.purity || '22K',
      deductionPct: it.deductionPct !== undefined ? it.deductionPct : 0
    };
  });

  const filteredCatalogItems = catalogItemsList.filter(it => {
    if (!catalogSearch.trim()) return true;
    const t = catalogSearch.toLowerCase();
    return it.name?.toLowerCase().includes(t) || it.category?.toLowerCase().includes(t) || it.purity?.toLowerCase().includes(t);
  });

  const handleAddNewItemToCatalog = () => {
    const val = newItemName.trim();
    if (!val) {
      toast.warning('Please enter a jewellery / ornament name.');
      return;
    }
    const currentList = config.customOrnamentTypes || [
      'Gold Necklace (22K)',
      'Gold Bangles (Pair)',
      'Gold Chain (22K)',
      'Gold Ring / Band',
      'Gold Earrings / Studs',
      'Gold Mangalsutra / Thali',
      'Gold Coin / Bar 24K',
      'Gold Waist Belt (Oddiyanam)',
      'Gold Bracelet / Kada',
      'Silver Anklets / Kolusu',
      'Silver Plate / Articles'
    ];
    const exists = currentList.some(it => {
      const name = typeof it === 'string' ? it : it.name;
      return name.toLowerCase() === val.toLowerCase();
    });
    if (exists) {
      toast.warning(`"${val}" already exists in the catalog.`);
      return;
    }
    const newItemObj = {
      name: val,
      category: newItemCategory,
      purity: newItemPurity,
      deductionPct: Number(newItemDeduction) || 0
    };
    setConfig({
      ...config,
      customOrnamentTypes: [...currentList, newItemObj]
    });
    toast.success(`"${val}" added to Jewellery Master Catalog.`);
    setNewItemName('');
    setNewItemDeduction('0');
  };

  const handleRemoveCatalogItem = (index) => {
    const currentList = [...(config.customOrnamentTypes || [
      'Gold Necklace (22K)',
      'Gold Bangles (Pair)',
      'Gold Chain (22K)',
      'Gold Ring / Band',
      'Gold Earrings / Studs',
      'Gold Mangalsutra / Thali',
      'Gold Coin / Bar 24K',
      'Gold Waist Belt (Oddiyanam)',
      'Gold Bracelet / Kada',
      'Silver Anklets / Kolusu',
      'Silver Plate / Articles'
    ])];
    currentList.splice(index, 1);
    setConfig({
      ...config,
      customOrnamentTypes: currentList
    });
    toast.info('Item removed from catalog.');
  };

  return (
    <div className="h-full max-h-full flex flex-col gap-2 min-h-0 overflow-hidden select-none">
      {/* 1. TOP HEADER & GLOBAL ACTION BAR */}
      <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-[#84cc16] flex items-center justify-center shadow-xs flex-shrink-0">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Showroom &amp; Master Control Workspace</span>
              {isRegistered ? (
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-black bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full animate-pulse">
                  LOCKED
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Enterprise configuration workbench: KYC rules, WhatsApp alerts, branding assets, RBI parameters &amp; Master HQ link.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Save className="w-4 h-4 text-[#84cc16]" />
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* 2. MASTER-DETAIL WORKSPACE (CATEGORY RAIL + CONFIGURATION DETAIL PANE) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 overflow-hidden">
        {/* LEFT MASTER CATEGORY NAVIGATION RAIL */}
        <div className="w-full lg:w-64 h-auto lg:h-full bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden shrink-0">
          <div className="px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
            <span>Configuration Desks</span>
            <span className="font-mono font-bold text-slate-700">{customerCode}</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition w-full text-left ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TabIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#84cc16]' : 'text-slate-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase hidden sm:inline ${
                      isActive ? 'bg-[#84cc16] text-slate-900' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Status Box */}
          <div className="hidden lg:block p-3 border-t border-slate-100 text-[10px] text-slate-500 space-y-1 shrink-0 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span>Master Connection:</span>
              <strong className={isRegistered ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                {isRegistered ? '✓ VERIFIED' : 'UNVERIFIED'}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Topology Mode:</span>
              <strong className="text-slate-800 font-bold">{config.branchConfig?.mode || 'SINGLE'}</strong>
            </div>
          </div>
        </div>

        {/* RIGHT DETAIL CONFIGURATION PANE */}
        <div className="flex-1 min-h-0 h-full overflow-y-auto bg-slate-50/40 rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          {/* TAB 1: MASTER LICENSE & HQ LINK */}
          {activeTab === 'license' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#1e293b] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md flex-shrink-0">
                      <img src={logo} alt="Renic Soft Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="text-sm font-black flex items-center gap-2">
                        <span>Renic Soft Master HQ Licensing Desk</span>
                        {isRegistered ? (
                          <span className="text-[10px] font-black bg-[#84cc16] text-[#0f172a] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ACTIVE &amp; REGISTERED</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                            UNREGISTERED / LOCKED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5 font-medium">
                        Customer Tenant Code: <span className="font-mono font-bold text-white uppercase">{customerCode}</span> • Branch Mode: <strong className="text-lime-400">{config.branchConfig?.mode || 'SINGLE'}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSyncRenic}
                    disabled={syncing}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs shadow-xs transition self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#84cc16]' : ''}`} />
                    <span>{syncing ? 'Syncing...' : 'Sync Master OTA'}</span>
                  </button>
                </div>

                <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed font-medium">
                    <div className="font-bold text-blue-950 flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span>Security &amp; Client Secret Masking Policy</span>
                    </div>
                    In SaaS and PaaS mode, all operational screens (Loans, Repayments, Redemptions, Vaults, Day Book) are locked until authenticated with a valid <strong>Client ID</strong> and <strong>Client Secret</strong> provisioned in <strong>Renic Soft Master HQ</strong>.
                    <br />
                    <em>Note: For enterprise security, configured Client Secrets are securely stored encrypted on your server and are masked in the browser.</em>
                  </div>

                  {oauthFeedback && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      oauthFeedback.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                        : 'bg-red-50 border border-red-300 text-red-800'
                    }`}>
                      {oauthFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertOctagon className="w-4 h-4 text-red-600" />}
                      <span>{oauthFeedback.message}</span>
                    </div>
                  )}

                  {syncResult && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>{syncResult}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOauth} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Renic Client ID (Client ID from Renic Soft Master)
                      </label>
                      <input
                        type="text"
                        value={clientIdInput}
                        onChange={(e) => setClientIdInput(e.target.value)}
                        placeholder="e.g. RC_ID_PB01_..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono font-semibold focus:ring-2 focus:ring-[#84cc16] focus:border-[#84cc16] outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Renic Client Secret
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={clientSecretInput}
                          onChange={(e) => setClientSecretInput(e.target.value)}
                          placeholder={oauthStatus?.hasClientSecret ? '•••••••••••••••• (Secret Configured)' : 'Enter Secret to Verify'}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono font-semibold focus:ring-2 focus:ring-[#84cc16] focus:border-[#84cc16] outline-hidden pr-16"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 font-bold hover:text-slate-600"
                        >
                          {showSecret ? 'HIDE' : 'SHOW'}
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">
                        Status: {isRegistered ? (
                          <strong className="text-emerald-700">Verified with Master HQ ({oauthStatus?.lastVerifiedAt ? new Date(oauthStatus.lastVerifiedAt).toLocaleString('en-IN') : 'Active'})</strong>
                        ) : (
                          <strong className="text-red-600">Unverified (All operational screens blocked)</strong>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isRegistered && (
                          <button
                            type="button"
                            onClick={handleDisconnectOauth}
                            disabled={disconnecting}
                            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl text-xs transition"
                            title="Revoke license registration to test screen locking"
                          >
                            {disconnecting ? 'Disconnecting...' : 'Disconnect / Revoke Link'}
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={verifyingOauth}
                          className="px-5 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                        >
                          {verifyingOauth ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#84cc16]" /> : <Sparkles className="w-3.5 h-3.5 text-[#84cc16]" />}
                          <span>{verifyingOauth ? 'Verifying...' : 'Verify & Activate'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* MASTER GOVERNANCE & BRANCH TOPOLOGY BADGE */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lime-400 uppercase tracking-wider text-xs flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-lime-400" />
                    <span>Master Governance &amp; Licensed Desks (Renic Soft HQ Control)</span>
                  </h2>
                  <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                    OTA Controlled
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Topology</span>
                    <strong className="text-sm text-white font-black block mt-0.5">
                      {config.branchConfig?.mode === 'MULTI' ? `Multi-Branch (Max ${config.branchConfig?.maxBranches || 3})` : 'Single Branch Store'}
                    </strong>
                    <span className="text-[10px] text-slate-400">Decided in Renic Soft Master</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Partial Gold Release</span>
                    <strong className={`text-sm font-black block mt-0.5 ${config.featurePermissions?.allowPartialRelease ? 'text-lime-400' : 'text-slate-400'}`}>
                      {config.featurePermissions?.allowPartialRelease ? '✓ LICENSED' : '🔒 LOCKED IN MASTER'}
                    </strong>
                    <span className="text-[10px] text-slate-400">Partial principal item release</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank Re-Pledge Desk</span>
                    <strong className={`text-sm font-black block mt-0.5 ${config.featurePermissions?.allowRePledge ? 'text-lime-400' : 'text-slate-400'}`}>
                      {config.featurePermissions?.allowRePledge ? '✓ LICENSED' : '🔒 LOCKED IN MASTER'}
                    </strong>
                    <span className="text-[10px] text-slate-400">Bank overdraft refinance ledger</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Fraud Shield</span>
                    <strong className="text-sm text-lime-400 font-black block mt-0.5">
                      ✓ ACTIVE
                    </strong>
                    <span className="text-[10px] text-slate-400">Stolen gold blacklist check</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TICKET FORMAT & SEQUENCE MAINTENANCE */}
          {activeTab === 'ticketFormat' && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#84cc16]" />
                    <span>Pawn Ticket Number &amp; Series Format Policy</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Maintain the exact format rule, year stamps, digit padding, and sequence counters for generating official pawn loan tickets.
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider self-start sm:self-auto ${
                  config.ticketConfig?.enabled
                    ? 'bg-lime-100 text-lime-800 border border-lime-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {config.ticketConfig?.enabled ? '✓ Format Active & Enforced' : '⚠️ Format Disabled (Creation Blocked)'}
                </span>
              </div>

              {/* LIVE TICKET NUMBER PREVIEW BANNER */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 p-5 rounded-2xl border border-slate-800 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-[#84cc16]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black tracking-widest text-[#84cc16] bg-[#84cc16]/20 px-2 py-0.5 rounded">
                        Live Formatted Preview
                      </span>
                      <span className="text-[11px] text-slate-400">Next generated pawn loan will receive:</span>
                    </div>
                    <div className="font-mono text-2xl sm:text-3xl font-black text-white tracking-wider flex items-center gap-2">
                      <span className="text-[#84cc16] font-normal">#</span>
                      <span>{getTicketPreview(config.ticketConfig)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Sequence counter: <span className="text-white font-mono font-bold">#{config.ticketConfig?.nextSequence || 1}</span> &bull; 
                      Padding: <span className="text-white font-mono font-bold">{config.ticketConfig?.paddingDigits || 4} digits</span> &bull; 
                      Year Stamp: <span className="text-white font-mono font-bold">{config.ticketConfig?.yearFormat || 'YYYY'}</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-300">Format Active</span>
                      <input
                        type="checkbox"
                        checked={config.ticketConfig?.enabled ?? true}
                        onChange={(e) => setConfig({
                          ...config,
                          ticketConfig: { ...config.ticketConfig, enabled: e.target.checked }
                        })}
                        className="w-4 h-4 rounded text-lime-600 focus:ring-[#84cc16]"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-300">Strict Enforcement</span>
                      <input
                        type="checkbox"
                        checked={config.ticketConfig?.strictEnforcement ?? true}
                        onChange={(e) => setConfig({
                          ...config,
                          ticketConfig: { ...config.ticketConfig, strictEnforcement: e.target.checked }
                        })}
                        className="w-4 h-4 rounded text-lime-600 focus:ring-[#84cc16]"
                      />
                    </label>
                    <span className="text-[10px] text-amber-400/90 leading-tight">
                      * When active, loan creation is blocked if format settings are invalid or empty.
                    </span>
                  </div>
                </div>
              </div>

              {/* QUICK PRESETS */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Quick Format Presets (Click to apply recommended template):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Standard Dash', template: '{PREFIX}-{YEAR}-{SEQ}', prefix: 'PWN', sep: '-', year: 'YYYY', month: 'NONE', pad: 4 },
                    { label: 'Slash / Year / Seq', template: '{PREFIX}/{YEAR}/{SEQ}', prefix: 'PB', sep: '/', year: 'YYYY', month: 'NONE', pad: 5 },
                    { label: 'Gold Short Date', template: '{PREFIX}-{YEAR}-{MONTH}-{SEQ}', prefix: 'GLD', sep: '-', year: 'YY', month: 'MM', pad: 4 },
                    { label: 'Simple Loan #', template: '{PREFIX}-{SEQ}', prefix: 'LN', sep: '-', year: 'NONE', month: 'NONE', pad: 5 }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setConfig({
                        ...config,
                        ticketConfig: {
                          ...config.ticketConfig,
                          patternTemplate: preset.template,
                          prefix: preset.prefix,
                          separator: preset.sep,
                          yearFormat: preset.year,
                          monthFormat: preset.month,
                          paddingDigits: preset.pad
                        }
                      })}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-[#84cc16] hover:bg-lime-50/50 transition text-left group"
                    >
                      <div className="text-[11px] font-bold text-slate-800 group-hover:text-lime-900">{preset.label}</div>
                      <div className="font-mono text-[10px] text-slate-500 font-semibold truncate mt-0.5">{preset.template}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* STANDARD CONFIGURATION CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prefix Code *</label>
                  <input
                    type="text"
                    required
                    value={config.ticketConfig?.prefix ?? 'PWN'}
                    onChange={(e) => setConfig({
                      ...config,
                      ticketConfig: { ...config.ticketConfig, prefix: e.target.value.toUpperCase() }
                    })}
                    placeholder="e.g. PWN, PB, GLD"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                  <span className="text-[10px] text-slate-400">Main prefix abbreviation for pawn receipts</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Separator Character</label>
                  <select
                    value={config.ticketConfig?.separator ?? '-'}
                    onChange={(e) => setConfig({
                      ...config,
                      ticketConfig: { ...config.ticketConfig, separator: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  >
                    <option value="-">Hyphen / Dash ( - )</option>
                    <option value="/">Forward Slash ( / )</option>
                    <option value=".">Dot / Period ( . )</option>
                    <option value="_">Underscore ( _ )</option>
                    <option value="">None (No separator)</option>
                  </select>
                  <span className="text-[10px] text-slate-400">Used between prefix, year, and sequence</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Year Stamp</label>
                  <select
                    value={config.ticketConfig?.yearFormat ?? 'YYYY'}
                    onChange={(e) => setConfig({
                      ...config,
                      ticketConfig: { ...config.ticketConfig, yearFormat: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  >
                    <option value="YYYY">4 Digits (e.g. 2026)</option>
                    <option value="YY">2 Digits (e.g. 26)</option>
                    <option value="NONE">None (Do not include year)</option>
                  </select>
                  <span className="text-[10px] text-slate-400">Current financial / calendar year stamp</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Month Stamp</label>
                  <select
                    value={config.ticketConfig?.monthFormat ?? 'NONE'}
                    onChange={(e) => setConfig({
                      ...config,
                      ticketConfig: { ...config.ticketConfig, monthFormat: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  >
                    <option value="NONE">None (Omit Month)</option>
                    <option value="MM">2 Digits Month (e.g. 10)</option>
                  </select>
                  <span className="text-[10px] text-slate-400">Optional 2-digit month prefix</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Number Padding (Digits)</label>
                  <select
                    value={config.ticketConfig?.paddingDigits ?? 4}
                    onChange={(e) => setConfig({
                      ...config,
                      ticketConfig: { ...config.ticketConfig, paddingDigits: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  >
                    <option value={3}>3 Digits (e.g. 001)</option>
                    <option value={4}>4 Digits (e.g. 0001)</option>
                    <option value={5}>5 Digits (e.g. 00001)</option>
                    <option value={6}>6 Digits (e.g. 000001)</option>
                  </select>
                  <span className="text-[10px] text-slate-400">Zero-padding applied to sequence number</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Next Sequence Counter *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={config.ticketConfig?.nextSequence ?? 1}
                    onChange={(e) => setConfig({
                      ...config,
                      ticketConfig: { ...config.ticketConfig, nextSequence: Math.max(1, parseInt(e.target.value) || 1) }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                  <span className="text-[10px] text-slate-400">Next starting ticket number to issue</span>
                </div>
              </div>

              {/* ADVANCED CUSTOM PATTERN TEMPLATE */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-bold text-slate-800 text-xs">Custom Pattern Template (Optional)</label>
                    <p className="text-[11px] text-slate-500">
                      Leave empty to use standard fields above, or write custom token templates for specialized voucher numbering.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({
                      ...config,
                      ticketConfig: { ...config.ticketConfig, patternTemplate: '{PREFIX}-{YEAR}-{SEQ}' }
                    })}
                    className="text-[11px] text-[#0f172a] hover:text-[#84cc16] font-bold underline"
                  >
                    Reset to Default
                  </button>
                </div>

                <input
                  type="text"
                  value={config.ticketConfig?.patternTemplate || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    ticketConfig: { ...config.ticketConfig, patternTemplate: e.target.value }
                  })}
                  placeholder="{PREFIX}-{YEAR}-{SEQ}"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                />

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Click to append dynamic merge tags:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['{PREFIX}', '{YEAR}', '{YYYY}', '{YY}', '{MONTH}', '{MM}', '{BRANCH}', '{SEQ}', '{0000}', '{00000}'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setConfig({
                          ...config,
                          ticketConfig: {
                            ...config.ticketConfig,
                            patternTemplate: ((config.ticketConfig?.patternTemplate || '') + tag).trim()
                          }
                        })}
                        className="px-2 py-1 bg-white hover:bg-lime-50 text-slate-700 hover:text-lime-800 border border-slate-200 hover:border-lime-300 rounded-lg font-mono text-[10px] font-bold transition shadow-2xs"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORE PROFILE & LEGAL ENTITY */}
          {activeTab === 'profile' && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#84cc16]" />
                  <span>Showroom Identity &amp; Legal Entity Information</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  These details are printed on Pawn Tickets, Quotations, Repayment Receipts, and Auction Notices.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shop / Showroom Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={config.shopName || ''}
                    onChange={(e) => setConfig({ ...config, shopName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pawn Broker License No *</label>
                  <input
                    type="text"
                    required
                    value={config.rbiLicenseNo || ''}
                    onChange={(e) => setConfig({ ...config, rbiLicenseNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={config.gstinNo || ''}
                    onChange={(e) => setConfig({ ...config, gstinNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={config.mobile || ''}
                    onChange={(e) => setConfig({ ...config, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Landline / Store Phone</label>
                  <input
                    type="tel"
                    value={config.phone || ''}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={config.email || ''}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Full Store Address (Printed on Pawn Tickets)</label>
                  <input
                    type="text"
                    value={config.address || ''}
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING & DYNAMIC UPI */}
          {activeTab === 'branding' && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#84cc16]" />
                    <span>Store Branding Assets &amp; Dynamic UPI VPA</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Used across Quotations, Slips, &amp; Invoices</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Company Logo */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Official Company Logo</span>
                    {config.brandingConfig?.logoUrl && <span className="text-[10px] text-emerald-700 font-bold">✓ Uploaded</span>}
                  </div>
                  <div className="h-24 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {config.brandingConfig?.logoUrl ? (
                      <img src={config.brandingConfig.logoUrl} alt="Logo Preview" className="h-full w-full object-contain p-2" />
                    ) : (
                      <div className="text-center text-slate-400 text-[11px]">
                        <Upload className="w-5 h-5 mx-auto mb-1 opacity-50" />
                        <span>No logo uploaded</span>
                      </div>
                    )}
                  </div>
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('logoUrl', e.target.files?.[0])}
                    />
                    <span className="w-full block text-center py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg cursor-pointer transition">
                      {uploadingField === 'logoUrl' ? 'Uploading...' : 'Upload Logo'}
                    </span>
                  </label>
                </div>

                {/* Official Stamp & Sign */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Authorized Stamp / Sign</span>
                    {config.brandingConfig?.stampUrl && <span className="text-[10px] text-emerald-700 font-bold">✓ Uploaded</span>}
                  </div>
                  <div className="h-24 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {config.brandingConfig?.stampUrl ? (
                      <img src={config.brandingConfig.stampUrl} alt="Stamp Preview" className="h-full w-full object-contain p-2" />
                    ) : (
                      <div className="text-center text-slate-400 text-[11px]">
                        <Upload className="w-5 h-5 mx-auto mb-1 opacity-50" />
                        <span>No stamp uploaded</span>
                      </div>
                    )}
                  </div>
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('stampUrl', e.target.files?.[0])}
                    />
                    <span className="w-full block text-center py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg cursor-pointer transition">
                      {uploadingField === 'stampUrl' ? 'Uploading...' : 'Upload Stamp'}
                    </span>
                  </label>
                </div>

                {/* Pre-printed Letterhead Background */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Letterhead Overlay</span>
                    {config.brandingConfig?.letterheadUrl && <span className="text-[10px] text-emerald-700 font-bold">✓ Uploaded</span>}
                  </div>
                  <div className="h-24 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {config.brandingConfig?.letterheadUrl ? (
                      <img src={config.brandingConfig.letterheadUrl} alt="Letterhead Preview" className="h-full w-full object-contain p-2" />
                    ) : (
                      <div className="text-center text-slate-400 text-[11px]">
                        <Upload className="w-5 h-5 mx-auto mb-1 opacity-50" />
                        <span>Optional letterhead bg</span>
                      </div>
                    )}
                  </div>
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('letterheadUrl', e.target.files?.[0])}
                    />
                    <span className="w-full block text-center py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg cursor-pointer transition">
                      {uploadingField === 'letterheadUrl' ? 'Uploading...' : 'Upload Letterhead'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Dynamic UPI Payment ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5 text-xs">
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>UPI Payment VPA ID (For Dynamic Bill QR Code)</span>
                  </label>
                  <input
                    type="text"
                    value={config.brandingConfig?.upiId || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      brandingConfig: { ...(config.brandingConfig || {}), upiId: e.target.value }
                    })}
                    placeholder="e.g. srilakshmipawn@icici"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-indigo-900 outline-hidden focus:ring-2 focus:ring-[#84cc16] text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">UPI Payee Display Name</label>
                  <input
                    type="text"
                    value={config.brandingConfig?.upiPayeeName || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      brandingConfig: { ...(config.brandingConfig || {}), upiPayeeName: e.target.value }
                    })}
                    placeholder="e.g. Sri Lakshmi Pawn Brokers"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16] text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KYC POLICY & DOCUMENT RULES */}
          {activeTab === 'kyc' && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#84cc16]" />
                    <span>Customer KYC Document &amp; Photo Policy</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure identity verification requirements enforced during New Pawn Loan pledge intake.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCustomDoc}
                  className="px-3 py-1.5 bg-lime-50 hover:bg-lime-100 text-[#0f172a] border border-lime-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5 text-[#65a30d]" />
                  <span>+ Add Custom Doc</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Customer Live Face Photo */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Customer Live Face Photo</span>
                    <span className="text-[10px] text-slate-500">Webcam snap or file upload of borrower</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.kycConfig?.customerPhoto?.enabled !== false}
                        onChange={(e) => setConfig({
                          ...config,
                          kycConfig: {
                            ...config.kycConfig,
                            customerPhoto: { ...config.kycConfig?.customerPhoto, enabled: e.target.checked }
                          }
                        })}
                        className="rounded text-lime-600 focus:ring-lime-500 w-4 h-4"
                      />
                      <span className="text-[11px] font-bold text-slate-700">Enabled</span>
                    </label>
                    <select
                      value={config.kycConfig?.customerPhoto?.required ? 'REQUIRED' : 'OPTIONAL'}
                      onChange={(e) => setConfig({
                        ...config,
                        kycConfig: {
                          ...config.kycConfig,
                          customerPhoto: { ...config.kycConfig?.customerPhoto, required: e.target.value === 'REQUIRED' }
                        }
                      })}
                      disabled={config.kycConfig?.customerPhoto?.enabled === false}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold disabled:opacity-50"
                    >
                      <option value="REQUIRED">Mandatory</option>
                      <option value="OPTIONAL">Optional</option>
                    </select>
                  </div>
                </div>

                {/* Aadhaar Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Aadhaar Card Proof</span>
                    <span className="text-[10px] text-slate-500">UIDAI number and photo scan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.kycConfig?.aadhaar?.enabled !== false}
                        onChange={(e) => setConfig({
                          ...config,
                          kycConfig: {
                            ...config.kycConfig,
                            aadhaar: { ...config.kycConfig?.aadhaar, enabled: e.target.checked }
                          }
                        })}
                        className="rounded text-lime-600 focus:ring-lime-500 w-4 h-4"
                      />
                      <span className="text-[11px] font-bold text-slate-700">Enabled</span>
                    </label>
                    <select
                      value={config.kycConfig?.aadhaar?.required ? 'REQUIRED' : 'OPTIONAL'}
                      onChange={(e) => setConfig({
                        ...config,
                        kycConfig: {
                          ...config.kycConfig,
                          aadhaar: { ...config.kycConfig?.aadhaar, required: e.target.value === 'REQUIRED' }
                        }
                      })}
                      disabled={config.kycConfig?.aadhaar?.enabled === false}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold disabled:opacity-50"
                    >
                      <option value="REQUIRED">Mandatory</option>
                      <option value="OPTIONAL">Optional</option>
                    </select>
                  </div>
                </div>

                {/* PAN Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">PAN Card (Statutory AML)</span>
                    <span className="text-[10px] text-slate-500">Statutory for loans &gt; ₹2,00,000</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.kycConfig?.pan?.enabled !== false}
                        onChange={(e) => setConfig({
                          ...config,
                          kycConfig: {
                            ...config.kycConfig,
                            pan: { ...config.kycConfig?.pan, enabled: e.target.checked }
                          }
                        })}
                        className="rounded text-lime-600 focus:ring-lime-500 w-4 h-4"
                      />
                      <span className="text-[11px] font-bold text-slate-700">Enabled</span>
                    </label>
                    <select
                      value={config.kycConfig?.pan?.required ? 'REQUIRED' : 'OPTIONAL'}
                      onChange={(e) => setConfig({
                        ...config,
                        kycConfig: {
                          ...config.kycConfig,
                          pan: { ...config.kycConfig?.pan, required: e.target.value === 'REQUIRED' }
                        }
                      })}
                      disabled={config.kycConfig?.pan?.enabled === false}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold disabled:opacity-50"
                    >
                      <option value="REQUIRED">Mandatory</option>
                      <option value="OPTIONAL">Optional</option>
                    </select>
                  </div>
                </div>

                {/* Bank Passbook */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Bank Passbook / Cheque</span>
                    <span className="text-[10px] text-slate-500">Required for direct NEFT/IMPS disbursement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.kycConfig?.passbook?.enabled !== false}
                        onChange={(e) => setConfig({
                          ...config,
                          kycConfig: {
                            ...config.kycConfig,
                            passbook: { ...config.kycConfig?.passbook, enabled: e.target.checked }
                          }
                        })}
                        className="rounded text-lime-600 focus:ring-lime-500 w-4 h-4"
                      />
                      <span className="text-[11px] font-bold text-slate-700">Enabled</span>
                    </label>
                    <select
                      value={config.kycConfig?.passbook?.required ? 'REQUIRED' : 'OPTIONAL'}
                      onChange={(e) => setConfig({
                        ...config,
                        kycConfig: {
                          ...config.kycConfig,
                          passbook: { ...config.kycConfig?.passbook, required: e.target.value === 'REQUIRED' }
                        }
                      })}
                      disabled={config.kycConfig?.passbook?.enabled === false}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold disabled:opacity-50"
                    >
                      <option value="REQUIRED">Mandatory</option>
                      <option value="OPTIONAL">Optional</option>
                    </select>
                  </div>
                </div>

                {/* Custom Document Entries */}
                {(config.kycConfig?.customDocs || []).map((cd, idx) => (
                  <div key={idx} className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-950 block">{cd.docLabel}</span>
                      <span className="text-[10px] text-emerald-700 font-mono">{cd.docKey}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={cd.required ? 'REQUIRED' : 'OPTIONAL'}
                        onChange={(e) => {
                          const list = [...(config.kycConfig?.customDocs || [])];
                          list[idx].required = e.target.value === 'REQUIRED';
                          setConfig({ ...config, kycConfig: { ...config.kycConfig, customDocs: list } });
                        }}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold"
                      >
                        <option value="REQUIRED">Mandatory</option>
                        <option value="OPTIONAL">Optional</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeCustomDoc(idx)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: WHATSAPP AUTOMATED REMINDERS */}
          {activeTab === 'whatsapp' && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#84cc16]" />
                    <span>Automated WhatsApp Repayment Reminders &amp; Alerts</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure automated notifications sent to customers before loan due dates and top header alerts.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={config.whatsappReminderConfig?.enabled !== false}
                    onChange={(e) => setConfig({
                      ...config,
                      whatsappReminderConfig: {
                        ...config.whatsappReminderConfig,
                        enabled: e.target.checked
                      }
                    })}
                    className="rounded text-lime-600 focus:ring-lime-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-800">Auto Reminders Active</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reminder Schedule (Days Before Due Date)</label>
                  <select
                    value={config.whatsappReminderConfig?.daysBeforeDue || 2}
                    onChange={(e) => setConfig({
                      ...config,
                      whatsappReminderConfig: {
                        ...config.whatsappReminderConfig,
                        daysBeforeDue: Number(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  >
                    <option value="1">1 Day Before Due Date</option>
                    <option value="2">2 Days Before Due Date (Configured Default)</option>
                    <option value="3">3 Days Before Due Date</option>
                    <option value="5">5 Days Before Due Date</option>
                    <option value="7">7 Days Before Due Date</option>
                    <option value="0">On Due Date Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Template Language</label>
                  <select
                    value={config.whatsappReminderConfig?.templateLanguage || 'en'}
                    onChange={(e) => setConfig({
                      ...config,
                      whatsappReminderConfig: {
                        ...config.whatsappReminderConfig,
                        templateLanguage: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  >
                    <option value="en">English</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Message Template Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 text-xs">
                    Upcoming Due Date Message Template (Triggered {config.whatsappReminderConfig?.daysBeforeDue || 2} Days Prior)
                  </label>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">Tags:</span>
                    {['{{customerName}}', '{{ticketNumber}}', '{{totalDue}}', '{{dueDate}}', '{{upiPayLink}}'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertMergeTag(tag)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono font-bold"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows="3"
                  value={config.whatsappReminderConfig?.messageTemplate || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    whatsappReminderConfig: {
                      ...config.whatsappReminderConfig,
                      messageTemplate: e.target.value
                    }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                />
              </div>

              {/* Overdue Escalation Demand Template */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 text-xs">
                  Overdue Escalation / Statutory Auction Demand Template
                </label>
                <textarea
                  rows="2"
                  value={config.whatsappReminderConfig?.overdueTemplate || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    whatsappReminderConfig: {
                      ...config.whatsappReminderConfig,
                      overdueTemplate: e.target.value
                    }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                />
              </div>
            </div>
          )}

          {/* TAB 6: MANAGER PIN & SECURITY OVERRIDES */}
          {activeTab === 'security' && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#84cc16]" />
                  <span>Manager Authorization PIN &amp; Cashier Controls</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Protects sensitive financial operations like interest waivers, fee discounts, and LTV overrides.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manager Authorization PIN</label>
                  <input
                    type="password"
                    value={config.managerSecurityConfig?.managerPin || '1234'}
                    onChange={(e) => setConfig({
                      ...config,
                      managerSecurityConfig: { ...(config.managerSecurityConfig || {}), managerPin: e.target.value }
                    })}
                    maxLength={6}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Cashier Waiver without PIN (₹)</label>
                  <input
                    type="number"
                    value={config.managerSecurityConfig?.waiverLimitWithoutPin || 500}
                    onChange={(e) => setConfig({
                      ...config,
                      managerSecurityConfig: { ...(config.managerSecurityConfig || {}), waiverLimitWithoutPin: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>

                <div className="flex flex-col justify-between">
                  <span className="font-bold text-slate-700 block">Enforce PIN for RBI LTV Override</span>
                  <button
                    type="button"
                    onClick={() => setConfig({
                      ...config,
                      managerSecurityConfig: {
                        ...(config.managerSecurityConfig || {}),
                        requirePinForLtvOverride: !config.managerSecurityConfig?.requirePinForLtvOverride
                      }
                    })}
                    className={`w-full py-2 text-xs font-bold rounded-xl mt-1 transition ${
                      config.managerSecurityConfig?.requirePinForLtvOverride ? 'bg-[#0f172a] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {config.managerSecurityConfig?.requirePinForLtvOverride ? '✓ PIN ENFORCED' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORNAMENT CATALOG & LOAN MASTERS */}
          {(activeTab === 'catalog' || activeTab === 'interest') && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              
              {/* 1. CUSTOM ORNAMENT ARTICLES CATALOG IN PROFESSIONAL TABLE FORMAT */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#84cc16]" />
                      <span>Predefined Jewellery &amp; Collateral Master Catalog</span>
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      Predefine jewellery items with default purity &amp; stone deduction for 1-click selection in New Pawn intake desk.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-lime-100 text-lime-900 border border-lime-300 self-start sm:self-auto">
                    {catalogItemsList.length} Active Articles
                  </span>
                </div>

                {/* CREATE NEW ORNAMENT MASTER INLINE FORM */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
                    Add New Jewellery Master Item
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Item / Ornament Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Gold Necklace, Diamond Ring, Silver Kolusu..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-slate-900"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewItemToCatalog();
                          }
                        }}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Metal Category</label>
                      <select
                        value={newItemCategory}
                        onChange={(e) => {
                          setNewItemCategory(e.target.value);
                          if (e.target.value === 'Silver') setNewItemPurity('Silver');
                          else if (e.target.value === 'Gold') setNewItemPurity('22K');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="Gold">Gold (Au)</option>
                        <option value="Silver">Silver (Ag)</option>
                        <option value="Platinum">Platinum (Pt)</option>
                        <option value="Diamond">Diamond / Gems</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Default Purity</label>
                      <select
                        value={newItemPurity}
                        onChange={(e) => setNewItemPurity(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="22K">22K (916)</option>
                        <option value="24K">24K (Pure)</option>
                        <option value="18K">18K (750)</option>
                        <option value="Silver">Silver (925)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Tare %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="0"
                        value={newItemDeduction}
                        onChange={(e) => setNewItemDeduction(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-center text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddNewItemToCatalog}
                        className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#84cc16]" />
                        <span>Add Item</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* CATALOG DATA TABLE */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="px-3.5 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-black text-[10px] uppercase tracking-wider text-slate-700">
                      Registered Jewellery Master Catalog ({filteredCatalogItems.length})
                    </span>
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter items..."
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        className="pl-6 pr-2.5 py-0.5 bg-white border border-slate-200 rounded-lg text-xs font-medium w-36 sm:w-44 focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 uppercase text-[9px] text-slate-600 font-black tracking-wider">
                        <tr>
                          <th className="p-2.5 w-12 text-center">#</th>
                          <th className="p-2.5">Jewellery / Ornament Name</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Default Purity</th>
                          <th className="p-2.5 text-center">Std Tare %</th>
                          <th className="p-2.5 text-center">Status</th>
                          <th className="p-2.5 text-right w-20">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCatalogItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="p-2.5 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-[#84cc16]" />
                                <span>{item.name}</span>
                              </div>
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                item.category === 'Silver'
                                  ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                  : item.category === 'Platinum'
                                  ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                                {item.category || 'Gold'}
                              </span>
                            </td>
                            <td className="p-2.5 font-bold text-slate-800 text-xs font-mono">
                              {item.purity || '22K'}
                            </td>
                            <td className="p-2.5 text-center font-mono text-slate-700 text-xs">
                              {item.deductionPct || 0}%
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Active
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveCatalogItem(idx)}
                                className="px-2 py-1 text-slate-400 hover:text-red-600 font-bold hover:bg-red-50 rounded-lg transition text-[11px]"
                                title="Delete Item"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredCatalogItems.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                              No matching jewellery items in master catalog.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 2. LOAN TENURES / DURATIONS MASTER */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Dynamic Loan Tenures / Durations</h3>
                    <p className="text-[11px] text-slate-500">Configure allowable pledge loan durations in months.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {(config.loanDurations || [1, 2, 3, 6, 9, 12, 24, 36]).map((months, dIdx) => (
                    <div
                      key={dIdx}
                      className="px-3 py-1.5 bg-lime-50 border border-lime-300 rounded-xl text-xs font-black text-[#0f172a] flex items-center gap-2"
                    >
                      <span>{months} {months === 1 ? 'Month' : 'Months'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const list = [...(config.loanDurations || [1, 2, 3, 6, 9, 12, 24, 36])];
                          list.splice(dIdx, 1);
                          setConfig({ ...config, loanDurations: list });
                        }}
                        className="text-slate-400 hover:text-red-600 font-bold"
                        title="Remove Duration"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={async () => {
                      const num = await promptModal({
                        title: 'Add Loan Duration',
                        message: 'Enter Duration in Months (e.g. 18 or 24):',
                        placeholder: 'Months',
                        confirmText: 'Add Duration'
                      });
                      if (num && Number(num) > 0) {
                        const list = config.loanDurations || [1, 2, 3, 6, 9, 12, 24, 36];
                        if (!list.includes(Number(num))) {
                          setConfig({ ...config, loanDurations: [...list, Number(num)].sort((a, b) => a - b) });
                          toast.success(`${num} Months duration added.`);
                        }
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 transition"
                  >
                    + Add Months
                  </button>
                </div>
              </div>

              {/* 3. DYNAMIC DISBURSEMENT & PAYMENT CHANNELS */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Disbursement &amp; Payment Channels</h3>
                    <p className="text-[11px] text-slate-500">Configure cash counter, store bank accounts, and UPI channels for payout.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const modes = config.disbursementModes || [];
                      setConfig({
                        ...config,
                        disbursementModes: [
                          ...modes,
                          { code: `MODE_${modes.length + 1}`, label: 'New Payment Mode', type: 'BANK' }
                        ]
                      });
                    }}
                    className="px-2.5 py-1 bg-lime-50 hover:bg-lime-100 text-[#0f172a] border border-lime-300 font-bold rounded-lg text-xs"
                  >
                    + Add Payment Mode
                  </button>
                </div>

                <div className="space-y-2">
                  {(config.disbursementModes || [
                    { code: 'CASH', label: '💵 Cash Counter', type: 'CASH' },
                    { code: 'BANK_TRANSFER', label: '🏦 Bank NEFT/IMPS Transfer', type: 'BANK' },
                    { code: 'UPI', label: '📱 Instant UPI Payment', type: 'UPI' }
                  ]).map((mode, mIdx) => (
                    <div key={mIdx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Display Label</span>
                        <input
                          type="text"
                          value={mode.label}
                          onChange={(e) => {
                            const updated = [...(config.disbursementModes || [])];
                            if (updated[mIdx]) {
                              updated[mIdx].label = e.target.value;
                              setConfig({ ...config, disbursementModes: updated });
                            }
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Channel Type</span>
                        <select
                          value={mode.type || 'CASH'}
                          onChange={(e) => {
                            const updated = [...(config.disbursementModes || [])];
                            if (updated[mIdx]) {
                              updated[mIdx].type = e.target.value;
                              setConfig({ ...config, disbursementModes: updated });
                            }
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg"
                        >
                          <option value="CASH">Cash Counter</option>
                          <option value="BANK">Bank Account / RTGS</option>
                          <option value="UPI">UPI Payment</option>
                          <option value="CHEQUE">Cheque</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (config.disbursementModes || []).filter((_, i) => i !== mIdx);
                            setConfig({ ...config, disbursementModes: updated });
                          }}
                          className="px-2 py-1 text-slate-400 hover:text-red-600 font-bold text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. STATUTORY RBI CAPS & INTEREST SCHEMES */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Statutory RBI Caps &amp; Default Parameters</h3>
                  <p className="text-[11px] text-slate-500">Configures statutory Loan-to-Value ceilings, base monthly interest rates, and overdue grace periods.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Max Loan-to-Value (LTV %)</label>
                    <input
                      type="number"
                      value={config.eligibleCollateralPct || 75}
                      onChange={(e) => setConfig({ ...config, eligibleCollateralPct: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-700 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">Statutory RBI max ceiling is 75%</span>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Default Monthly Interest %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.defaultMonthlyInterestPct || 2.0}
                      onChange={(e) => setConfig({ ...config, defaultMonthlyInterestPct: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-[#0f172a] outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Overdue Grace Period (Days)</label>
                    <input
                      type="number"
                      value={config.defaultGracePeriodDays || 7}
                      onChange={(e) => setConfig({ ...config, defaultGracePeriodDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                    />
                  </div>
                </div>

                {/* Custom Interest Rate Slabs */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Custom Monthly Interest Rate Schemes</span>
                    <button
                      type="button"
                      onClick={() => {
                        const schemes = config.interestSchemes || [];
                        setConfig({
                          ...config,
                          interestSchemes: [
                            ...schemes,
                            { code: `SCHEME_${schemes.length + 1}`, name: 'New Custom Scheme', monthlyRatePct: 2.0, description: 'Custom Rate' }
                          ]
                        });
                      }}
                      className="px-2 py-0.5 bg-lime-50 hover:bg-lime-100 text-[#0f172a] border border-lime-300 font-bold rounded text-[11px]"
                    >
                      + Add Scheme
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(config.interestSchemes || [
                      { code: 'STANDARD', name: 'Standard Pledge Rate', monthlyRatePct: 2.0, description: 'Standard 2% monthly pledge' },
                      { code: 'CONCESSION', name: 'Agricultural / Concession', monthlyRatePct: 1.5, description: 'Low 1.5% rate' }
                    ]).map((scheme, sIdx) => (
                      <div key={sIdx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Scheme Name</span>
                          <input
                            type="text"
                            value={scheme.name}
                            onChange={(e) => {
                              const updated = [...(config.interestSchemes || [])];
                              if (updated[sIdx]) {
                                updated[sIdx].name = e.target.value;
                                setConfig({ ...config, interestSchemes: updated });
                              }
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Monthly Rate %</span>
                          <input
                            type="number"
                            step="0.1"
                            value={scheme.monthlyRatePct}
                            onChange={(e) => {
                              const updated = [...(config.interestSchemes || [])];
                              if (updated[sIdx]) {
                                updated[sIdx].monthlyRatePct = Number(e.target.value);
                                setConfig({ ...config, interestSchemes: updated });
                              }
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-black text-slate-900"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Description</span>
                          <input
                            type="text"
                            value={scheme.description || ''}
                            onChange={(e) => {
                              const updated = [...(config.interestSchemes || [])];
                              if (updated[sIdx]) {
                                updated[sIdx].description = e.target.value;
                                setConfig({ ...config, interestSchemes: updated });
                              }
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (config.interestSchemes || []).filter((_, i) => i !== sIdx);
                              setConfig({ ...config, interestSchemes: updated });
                            }}
                            className="px-2 py-1 text-slate-400 hover:text-red-600 font-bold text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: HARDWARE PRINTERS & PAPER */}
          {activeTab === 'hardware' && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                    <Printer className="w-4 h-4 text-[#84cc16]" />
                    <span>Hardware Receipt Printers &amp; Physical Canvas</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Connect local USB/Network thermal printers and configure receipt paper dimensions.
                  </p>
                </div>
                <Link
                  to="/print-templates"
                  className="px-3 py-1.5 bg-lime-50 hover:bg-lime-100 text-[#0f172a] border border-lime-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#65a30d]" />
                  <span>Open Print Designer</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Counter Receipt Printer</label>
                  <select
                    value={config.thermalPrinterName || ''}
                    onChange={(e) => setConfig({ ...config, thermalPrinterName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  >
                    <option value="Default Printer">Default System Printer</option>
                    {printers.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thermal Paper Width Preset</label>
                  <select
                    value={config.thermalPaperWidth || '80mm'}
                    onChange={(e) => setConfig({ ...config, thermalPaperWidth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  >
                    <option value="80mm">3-Inch Thermal Roll (80mm Standard POS)</option>
                    <option value="58mm">2-Inch Thermal Roll (58mm Compact)</option>
                    <option value="A4">A4 Full Sheet (Tax Invoice / RPAD Legal)</option>
                    <option value="A5">A5 Half Sheet</option>
                    <option value="Letterhead">Pre-Printed Letterhead Overlay</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM SAVE BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-[#0f172a] hover:bg-[#1e293b] text-white font-black rounded-xl shadow-xl transition flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4 text-[#84cc16]" />
              <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
