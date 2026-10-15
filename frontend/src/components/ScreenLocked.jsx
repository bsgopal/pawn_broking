import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, KeyRound, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ScreenLocked({ screenName = 'This Feature', isActivationRequired = false }) {
  const { customerCode, verifyOauth, isRegistered } = useAuth();
  const navigate = useNavigate();

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) {
      setErrorMsg('Please enter both Client ID and Client Secret.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await verifyOauth(clientId.trim(), clientSecret.trim());
    setLoading(false);
    if (res.success) {
      setSuccessMsg(res.message || 'Activated successfully!');
    } else {
      setErrorMsg(res.message || 'Invalid Client ID or Client Secret.');
    }
  };

  if (isActivationRequired && !isRegistered) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center max-w-xl mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-amber-600 mb-6 shadow-xl animate-pulse">
          <KeyRound className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 font-bold px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider mb-3">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Renic Soft SaaS / PaaS Registration Required</span>
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
          Application Locked — License Inactive
        </h2>

        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          PawnBook Pro is running in protected enterprise SaaS mode. All operational screens (Loans, Customers, Repayments, Vaults, Day Book) are locked until this client instance is activated with your <strong>Client ID</strong> &amp; <strong>Client Secret</strong> from <strong>Renic Soft Master HQ</strong>.
        </p>

        {/* Inline Fast Activation Card */}
        <div className="w-full bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-lg text-left mb-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#84cc16]" />
            <span>Enter Renic Client Credentials to Activate</span>
          </h3>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Renic Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. RC_ID_PB01_..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-[#84cc16] focus:border-lime-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Renic Client Secret
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="e.g. RC_SEC_..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-[#84cc16] focus:border-lime-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-[#0f172a] text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-[#0f172a]" /> : <KeyRound className="w-4 h-4" />}
                <span>{loading ? 'Verifying with Master HQ...' : 'Verify & Unlock All Features'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <span>Go to Settings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <ShieldAlert className="w-4 h-4 text-lime-600" />
          <span>Renic Soft Enterprise Licensing Engine & Dual-Slug Architecture</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">
        {screenName} is Locked by Renic Soft Master Control
      </h2>
      <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
        Your current SaaS plan tier for <strong className="text-slate-800 font-mono">{customerCode}</strong> does not have access to this module. Please contact your platform administrator in Renic Soft to unlock this feature.
      </p>
      <div className="flex items-center gap-2 text-xs font-semibold bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200">
        <ShieldAlert className="w-4 h-4 text-lime-600" />
        <span>Screen Governance Enforced via Renic Soft Dual-Slug Gateway</span>
      </div>
    </div>
  );
}
