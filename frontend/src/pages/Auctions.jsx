import React, { useState, useEffect } from 'react';
import {
  Gavel,
  Calendar,
  Plus,
  CheckCircle2,
  Users,
  Printer,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export default function Auctions() {
  const { toast } = useToast();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auctions');
      if (res.data?.success) {
        setAuctions(res.data.auctions || []);
      }
    } catch (e) {
      console.error('Error loading auctions:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Gavel className="w-6 h-6 text-[#84cc16]" />
            <span>Statutory Public Auction & Collateral Realization</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            RBI & State Pawn Brokers Act compliant public auction lotting, registered bidders, and recovery ledger.
          </p>
        </div>
      </div>

      {/* 2. AUCTION SESSIONS LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : auctions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            No public auctions currently scheduled.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Auction Event #</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Venue & Auctioneer</th>
                  <th className="py-3 px-4 text-center">Pledge Lots</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Catalog Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auctions.map(a => (
                  <tr key={a._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-extrabold text-[#0f172a]">
                      {a.auctionNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {formatDate(a.auctionDate)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700">{a.venue}</div>
                      <div className="text-[10px] text-slate-400">{a.authorizedAuctioneer}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {a.totalLotsCount || (a.loanIds || []).length} Lots
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-purple-100 text-purple-800">
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toast.info(`Printing Auction Catalog for ${a.auctionNumber}`)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Print Catalog"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
