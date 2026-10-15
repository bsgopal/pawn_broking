import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  PlusCircle,
  Receipt,
  RotateCcw,
  Users,
  Clock,
  ArrowUpRight,
  Printer,
  ChevronRight,
  Building2,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters';
import PrintVoucherModal from '../components/PrintVoucherModal';
import LoanDetailDrawer from '../components/LoanDetailDrawer';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [recentLoans, setRecentLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [repRes, loanRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/loans?limit=6')
      ]);

      if (repRes.data?.success) {
        setData(repRes.data);
      }
      if (loanRes.data?.success) {
        setRecentLoans(loanRes.data.loans || []);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrint = async (loanId) => {
    try {
      const res = await api.get(`/loans/${loanId}/receipt-html`);
      if (res.data?.success) {
        setPrintHtml(res.data.html);
        setPrintModalOpen(true);
      }
    } catch (e) {
      toast.error('Failed to generate print receipt: ' + (e.response?.data?.message || e.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const rate = data?.latestRate || { gold22K: 0, gold24K: 0, silver: 0 };

  return (
    <div className="space-y-4 w-full">
      {/* 1. TOP HEADER & QUICK ACTION BAR (UNIFIED OBSIDIAN SLATE THEME) */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#1e293b] text-white p-4 rounded-xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-[#84cc16] text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PawnBook Pro Enterprise Suite</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white mt-0.5 tracking-tight">
            Pawn Broking &amp; Gold Loan Operations
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time multi-branch collateral valuation, interest accruals, and vault monitoring.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/new-pawn"
            className="flex items-center gap-1.5 bg-[#84cc16] hover:bg-[#65a30d] text-[#0f172a] px-3.5 py-2 rounded-lg font-extrabold text-xs shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Pawn Pledge</span>
          </Link>
          <Link
            to="/repayments"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg font-semibold text-xs transition border border-slate-700"
          >
            <Receipt className="w-4 h-4 text-[#84cc16]" />
            <span>Collect Interest</span>
          </Link>
          <Link
            to="/redemption"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg font-semibold text-xs transition border border-slate-700"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Redeem Loan</span>
          </Link>
        </div>
      </div>

      {/* 2. OVERDUE ALERT BANNER (If overdue exists) */}
      {(metrics.totalOverdueLoans || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">
                {metrics.totalOverdueLoans} Loans have exceeded maturity and grace period!
              </div>
              <div className="text-[11px] text-amber-700">
                Statutory Form 1 and Form 2 legal notice generation required before auction scheduling.
              </div>
            </div>
          </div>
          <Link
            to="/overdue"
            className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
          >
            <span>Review Overdue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 3. CORE METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Outstanding Principal */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Portfolio</span>
            <div className="w-7 h-7 rounded-lg bg-lime-50 text-[#84cc16] flex items-center justify-center border border-lime-200">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-extrabold text-slate-900">
              {formatCurrency(metrics.totalPrincipalOutstanding || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <span className="font-bold text-slate-800">{metrics.totalActiveLoans || 0}</span>
              <span>active pawn tickets</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Pledged Gold Collateral */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vault Gold In Hand</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-extrabold text-amber-700">
              {formatWeight(metrics.totalPledgedGoldGrams || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <span>Appraised:</span>
              <span className="font-bold text-slate-800">{formatCurrency(metrics.totalCollateralValuation || 0)}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Today's Collection */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Collections</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-extrabold text-emerald-700">
              {formatCurrency(metrics.todayCollection || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <span>Month Interest:</span>
              <span className="font-bold text-slate-800">{formatCurrency(metrics.monthInterestEarnings || 0)}</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Accrued Interest Due */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Accrued Interest Due</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-extrabold text-slate-900">
              {formatCurrency(metrics.totalAccruedInterestDue || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <span>Vault Occupancy:</span>
              <span className="font-bold text-slate-800">{metrics.vaultOccupancyPct || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LIVE RATE CARDS & RECENT LOANS DUAL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Col: Live Gold & Silver Rate Widget */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#84cc16]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Today's Metal Rates
              </h3>
            </div>
            <Link to="/daily-rates" className="text-[11px] font-bold text-lime-700 hover:text-lime-800 hover:underline">
              Update Rates →
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-lime-50/70 border border-lime-200">
              <div>
                <div className="text-xs font-bold text-slate-900">22K Gold (916)</div>
                <div className="text-[10px] text-slate-500">Hallmarked Jewelry Standard</div>
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {formatCurrency(rate.gold22K || 0)} <span className="text-[10px] font-normal text-slate-500">/g</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">24K Gold (999)</div>
                <div className="text-[10px] text-slate-500">Pure Bullion / Coins</div>
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {formatCurrency(rate.gold24K || 0)} <span className="text-[10px] font-normal text-slate-500">/g</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">Fine Silver (999)</div>
                <div className="text-[10px] text-slate-500">Silver Articles &amp; Utensils</div>
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {formatCurrency(rate.silver || 0)} <span className="text-[10px] font-normal text-slate-500">/g</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-tight text-center pt-1">
            * Statutory RBI 75% LTV maximum ceiling is strictly enforced against these rates.
          </div>
        </div>

        {/* Right Col: Recent Loans Registry Table */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#84cc16]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Recent Pawn Disbursements
              </h3>
            </div>
            <Link to="/pawn-list" className="text-[11px] font-bold text-lime-700 hover:text-lime-800 hover:underline">
              View All Loans →
            </Link>
          </div>

          <div className="overflow-x-auto mt-2 flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[11px]">
                  <th className="pb-1.5">Ticket #</th>
                  <th className="pb-1.5">Customer</th>
                  <th className="pb-1.5">Net Gold</th>
                  <th className="pb-1.5 text-right">Principal</th>
                  <th className="pb-1.5 text-center">Status</th>
                  <th className="pb-1.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLoans.map(loan => (
                  <tr
                    key={loan._id}
                    onClick={() => setSelectedLoanId(loan._id)}
                    className="hover:bg-lime-50/40 cursor-pointer transition group"
                  >
                    <td className="py-2 font-bold text-[#0f172a] font-mono">
                      <span className="group-hover:text-[#65a30d] transition">
                        {loan.ticketNumber}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="font-semibold text-slate-800">{loan.customerName}</div>
                      <div className="text-[10px] text-slate-400">{loan.customerMobile}</div>
                    </td>
                    <td className="py-2 font-medium text-slate-700">
                      {formatWeight(loan.totalNetWt)}
                    </td>
                    <td className="py-2 text-right font-extrabold text-slate-900">
                      {formatCurrency(loan.principal)}
                    </td>
                    <td className="py-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        loan.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                        loan.status === 'Redeemed' ? 'bg-blue-100 text-blue-800' :
                        loan.status === 'Overdue' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleQuickPrint(loan._id)}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Print Ticket"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {recentLoans.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No pawn pledges created yet. Click "+ New Pawn Pledge" to disburse your first loan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Side Loan Details Drawer */}
      <LoanDetailDrawer
        isOpen={Boolean(selectedLoanId)}
        onClose={() => setSelectedLoanId(null)}
        loanId={selectedLoanId}
      />

      {/* Direct Silent / Thermal Print Modal */}
      <PrintVoucherModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        htmlContent={printHtml}
        title="Pawn Pledge Receipt"
      />
    </div>
  );
}

