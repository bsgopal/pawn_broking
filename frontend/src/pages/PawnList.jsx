import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Printer,
  Receipt,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  PlusCircle,
  FileText,
  Calendar,
  Sparkles,
  ChevronRight,
  User,
  Phone,
  MessageSquare,
  Lock,
  Coins,
  ShieldCheck,
  Layers,
  ArrowLeft,
  X,
  ZoomIn,
  MapPin,
  Maximize2,
  Minimize2
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatWeight, formatDate, formatDateTime } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import PrintVoucherModal from '../components/PrintVoucherModal';

const STATUS_TABS = [
  { id: 'ALL', label: 'All Loans' },
  { id: 'Active', label: 'Active Loans' },
  { id: 'OVERDUE', label: 'Overdue' },
  { id: 'Redeemed', label: 'Redeemed & Closed' },
  { id: 'Auction_Pending', label: 'Auction Prep' }
];

export default function PawnList() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Selected Loan State
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Progressive Drilldown State: Level 2 (Full deep inspector)
  const [isDeepDrilldown, setIsDeepDrilldown] = useState(false);
  const [deepLoanData, setDeepLoanData] = useState(null);
  const [deepCustomer, setDeepCustomer] = useState(null);
  const [deepRepayments, setDeepRepayments] = useState([]);
  const [deepLoading, setDeepLoading] = useState(false);
  const [activeDeepTab, setActiveDeepTab] = useState('overview'); // 'overview' | 'collateral' | 'kyc' | 'ledger'

  // Fullscreen / Table-Only View Toggle
  const [tableOnlyMode, setTableOnlyMode] = useState(false);

  // Image Lightbox
  const [zoomImage, setZoomImage] = useState(null);

  // Print Slip Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState('');

  useEffect(() => {
    fetchLoans();
  }, [statusFilter, searchQuery]);

  // When selectedLoan changes and we are in deep drilldown mode, fetch deep details
  useEffect(() => {
    if (selectedLoan && isDeepDrilldown) {
      fetchDeepLoanDetails(selectedLoan._id);
    }
  }, [selectedLoan, isDeepDrilldown]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/loans?${params.toString()}`);
      if (res.data?.success) {
        const list = res.data.loans || [];
        setLoans(list);
        if (selectedLoan) {
          const updated = list.find(l => l._id === selectedLoan._id);
          setSelectedLoan(updated || null);
        }
      }
    } catch (err) {
      console.error('Error fetching loans:', err);
      toast.error('Failed to load loans registry: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchDeepLoanDetails = async (loanId) => {
    setDeepLoading(true);
    try {
      const res = await api.get(`/loans/${loanId}`);
      if (res.data?.success) {
        setDeepLoanData(res.data.loan);
        setDeepCustomer(res.data.customer);
        setDeepRepayments(res.data.repayments || []);
      }
    } catch (err) {
      console.error('Error fetching deep loan details:', err);
      toast.error('Could not load detailed loan data: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeepLoading(false);
    }
  };

  const handlePrint = async (e, loanId) => {
    if (e) e.stopPropagation();
    try {
      const targetId = loanId || selectedLoan?._id;
      if (!targetId) return;
      const res = await api.get(`/loans/${targetId}/receipt-html`);
      if (res.data?.success) {
        setPrintHtml(res.data.html);
        setPrintModalOpen(true);
      }
    } catch (e) {
      toast.error('Error printing ticket: ' + e.message);
    }
  };

  const handleSendWhatsApp = (targetLoan, targetCust) => {
    const l = targetLoan || deepLoanData || selectedLoan;
    const c = targetCust || deepCustomer;
    if (!l) return;
    const phone = (c?.mobile || l.customerMobile || '').replace(/\D/g, '');
    if (!phone) {
      toast.warning('No customer phone number available');
      return;
    }
    const targetPhone = phone.length === 10 ? `91${phone}` : phone;
    const currentPrincipal = l.principalOutstanding || l.principal || 0;
    const liveInterest = l.liveCalculation?.totalInterest !== undefined ? l.liveCalculation.totalInterest : (l.liveInterestDue || 0);
    const liveTotalPayable = l.liveCalculation?.totalPayable !== undefined ? l.liveCalculation.totalPayable : (l.liveTotalDue || currentPrincipal);

    const msg = `*PAWN LOAN STATEMENT*
Ticket #: *${l.ticketNumber}*
Customer: *${l.customerName}*
Vault Location: *${l.vaultId || 'Main Safe A'} (Box #${l.compartmentNo || l.boxNo || 1})*
Principal Outstanding: *${formatCurrency(currentPrincipal)}*
Accrued Interest: *${formatCurrency(liveInterest)}*
Total Settle Amount: *${formatCurrency(liveTotalPayable)}*
Maturity Date: *${formatDate(l.maturityDate)}*
Status: *${l.status}*

Thank you for choosing our pawn broking service!`;

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleOpenDeepDrilldown = (loan) => {
    setSelectedLoan(loan);
    setIsDeepDrilldown(true);
    fetchDeepLoanDetails(loan._id);
  };

  // KPI Calculations
  const totalPrincipalOut = loans.reduce((sum, l) => sum + (l.principalOutstanding || l.principal || 0), 0);
  const totalAccruedInt = loans.reduce((sum, l) => sum + (l.liveInterestDue || 0), 0);
  const totalNetGold = loans.reduce((sum, l) => sum + (l.totalNetWt || 0), 0);

  return (
    <div className="h-full max-h-full flex flex-col gap-2 min-h-0 overflow-hidden w-full">
      {/* 1. TOP HEADER & PORTFOLIO METRICS */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#84cc16]" />
              <span>Pawn Loan Registry &amp; Ledger Desk</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time portfolio registry, accrued interest ledger, collateral custody, and progressive master-detail inspector.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTableOnlyMode(!tableOnlyMode)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              title={tableOnlyMode ? 'Switch to Master-Detail Split View' : 'Switch to Full Table View'}
            >
              {tableOnlyMode ? <Minimize2 className="w-3.5 h-3.5 text-[#65a30d]" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-600" />}
              <span>{tableOnlyMode ? 'Split Panel Mode' : 'Wide Table Mode'}</span>
            </button>

            <Link
              to="/new-pawn"
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <PlusCircle className="w-4 h-4 text-[#84cc16]" />
              <span>New Pawn Entry</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active Pledges</div>
            <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
              {loans.length} <span className="text-[10px] font-normal text-slate-500">Loans</span>
            </div>
            <div className="text-[9px] text-slate-400">Under Active Safe Custody</div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Principal Outstanding</div>
            <div className="text-sm sm:text-base font-black text-[#0f172a] mt-0.5">
              {formatCurrency(totalPrincipalOut)}
            </div>
            <div className="text-[9px] text-slate-400">Active Loan Book</div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Accrued Interest</div>
            <div className="text-sm sm:text-base font-black text-emerald-600 mt-0.5">
              {formatCurrency(totalAccruedInt)}
            </div>
            <div className="text-[9px] text-emerald-700 font-bold">Daily Live Computed</div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vault Gold Collateral</div>
            <div className="text-sm sm:text-base font-black text-amber-700 mt-0.5">
              {formatWeight(totalNetGold)}
            </div>
            <div className="text-[9px] text-slate-400">Net Pledged Weight</div>
          </div>
        </div>
      </div>

      {/* 2. PROGRESSIVE MASTER-DETAIL LAYOUT */}
      {!isDeepDrilldown ? (
        /* =========================================================================
           LEVEL 1: MASTER LOANS TABLE (60%) + SELECTED LOAN QUICK CARD (40%)
           ========================================================================= */
        <div className={`flex-1 min-h-0 ${selectedLoan && !tableOnlyMode ? 'grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch overflow-hidden' : 'w-full flex flex-col min-h-0 overflow-hidden'}`}>
          {/* LEFT PANEL: LOAN REGISTRY TABLE */}
          <div className={`${selectedLoan && !tableOnlyMode ? 'lg:col-span-7' : 'w-full'} bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-0 h-full`}>
            {/* Search & Status Tabs */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {STATUS_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      statusFilter === tab.id
                        ? 'bg-[#0f172a] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[160px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ticket #, customer, mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Ticket &amp; Date</th>
                    <th className="py-2.5 px-3">Borrower</th>
                    <th className="py-2.5 px-3">Gold Wt</th>
                    <th className="py-2.5 px-3 text-right">Principal</th>
                    <th className="py-2.5 px-3 text-right">Live Due</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-2 text-right">Quick</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex justify-center items-center gap-2 font-medium">
                          <div className="w-5 h-5 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
                          <span>Loading loans registry...</span>
                        </div>
                      </td>
                    </tr>
                  ) : loans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No loan records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    loans.map(loan => {
                      const isSelected = selectedLoan?._id === loan._id;
                      return (
                        <tr
                          key={loan._id}
                          onClick={() => setSelectedLoan(isSelected ? null : loan)}
                          className={`cursor-pointer transition border-l-4 ${
                            isSelected
                              ? 'bg-lime-50/80 border-l-[#84cc16] font-semibold'
                              : 'hover:bg-slate-50/80 border-l-transparent'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-extrabold text-[#0f172a] flex items-center gap-1">
                              <span>{loan.ticketNumber}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {formatDate(loan.loanDate)}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-extrabold text-slate-900">{loan.customerName}</div>
                            <div className="text-[10px] text-slate-400">📞 {loan.customerMobile}</div>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-bold text-amber-800">{formatWeight(loan.totalNetWt)}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {(loan.items || []).map(i => i.ornamentType).join(', ')}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="font-extrabold text-slate-900">
                              {formatCurrency(loan.principalOutstanding || loan.principal)}
                            </div>
                            <div className="text-[10px] text-slate-400">@{loan.interestPctPerMonth}%/mo</div>
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="font-black text-[#0f172a]">
                              {formatCurrency(loan.liveTotalDue || loan.principal)}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-bold">
                              +{formatCurrency(loan.liveInterestDue || 0)}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              loan.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              loan.status === 'Redeemed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              loan.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {loan.status}
                            </span>
                          </td>

                          <td className="py-2.5 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenDeepDrilldown(loan)}
                                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                title="Open Deep Inspector"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#65a30d]" />
                              </button>
                              <button
                                onClick={(e) => handlePrint(e, loan._id)}
                                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                title="Print Slip"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Showing {loans.length} loan records</span>
              <span>{selectedLoan ? 'Click selected row or Back/Close to return to full table' : 'Click any loan row to open details panel'}</span>
            </div>
          </div>

          {/* RIGHT PANEL (40%): SELECTED LOAN QUICK INSPECTOR (OPENS ON ROW CLICK) */}
          {selectedLoan && !tableOnlyMode && (
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-0 h-full animate-in fade-in duration-150">
              {/* Header with Back and Close buttons */}
              <div className="p-3 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLoan(null)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Close Details Panel"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#84cc16]" />
                    <span className="hidden sm:inline text-[11px]">Back</span>
                  </button>
                  <div className="w-7 h-7 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16]">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-mono font-black text-xs sm:text-sm text-white">{selectedLoan.ticketNumber}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span>Pledged: {formatDate(selectedLoan.loanDate)}</span>
                      <span>•</span>
                      <span>Due: {formatDate(selectedLoan.maturityDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    selectedLoan.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    selectedLoan.status === 'Redeemed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {selectedLoan.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedLoan(null)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                    title="Close Panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sticky Quick Anchor Tabs */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0">
                {[
                  { id: 'pawn-sec-borrower', label: '1. Borrower' },
                  { id: 'pawn-sec-balances', label: '2. Balances' },
                  { id: 'pawn-sec-collateral', label: '3. Collateral & Vault' },
                  { id: 'pawn-sec-actions', label: '4. Actions' }
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

              {/* Scrollable Middle Content */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 p-1 space-y-2">
                {/* Section 1: Borrower Card */}
                <div id="pawn-sec-borrower" className="p-3 flex items-center justify-between bg-slate-50/50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    {selectedLoan.customerPhotoUrl ? (
                      <img
                        src={selectedLoan.customerPhotoUrl}
                        alt="Customer"
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">
                        {(selectedLoan.customerName || 'U').charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm text-slate-900">{selectedLoan.customerName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{selectedLoan.customerMobile}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${selectedLoan.customerMobile}`}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                      title="Call"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    </a>
                    <button
                      onClick={() => handleSendWhatsApp(selectedLoan)}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  </div>
                </div>

                {/* Section 2: Financial Grid */}
                <div id="pawn-sec-balances" className="p-2.5 bg-slate-50 rounded-xl grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Principal Out</div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                      {formatCurrency(selectedLoan.principalOutstanding || selectedLoan.principal)}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Accrued Interest</div>
                    <div className="text-xs sm:text-sm font-black text-emerald-600 mt-0.5">
                      {formatCurrency(selectedLoan.liveInterestDue || 0)}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Total Settle Due</div>
                    <div className="text-xs sm:text-sm font-black text-[#0f172a] mt-0.5">
                      {formatCurrency(selectedLoan.liveTotalDue || selectedLoan.principal)}
                    </div>
                  </div>
                </div>

                {/* Section 3: Collateral & Custody Details */}
                <div id="pawn-sec-collateral" className="p-3 space-y-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-[#84cc16]" />
                        <span>Vault Custody</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-600">Box #{selectedLoan.boxNo || selectedLoan.compartmentNo || 1} ({selectedLoan.vaultId || 'Main Safe A'})</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-slate-700 flex items-center justify-between text-[11px]">
                      <span>Pledged Ornaments ({selectedLoan.items?.length || 0}):</span>
                      <span className="text-amber-800 font-extrabold">{formatWeight(selectedLoan.totalNetWt)} Net Gold</span>
                    </div>
                    <div className="space-y-1 border border-slate-200 rounded-xl p-2 bg-white">
                      {(selectedLoan.items || []).map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1 bg-slate-50 rounded-lg text-[11px]">
                          <span className="font-semibold text-slate-800">{it.quantity || 1}x {it.ornamentType} ({it.purity || '22K'})</span>
                          <span className="font-bold text-amber-900">{formatWeight(it.netWeight)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Borrower Digital Signature if on record */}
                  {selectedLoan.digitalSignatureUrl && (
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-[#65a30d]" />
                        <span>Borrower Signature:</span>
                      </span>
                      <img
                        src={selectedLoan.digitalSignatureUrl}
                        alt="Signature"
                        className="h-6 max-w-[120px] object-contain bg-white px-2 py-0.5 rounded border border-slate-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Primary Actions & Deep Drilldown Trigger */}
              <div id="pawn-sec-actions" className="p-2.5 bg-white border-t border-slate-200 space-y-1.5 shrink-0">
                <button
                  onClick={() => handleOpenDeepDrilldown(selectedLoan)}
                  className="w-full py-1.5 bg-lime-50 hover:bg-lime-100 text-[#0f172a] border border-lime-300 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#65a30d]" />
                  <span>Open Deep Customer &amp; Collateral Drilldown →</span>
                </button>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handlePrint(e, selectedLoan._id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={() => handleSendWhatsApp(selectedLoan)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {selectedLoan.status !== 'Redeemed' && (
                      <>
                        <Link
                          to={`/repayments?loanId=${selectedLoan._id}`}
                          className="px-3 py-1 bg-[#84cc16] hover:bg-[#65a30d] text-[#0f172a] rounded-xl text-xs font-black shadow-xs transition"
                        >
                          Collect
                        </Link>
                        <Link
                          to={`/redemption?loanId=${selectedLoan._id}`}
                          className="px-3 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold shadow-xs transition"
                        >
                          Redeem
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
           LEVEL 2: DEEP DRILLDOWN INSPECTOR (LEFT 40% LOANS LIST + RIGHT 60% INSPECTOR)
           ========================================================================= */
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch overflow-hidden">
          {/* LEFT 5 COLS (~40%): SEARCHABLE ACTIVE LOANS LIST */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-0 h-full">
            <div className="p-3 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800">
              <button
                onClick={() => setIsDeepDrilldown(false)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#84cc16]" />
                <span>← Back to Overview Table</span>
              </button>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Pawn Loan Desk</span>
            </div>

            <div className="p-2.5 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter loans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden"
                />
              </div>
            </div>

            <div className="p-3 space-y-2 overflow-y-auto max-h-[580px]">
              {loans.map(loan => {
                const isActive = selectedLoan?._id === loan._id;
                return (
                  <div
                    key={loan._id}
                    onClick={() => {
                      setSelectedLoan(loan);
                      fetchDeepLoanDetails(loan._id);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                      isActive
                        ? 'bg-lime-50/90 border-lime-500 ring-2 ring-lime-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono font-bold text-xs text-slate-900">{loan.ticketNumber}</div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        loan.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {loan.status}
                      </span>
                    </div>

                    <div className="font-extrabold text-xs text-slate-900">{loan.customerName}</div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                      <span className="text-amber-800 font-bold">{formatWeight(loan.totalNetWt)}</span>
                      <span className="font-black text-[#0f172a]">{formatCurrency(loan.principalOutstanding || loan.principal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 7 COLS (~60%): FULL DEEP INSPECTOR */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            {deepLoading ? (
              <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-600">Loading full loan records &amp; collateral...</span>
              </div>
            ) : deepLoanData ? (
              <>
                {/* Inspector Header */}
                <div className="p-4 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black tracking-tight font-mono text-white">
                          {deepLoanData.ticketNumber}
                        </h2>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          deepLoanData.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          deepLoanData.status === 'Redeemed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {deepLoanData.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Pledged: {formatDate(deepLoanData.loanDate)}</span>
                        <span>•</span>
                        <span>Maturity: {formatDate(deepLoanData.maturityDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePrint(null, deepLoanData._id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                      title="Print Slip"
                    >
                      <Printer className="w-4 h-4 text-[#84cc16]" />
                    </button>
                    <button
                      onClick={() => setIsDeepDrilldown(false)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Close Panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs Bar */}
                <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex items-center gap-1 shrink-0 overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Loan & Financials', icon: Coins },
                    { id: 'collateral', label: `Collateral (${deepLoanData.items?.length || 0})`, icon: Sparkles },
                    { id: 'kyc', label: 'KYC & Signatures', icon: ShieldCheck },
                    { id: 'ledger', label: `Payment Ledger (${deepRepayments.length})`, icon: Layers }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeDeepTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveDeepTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
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

                {/* Tab Content */}
                <div className="p-4 space-y-4 max-h-[460px] overflow-y-auto bg-slate-50/50">
                  {/* TAB 1: OVERVIEW & BORROWER */}
                  {activeDeepTab === 'overview' && (
                    <div className="space-y-3.5">
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                            <User className="w-4 h-4 text-[#84cc16]" />
                            <span>Borrower Profile</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>KYC Verified</span>
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {deepLoanData.customerPhotoUrl || deepCustomer?.photoUrl ? (
                              <img
                                src={deepLoanData.customerPhotoUrl || deepCustomer?.photoUrl}
                                alt="Cust"
                                onClick={() => setZoomImage(deepLoanData.customerPhotoUrl || deepCustomer?.photoUrl)}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs cursor-pointer hover:opacity-90"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm">
                                {(deepLoanData.customerName || 'U').charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-extrabold text-sm text-slate-900">{deepLoanData.customerName}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{deepLoanData.customerMobile || deepCustomer?.mobile || 'No phone'}</span>
                              </div>
                              {deepCustomer?.address?.street && (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-300" />
                                  <span className="truncate max-w-[240px]">{deepCustomer.address.street}, {deepCustomer.address.city}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${deepLoanData.customerMobile || deepCustomer?.mobile}`}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>Call</span>
                            </a>
                            <button
                              onClick={() => handleSendWhatsApp(deepLoanData, deepCustomer)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Loan Math KPI Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Principal Out</div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">
                            {formatCurrency(deepLoanData.principalOutstanding || deepLoanData.principal)}
                          </div>
                          <div className="text-[10px] text-slate-400">Orig: {formatCurrency(deepLoanData.principal)}</div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Accrued Interest</div>
                          <div className="text-sm font-black text-emerald-600 mt-0.5">
                            {formatCurrency(deepLoanData.liveCalculation?.totalInterest || deepLoanData.liveInterestDue || 0)}
                          </div>
                          <div className="text-[10px] text-slate-400">@{deepLoanData.interestPctPerMonth}% / mo</div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Total Settle Due</div>
                          <div className="text-sm font-black text-[#0f172a] mt-0.5">
                            {formatCurrency(deepLoanData.liveCalculation?.totalPayable || deepLoanData.liveTotalDue || deepLoanData.principal)}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-bold">As of Today</div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Valuation LTV</div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">
                            {formatCurrency(deepLoanData.marketValuationTotal || 0)}
                          </div>
                          <div className="text-[10px] text-slate-400">LTV: {deepLoanData.eligibleLtvPct || 75}%</div>
                        </div>
                      </div>

                      {/* Vault Custody Info */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#84cc16]" />
                          <span>Vault Custody Location</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                          <div>Safe: <strong className="text-slate-900">{deepLoanData.vaultId || 'Main Safe A'}</strong></div>
                          <div>Box: <strong className="text-slate-900">Box #{deepLoanData.compartmentNo || deepLoanData.boxNo || 1}</strong></div>
                          <div>Packet Code: <strong className="font-mono text-slate-900">{deepLoanData.packetBarcode || deepLoanData.ticketNumber}</strong></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: COLLATERAL ORNAMENTS */}
                  {activeDeepTab === 'collateral' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-200 text-center text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Items</div>
                          <div className="font-black text-slate-900">{deepLoanData.items?.length || 0} Pieces</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Total Gross Wt</div>
                          <div className="font-black text-slate-900">{formatWeight(deepLoanData.totalGrossWt)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Total Net Wt</div>
                          <div className="font-black text-[#65a30d]">{formatWeight(deepLoanData.totalNetWt)}</div>
                        </div>
                      </div>

                      {(deepLoanData.items || []).map((item, idx) => (
                        <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-slate-900 text-[#84cc16] font-mono font-bold text-[10px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span>{item.ornamentType}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                {item.purity || '22K'} ({item.metal || 'Gold'})
                              </span>
                            </div>
                            <span className="font-bold text-slate-700">Qty: {item.quantity || 1}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[11px]">
                            <div>Gross: <strong className="text-slate-800">{formatWeight(item.grossWeight)}</strong></div>
                            <div>Net: <strong className="text-[#65a30d]">{formatWeight(item.netWeight)}</strong></div>
                            <div>Valuation: <strong className="text-slate-900">{formatCurrency(item.valuationAmount || 0)}</strong></div>
                          </div>

                          {item.photos && item.photos.length > 0 && (
                            <div className="flex items-center gap-2 pt-1">
                              {item.photos.map((photoUrl, pIdx) => (
                                <div
                                  key={pIdx}
                                  onClick={() => setZoomImage(photoUrl)}
                                  className="relative group cursor-pointer shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-2xs"
                                >
                                  <img src={photoUrl} alt="Ornament" className="w-12 h-12 object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                                    <ZoomIn className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 3: KYC & SIGNATURES */}
                  {activeDeepTab === 'kyc' && (
                    <div className="space-y-3 text-xs">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#84cc16]" />
                          <span>Identity &amp; Compliance Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                          <div>Aadhaar: <strong className="font-mono text-slate-900">{deepCustomer?.aadhaarNumber || 'Verified on file'}</strong></div>
                          <div>PAN: <strong className="font-mono text-slate-900">{deepCustomer?.panNumber || 'N/A'}</strong></div>
                          <div>Nominee: <strong className="text-slate-900">{deepCustomer?.nominee?.name ? `${deepCustomer.nominee.name} (${deepCustomer.nominee.relationship})` : 'None'}</strong></div>
                          <div>AML Declaration: <strong className="text-emerald-700 font-bold">Accepted ✓</strong></div>
                        </div>
                      </div>

                      {deepLoanData.digitalSignatureUrl && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Borrower Digital Signature</div>
                          <img
                            src={deepLoanData.digitalSignatureUrl}
                            alt="Signature"
                            onClick={() => setZoomImage(deepLoanData.digitalSignatureUrl)}
                            className="h-14 object-contain cursor-pointer border border-slate-100 rounded-lg p-1"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: LEDGER & PAYMENTS */}
                  {activeDeepTab === 'ledger' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                      <div className="p-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-[#84cc16]" />
                        <span>Payment Transactions ({deepRepayments.length})</span>
                      </div>

                      {deepRepayments.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs font-medium">
                          No payments logged yet for this loan.
                        </div>
                      ) : (
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 text-slate-500 font-bold text-[10px] uppercase">
                            <tr>
                              <th className="py-2 px-3">Receipt #</th>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3 text-right">Interest</th>
                              <th className="py-2 px-3 text-right">Principal</th>
                              <th className="py-2 px-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {deepRepayments.map(rep => (
                              <tr key={rep._id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono font-bold text-slate-800">{rep.receiptNumber}</td>
                                <td className="py-2 px-3 text-slate-500">{formatDate(rep.paymentDate)}</td>
                                <td className="py-2 px-3 text-right text-emerald-600 font-semibold">{formatCurrency(rep.interestAmount)}</td>
                                <td className="py-2 px-3 text-right text-slate-800">{formatCurrency(rep.principalAmount)}</td>
                                <td className="py-2 px-3 text-right font-black text-[#0f172a]">{formatCurrency(rep.totalPaid)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                {/* Inspector Action Footer */}
                <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-md">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrint(null, deepLoanData._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Print Slip</span>
                    </button>
                    <button
                      onClick={() => handleSendWhatsApp(deepLoanData, deepCustomer)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {deepLoanData.status !== 'Redeemed' && (
                      <>
                        <Link
                          to={`/repayments?loanId=${deepLoanData._id}`}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#84cc16] hover:bg-[#65a30d] text-[#0f172a] rounded-xl text-xs font-black shadow-xs transition"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Collect Payment</span>
                        </Link>
                        <Link
                          to={`/redemption?loanId=${deepLoanData._id}`}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold shadow-xs transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#84cc16]" />
                          <span>Redeem &amp; Close</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR IMAGES */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-transparent flex flex-col items-center">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomImage}
              alt="High-Res Zoom"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      <PrintVoucherModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        htmlContent={printHtml}
        title="Pawn Pledge Receipt"
      />
    </div>
  );
}

