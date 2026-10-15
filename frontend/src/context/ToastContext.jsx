import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  X,
  HelpCircle
} from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [promptDialog, setPromptDialog] = useState(null);
  const [promptValue, setPromptValue] = useState('');

  // 1. TOAST SYSTEM
  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration || 4500),
    warning: (msg, duration) => addToast(msg, 'warning', duration || 4000),
    info: (msg, duration) => addToast(msg, 'info', duration)
  };

  // 2. CONFIRMATION MODAL SYSTEM
  const confirmModal = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger' // 'danger' | 'warning' | 'primary' | 'success'
  }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        variant,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  // 3. PROMPT MODAL SYSTEM
  const promptModal = useCallback(({
    title = 'Input Required',
    message = 'Please enter value:',
    placeholder = '',
    defaultValue = '',
    confirmText = 'Submit',
    cancelText = 'Cancel'
  }) => {
    return new Promise((resolve) => {
      setPromptValue(defaultValue);
      setPromptDialog({
        title,
        message,
        placeholder,
        confirmText,
        cancelText,
        onConfirm: (val) => {
          setPromptDialog(null);
          resolve(val);
        },
        onCancel: () => {
          setPromptDialog(null);
          resolve(null);
        }
      });
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, confirmModal, promptModal }}>
      {children}

      {/* FLOATING TOASTS CONTAINER */}
      <div className="fixed top-4 right-4 z-70 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-200 animate-in slide-in-from-top-2 fade-in ${
                isSuccess
                  ? 'bg-slate-900/95 border-emerald-500/40 text-white'
                  : isError
                  ? 'bg-red-950/95 border-red-500/40 text-white'
                  : isWarning
                  ? 'bg-amber-950/95 border-amber-500/40 text-white'
                  : 'bg-slate-900/95 border-slate-700/50 text-white'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-lime-400" />}
                {isError && <AlertOctagon className="w-5 h-5 text-red-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-blue-400" />}
              </div>

              <div className="flex-1 text-xs font-semibold leading-snug">
                {t.message}
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-red-100 text-red-600'
                    : confirmDialog.variant === 'warning'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-lime-100 text-lime-700'
                }`}>
                  {confirmDialog.variant === 'danger' ? (
                    <AlertOctagon className="w-5 h-5" />
                  ) : confirmDialog.variant === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <HelpCircle className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={confirmDialog.onCancel}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  autoFocus
                  className={`px-5 py-2 text-xs font-black rounded-xl shadow-md transition cursor-pointer ${
                    confirmDialog.variant === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : confirmDialog.variant === 'warning'
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold'
                      : 'bg-[#0f172a] hover:bg-[#1e293b] text-white'
                  }`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT INPUT DIALOG MODAL */}
      {promptDialog && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                promptDialog.onConfirm(promptValue);
              }}
              className="p-5 sm:p-6 space-y-4"
            >
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {promptDialog.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {promptDialog.message}
                </p>
              </div>

              <input
                type="text"
                autoFocus
                value={promptValue}
                placeholder={promptDialog.placeholder}
                onChange={(e) => setPromptValue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#84cc16] focus:border-[#84cc16]"
              />

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={promptDialog.onCancel}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  {promptDialog.cancelText}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl shadow-md transition cursor-pointer"
                >
                  {promptDialog.confirmText}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
