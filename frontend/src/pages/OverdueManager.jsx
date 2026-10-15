import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  FileText,
  Send,
  Gavel,
  Clock,
  CheckCircle2,
  Printer,
  Eye
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters';
import LoanDetailDrawer from '../components/LoanDetailDrawer';
import { useToast } from '../context/ToastContext';

export default function OverdueManager() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  useEffect(() => {
    loadOverdueCandidates();
  }, []);

  const loadOverdueCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auctions/overdue-candidates');
      if (res.data?.success) {
        setCandidates(res.data.candidates || []);
      }
    } catch (e) {
      console.error('Error loading overdue loans:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueNotice = async (loanId, noticeType) => {
    try {
      const res = await api.post('/auctions/issue-notice', { loanId, noticeType });
      if (res.data?.success) {
        toast.success(`${noticeType} issued successfully for this pledge.`);
        loadOverdueCandidates();
      }
    } catch (e) {
      toast.error('Error: ' + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className="space-y-4 w-full pb-8">
      {/* 1. HEADER */}

      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <span>Overdue Loan Escalation &amp; Statutory Legal Notices</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Form 1 (Pre-Auction Due Notice) and Form 2 (Final Statutory Demand) under the State Pawn Brokers Act. Click any loan to open the side details panel.
        </p>
      </div>

      {/* 2. OVERDUE CANDIDATES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            🎉 Great job! No overdue loan pledges currently pending notice.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Maturity Date</th>
                  <th className="py-3 px-4 text-center">Overdue Days</th>
                  <th className="py-3 px-4 text-right">Principal</th>
                  <th className="py-3 px-4 text-right">Total Claim Amount</th>
                  <th className="py-3 px-4 text-center">Current Status</th>
                  <th className="py-3 px-4 text-right">Legal Notice Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map(c => (
                  <tr
                    key={c._id}
                    onClick={() => setSelectedLoanId(c._id)}
                    className="hover:bg-lime-50/40 cursor-pointer transition group"
                  >
                    <td className="py-3 px-4 font-mono font-extrabold text-[#0f172a]">
                      <div className="flex items-center gap-1.5">
                        <span className="group-hover:text-[#65a30d] transition">{c.ticketNumber}</span>
                        <Eye className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{c.customerName}</div>
                      <div className="text-[11px] text-slate-500">📞 {c.customerMobile}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {formatDate(c.maturityDate)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                        {c.overdueDays} Days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(c.principalOutstanding || c.principal)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-[#0f172a]">
                      {formatCurrency(c.totalClaimAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleIssueNotice(c._id, 'Notice_Form1')}
                          className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition"
                          title="Issue Form 1 Pre-Auction Notice"
                        >
                          Form 1
                        </button>
                        <button
                          onClick={() => handleIssueNotice(c._id, 'Notice_Form2')}
                          className="px-2.5 py-1 text-[11px] font-bold bg-red-100 hover:bg-red-200 text-red-900 rounded-lg transition"
                          title="Issue Form 2 Final Legal Demand"
                        >
                          Form 2
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right Side Loan Details Drawer */}
      <LoanDetailDrawer
        isOpen={Boolean(selectedLoanId)}
        onClose={() => setSelectedLoanId(null)}
        loanId={selectedLoanId}
      />
    </div>
  );
}
