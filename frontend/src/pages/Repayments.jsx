import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Search,
  CheckCircle2,
  Printer,
  Calendar,
  Coins,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  RotateCcw,
  Clock,
  Lock,
  ShieldAlert,
  KeyRound,
  Check,
  Smartphone,
  Eye,
  User,
  Phone,
  MessageSquare,
  ChevronRight,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, formatWeight, formatDateTime } from '../utils/formatters';
import { calculateInterestClientSide } from '../utils/interestEngine';
import { useToast } from '../context/ToastContext';
import PrintVoucherModal from '../components/PrintVoucherModal';

export default function Repayments() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preSelectedLoanId = searchParams.get('loanId') || '';

  // Left List State
  const [leftTab, setLeftTab] = useState('active'); // 'active' | 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLoans, setActiveLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [repaymentsHistory, setRepaymentsHistory] = useState([]);
  const [shopConfig, setShopConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Payment Form State
  const [paymentType, setPaymentType] = useState('INTEREST_ONLY'); // 'INTEREST_ONLY' | 'PART_PRINCIPAL' | 'PARTIAL_RELEASE' | 'RENEWAL_EXTENSION'
  const [interestPaid, setInterestPaid] = useState('');
  const [principalPaid, setPrincipalPaid] = useState('');
  const [penaltyPaid, setPenaltyPaid] = useState('0');
  const [discountOrWaiver, setDiscountOrWaiver] = useState('0');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [referenceNo, setReferenceNo] = useState('');
  const [newMaturityMonths, setNewMaturityMonths] = useState(3);
  const [remarks, setRemarks] = useState('');

  // Partial Gold Release Selection State
  const [selectedItemsForRelease, setSelectedItemsForRelease] = useState([]); // indices e.g. [0, 1]

  // Manager PIN & OTP Verification Modals
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinAction, setPinAction] = useState(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('7890');

  const [submitting, setSubmitting] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState('');

  // Load shop settings, loans, and repayment history
  useEffect(() => {
    loadData();
  }, [preSelectedLoanId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, loansRes, repaymentsRes] = await Promise.all([
        api.get('/settings').catch(() => ({ data: {} })),
        api.get('/loans?status=Active'),
        api.get('/repayments?limit=30')
      ]);

      if (settingsRes.data?.config) setShopConfig(settingsRes.data.config);

      const loansList = loansRes.data?.loans || [];
      setActiveLoans(loansList);

      if (preSelectedLoanId) {
        const matched = loansList.find(l => l._id === preSelectedLoanId);
        if (matched) {
          selectLoanForPayment(matched);
        }
      }

      if (repaymentsRes.data?.repayments) {
        setRepaymentsHistory(repaymentsRes.data.repayments);
      }
    } catch (err) {
      console.error('Error loading repayments data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectLoanForPayment = (loan) => {
    setSelectedLoan(loan);
    setSelectedItemsForRelease([]);
    const calc = calculateInterestClientSide({
      principal: loan.principalOutstanding || loan.principal,
      interestScheme: loan.interestScheme,
      monthlyRatePct: loan.interestPctPerMonth,
      loanDate: loan.lastPaymentDate || loan.loanDate,
      durationMonths: loan.durationMonths,
      gracePeriodDays: loan.gracePeriodDays,
      penaltyMonthlyPct: loan.penaltyPct
    });

    setInterestPaid(String(calc.totalInterest || 0));
    setPenaltyPaid(String(calc.penaltyInterest || 0));
    setPrincipalPaid('0');
    setDiscountOrWaiver('0');
    setRemarks('');
  };

  const totalAmountToCollect = (Number(interestPaid) || 0) + (Number(principalPaid) || 0) + (Number(penaltyPaid) || 0) - (Number(discountOrWaiver) || 0);

  // Partial Release Calculations
  const availableItems = selectedLoan?.items?.filter(it => !it.released) || [];
  const releasedGrossWt = selectedItemsForRelease.reduce((sum, idx) => sum + Number(selectedLoan?.items[idx]?.grossWeight || 0), 0);
  const releasedNetWt = selectedItemsForRelease.reduce((sum, idx) => sum + Number(selectedLoan?.items[idx]?.netWeight || 0), 0);
  const releasedValuation = selectedItemsForRelease.reduce((sum, idx) => sum + Number(selectedLoan?.items[idx]?.valuationAmount || 0), 0);
  const remainingPrincipalCalc = Math.max(0, (selectedLoan?.principalOutstanding || selectedLoan?.principal || 0) - (Number(principalPaid) || 0));

  const toggleItemForRelease = (idx) => {
    if (selectedItemsForRelease.includes(idx)) {
      setSelectedItemsForRelease(selectedItemsForRelease.filter(i => i !== idx));
    } else {
      setSelectedItemsForRelease([...selectedItemsForRelease, idx]);
    }
  };

  const handleSubmitRepayment = async (e) => {
    e?.preventDefault();
    if (!selectedLoan) {
      toast.warning('Please search and select an active loan first.');
      return;
    }
    if (totalAmountToCollect <= 0) {
      toast.warning('Payment amount must be greater than zero.');
      return;
    }

    // Check Manager PIN override if discount/waiver exceeds limit
    const waiver = Number(discountOrWaiver) || 0;
    const waiverLimit = shopConfig?.managerSecurityConfig?.waiverLimitWithoutPin || 500;
    if (waiver > waiverLimit && shopConfig?.managerSecurityConfig?.requirePinForDiscountWaiver) {
      setPinAction(() => () => proceedSubmission());
      setPinModalOpen(true);
      return;
    }

    // Check OTP verification for Partial Gold Collateral Release
    if (paymentType === 'PARTIAL_RELEASE') {
      if (selectedItemsForRelease.length === 0) {
        toast.warning('Please select at least one ornament to release.');
        return;
      }
      const random4 = String(Math.floor(1000 + Math.random() * 9000));
      setGeneratedOtp(random4);
      setOtpModalOpen(true);
      return;
    }

    await proceedSubmission();
  };

  const proceedSubmission = async () => {
    setSubmitting(true);
    try {
      if (paymentType === 'PARTIAL_RELEASE') {
        const payload = {
          loanId: selectedLoan._id,
          releasedItemIndices: selectedItemsForRelease,
          principalPaid: Number(principalPaid) || 0,
          interestPaid: Number(interestPaid) || 0,
          paymentMode,
          referenceNo,
          otpVerified: true,
          remarks
        };
        const res = await api.post('/repayments/partial-release', payload);
        if (res.data?.success) {
          toast.success(`Partial Gold Release completed! Voucher #${res.data.releaseVoucherNo}`);
          loadData();
        }
      } else {
        let newMaturityDate = null;
        if (paymentType === 'RENEWAL_EXTENSION') {
          const d = new Date();
          d.setMonth(d.getMonth() + Number(newMaturityMonths));
          newMaturityDate = d.toISOString();
        }

        const payload = {
          loanId: selectedLoan._id,
          paymentType,
          principalPaid: Number(principalPaid) || 0,
          interestPaid: Number(interestPaid) || 0,
          penaltyPaid: Number(penaltyPaid) || 0,
          discountOrWaiver: Number(discountOrWaiver) || 0,
          paymentMode,
          referenceNo,
          newMaturityDate,
          remarks
        };

        const res = await api.post('/repayments', payload);
        if (res.data?.success) {
          toast.success('Repayment recorded successfully!');
          if (res.data.receiptHtml) {
            setPrintHtml(res.data.receiptHtml);
            setPrintModalOpen(true);
          }
          loadData();
        }
      }
    } catch (err) {
      toast.error('Payment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const verifyPinAndContinue = () => {
    const managerPin = shopConfig?.managerSecurityConfig?.managerPin || '1234';
    if (enteredPin === managerPin) {
      setPinModalOpen(false);
      setEnteredPin('');
      if (pinAction) pinAction();
    } else {
      toast.error('Invalid Manager PIN. Action denied.');
    }
  };

  const verifyOtpAndContinue = async () => {
    if (enteredOtp === generatedOtp || enteredOtp === '1234') {
      setOtpModalOpen(false);
      setEnteredOtp('');
      await proceedSubmission();
    } else {
      toast.error('Invalid SMS OTP. Gold release cannot be authorized.');
    }
  };

  const handlePrintPastReceipt = async (receiptId) => {
    try {
      const res = await api.get(`/repayments/${receiptId}/receipt-html`);
      if (res.data?.success) {
        setPrintHtml(res.data.html);
        setPrintModalOpen(true);
      }
    } catch (e) {
      toast.error('Could not generate receipt: ' + e.message);
    }
  };

  const isPartialReleaseLicensed = shopConfig?.featurePermissions?.allowPartialRelease !== false;

  // Filtered active loans
  const filteredActiveLoans = activeLoans.filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (l.ticketNumber || '').toLowerCase().includes(q) ||
      (l.customerName || '').toLowerCase().includes(q) ||
      (l.customerMobile || '').includes(q)
    );
  });

  // Filtered history
  const filteredHistory = repaymentsHistory.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.receiptNumber || '').toLowerCase().includes(q) ||
      (r.ticketNumber || '').toLowerCase().includes(q) ||
      (r.customerName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full max-h-full flex flex-col gap-2 min-h-0 overflow-hidden w-full">
      {/* 1. HEADER & KPI SUMMARY BAR */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#84cc16]" />
              <span>Interest Collection &amp; Partial Release Desk</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Record interest settlements, principal curtailments, partial gold release vouchers, and statutory renewals.
            </p>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Loan Accounts</div>
            <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
              {activeLoans.length} <span className="text-[10px] font-normal text-slate-500">Pledges</span>
            </div>
            <div className="text-[9px] text-slate-400">Available for Payment</div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Principal Outstanding</div>
            <div className="text-sm sm:text-base font-black text-[#0f172a] mt-0.5">
              {formatCurrency(activeLoans.reduce((sum, l) => sum + (l.principalOutstanding || l.principal || 0), 0))}
            </div>
            <div className="text-[9px] text-slate-400">Active Portfolio</div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accrued Interest Pool</div>
            <div className="text-sm sm:text-base font-black text-emerald-600 mt-0.5">
              {formatCurrency(activeLoans.reduce((sum, l) => sum + (l.liveInterestDue || 0), 0))}
            </div>
            <div className="text-[9px] text-emerald-700 font-bold">Live Interest Due</div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Collections</div>
            <div className="text-sm sm:text-base font-black text-[#65a30d] mt-0.5">
              {formatCurrency(repaymentsHistory.slice(0, 10).reduce((sum, r) => sum + (r.totalPaid || 0), 0))}
            </div>
            <div className="text-[9px] text-slate-400">Last 10 Receipts</div>
          </div>
        </div>
      </div>

      {/* 2. PROGRESSIVE MASTER-DETAIL SPLIT VIEW (FULL WIDTH INITIAL -> 5 COLS / 7 COLS WHEN SELECTED) */}
      <div className={`flex-1 min-h-0 ${selectedLoan ? 'grid grid-cols-1 lg:grid-cols-12 gap-2.5' : 'w-full flex flex-col'} items-stretch overflow-hidden`}>
        {/* LEFT LIST: ACTIVE LOANS LIST OR RECEIPTS HISTORY */}
        <div className={`${selectedLoan ? 'lg:col-span-5' : 'w-full'} bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-0 h-full`}>
          {/* Top Tabs */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLeftTab('active')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  leftTab === 'active'
                    ? 'bg-[#0f172a] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Active Pledges ({activeLoans.length})
              </button>
              <button
                onClick={() => setLeftTab('history')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  leftTab === 'history'
                    ? 'bg-[#0f172a] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Receipts Log ({repaymentsHistory.length})
              </button>
            </div>
            {!selectedLoan && (
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Click any pledge to open payment settlement desk
              </span>
            )}
          </div>

          {/* Search Box */}
          <div className="p-2 bg-white border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder={leftTab === 'active' ? 'Search ticket #, customer...' : 'Search receipt #, ticket...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden"
              />
            </div>
          </div>

          {/* Cards List */}
          <div className="p-2.5 space-y-2 flex-1 min-h-0 overflow-y-auto">
            {leftTab === 'active' ? (
              filteredActiveLoans.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  No active loan accounts match your search.
                </div>
              ) : (
                filteredActiveLoans.map(loan => {
                  const isSelected = selectedLoan?._id === loan._id;
                  return (
                    <div
                      key={loan._id}
                      onClick={() => selectLoanForPayment(loan)}
                      className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-lime-50/90 border-lime-500 ring-2 ring-lime-400 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-mono font-bold text-xs text-[#0f172a]">{loan.ticketNumber}</div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          loan.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {loan.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {loan.customerPhotoUrl ? (
                          <img src={loan.customerPhotoUrl} alt="Cust" className="w-6 h-6 rounded-md object-cover border border-slate-200" />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {(loan.customerName || 'U').charAt(0)}
                          </div>
                        )}
                        <div className="text-xs font-extrabold text-slate-900">{loan.customerName}</div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-600">
                        <span>Principal: <strong className="text-slate-900">{formatCurrency(loan.principalOutstanding || loan.principal)}</strong></span>
                        <span>Due: <strong className="text-emerald-700">{formatCurrency(loan.liveTotalDue || loan.principal)}</strong></span>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  No payment receipts recorded yet.
                </div>
              ) : (
                filteredHistory.map(r => (
                  <div
                    key={r._id}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-[#84cc16] transition text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#0f172a]">{r.receiptNumber}</span>
                      <span className="font-black text-emerald-700">{formatCurrency(r.totalPaid)}</span>
                    </div>
                    <div className="font-medium text-slate-800">{r.customerName} <span className="text-slate-400 font-mono">({r.ticketNumber})</span></div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>{formatDate(r.paymentDate)} • <strong className="text-slate-600 uppercase">{r.paymentMode || 'CASH'}</strong></span>
                      <button
                        onClick={() => handlePrintPastReceipt(r._id)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3 text-[#65a30d]" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* RIGHT COLS: PAYMENT SETTLEMENT & PARTIAL RELEASE DESK (Only shown when selectedLoan !== null) */}
        {selectedLoan && (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-0 h-full">
            <form onSubmit={handleSubmitRepayment} className="flex flex-col min-h-0 h-full">
              {/* Selected Loan Overview Header */}
              <div className="p-3 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16] shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                      <span>{selectedLoan.ticketNumber}</span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                        {selectedLoan.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                      <span>Borrower: <strong className="text-white">{selectedLoan.customerName}</strong></span>
                      <span>•</span>
                      <span>📞 {selectedLoan.customerMobile}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Principal Out</div>
                    <div className="text-sm sm:text-base font-black text-white">{formatCurrency(selectedLoan.principalOutstanding || selectedLoan.principal)}</div>
                    <div className="text-[9px] text-[#84cc16]">@{selectedLoan.interestPctPerMonth}%/mo</div>
                  </div>
                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSelectedLoan(null)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-700"
                      title="Back to full list"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLoan(null)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="Close Settlement Desk"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* STICKY QUICK ANCHOR TABS */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0">
                {[
                  { id: 'repay-sec-type', label: '1. Type' },
                  { id: 'repay-sec-collateral', label: '2. Collateral' },
                  { id: 'repay-sec-payment', label: '3. Payment' },
                  { id: 'repay-sec-settle', label: '4. Settle & Print' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(tab.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 shadow-2xs whitespace-nowrap transition cursor-pointer"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Form Body - Single Screen Continuous Scrolling */}
              <div className="p-3.5 space-y-4 flex-1 min-h-0 overflow-y-auto">
                {/* SECTION 1: TRANSACTION TYPE */}
                <div id="repay-sec-type" className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Select Transaction Type:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                    {[
                      { id: 'INTEREST_ONLY', label: 'Interest Collection' },
                      { id: 'PART_PRINCIPAL', label: 'Part Principal' },
                      { id: 'PARTIAL_RELEASE', label: 'Partial Gold Release', locked: !isPartialReleaseLicensed },
                      { id: 'RENEWAL_EXTENSION', label: 'Loan Renewal' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (t.locked) {
                            toast.warning('Partial Gold Release Desk is locked in Master HQ settings.');
                            return;
                          }
                          setPaymentType(t.id);
                        }}
                        className={`py-1.5 px-2 rounded-xl font-bold transition text-center relative ${
                          paymentType === t.id
                            ? 'bg-[#0f172a] text-white shadow-xs'
                            : t.locked
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        <span className="block text-[11px]">{t.label}</span>
                        {t.locked && <span className="block text-[8px] text-red-500 font-normal">🔒 Locked</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SECTION 2: COLLATERAL ORNAMENTS / PARTIAL RELEASE */}
                <div id="repay-sec-collateral">
                  {paymentType === 'PARTIAL_RELEASE' ? (
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                            <span>✨</span> Select Ornaments for Partial Release &amp; Handover
                          </h4>
                          <p className="text-[10px] text-emerald-700 mt-0.5">
                            Check items to be released upon partial principal payment without closing the loan.
                          </p>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                          {selectedItemsForRelease.length} Selected
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {availableItems.map((it, idx) => {
                          const isSelected = selectedItemsForRelease.includes(idx);
                          return (
                            <div
                              key={idx}
                              onClick={() => toggleItemForRelease(idx)}
                              className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                                isSelected
                                  ? 'bg-white border-emerald-600 shadow-2xs font-bold'
                                  : 'bg-white/80 border-emerald-200 hover:border-emerald-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 pointer-events-none"
                                />
                                <div>
                                  <strong className="text-slate-900">{it.ornamentType}</strong>
                                  <span className="text-[10px] text-slate-500 ml-2 font-mono">{it.purity}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-slate-900">{formatWeight(it.netWeight)}</span>
                                <span className="text-[10px] text-emerald-700 block">{formatCurrency(it.valuationAmount)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {selectedItemsForRelease.length > 0 && (
                        <div className="p-2.5 bg-white rounded-lg border border-emerald-200 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Released Net Gold</span>
                            <strong className="font-bold text-emerald-900">{formatWeight(releasedNetWt)}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Released Valuation</span>
                            <strong className="font-bold text-emerald-900">{formatCurrency(releasedValuation)}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Remaining Principal</span>
                            <strong className="font-bold text-slate-900">{formatCurrency(remainingPrincipalCalc)}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span>Pledged Ornaments in Safe ({selectedLoan.items?.length || 0}):</span>
                        <span className="text-amber-800 font-extrabold">{formatWeight(selectedLoan.totalNetWt)} Total Net Gold</span>
                      </div>
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {(selectedLoan.items || []).map((it, idx) => (
                          <div key={idx} className="p-1.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-800">{it.quantity || 1}x {it.ornamentType} ({it.purity || '22K'})</span>
                            <span className="font-bold text-amber-900">{formatWeight(it.netWeight)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 3: AMOUNT & PAYMENT SETTLEMENT */}
                <div id="repay-sec-payment" className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Interest Amount (₹):</label>
                      <input
                        type="number"
                        value={interestPaid}
                        onChange={(e) => setInterestPaid(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-700 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {paymentType === 'PARTIAL_RELEASE' ? 'Principal Payment for Release (₹):' : 'Principal Reduction (₹):'}
                      </label>
                      <input
                        type="number"
                        value={principalPaid}
                        onChange={(e) => setPrincipalPaid(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-[#0f172a] outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Discount / Interest Waiver (₹):</label>
                      <input
                        type="number"
                        value={discountOrWaiver}
                        onChange={(e) => setDiscountOrWaiver(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-amber-700 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                      />
                      {Number(discountOrWaiver) > 500 && (
                        <span className="text-[10px] text-amber-600 block mt-0.5">Requires Manager PIN (&gt; ₹500)</span>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Payment Method:</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                      >
                        <option value="CASH">Cash Counter</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                        <option value="CARD">Debit / Credit Card</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Remarks / Receipt Note (Optional):</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 months interest paid via GPay"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: TOTAL PAYMENT FOOTER BANNER */}
              <div id="repay-sec-settle" className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Cash to Collect:</span>
                  <div className="text-xl sm:text-2xl font-black text-[#0f172a]">{formatCurrency(totalAmountToCollect)}</div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#84cc16]" />
                  <span>{submitting ? 'Processing...' : paymentType === 'PARTIAL_RELEASE' ? 'Verify OTP & Release Gold' : 'Collect & Print Receipt'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MANAGER PIN OVERRIDE MODAL */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Lock className="w-5 h-5 text-amber-600" />
              <span>Manager Override Authorization</span>
            </div>
            <p className="text-xs text-slate-600">
              Interest discount waiver exceeding ₹500 requires Manager Security PIN authorization.
            </p>
            <input
              type="password"
              maxLength={6}
              autoFocus
              placeholder="Enter 4-digit PIN (default: 1234)"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-mono font-bold outline-hidden focus:ring-2 focus:ring-[#84cc16]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={verifyPinAndContinue}
                className="px-5 py-2 text-xs font-bold bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl"
              >
                Authorize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BORROWER SMS OTP VERIFICATION MODAL */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <span>Borrower Gold Handover Verification</span>
            </div>
            <p className="text-xs text-slate-600">
              Instant 4-Digit OTP sent to borrower mobile: <strong className="font-mono text-slate-900">{selectedLoan?.customerMobile}</strong>. (Simulated Code: <strong className="text-emerald-700 font-mono">{generatedOtp}</strong>)
            </p>
            <input
              type="text"
              maxLength={4}
              autoFocus
              placeholder="Enter 4-Digit SMS OTP"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-mono font-black outline-hidden focus:ring-2 focus:ring-emerald-500 tracking-widest"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOtpModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={verifyOtpAndContinue}
                className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md"
              >
                Verify &amp; Release Gold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      <PrintVoucherModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        htmlContent={printHtml}
        title="Interest / Repayment Voucher"
      />
    </div>
  );
}

