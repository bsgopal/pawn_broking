import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Box,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  PlusCircle,
  Trash2,
  Edit2,
  X,
  Layers,
  Building2,
  ArrowLeft,
  Search,
  User,
  Phone,
  MessageSquare,
  Printer,
  Receipt,
  RotateCcw,
  Camera,
  ZoomIn,
  MapPin,
  Percent,
  Coins,
  ChevronRight,
  Filter,
  CheckSquare
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatWeight, formatDate, formatDateTime } from '../utils/formatters';
import PrintVoucherModal from '../components/PrintVoucherModal';

export default function VaultManager() {
  const { toast, confirmModal } = useToast();

  // Data State
  const [vaults, setVaults] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);

  // Filter & Selection State
  const [selectedSafeName, setSelectedSafeName] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  
  // selectedCompartment starts strictly as null (1-column full table on initial view)
  const [selectedCompartment, setSelectedCompartment] = useState(null);

  // Progressive Drilldown State: Level 2 active loan
  const [selectedDrillLoanId, setSelectedDrillLoanId] = useState(null);
  const [drillLoanData, setDrillLoanData] = useState(null);
  const [drillCustomer, setDrillCustomer] = useState(null);
  const [drillRepayments, setDrillRepayments] = useState([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [boxPacketSearch, setBoxPacketSearch] = useState('');

  // Active Detail Tab in Level 2
  const [activeDrillTab, setActiveDrillTab] = useState('overview'); // 'overview' | 'collateral' | 'kyc' | 'ledger'

  // Image Lightbox
  const [zoomImage, setZoomImage] = useState(null);

  // Print Slip Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState('');

  // New Vault Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newVaultName, setNewVaultName] = useState('Main Vault Safe A');
  const [customVaultName, setCustomVaultName] = useState('');
  const [numberOfBoxes, setNumberOfBoxes] = useState(6);
  const [capacityPerBox, setCapacityPerBox] = useState(15);
  const [securityLevel, setSecurityLevel] = useState('MAXIMUM');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadVaults();
  }, []);

  // When selectedDrillLoanId changes, fetch full details for Level 2 view
  useEffect(() => {
    if (selectedDrillLoanId) {
      fetchDrillLoanDetails(selectedDrillLoanId);
    } else {
      setDrillLoanData(null);
      setDrillCustomer(null);
      setDrillRepayments([]);
    }
  }, [selectedDrillLoanId]);

  const loadVaults = async (maintainSelection = false) => {
    setLoading(true);
    try {
      const res = await api.get('/vaults');
      if (res.data?.success) {
        const list = res.data.vaults || [];
        setVaults(list);
        setSummary(res.data.summary || {});

        if (list.length > 0 && maintainSelection && selectedCompartment) {
          const updatedSelected = list.find(v => v._id === selectedCompartment._id);
          if (updatedSelected) {
            setSelectedCompartment(updatedSelected);
          }
        }
      }
    } catch (err) {
      console.error('Error loading vaults:', err);
      toast.error('Failed to load vault matrix: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchDrillLoanDetails = async (loanId) => {
    setDrillLoading(true);
    try {
      const res = await api.get(`/loans/${loanId}`);
      if (res.data?.success) {
        setDrillLoanData(res.data.loan);
        setDrillCustomer(res.data.customer);
        setDrillRepayments(res.data.repayments || []);
      }
    } catch (err) {
      console.error('Error loading deep loan details:', err);
      toast.error('Could not load loan details: ' + (err.response?.data?.message || err.message));
    } finally {
      setDrillLoading(false);
    }
  };

  const handleAudit = async (vaultId) => {
    setAuditing(true);
    try {
      const res = await api.post(`/vaults/${vaultId}/audit`);
      if (res.data?.success) {
        toast.success('Compartment physical audit verified successfully.');
        loadVaults(true);
      }
    } catch (e) {
      toast.error('Audit error: ' + (e.response?.data?.message || e.message));
    } finally {
      setAuditing(false);
    }
  };

  const handleCreateVault = async (e) => {
    e.preventDefault();
    const finalVaultName = newVaultName === 'CUSTOM' ? (customVaultName.trim() || 'Custom Vault Safe') : newVaultName;
    setCreating(true);
    try {
      const res = await api.post('/vaults', {
        vaultName: finalVaultName,
        numberOfBoxes: Number(numberOfBoxes),
        capacityPerBox: Number(capacityPerBox),
        securityLevel
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Vault compartments created successfully!');
        setCreateModalOpen(false);
        loadVaults(false);
      }
    } catch (e) {
      toast.error('Failed to create vault: ' + (e.response?.data?.message || e.message));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBox = async (boxId, compNo) => {
    const confirmed = await confirmModal({
      title: `Delete Safe Box #${compNo}?`,
      message: `Are you sure you want to delete Box #${compNo}? This action is permanent and only permitted for empty boxes with 0 pledged items.`,
      confirmText: 'Delete Box',
      cancelText: 'Cancel',
      confirmColor: 'red'
    });
    if (!confirmed) return;

    try {
      const res = await api.delete(`/vaults/${boxId}`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Box deleted successfully');
        if (selectedCompartment?._id === boxId) {
          setSelectedCompartment(null);
          setSelectedDrillLoanId(null);
        }
        loadVaults(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cannot delete box: ' + e.message);
    }
  };

  const handlePrintSlip = () => {
    if (!drillLoanData) return;
    const itemsRows = (drillLoanData.items || []).map((it, idx) => `
      <tr>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px; border: 1px solid #ddd;"><strong>${it.itemType || 'Gold Item'}</strong> (${it.karat || '22K'})<br/><small style="color: #666;">${it.description || 'Pledged Gold Ornaments'}</small></td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${it.quantity || 1}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${formatWeight(it.grossWeight)}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${formatWeight(it.netWeight)}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(it.itemValuation || 0)}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111; max-width: 650px; margin: 0 auto; line-height: 1.4;">
        <div style="text-align: center; border-bottom: 2px solid #84cc16; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; color: #0f172a;">PAWNBROKERS VAULT CUSTODY CERTIFICATE</h2>
          <p style="margin: 4px 0 0; font-size: 11px; color: #555;">Secured Physical Strongroom Custody &amp; Tamper-Evident Seal Verification</p>
        </div>

        <table style="width: 100%; font-size: 12px; margin-bottom: 16px;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <strong>PLEDGE TICKET #:</strong> ${drillLoanData.ticketNumber}<br/>
              <strong>Date Pledged:</strong> ${formatDate(drillLoanData.loanDate || drillLoanData.createdAt)}<br/>
              <strong>Vault Safe:</strong> ${selectedCompartment?.vaultName || 'Main Safe A'}<br/>
              <strong>Compartment Box:</strong> #${selectedCompartment?.compartmentNo || drillLoanData.vaultCompartment?.compartmentNo || 'A-1'}<br/>
              <strong>Security Level:</strong> ${selectedCompartment?.securityLevel || 'MAXIMUM'}
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <strong>CUSTOMER / BORROWER:</strong><br/>
              <strong>${drillCustomer?.name || drillLoanData.customerName || 'Customer'}</strong><br/>
              Phone: ${drillCustomer?.mobile || drillLoanData.customerMobile || 'N/A'}<br/>
              Address: ${drillCustomer?.address || 'N/A'}<br/>
              ID Proof: ${drillCustomer?.idNumber || 'Verified KYC'}
            </td>
          </tr>
        </table>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 16px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span><strong>Principal Sanctioned:</strong> ${formatCurrency(drillLoanData.principal)}</span>
            <span><strong>Monthly Interest Rate:</strong> ${drillLoanData.monthlyInterestRate}% / mo</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span><strong>Total Net Gold Weight:</strong> ${formatWeight(drillLoanData.totalNetWeight)}</span>
            <span><strong>Appraised Market Value:</strong> ${formatCurrency(drillLoanData.totalValuation || 0)}</span>
          </div>
        </div>

        <h4 style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #334155;">Pledged Gold Ornaments Inventory Details</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px;">
          <thead>
            <tr style="background: #e2e8f0; color: #1e293b;">
              <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">#</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1;">Article Description</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Qty</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">Gross Wt</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">Net Wt</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">Valuation</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 11px;">
          <div style="text-align: center; width: 160px; border-top: 1px solid #888; padding-top: 4px;">
            <strong>Vault Officer / Custodian</strong><br/>Signature &amp; Stamp
          </div>
          <div style="text-align: center; width: 160px; border-top: 1px solid #888; padding-top: 4px;">
            <strong>Customer / Borrower</strong><br/>Signature
          </div>
        </div>
      </div>
    `;
    setPrintHtml(html);
    setPrintModalOpen(true);
  };

  const handleWhatsAppCustomer = () => {
    if (!drillCustomer?.mobile && !drillLoanData?.customerMobile) {
      toast.error('No customer mobile number available');
      return;
    }
    const mobile = (drillCustomer?.mobile || drillLoanData.customerMobile).replace(/[^0-9]/g, '');
    const cleanMobile = mobile.length === 10 ? '91' + mobile : mobile;
    const text = encodeURIComponent(
      `Hello ${drillCustomer?.name || drillLoanData?.customerName}, this is regarding your Gold Loan Ticket #${drillLoanData?.ticketNumber}. Your pledged collateral of ${formatWeight(drillLoanData?.totalNetWeight)} is safely stored in our insured vault under Box #${selectedCompartment?.compartmentNo || 'A'}. Thank you for banking with us.`
    );
    window.open(`https://wa.me/${cleanMobile}?text=${text}`, '_blank');
  };

  // Unique Safe Names for tabs
  const uniqueSafeNames = Array.from(new Set(vaults.map(v => v.vaultName || 'Main Vault Safe A'))).filter(Boolean);

  const filteredVaults = vaults.filter(v => {
    const matchesSafe = selectedSafeName === 'ALL' || (v.vaultName || 'Main Vault Safe A') === selectedSafeName;
    const matchesSearch = !searchFilter ||
      String(v.compartmentNo).includes(searchFilter) ||
      (v.vaultName || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (v.securityLevel || '').toLowerCase().includes(searchFilter.toLowerCase());
    return matchesSafe && matchesSearch;
  });

  // Packets inside active selected compartment
  const compartmentLoans = (selectedCompartment?.loans || []).filter(l => {
    if (!boxPacketSearch) return true;
    const q = boxPacketSearch.toLowerCase();
    return (
      (l.ticketNumber || '').toLowerCase().includes(q) ||
      (l.customerName || '').toLowerCase().includes(q) ||
      (l.customerMobile || '').toLowerCase().includes(q) ||
      (l.itemsSummary || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3.5 w-full pb-6">
      {/* 1. HEADER & KPI SUMMARY BAR */}

      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#84cc16]" />
              <span>High-Security Vault &amp; Locker Inventory Matrix</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Physical strongroom safes, compartment boxes, packet custody allocation, and collateral audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <PlusCircle className="w-4 h-4 text-[#84cc16]" />
              <span>Create Safe / Add Box</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Vault Capacity</div>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {summary.totalItemsOccupied || 0} / {summary.totalCapacity || 180} <span className="text-[11px] font-normal text-slate-500">Packets</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across {summary.totalCompartments || vaults.length} Compartment Boxes</div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pledged Gold Stored</div>
            <div className="text-base sm:text-lg font-black text-amber-700 mt-0.5">
              {formatWeight(summary.totalPledgedGoldGrams || 0)}
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Tamper-Evident Sealed</div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collateral Market Valuation</div>
            <div className="text-base sm:text-lg font-black text-[#0f172a] mt-0.5">
              {formatCurrency(summary.totalPledgedValuation || 0)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Appraised Value</div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safes &amp; Strongrooms</div>
            <div className="text-base sm:text-lg font-black text-[#65a30d] mt-0.5">
              {uniqueSafeNames.length} Active Safes
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Bio-Metric Verified</div>
          </div>
        </div>
      </div>

      {/* 2. PROGRESSIVE MASTER-DETAIL ARCHITECTURE */}
      {!selectedCompartment ? (
        /* =========================================================================
           SCREEN 1: 1 FULL COLUMN - ALL VAULT SAFES & BOXES TABLE
           ========================================================================= */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Table Control Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            {/* Safe Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => setSelectedSafeName('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedSafeName === 'ALL'
                    ? 'bg-[#0f172a] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All Safes ({vaults.length})
              </button>
              {uniqueSafeNames.map(name => (
                <button
                  key={name}
                  onClick={() => setSelectedSafeName(name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                    selectedSafeName === name
                      ? 'bg-[#0f172a] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Lock className="w-3 h-3 text-[#84cc16]" />
                  <span>{name}</span>
                </button>
              ))}
            </div>

            {/* Search Box Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by box #, safe, security..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden"
              />
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">Safe &amp; Compartment Box</th>
                  <th className="py-3 px-4">Security Level</th>
                  <th className="py-3 px-4 text-center">Occupancy &amp; Capacity</th>
                  <th className="py-3 px-4 text-right">Gold Weight (Gross / Net)</th>
                  <th className="py-3 px-4 text-right">Total Valuation</th>
                  <th className="py-3 px-4 text-center">Audit Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-2 font-medium">
                        <div className="w-5 h-5 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
                        <span>Loading vault matrix...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredVaults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No vault boxes match your search filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVaults.map((v) => {
                    const occCount = v.currentItems || (v.loans || []).length || 0;
                    const occPct = (occCount / (v.capacity || 15)) * 100;

                    return (
                      <tr
                        key={v._id}
                        onClick={() => {
                          setSelectedCompartment(v);
                          if (v.loans && v.loans.length > 0) {
                            setSelectedDrillLoanId(v.loans[0].loanId);
                          } else {
                            setSelectedDrillLoanId(null);
                          }
                        }}
                        className="cursor-pointer hover:bg-lime-50/60 transition group border-l-4 border-l-transparent hover:border-l-[#84cc16]"
                      >
                        <td className="py-3 px-4">
                          <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                            <Box className="w-4 h-4 text-[#65a30d]" />
                            <span>Box #{v.compartmentNo}</span>
                            <span className="text-slate-400 text-xs font-normal">({v.vaultName || 'Main Safe A'})</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Auto-allocated ID: {v._id?.slice(-8)}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">
                            {v.securityLevel || 'MAXIMUM'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="font-black text-slate-900 text-xs">
                            {occCount} <span className="text-[10px] font-normal text-slate-400">/ {v.capacity || 15} Packets</span>
                          </div>
                          <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden mx-auto mt-1">
                            <div
                              className={`h-full rounded-full ${occPct > 80 ? 'bg-red-600' : 'bg-[#84cc16]'}`}
                              style={{ width: `${Math.min(100, occPct)}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="font-extrabold text-amber-800 text-xs">
                            {formatWeight(v.totalNetWt || 0)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Gross: {formatWeight(v.totalGrossWt || 0)}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-black text-slate-900 text-xs">
                          {formatCurrency(v.totalValuation || 0)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{v.lastAuditDate ? formatDate(v.lastAuditDate) : 'Verified'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedCompartment(v);
                                if (v.loans && v.loans.length > 0) {
                                  setSelectedDrillLoanId(v.loans[0].loanId);
                                } else {
                                  setSelectedDrillLoanId(null);
                                }
                              }}
                              className="px-2.5 py-1 bg-lime-100 hover:bg-[#84cc16] hover:text-black text-lime-900 font-bold text-[10px] rounded-lg transition flex items-center gap-1"
                              title="Inspect Compartment Packets"
                            >
                              <span>View Packets</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => handleAudit(v._id)}
                              disabled={auditing}
                              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                              title="Audit Compartment"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>

                            {occCount === 0 && (
                              <button
                                onClick={() => handleDeleteBox(v._id, v.compartmentNo)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete Empty Box"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* =========================================================================
           SCREEN 2: 2 COLUMNS - LEFT 40% (BOX PACKETS) + RIGHT 60% (DEEP INSPECTOR)
           ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* LEFT 5 COLS (~40%): BOX PACKETS LIST WITH BACK BUTTON */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            {/* Top Bar with Back Button */}
            <div className="p-3 bg-[#0f172a] text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCompartment(null);
                    setSelectedDrillLoanId(null);
                    setBoxPacketSearch('');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-bold transition"
                  title="Return to full list of vault safes"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Vault Safes</span>
                </button>
              </div>

              <div className="text-right">
                <div className="text-xs font-black text-[#84cc16]">
                  Box #{selectedCompartment.compartmentNo}
                </div>
                <div className="text-[10px] text-slate-300">
                  {selectedCompartment.vaultName || 'Main Safe A'}
                </div>
              </div>
            </div>

            {/* Box Stats Summary Ribbon */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-1 text-center text-xs">
              <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Packets</div>
                <div className="font-extrabold text-slate-900 text-xs mt-0.5">
                  {(selectedCompartment.loans || []).length} / {selectedCompartment.capacity || 15}
                </div>
              </div>

              <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Net Gold</div>
                <div className="font-extrabold text-amber-700 text-xs mt-0.5">
                  {formatWeight(selectedCompartment.totalNetWt || 0)}
                </div>
              </div>

              <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Valuation</div>
                <div className="font-extrabold text-slate-900 text-xs mt-0.5">
                  {formatCurrency(selectedCompartment.totalValuation || 0)}
                </div>
              </div>
            </div>

            {/* Search Filter for Box Packets */}
            <div className="p-2 bg-slate-100 border-b border-slate-200">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ticket, borrower, item..."
                  value={boxPacketSearch}
                  onChange={(e) => setBoxPacketSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden"
                />
              </div>
            </div>

            {/* Customer Packets List inside Box */}
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto p-1.5 space-y-1.5">
              {compartmentLoans.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Box className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">No packets stored in this box</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pledge a new gold loan and select Box #{selectedCompartment.compartmentNo} for custody.</p>
                  <Link
                    to="/pawn/new"
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-[#84cc16] text-black font-bold rounded-lg text-xs hover:bg-[#65a30d] transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Pledge New Gold Loan</span>
                  </Link>
                </div>
              ) : (
                compartmentLoans.map((l) => {
                  const isSelected = selectedDrillLoanId === l.loanId;
                  return (
                    <div
                      key={l.loanId}
                      onClick={() => setSelectedDrillLoanId(l.loanId)}
                      className={`p-2.5 rounded-xl cursor-pointer transition border ${
                        isSelected
                          ? 'bg-lime-50/90 border-[#84cc16] ring-1 ring-[#84cc16]'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>#{l.ticketNumber}</span>
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                            {formatDate(l.loanDate)}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-[#0f172a]">
                          {formatCurrency(l.principal)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800 truncate max-w-[170px]">
                          {l.customerName || 'Borrower'}
                        </div>
                        <div className="text-[10px] font-extrabold text-amber-800">
                          {formatWeight(l.netWeight || 0)} Net
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {l.itemsSummary || 'Gold Ornaments Collateral'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT 7 COLS (~60%): DEEP CUSTOMER & COLLATERAL INSPECTOR */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[580px]">
            {drillLoading ? (
              <div className="flex-1 flex items-center justify-center py-24">
                <div className="flex items-center gap-2 font-medium text-slate-500 text-xs">
                  <div className="w-5 h-5 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
                  <span>Loading deep collateral &amp; borrower profile...</span>
                </div>
              </div>
            ) : !drillLoanData ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Box className="w-12 h-12 text-slate-300 mb-2" />
                <p className="font-extrabold text-slate-700 text-sm">Select a Packet to Inspect</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Click on any loan packet from the left list to view customer KYC photos, collateral ornaments, and audit certificates.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 p-4">
                {/* 1. BORROWER PROFILE & COLLATERAL BANNER */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Customer Photo / Avatar with Zoom */}
                    <div className="relative group">
                      {drillCustomer?.photoUrl ? (
                        <img
                          src={drillCustomer.photoUrl}
                          alt="Customer"
                          onClick={() => setZoomImage(drillCustomer.photoUrl)}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-[#84cc16] cursor-pointer shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-slate-600 font-extrabold text-base">
                          {drillCustomer?.name?.[0] || drillLoanData.customerName?.[0] || 'C'}
                        </div>
                      )}
                      {drillCustomer?.photoUrl && (
                        <div
                          onClick={() => setZoomImage(drillCustomer.photoUrl)}
                          className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                        >
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900">
                          {drillCustomer?.name || drillLoanData.customerName || 'Borrower'}
                        </h3>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                          {drillLoanData.status || 'ACTIVE'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 font-medium">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{drillCustomer?.mobile || drillLoanData.customerMobile || 'N/A'}</span>
                        </span>
                        {drillCustomer?.idNumber && (
                          <span>ID: {drillCustomer.idType || 'Govt'}: {drillCustomer.idNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Mini Badges */}
                  <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sanctioned Principal</div>
                    <div className="text-base font-black text-slate-900">
                      {formatCurrency(drillLoanData.principal)}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold">
                      @{drillLoanData.monthlyInterestRate}% / mo
                    </div>
                  </div>
                </div>

                {/* 2. ACTION TOOLBAR */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={handlePrintSlip}
                    className="px-2.5 py-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#84cc16]" />
                    <span>Print Custody Slip</span>
                  </button>

                  <button
                    onClick={handleWhatsAppCustomer}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Notice</span>
                  </button>

                  <Link
                    to="/repayments"
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Collect Repayment</span>
                  </Link>

                  <Link
                    to="/redemption"
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Redeem Loan</span>
                  </Link>
                </div>

                {/* 3. TABS NAVIGATION */}
                <div className="flex items-center gap-1 border-b border-slate-200 pb-1 text-xs font-bold">
                  <button
                    onClick={() => setActiveDrillTab('overview')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeDrillTab === 'overview'
                        ? 'bg-[#0f172a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Overview &amp; Terms
                  </button>
                  <button
                    onClick={() => setActiveDrillTab('collateral')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                      activeDrillTab === 'collateral'
                        ? 'bg-[#0f172a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Collateral &amp; Gold Photos</span>
                    <span className="px-1.5 py-0.2 bg-[#84cc16] text-black rounded-full text-[10px]">
                      {(drillLoanData.items || []).length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveDrillTab('kyc')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeDrillTab === 'kyc'
                        ? 'bg-[#0f172a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    KYC &amp; Signatures
                  </button>
                  <button
                    onClick={() => setActiveDrillTab('ledger')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeDrillTab === 'ledger'
                        ? 'bg-[#0f172a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Payment Ledger ({drillRepayments.length})
                  </button>
                </div>

                {/* 4. TAB PANELS */}
                {activeDrillTab === 'overview' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Pledge Ticket #</div>
                        <div className="font-black text-slate-900 text-xs mt-0.5">#{drillLoanData.ticketNumber}</div>
                        <div className="text-[10px] text-slate-400">Date: {formatDate(drillLoanData.loanDate || drillLoanData.createdAt)}</div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Gross Weight</div>
                        <div className="font-black text-slate-900 text-xs mt-0.5">{formatWeight(drillLoanData.totalGrossWeight)}</div>
                        <div className="text-[10px] text-slate-400">Net: {formatWeight(drillLoanData.totalNetWeight)}</div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Market Valuation</div>
                        <div className="font-black text-slate-900 text-xs mt-0.5">{formatCurrency(drillLoanData.totalValuation || 0)}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">LTV: {Math.round((drillLoanData.principal / (drillLoanData.totalValuation || 1)) * 100)}%</div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Strongroom Custody</div>
                        <div className="font-black text-slate-900 text-xs mt-0.5">
                          Box #{selectedCompartment.compartmentNo}
                        </div>
                        <div className="text-[10px] text-slate-400">{selectedCompartment.vaultName || 'Main Safe'}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-700 mb-1">Custody Seal &amp; Tamper Verification</div>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        This packet is sealed in tamper-evident barcoded gold pouch #G-{drillLoanData.ticketNumber}-V. Physical audit last verified and confirmed in {selectedCompartment.vaultName || 'Strongroom Safe A'}.
                      </p>
                    </div>
                  </div>
                )}

                {activeDrillTab === 'collateral' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(drillLoanData.items || []).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>{item.itemType || 'Gold Ornament'}</span>
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[10px] font-bold">
                                  {item.karat || '22K'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {item.description || 'Pledged ornament piece'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-slate-900 text-xs">
                                {formatCurrency(item.itemValuation || 0)}
                              </div>
                              <div className="text-[10px] text-slate-400">Appraised</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1 bg-white p-2 rounded-lg border border-slate-200 text-[11px] text-center">
                            <div>
                              <div className="text-[9px] text-slate-400 font-bold">QTY</div>
                              <div className="font-bold text-slate-800">{item.quantity || 1}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-slate-400 font-bold">GROSS</div>
                              <div className="font-bold text-slate-800">{formatWeight(item.grossWeight)}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-slate-400 font-bold">NET WT</div>
                              <div className="font-black text-amber-700">{formatWeight(item.netWeight)}</div>
                            </div>
                          </div>

                          {/* Photos if any */}
                          {item.photos && item.photos.length > 0 && (
                            <div className="flex items-center gap-2 pt-1">
                              {item.photos.map((ph, pIdx) => (
                                <div key={pIdx} className="relative group">
                                  <img
                                    src={ph}
                                    alt="Gold"
                                    onClick={() => setZoomImage(ph)}
                                    className="w-14 h-14 rounded-lg object-cover border border-slate-300 cursor-pointer shadow-xs"
                                  />
                                  <div
                                    onClick={() => setZoomImage(ph)}
                                    className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                                  >
                                    <ZoomIn className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDrillTab === 'kyc' && (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#65a30d]" />
                          <span>Borrower Identification Proof</span>
                        </div>
                        <div className="text-slate-600 space-y-1 text-xs">
                          <div><strong>Full Name:</strong> {drillCustomer?.name || drillLoanData.customerName}</div>
                          <div><strong>Phone:</strong> {drillCustomer?.mobile || drillLoanData.customerMobile}</div>
                          <div><strong>Address:</strong> {drillCustomer?.address || 'Verified on file'}</div>
                          <div><strong>ID Document:</strong> {drillCustomer?.idType || 'Aadhaar / Voter'}: {drillCustomer?.idNumber || 'Verified'}</div>
                        </div>
                        {drillCustomer?.idProofUrl && (
                          <div className="pt-2">
                            <img
                              src={drillCustomer.idProofUrl}
                              alt="ID Proof"
                              onClick={() => setZoomImage(drillCustomer.idProofUrl)}
                              className="max-h-32 rounded-lg border border-slate-300 cursor-pointer"
                            />
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#65a30d]" />
                          <span>Customer Signature &amp; Biometric</span>
                        </div>
                        {drillLoanData.customerSignature ? (
                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <img
                              src={drillLoanData.customerSignature}
                              alt="Signature"
                              onClick={() => setZoomImage(drillLoanData.customerSignature)}
                              className="max-h-24 mx-auto cursor-pointer"
                            />
                            <div className="text-[10px] text-center text-slate-400 mt-1">E-Signed on pledge authorization</div>
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                            Physical signature on pledge card register
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeDrillTab === 'ledger' && (
                  <div className="space-y-2">
                    {drillRepayments.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        <Receipt className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        No past repayment receipts recorded yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase">
                            <tr>
                              <th className="py-2 px-3">Receipt #</th>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3 text-right">Interest</th>
                              <th className="py-2 px-3 text-right">Principal</th>
                              <th className="py-2 px-3 text-right">Total Paid</th>
                              <th className="py-2 px-3 text-center">Mode</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {drillRepayments.map((rep, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-bold text-slate-800">#{rep.receiptNumber || idx + 1}</td>
                                <td className="py-2 px-3 text-slate-500">{formatDate(rep.paymentDate || rep.createdAt)}</td>
                                <td className="py-2 px-3 text-right font-semibold text-emerald-700">{formatCurrency(rep.interestAmount || 0)}</td>
                                <td className="py-2 px-3 text-right font-semibold text-slate-800">{formatCurrency(rep.principalAmount || 0)}</td>
                                <td className="py-2 px-3 text-right font-black text-slate-900">{formatCurrency(rep.totalPaid || 0)}</td>
                                <td className="py-2 px-3 text-center">
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold">
                                    {rep.paymentMode || 'CASH'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE VAULT SAFE / ADD BOX MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#0f172a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-[#84cc16]" />
                <h3 className="font-extrabold text-sm">Create New Vault Safe / Boxes</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVault} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Strongroom Safe Name</label>
                <select
                  value={newVaultName}
                  onChange={(e) => setNewVaultName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden"
                >
                  <option value="Main Vault Safe A">Main Vault Safe A</option>
                  <option value="Strongroom Safe B">Strongroom Safe B</option>
                  <option value="Locker Safe C">Locker Safe C</option>
                  <option value="High-Value Gold Locker D">High-Value Gold Locker D</option>
                  <option value="CUSTOM">+ Enter Custom Safe Name...</option>
                </select>
              </div>

              {newVaultName === 'CUSTOM' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Custom Safe Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Branch Strongroom Safe 2"
                    value={customVaultName}
                    onChange={(e) => setCustomVaultName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Number of Boxes</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={numberOfBoxes}
                    onChange={(e) => setNumberOfBoxes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Packets Capacity / Box</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={capacityPerBox}
                    onChange={(e) => setCapacityPerBox(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Security Rating</label>
                <select
                  value={securityLevel}
                  onChange={(e) => setSecurityLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#84cc16] outline-hidden"
                >
                  <option value="MAXIMUM">MAXIMUM (Bio-Metric + Dual Keypad)</option>
                  <option value="HIGH">HIGH (Locker Keyed + CCTV)</option>
                  <option value="STANDARD">STANDARD (Combination Lock)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-[#84cc16] hover:bg-[#65a30d] text-black font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  {creating ? 'Creating Boxes...' : '+ Initialize Boxes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE ZOOM LIGHTBOX */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white/5 border border-white/20 p-2 shadow-2xl">
            <img src={zoomImage} alt="Zoomed View" className="max-w-full max-h-[80vh] object-contain rounded-xl mx-auto" />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* PRINT VOUCHER MODAL */}
      <PrintVoucherModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        htmlContent={printHtml}
        title="PAWN VAULT CUSTODY CERTIFICATE"
      />
    </div>
  );
}
