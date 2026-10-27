"use client";

import React, { useState } from "react";
import { QrCode, X, Copy, Check, Share2 } from "lucide-react";
import { QrCodeView } from "@/components/ui/QrCodeView";

interface MentorQrActivationModalProps {
  data: {
    mentorName: string;
    dudiName: string;
    token: string;
    url: string;
    waLink: string;
  } | null;
  onClose: () => void;
}

export function MentorQrActivationModal({ data, onClose }: MentorQrActivationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">QR Aktivasi Perangkat Mentor</h3>
              <p className="text-[11px] text-slate-500">Masa berlaku 72 jam (BR-007)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-center">
          <div>
            <p className="text-xs font-bold text-slate-900">{data.mentorName}</p>
            <p className="text-[11px] text-slate-500">{data.dudiName}</p>
          </div>

          {/* QR Code Container */}
          <div className="flex justify-center py-2">
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200/80 shadow-xs inline-block">
              <QrCodeView value={data.url} size={180} />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed px-4">
            Minta mentor memindai QR ini langsung menggunakan kamera HP pribadinya untuk mengikat perangkat dan membuat PIN 6-digit verifikasi.
          </p>

          {/* Actions: Copy Link & WhatsApp Direct */}
          <div className="space-y-2 pt-2">
            <a
              href={data.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim Undangan Aktivasi via WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Tautan Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Salin Tautan Aktivasi Manual</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
