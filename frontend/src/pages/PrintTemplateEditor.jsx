import React, { useState, useEffect } from 'react';
import {
  Printer,
  Save,
  CheckCircle2,
  FileCode,
  Layout,
  QrCode,
  Image as ImageIcon,
  Eye,
  Sliders,
  Sparkles,
  FileText,
  Mail,
  Receipt,
  RotateCcw,
  Check,
  Building2,
  Phone,
  ShieldCheck,
  Smartphone,
  Layers,
  Copy,
  Download
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const TEMPLATE_PRESETS = [
  { id: 'pawn_receipt', label: 'Pawn Pledge Slip', desc: 'Standard Form F thermal slip', icon: Receipt },
  { id: 'quotation_bill', label: 'Gold Valuation Quotation', desc: 'Pre-pledge estimate voucher', icon: FileText },
  { id: 'repayment_receipt', label: 'Repayment / Redemption', desc: 'Interest & closure voucher', icon: RotateCcw },
  { id: 'rpad_notice', label: 'Statutory RPAD Notice', desc: 'Form 1 & 2 demand notice', icon: Mail }
];

export default function PrintTemplateEditor() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState('pawn_receipt');
  const [paperSize, setPaperSize] = useState('80mm'); // '80mm' | '58mm' | 'A4' | 'A5' | 'Letterhead'
  const [shopConfig, setShopConfig] = useState(null);

  // DIY Designer Config Toggles
  const [templateConfig, setTemplateConfig] = useState({
    showLogo: true,
    showStamp: true,
    showQrCode: true,
    showCustomerPhoto: true,
    showOrnamentPhotos: false,
    showTerms: true,
    showNomineeDetails: true,
    showSafeLockerLocation: true,
    showBarcode: true,
    customHeader: '*** 100% SECURE VAULT SAFEKEEPING ***',
    customFooter: 'Thank you for your business. Please present this receipt during redemption.',
    customTerms: '1. Pledged ornaments are safely stored in maximum security electronic vaults.\n2. Monthly interest is calculated as per statutory RBI guidelines.\n3. Overdue loans beyond grace period are liable for statutory public auction with prior intimation.'
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data?.config) {
        setShopConfig(res.data.config);
        if (res.data.config.printConfig) {
          setTemplateConfig(prev => ({ ...prev, ...res.data.config.printConfig }));
          if (res.data.config.printConfig.paperSize) {
            setPaperSize(res.data.config.printConfig.paperSize);
          }
        }
      }
    }).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e && e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', {
        printConfig: {
          ...templateConfig,
          paperSize
        }
      });
      if (res.data?.success) {
        setSavedSuccess(true);
        toast.success('Print template configuration saved!');
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      toast.error('Error saving print template: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handlePrintTest = () => {
    window.print();
  };

  const shopName = shopConfig?.shopName || 'Sri Lakshmi Pawn Brokers';
  const rbiLicense = shopConfig?.rbiLicenseNo || 'RB/PB/2026/001';
  const shopPhone = shopConfig?.phone || shopConfig?.mobile || '044-28340987';
  const shopAddress = shopConfig?.address || '123 Commercial Street, T Nagar, Chennai - 600017';
  const logoUrl = shopConfig?.brandingConfig?.logoUrl;
  const stampUrl = shopConfig?.brandingConfig?.stampUrl;

  // Sample Ticket Mock for live visual rendering
  const mockTicket = {
    ticketNumber: 'PWN-2026-0001',
    date: '02 Oct 2026',
    maturityDate: '02 Jan 2027',
    customerName: 'Karthik Raja',
    customerMobile: '9840123456',
    customerAadhaar: 'XXXX-XXXX-8921',
    nomineeName: 'Deepa (Wife)',
    boxNo: 'Safe A [Box #1]',
    items: [
      { name: 'Gold Necklace 916', gross: 14.5, net: 14.2, purity: '22K', val: 97270 }
    ],
    totalGross: 14.5,
    totalNet: 14.2,
    principal: 70000,
    monthlyRate: 1.5,
    monthlyInterestAmt: 1050,
    ltvPct: 72
  };

  return (
    <div className="h-full max-h-full flex flex-col gap-2.5 overflow-hidden select-none">
      {/* 1. TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-[#84cc16] shadow-xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Visual Print Template &amp; Receipt Formatter
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-lime-100 text-lime-800 border border-lime-200">
                {paperSize} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Configure thermal POS slips, gold loan estimates, tax invoices, and statutory RPAD notices
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintTest}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border border-slate-300 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Test Print</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-[#84cc16]" />
            <span>{saving ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      {/* 2. DOCUMENT PRESET TYPE SELECTOR STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        {TEMPLATE_PRESETS.map(t => {
          const IconComp = t.icon;
          const isSelected = selectedType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`p-2 rounded-xl border text-left transition flex items-center gap-2.5 ${
                isSelected
                  ? 'bg-white border-[#84cc16] ring-2 ring-[#84cc16]/40 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-slate-900 text-[#84cc16]' : 'bg-slate-100 text-slate-600'}`}>
                <IconComp className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className={`font-black text-xs truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                  {t.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {t.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. SPLIT WORKBENCH: CONTROLS (LEFT) & REALISTIC LIVE PREVIEW (RIGHT) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 overflow-hidden">
        {/* LEFT COLUMN: CONTROLS (5 COLS) */}
        <div className="w-full lg:w-5/12 h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
            <span className="font-black text-[10px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Template Settings &amp; Format Options</span>
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3.5">
            {/* Paper Size Presets */}
            <div className="space-y-2">
              <label className="block font-black text-[10px] uppercase tracking-wider text-slate-600">
                1. Paper Size &amp; Printer Model
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '80mm', label: '80mm Thermal', desc: 'Standard 3-inch POS' },
                  { id: '58mm', label: '58mm Compact', desc: '2-inch Bluetooth' },
                  { id: 'A4', label: 'A4 Full Sheet', desc: 'Deskjet / Laser' },
                  { id: 'A5', label: 'A5 Half Sheet', desc: 'Dot Matrix / Mini' },
                  { id: 'Letterhead', label: 'Letterhead', desc: 'Pre-Printed Paper' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaperSize(p.id)}
                    className={`p-2 rounded-xl border text-left transition ${
                      paperSize === p.id
                        ? 'bg-lime-50 border-lime-500 ring-2 ring-lime-400/50'
                        : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-slate-900">{p.label}</div>
                    <div className="text-[10px] text-slate-400">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Elements Toggles */}
            <div className="space-y-2">
              <label className="block font-black text-[10px] uppercase tracking-wider text-slate-600">
                2. Visual Receipt Elements
              </label>
              <div className="space-y-1.5">
                {[
                  { key: 'showLogo', label: 'Display Shop Logo in Header', desc: 'Official company logo' },
                  { key: 'showQrCode', label: 'Dynamic UPI Scan-to-Pay QR Code', desc: 'Instant GPay / PhonePe settlement' },
                  { key: 'showBarcode', label: 'Ticket Barcode Strip', desc: 'Fast scanner barcode' },
                  { key: 'showStamp', label: 'Authorized Stamp & Signature Seal', desc: 'Store stamp at bottom' },
                  { key: 'showCustomerPhoto', label: 'Customer KYC Photo', desc: 'Borrower snapshot' },
                  { key: 'showNomineeDetails', label: 'Nominee Name & Relationship', desc: 'Family nominee' },
                  { key: 'showSafeLockerLocation', label: 'Vault Box Location Tag', desc: 'Safe compartment # on receipt' },
                  { key: 'showTerms', label: 'Statutory Terms & Conditions', desc: 'RBI disclaimer clauses' }
                ].map(item => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">{item.label}</span>
                      <span className="text-[10px] text-slate-400">{item.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(templateConfig[item.key])}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, [item.key]: e.target.checked })}
                      className="rounded text-lime-600 focus:ring-lime-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Text Configuration */}
            <div className="space-y-2.5">
              <label className="block font-black text-[10px] uppercase tracking-wider text-slate-600">
                3. Custom Headers &amp; Footers
              </label>
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Header Banner Subtitle</label>
                <input
                  type="text"
                  value={templateConfig.customHeader || ''}
                  onChange={(e) => setTemplateConfig({ ...templateConfig, customHeader: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Footer Message</label>
                <input
                  type="text"
                  value={templateConfig.customFooter || ''}
                  onChange={(e) => setTemplateConfig({ ...templateConfig, customFooter: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Terms &amp; Disclaimer</label>
                <textarea
                  rows={3}
                  value={templateConfig.customTerms || ''}
                  onChange={(e) => setTemplateConfig({ ...templateConfig, customTerms: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REALISTIC LIVE DOCUMENT PREVIEW (7 COLS) */}
        <div className="w-full lg:w-7/12 h-full flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-inner overflow-hidden">
          <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <Eye className="w-3.5 h-3.5 text-[#84cc16]" />
              <span>Live Rendering Canvas ({paperSize} Format)</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              {paperSize === '80mm' ? '300 DPI Thermal POS' : paperSize === 'A4' ? '210 x 297 mm Sheet' : '58mm Mobile'}
            </span>
          </div>

          {/* REALISTIC PHYSICAL PAPER CANVAS IN SCROLLABLE VIEWPORT */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex items-start justify-center bg-slate-950/40">
            <div
              className={`bg-white shadow-2xl transition-all duration-200 p-5 sm:p-6 text-slate-900 border border-slate-200 relative my-auto ${
                paperSize === '80mm'
                  ? 'w-[330px] rounded-b-none border-t-4 border-slate-900 font-mono text-[11px]'
                  : paperSize === '58mm'
                  ? 'w-[250px] rounded-b-none border-t-4 border-slate-900 font-mono text-[10px]'
                  : paperSize === 'A4'
                  ? 'w-[460px] rounded-xl shadow-2xl font-sans text-xs'
                  : 'w-[400px] rounded-xl shadow-xl font-sans text-xs'
              }`}
            >
              {/* Jagged Thermal Paper Edge Effect */}
              {(paperSize === '80mm' || paperSize === '58mm') && (
                <div className="absolute -bottom-2 left-0 right-0 h-2 flex justify-between overflow-hidden opacity-30 select-none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <span key={i} className="text-[8px] text-slate-400">▲</span>
                  ))}
                </div>
              )}

              {/* 1. RECEIPT HEADER */}
              <div className="text-center space-y-1 pb-2.5 border-b-2 border-slate-800">
                {templateConfig.showLogo && logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain mx-auto mb-1" />
                ) : null}

                <h2 className="font-black text-sm uppercase tracking-wide text-slate-950">{shopName}</h2>
                <p className="text-[10px] text-slate-600 leading-tight">{shopAddress}</p>
                <p className="text-[10px] font-bold text-slate-700">📞 {shopPhone} · Lic #{rbiLicense}</p>

                {templateConfig.customHeader && (
                  <div className="text-[9px] font-bold text-slate-900 bg-slate-100 py-0.5 rounded mt-1">
                    {templateConfig.customHeader}
                  </div>
                )}
              </div>

              {/* 2. TICKET & BORROWER METADATA */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between font-black text-slate-950">
                  <span>TICKET #: {mockTicket.ticketNumber}</span>
                  <span>DATE: {mockTicket.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">BORROWER:</span>
                  <span>{mockTicket.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>MOBILE / ID:</span>
                  <span>{mockTicket.customerMobile} ({mockTicket.customerAadhaar})</span>
                </div>
                {templateConfig.showNomineeDetails && (
                  <div className="flex justify-between text-slate-600">
                    <span>NOMINEE:</span>
                    <span>{mockTicket.nomineeName}</span>
                  </div>
                )}
                {templateConfig.showSafeLockerLocation && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>VAULT STORAGE:</span>
                    <span>{mockTicket.boxNo}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>MATURITY DUE:</span>
                  <span className="font-bold text-slate-900">{mockTicket.maturityDate}</span>
                </div>
              </div>

              {/* 3. PLEDGED ORNAMENTS TABLE */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between font-bold text-[9px] uppercase text-slate-500 border-b border-slate-200 pb-0.5">
                  <span>Ornament Description</span>
                  <span>Net Wt / Val</span>
                </div>
                {mockTicket.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <div>
                      <div className="font-bold">{it.name} ({it.purity})</div>
                      <div className="text-[9px] text-slate-500">Gross: {it.gross}g</div>
                    </div>
                    <div className="text-right font-mono font-bold">
                      <div>{formatWeight(it.net)}</div>
                      <div className="text-[9px] text-slate-500">{formatCurrency(it.val)}</div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between font-extrabold text-slate-900 pt-1 border-t border-slate-200 text-[11px]">
                  <span>TOTAL NET GOLD:</span>
                  <span className="font-mono text-emerald-700">{formatWeight(mockTicket.totalNet)}</span>
                </div>
              </div>

              {/* 4. FINANCIAL SETTLEMENT SUMMARY */}
              <div className="py-2 border-b-2 border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between font-black text-xs text-slate-950">
                  <span>LOAN PRINCIPAL:</span>
                  <span>{formatCurrency(mockTicket.principal)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>MONTHLY RATE:</span>
                  <span className="font-bold">{mockTicket.monthlyRate}% / mo</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>MONTHLY INTEREST:</span>
                  <span className="font-bold">{formatCurrency(mockTicket.monthlyInterestAmt)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[9px]">
                  <span>LTV RECKONER:</span>
                  <span>{mockTicket.ltvPct}% (Max RBI 75%)</span>
                </div>
              </div>

              {/* 5. UPI QR CODE & BARCODE */}
              <div className="py-2.5 flex items-center justify-around gap-2 text-center border-b border-dashed border-slate-300">
                {templateConfig.showQrCode && (
                  <div className="flex flex-col items-center">
                    <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-2xs">
                      <QrCode className="w-12 h-12 text-slate-900" />
                    </div>
                    <span className="text-[8px] font-bold text-slate-600 mt-0.5">Scan to Pay</span>
                  </div>
                )}

                {templateConfig.showBarcode && (
                  <div className="flex flex-col items-center">
                    <div className="font-mono font-black text-sm tracking-widest text-slate-900">
                      ||| | |||| | || |||
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">{mockTicket.ticketNumber}</span>
                  </div>
                )}
              </div>

              {/* 6. SIGNATURE & STAMP */}
              <div className="py-2.5 flex justify-between items-end text-[9px] text-slate-600">
                <div className="text-center">
                  <div className="border-b border-slate-400 w-20 h-6 mb-0.5 flex items-end justify-center font-serif italic text-slate-400 text-[10px]">
                    Karthik R.
                  </div>
                  <span>Borrower Sign</span>
                </div>

                <div className="text-center">
                  {templateConfig.showStamp && stampUrl ? (
                    <img src={stampUrl} alt="Stamp" className="h-8 w-14 object-contain mx-auto mb-0.5 opacity-80" />
                  ) : (
                    <div className="border-b border-slate-400 w-20 h-6 mb-0.5 flex items-end justify-center text-slate-400 text-[9px]">
                      [SEAL]
                    </div>
                  )}
                  <span>Appraiser</span>
                </div>
              </div>

              {/* 7. TERMS & CONDITIONS */}
              {templateConfig.showTerms && (
                <div className="pt-1.5 text-[8px] text-slate-500 leading-tight border-t border-slate-200">
                  <p className="whitespace-pre-line">{templateConfig.customTerms}</p>
                </div>
              )}

              {/* 8. FOOTER */}
              {templateConfig.customFooter && (
                <div className="pt-1.5 text-center text-[8px] font-bold text-slate-600">
                  {templateConfig.customFooter}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
