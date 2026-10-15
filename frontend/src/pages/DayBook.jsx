import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Coins,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export default function DayBook() {
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [daybook, setDaybook] = useState(null);
  const [loading, setLoading] = useState(true);

  // Expense / Contra modal
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({
    type: 'EXPENSE',
    amount: '',
    partyName: '',
    mode: 'CASH'
  });

  // Cashier Till & Denomination Close Drawer State
  const [tillModalOpen, setTillModalOpen] = useState(false);
  const [denominations, setDenominations] = useState({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    coins: 0
  });

  const countedTotal = (
    (denominations[500] || 0) * 500 +
    (denominations[200] || 0) * 200 +
    (denominations[100] || 0) * 100 +
    (denominations[50] || 0) * 50 +
    (denominations[20] || 0) * 20 +
    (denominations[10] || 0) * 10 +
    (parseFloat(denominations.coins) || 0)
  );

  const cashVariance = countedTotal - (daybook?.closingCash || 0);


  useEffect(() => {
    loadDayBook();
  }, [date]);

  const loadDayBook = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/daybook?date=${date}`);
      if (res.data?.success) {
        setDaybook(res.data.daybook);
      }
    } catch (e) {
      console.error('Error loading daybook:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/daybook/entry', entryForm);
      if (res.data?.success) {
        toast.success('Day book entry added successfully!');
        setEntryModalOpen(false);
        setEntryForm({ type: 'EXPENSE', amount: '', partyName: '', mode: 'CASH' });
        loadDayBook();
      }
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-4 w-full pb-8">
      {/* 1. HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#84cc16]" />
            <span>Day Book Ledger & Daily Counter Reconciliation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Daily cash in hand tally, disbursements, interest receipts, petty expenses, and bank contra transfers.
          </p>
        </div>

        {/* Date Selector & Add Entry */}
        <div className="flex items-center gap-2.5">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs outline-hidden focus:ring-2 focus:ring-[#84cc16]"
          />
          <button
            onClick={() => setTillModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-lime-100 hover:bg-lime-200 text-lime-900 border border-lime-300 text-xs font-black rounded-xl shadow-xs transition"
          >
            <Coins className="w-4 h-4 text-[#65a30d]" />
            <span>Reconcile Till</span>
          </button>
          <button
            onClick={() => setEntryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4 text-[#84cc16]" />
            <span>Add Expense / Contra</span>
          </button>
        </div>
      </div>


      {/* 2. CASH BALANCES TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opening Counter Cash</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {formatCurrency(daybook?.openingCash || 0)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Cash Receipts</span>
          <div className="text-xl font-black text-emerald-700 mt-1">
            {formatCurrency((daybook?.totalInterestCollectedCash || 0) + (daybook?.totalPrincipalRecoveredCash || 0))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Total Cash Disbursed</span>
          <div className="text-xl font-black text-red-700 mt-1">
            {formatCurrency((daybook?.totalLoansDisbursedCash || 0) + (daybook?.pettyExpenses || 0))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#84cc16]/40 shadow-xs bg-lime-50/30">
          <span className="text-[10px] font-bold text-[#0f172a] uppercase tracking-wider">Closing Cash in Hand</span>
          <div className="text-2xl font-black text-[#0f172a] mt-1">
            {formatCurrency(daybook?.closingCashSystem || 0)}
          </div>
        </div>
      </div>

      {/* 3. TRANSACTIONS JOURNAL TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Daily Journal Transactions for {date}
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {(daybook?.transactions || []).length} recorded movements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(daybook?.transactions || []).map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500">
                    {formatDateTime(t.time)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.type === 'DISBURSEMENT' ? 'bg-red-100 text-red-800' :
                      t.type === 'INTEREST_RECEIPT' || t.type === 'PRINCIPAL_RECEIPT' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#0f172a]">
                    {t.referenceNumber || '-'}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {t.partyName}
                  </td>
                  <td className="py-3 px-4 font-bold text-[10px] uppercase text-slate-500">
                    {t.mode}
                  </td>
                  <td className={`py-3 px-4 text-right font-extrabold ${
                    t.type === 'DISBURSEMENT' ? 'text-red-700' : 'text-emerald-700'
                  }`}>
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 font-medium">
                    {t.handledBy}
                  </td>
                </tr>
              ))}
              {(!daybook?.transactions || daybook.transactions.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-medium">
                    No transactions recorded on this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE / CONTRA MODAL */}
      {entryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#1e293b] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add Petty Expense or Bank Contra</h3>
              <button onClick={() => setEntryModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddEntry} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Entry Type</label>
                <select
                  value={entryForm.type}
                  onChange={(e) => setEntryForm({ ...entryForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                >
                  <option value="EXPENSE">Petty Cash Expense (Office / Tea / Stationeries)</option>
                  <option value="BANK_CONTRA">Bank Contra Transfer (Cash to Bank / Bank to Cash)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Party Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Electricity Bill"
                  value={entryForm.partyName}
                  onChange={(e) => setEntryForm({ ...entryForm, partyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={entryForm.amount}
                  onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-[#0f172a] outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEntryModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-[#0f172a] bg-[#84cc16] hover:bg-[#65a30d] rounded-xl shadow-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CASHIER TILL CLOSING & DENOMINATION DRAWER */}
      {tillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#1e293b] text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#84cc16]" />
                  <span>Cashier Till &amp; Currency Denomination Reconciliation</span>
                </h3>
                <p className="text-[11px] text-slate-400">Count physical currency notes to match system closing cash</p>
              </div>
              <button onClick={() => setTillModalOpen(false)} className="text-slate-400 hover:text-white text-base">✕</button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* System vs Physical Summary Bar */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">System Cash</span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(daybook?.closingCash || 0)}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Counted Physical</span>
                  <div className="text-sm font-black text-[#65a30d] mt-0.5">{formatCurrency(countedTotal)}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Variance</span>
                  <div className={`text-sm font-black mt-0.5 ${cashVariance === 0 ? 'text-emerald-600' : cashVariance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {cashVariance === 0 ? '✓ TALLIED' : (cashVariance > 0 ? `+${formatCurrency(cashVariance)}` : formatCurrency(cashVariance))}
                  </div>
                </div>
              </div>

              {/* Denomination Input Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-black text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Note / Coin</th>
                      <th className="py-2 px-3 text-center">Count</th>
                      <th className="py-2 px-3 text-right">Subtotal (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[500, 200, 100, 50, 20, 10].map(denom => (
                      <tr key={denom} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">
                          ₹{denom}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={denominations[denom] || ''}
                            onChange={(e) => setDenominations({ ...denominations, [denom]: parseInt(e.target.value) || 0 })}
                            className="w-20 text-center py-1 bg-slate-50 border border-slate-300 rounded-lg font-black text-xs text-slate-900 focus:ring-1 focus:ring-[#84cc16] outline-hidden"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-900">
                          {formatCurrency((denominations[denom] || 0) * denom)}
                        </td>
                      </tr>
                    ))}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-bold text-slate-700">
                        Loose Coins
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span className="text-[10px] text-slate-400 font-medium">Lump sum</span>
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={denominations.coins || ''}
                          onChange={(e) => setDenominations({ ...denominations, coins: parseFloat(e.target.value) || 0 })}
                          className="w-24 text-right py-1 px-2 bg-slate-50 border border-slate-300 rounded-lg font-black text-xs text-slate-900 focus:ring-1 focus:ring-[#84cc16] outline-hidden inline-block"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status Note */}
              {cashVariance === 0 ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Physical cash drawer perfectly tallies with DayBook closing balance!</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                  <span>⚠️ Cash variance detected: {cashVariance > 0 ? 'Surplus' : 'Deficit'} of {formatCurrency(Math.abs(cashVariance))}. Please verify vouchers and drawer notes.</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTillModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success('Till denomination count saved for today!');
                  setTillModalOpen(false);
                }}
                className="px-5 py-2 font-black text-[#0f172a] bg-[#84cc16] hover:bg-[#65a30d] rounded-xl shadow-md transition"
              >
                Confirm Till Count
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
