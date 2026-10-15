import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Search,
  UserPlus,
  ShieldCheck,
  Printer,
  Sparkles,
  Calculator,
  Coins,
  Save,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Scale,
  Maximize2,
  X,
  FileCheck,
  Edit3,
  Lock,
  ArrowRight,
  Building2,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronDown,
  Info,
  Sliders
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatWeight } from '../utils/formatters';
import PrintVoucherModal from '../components/PrintVoucherModal';
import SignaturePad from '../components/SignaturePad';

const DEFAULT_ITEM = {
  ornamentType: 'Gold Necklace (22K)',
  metal: 'Gold',
  purity: '22K',
  purityPct: 91.6,
  quantity: 1,
  grossWeight: '',
  stoneWeight: '0',
  stoneDeductionValue: '0',
  marketRatePerGram: 0,
  valuationAmount: 0,
  remarks: '',
  photos: []
};

const DEFAULT_ORNAMENTS = [
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

export default function NewPawn() {
  const navigate = useNavigate();
  const { shopConfig } = useAuth();
  const { toast, confirmModal } = useToast();

  // Customer State
  const [customerSearch, setCustomerSearch] = useState('');
  const [matchingCustomers, setMatchingCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    mobile: '',
    aadhaarNo: '',
    panNo: '',
    address: '',
    city: '',
    nominee: '',
    nomineeMob: '',
    relation: ''
  });

  // Shop Config & KYC Policy
  const [kycDocs, setKycDocs] = useState({
    customerPhoto: '',
    aadhaarFile: '',
    panFile: '',
    passbookFile: '',
    customDocs: {}
  });

  // Rates
  const [liveRate22K, setLiveRate22K] = useState(0);
  const [liveRate24K, setLiveRate24K] = useState(0);
  const [liveRateSilver, setLiveRateSilver] = useState(0);

  // Ornaments Items Table
  const [items, setItems] = useState([{ ...DEFAULT_ITEM }]);

  // Dynamic Masters from Shop Config
  const ornamentCatalog = shopConfig?.customOrnamentTypes?.length ? shopConfig.customOrnamentTypes : DEFAULT_ORNAMENTS;
  const configuredDurations = shopConfig?.loanDurations?.length ? shopConfig.loanDurations : [1, 2, 3, 6, 12];
  const configuredModes = shopConfig?.disbursementModes?.length ? shopConfig.disbursementModes : [
    { code: 'CASH', label: '💵 Cash at Counter' },
    { code: 'BANK_TRANSFER', label: '🏦 Bank / NEFT' },
    { code: 'UPI', label: '📱 UPI / GPay' }
  ];

  // Loan Financial Terms
  const [principal, setPrincipal] = useState('');
  const [durationMonths, setDurationMonths] = useState(3);
  const [interestScheme, setInterestScheme] = useState('MONTHLY_SIMPLE');
  const [interestPctPerMonth, setInterestPctPerMonth] = useState(2.0);
  const [disbursementMode, setDisbursementMode] = useState('CASH');
  const [remarks, setRemarks] = useState('');

  // Digital Signature
  const [signatureUrl, setSignatureUrl] = useState('');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Photo Zoom Lightbox Modal
  const [lightboxImage, setLightboxImage] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef(null);
  const [webcamTarget, setWebcamTarget] = useState(null);

  // Processing & Print State
  const [submitting, setSubmitting] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState('');
  const [ticketConfig, setTicketConfig] = useState(shopConfig?.ticketConfig || null);

  const isTicketConfigured = ticketConfig?.enabled !== false && (
    Boolean(ticketConfig?.prefix?.trim()) || Boolean(ticketConfig?.patternTemplate?.trim())
  );

  const getTicketPreview = (tc = ticketConfig || shopConfig?.ticketConfig || {}) => {
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

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data?.config) {
        if (res.data.config.defaultMonthlyInterestPct) {
          setInterestPctPerMonth(res.data.config.defaultMonthlyInterestPct);
        }
        if (res.data.config.ticketConfig) {
          setTicketConfig(res.data.config.ticketConfig);
        }
      }
    }).catch(() => {});

    api.get('/rates').then(res => {
      if (res.data?.current) {
        const r22 = Number(res.data.current.gold22K || 0);
        const r24 = Number(res.data.current.gold24K || 0);
        const rSil = Number(res.data.current.silver || 0);
        setLiveRate22K(r22);
        setLiveRate24K(r24);
        setLiveRateSilver(rSil);

        setItems(prev => prev.map(it => {
          const rate = it.metal === 'Silver' ? rSil : (it.purity === '24K' ? r24 : r22);
          const gWt = Number(it.grossWeight || 0);
          const sWt = Number(it.stoneWeight || 0);
          const sDed = Number(it.stoneDeductionValue || 0);
          const nWt = Math.max(0, gWt - sWt);
          return {
            ...it,
            marketRatePerGram: rate,
            netWeight: nWt,
            valuationAmount: Math.round(Math.max(0, (nWt * rate) - sDed))
          };
        }));
      }
    }).catch(() => {});
  }, []);

  // Search Customer on typing
  useEffect(() => {
    if (customerSearch.trim().length >= 2) {
      api.get(`/customers/search?q=${customerSearch}`).then(res => {
        setMatchingCustomers(res.data?.customers || []);
      }).catch(() => {});
    } else {
      setMatchingCustomers([]);
    }
  }, [customerSearch]);

  // Update item field and recalculate row valuation
  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'metal' || field === 'purity') {
      if (updated[index].metal === 'Silver') {
        updated[index].marketRatePerGram = liveRateSilver;
        updated[index].purity = 'Silver';
      } else {
        updated[index].marketRatePerGram = updated[index].purity === '24K' ? liveRate24K : liveRate22K;
      }
    }

    const rate = updated[index].marketRatePerGram || (updated[index].purity === '24K' ? liveRate24K : (updated[index].purity === 'Silver' ? liveRateSilver : liveRate22K));
    const gWt = Number(updated[index].grossWeight || 0);
    const sWt = Number(updated[index].stoneWeight || 0);
    const sDed = Number(updated[index].stoneDeductionValue || 0);
    const nWt = Math.max(0, gWt - sWt);

    updated[index].netWeight = Number(nWt.toFixed(3));
    updated[index].valuationAmount = Math.round(Math.max(0, (nWt * rate) - sDed));

    setItems(updated);
  };

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        ...DEFAULT_ITEM,
        marketRatePerGram: liveRate22K,
        valuationAmount: 0
      }
    ]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Web Serial Digital Scale Reader
  const readFromScale = async (index) => {
    if (!('serial' in navigator)) {
      toast.info('Web Serial API is not supported in this browser. Please enter weight manually.');
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      toast.info('Scale connected. Place gold ornament on scale...');
      let rawData = '';
      const timeout = setTimeout(() => {
        reader.releaseLock();
        port.close();
      }, 5000);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          rawData += value;
          const match = rawData.match(/([0-9]+\.?[0-9]*)\s*g/i) || rawData.match(/([0-9]+\.?[0-9]{2,3})/);
          if (match && Number(match[1]) > 0) {
            clearTimeout(timeout);
            updateItem(index, 'grossWeight', match[1]);
            toast.success(`Digital Scale weight captured: ${match[1]} g`);
            reader.releaseLock();
            await port.close();
            break;
          }
        }
      }
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        toast.error('Scale communication error: ' + err.message);
      }
    }
  };

  // Webcam Capture
  const startWebcam = async (target) => {
    setWebcamTarget(target);
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.warning('Live camera stream requires HTTPS or localhost. You can upload photos using the file upload option.');
      return;
    }
    setWebcamActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Webcam access error: ' + err.message);
      setWebcamActive(false);
    }
  };

  const captureWebcamSnap = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Stop webcam tracks
    const stream = videoRef.current.srcObject;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    setWebcamActive(false);

    // Save to backend
    try {
      const res = await api.post('/upload/base64', {
        base64Data: dataUrl,
        prefix: webcamTarget === 'customer' ? 'cust-photo' : 'ornament-snap'
      });
      if (res.data?.success) {
        if (webcamTarget === 'customer') {
          setKycDocs(prev => ({ ...prev, customerPhoto: res.data.fileUrl }));
          toast.success('Customer Live Photo captured!');
        } else if (webcamTarget?.type === 'item') {
          const idx = webcamTarget.index;
          const updated = [...items];
          updated[idx].photos = [...(updated[idx].photos || []), res.data.fileUrl];
          setItems(updated);
          toast.success(`Ornament photo attached to item #${idx + 1}`);
        }
      }
    } catch (err) {
      toast.error('Failed to process image: ' + err.message);
    }
  };

  // Totals calculations
  const totalGrossWeight = items.reduce((acc, it) => acc + (Number(it.grossWeight) || 0), 0);
  const totalNetWeight = items.reduce((acc, it) => acc + (Number(it.netWeight) || 0), 0);
  const totalStoneWeight = items.reduce((acc, it) => acc + (Number(it.stoneWeight) || 0), 0);
  const totalValuation = items.reduce((acc, it) => acc + (Number(it.valuationAmount) || 0), 0);
  const eligibleLtvPct = shopConfig?.eligibleCollateralPct || 75;
  const maxEligibleLoan = Math.round(totalValuation * (eligibleLtvPct / 100));

  const numPrincipal = Number(principal) || 0;
  const numMonthlyInterestPct = Number(interestPctPerMonth) || 2.0;
  const monthlyInterestAmount = Math.round((numPrincipal * numMonthlyInterestPct) / 100);
  const totalEstimatedInterest = monthlyInterestAmount * Number(durationMonths || 3);
  const ltvRatio = totalValuation > 0 ? ((numPrincipal / totalValuation) * 100).toFixed(1) : 0;
  const isLtvExceeded = numPrincipal > maxEligibleLoan;

  // Handle Quick Customer Registration
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', newCustomerForm);
      if (res.data?.success && res.data.customer) {
        setSelectedCustomer(res.data.customer);
        setNewCustomerModalOpen(false);
        setCustomerSearch(res.data.customer.name);
        toast.success(`Customer "${res.data.customer.name}" registered and selected.`);
      }
    } catch (err) {
      toast.error('Error creating customer: ' + (err.response?.data?.message || err.message));
    }
  };

  // Submit New Loan Pledge
  const handleSubmitPawn = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.warning('Please search and select a customer or register a new one.');
      return;
    }

    if (numPrincipal <= 0) {
      toast.warning('Please enter a valid loan principal amount.');
      return;
    }

    if (totalNetWeight <= 0 || totalValuation <= 0) {
      toast.warning('Please enter valid ornament weights and ensure valuation is calculated.');
      return;
    }

    if (!isTicketConfigured) {
      toast.error('Pawn Ticket Number format is not configured in Settings! Without a configured Pawn Ticket Number format in Settings, loan creation is blocked.');
      return;
    }

    if (isLtvExceeded) {
      const confirmOverride = await confirmModal({
        title: 'LTV Ceiling Override Required',
        message: `Sanctioned loan (₹${numPrincipal.toLocaleString('en-IN')}) exceeds 75% LTV valuation (₹${maxEligibleLoan.toLocaleString('en-IN')}). Do you want to authorize with Manager Override?`,
        confirmText: 'Authorize Disbursal',
        cancelText: 'Cancel',
        confirmColor: 'amber'
      });
      if (!confirmOverride) return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        customerMobile: selectedCustomer.mobile,
        customerPhotoUrl: kycDocs.customerPhoto || selectedCustomer.photo || '',
        documents: [
          ...(kycDocs.aadhaarFile ? [{ docType: 'aadhaar', fileUrl: kycDocs.aadhaarFile, verified: true }] : []),
          ...(kycDocs.panFile ? [{ docType: 'pan', fileUrl: kycDocs.panFile, verified: true }] : []),
          ...(kycDocs.passbookFile ? [{ docType: 'passbook', fileUrl: kycDocs.passbookFile, verified: true }] : [])
        ],
        digitalSignatureUrl: signatureUrl,
        principal: numPrincipal,
        durationMonths: Number(durationMonths),
        interestScheme,
        interestPctPerMonth: numMonthlyInterestPct,
        items,
        totalGrossWt: totalGrossWeight,
        totalNetWt: totalNetWeight,
        totalStoneWt: totalStoneWeight,
        marketValuationTotal: totalValuation,
        eligibleCollateralPct: eligibleLtvPct,
        maxEligibleLoan,
        vaultId: 'Main Strongroom Vault',
        compartmentNo: 1,
        boxNo: 1,
        disbursementMode,
        remarks
      };

      const res = await api.post('/loans', payload);
      if (res.data?.success) {
        toast.success(`Gold Loan pledge created! Ticket #${res.data.loan?.ticketNumber}`);
        if (res.data.receiptHtml) {
          setPrintHtml(res.data.receiptHtml);
          setPrintModalOpen(true);
        } else {
          navigate('/pawn-list');
        }
      }
    } catch (err) {
      toast.error('Error creating loan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full max-h-full flex flex-col gap-2 overflow-hidden select-none">
      {/* ── TOP ULTRA-COMPACT STATUS TICKER ── */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#0f172a] text-[#84cc16] flex items-center justify-center font-black">
            <Coins className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 leading-none">
            <span>New Gold Pledge Loan Intake</span>
            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              LIVE COUNTER
            </span>
          </h1>
        </div>

        {/* Live Daily Metal Spot Rates & Live Ticket Preview */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          {/* Live Next Ticket Badge */}
          <div
            title="Configured Next Pawn Ticket Number"
            className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-white font-mono text-[11px] flex items-center gap-1.5 shadow-2xs border border-slate-800"
          >
            <span className="text-[#84cc16] font-extrabold text-[10px] uppercase tracking-wider">Next Ticket:</span>
            <span className="text-white font-bold">{getTicketPreview()}</span>
          </div>

          <span className="px-2 py-0.5 rounded-lg bg-lime-50 text-slate-900 border border-lime-300">
            22K: <strong>{liveRate22K > 0 ? `${formatCurrency(liveRate22K)}/g` : '...'}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-slate-900 border border-amber-300 hidden sm:inline-block">
            24K: <strong>{liveRate24K > 0 ? `${formatCurrency(liveRate24K)}/g` : '...'}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
            Silver: <strong>{liveRateSilver > 0 ? `${formatCurrency(liveRateSilver)}/g` : '...'}</strong>
          </span>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="px-2 py-0.5 text-[11px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition ml-1 flex items-center gap-1"
            title="Configure Custom Ornaments & Masters in Settings"
          >
            <Sliders className="w-3 h-3 text-[#65a30d]" />
            <span>Master Catalog</span>
          </button>
        </div>
      </div>

      {/* ── UNCONFIGURED FORMAT WARNING ALERT ── */}
      {!isTicketConfigured && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-bold flex-shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Pawn Ticket Number format is not configured in Settings! Loan intake &amp; pledge disbursal is blocked.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1"
          >
            <span>Set Ticket Format</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── 2-COLUMN VIEWPORT-FITTED DESK (STRICT NO OUTER SCROLL) ── */}
      <form onSubmit={handleSubmitPawn} className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 min-h-0 overflow-hidden">
        
        {/* ================= LEFT SECTION: BORROWER & SCROLLABLE COLLATERAL TABLE (8 Cols) ================= */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-2 min-h-0 overflow-hidden">
          
          {/* 1. CUSTOMER QUICK-SELECT BAR */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex-shrink-0 flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search borrower by Full Name, Mobile Number, or Aadhaar..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                    setSelectedCustomer(null);
                  }
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-hidden focus:ring-1 focus:ring-[#84cc16]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />

              {/* Suggestions Dropdown */}
              {matchingCustomers.length > 0 && !selectedCustomer && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {matchingCustomers.map(c => (
                    <div
                      key={c._id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch(c.name);
                        setMatchingCustomers([]);
                      }}
                      className="p-2 hover:bg-lime-50 cursor-pointer text-xs border-b border-slate-100 last:border-0 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900">{c.name}</strong>
                        <span className="text-slate-500 font-mono text-[11px]">{c.mobile}</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        {c.aadhaarNo ? `Aadhaar: ${c.aadhaarNo.slice(-4)}` : 'Verified KYC'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Customer Pill or + New Button */}
            {selectedCustomer ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 rounded-lg flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <div className="leading-tight">
                  <span className="text-xs font-black text-slate-900 block">{selectedCustomer.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{selectedCustomer.mobile}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setKycModalOpen(true)}
                  className="ml-1 px-1.5 py-0.5 bg-white hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-300"
                >
                  KYC 📸
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                  className="text-slate-400 hover:text-red-500 text-xs ml-0.5 font-bold"
                  title="Change borrower"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setNewCustomerModalOpen(true)}
                className="px-2.5 py-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold rounded-lg text-xs flex items-center gap-1 flex-shrink-0 transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#84cc16]" />
                <span>+ Register</span>
              </button>
            )}
          </div>

          {/* 2. COLLATERAL MATRIX WITH STICKY HEADER & SCROLLABLE TBODY */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Table Control Header */}
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#84cc16]" />
                  <span>Collateral Intake Matrix</span>
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
                  {items.length} {items.length === 1 ? 'Article' : 'Articles'}
                </span>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="px-2.5 py-1 bg-[#84cc16] hover:bg-[#65a30d] text-black font-extrabold rounded-lg text-[11px] flex items-center gap-1 transition shadow-2xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Item</span>
              </button>
            </div>

            {/* ONLY TBODY SCROLLS (Sticky Header + Sticky Summary Footer) */}
            <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
              <table className="w-full text-left text-xs min-w-[760px] border-collapse">
                {/* STICKY THEAD */}
                <thead className="bg-[#0f172a] text-white uppercase text-[9px] tracking-wider sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="py-2 px-2 w-8 text-center">#</th>
                    <th className="py-2 px-2.5 min-w-[200px]">Ornament / Article Details</th>
                    <th className="py-2 px-2 w-28">Purity</th>
                    <th className="py-2 px-2 w-14 text-center">Qty</th>
                    <th className="py-2 px-2 w-28 text-center">Gross (g)</th>
                    <th className="py-2 px-2 w-18 text-center">Stone (g)</th>
                    <th className="py-2 px-2.5 w-22 text-right">Net Wt</th>
                    <th className="py-2 px-2.5 w-24 text-right">Valuation</th>
                    <th className="py-2 px-2 w-14 text-center">Snap</th>
                    <th className="py-2 px-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-lime-50/50 transition">
                      <td className="py-1.5 px-2 text-center font-bold text-slate-400 text-xs">{idx + 1}</td>
                      
                      {/* Ornament Name & Quick Dynamic Presets */}
                      <td className="py-1.5 px-2.5">
                        <input
                          type="text"
                          list="ornament-presets"
                          value={item.ornamentType}
                          onChange={(e) => updateItem(idx, 'ornamentType', e.target.value)}
                          placeholder="e.g. Gold Necklace, Ring, Chain..."
                          className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs text-slate-900 outline-hidden focus:ring-1 focus:ring-[#84cc16]"
                        />
                      </td>

                      {/* Purity */}
                      <td className="py-1.5 px-2">
                        <select
                          value={item.purity}
                          onChange={(e) => updateItem(idx, 'purity', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs text-slate-800 outline-hidden focus:ring-1 focus:ring-[#84cc16]"
                        >
                          <option value="22K">22K (916)</option>
                          <option value="24K">24K (Pure)</option>
                          <option value="18K">18K (750)</option>
                          <option value="Silver">Silver (925)</option>
                        </select>
                      </td>

                      {/* Quantity */}
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          className="w-full px-1 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-xs text-slate-800"
                        />
                      </td>

                      {/* Gross Weight with Web Serial Digital Scale Button */}
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.001"
                            placeholder="0.000"
                            value={item.grossWeight}
                            onChange={(e) => updateItem(idx, 'grossWeight', e.target.value)}
                            className="w-full px-1.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-black text-xs text-slate-900 text-right"
                          />
                          <button
                            type="button"
                            onClick={() => readFromScale(idx)}
                            title="Fetch digital scale weight"
                            className="p-1 bg-lime-100 hover:bg-lime-200 text-slate-900 rounded-lg border border-lime-300 flex-shrink-0 transition"
                          >
                            <Scale className="w-3 h-3 text-[#65a30d]" />
                          </button>
                        </div>
                      </td>

                      {/* Stone Weight */}
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="0.001"
                          placeholder="0"
                          value={item.stoneWeight}
                          onChange={(e) => updateItem(idx, 'stoneWeight', e.target.value)}
                          className="w-full px-1.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 text-right"
                        />
                      </td>

                      {/* Net Weight */}
                      <td className="py-1.5 px-2.5 font-black text-amber-800 whitespace-nowrap text-xs text-right">
                        {formatWeight(item.netWeight || 0)}
                      </td>

                      {/* Valuation */}
                      <td className="py-1.5 px-2.5 font-black text-emerald-800 font-mono whitespace-nowrap text-xs text-right">
                        {formatCurrency(item.valuationAmount || 0)}
                      </td>

                      {/* Multi-Photo Thumbnails */}
                      <td className="py-1.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {item.photos?.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setLightboxImage(item.photos[0])}
                              className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold border border-emerald-300 hover:bg-emerald-200 transition"
                            >
                              📸 {item.photos.length}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startWebcam({ type: 'item', index: idx })}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                              title="Snap Photo"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                          className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-20 transition rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <datalist id="ornament-presets">
                {ornamentCatalog.map(o => <option key={o} value={o} />)}
              </datalist>
            </div>

            {/* FIXED/STICKY COLLATERAL INTAKE SUMMARY RIBBON */}
            <div className="p-2 bg-[#020617] text-white border-t border-slate-800 grid grid-cols-4 gap-2 text-center flex-shrink-0">
              <div>
                <span className="text-slate-400 text-[9px] uppercase font-bold block">Gross Wt</span>
                <strong className="text-xs font-black text-white">{formatWeight(totalGrossWeight)}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] uppercase font-bold block">Net Gold</span>
                <strong className="text-xs font-black text-[#84cc16]">{formatWeight(totalNetWeight)}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] uppercase font-bold block">Market Value</span>
                <strong className="text-xs font-black text-white">{formatCurrency(totalValuation)}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] uppercase font-bold block">75% Max Loan</span>
                <strong className="text-xs font-black text-emerald-400">{formatCurrency(maxEligibleLoan)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SECTION: STICKY COMPACT FINANCIAL DESK (4 Cols) ================= */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-slate-200 shadow-2xs p-3 flex flex-col justify-between overflow-y-auto min-h-0 space-y-2">
          
          <div className="space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#84cc16]" />
                <span>Financials &amp; Disbursal</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  Number(ltvRatio) > 75 
                    ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse' 
                    : Number(ltvRatio) > 65 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {Number(ltvRatio) > 75 ? '⚠️ High Risk' : Number(ltvRatio) > 65 ? '⚡ Standard' : '🛡️ Safe Tier'} ({ltvRatio}%)
                </span>
              </div>
            </div>

            {/* Enterprise Interactive LTV Risk Progress Bar */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-600">Regulatory LTV (RBI Cap: 75%)</span>
                <span className={`font-black ${Number(ltvRatio) > 75 ? 'text-red-600 font-mono' : 'text-slate-900 font-mono'}`}>
                  {ltvRatio}% / 75.0%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-300 ${
                    Number(ltvRatio) > 75 
                      ? 'bg-red-600' 
                      : Number(ltvRatio) > 65 
                      ? 'bg-amber-500' 
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (Number(ltvRatio) / 75) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium pt-0.5">
                <span>0% Safe</span>
                <span className="text-amber-600 font-bold">65% Warning</span>
                <span className="text-red-600 font-bold">75% Statutory Limit</span>
              </div>
            </div>


            {/* Principal Sanctioned Input with Quick LTV buttons */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">Sanctioned Principal (₹) *</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPrincipal(Math.round(maxEligibleLoan * 0.5))}
                    className="px-1.5 py-0.2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[9px] font-bold"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrincipal(maxEligibleLoan)}
                    className="px-1.5 py-0.2 bg-lime-100 hover:bg-lime-200 text-lime-900 rounded text-[9px] font-bold"
                  >
                    75% Max
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full pl-7 pr-10 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-black text-slate-900 focus:ring-1 focus:ring-[#84cc16] outline-hidden"
                />
                <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">₹</span>
                <span className="absolute right-2.5 top-2 text-slate-400 font-bold text-[10px]">INR</span>
              </div>
            </div>

            {/* Interest Rate & Duration */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Monthly Interest Rate %</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={interestPctPerMonth}
                    onChange={(e) => setInterestPctPerMonth(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-slate-900"
                  />
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => setInterestPctPerMonth(1.5)}
                      className="px-1 py-0.2 bg-slate-100 text-slate-700 text-[8px] font-bold rounded"
                    >
                      1.5%
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterestPctPerMonth(2.0)}
                      className="px-1 py-0.2 bg-lime-100 text-lime-900 text-[8px] font-bold rounded"
                    >
                      2.0%
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Tenure / Duration</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                >
                  {configuredDurations.map((m) => (
                    <option key={m} value={m}>{m} {m === 1 ? 'Month' : 'Months'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Disbursement Mode */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Disbursement Payment Mode</label>
              <select
                value={disbursementMode}
                onChange={(e) => setDisbursementMode(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
              >
                {configuredModes.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label || m.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Financial Summary Card (Compact) */}
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Principal Disbursed:</span>
                <strong className="text-slate-900 font-extrabold">{formatCurrency(numPrincipal)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Monthly Interest:</span>
                <strong className="text-emerald-700 font-extrabold">{formatCurrency(monthlyInterestAmount)} / mo</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Est. Interest ({durationMonths}m):</span>
                <strong className="text-slate-800 font-bold">{formatCurrency(totalEstimatedInterest)}</strong>
              </div>
            </div>

            {/* Borrower Digital Signature Desk */}
            <SignaturePad
              value={signatureUrl}
              onChange={setSignatureUrl}
              customerName={selectedCustomer?.name || 'Borrower'}
            />
          </div>

          {/* Primary Action Button (Fixed at Bottom of Right Desk) */}
          <div className="pt-1.5 border-t border-slate-100 flex-shrink-0">
            <button
              type="submit"
              disabled={submitting || !isTicketConfigured}
              className={`w-full py-2.5 px-4 font-black text-xs uppercase tracking-wide rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                !isTicketConfigured
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-[#84cc16] hover:bg-[#65a30d] text-black'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>
                {!isTicketConfigured
                  ? 'Ticket Format Not Set in Settings'
                  : submitting
                  ? 'Disbursing Pledge...'
                  : `Disburse Loan · ${formatCurrency(numPrincipal)}`}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* QUICK CUSTOMER REGISTRATION MODAL */}
      {newCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#0f172a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#84cc16]" />
                <h3 className="font-extrabold text-sm">Register New Borrower</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewCustomerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Borrower Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={newCustomerForm.mobile}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Aadhaar Card No</label>
                  <input
                    type="text"
                    placeholder="12-digit UID"
                    value={newCustomerForm.aadhaarNo}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, aadhaarNo: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Door No, Street, Landmark, Village/Town"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewCustomerModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#84cc16] hover:bg-[#65a30d] text-black font-extrabold rounded-xl shadow-md transition"
                >
                  + Save Borrower
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WEBCAM SNAP MODAL */}
      {webcamActive && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-md w-full space-y-3 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#84cc16]" />
                <span>Live Camera Snap</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current?.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach(t => t.stop());
                  }
                  setWebcamActive(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>

            <button
              type="button"
              onClick={captureWebcamSnap}
              className="w-full py-2.5 bg-[#84cc16] hover:bg-[#65a30d] text-black font-extrabold text-xs rounded-xl shadow-md transition"
            >
              📸 Capture &amp; Attach Photo
            </button>
          </div>
        </div>
      )}

      {/* IMAGE LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white/5 border border-white/20 p-2 shadow-2xl">
            <img src={lightboxImage} alt="Zoomed View" className="max-w-full max-h-[80vh] object-contain rounded-xl mx-auto" />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* PRINT VOUCHER MODAL */}
      <PrintVoucherModal
        isOpen={printModalOpen}
        onClose={() => {
          setPrintModalOpen(false);
          navigate('/pawn-list');
        }}
        htmlContent={printHtml}
        title="PAWN TICKET &amp; RECEIPT VOUCHER"
      />
    </div>
  );
}
