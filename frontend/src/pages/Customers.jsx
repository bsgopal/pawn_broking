import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  Phone,
  Coins,
  ChevronRight,
  FileText,
  Star,
  ExternalLink,
  Eye,
  MessageSquare,
  ArrowLeft,
  X
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters';
import CustomerDetailDrawer from '../components/CustomerDetailDrawer';
import LoanDetailDrawer from '../components/LoanDetailDrawer';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoans, setCustomerLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawers
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers?search=${search}`);
      if (res.data?.success) {
        setCustomers(res.data.customers || []);
      }
    } catch (e) {
      console.error('Error loading customers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (cust) => {
    setSelectedCustomer(cust);
    try {
      const res = await api.get(`/customers/${cust._id}`);
      if (res.data?.success) {
        setCustomerLoans(res.data.loans || []);
      }
    } catch (e) {}
  };

  const handleOpenCustomerDrawer = (cust) => {
    handleSelectCustomer(cust);
    setCustomerDrawerOpen(true);
  };

  return (
    <div className="h-full max-h-full flex flex-col gap-2 min-h-0 overflow-hidden w-full">
      {/* 1. HEADER */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#84cc16]" />
              <span>Customer KYC Registry &amp; Credit Exposure Master</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Aadhaar/PAN verified borrower profiles, pledge histories, credit ratings, and quick inspection panels.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Total Customers: <strong className="text-slate-900">{customers.length}</strong>
          </div>
        </div>
      </div>

      <div className={`flex-1 min-h-0 ${selectedCustomer ? 'grid grid-cols-1 lg:grid-cols-12 gap-2.5' : 'w-full flex flex-col'} items-stretch overflow-hidden`}>
        {/* Left Col: Customers List (full width when no selection, 7 cols when selected) */}
        <div className={`${selectedCustomer ? 'lg:col-span-7' : 'w-full'} flex flex-col min-h-0 h-full gap-2`}>
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer by name, mobile, Aadhaar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden shadow-xs"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex-1 min-h-0 flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : customers.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 font-medium">
                No customer records found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 flex-1 min-h-0 overflow-y-auto">
                {customers.map(c => (
                  <div
                    key={c._id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition hover:bg-slate-50 ${
                      selectedCustomer?._id === c._id ? 'bg-lime-50/70 border-l-4 border-[#84cc16]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#020617] to-[#1e293b] text-[#84cc16] flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{c.name}</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {c.creditScore || 4.8}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          📞 {c.mobile} · Aadhaar: {c.aadhaarNo || 'Unverified'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2.5">
                      <div>
                        <div className="font-black text-xs text-[#0f172a]">
                          {formatCurrency(c.totalPrincipalOutstanding || 0)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {c.activeLoansCount || 0} Active Loans
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCustomerDrawer(c);
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Open Full Profile Side Panel"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#65a30d]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Selected Customer Profile & Pledge Ledger (Only displayed when selectedCustomer !== null) */}
        {selectedCustomer && (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col min-h-0 h-full overflow-hidden">
            <div className="p-3.5 pb-3 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200 cursor-pointer"
                  title="Collapse side panel"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Profile</span>
                  <h3 className="text-sm sm:text-base font-black text-[#0f172a] truncate">{selectedCustomer.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setCustomerDrawerOpen(true)}
                  className="text-[11px] font-bold bg-[#0f172a] hover:bg-[#1e293b] text-white px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Panel</span>
                  <ExternalLink className="w-3 h-3 text-[#84cc16]" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sticky Quick Anchor Tabs */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0">
              {[
                { id: 'cust-sec-kyc', label: '1. KYC & Contact' },
                { id: 'cust-sec-nominee', label: '2. Nominee & Address' },
                { id: 'cust-sec-ledger', label: '3. Pledge Ledger' }
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

            {/* Continuous Scrollable Body */}
            <div className="p-3.5 space-y-3.5 flex-1 min-h-0 overflow-y-auto">
              {/* SECTION 1: KYC & CONTACT */}
              <div id="cust-sec-kyc" className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Identity &amp; Contacts</span>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Mobile Number:</span>
                  <span className="font-bold text-slate-800">{selectedCustomer.mobile}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Aadhaar Card:</span>
                  <span className="font-bold text-slate-800">{selectedCustomer.aadhaarNo || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">PAN Number:</span>
                  <span className="font-bold text-slate-800">{selectedCustomer.panNo || 'N/A'}</span>
                </div>
              </div>

              {/* SECTION 2: NOMINEE & ADDRESS */}
              <div id="cust-sec-nominee" className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nominee &amp; Address</span>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Address:</span>
                  <span className="font-medium text-slate-800 text-right truncate max-w-[200px]">{selectedCustomer.address || 'Local'}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Nominee:</span>
                  <span className="font-bold text-slate-800">{selectedCustomer.nominee || 'N/A'} ({selectedCustomer.relation || 'Family'})</span>
                </div>
              </div>

              {/* SECTION 3: PLEDGE LEDGER */}
              <div id="cust-sec-ledger" className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Pawn Pledge Ledger ({customerLoans.length}):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click loan to inspect</span>
                </div>
                <div className="space-y-2">
                  {customerLoans.map(l => (
                    <div
                      key={l._id}
                      onClick={() => setSelectedLoanId(l._id)}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-lime-50/50 border border-slate-200 hover:border-[#84cc16] cursor-pointer transition text-xs space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#0f172a] group-hover:text-[#65a30d] transition">
                          {l.ticketNumber}
                        </span>
                        <span className="font-extrabold text-slate-900">{formatCurrency(l.principal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{formatDate(l.loanDate)} · {formatWeight(l.totalNetWt)}</span>
                        <span className={`font-bold ${l.status === 'Active' ? 'text-emerald-700' : 'text-blue-700'}`}>
                          {l.status} →
                        </span>
                      </div>
                    </div>
                  ))}
                  {customerLoans.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400">
                      No pledge history on file.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Side Drawer */}
      <CustomerDetailDrawer
        isOpen={customerDrawerOpen}
        onClose={() => setCustomerDrawerOpen(false)}
        customerId={selectedCustomer?._id}
        initialCustomer={selectedCustomer}
        onSelectLoan={(id) => {
          setSelectedLoanId(id);
        }}
      />

      {/* Loan Side Drawer */}
      <LoanDetailDrawer
        isOpen={Boolean(selectedLoanId)}
        onClose={() => setSelectedLoanId(null)}
        loanId={selectedLoanId}
      />
    </div>
  );
}
