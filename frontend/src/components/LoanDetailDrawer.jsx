import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Printer,
  Receipt,
  RotateCcw,
  Sparkles,
  Phone,
  MessageSquare,
  ShieldCheck,
  FileText,
  Clock,
  Calendar,
  Layers,
  Coins,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Building2,
  Lock,
  ExternalLink,
  ChevronRight,
  User,
  MapPin,
  CreditCard,
  Percent,
  Download
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatWeight, formatDate, formatDateTime } from '../utils/formatters';
import PrintVoucherModal from './PrintVoucherModal';
import { useToast } from '../context/ToastContext';

export default function LoanDetailDrawer({ isOpen, onClose, loanId, initialLoanData = null }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'collateral' | 'kyc' | 'ledger'
  const [loanData, setLoanData] = useState(initialLoanData);
  const [customer, setCustomer] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Zoom Lightbox Modal
  const [zoomImage, setZoomImage] = useState(null);

  // Print Receipt Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState('');

  useEffect(() => {
    if (isOpen && loanId) {
      fetchLoanDetails();
    } else if (!isOpen) {
      setActiveTab('overview');
      setZoomImage(null);
    }
  }, [isOpen, loanId]);

  useEffect(() => {
    if (initialLoanData) {
      setLoanData(initialLoanData);
    }
  }, [initialLoanData]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (zoomImage) {
          setZoomImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoomImage, onClose]);

  const fetchLoanDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/loans/${loanId}`);
      if (res.data?.success) {
        setLoanData(res.data.loan);
        setCustomer(res.data.customer);
        setRepayments(res.data.repayments || []);
      } else {
        setError(res.data?.message || 'Failed to load loan record');
      }
    } catch (err) {
      console.error('Error fetching loan details:', err);
      setError(err.response?.data?.message || 'Error fetching loan details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async () => {
    try {
      const res = await api.get(`/loans/${loanId}/receipt-html`);
      if (res.data?.success) {
        setPrintHtml(res.data.html);
        setPrintModalOpen(true);
      }
    } catch (e) {
      toast.error('Failed to generate print voucher: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleSendWhatsApp = () => {
    if (!loanData) return;
    const phone = (customer?.mobile || loanData.customerMobile || '').replace(/\D/g, '');
    if (!phone) {
      toast.warning('No customer phone number available');
      return;
    }
    const targetPhone = phone.length === 10 ? `91${phone}` : phone;
    const msg = `*PAWN LOAN STATEMENT*
Ticket #: *${loanData.ticketNumber}*
Customer: *${loanData.customerName}*
Principal Outstanding: *${formatCurrency(loanData.principalOutstanding || loanData.principal)}*
Interest Due: *${formatCurrency(loanData.liveCalculation?.totalInterest || loanData.liveInterestDue || 0)}*
Total Settle Amount: *${formatCurrency(loanData.liveCalculation?.totalPayable || loanData.liveTotalDue || loanData.principal)}*
Maturity Date: *${formatDate(loanData.maturityDate)}*
Status: *${loanData.status}*

Thank you for choosing our pawn broking service!`;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!isOpen) return null;

  const loan = loanData || {};
  const liveCalc = loan.liveCalculation || {};
  const currentPrincipal = loan.principalOutstanding || loan.principal || 0;
  const liveInterest = liveCalc.totalInterest !== undefined ? liveCalc.totalInterest : (loan.liveInterestDue || 0);
  const liveTotalPayable = liveCalc.totalPayable !== undefined ? liveCalc.totalPayable : (loan.liveTotalDue || currentPrincipal);
  const overdueDays = liveCalc.overdueDays !== undefined ? liveCalc.overdueDays : (loan.liveOverdueDays || 0);

  return (
    <>
      {/* 1. BACKDROP OVERLAY */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. SLIDE-OVER DRAWER */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl z-50 flex flex-col transform transition-transform ease-in-out duration-300 animate-in slide-in-from-right">
        {/* DRAWER HEADER */}
        <div className="bg-[#0f172a] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight font-mono text-white">
                  {loan.ticketNumber || 'Pawn Loan Record'}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                    loan.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : loan.status === 'Redeemed'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : loan.status === 'Overdue'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {loan.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Pledged: {formatDate(loan.loanDate)}</span>
                <span>•</span>
                <span>Maturity: {formatDate(loan.maturityDate)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrintReceipt}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4 text-[#84cc16]" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Close Panel (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex items-center gap-1 shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Math', icon: Coins },
            { id: 'collateral', label: `Collateral & Photos (${loan.items?.length || 0})`, icon: Sparkles },
            { id: 'kyc', label: 'KYC Proofs & Sign', icon: ShieldCheck },
            { id: 'ledger', label: `Ledger & Releases (${repayments.length + (loan.partialReleaseHistory?.length || 0)})`, icon: Layers }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#0f172a] shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#65a30d]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* DRAWER BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-9 h-9 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500">Loading loan records, collateral & ledger...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <div className="font-bold">Unable to load details</div>
                <div className="text-rose-600">{error}</div>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & LIVE MATH */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Financial KPI Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Principal Out</div>
                      <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                        {formatCurrency(currentPrincipal)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Orig: {formatCurrency(loan.principal)}
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interest Accrued</div>
                      <div className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">
                        {formatCurrency(liveInterest)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        @{loan.interestPctPerMonth}% / mo
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Settle Due</div>
                      <div className="text-base sm:text-lg font-black text-[#0f172a] mt-0.5">
                        {formatCurrency(liveTotalPayable)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                        As of Today
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Status</div>
                      <div className={`text-base sm:text-lg font-black mt-0.5 ${overdueDays > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {overdueDays > 0 ? `${overdueDays} Days` : 'On Schedule'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Grace: {loan.gracePeriodDays || 7}d
                      </div>
                    </div>
                  </div>

                  {/* Customer Profile Snapshot */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                        <User className="w-4 h-4 text-[#84cc16]" />
                        <span>Borrower Profile</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>KYC Verified</span>
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {loan.customerPhotoUrl || customer?.photoUrl ? (
                          <img
                            src={loan.customerPhotoUrl || customer?.photoUrl}
                            alt="Customer"
                            onClick={() => setZoomImage(loan.customerPhotoUrl || customer?.photoUrl)}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs cursor-pointer hover:opacity-90"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm">
                            {(loan.customerName || 'U').charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-sm text-slate-900">{loan.customerName}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{loan.customerMobile || customer?.mobile || 'No phone'}</span>
                          </div>
                          {customer?.address?.street && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-300" />
                              <span className="truncate max-w-[240px]">{customer.address.street}, {customer.address.city}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <a
                          href={`tel:${loan.customerMobile || customer?.mobile}`}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Call</span>
                        </a>
                        <button
                          onClick={handleSendWhatsApp}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          title="WhatsApp Reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Vault Custody & Location */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                      <Lock className="w-4 h-4 text-[#84cc16]" />
                      <span>Physical Vault Custody & Location</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold">Vault Safe</div>
                        <div className="font-bold text-slate-800 mt-0.5">{loan.vaultId || 'Safe A'}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold">Box / Tray #</div>
                        <div className="font-bold text-slate-800 mt-0.5">Box #{loan.boxNo || 1}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold">Packet Barcode</div>
                        <div className="font-mono font-bold text-slate-800 mt-0.5">{loan.packetBarcode || loan.ticketNumber}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold">Branch Code</div>
                        <div className="font-bold text-slate-800 mt-0.5">{loan.branchCode || 'HQ-MAIN'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Loan Parameters & Scheme */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                      <Percent className="w-4 h-4 text-[#84cc16]" />
                      <span>Contract Terms & Interest Scheme</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">Interest Scheme:</span>
                        <div className="font-bold text-slate-800">{loan.interestScheme || 'MONTHLY_SIMPLE'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Monthly Rate:</span>
                        <div className="font-bold text-slate-800">{loan.interestPctPerMonth}% / mo ({((loan.interestPctPerMonth || 0) * 12).toFixed(1)}% p.a.)</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Loan Duration:</span>
                        <div className="font-bold text-slate-800">{loan.durationMonths || 3} Months</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Eligible LTV:</span>
                        <div className="font-bold text-slate-800">{loan.eligibleLtvPct || 75}%</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Penalty After Grace:</span>
                        <div className="font-bold text-slate-800">{loan.penaltyPct || 1.0}% / mo</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Appraised Market Valuation:</span>
                        <div className="font-extrabold text-[#65a30d]">{formatCurrency(loan.marketValuationTotal || 0)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COLLATERAL & ORNAMENT PHOTOS */}
              {activeTab === 'collateral' && (
                <div className="space-y-4">
                  {/* Collateral Weight Summary */}
                  <div className="grid grid-cols-3 gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Total Items</div>
                      <div className="text-base font-black text-slate-900 mt-0.5">{loan.items?.length || 0} Ornaments</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Total Gross Wt</div>
                      <div className="text-base font-black text-slate-900 mt-0.5">{formatWeight(loan.totalGrossWt)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Total Net Wt</div>
                      <div className="text-base font-black text-[#65a30d] mt-0.5">{formatWeight(loan.totalNetWt)}</div>
                    </div>
                  </div>

                  {/* Ornaments List */}
                  <div className="space-y-3">
                    {(loan.items || []).map((item, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 text-[#84cc16] font-mono font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div className="font-extrabold text-sm text-slate-900">{item.ornamentType}</div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900">
                              {item.purity || '22K'} ({item.metal || 'Gold'})
                            </span>
                          </div>
                          <div className="font-bold text-xs text-slate-900">
                            Qty: {item.quantity || 1}
                          </div>
                        </div>

                        {/* Weight & Value details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <div className="text-[10px] text-slate-400">Gross Weight</div>
                            <div className="font-bold text-slate-800">{formatWeight(item.grossWeight)}</div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <div className="text-[10px] text-slate-400">Deductions / Stones</div>
                            <div className="font-bold text-slate-800">{formatWeight(item.stoneWeight || 0)}</div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <div className="text-[10px] text-slate-400">Net Weight</div>
                            <div className="font-bold text-[#65a30d]">{formatWeight(item.netWeight)}</div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <div className="text-[10px] text-slate-400">Appraised Valuation</div>
                            <div className="font-bold text-slate-900">{formatCurrency(item.valuationAmount || 0)}</div>
                          </div>
                        </div>

                        {item.description && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                            <span className="font-semibold text-slate-500">Hallmark / Remarks:</span> {item.description}
                          </div>
                        )}

                        {/* Item Photo Strip */}
                        {item.photos && item.photos.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-slate-400" />
                              <span>Ornament Photos ({item.photos.length})</span>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {item.photos.map((photoUrl, pIdx) => (
                                <div
                                  key={pIdx}
                                  onClick={() => setZoomImage(photoUrl)}
                                  className="relative group cursor-pointer shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:border-[#84cc16] transition"
                                >
                                  <img
                                    src={photoUrl}
                                    alt={`Item ${idx + 1} Photo ${pIdx + 1}`}
                                    className="w-16 h-16 object-cover group-hover:scale-105 transition"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                                    <ZoomIn className="w-4 h-4" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: KYC PROOFS & SIGNATURES */}
              {activeTab === 'kyc' && (
                <div className="space-y-4">
                  {/* Face Photo & Identity Grid */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                      <Camera className="w-4 h-4 text-[#84cc16]" />
                      <span>Customer Live Face Photo & ID Verification</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {loan.customerPhotoUrl || customer?.photoUrl ? (
                        <div
                          onClick={() => setZoomImage(loan.customerPhotoUrl || customer?.photoUrl)}
                          className="relative group cursor-pointer rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm shrink-0"
                        >
                          <img
                            src={loan.customerPhotoUrl || customer?.photoUrl}
                            alt="Borrower Photo"
                            className="w-28 h-28 object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                            <ZoomIn className="w-5 h-5" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-28 h-28 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-2 border border-slate-200">
                          <User className="w-6 h-6 mb-1 text-slate-300" />
                          <span>No live photo uploaded</span>
                        </div>
                      )}

                      <div className="space-y-1.5 text-xs flex-1">
                        <div className="font-extrabold text-sm text-slate-900">{loan.customerName}</div>
                        <div className="text-slate-500">Aadhaar: <span className="font-mono font-bold text-slate-800">{customer?.aadhaarNumber || 'Verified on file'}</span></div>
                        <div className="text-slate-500">PAN Card: <span className="font-mono font-bold text-slate-800">{customer?.panNumber || 'N/A'}</span></div>
                        <div className="text-slate-500">Nominee: <span className="font-bold text-slate-800">{customer?.nominee?.name ? `${customer.nominee.name} (${customer.nominee.relationship || 'Nominee'})` : 'None registered'}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* KYC Documents Gallery */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                      <FileText className="w-4 h-4 text-[#84cc16]" />
                      <span>Uploaded KYC Documents</span>
                    </div>

                    {loan.documents && loan.documents.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {loan.documents.map((doc, dIdx) => (
                          <div
                            key={dIdx}
                            className="p-3 bg-slate-50 rounded-2xl border border-slate-200 hover:border-[#84cc16] transition group flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <div className="font-bold text-xs text-slate-800">{doc.docType || `Document #${dIdx + 1}`}</div>
                              {doc.docNumber && <div className="text-[10px] text-slate-400 font-mono">{doc.docNumber}</div>}
                            </div>
                            {doc.fileUrl ? (
                              <button
                                onClick={() => setZoomImage(doc.fileUrl)}
                                className="mt-2.5 flex items-center justify-center gap-1 w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold border border-slate-200 shadow-2xs"
                              >
                                <ZoomIn className="w-3.5 h-3.5 text-[#65a30d]" />
                                <span>Preview Proof</span>
                              </button>
                            ) : (
                              <div className="mt-2 text-[10px] text-slate-400 italic">No document file</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No supplementary KYC proof files attached to this loan.
                      </div>
                    )}
                  </div>

                  {/* Digital Signature & AML Declaration */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                      <ShieldCheck className="w-4 h-4 text-[#84cc16]" />
                      <span>Digital Signature & Statutory Compliance</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {loan.digitalSignatureUrl ? (
                        <div
                          onClick={() => setZoomImage(loan.digitalSignatureUrl)}
                          className="p-2 bg-white rounded-xl border border-slate-200 cursor-pointer shadow-2xs hover:border-[#84cc16]"
                        >
                          <img
                            src={loan.digitalSignatureUrl}
                            alt="Borrower Signature"
                            className="h-16 w-36 object-contain"
                          />
                          <div className="text-[10px] text-center text-slate-400 mt-1">Borrower E-Signature</div>
                        </div>
                      ) : (
                        <div className="h-16 w-36 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-[10px] text-center p-1">
                          Physical Signature on Ticket
                        </div>
                      )}

                      <div className="text-xs space-y-1 flex-1">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>AML Gold Ownership Declaration Accepted</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Borrower has formally declared lawful ownership of all pledged items and authorized statutory auction under RBI regulations upon default.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LEDGER & REPAYMENTS */}
              {activeTab === 'ledger' && (
                <div className="space-y-4">
                  {/* Repayment History Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#84cc16]" />
                      <span>Payment Transactions & Interest Settlements ({repayments.length})</span>
                    </div>

                    {repayments.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        No payments logged yet for this loan.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-500 font-bold text-[10px] uppercase">
                            <tr>
                              <th className="py-2.5 px-3">Receipt #</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3 text-right">Interest Paid</th>
                              <th className="py-2.5 px-3 text-right">Principal Paid</th>
                              <th className="py-2.5 px-3 text-right">Total Settled</th>
                              <th className="py-2.5 px-3 text-center">Mode</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {repayments.map(rep => (
                              <tr key={rep._id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{rep.receiptNumber}</td>
                                <td className="py-2.5 px-3 text-slate-500">{formatDate(rep.paymentDate)}</td>
                                <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">{formatCurrency(rep.interestAmount)}</td>
                                <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{formatCurrency(rep.principalAmount)}</td>
                                <td className="py-2.5 px-3 text-right font-black text-[#0f172a]">{formatCurrency(rep.totalPaid)}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {rep.paymentMethod || 'Cash'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Partial Release Audit History */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#84cc16]" />
                      <span>Partial Gold Collateral Releases ({loan.partialReleaseHistory?.length || 0})</span>
                    </div>

                    {!loan.partialReleaseHistory || loan.partialReleaseHistory.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        No partial releases performed on this loan.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {loan.partialReleaseHistory.map((pr, prIdx) => (
                          <div key={prIdx} className="p-3.5 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-[#0f172a]">{pr.voucherNumber || `PRV-${prIdx + 1}`}</span>
                              <span className="text-slate-400 text-[11px]">{formatDateTime(pr.releaseDate)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                              <span>Principal Paid: <strong className="text-slate-900">{formatCurrency(pr.principalPaid)}</strong></span>
                              <span>Remaining Principal: <strong className="text-[#65a30d]">{formatCurrency(pr.remainingPrincipal)}</strong></span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Released: {(pr.releasedItems || []).map(i => `${i.ornamentType} (${i.netWeight}g)`).join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bank Re-Pledge Audit Trail (If applicable) */}
                  {loan.repledgeStatus && loan.repledgeStatus.isRepledged && (
                    <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                        <Building2 className="w-4 h-4 text-amber-700" />
                        <span>Commercial Bank Re-Pledge Custody</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-[10px] text-amber-700">Bank Partner:</div>
                          <div className="font-bold text-amber-950">{loan.repledgeStatus.bankName}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-amber-700">Bank Packet #:</div>
                          <div className="font-mono font-bold text-amber-950">{loan.repledgeStatus.bankPacketId}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-amber-700">Bank Loan Amount:</div>
                          <div className="font-bold text-amber-950">{formatCurrency(loan.repledgeStatus.bankLoanAmount)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* DRAWER FOOTER / QUICK ACTIONS */}
        <div className="bg-white p-3.5 sm:p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-lg">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReceipt}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {loan.status !== 'Redeemed' && (
              <>
                <Link
                  to={`/repayments?loanId=${loan._id}`}
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#84cc16] hover:bg-[#65a30d] text-[#0f172a] rounded-xl text-xs font-black shadow-xs transition"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Collect Payment</span>
                </Link>

                <Link
                  to={`/redemption?loanId=${loan._id}`}
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#84cc16]" />
                  <span>Redeem &amp; Close</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ZOOM LIGHTBOX MODAL */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomImage}
              alt="Zoomed Detail"
              className="max-h-[82vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      <PrintVoucherModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        htmlContent={printHtml}
        title={`Pawn Slip: ${loan.ticketNumber}`}
      />
    </>
  );
}
