import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  ShieldCheck,
  Coins,
  Calendar,
  Layers,
  FileText,
  Star,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  Receipt,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters';

export default function CustomerDetailDrawer({
  isOpen,
  onClose,
  customerId,
  initialCustomer = null,
  onSelectLoan = null
}) {
  const [customer, setCustomer] = useState(initialCustomer);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
    }
  }, [isOpen, customerId]);

  useEffect(() => {
    if (initialCustomer) {
      setCustomer(initialCustomer);
    }
  }, [initialCustomer]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/customers/${customerId}`);
      if (res.data?.success) {
        setCustomer(res.data.customer);
        setLoans(res.data.loans || []);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setError(err.response?.data?.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!customer?.mobile) return;
    const phone = customer.mobile.replace(/\D/g, '');
    const targetPhone = phone.length === 10 ? `91${phone}` : phone;
    const msg = `Hello ${customer.name}, greeting from PawnBook Pro! We are reaching out regarding your account profile and active gold pledges.`;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!isOpen) return null;

  const totalActivePrincipal = (loans || [])
    .filter(l => l.status === 'Active' || l.status === 'Overdue')
    .reduce((sum, l) => sum + (l.principalOutstanding || l.principal || 0), 0);

  const totalActiveGrams = (loans || [])
    .filter(l => l.status === 'Active' || l.status === 'Overdue')
    .reduce((sum, l) => sum + (l.totalNetWt || 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl z-50 flex flex-col transform transition-transform ease-in-out duration-300 animate-in slide-in-from-right">
        {/* Header */}
        <div className="bg-[#0f172a] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {customer?.name || 'Customer KYC Profile'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cust ID: <span className="font-mono text-slate-300">{customer?.customerCode || customer?._id?.substring(0, 8)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Close Panel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-semibold">Loading borrower profile & loan history...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {customer?.photoUrl ? (
                    <img
                      src={customer.photoUrl}
                      alt={customer.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#020617] to-[#1e293b] text-[#84cc16] flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
                      {(customer?.name || 'U').charAt(0)}
                    </div>
                  )}

                  <div className="space-y-1 text-xs flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="font-black text-base text-slate-900">{customer?.name}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>KYC Verified</span>
                      </span>
                    </div>

                    <div className="text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold text-slate-700">{customer?.mobile || 'No phone'}</span>
                    </div>

                    {customer?.address?.street && (
                      <div className="text-slate-400 flex items-center justify-center sm:justify-start gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-300" />
                        <span>{customer.address.street}, {customer.address.city} - {customer.address.pincode}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={`tel:${customer?.mobile}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Borrower</span>
                  </a>
                  <button
                    onClick={handleSendWhatsApp}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Exposure Stat Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Active Debt</div>
                  <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                    {formatCurrency(totalActivePrincipal)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Gold in Vault</div>
                  <div className="text-sm sm:text-base font-black text-[#65a30d] mt-0.5">
                    {formatWeight(totalActiveGrams)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Pledges</div>
                  <div className="text-sm sm:text-base font-black text-[#0f172a] mt-0.5">
                    {loans.length} Loans
                  </div>
                </div>
              </div>

              {/* Identity & Nominee Details */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 text-xs">
                <div className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#84cc16]" />
                  <span>Government ID & Nominee Registry</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Aadhaar Card:</span>
                    <strong className="font-mono text-slate-800">{customer?.aadhaarNumber || 'Verified'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">PAN Number:</span>
                    <strong className="font-mono text-slate-800">{customer?.panNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Nominee Name:</span>
                    <strong className="text-slate-800">{customer?.nominee?.name || 'Not provided'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Nominee Relation:</span>
                    <strong className="text-slate-800">{customer?.nominee?.relationship || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Loan History List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#84cc16]" />
                    <span>Pawn Pledges & Active Loans ({loans.length})</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Click a loan to view full details</span>
                </div>

                {loans.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    No loans on record for this customer.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {loans.map(loan => (
                      <div
                        key={loan._id}
                        onClick={() => onSelectLoan && onSelectLoan(loan._id)}
                        className="p-3.5 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#0f172a] group-hover:text-[#65a30d] transition">
                              {loan.ticketNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                loan.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : loan.status === 'Redeemed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {loan.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{formatDate(loan.loanDate)}</span>
                            <span>•</span>
                            <span>{formatWeight(loan.totalNetWt)}</span>
                            <span>•</span>
                            <span>{(loan.items || []).map(i => i.ornamentType).join(', ')}</span>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="font-extrabold text-xs text-slate-900">
                              {formatCurrency(loan.principalOutstanding || loan.principal)}
                            </div>
                            <div className="text-[10px] text-slate-400">@{loan.interestPctPerMonth}%/mo</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
