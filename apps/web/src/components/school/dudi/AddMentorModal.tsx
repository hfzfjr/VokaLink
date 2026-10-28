"use client";

import React, { useState } from "react";
import { X, Plus, Users, AlertCircle } from "lucide-react";
import { sanitizeErrorMessage } from "@/lib/error-formatter";

interface AddMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dudiId: string | null;
  dudiName: string;
  onSubmit: (dudiId: string, payload: {
    fullName: string;
    jobTitle: string;
    whatsappNumber: string;
  }) => Promise<void>;
}

export function AddMentorModal({
  isOpen,
  onClose,
  dudiId,
  dudiName,
  onSubmit,
}: AddMentorModalProps) {
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !dudiId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !whatsappNumber.trim()) {
      setError("Nama lengkap dan nomor WhatsApp wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(dudiId, {
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim() || "Pembimbing Industri",
        whatsappNumber: whatsappNumber.trim(),
      });
      setFullName("");
      setJobTitle("");
      setWhatsappNumber("");
      onClose();
    } catch (err: any) {
      setError(sanitizeErrorMessage(err, "Gagal menambahkan mentor."));
    } finally {
      setSubmitting(false);
    }
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
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tambah Mentor Industri</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-xs">{dudiName}</p>
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

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Nama Lengkap Mentor *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Rian Hidayat, S.T."
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Jabatan / Posisi di Perusahaan
              </label>
              <input
                type="text"
                placeholder="Contoh: Pembimbing Industri / Senior Staff"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Nomor WhatsApp Aktif *
              </label>
              <input
                type="text"
                required
                placeholder="081234567890"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Tautan aktivasi 72 jam akan dibuat otomatis setelah pendaftaran.
              </p>
            </div>
          </div>

          {/* Full-Bleed Footer touching modal edges */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-full bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? "Mendaftarkan..." : "Daftarkan Mentor"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
