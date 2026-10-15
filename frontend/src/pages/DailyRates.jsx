import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Save,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export default function DailyRates() {
  const { toast } = useToast();
  const [currentRate, setCurrentRate] = useState({
    date: new Date().toISOString().split('T')[0],
    gold22K: 0,
    gold24K: 0,
    gold18K: 0,
    silver: 0,
    platinum: 0
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rates');
      if (res.data?.success) {
        if (res.data.current) setCurrentRate(res.data.current);
        if (res.data.history) setHistory(res.data.history);
      }
    } catch (e) {
      console.error('Error loading rates:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRates = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await api.post('/rates', currentRate);
      if (res.data?.success) {
        setSavedSuccess(true);
        toast.success('Market rates updated successfully!');
        setTimeout(() => setSavedSuccess(false), 3000);
        loadRates();
      }
    } catch (err) {
      toast.error('Failed to update rates: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-8">
      {/* 1. HEADER */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-[#84cc16]" />
          <span>Daily Metal Market Rate Manager</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Configure official daily gold, silver, and platinum spot appraisal rates for loan disbursement calculations.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Market rates updated successfully across all valuation terminals!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rate Update Form */}
        <form onSubmit={handleSaveRates} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Update Today's Rates
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Date: {currentRate.date}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                22 Karat Gold Rate (₹ / Gram) *
              </label>
              <input
                type="number"
                required
                value={currentRate.gold22K}
                onChange={(e) => setCurrentRate({ ...currentRate, gold22K: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-base text-[#0f172a] outline-hidden focus:ring-2 focus:ring-[#84cc16]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                24 Karat Pure Gold (₹ / Gram) *
              </label>
              <input
                type="number"
                required
                value={currentRate.gold24K}
                onChange={(e) => setCurrentRate({ ...currentRate, gold24K: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Fine Silver Rate (₹ / Gram) *
              </label>
              <input
                type="number"
                required
                value={currentRate.silver}
                onChange={(e) => setCurrentRate({ ...currentRate, silver: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Platinum Rate (₹ / Gram)
              </label>
              <input
                type="number"
                value={currentRate.platinum || 0}
                onChange={(e) => setCurrentRate({ ...currentRate, platinum: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 text-[#84cc16]" />
            <span>{saving ? 'Updating Rates...' : 'Publish Today\'s Benchmark Rates'}</span>
          </button>
        </form>

        {/* Rate History List */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-[#84cc16]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Recent Historical Rates
            </h2>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto">
            {history.map((h, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{formatDate(h.date)}</div>
                  <div className="text-[11px] text-slate-400">Silver: ₹{h.silver}/g</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-[#0f172a]">₹{h.gold22K}/g (22K)</div>
                  <div className="text-[11px] text-slate-500">₹{h.gold24K}/g (24K)</div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                No historical rates recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
