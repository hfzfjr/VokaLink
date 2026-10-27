"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Check,
  Undo2,
  RotateCcw,
  ShieldCheck,
  EyeOff,
  Square,
  Paintbrush,
  Frame,
} from "lucide-react";
import { computeSha256, type CompressedPhotoResult } from "@/lib/pwa/photo";
import { cn } from "@/lib/cn";

export type SensorShapeTool = "RECTANGLE" | "BRUSH";
export type SensorEffectMode = "PIXELATE" | "BLACKOUT";

interface PhotoPrivacyStudioModalProps {
  imageFile: File;
  onSave: (result: CompressedPhotoResult) => void;
  onClose: () => void;
}

interface ActionRecord {
  tool: SensorShapeTool;
  mode: SensorEffectMode;
  path?: { x: number; y: number }[];
  size?: number;
  rect?: { x: number; y: number; w: number; h: number };
}

export function PhotoPrivacyStudioModal({
  imageFile,
  onSave,
  onClose,
}: PhotoPrivacyStudioModalProps) {
  // Streamlined Studio settings (Kotak Area & Mozaik by default)
  const [toolShape, setToolShape] = useState<SensorShapeTool>("RECTANGLE");
  const [effectMode, setEffectMode] = useState<SensorEffectMode>("PIXELATE");
  const [brushSize] = useState<number>(36);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [actionHistory, setActionHistory] = useState<ActionRecord[]>([]);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing state
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentRef = useRef<{ x: number; y: number } | null>(null);

  // Offscreen pre-rendered layer canvases
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const pixelatedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskPixelRef = useRef<HTMLCanvasElement | null>(null);
  const maskBlackoutRef = useRef<HTMLCanvasElement | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // History stack for Undo
  const actionHistoryRef = useRef<ActionRecord[]>([]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close on Escape key press & lock body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  // Redraw helper: composites original image + mask layers onto visible canvas using zero-allocation reusable buffer
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImgRef.current;
    const compCanvas = compositeCanvasRef.current;
    if (!canvas || !img || !compCanvas) return;

    const ctx = canvas.getContext("2d");
    const compCtx = compCanvas.getContext("2d");
    if (!ctx || !compCtx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw original pristine image
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    // 2. Composite Crisp Pixelate / Mosaic Layer (Zero-allocation)
    if (maskPixelRef.current && pixelatedCanvasRef.current) {
      compCtx.clearRect(0, 0, w, h);
      compCtx.globalCompositeOperation = "source-over";
      compCtx.drawImage(pixelatedCanvasRef.current, 0, 0);
      compCtx.globalCompositeOperation = "destination-in";
      compCtx.drawImage(maskPixelRef.current, 0, 0);

      ctx.drawImage(compCanvas, 0, 0);
    }

    // 3. Composite Solid Blackout Redaction Layer
    if (maskBlackoutRef.current) {
      compCtx.clearRect(0, 0, w, h);
      compCtx.globalCompositeOperation = "source-over";
      compCtx.fillStyle = "#0f172a";
      compCtx.fillRect(0, 0, w, h);
      compCtx.globalCompositeOperation = "destination-in";
      compCtx.drawImage(maskBlackoutRef.current, 0, 0);

      ctx.drawImage(compCanvas, 0, 0);
    }
  }, []);

  // Rebuild masks from history stack
  const rebuildMasksFromHistory = useCallback(
    (history: ActionRecord[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      // Clear mask canvases
      [maskPixelRef.current, maskBlackoutRef.current].forEach((mCanvas) => {
        if (mCanvas) {
          const mCtx = mCanvas.getContext("2d");
          mCtx?.clearRect(0, 0, w, h);
        }
      });

      // Re-draw all committed actions from history
      history.forEach((record) => {
        let targetCanvas: HTMLCanvasElement | null = null;
        if (record.mode === "PIXELATE") targetCanvas = maskPixelRef.current;
        else if (record.mode === "BLACKOUT") targetCanvas = maskBlackoutRef.current;

        if (!targetCanvas) return;
        const mCtx = targetCanvas.getContext("2d");
        if (!mCtx) return;

        if (record.tool === "RECTANGLE" && record.rect) {
          mCtx.fillStyle = "rgba(0, 0, 0, 1)";
          mCtx.fillRect(record.rect.x, record.rect.y, record.rect.w, record.rect.h);
        } else if (record.tool === "BRUSH" && record.path && record.path.length > 0) {
          mCtx.lineWidth = record.size || 36;
          mCtx.lineCap = "round";
          mCtx.lineJoin = "round";
          mCtx.strokeStyle = "rgba(0, 0, 0, 1)";

          mCtx.beginPath();
          mCtx.moveTo(record.path[0]!.x, record.path[0]!.y);
          for (let i = 1; i < record.path.length; i++) {
            mCtx.lineTo(record.path[i]!.x, record.path[i]!.y);
          }
          if (record.path.length === 1) {
            mCtx.lineTo(record.path[0]!.x + 0.1, record.path[0]!.y + 0.1);
          }
          mCtx.stroke();
        }
      });

      redraw();
    },
    [redraw]
  );

  // Initialize offscreen canvases & pre-render filters
  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      if (!isMounted) return;

      // Limit max dimension to 800px for optimal performance and crisp rendering
      const maxDim = 800;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = w;
        canvas.height = h;
      }

      originalImgRef.current = img;

      // 1. Offscreen Pixelated / Mosaic Canvas (Clean intermediate buffer approach)
      const pCanvas = document.createElement("canvas");
      pCanvas.width = w;
      pCanvas.height = h;
      const pCtx = pCanvas.getContext("2d");
      if (pCtx) {
        // High quality pixelate block size
        const pixelSize = Math.max(14, Math.round(w / 38));
        const smallW = Math.max(1, Math.round(w / pixelSize));
        const smallH = Math.max(1, Math.round(h / pixelSize));
        const smallCanvas = document.createElement("canvas");
        smallCanvas.width = smallW;
        smallCanvas.height = smallH;
        const sCtx = smallCanvas.getContext("2d");
        if (sCtx) {
          sCtx.drawImage(img, 0, 0, smallW, smallH);
          pCtx.imageSmoothingEnabled = false;
          pCtx.drawImage(smallCanvas, 0, 0, w, h);
        }
      }
      pixelatedCanvasRef.current = pCanvas;

      // 2. Reusable Offscreen Composite Scratchpad (Zero-allocation redraw)
      const cCanvas = document.createElement("canvas");
      cCanvas.width = w;
      cCanvas.height = h;
      compositeCanvasRef.current = cCanvas;

      // 3. Offscreen Stroke Masks
      const makeMask = () => {
        const mc = document.createElement("canvas");
        mc.width = w;
        mc.height = h;
        return mc;
      };
      maskPixelRef.current = makeMask();
      maskBlackoutRef.current = makeMask();

      setIsLoadingImage(false);
      redraw();
    };

    img.onerror = () => {
      if (!isMounted) return;
      setIsLoadingImage(false);
      alert("Gagal memuat gambar untuk studio sensor privasi. Silakan pilih foto kembali.");
      onClose();
    };

    img.src = objectUrl;

    return () => {
      isMounted = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile, redraw, onClose]);

  // Pointer position calculator
  const getCanvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Drawing event handlers with Pointer Events API
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pos = getCanvasPos(e);

    if (toolShape === "RECTANGLE") {
      dragStartRef.current = pos;
      dragCurrentRef.current = pos;
    } else {
      // Freehand brush
      currentStrokeRef.current = [pos];

      let targetMask: HTMLCanvasElement | null = null;
      if (effectMode === "PIXELATE") targetMask = maskPixelRef.current;
      else if (effectMode === "BLACKOUT") targetMask = maskBlackoutRef.current;

      if (!targetMask) return;
      const mCtx = targetMask.getContext("2d");
      if (!mCtx) return;

      mCtx.lineWidth = brushSize;
      mCtx.lineCap = "round";
      mCtx.lineJoin = "round";
      mCtx.strokeStyle = "rgba(0,0,0,1)";

      mCtx.beginPath();
      mCtx.moveTo(pos.x, pos.y);
      mCtx.lineTo(pos.x + 0.1, pos.y + 0.1);
      mCtx.stroke();

      redraw();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const pos = getCanvasPos(e);

    if (toolShape === "RECTANGLE") {
      dragCurrentRef.current = pos;
      redraw();

      // Render active live-preview bounding box
      const canvas = canvasRef.current;
      const start = dragStartRef.current;
      if (canvas && start) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const rx = Math.min(start.x, pos.x);
          const ry = Math.min(start.y, pos.y);
          const rw = Math.abs(pos.x - start.x);
          const rh = Math.abs(pos.y - start.y);

          if (rw > 2 && rh > 2) {
            ctx.save();
            // Draw real-time effect preview within the box
            if (effectMode === "PIXELATE" && pixelatedCanvasRef.current) {
              ctx.drawImage(
                pixelatedCanvasRef.current,
                rx,
                ry,
                rw,
                rh,
                rx,
                ry,
                rw,
                rh
              );
            } else if (effectMode === "BLACKOUT") {
              ctx.fillStyle = "#0f172a";
              ctx.fillRect(rx, ry, rw, rh);
            }

            // Outline highlight & corner handles in VokaLink Primary Sky Blue
            ctx.strokeStyle = "#0ea5e9"; // sky-500
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            ctx.strokeRect(rx, ry, rw, rh);

            ctx.fillStyle = "#0ea5e9";
            ctx.fillRect(rx - 3, ry - 3, 6, 6);
            ctx.fillRect(rx + rw - 3, ry - 3, 6, 6);
            ctx.fillRect(rx - 3, ry + rh - 3, 6, 6);
            ctx.fillRect(rx + rw - 3, ry + rh - 3, 6, 6);
            ctx.restore();
          }
        }
      }
    } else {
      // Freehand brush mode
      currentStrokeRef.current.push(pos);

      let targetMask: HTMLCanvasElement | null = null;
      if (effectMode === "PIXELATE") targetMask = maskPixelRef.current;
      else if (effectMode === "BLACKOUT") targetMask = maskBlackoutRef.current;

      if (!targetMask) return;
      const mCtx = targetMask.getContext("2d");
      if (!mCtx) return;

      const path = currentStrokeRef.current;
      if (path.length >= 2) {
        const prev = path[path.length - 2]!;
        mCtx.lineWidth = brushSize;
        mCtx.lineCap = "round";
        mCtx.lineJoin = "round";
        mCtx.strokeStyle = "rgba(0,0,0,1)";

        mCtx.beginPath();
        mCtx.moveTo(prev.x, prev.y);
        mCtx.lineTo(pos.x, pos.y);
        mCtx.stroke();
      }

      redraw();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (toolShape === "RECTANGLE") {
      const start = dragStartRef.current;
      const end = dragCurrentRef.current;
      if (start && end) {
        const rx = Math.min(start.x, end.x);
        const ry = Math.min(start.y, end.y);
        const rw = Math.abs(end.x - start.x);
        const rh = Math.abs(end.y - start.y);

        if (rw > 6 && rh > 6) {
          let targetMask: HTMLCanvasElement | null = null;
          if (effectMode === "PIXELATE") targetMask = maskPixelRef.current;
          else if (effectMode === "BLACKOUT") targetMask = maskBlackoutRef.current;

          if (targetMask) {
            const mCtx = targetMask.getContext("2d");
            if (mCtx) {
              mCtx.fillStyle = "rgba(0,0,0,1)";
              mCtx.fillRect(rx, ry, rw, rh);
            }
          }

          const newRecord: ActionRecord = {
            tool: "RECTANGLE",
            mode: effectMode,
            rect: { x: rx, y: ry, w: rw, h: rh },
          };
          const updated = [...actionHistoryRef.current, newRecord];
          actionHistoryRef.current = updated;
          setActionHistory(updated);
        }
      }
      dragStartRef.current = null;
      dragCurrentRef.current = null;
      redraw();
    } else {
      // Freehand brush
      if (currentStrokeRef.current.length > 0) {
        const newRecord: ActionRecord = {
          tool: "BRUSH",
          mode: effectMode,
          path: [...currentStrokeRef.current],
          size: brushSize,
        };
        const updated = [...actionHistoryRef.current, newRecord];
        actionHistoryRef.current = updated;
        setActionHistory(updated);
      }
      currentStrokeRef.current = [];
    }
  };

  // Undo last action
  const handleUndo = () => {
    if (actionHistoryRef.current.length === 0) return;
    const updated = actionHistoryRef.current.slice(0, -1);
    actionHistoryRef.current = updated;
    setActionHistory(updated);
    rebuildMasksFromHistory(updated);
  };

  // Reset all actions back to pristine original
  const handleReset = () => {
    actionHistoryRef.current = [];
    setActionHistory([]);
    rebuildMasksFromHistory([]);
  };

  // Apply final censored image & export to WebP
  const handleApplyAndSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsProcessing(true);
      // Give React one tick to paint button spinner smoothly
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Watermark Stamp Kepatuhan NDA di pojok bawah
      if (actionHistory.length > 0) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.save();
          const stampText = "🔒 PRIVASI DUDI DILINDUNGI (NDA)";
          ctx.font = "bold 10px sans-serif";
          const metrics = ctx.measureText(stampText);
          const padX = 8;
          const stampW = metrics.width + padX * 2;
          const stampH = 20;
          const x = canvas.width - stampW - 10;
          const y = canvas.height - stampH - 10;

          ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
          ctx.beginPath();
          ctx.roundRect(x, y, stampW, stampH, 4);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.fillText(stampText, x + padX, y + 14);
          ctx.restore();
        }
      }

      // Export to WebP (< 150 KB)
      let mimeType = "image/webp";
      let blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), mimeType, 0.68)
      );

      // Fallback JPEG
      if (!blob || blob.type !== "image/webp") {
        mimeType = "image/jpeg";
        blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), mimeType, 0.65)
        );
      }

      if (!blob) {
        throw new Error("Gagal mengonversi canvas ke file gambar.");
      }

      const sha256 = await computeSha256(blob);
      const originalSizeBytes = imageFile.size;
      const sizeBytes = blob.size;
      const savingsPercentage = Math.max(
        0,
        Math.round(((originalSizeBytes - sizeBytes) / originalSizeBytes) * 100)
      );

      const result: CompressedPhotoResult = {
        blob,
        sha256,
        sizeBytes,
        mimeType,
        originalSizeBytes,
        savingsPercentage,
        savingsText: `Hemat ${savingsPercentage}% (${(sizeBytes / 1024).toFixed(1)} KB)`,
      };

      onSave(result);
      onClose();
    } catch (err) {
      alert("Gagal menyimpan foto sensor: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isMounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-studio-title"
      className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in-0 duration-150"
      style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200/80 max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[94vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── MODAL HEADER (VokaLink Design System: Clean White Surface) ─── */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="privacy-studio-title"
                className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight"
              >
                Sensor Privasi Layar & Dokumen
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Tarik kotak untuk menyensor monitor kodingan atau data rahasia DUDI
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup studio sensor"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── CANVAS WORKSPACE VIEWPORT (Clean, Unobstructed Canvas Stage) ─── */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-[300px] max-h-[58vh] bg-slate-950 flex items-center justify-center p-3 sm:p-4 overflow-hidden select-none"
        >
          {/* Loading Spinner Overlay */}
          {isLoadingImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs animate-pulse bg-slate-950 z-10">
              <Paintbrush className="w-6 h-6 animate-spin text-sky-400" />
              <span>Menyiapkan studio sensor privasi...</span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={cn(
              "max-h-[54vh] max-w-full object-contain rounded-xl shadow-xl touch-none cursor-crosshair border border-slate-800",
              isLoadingImage && "invisible"
            )}
            style={{ touchAction: "none" }}
          />

          {/* Micro-hint Pill (Minimalist, Non-intrusive) */}
          {!isLoadingImage && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none px-3.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-sm border border-slate-700/80 text-xs text-slate-300 shadow-md">
              {toolShape === "RECTANGLE"
                ? "Tarik kotak pada monitor atau berkas rahasia"
                : "Usap jari atau kursor di atas teks rahasia"}
            </div>
          )}
        </div>

        {/* ─── TOOLBAR CONTROLS (VokaLink Design System: Clean White Segmented Bar) ─── */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-white border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* 1. Alat Bentuk: Kotak Area (Default) vs Kuas Bebas */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                Alat:
              </span>
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setToolShape("RECTANGLE")}
                  className={cn(
                    "py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap",
                    toolShape === "RECTANGLE"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  )}
                >
                  <Frame className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>Kotak Rapi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolShape("BRUSH")}
                  className={cn(
                    "py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap",
                    toolShape === "BRUSH"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  )}
                >
                  <Paintbrush className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>Coret Bebas</span>
                </button>
              </div>
            </div>

            {/* 2. Efek Sensor (Cukup 2 Pilihan Standar: Mozaik Piksel & Hitam Pekat) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                Efek:
              </span>
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setEffectMode("PIXELATE")}
                  className={cn(
                    "py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap",
                    effectMode === "PIXELATE"
                      ? "bg-white text-sky-700 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  )}
                >
                  <EyeOff className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>Mozaik Piksel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEffectMode("BLACKOUT")}
                  className={cn(
                    "py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap",
                    effectMode === "BLACKOUT"
                      ? "bg-slate-900 text-white shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  )}
                >
                  <Square className="w-3.5 h-3.5 shrink-0" />
                  <span>Sensor Hitam</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Action Buttons Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={actionHistory.length === 0}
                className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 disabled:opacity-40 text-slate-700 text-xs sm:text-sm font-medium flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:pointer-events-none"
                title="Batalkan sensor terakhir"
              >
                <Undo2 className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={actionHistory.length === 0}
                className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 disabled:opacity-40 text-slate-700 text-xs sm:text-sm font-medium flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:pointer-events-none"
                title="Hapus semua sensor"
              >
                <RotateCcw className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-medium transition active:scale-95 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleApplyAndSave}
                disabled={isProcessing}
                className="h-10 px-5 sm:px-6 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
              >
                <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span>{isProcessing ? "Memproses..." : "Terapkan Sensor"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
