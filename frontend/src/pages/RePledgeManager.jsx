import React, { useState, useEffect, useRef } from 'react';
import {
  Landmark,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  Building,
  RefreshCw,
  Clock,
  Calendar,
  Coins,
  ArrowLeft,
  X,
  FileText,
  DollarSign,
  Layers,
  ChevronRight,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export default function RePledgeManager() {
  const { toast } = useToast();
  const [repledges, setRepledges] = useState([]);
  const [activePledges, setActivePledges] = useState([]);
  const [selectedLoans, setSelectedLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 1-to-2 Column Selection State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Form State for New Re-Pledge
  const [bankName, setBankName] = useState('State Bank of India (SBI)');
  const [bankBranch, setBankBranch] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankPledgeReferenceNo, setBankPledgeReferenceNo] = useState('');
  const [refinancePrincipal, setRefinancePrincipal] = useState('');
  const [bankInterestRatePa, setBankInterestRatePa] = useState('8.5');
  const [maturityMonths, setMaturityMonths] = useState(12);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loanSearch, setLoanSearch] = useState('');

  // Redemption Form State
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [bankReceiptNo, setBankReceiptNo] = useState('');

  const detailScrollRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, lRes] = await Promise.all([
        api.get('/repledge'),
        api.get('/loans?status=Active')
      ]);
      if (rRes.data?.records) setRepledges(rRes.data.records);
      if (lRes.data?.loans) setActivePledges(lRes.data.loans);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load bank re-pledge ledger records.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLoanSelection = (loanId) => {
    if (selectedLoans.includes(loanId)) {
      setSelectedLoans(selectedLoans.filter(id => id !== loanId));
    } else {
      setSelectedLoans([...selectedLoans, loanId]);
    }
  };

  const selectedLoansData = activePledges.filter(l => selectedLoans.includes(l._id));
  const totalSelectedGrossWt = selectedLoansData.reduce((sum, l) => sum + (l.totalGrossWt || 0), 0);
  const totalSelectedNetWt = selectedLoansData.reduce((sum, l) => sum + (l.totalNetWt || 0), 0);
  const totalSelectedValuation = selectedLoansData.reduce((sum, l) => sum + (l.marketValuationTotal || 0), 0);

  const handleCreateRePledge = async (e) => {
    e.preventDefault();
    if (selectedLoans.length === 0) {
      toast.warning('Please select at least one customer gold loan to deposit with bank.');
      return;
    }
    if (!refinancePrincipal || Number(refinancePrincipal) <= 0) {
      toast.warning('Please enter a valid refinance principal amount.');
      return;
    }

    setSubmitting(true);
    try {
      const d = new Date();
      d.setMonth(d.getMonth() + Number(maturityMonths));

      const payload = {
        bankName,
        bankBranch,
        bankAccountNumber,
        bankPledgeReferenceNo,
        maturityDate: d.toISOString(),
        refinancePrincipal: Number(refinancePrincipal),
        bankInterestRatePa: Number(bankInterestRatePa),
        loanIds: selectedLoans,
        remarks
      };

      const res = await api.post('/repledge', payload);
      if (res.data?.success) {
        toast.success('Bank Re-Pledge packet recorded successfully!');
        setIsCreatingNew(false);
        setSelectedLoans([]);
        setBankPledgeReferenceNo('');
        setRefinancePrincipal('');
        setRemarks('');
        await loadData();
      }
    } catch (err) {
      toast.error('Failed to create re-pledge: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeemFromBank = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      const res = await api.post(`/repledge/${selectedRecord._id}/redeem`, {
        totalPaidToBank: Number(redeemAmount) || selectedRecord.refinancePrincipal,
        bankReleaseReceiptNo: bankReceiptNo
      });
      if (res.data?.success) {
        toast.success('Gold packet redeemed from bank custody successfully!');
        setRedeemModalOpen(false);
        setBankReceiptNo('');
        setRedeemAmount('');
        setSelectedRecord(null);
        await loadData();
      }
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const scrollToSection = (sectionId, tabName) => {
    setActiveTab(tabName);
    const elem = document.getElementById(sectionId);
    if (elem && detailScrollRef.current) {
      const parentTop = detailScrollRef.current.getBoundingClientRect().top;
      const elemTop = elem.getBoundingClientRect().top;
      detailScrollRef.current.scrollTop += (elemTop - parentTop - 10);
    }
  };

  const filteredRepledges = repledges.filter(r => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.rePledgeNo?.toLowerCase().includes(term) ||
      r.bankName?.toLowerCase().includes(term) ||
      r.bankPledgeReferenceNo?.toLowerCase().includes(term) ||
      r.bankBranch?.toLowerCase().includes(term)
    );
  });

  const activeCustodyCount = repledges.filter(r => r.status === 'Active_With_Bank').length;
  const totalRefinanceLiquidity = repledges.filter(r => r.status === 'Active_With_Bank').reduce((s, r) => s + (r.refinancePrincipal || 0), 0);
  const totalGoldInBank = repledges.filter(r => r.status === 'Active_With_Bank').reduce((s, r) => s + (r.totalNetWt || 0), 0);

  const isPanelOpen = selectedRecord !== null || isCreatingNew;

  return (
    <div className="h-full max-h-full flex flex-col gap-2.5 overflow-hidden select-none">
      {/* 1. TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-[#84cc16] shadow-xs">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Bank Re-Pledging &amp; Refinance Ledger
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                {repledges.length} Total
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Commercial bank gold deposits &amp; liquidity refinance management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Bank / Ref / Ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 w-44 sm:w-56 shadow-2xs font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setSelectedRecord(null);
              setIsCreatingNew(true);
            }}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#84cc16]" />
            <span>+ New Bank Re-Pledge</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRICS CHIPS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Active Packets</span>
            <strong className="text-sm sm:text-base font-black text-slate-900">{activeCustodyCount} Packets</strong>
          </div>
          <Building className="w-4 h-4 text-slate-400" />
        </div>

        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Refinance Capital</span>
            <strong className="text-sm sm:text-base font-black text-emerald-700 font-mono">{formatCurrency(totalRefinanceLiquidity)}</strong>
          </div>
          <DollarSign className="w-4 h-4 text-emerald-600" />
        </div>

        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Gold in Bank Safe</span>
            <strong className="text-sm sm:text-base font-black text-lime-600 font-mono">{formatWeight(totalGoldInBank)}</strong>
          </div>
          <Coins className="w-4 h-4 text-lime-500" />
        </div>

        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Redeemed Closed</span>
            <strong className="text-sm sm:text-base font-black text-slate-700">
              {repledges.filter(r => r.status === 'Redeemed_Closed').length} Packets
            </strong>
          </div>
          <ShieldCheck className="w-4 h-4 text-blue-600" />
        </div>
      </div>

      {/* 3. 1-TO-2 COLUMN PROGRESSIVE LAYOUT */}
      <div className="flex-1 min-h-0 flex flex-row gap-2.5 overflow-hidden">
        {/* LEFT COLUMN: TABLE (Takes w-full when closed, w-5/12 when open) */}
        <div className={`h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200 ${
          isPanelOpen ? 'w-full md:w-5/12 shrink-0' : 'w-full'
        }`}>
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <span className="font-black text-[10px] uppercase tracking-wider text-slate-600">
              Bank Re-Pledge Records ({filteredRepledges.length})
            </span>
            <button
              onClick={loadData}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 uppercase text-[9px] text-slate-600 font-black tracking-wider shadow-2xs">
                <tr>
                  <th className="p-2.5">Ref #</th>
                  <th className="p-2.5">Bank &amp; Ref</th>
                  <th className="p-2.5">Principal</th>
                  {!isPanelOpen && <th className="p-2.5">Int %</th>}
                  <th className="p-2.5">Gold Wt</th>
                  {!isPanelOpen && <th className="p-2.5">Maturity</th>}
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRepledges.map(r => {
                  const isSelected = selectedRecord?._id === r._id;
                  const isActiveBank = r.status === 'Active_With_Bank';
                  return (
                    <tr
                      key={r._id}
                      onClick={() => {
                        setIsCreatingNew(false);
                        setSelectedRecord(r);
                      }}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-lime-50/80 border-l-4 border-l-lime-600'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="p-2.5 font-mono font-bold text-slate-900 text-[11px]">
                        {r.rePledgeNo}
                      </td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-800 text-[11px] line-clamp-1">{r.bankName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{r.bankPledgeReferenceNo}</div>
                      </td>
                      <td className="p-2.5 font-black text-emerald-800 font-mono text-[11px]">
                        {formatCurrency(r.refinancePrincipal)}
                      </td>
                      {!isPanelOpen && (
                        <td className="p-2.5 font-bold text-slate-700 text-[11px]">
                          {r.bankInterestRatePa}%
                        </td>
                      )}
                      <td className="p-2.5 font-bold text-slate-900 text-[11px] font-mono">
                        {formatWeight(r.totalNetWt)}
                      </td>
                      {!isPanelOpen && (
                        <td className="p-2.5 text-slate-600 text-[11px]">
                          {formatDate(r.maturityDate)}
                        </td>
                      )}
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black inline-block ${
                          isActiveBank
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isActiveBank ? 'In Bank Safe' : 'Redeemed'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {isActiveBank ? (
                          <button
                            onClick={() => {
                              setSelectedRecord(r);
                              setRedeemAmount(String(r.refinancePrincipal));
                              setRedeemModalOpen(true);
                            }}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                          >
                            Redeem
                          </button>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRepledges.length === 0 && (
                  <tr>
                    <td colSpan={isPanelOpen ? 6 : 8} className="p-8 text-center text-slate-400 text-xs font-medium">
                      No matching bank re-pledge records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: DRILLDOWN DRAWER OR NEW FORM (Takes w-7/12 when open) */}
        {isPanelOpen && (
          <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-2 duration-150">
            {/* 1. Header with Back & Close */}
            <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedRecord(null);
                    setIsCreatingNew(false);
                  }}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] font-bold"
                  title="Back to full table"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                <h3 className="font-bold text-xs flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-[#84cc16]" />
                  <span>
                    {isCreatingNew
                      ? 'Create Bank Re-Pledge & Refinance Packet'
                      : `Re-Pledge #${selectedRecord?.rePledgeNo}`}
                  </span>
                </h3>
              </div>

              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setIsCreatingNew(false);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If Selected Record: Sticky Navigation Tabs */}
            {selectedRecord && (
              <div className="px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 flex items-center gap-1.5 shrink-0 overflow-x-auto">
                <button
                  onClick={() => scrollToSection('sec-overview', 'overview')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black transition ${
                    activeTab === 'overview'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  Overview &amp; Bank
                </button>
                <button
                  onClick={() => scrollToSection('sec-loans', 'loans')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black transition ${
                    activeTab === 'loans'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  Collateral Loans ({selectedRecord.loanIds?.length || 0})
                </button>
                <button
                  onClick={() => scrollToSection('sec-settlement', 'settlement')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black transition ${
                    activeTab === 'settlement'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  Settlement &amp; Custody
                </button>
              </div>
            )}

            {/* Scrollable Body */}
            <div ref={detailScrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {isCreatingNew ? (
                /* NEW BANK REPLEDGE FORM */
                <form onSubmit={handleCreateRePledge} className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700 mb-2">
                      1. Commercial Bank Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Bank Name *</label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-slate-900"
                        >
                          <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                          <option value="Canara Bank">Canara Bank</option>
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="Axis Bank">Axis Bank</option>
                          <option value="Muthoot Finance">Muthoot Finance</option>
                          <option value="Manappuram Finance">Manappuram Finance</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Branch Name</label>
                        <input
                          type="text"
                          placeholder="e.g. MG Road Branch"
                          value={bankBranch}
                          onChange={(e) => setBankBranch(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Bank Pledge Ref / Loan No *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. SBI-GL-2026-889"
                          value={bankPledgeReferenceNo}
                          onChange={(e) => setBankPledgeReferenceNo(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Refinance Principal Raised (₹) *</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 250000"
                          value={refinancePrincipal}
                          onChange={(e) => setRefinancePrincipal(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-emerald-800 font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Bank Int Rate (% p.a.)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={bankInterestRatePa}
                          onChange={(e) => setBankInterestRatePa(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tenure (Months)</label>
                        <input
                          type="number"
                          value={maturityMonths}
                          onChange={(e) => setMaturityMonths(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Pledges Selection */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700">
                        2. Select Customer Pledges to Deposit
                      </h4>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {selectedLoans.length} Loans Selected
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search active loans..."
                        value={loanSearch}
                        onChange={(e) => setLoanSearch(e.target.value)}
                        className="w-full pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                      {activePledges
                        .filter(l => {
                          if (!loanSearch.trim()) return true;
                          const t = loanSearch.toLowerCase();
                          return l.ticketNumber?.toLowerCase().includes(t) || l.customerName?.toLowerCase().includes(t);
                        })
                        .map(l => {
                          const isSelected = selectedLoans.includes(l._id);
                          return (
                            <div
                              key={l._id}
                              onClick={() => toggleLoanSelection(l._id)}
                              className={`p-2 flex items-center justify-between cursor-pointer transition text-xs ${
                                isSelected ? 'bg-lime-50 font-bold' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-lime-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300" />
                                )}
                                <div>
                                  <span className="font-mono text-slate-900 font-bold">{l.ticketNumber}</span>
                                  <span className="text-slate-600 ml-2">{l.customerName}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-900 font-mono">{formatWeight(l.totalNetWt)}</span>
                                <span className="text-slate-500 ml-2 font-mono">{formatCurrency(l.principalOutstanding)}</span>
                              </div>
                            </div>
                          );
                        })}
                      {activePledges.length === 0 && (
                        <div className="p-4 text-center text-slate-400 text-xs">No active customer pledges available.</div>
                      )}
                    </div>

                    {selectedLoans.length > 0 && (
                      <div className="p-2.5 bg-slate-900 text-white rounded-xl grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Net Gold Wt</span>
                          <strong className="text-lime-400 font-black font-mono">{formatWeight(totalSelectedNetWt)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Customer Valuation</span>
                          <strong className="text-white font-black font-mono">{formatCurrency(totalSelectedValuation)}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="px-3.5 py-1.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                    >
                      {submitting ? 'Creating...' : 'Submit Bank Re-Pledge'}
                    </button>
                  </div>
                </form>
              ) : (
                /* SELECTED REPLEDGE INSPECTION VIEW */
                <div className="space-y-4 text-xs">
                  {/* Section 1: Overview */}
                  <div id="sec-overview" className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>Commercial Bank Terms</span>
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        selectedRecord.status === 'Active_With_Bank'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {selectedRecord.status === 'Active_With_Bank' ? 'Active in Bank Custody' : 'Redeemed & Restored'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Bank Name</span>
                        <strong className="text-slate-900 font-bold">{selectedRecord.bankName}</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Bank Reference #</span>
                        <strong className="text-slate-900 font-mono font-bold">{selectedRecord.bankPledgeReferenceNo}</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Refinance Principal</span>
                        <strong className="text-emerald-700 font-mono font-black">{formatCurrency(selectedRecord.refinancePrincipal)}</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Bank Int Rate</span>
                        <strong className="text-slate-900 font-bold">{selectedRecord.bankInterestRatePa}% p.a.</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Pledge Date</span>
                        <span className="text-slate-800 font-medium">{formatDate(selectedRecord.pledgeDate || selectedRecord.createdAt)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Maturity Date</span>
                        <span className="text-slate-800 font-medium">{formatDate(selectedRecord.maturityDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Collateral Gold Loans */}
                  <div id="sec-loans" className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-lime-600" />
                        <span>Pledged Customer Loans ({selectedRecord.loanIds?.length || 0})</span>
                      </h4>
                      <div className="text-[10px] font-mono text-slate-600 font-bold">
                        Net Gold: {formatWeight(selectedRecord.totalNetWt)}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                      {selectedRecord.loanIds && selectedRecord.loanIds.length > 0 ? (
                        selectedRecord.loanIds.map((loan, idx) => (
                          <div key={loan._id || idx} className="p-2.5 flex items-center justify-between">
                            <div>
                              <span className="font-mono font-bold text-slate-900">{loan.ticketNumber || loan}</span>
                              {loan.customerName && (
                                <span className="text-slate-600 ml-2 font-medium">({loan.customerName})</span>
                              )}
                            </div>
                            <div className="text-right font-mono text-xs">
                              {loan.totalNetWt && <span className="text-slate-900 font-bold">{formatWeight(loan.totalNetWt)}</span>}
                              {loan.principalOutstanding && (
                                <span className="text-slate-500 ml-2 font-medium">{formatCurrency(loan.principalOutstanding)}</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-slate-400 text-xs">Loan packets mapped to this re-pledge.</div>
                      )}
                    </div>
                  </div>

                  {/* Section 3: Settlement & Handover */}
                  <div id="sec-settlement" className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bank Redemption &amp; Vault Custody</span>
                    </h4>

                    {selectedRecord.status === 'Active_With_Bank' ? (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between gap-3">
                        <div>
                          <span className="font-bold text-amber-900 block text-xs">Under Bank Custody Lien</span>
                          <span className="text-[10px] text-amber-700">
                            Gold packets are securely deposited in {selectedRecord.bankName} vault.
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setRedeemAmount(String(selectedRecord.refinancePrincipal));
                            setRedeemModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 shadow-2xs"
                        >
                          Redeem from Bank
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Redeemed &amp; Handover Completed</span>
                        </div>
                        <p className="text-emerald-800 text-[11px]">
                          Amount paid: {formatCurrency(selectedRecord.totalPaidToBank || selectedRecord.refinancePrincipal)} | Receipt: {selectedRecord.bankReleaseReceiptNo || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* REDEEM FROM BANK MODAL */}
      {redeemModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-[#84cc16]" />
                <span>Redeem Gold from Bank Custody</span>
              </span>
              <button onClick={() => setRedeemModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleRedeemFromBank} className="p-4 space-y-3 text-xs">
              <p className="text-slate-600 text-[11px]">
                Record full repayment to <strong className="text-slate-900">{selectedRecord.bankName}</strong> and restore collateral packets to Showroom Vault Safe.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Paid to Bank (₹)</label>
                <input
                  type="number"
                  required
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Release Receipt / Ack No</label>
                <input
                  type="text"
                  placeholder="e.g. SBI-REL-8902"
                  value={bankReceiptNo}
                  onChange={(e) => setBankReceiptNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRedeemModalOpen(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                >
                  Confirm Vault Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
