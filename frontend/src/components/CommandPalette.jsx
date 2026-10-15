import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  User,
  ShieldCheck,
  PlusCircle,
  Receipt,
  BookOpen,
  TrendingUp,
  X,
  Sparkles,
  Coins,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ loans: [], customers: [], actions: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const staticActions = [
    { title: 'New Pawn Entry (Pledge Gold)', subtitle: 'Create loan voucher & valuation', icon: PlusCircle, path: '/new-pawn', shortcut: 'F3', color: 'text-[#84cc16]' },
    { title: 'Loan Registry & Pledges', subtitle: 'View all active & overdue loans', icon: FileText, path: '/pawn-list', shortcut: 'F2', color: 'text-blue-500' },
    { title: 'Interest Collection & Repay', subtitle: 'Post part-payment or interest', icon: Receipt, path: '/repayments', shortcut: 'F4', color: 'text-amber-500' },
    { title: 'Security Vaults & Safe Box Matrix', subtitle: 'Manage trays and packet slots', icon: ShieldCheck, path: '/vaults', shortcut: 'F9', color: 'text-emerald-500' },
    { title: 'DayBook Cash Reconciliation', subtitle: 'Counter till close & denomination', icon: BookOpen, path: '/daybook', shortcut: 'Day', color: 'text-purple-500' },
    { title: 'Daily Gold & Silver Market Rates', subtitle: 'Update today\'s benchmark rates', icon: TrendingUp, path: '/daily-rates', shortcut: 'Rates', color: 'text-amber-600' }
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ loans: [], customers: [], actions: staticActions });
      return;
    }

    const matchedActions = staticActions.filter(a =>
      a.title.toLowerCase().includes(trimmed.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(trimmed.toLowerCase())
    );

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [loanRes, custRes] = await Promise.all([
          api.get(`/loans?search=${encodeURIComponent(trimmed)}&limit=5`).catch(() => ({ data: { loans: [] } })),
          api.get(`/customers?search=${encodeURIComponent(trimmed)}&limit=5`).catch(() => ({ data: { customers: [] } }))
        ]);

        setResults({
          loans: loanRes.data?.loans || [],
          customers: custRes.data?.customers || [],
          actions: matchedActions
        });
      } catch (err) {
        console.error('Command search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Flattened items for keyboard navigation
  const allNavItems = [
    ...results.actions.map(a => ({ type: 'ACTION', data: a })),
    ...results.loans.map(l => ({ type: 'LOAN', data: l })),
    ...results.customers.map(c => ({ type: 'CUSTOMER', data: c }))
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allNavItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allNavItems.length) % Math.max(1, allNavItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allNavItems[selectedIndex];
      if (current) executeItem(current);
    }
  };

  const executeItem = (item) => {
    onClose();
    if (item.type === 'ACTION') {
      navigate(item.data.path);
    } else if (item.type === 'LOAN') {
      navigate(`/pawn-list?search=${encodeURIComponent(item.data.ticketNumber)}`);
    } else if (item.type === 'CUSTOMER') {
      navigate(`/customers?search=${encodeURIComponent(item.data.mobile || item.data.name)}`);
    }
  };

  if (!isOpen) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-[10vh] animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by ticket # (e.g. LP-1001), mobile, customer name, or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-white text-slate-500 border border-slate-300 rounded-md shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1">
          {loading && (
            <div className="p-4 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
              Searching Enterprise Ledger...
            </div>
          )}

          {/* Actions Section */}
          {results.actions.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#84cc16]" />
                <span>Quick Actions</span>
              </div>
              {results.actions.map((action) => {
                flatIndex++;
                const isSelected = selectedIndex === flatIndex;
                const Icon = action.icon;
                return (
                  <div
                    key={action.title}
                    onClick={() => executeItem({ type: 'ACTION', data: action })}
                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                    className={`px-3 py-2 rounded-xl cursor-pointer flex items-center justify-between transition ${
                      isSelected ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-slate-800 text-[#84cc16]' : 'bg-slate-100 text-slate-700'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {action.title}
                        </div>
                        <div className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {action.subtitle}
                        </div>
                      </div>
                    </div>
                    {action.shortcut && (
                      <kbd className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isSelected ? 'bg-slate-800 text-lime-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {action.shortcut}
                      </kbd>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Loans Section */}
          {results.loans.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-amber-500" />
                <span>Loan Pledges ({results.loans.length})</span>
              </div>
              {results.loans.map((loan) => {
                flatIndex++;
                const isSelected = selectedIndex === flatIndex;
                return (
                  <div
                    key={loan._id}
                    onClick={() => executeItem({ type: 'LOAN', data: loan })}
                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                    className={`px-3 py-2 rounded-xl cursor-pointer flex items-center justify-between transition ${
                      isSelected ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg font-mono font-black text-xs ${
                        isSelected ? 'bg-slate-800 text-[#84cc16]' : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        {loan.ticketNumber}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {loan.customer?.name || 'Customer'} • {formatCurrency(loan.principal)}
                        </div>
                        <div className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {loan.items?.length || 1} Ornaments • Net {loan.netWeight || 0}g • Status: {loan.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        loan.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {loan.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Customers Section */}
          {results.customers.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3 h-3 text-blue-500" />
                <span>Customers / Borrowers ({results.customers.length})</span>
              </div>
              {results.customers.map((cust) => {
                flatIndex++;
                const isSelected = selectedIndex === flatIndex;
                return (
                  <div
                    key={cust._id}
                    onClick={() => executeItem({ type: 'CUSTOMER', data: cust })}
                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                    className={`px-3 py-2 rounded-xl cursor-pointer flex items-center justify-between transition ${
                      isSelected ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-slate-800 text-[#84cc16]' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {cust.name?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {cust.name}
                        </div>
                        <div className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          📱 {cust.mobile || 'No mobile'} • {cust.city || 'Tamil Nadu'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                );
              })}
            </div>
          )}

          {allNavItems.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching loans, customers, or commands found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">ESC</kbd>
              Close
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">PawnBook Pro Core ERP</span>
        </div>

      </div>
    </div>
  );
}
