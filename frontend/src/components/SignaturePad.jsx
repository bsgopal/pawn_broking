import React, { useRef, useState, useEffect } from 'react';
import {
  Edit3,
  Eraser,
  RotateCcw,
  Upload,
  Maximize2,
  CheckCircle2,
  X,
  PenTool,
  Check
} from 'lucide-react';

export default function SignaturePad({
  value,
  onChange,
  customerName = 'Borrower',
  compact = false
}) {
  const canvasRef = useRef(null);
  const modalCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStrokes, setModalStrokes] = useState([]);
  const [modalCurrentStroke, setModalCurrentStroke] = useState([]);
  const [inkColor, setInkColor] = useState('#0f172a');

  useEffect(() => {
    if (!modalOpen && canvasRef.current) {
      redrawCanvas(canvasRef.current, strokes);
    }
  }, [strokes, modalOpen]);

  useEffect(() => {
    if (modalOpen && modalCanvasRef.current) {
      redrawCanvas(modalCanvasRef.current, modalStrokes);
    }
  }, [modalStrokes, modalOpen]);

  const getCanvasPoint = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const redrawCanvas = (canvas, strokeList) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height * 0.75);
    ctx.lineTo(canvas.width - 20, canvas.height * 0.75);
    ctx.stroke();
    ctx.restore();

    strokeList.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color || '#0f172a';
      ctx.lineWidth = stroke.width || 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        const xc = (stroke.points[i].x + stroke.points[i - 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i - 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, xc, yc);
      }
      ctx.stroke();
    });
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(canvas, e);
    setIsDrawing(true);
    setCurrentStroke([pt]);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(canvas, e);
    const updated = [...currentStroke, pt];
    setCurrentStroke(updated);

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (updated.length >= 2) {
      const p1 = updated[updated.length - 2];
      const p2 = updated[updated.length - 1];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      const newStrokes = [...strokes, { points: currentStroke, color: inkColor, width: 2.5 }];
      setStrokes(newStrokes);
      if (canvasRef.current) {
        onChange(canvasRef.current.toDataURL('image/png'));
      }
    }
    setCurrentStroke([]);
  };

  const handleModalPointerDown = (e) => {
    e.preventDefault();
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(canvas, e);
    setIsDrawing(true);
    setModalCurrentStroke([pt]);
  };

  const handleModalPointerMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(canvas, e);
    const updated = [...modalCurrentStroke, pt];
    setModalCurrentStroke(updated);

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (updated.length >= 2) {
      const p1 = updated[updated.length - 2];
      const p2 = updated[updated.length - 1];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  };

  const handleModalPointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (modalCurrentStroke.length > 1) {
      const newStrokes = [...modalStrokes, { points: modalCurrentStroke, color: inkColor, width: 3.5 }];
      setModalStrokes(newStrokes);
    }
    setModalCurrentStroke([]);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    if (updated.length === 0) {
      onChange('');
    } else if (canvasRef.current) {
      redrawCanvas(canvasRef.current, updated);
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const handleModalUndo = () => {
    if (modalStrokes.length === 0) return;
    const updated = modalStrokes.slice(0, -1);
    setModalStrokes(updated);
  };

  const handleClear = () => {
    setStrokes([]);
    onChange('');
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleModalClear = () => {
    setModalStrokes([]);
    if (modalCanvasRef.current) {
      const ctx = modalCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, modalCanvasRef.current.width, modalCanvasRef.current.height);
    }
  };

  const handleSaveModalSignature = () => {
    if (modalCanvasRef.current && modalStrokes.length > 0) {
      const dataUrl = modalCanvasRef.current.toDataURL('image/png');
      onChange(dataUrl);
      setStrokes(modalStrokes);
    }
    setModalOpen(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        onChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
          <Edit3 className="w-3 h-3 text-[#65a30d]" />
          <span>Borrower Digital Signature</span>
        </label>

        <div className="flex items-center gap-1 text-[10px]">
          {value ? (
            <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              <Check className="w-2.5 h-2.5 text-emerald-600" />
              <span>Signed</span>
            </span>
          ) : (
            <span className="text-slate-400 font-medium">Touch / Stylus / Pen</span>
          )}

          <button
            type="button"
            onClick={() => {
              setModalStrokes(strokes);
              setModalOpen(true);
            }}
            className="p-1 hover:bg-slate-100 text-slate-600 rounded transition flex items-center gap-0.5 font-bold cursor-pointer"
            title="Open Large Touch Sign Pad"
          >
            <Maximize2 className="w-3 h-3 text-[#65a30d]" />
            <span className="hidden sm:inline text-[9px]">Expand</span>
          </button>

          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[9px] text-slate-400 hover:text-red-600 font-bold px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {value && !isDrawing && strokes.length === 0 ? (
        <div className="relative border border-slate-300 rounded-xl bg-white p-2 flex items-center justify-between group">
          <img
            src={value}
            alt="Borrower Signature"
            className="h-10 max-w-[200px] object-contain"
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setModalStrokes([]);
                setModalOpen(true);
              }}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
            >
              Re-Sign
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
          <canvas
            ref={canvasRef}
            width={480}
            height={90}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ touchAction: 'none' }}
            className="w-full h-14 cursor-crosshair block bg-slate-50/40"
          />

          <div className="absolute right-1.5 bottom-1.5 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-0.5 rounded-md border border-slate-200 text-[9px]">
            <button
              type="button"
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
              title="Undo stroke"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              title="Upload signature image"
            >
              <Upload className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleFileUpload}
        className="hidden"
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-3.5 bg-[#0f172a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16]">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Borrower Signature Desk</h3>
                  <p className="text-[10px] text-slate-400">
                    Sign inside the box using stylus, touch screen, or mouse pointer.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 flex flex-col items-center">
              <div className="w-full bg-white rounded-xl border-2 border-dashed border-slate-300 overflow-hidden relative shadow-inner">
                <canvas
                  ref={modalCanvasRef}
                  width={640}
                  height={220}
                  onPointerDown={handleModalPointerDown}
                  onPointerMove={handleModalPointerMove}
                  onPointerUp={handleModalPointerUp}
                  onPointerLeave={handleModalPointerUp}
                  style={{ touchAction: 'none' }}
                  className="w-full h-48 cursor-crosshair block bg-white"
                />

                <div className="absolute left-3 bottom-2 text-[10px] text-slate-400 font-mono pointer-events-none select-none">
                  ✕ Sign above the line — {customerName}
                </div>
              </div>

              <div className="w-full mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Ink:</span>
                  <button
                    type="button"
                    onClick={() => setInkColor('#0f172a')}
                    className={`w-6 h-6 rounded-full bg-[#0f172a] border-2 transition cursor-pointer ${inkColor === '#0f172a' ? 'border-[#84cc16] ring-2 ring-lime-400' : 'border-transparent'}`}
                    title="Black Ink"
                  />
                  <button
                    type="button"
                    onClick={() => setInkColor('#1d4ed8')}
                    className={`w-6 h-6 rounded-full bg-[#1d4ed8] border-2 transition cursor-pointer ${inkColor === '#1d4ed8' ? 'border-[#84cc16] ring-2 ring-lime-400' : 'border-transparent'}`}
                    title="Blue Ink"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleModalUndo}
                    disabled={modalStrokes.length === 0}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleModalClear}
                    className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-300 text-rose-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5 text-rose-600" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-medium">
                Pledged by: <strong className="text-slate-900">{customerName}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalSignature}
                  className="px-5 py-1.5 bg-[#84cc16] hover:bg-[#65a30d] text-[#0f172a] rounded-xl font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Signature</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
