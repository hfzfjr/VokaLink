"use client";

import React, { useState } from "react";
import { X, MapPin, Check, AlertCircle } from "lucide-react";
import type { PlacementCandidateStudent } from "@/lib/api";

interface StudentCoordinatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: PlacementCandidateStudent | null;
  onSubmit: (studentId: string, payload: { homeLatitude: number; homeLongitude: number }) => Promise<void>;
}

export function StudentCoordinatesModal({
  isOpen,
  onClose,
  student,
  onSubmit,
}: StudentCoordinatesModalProps) {
  const [lat, setLat] = useState(student ? student.homeLatitude.toString() : "3.5952");
  const [lng, setLng] = useState(student ? student.homeLongitude.toString() : "98.6722");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setError("Koordinat latitude dan longitude harus berupa angka valid.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(student.studentId, {
        homeLatitude: parsedLat,
        homeLongitude: parsedLng,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan koordinat tempat tinggal siswa.");
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
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Titik Tempat Tinggal Siswa</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-xs">{student.fullName}</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">
            Titik koordinat digunakan untuk menghitung jarak geospasial Haversine menuju lokasi industri mitra (bobot 30% pada Smart Placement).
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Latitude (Garis Lintang)
              </label>
              <input
                type="text"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Longitude (Garis Bujur)
              </label>
              <input
                type="text"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
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
              <Check className="w-4 h-4" />
              <span>{submitting ? "Menyimpan..." : "Simpan Koordinat"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
