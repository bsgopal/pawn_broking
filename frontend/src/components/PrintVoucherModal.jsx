import React, { useState, useEffect } from 'react';
import { X, Printer, Check, Copy } from 'lucide-react';
import { printHtmlContent, getAvailablePrinters } from '../services/printerService';
import { useAuth } from '../context/AuthContext';

export default function PrintVoucherModal({ isOpen, onClose, htmlContent, title = 'Print Pawn Receipt' }) {
  const { shopConfig } = useAuth();
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [printing, setPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      getAvailablePrinters().then(list => {
        setPrinters(list);
        if (list.length > 0) {
          const defaultP = shopConfig?.thermalPrinterName || list[0].name;
          setSelectedPrinter(defaultP);
        }
      });
      setPrintStatus(null);
    }
  }, [isOpen, shopConfig]);

  if (!isOpen) return null;

  const handlePrint = async () => {
    setPrinting(true);
    setPrintStatus(null);
    try {
      const res = await printHtmlContent(htmlContent, selectedPrinter);
      if (res.success) {
        setPrintStatus('Printed successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setPrintStatus('Print issue: ' + (res.message || 'Check printer connection'));
      }
    } catch (e) {
      setPrintStatus('Error: ' + e.message);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#1e293b] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#84cc16]" />
            <h3 className="font-extrabold text-xs tracking-wide">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printer Selection Bar */}
        {printers.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Select Printer:</span>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-[#84cc16] focus:border-lime-500 outline-hidden"
            >
              {printers.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Live Receipt HTML Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          <div
            className="bg-white p-4 rounded-xl shadow-md border border-slate-300 w-full max-w-[340px] text-xs font-mono"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs font-semibold text-emerald-600">
            {printStatus}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold text-[#0f172a] bg-[#84cc16] hover:bg-[#65a30d] rounded-lg shadow-2xs transition disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{printing ? 'Printing...' : 'Direct Silent Print'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
