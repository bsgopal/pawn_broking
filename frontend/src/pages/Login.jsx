import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  Coins,
  Shield,
  FileCheck2,
  Receipt,
  MapPin,
  Mail,
  Globe,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import logo from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { login, customerCode, user, branches, currentBranch, switchBranch, oauthStatus } = useAuth();

  const [tab, setTab] = useState('signin'); // 'signin' | 'demo'
  const [mobile, setMobile] = useState(() => localStorage.getItem('pb_saved_mobile') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('pb_saved_password') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('pb_remember_me') !== 'false');
  const [autoLogin, setAutoLogin] = useState(() => localStorage.getItem('pb_auto_login') === 'true');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBranchCode, setSelectedBranchCode] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Enterprise Auto-Login: Automatically sign in on app launch if enabled and credentials saved
  useEffect(() => {
    const shouldAutoLogin = localStorage.getItem('pb_auto_login') === 'true';
    const savedMob = localStorage.getItem('pb_saved_mobile') || '9345578103';
    const savedPass = localStorage.getItem('pb_saved_password') || '123456';
    const loggedOutExplicitly = sessionStorage.getItem('pb_explicit_logout') === 'true';

    if (!user && shouldAutoLogin && savedMob && savedPass && !loggedOutExplicitly) {
      setMobile(savedMob);
      setPassword(savedPass);
      setLoading(true);
      login(savedMob, savedPass)
        .then(res => {
          if (res.success) {
            navigate('/dashboard');
          } else {
            setError(res.message || 'Auto-login failed. Please sign in manually.');
            setLoading(false);
          }
        })
        .catch(err => {
          console.warn('Auto-login error:', err);
          setLoading(false);
        });
    }
  }, [user, login, navigate]);

  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchCode) {
      setSelectedBranchCode(branches[0].code);
    }
  }, [branches]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!mobile.trim() || !password) {
      setError('Please enter both mobile number and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(mobile.trim(), password);
      if (res.success) {
        sessionStorage.removeItem('pb_explicit_logout');
        if (rememberMe) {
          localStorage.setItem('pb_saved_mobile', mobile.trim());
          localStorage.setItem('pb_saved_password', password);
          localStorage.setItem('pb_remember_me', 'true');
        } else {
          localStorage.removeItem('pb_saved_mobile');
          localStorage.removeItem('pb_saved_password');
          localStorage.setItem('pb_remember_me', 'false');
        }
        localStorage.setItem('pb_auto_login', autoLogin ? 'true' : 'false');
        navigate('/dashboard');
      } else {
        setError(res.message || 'Invalid mobile number or access password');
      }
    } catch (err) {
      setError('Login connection error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };


  const handleFillDemo = (demoMobile, demoPass) => {
    setMobile(demoMobile);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="h-screen max-h-screen w-full flex flex-col md:flex-row bg-[#f8fafc] text-[#0f172a] font-sans selection:bg-[#84cc16] selection:text-[#0f172a] overflow-hidden">
      {/* ── LEFT PANE: BRANDING, LOGO & ENTERPRISE HIGHLIGHTS ── */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e293b] text-white p-6 lg:p-10 flex-col justify-center items-center relative overflow-hidden border-r border-[#1e293b] shadow-2xl">
        {/* Ambient Decorative Background Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#84cc16]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#84cc16]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Centered Content Container */}
        <div className="relative z-10 max-w-lg w-full h-full flex flex-col justify-between py-2">
          {/* Top Header & Brand Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#84cc16] via-[#a3e635] to-[#65a30d] p-0.5 shadow-xl flex-shrink-0">
                <div className="w-full h-full bg-white rounded-[14px] p-1.5 flex items-center justify-center shadow-inner">
                  <img src={logo} alt="Renic Tech Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl tracking-tight text-white">
                    PawnBook <span className="text-[#84cc16]">Pro</span>
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest bg-[#84cc16] text-[#0f172a] px-2 py-0.5 rounded-full shadow-xs">
                    ERP 2.0
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  IDEAS | SOLUTIONS | GROWTH
                </p>
              </div>
            </div>

            {/* Hero Pitch Headline */}
            <div className="space-y-1.5">
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight tracking-tight">
                Jewelry Pawn Broking & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] via-[#bef264] to-[#84cc16]">
                  Gold Loan Enterprise Suite
                </span>
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Statutory RBI 75% LTV compliance, live bullion rates, automatic multi-slab interest engine, visual 12-compartment safety lockers, and instant thermal pawn tickets.
              </p>
            </div>

            {/* Feature Highlight Cards */}
            <div className="space-y-2.5 pt-1">
              {/* Feature 1 */}
              <div className="flex items-start gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs transition">
                <div className="w-8 h-8 rounded-lg bg-[#84cc16]/15 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16] flex-shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    Bullion Valuation & 75% LTV Disbursal
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Instant 22K/24K karat conversion, automatic stone weight deductions, and RBI ceiling checks.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs transition">
                <div className="w-8 h-8 rounded-lg bg-[#84cc16]/15 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16] flex-shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    12-Compartment Security Vault Matrix
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Visual safe locker allocation, barcode packet tags, and digital chain-of-custody verification.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs transition">
                <div className="w-8 h-8 rounded-lg bg-[#84cc16]/15 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16] flex-shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    Statutory Forms & Form 1/2 Notices
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Automated state pawn registers (Form A/B/C), 90-day overdue alerts, and public auction recovery books.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Company & Contact Information */}
          <div className="relative z-10 pt-3 border-t border-white/10 space-y-1 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#84cc16]" />
              <span>123, Main Road, Gobichettipalayam, Erode - 638452, TN, India</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-[#84cc16]" />
                <span>info@renictechnology.com · +91 88070 25752</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-[#84cc16]" />
                <span>www.renictechnology.com</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 pt-0.5">
              © {new Date().getFullYear()} Renic Technology. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANE: MODERN SIGN IN CARD ── */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#f8fafc] overflow-y-auto">
        <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-7 space-y-4">
          {/* Header Card Info */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-lg sm:text-xl font-black text-[#0f172a] tracking-tight">
                Counter Sign In
              </h2>
              <div className="flex items-center gap-1 bg-lime-50 text-lime-800 border border-lime-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16] animate-pulse" />
                <span>Tenant: {customerCode}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Sign in with your staff or administrator credentials to manage pledges.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-6">
            <button
              type="button"
              onClick={() => setTab('signin')}
              className={`pb-2 text-xs font-bold transition relative ${
                tab === 'signin'
                  ? 'text-[#0f172a] border-b-2 border-[#84cc16]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab('demo')}
              className={`pb-2 text-xs font-bold transition relative ${
                tab === 'demo'
                  ? 'text-[#0f172a] border-b-2 border-[#84cc16]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Demo Credentials
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-shake">
              <ShieldCheck className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'signin' ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Branch Selector */}
              {branches && branches.length > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Operating Branch
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      value={selectedBranchCode}
                      onChange={(e) => {
                        setSelectedBranchCode(e.target.value);
                        const b = branches.find(item => item.code === e.target.value);
                        if (b) switchBranch(b);
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#84cc16] focus:outline-none"
                    >
                      {branches.map(b => (
                        <option key={b.code} value={b.code}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Mobile Number Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mobile Number / Staff ID *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="Enter mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#84cc16] focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Access Password / PIN *
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#84cc16] focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Auto-Login Checkboxes */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 text-[11px]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#84cc16] focus:ring-[#84cc16] border-slate-300"
                    />
                    <span>Remember credentials on this device</span>
                  </label>
                </div>
                <div className="flex items-center justify-between text-xs bg-lime-50/70 p-2 rounded-xl border border-lime-200">
                  <label className="flex items-center gap-2 cursor-pointer font-extrabold text-[#0f172a] text-[11px]">
                    <input
                      type="checkbox"
                      checked={autoLogin}
                      onChange={(e) => {
                        setAutoLogin(e.target.checked);
                        if (e.target.checked) setRememberMe(true);
                      }}
                      className="w-4 h-4 rounded text-[#84cc16] focus:ring-[#84cc16] border-slate-300"
                    />
                    <span className="flex items-center gap-1">
                      ⚡ <strong>Instant Auto-Login on Launch</strong>
                    </span>
                  </label>
                  <span className="text-[9px] text-lime-800 font-bold bg-lime-200/60 px-1.5 py-0.5 rounded">
                    Fast POS Mode
                  </span>
                </div>
              </div>


              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#84cc16] hover:bg-[#65a30d] text-[#0f172a] font-extrabold text-xs rounded-xl shadow-md shadow-lime-500/20 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 tracking-wide cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0f172a]" />
                    <span>Authenticating Staff...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Counter</span>
                    <ArrowRight className="w-4 h-4 text-[#0f172a]" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Quick Access & Demo Cards */
            <div className="space-y-2.5 pt-1">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Click any profile below to immediately fill credentials:
              </p>

              <button
                type="button"
                onClick={() => {
                  handleFillDemo('9345578103', '123456');
                  setTab('signin');
                }}
                className="w-full p-2.5 bg-lime-50/60 hover:bg-lime-100/80 border border-lime-300 rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-lime-600" />
                    <span>Branch Head / Administrator</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Mobile: <strong>9345578103</strong> · PIN: <strong>123456</strong>
                  </div>
                </div>
                <span className="text-xs font-bold text-lime-700 group-hover:translate-x-1 transition">
                  Use →
                </span>
              </button>
            </div>
          )}

          {/* Footer Security Badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck className="w-3 h-3" />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <span>Renic Soft OAuth 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
