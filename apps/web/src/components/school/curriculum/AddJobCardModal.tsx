"use client";

import React, { useState } from "react";
import { X, Plus, BookOpen, AlertCircle } from "lucide-react";
import type { CpElementItem } from "@/lib/api";

interface AddJobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CpElementItem[];
  defaultElementId: string | null;
  defaultIsNonCompetency: boolean;
  onSubmit: (payload: {
    cpElementId?: string | null;
    title: string;
    skkniUnitCode?: string | null;
    toolsAndSoftware?: string[];
    actionVerbTemplate?: string;
    isNonCompetency?: boolean;
  }) => Promise<void>;
}

export function AddJobCardModal({
  isOpen,
  onClose,
  elements,
  defaultElementId,
  defaultIsNonCompetency,
  onSubmit,
}: AddJobCardModalProps) {
  const [title, setTitle] = useState("");
  const [elementId, setElementId] = useState<string>(defaultElementId || (elements[0]?.id ?? ""));
  const [isNonCompetency, setIsNonCompetency] = useState<boolean>(defaultIsNonCompetency);
  const [skkni, setSkkni] = useState("");
  const [tools, setTools] = useState("");
  const [verb, setVerb] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Judul Kartu Pekerjaan wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const toolsArray = tools
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await onSubmit({
        title: title.trim(),
        cpElementId: isNonCompetency ? null : elementId || null,
        isNonCompetency,
        skkniUnitCode: skkni.trim() || null,
        toolsAndSoftware: toolsArray,
        actionVerbTemplate: verb.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menambahkan Kartu Pekerjaan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tambah Kartu Pekerjaan (Job Card)</h3>
              <p className="text-[11px] text-slate-500">Standarisasi tugas harian siswa PKL</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Judul Kartu Pekerjaan *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Implementasi REST API & Validasi Input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="nonCompetencyToggle"
              checked={isNonCompetency}
              onChange={(e) => setIsNonCompetency(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
            />
            <label
              htmlFor="nonCompetencyToggle"
              className="text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Tandai sebagai Aktivitas Non-Kompetensi (K3, Orientasi, Briefing)
            </label>
          </div>

          {!isNonCompetency && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Elemen Capaian Pembelajaran (CP) *
              </label>
              <select
                value={elementId}
                onChange={(e) => setElementId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
              >
                {elements.map((el) => (
                  <option key={el.id} value={el.id}>
                    [{el.code}] {el.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Kode Unit SKKNI (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: J.620100.009.01"
              value={skkni}
              onChange={(e) => setSkkni(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Alat / Software yang Digunakan (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              placeholder="Contoh: VS Code, Postman, PostgreSQL, Git"
              value={tools}
              onChange={(e) => setTools(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Format Kalimat Tindakan Jurnal (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Membuat endpoint API untuk keperluan ..."
              value={verb}
              onChange={(e) => setVerb(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? "Menyimpan..." : "Tambahkan ke Katalog"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
