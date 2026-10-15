import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Coins,
  Receipt,
  FileText,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Gavel,
  Users,
  BookOpen,
  TrendingUp,
  BarChart3,
  Printer,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  Sparkles,
  PlusCircle,
  HelpCircle,
  Clock,
  Bell,
  MessageSquare,
  ArrowUpRight,
  Landmark,
  Eye,
  Edit3,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { logScreenVisit } from '../services/api';
import logo from '../assets/logo.png';
import { formatCurrency } from '../utils/formatters';
import LoanDetailDrawer from './LoanDetailDrawer';
import CommandPalette from './CommandPalette';
import { Search } from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'CORE OPERATIONS',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, screenKey: 'dashboard' },
      { name: 'New Pawn Entry', path: '/new-pawn', icon: PlusCircle, screenKey: 'newPawn', highlight: true },
      { name: 'Loan Registry', path: '/pawn-list', icon: FileText, screenKey: 'pawnList' },
      { name: 'Repay & Release', path: '/repayments', icon: Receipt, screenKey: 'repayments' },
      { name: 'Bank Re-Pledge', path: '/repledge', icon: Landmark, screenKey: 'repledge' },
    ]
  },
  {
    title: 'VAULT & COMPLIANCE',
    items: [
      { name: 'Customer KYC', path: '/customers', icon: Users, screenKey: 'customers' },
      { name: 'Security Vaults', path: '/vaults', icon: ShieldCheck, screenKey: 'vaultManager' },
      { name: 'Overdue & Notices', path: '/overdue', icon: AlertTriangle, screenKey: 'overdueManager' },
    ]
  },
  {
    title: 'FINANCE & SYSTEM',
    items: [
      { name: 'DayBook Ledger', path: '/daybook', icon: BookOpen, screenKey: 'daybook' },
      { name: 'Daily Metal Rates', path: '/daily-rates', icon: TrendingUp, screenKey: 'dailyRates' },
      { name: 'Reports', path: '/reports', icon: BarChart3, screenKey: 'reports' },
      { name: 'Print Designer', path: '/print-templates', icon: Printer, screenKey: 'printTemplates' },
      { name: 'Settings', path: '/settings', icon: Settings, screenKey: 'settings' }
    ]
  }
];

