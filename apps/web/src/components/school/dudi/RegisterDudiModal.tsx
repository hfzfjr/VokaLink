"use client";

import React, { useState } from "react";
import { X, Building2, Plus, AlertCircle, Check } from "lucide-react";

export interface AvailableJobCard {
  id: string;
  title: string;
  sector: string;
}

interface RegisterDudiModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableJobCards: AvailableJobCard[];
  onSubmit: (payload: {
    name: string;
    sectorCategory: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    maxQuota: number;
    supportedJobCardIds: string[];
    mentor?: {
      fullName: string;
      jobTitle: string;
      whatsappNumber: string;
    };
  }) => Promise<void>;
}

export function RegisterDudiModal({
  isOpen,
  onClose,
  availableJobCards,
  onSubmit,
}: RegisterDudiModalProps) {
  const [dudiName, setDudiName] = useState("");
  const [sectorCategory, setSectorCategory] = useState("Teknologi Informasi & Software");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Medan");
  const [lat, setLat] = useState("3.5952");
  const [lng, setLng] = useState("98.6722");
  const [maxQuota, setMaxQuota] = useState(5);
  const [selectedJobCards, setSelectedJobCards] = useState<string[]>([]);

  // Optional mentor initial registration
  const [includeMentor, setIncludeMentor] = useState(true);
  const [mentorName, setMentorName] = useState("");
  const [mentorJobTitle, setMentorJobTitle] = useState("Senior Engineer / Pembimbing");
  const [mentorWa, setMentorWa] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleJobCard = (id: string) => {
    setSelectedJobCards((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dudiName.trim() || !address.trim()) {
      setError("Nama DUDI dan alamat wajib diisi.");
      return;
    }

    if (includeMentor && (!mentorName.trim() || !mentorWa.trim())) {
      setError("Nama mentor dan nomor WhatsApp mentor wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: dudiName.trim(),
        sectorCategory,
        address: address.trim(),
        city: city.trim(),
        latitude: parseFloat(lat) || 0,
        longitude: parseFloat(lng) || 0,
        maxQuota: Number(maxQuota) || 5,
        supportedJobCardIds: selectedJobCards,
        mentor: includeMentor
          ? {
              fullName: mentorName.trim(),
              jobTitle: mentorJobTitle.trim(),
              whatsappNumber: mentorWa.trim(),
            }
          : undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal mendaftarkan mitra DUDI.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pendaftaran Mitra DUDI Baru</h3>
              <p className="text-[11px] text-slate-500">Integrasi kemitraan industri & checklist kompetensi</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bagian 1: Data Perusahaan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[10px]">
              1. Informasi Lembaga / Industri
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Industri / Perusahaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="PT Telkom Indonesia (Witel Medan)"
                  value={dudiName}
                  onChange={(e) => setDudiName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Sektor Industri
                </label>
                <select
                  value={sectorCategory}
                  onChange={(e) => setSectorCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
                >
                  <option value="Teknologi Informasi & Software">Teknologi Informasi & Software</option>
                  <option value="Keuangan, Perbankan & Akuntansi">Keuangan, Perbankan & Akuntansi</option>
                  <option value="Desain Kreatif & Multimedia">Desain Kreatif & Multimedia</option>
                  <option value="Otomotif & Manufaktur">Otomotif & Manufaktur</option>
                  <option value="Perhotelan & Kuliner">Perhotelan & Kuliner</option>
                  <option value="Kesehatan & Farmasi">Kesehatan & Farmasi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Alamat Kantor *</label>
              <input
                type="text"
                required
                placeholder="Jl. Prof. HM. Yamin No. 2, Medan"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Kota / Kabupaten</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Latitude</label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Longitude</label>
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Kapasitas Kuota Siswa PKL
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxQuota}
                onChange={(e) => setMaxQuota(parseInt(e.target.value) || 5)}
                className="w-28 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Bagian 2: Checklist Kompetensi / Kartu Kerja Riil dari DB */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                2. Kartu Pekerjaan yang Didukung di Industri (Database Riil)
              </h4>
              <span className="text-[10.5px] font-bold text-sky-600">
                {selectedJobCards.length} Dipilih
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Digunakan oleh algoritma Smart Placement (FR-004) untuk menghitung kesesuaian kurikulum 70%.
            </p>

            <div className="max-h-40 overflow-y-auto p-2 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              {availableJobCards.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-2">
                  Belum ada kartu kerja terdaftar di database kurikulum sekolah.
                </p>
              ) : (
                availableJobCards.map((jc) => {
                  const isChecked = selectedJobCards.includes(jc.id);

                  return (
                    <div
                      key={jc.id}
                      onClick={() => toggleJobCard(jc.id)}
                      className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? "bg-white border-sky-400 text-slate-900 shadow-2xs font-semibold"
                          : "bg-white/70 border-slate-200/60 text-slate-600 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-extrabold text-[9px] shrink-0">
                          {jc.sector}
                        </span>
                        <span className="truncate">{jc.title}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? "bg-sky-500 border-sky-500 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bagian 3: Mentor Industri Awal */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                3. Daftarkan Mentor Industri Pertama (Opsional)
              </h4>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMentor}
                  onChange={(e) => setIncludeMentor(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Sertakan Mentor</span>
              </label>
            </div>

            {includeMentor && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nama Mentor *
                  </label>
                  <input
                    type="text"
                    required={includeMentor}
                    placeholder="Contoh: Rian Hidayat"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={mentorJobTitle}
                    onChange={(e) => setMentorJobTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    WhatsApp Aktif *
                  </label>
                  <input
                    type="text"
                    required={includeMentor}
                    placeholder="081234567890"
                    value={mentorWa}
                    onChange={(e) => setMentorWa(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>
            )}
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
              <span>{submitting ? "Mendaftarkan..." : "Daftarkan Mitra DUDI"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
