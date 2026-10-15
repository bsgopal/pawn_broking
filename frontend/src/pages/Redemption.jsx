import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Sparkles,
  AlertCircle,
  Lock,
  User,
  Phone,
  MessageSquare,
  Coins,
  Receipt,
  Clock,
  Check,
  ChevronRight,
  ArrowLeft,
  X
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters';
import { calculateInterestClientSide } from '../utils/interestEngine';
import { useToast } from '../context/ToastContext';
import PrintVoucherModal from '../components/PrintVoucherModal';

export default function Redemption() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preSelectedLoanId = searchParams.get('loanId') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeLoans, setActiveLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Settlement Form State
  const [waiverAmount, setWaiverAmount] = useState('0');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [ornamentsVerified, setOrnamentsVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successRedemption, setSuccessRedemption] = useState(null);

  // Print Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState('');

  useEffect(() => {
    loadLoans();
  }, [preSelectedLoanId]);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/loans?status=Active');
      if (res.data?.loans) {
        const loansList = res.data.loans;
        setActiveLoans(loansList);
        if (preSelectedLoanId) {
          const matched = loansList.find(l => l._id === preSelectedLoanId);
          if (matched) handleSelectLoan(matched);
        }
      }
    } catch (err) {
      console.error('Error fetching loans for redemption:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
    const calc = calculateInterestClientSide({
      principal: loan.principalOutstanding || loan.principal,
      interestScheme: loan.interestScheme,
      monthlyRatePct: loan.interestPctPerMonth,
      loanDate: loan.lastPaymentDate || loan.loanDate,
      durationMonths: loan.durationMonths,
      gracePeriodDays: loan.gracePeriodDays,
      penaltyMonthlyPct: loan.penaltyPct
    });
    setCalculation(calc);
    setWaiverAmount('0');
    setOrnamentsVerified(false);
    setSuccessRedemption(null);
  };

  const finalSettlementAmount = calculation ? Math.max(0, calculation.totalPayable - (Number(waiverAmount) || 0)) : 0;

  const handleProcessRedemption = async (e) => {
    e.preventDefault();
    if (!selectedLoan || !calculation) return;
    if (!ornamentsVerified) {
      toast.warning('Please confirm the verification checkbox that gold ornaments were physically inspected and handed over.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        loanId: selectedLoan._id,
        principalSettled: calculation.principal,
        interestSettled: calculation.baseInterest,
        penaltySettled: calculation.penaltyInterest,
        waiverAmount: Number(waiverAmount) || 0,
        totalAmountSettled: finalSettlementAmount,
        paymentMode
      };

      const res = await api.post('/redemptions', payload);
      if (res.data?.success) {
        toast.success('Pledge successfully redeemed & collateral released!');
        setSuccessRedemption(res.data.redemption);
        if (res.data.receiptHtml) {
          setPrintHtml(res.data.receiptHtml);
          setPrintModalOpen(true);
        }
        loadLoans();
      }
    } catch (err) {
      toast.error('Redemption failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLoans = activeLoans.filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (l.ticketNumber || '').toLowerCase().includes(q) ||
      (l.customerName || '').toLowerCase().includes(q) ||
      (l.customerMobile || '').includes(q)
    );
  });

  return (
    <div className="h-full max-h-full flex flex-col gap-2 min-h-0 overflow-hidden w-full">
      {/* 1. TOP HEADER & METRICS */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#84cc16]" />
              <span>Loan Redemption &amp; Collateral Release Desk</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Full principal and accrued interest settlement, vault compartment release verification, and statutory discharge voucher generation.
            </p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Pledges</div>
            <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
              {activeLoans.length} <span className="text-[10px] font-normal text-slate-500">Loans</span>
            </div>
            <div className="text-[9px] text-slate-400">Eligible for Redemption</div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Loan Principal</div>
            <div className="text-sm sm:text-base font-black text-[#0f172a] mt-0.5">
              {formatCurrency(activeLoans.reduce((sum, l) => sum + (l.principalOutstanding || l.principal || 0), 0))}
            </div>
            <div className="text-[9px] text-slate-400">Total Book Balance</div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pledged Gold in Safe</div>
            <div className="text-sm sm:text-base font-black text-amber-700 mt-0.5">
              {formatWeight(activeLoans.reduce((sum, l) => sum + (l.totalNetWt || 0), 0))}
            </div>
            <div className="text-[9px] text-slate-400">Net Gold Grams</div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security Clearance</div>
            <div className="text-sm sm:text-base font-black text-emerald-700 mt-0.5">
              100% Verified
            </div>
            <div className="text-[9px] text-emerald-700 font-bold">Vault Handover Ready</div>
          </div>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {successRedemption && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-1 shadow-xs shrink-0 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Loan #{successRedemption.ticketNumber} Successfully Redeemed &amp; Discharged!</span>
            </div>
            <button
              onClick={() => setPrintModalOpen(true)}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Reprint Discharge Slip</span>
            </button>
          </div>
          <p className="text-[11px] text-emerald-800">
            Discharge Voucher Ref: <strong className="font-mono text-emerald-950">{successRedemption.redemptionNumber}</strong>. Collateral ornaments verified and safely returned to customer <strong>{successRedemption.customerName}</strong>.
          </p>
        </div>
      )}

      {/* 2. PROGRESSIVE MASTER-DETAIL SPLIT VIEW (FULL WIDTH INITIAL -> 5 COLS / 7 COLS WHEN SELECTED) */}
      <div className={`flex-1 min-h-0 ${selectedLoan && calculation ? 'grid grid-cols-1 lg:grid-cols-12 gap-2.5' : 'w-full flex flex-col'} items-stretch overflow-hidden`}>
        {/* LEFT 5 COLS (~42%): SEARCHABLE ACTIVE LOANS LIST */}
        <div className={`${selectedLoan && calculation ? 'lg:col-span-5' : 'w-full'} bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-0 h-full`}>
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#84cc16]" />
              <span>Select Active Loan to Redeem ({filteredLoans.length})</span>
            </span>
            {!selectedLoan && (
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Click any loan to open redemption settlement desk
              </span>
            )}
          </div>

          <div className="p-2 bg-white border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket #, customer name, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden"
              />
            </div>
          </div>

          <div className="p-2.5 space-y-2 flex-1 min-h-0 overflow-y-auto">
            {filteredLoans.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                No active loans found matching your search.
              </div>
            ) : (
              filteredLoans.map(loan => {
                const isSelected = selectedLoan?._id === loan._id;
                return (
                  <div
                    key={loan._id}
                    onClick={() => handleSelectLoan(loan)}
                    className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-lime-50/90 border-lime-500 ring-2 ring-lime-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#0f172a]">{loan.ticketNumber}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                        {loan.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-xs text-slate-900">{loan.customerName}</div>
                      <div className="text-[10px] text-amber-800 font-bold">{formatWeight(loan.totalNetWt)} Gold</div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-600">
                      <span>Principal: <strong className="text-slate-900">{formatCurrency(loan.principalOutstanding || loan.principal)}</strong></span>
                      <span>Total Due: <strong className="text-emerald-700">{formatCurrency(loan.liveTotalDue || loan.principal)}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT 7 COLS (~58%): GOLD DISCHARGE & HANDOVER DESK (Only rendered when selectedLoan && calculation) */}
        {selectedLoan && calculation && (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-0 h-full">
            <form onSubmit={handleProcessRedemption} className="flex flex-col min-h-0 h-full">
              {/* Header */}
              <div className="p-3 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono font-black text-xs sm:text-sm text-white flex items-center gap-2">
                      <span>{selectedLoan.ticketNumber}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#84cc16]/20 text-[#84cc16] border border-[#84cc16]/30">
                        Full Settlement Desk
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Borrower: <strong className="text-white">{selectedLoan.customerName}</strong> (📞 {selectedLoan.customerMobile})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Vault Location</span>
                    <strong className="text-xs font-mono text-[#84cc16] block">Box #{selectedLoan.boxNo || selectedLoan.compartmentNo || 1}</strong>
                    <span className="text-[9px] text-slate-400">{selectedLoan.vaultId || 'Main Safe A'}</span>
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
                      title="Close Redemption Desk"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sticky Quick Anchor Tabs */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0">
                {[
                  { id: 'red-sec-collateral', label: '1. Collateral & Safe' },
                  { id: 'red-sec-breakdown', label: '2. Dues Breakdown' },
                  { id: 'red-sec-verify', label: '3. Handover Handshake' },
                  { id: 'red-sec-discharge', label: '4. Final Discharge' }
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

              <div className="p-3.5 space-y-3 flex-1 min-h-0 overflow-y-auto">
                {/* SECTION 1: Collateral Pledged Ornaments to Return */}
                <div id="red-sec-collateral" className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Collateral Ornaments to Release ({selectedLoan.items?.length || 0})</span>
                    </span>
                    <span className="font-extrabold text-amber-800">{formatWeight(selectedLoan.totalNetWt)} Total Net Gold</span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {(selectedLoan.items || []).map((it, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-900">{it.quantity || 1}x {it.ornamentType}</strong>
                          <span className="text-[10px] text-slate-500 ml-2 font-mono">{it.purity}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">{formatWeight(it.netWeight)}</span>
                          <span className="text-[10px] text-slate-400 block">Gross: {formatWeight(it.grossWeight)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 2: Dues Breakdown Grid */}
                <div id="red-sec-breakdown" className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">Principal Outstanding:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(calculation.principal)}</span>
                  </div>

                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">Accrued Interest ({calculation.elapsedMonths} Months @ {selectedLoan.interestPctPerMonth}%/mo):</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(calculation.baseInterest)}</span>
                  </div>

                  {calculation.penaltyInterest > 0 && (
                    <div className="flex justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                      <span className="font-medium">Overdue Penalty ({calculation.overdueDays} Days):</span>
                      <span className="font-bold">{formatCurrency(calculation.penaltyInterest)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">Manager Discount / Interest Waiver (₹):</span>
                    <input
                      type="number"
                      value={waiverAmount}
                      onChange={(e) => setWaiverAmount(e.target.value)}
                      className="w-28 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-right text-xs font-bold text-amber-700 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                    />
                  </div>
                </div>

                {/* SECTION 3: Handover Physical Inspection Confirmation Checkbox */}
                <div id="red-sec-verify">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={ornamentsVerified}
                      onChange={(e) => setOrnamentsVerified(e.target.checked)}
                      className="mt-0.5 rounded text-[#84cc16] focus:ring-[#84cc16] w-4 h-4"
                    />
                    <span className="text-amber-950 leading-snug">
                      I confirm physical retrieval of <strong>{formatWeight(selectedLoan.totalNetWt)}</strong> gold ornaments from Vault <strong>[Box #{selectedLoan.boxNo || selectedLoan.compartmentNo || 1}]</strong>, weight verification, and lawful return to borrower <strong>{selectedLoan.customerName}</strong>.
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION 4: Settlement Footer Banner */}
              <div id="red-sec-discharge" className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Final Settlement:</span>
                  <div className="text-2xl font-black text-[#0f172a]">{formatCurrency(finalSettlementAmount)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                  >
                    <option value="CASH">Cash Counter</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#84cc16]" />
                    <span>{submitting ? 'Discharging...' : 'Confirm Settlement & Release Gold'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* PRINT RECEIPT MODAL */}
      <PrintVoucherModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        htmlContent={printHtml}
        title="Discharge & Redemption Voucher"
      />
    </div>
  );
}