export default function Layout() {
  const { user, customerCode, shopConfig, branches, currentBranch, switchBranch, logout, isScreenPermitted, isRegistered, updateUser } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('pb_sidebar_collapsed') === 'true');
  // Zero-fallback clean initial state
  const [liveRates, setLiveRates] = useState({ gold22K: 0, gold24K: 0, silver: 0 });
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('pb_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Global Command Palette State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global Keyboard Hotkeys Listener (Ctrl+K, F2, F3, F4, F9)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in standard inputs unless it's Ctrl+K
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
        return;
      }

      if (isInput) return;

      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/pawn-list');
      } else if (e.key === 'F3') {
        e.preventDefault();
        navigate('/new-pawn');
      } else if (e.key === 'F4') {
        e.preventDefault();
        navigate('/repayments');
      } else if (e.key === 'F9') {
        e.preventDefault();
        navigate('/vaults');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Top Nav In-App Notification Center State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [sendingWhatsappId, setSendingWhatsappId] = useState(null);
  const [selectedNotifLoanId, setSelectedNotifLoanId] = useState(null);

  // Profile Edit Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const openProfileModal = () => {
    setEditName(user?.name || '');
    setEditMobile(user?.mobile || '');
    setEditEmail(user?.email || '');
    setEditPassword('');
    setProfileModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', {
        name: editName,
        mobile: editMobile,
        email: editEmail,
        password: editPassword || undefined
      });
      if (res.data?.success) {
        if (updateUser) updateUser(res.data.user);
        toast.success('Profile updated successfully!');
        setProfileModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to update profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingProfile(false);
    }
  };

  // Fetch live metal rates
  useEffect(() => {
    api.get('/rates').then(res => {
      if (res.data?.current) {
        setLiveRates(res.data.current);
      }
    }).catch(() => {});
  }, [location.pathname]);

  // Fetch in-app notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadNotifCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      // ignore silently if unauthenticated
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Telemetry page tracking
  useEffect(() => {
    logScreenVisit(location.pathname);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const shopName = shopConfig?.shopName || 'Sri Lakshmi Pawn Brokers';

  const handleSendWhatsapp = async (notif) => {
    try {
      setSendingWhatsappId(notif.id);
      const res = await api.post('/notifications/whatsapp-trigger', {
        loanId: notif.loanId,
        type: notif.type === 'OVERDUE_ALERT' ? 'OVERDUE' : 'UPCOMING'
      });
      if (res.data?.success && res.data.whatsappWebUrl) {
        window.open(res.data.whatsappWebUrl, '_blank');
      }
    } catch (err) {
      toast.error('Failed to trigger WhatsApp message: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingWhatsappId(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-[#0f172a] overflow-hidden">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-[#0f172a] text-white flex-shrink-0 shadow-2xl border-r border-[#1e293b] transition-all duration-300 ease-in-out`}>
        {/* Brand Header */}
        <div className="p-3.5 border-b border-[#1e293b] bg-[#020617] flex items-center justify-between">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'gap-2.5 min-w-0'}`}>
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md flex-shrink-0 border border-slate-700/50">
              <img src={logo} alt="Renic Tech Logo" className="w-full h-full object-contain" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm tracking-wide text-white truncate leading-tight">
                  {shopName}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#84cc16] text-[#0f172a] px-1.5 py-0.5 rounded">
                    PawnBook Pro
                  </span>
                  <span className="text-[10px] text-slate-400 truncate font-mono">
                    {customerCode}
                  </span>
                </div>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Collapse Menu"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!sidebarCollapsed ? (
                <div className="px-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              ) : (
                <div className="h-px bg-slate-800 my-2 mx-1" />
              )}
              {section.items.map(item => {
                const isSettings = item.screenKey === 'settings';
                const isLockedByReg = !isRegistered && !isSettings;
                const permitted = isScreenPermitted(item.screenKey) && !isLockedByReg;
                const IconComponent = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `flex items-center ${sidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-xl text-xs font-semibold transition-all duration-150 relative group ${
                        isActive
                          ? 'bg-[#84cc16] text-[#0f172a] shadow-md font-extrabold'
                          : item.highlight
                          ? 'bg-[#1e293b] text-lime-400 hover:bg-[#334155]'
                          : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
                      }`
                    }
                  >
                    <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                      <IconComponent className="w-4 h-4 flex-shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <>
                        {isLockedByReg ? (
                          <span className="text-[9px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                            🔒 LOCK
                          </span>
                        ) : !isRegistered && isSettings ? (
                          <span className="text-[9px] bg-amber-400 text-[#0f172a] px-1.5 py-0.5 rounded font-bold animate-pulse">
                            ACTIVATE
                          </span>
                        ) : !permitted ? (
                          <span className="text-[9px] bg-red-950 text-red-300 px-1 py-0.5 rounded font-mono">
                            LOCKED
                          </span>
                        ) : null}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#1e293b] bg-[#020617]">
          <div className={`flex items-center ${sidebarCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
            <div
              onClick={openProfileModal}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2 min-w-0'} cursor-pointer hover:opacity-80 transition group flex-1`}
              title="Click to Edit Profile & Change Name"
            >
              <div className="w-8 h-8 rounded-full bg-[#84cc16] text-[#0f172a] flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                    <span>{user?.name || 'Staff User'}</span>
                    <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.role || 'Operator'}</div>
                </div>
              )}
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP NAVIGATION & LIVE MARKET RATE TICKER */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 lg:px-6 flex-shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Expand / Collapse Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
              title={sidebarCollapsed ? "Expand Sidebar Menu" : "Collapse Sidebar Menu"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5 text-slate-900" /> : <PanelLeftClose className="w-5 h-5 text-slate-900" />}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200"
              title="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
            </button>

            {/* Mobile Slide-Out Drawer Overlay */}
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="relative flex flex-col w-72 max-w-[80vw] bg-[#0f172a] text-white h-full shadow-2xl z-10 overflow-hidden">
                  {/* Drawer Header */}
                  <div className="p-4 border-b border-[#1e293b] bg-[#020617] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0">
                        <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-extrabold text-xs text-white truncate">{shopName}</h2>
                        <span className="text-[10px] font-bold text-lime-400 font-mono block">{customerCode}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Navigation List */}
                  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                    {NAV_SECTIONS.map((section, sIdx) => (
                      <div key={sIdx} className="space-y-1">
                        <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {section.title}
                        </div>
                        {section.items.map(item => {
                          const isSettings = item.screenKey === 'settings';
                          const isLockedByReg = !isRegistered && !isSettings;
                          const permitted = isScreenPermitted(item.screenKey) && !isLockedByReg;
                          const IconComponent = item.icon;

                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                                  isActive
                                    ? 'bg-[#84cc16] text-[#0f172a] font-extrabold shadow-md'
                                    : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
                                }`
                              }
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <IconComponent className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{item.name}</span>
                              </div>
                              {isLockedByReg && (
                                <span className="text-[9px] bg-red-950 text-red-300 px-1 py-0.5 rounded font-mono font-bold">
                                  🔒 LOCK
                                </span>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Drawer Footer Profile */}
                  <div className="p-3 border-t border-[#1e293b] bg-[#020617] flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#84cc16] text-[#0f172a] flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{user?.name || 'Staff User'}</div>
                        <div className="text-[10px] text-slate-400 truncate">{user?.role || 'Operator'}</div>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b]"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Live Gold & Silver Ticker */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
              <button
                type="button"
                onClick={() => navigate('/daily-rates')}
                title="Click to update daily benchmark rates"
                className="flex items-center gap-1.5 bg-lime-50 hover:bg-lime-100/80 border border-lime-400/50 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition group"
              >
                <span className="text-lime-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#84cc16]" />
                  22K Gold:
                </span>
                <span className="text-[#0f172a] font-black group-hover:text-lime-900">
                  {liveRates.gold22K > 0 ? `${formatCurrency(liveRates.gold22K)}/g` : 'Set Rate'}
                </span>
              </button>
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium">
                <span className="text-amber-700 font-bold">24K:</span>
                <span className="text-slate-800 font-bold">
                  {liveRates.gold24K > 0 ? `${formatCurrency(liveRates.gold24K)}/g` : '—'}
                </span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium">
                <span className="text-slate-500 font-bold">Silver:</span>
                <span className="text-slate-800 font-bold">
                  {liveRates.silver > 0 ? `${formatCurrency(liveRates.silver)}/g` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Options: Search, Notification Bell, Branch Selector & Tenant ID */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* GLOBAL COMMAND PALETTE LAUNCHER (Ctrl + K) */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold border border-slate-200 transition shadow-2xs"
              title="Search loans, customers, or execute actions (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline text-slate-700">Quick Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-slate-500 border border-slate-300 rounded shadow-2xs">
                Ctrl K
              </kbd>
            </button>

            {/* TOP NAVIGATION NOTIFICATION BELL 🔔 */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200 shadow-2xs"
                title="Repayment & Overdue Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Drawer */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">Loan Repayment Alerts</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Upcoming maturities &amp; overdue demand</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-lime-100 text-lime-800">
                      {unreadNotifCount} active
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-500 opacity-60" />
                        <p className="font-bold text-slate-700">All caught up!</p>
                        <p className="text-[11px]">No loans due for repayment right now.</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs transition ${
                            notif.type === 'OVERDUE_ALERT' ? 'bg-red-50/40 hover:bg-red-50/70' : 'bg-lime-50/20 hover:bg-lime-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className={`font-bold block truncate ${
                                notif.type === 'OVERDUE_ALERT' ? 'text-red-700' : 'text-slate-900'
                              }`}>
                                {notif.title}
                              </span>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                                {notif.message}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-700 whitespace-nowrap">
                              {formatCurrency(notif.totalDue)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-slate-200/60">
                            <button
                              onClick={() => {
                                setNotifDropdownOpen(false);
                                setSelectedNotifLoanId(notif.loanId);
                              }}
                              className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                              title="Inspect Loan Side Panel"
                            >
                              <Eye className="w-3 h-3 text-[#65a30d]" />
                              <span>Details</span>
                            </button>
                            <button
                              onClick={() => handleSendWhatsapp(notif)}
                              disabled={sendingWhatsappId === notif.id}
                              className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs transition"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{sendingWhatsappId === notif.id ? 'Opening...' : 'WhatsApp'}</span>
                            </button>
                            <button
                              onClick={() => {
                                setNotifDropdownOpen(false);
                                navigate(`/repayments?loanId=${notif.loanId}`);
                              }}
                              className="py-1 px-2 bg-[#84cc16] hover:bg-[#65a30d] text-[#0f172a] rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <span>Collect</span>
                              <ArrowUpRight className="w-3 h-3 text-[#0f172a]" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                    <button
                      onClick={() => {
                        setNotifDropdownOpen(false);
                        navigate('/overdue');
                      }}
                      className="text-[11px] font-bold text-lime-700 hover:underline"
                    >
                      View All Overdue Loans &amp; Statutory Notices →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Branch Switcher (HQ Admin) / Locked Badge (Sub-Branch) */}
            {branches.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 transition"
                >
                  <Building2 className="w-3.5 h-3.5 text-lime-600" />
                  <span className="hidden sm:inline truncate max-w-[120px]">
                    {currentBranch?.name || 'Main Branch'}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {branchDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Branch
                    </div>
                    {branches.map(b => (
                      <button
                        key={b._id || b.code}
                        onClick={() => {
                          switchBranch(b);
                          setBranchDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-lime-50 transition ${
                          currentBranch?.code === b.code ? 'font-bold text-[#0f172a] bg-lime-50/70' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        <span className="text-[10px] text-slate-400">{b.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Master Control Tenant Badge */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold bg-[#0f172a] text-white px-2.5 py-1 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${isRegistered ? 'bg-[#84cc16]' : 'bg-amber-400 animate-ping'}`} />
              <span>{customerCode}</span>
            </div>
          </div>
        </header>

        {/* UNREGISTERED CLIENT LOCK BANNER */}
        {!isRegistered && (
          <div className="bg-red-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md border-b border-red-800 z-20">
            <div className="flex items-center gap-2">
              <span className="text-amber-300 text-sm animate-pulse">🔒</span>
              <span>
                <strong>SaaS / PaaS Activation Required:</strong> All operational screens are locked until registered with Renic Soft Master HQ.
              </span>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="bg-amber-400 hover:bg-amber-300 text-[#0f172a] px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition shadow-sm"
            >
              Enter Client Credentials →
            </button>
          </div>
        )}

        {/* Dynamic Page Outlet Container */}
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-4 lg:p-4 pb-20 lg:pb-6 bg-[#f8fafc] flex flex-col min-h-0">
          <Outlet />
        </main>


        {/* 3. MOBILE BOTTOM ACTION BAR */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-40 shadow-lg">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold ${
                isActive ? 'text-[#84cc16]' : 'text-slate-500'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/new-pawn"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold text-[#0f172a]`
            }
          >
            <div className="w-9 h-9 rounded-full bg-[#0f172a] text-[#84cc16] flex items-center justify-center shadow-md mb-0.5 border border-[#84cc16]/40">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span>Pawn</span>
          </NavLink>
          <NavLink
            to="/pawn-list"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold ${
                isActive ? 'text-[#84cc16]' : 'text-slate-500'
              }`
            }
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span>Loans</span>
          </NavLink>
          <NavLink
            to="/repayments"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold ${
                isActive ? 'text-[#84cc16]' : 'text-slate-500'
              }`
            }
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span>Pay</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold ${
                isActive ? 'text-[#84cc16]' : 'text-slate-500'
              }`
            }
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      {/* Global Notification Loan Details Drawer */}
      <LoanDetailDrawer
        isOpen={Boolean(selectedNotifLoanId)}
        onClose={() => setSelectedNotifLoanId(null)}
        loanId={selectedNotifLoanId}
      />

      {/* EDIT PROFILE / OPERATOR NAME MODAL */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0f172a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#84cc16]" />
                <h3 className="font-bold text-sm">Edit Staff &amp; Operator Profile</h3>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Name / Manager Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Your Full Name / Store Owner"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number (Login ID) *</label>
                <input
                  type="text"
                  required
                  placeholder="10-digit mobile"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="admin@yourshop.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password (Leave blank to keep unchanged)</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 outline-hidden focus:ring-2 focus:ring-[#84cc16]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 text-xs font-black bg-[#84cc16] hover:bg-[#65a30d] text-[#0f172a] rounded-xl shadow-md transition"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}


