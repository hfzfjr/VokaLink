"use client";

import React from "react";
import {
  Building2,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  QrCode,
  Plus,
} from "lucide-react";
import type { DudiPartnerItem } from "@/lib/api";

interface DudiPartnerTableProps {
  partners: DudiPartnerItem[];
  onOpenAddMentor: (dudiId: string, dudiName: string) => void;
  onOpenResetDevice: (mentorId: string, mentorName: string) => void;
  onTriggerQr: (mentor: {
    mentorName: string;
    dudiName: string;
    whatsappNumber: string;
    mentorId: string;
  }) => void;
}

export function DudiPartnerTable({
  partners,
  onOpenAddMentor,
  onOpenResetDevice,
  onTriggerQr,
}: DudiPartnerTableProps) {
  if (partners.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-700">Tidak ada mitra DUDI ditemukan</p>
        <p className="text-xs text-slate-400">
          Ubah kata kunci pencarian atau daftarkan mitra industri baru.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {partners.map((partner) => {
        const remainingQuota = Math.max(0, partner.maxQuota - (partner.placementsCount || 0));

        return (
          <div
            key={partner.id}
            className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-4 hover:border-slate-300 transition"
          >
            {/* Header DUDI: Nama, Sektor, Lokasi, Kuota */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {partner.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                    {partner.sectorCategory}
                  </span>
                  {partner.qualityIndexScore !== null && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold text-[10px]">
                      QIS: {partner.qualityIndexScore.toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {partner.address}, {partner.city}
                  </span>
                  <span>&bull;</span>
                  <span className="font-semibold text-slate-700">
                    Kapasitas: {partner.placementsCount || 0}/{partner.maxQuota} Siswa
                  </span>
                  <span className="text-sky-600 font-bold">
                    ({remainingQuota} Sisa Kuota)
                  </span>
                </div>
              </div>

              {/* Action: Tambah Mentor */}
              <button
                type="button"
                onClick={() => onOpenAddMentor(partner.id, partner.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition self-start cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Mentor</span>
              </button>
            </div>

            {/* Daftar Mentor DUDI */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Mentor Industri Terdaftar ({partner.mentors.length})
              </p>

              {partner.mentors.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">
                  Belum ada mentor terdaftar. Daftarkan mentor untuk mengaktifkan verifikasi kartu kerja.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {partner.mentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 truncate">{mentor.fullName}</p>
                          <span className="text-[10px] text-slate-400">({mentor.jobTitle})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500 font-medium">
                            WA: {mentor.whatsappNumber}
                          </span>
                          <span>&bull;</span>
                          {mentor.isDeviceBound ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> HP Terikat
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                              <ShieldAlert className="w-3 h-3 text-amber-600" /> Belum Aktivasi
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mentor Actions: QR Activation & Reset Device */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onTriggerQr({
                              mentorName: mentor.fullName,
                              dudiName: partner.name,
                              whatsappNumber: mentor.whatsappNumber,
                              mentorId: mentor.id,
                            })
                          }
                          className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-100 transition cursor-pointer"
                          title="Tampilkan QR / Kirim Tautan WhatsApp Aktivasi"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        {mentor.isDeviceBound && (
                          <button
                            type="button"
                            onClick={() => onOpenResetDevice(mentor.id, mentor.fullName)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition cursor-pointer"
                            title="Reset Ikatan Perangkat (Ganti HP)"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
