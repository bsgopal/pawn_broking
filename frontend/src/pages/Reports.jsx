import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Calendar,
  FileText,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Search,
  ArrowLeft,
  X,
  Layers,
  Coins,
  ShieldCheck,
  Building2,
  Lock,
  Sparkles,
  Camera,
  Eye,
  User,
  Phone,
  RotateCcw,
  Clock,
  ExternalLink,
  ChevronRight,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export default function Reports() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'form-a' | 'form-c' | 'aging'
  const [itemsData, setItemsData] = useState([]);
  const [formAData, setFormAData] = useState([]);
  const [formCData, setFormCData] = useState([]);
  const [agingData, setAgingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1-to-2 Column Drilldown State
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState('weights'); // 'weights' | 'vault' | 'customer' | 'loan'
  const [zoomImage, setZoomImage] = useState(null);

  const drawerScrollRef = useRef(null);

  useEffect(() => {
    loadReport();
  }, [activeTab]);

  const loadReport = async () => {
    setLoading(true);
    setSelectedItem(null);
    try {
      if (activeTab === 'items') {
        const res = await api.get('/reports/items-inventory');
        if (res.data?.success) setItemsData(res.data.items || []);
      } else if (activeTab === 'form-a') {
        const res = await api.get('/reports/form-a');
        if (res.data?.success) setFormAData(res.data.register || []);
      } else if (activeTab === 'form-c') {
        const res = await api.get('/reports/form-c');
        if (res.data?.success) setFormCData(res.data.register || []);
      } else if (activeTab === 'aging') {
        const res = await api.get('/reports/aging');
        if (res.data?.success) setAgingData(res.data.buckets || null);
      }
    } catch (e) {
      console.error('Error loading report:', e);
      toast.error('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToDrawerSection = (sectionId, tabId) => {
    setActiveDrawerTab(tabId);
    const elem = document.getElementById(sectionId);
    if (elem && drawerScrollRef.current) {
      const parentTop = drawerScrollRef.current.getBoundingClientRect().top;
      const elemTop = elem.getBoundingClientRect().top;
      drawerScrollRef.current.scrollTop += (elemTop - parentTop - 10);
    }
  };

  // Filtered data based on search term
  const filteredItems = itemsData.filter(it => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    return (
      it.ticketNumber?.toLowerCase().includes(t) ||
      it.customerName?.toLowerCase().includes(t) ||
      it.ornamentType?.toLowerCase().includes(t) ||
      it.vaultBox?.toLowerCase().includes(t)
    );
  });

  const filteredFormA = formAData.filter(r => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    return (
      r.ticketNumber?.toLowerCase().includes(t) ||
      r.customerName?.toLowerCase().includes(t) ||
      r.articlesDescription?.toLowerCase().includes(t) ||
      r.boxNo?.toLowerCase().includes(t)
    );
  });

  const isDrawerOpen = selectedItem !== null;

  return (
    <div className="h-full max-h-full flex flex-col gap-2 min-h-0 overflow-hidden select-none">
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-[#84cc16] shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <span>Pawn Brokers Act Statutory Registers &amp; Inventory Reports</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Collateral items matrix, Form A (Pledges), Form C (Redemptions), and overdue aging breakdown
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Item / Ticket / Vault..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 w-44 sm:w-52 shadow-2xs font-medium"
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

            {/* Tab Navigation Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setActiveTab('items')}
                className={`px-3 py-1 rounded-lg transition text-xs font-black ${
                  activeTab === 'items' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Collateral Items ({itemsData.length})
              </button>
              <button
                onClick={() => setActiveTab('form-a')}
                className={`px-3 py-1 rounded-lg transition text-xs font-black ${
                  activeTab === 'form-a' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Form A (Pledges)
              </button>
              <button
                onClick={() => setActiveTab('form-c')}
                className={`px-3 py-1 rounded-lg transition text-xs font-black ${
                  activeTab === 'form-c' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Form C (Redemptions)
              </button>
              <button
                onClick={() => setActiveTab('aging')}
                className={`px-3 py-1 rounded-lg transition text-xs font-black ${
                  activeTab === 'aging' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overdue Aging
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROGRESSIVE 1-TO-2 COLUMN VIEWPORT */}
      <div className="flex-1 min-h-0 flex flex-row gap-2.5 overflow-hidden">
        {/* LEFT COLUMN: TABLE (Takes w-full when closed, w-5/12 when open) */}
        <div className={`h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200 ${
          isDrawerOpen ? 'w-full md:w-5/12 shrink-0' : 'w-full'
        }`}>
          {loading ? (
            <div className="flex items-center justify-center py-20 flex-1">
              <div className="w-8 h-8 border-3 border-slate-900 border-t-[#84cc16] rounded-full animate-spin" />
            </div>
          ) : activeTab === 'items' ? (
            /* TAB 1: ALL COLLATERAL ITEMS INVENTORY MATRIX */
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 border-b border-slate-200 uppercase text-[9px] text-slate-600 font-black tracking-wider shadow-2xs">
                  <tr>
                    <th className="p-2.5">Item &amp; Ticket</th>
                    <th className="p-2.5">Customer Name</th>
                    <th className="p-2.5">Vault Location</th>
                    <th className="p-2.5 text-right">Gross Wt</th>
                    <th className="p-2.5 text-right">Tare / Stone</th>
                    <th className="p-2.5 text-right">Net Gold</th>
                    {!isDrawerOpen && <th className="p-2.5 text-right">Total Wt</th>}
                    {!isDrawerOpen && <th className="p-2.5 text-right">Valuation</th>}
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(it => {
                    const isSelected = selectedItem?.itemId === it.itemId || selectedItem?._id === it.loanId;
                    return (
                      <tr
                        key={it.itemId || it.itemSlNo}
                        onClick={() => setSelectedItem(it)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-lime-50/80 border-l-4 border-l-lime-600 font-bold'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-3 h-3 text-[#84cc16]" />
                            <span>{it.ornamentType}</span>
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[9px] font-bold">
                              {it.purity}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono font-bold text-slate-500">
                            #{it.ticketNumber} · Qty: {it.quantity}
                          </div>
                        </td>
                        <td className="p-2.5 font-bold text-slate-800 text-xs">
                          {it.customerName}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-[10px] border border-slate-200 flex items-center gap-1 w-max">
                            <Lock className="w-2.5 h-2.5 text-emerald-700" />
                            <span>{it.vaultBox}</span>
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-800 font-bold text-xs">
                          {formatWeight(it.grossWeight)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-amber-700 font-bold text-xs">
                          {formatWeight(it.tareWeight)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-800 font-black text-xs">
                          {formatWeight(it.netWeight)}
                        </td>
                        {!isDrawerOpen && (
                          <td className="p-2.5 text-right font-mono text-slate-900 font-black text-xs">
                            {formatWeight(it.totalWeight)}
                          </td>
                        )}
                        {!isDrawerOpen && (
                          <td className="p-2.5 text-right font-mono text-slate-800 font-bold text-xs">
                            {formatCurrency(it.marketValuation)}
                          </td>
                        )}
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            it.loanStatus === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : it.loanStatus === 'Redeemed'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}>
                            {it.loanStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={isDrawerOpen ? 7 : 9} className="py-12 text-center text-xs text-slate-400 font-medium">
                        No matching collateral items found in records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'form-a' ? (
            /* TAB 2: FORM A (REGISTER OF PLEDGES) */
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 border-b border-slate-200 uppercase text-[9px] text-slate-600 font-black tracking-wider shadow-2xs">
                  <tr>
                    <th className="p-2.5">Sl #</th>
                    <th className="p-2.5">Ticket #</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Customer Name</th>
                    <th className="p-2.5">Vault Safe</th>
                    <th className="p-2.5 text-right">Gross Wt</th>
                    <th className="p-2.5 text-right">Tare / Stone</th>
                    <th className="p-2.5 text-right">Net Gold</th>
                    {!isDrawerOpen && <th className="p-2.5 text-right">Principal</th>}
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFormA.map(r => {
                    const isSelected = selectedItem?._id === r._id || selectedItem?.loanId === r.loanId;
                    return (
                      <tr
                        key={r.slNo}
                        onClick={() => setSelectedItem(r)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-lime-50/80 border-l-4 border-l-lime-600 font-bold'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="p-2.5 text-slate-400 font-mono text-[11px]">{r.slNo}</td>
                        <td className="p-2.5 font-mono font-black text-slate-900 text-xs">{r.ticketNumber}</td>
                        <td className="p-2.5 text-slate-600 text-[11px]">{r.date}</td>
                        <td className="p-2.5 font-bold text-slate-800 text-xs">{r.customerName}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-[10px] border border-slate-200">
                            {r.boxNo}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-800 font-bold text-xs">{formatWeight(r.grossWeightGrams)}</td>
                        <td className="p-2.5 text-right font-mono text-amber-700 font-bold text-xs">{formatWeight(r.tareWeightGrams || r.stoneWeightGrams)}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-800 font-black text-xs">{formatWeight(r.netWeightGrams)}</td>
                        {!isDrawerOpen && (
                          <td className="p-2.5 text-right font-mono font-black text-slate-900 text-xs">{formatCurrency(r.principalAdvanced)}</td>
                        )}
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            r.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFormA.length === 0 && (
                    <tr>
                      <td colSpan={isDrawerOpen ? 8 : 10} className="py-12 text-center text-xs text-slate-400 font-medium">
                        No Form A pledge entries recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'form-c' ? (
            /* TAB 3: FORM C (REDEMPTIONS) */
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 border-b border-slate-200 uppercase text-[9px] text-slate-600 font-black tracking-wider shadow-2xs">
                  <tr>
                    <th className="p-2.5">Redemption #</th>
                    <th className="p-2.5">Ticket #</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Customer</th>
                    <th className="p-2.5 text-right">Principal Recovered</th>
                    <th className="p-2.5 text-right">Interest Collected</th>
                    <th className="p-2.5 text-right">Total Settled</th>
                    <th className="p-2.5">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formCData.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-mono font-bold text-emerald-700">{r.redemptionNumber}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-900">{r.ticketNumber}</td>
                      <td className="p-2.5 text-slate-600">{r.date}</td>
                      <td className="p-2.5 font-bold text-slate-800">{r.customerName}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(r.principalRecovered)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{formatCurrency(r.interestCollected)}</td>
                      <td className="p-2.5 text-right font-mono font-black text-slate-900">{formatCurrency(r.totalReceived)}</td>
                      <td className="p-2.5 text-slate-600 font-bold text-[10px]">{r.paymentMode}</td>
                    </tr>
                  ))}
                  {formCData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-medium">
                        No Form C redemption entries recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* TAB 4: OVERDUE AGING */
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-y-auto flex-1">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider">1 - 30 Days Overdue</div>
                <div className="text-xl font-black text-amber-900">{agingData?.bucket0_30?.count || 0} Loans</div>
                <div className="text-xs text-amber-700 font-mono font-bold">Principal: {formatCurrency(agingData?.bucket0_30?.principal || 0)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 space-y-1">
                <div className="text-[10px] font-black text-orange-800 uppercase tracking-wider">31 - 60 Days Overdue</div>
                <div className="text-xl font-black text-orange-900">{agingData?.bucket31_60?.count || 0} Loans</div>
                <div className="text-xs text-orange-700 font-mono font-bold">Principal: {formatCurrency(agingData?.bucket31_60?.principal || 0)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-1">
                <div className="text-[10px] font-black text-red-800 uppercase tracking-wider">61 - 90 Days Overdue</div>
                <div className="text-xl font-black text-red-900">{agingData?.bucket61_90?.count || 0} Loans</div>
                <div className="text-xs text-red-700 font-mono font-bold">Principal: {formatCurrency(agingData?.bucket61_90?.principal || 0)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                <div className="text-[10px] font-black text-purple-800 uppercase tracking-wider">90+ Days (Auction Prep)</div>
                <div className="text-xl font-black text-purple-900">{agingData?.bucket90_plus?.count || 0} Loans</div>
                <div className="text-xs text-purple-700 font-mono font-bold">Principal: {formatCurrency(agingData?.bucket90_plus?.principal || 0)}</div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: COLLATERAL INSPECTOR DRAWER (Takes w-7/12 when open) */}
        {isDrawerOpen && (
          <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-2 duration-150">
            {/* Header with Back & Close */}
            <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] font-bold"
                  title="Back to full table"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#84cc16]" />
                  <span className="font-mono font-black text-xs text-white">
                    Ticket #{selectedItem.ticketNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {selectedItem.status || selectedItem.loanStatus || 'Active'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sticky Anchor Navigation Tabs */}
            <div className="px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 flex items-center gap-1.5 shrink-0 overflow-x-auto">
              <button
                onClick={() => scrollToDrawerSection('rep-sec-weights', 'weights')}
                className={`px-3 py-1 rounded-lg text-[11px] font-black transition ${
                  activeDrawerTab === 'weights'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                Items &amp; Weights Breakdown
              </button>
              <button
                onClick={() => scrollToDrawerSection('rep-sec-vault', 'vault')}
                className={`px-3 py-1 rounded-lg text-[11px] font-black transition ${
                  activeDrawerTab === 'vault'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                Vault Safe Location
              </button>
              <button
                onClick={() => scrollToDrawerSection('rep-sec-customer', 'customer')}
                className={`px-3 py-1 rounded-lg text-[11px] font-black transition ${
                  activeDrawerTab === 'customer'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                Borrower KYC Info
              </button>
              <button
                onClick={() => scrollToDrawerSection('rep-sec-loan', 'loan')}
                className={`px-3 py-1 rounded-lg text-[11px] font-black transition ${
                  activeDrawerTab === 'loan'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                Financial Terms
              </button>
            </div>

            {/* Scrollable Single Body */}
            <div ref={drawerScrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {/* SECTION 1: SEPARATE WEIGHTS BREAKDOWN (Gross, Tare, Net, Total) */}
              <div id="rep-sec-weights" className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-[11px] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-lime-600" />
                    <span>Collateral Gold Weights Matrix</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    Appraised Value: {formatCurrency(selectedItem.assessedValue || selectedItem.marketValuation || 0)}
                  </span>
                </div>

                {/* 4 Separate Key Weight Metric Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Gross Weight</span>
                    <strong className="text-sm font-black text-slate-900 font-mono">
                      {formatWeight(selectedItem.grossWeightGrams || selectedItem.grossWeight || selectedItem.totalGrossWt || 0)}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Scale Reading</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-amber-600 block text-[9px] uppercase font-bold">Tare / Stone Wt</span>
                    <strong className="text-sm font-black text-amber-700 font-mono">
                      {formatWeight(selectedItem.tareWeightGrams || selectedItem.tareWeight || selectedItem.stoneWeightGrams || 0)}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Deduction</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-emerald-600 block text-[9px] uppercase font-bold">Net Gold Wt</span>
                    <strong className="text-sm font-black text-emerald-800 font-mono">
                      {formatWeight(selectedItem.netWeightGrams || selectedItem.netWeight || selectedItem.totalNetWt || 0)}
                    </strong>
                    <span className="text-[9px] text-emerald-600 block mt-0.5">Purity Evaluated</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-700 block text-[9px] uppercase font-bold">Total Weight</span>
                    <strong className="text-sm font-black text-slate-900 font-mono">
                      {formatWeight(selectedItem.totalWeightGrams || selectedItem.totalWeight || selectedItem.grossWeightGrams || 0)}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Total Lot</span>
                  </div>
                </div>

                {/* Individual Collateral Items List */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  <div className="p-2.5 bg-slate-100/70 flex items-center justify-between font-black text-[10px] uppercase text-slate-600">
                    <span>Pledged Item Description</span>
                    <span>Gross · Tare · Net Wt</span>
                  </div>
                  {(selectedItem.items || (selectedItem.parentLoan?.items) || [selectedItem]).map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{it.ornamentType || it.itemType || 'Gold Ornament'}</span>
                          <span className="px-1.5 py-0.2 bg-lime-100 text-lime-900 rounded text-[9px] font-bold">
                            {it.purity || it.karat || '22K'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Qty: {it.quantity || 1}</span>
                        </div>
                        {it.description && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{it.description}</div>
                        )}
                      </div>
                      <div className="text-right font-mono text-xs">
                        <div className="font-bold text-slate-900">
                          Net: {formatWeight(it.netWeight || (Number(it.grossWeight) - Number(it.stoneWeight || 0)))}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Gross: {formatWeight(it.grossWeight)} | Tare: {formatWeight(it.stoneWeight || it.tareWeight || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: VAULT & PHYSICAL STORAGE LOCATION */}
              <div id="rep-sec-vault" className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h3 className="font-black text-[11px] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Physical Vault Safe &amp; Compartment Box</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Locker Box #</span>
                      <strong className="text-slate-900 font-mono font-bold text-xs">
                        {selectedItem.boxNo || selectedItem.vaultBox || selectedItem.parentLoan?.boxNo || 'Safe A [Box #1]'}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Strongroom Safe</span>
                      <strong className="text-slate-900 font-bold text-xs">
                        {selectedItem.safeName || 'Showroom Main Safe A'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: BORROWER KYC & IDENTITY DETAILS */}
              <div id="rep-sec-customer" className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h3 className="font-black text-[11px] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span>Borrower KYC &amp; Contact Details</span>
                </h3>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Customer Full Name</span>
                      <strong className="text-slate-900 text-sm font-black">{selectedItem.customerName}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Mobile Phone</span>
                      <span className="text-slate-900 font-mono font-bold text-xs">
                        📞 {selectedItem.customerMobile || selectedItem.customerAddress || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {selectedItem.customerAadhaar && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-bold">Aadhaar / ID:</span>
                      <span className="font-mono text-slate-800">{selectedItem.customerAadhaar}</span>
                    </div>
                  )}

                  {selectedItem.nomineeName && (
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-bold">Nominee:</span>
                      <span className="text-slate-800 font-medium">
                        {selectedItem.nomineeName} {selectedItem.nomineeRelation ? `(${selectedItem.nomineeRelation})` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: FINANCIAL TERMS */}
              <div id="rep-sec-loan" className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h3 className="font-black text-[11px] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pawn Loan Financial Terms</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Principal Sanctioned</span>
                    <strong className="text-emerald-700 font-mono font-black">
                      {formatCurrency(selectedItem.principalAdvanced || selectedItem.principal || 0)}
                    </strong>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Interest Rate</span>
                    <strong className="text-slate-900 font-bold">
                      {selectedItem.monthlyInterestRate || '1.5% / month'}
                    </strong>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Pledge Date</span>
                    <span className="text-slate-800 font-medium">
                      {selectedItem.date || (selectedItem.loanDate ? formatDate(selectedItem.loanDate) : 'N/A')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX FOR ITEM PHOTOS */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <img src={zoomImage} alt="Ornament Zoom" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
