"use client";

import React, { useState } from "react";
import {
  Building2,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  QrCode,
  Plus,
  Users,
  ChevronRight,
  X,
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
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId) || null;

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
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
        {partners.map((partner) => {
          const remainingQuota = Math.max(0, partner.maxQuota - (partner.placementsCount || 0));
          const firstMentor = partner.mentors[0];
          const extraMentorsCount = Math.max(0, partner.mentors.length - 1);

          return (
            <div
              key={partner.id}
              className="rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition overflow-hidden flex flex-col justify-between"
            >
              {/* Header DUDI: Nama, Sektor, Lokasi, Kuota */}
              <div className="p-5 sm:p-6 pb-4 sm:pb-5 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug truncate">
                        {partner.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                        {partner.sectorCategory}
                      </span>
                    </div>

                    <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 font-medium">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {partner.address}, {partner.city}
                      </span>
                    </p>
                  </div>

                  {/* Action: Tambah Mentor (Pill button) */}
                  <button
                    type="button"
                    onClick={() => onOpenAddMentor(partner.id, partner.name)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Mentor</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="font-semibold text-slate-700">
                    Kapasitas: {partner.placementsCount || 0}/{partner.maxQuota} Siswa
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-sky-600 font-bold">
                    {remainingQuota} Sisa Kuota
                  </span>
                </div>
              </div>

              {/* Daftar Mentor DUDI - Full-bleed divider menyentuh ujung box */}
              <div className="border-t border-slate-100 bg-slate-50/30 p-5 sm:p-6 pt-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Mentor Industri Terdaftar ({partner.mentors.length})
                  </p>
                  {partner.mentors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSelectedPartnerId(partner.id)}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Lihat Semua</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {!firstMentor ? (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center">
                    <p className="text-xs sm:text-sm text-slate-400 italic">
                      Belum ada mentor terdaftar. Klik &ldquo;Tambah Mentor&rdquo; untuk mengaktifkan verifikasi.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div>
                          <p className="text-sm sm:text-[15px] font-bold text-slate-900 truncate">
                            {firstMentor.fullName}
                          </p>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {firstMentor.jobTitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                          <span className="text-xs sm:text-sm font-mono text-slate-700 font-semibold bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80">
                            WA: {firstMentor.whatsappNumber}
                          </span>
                          {firstMentor.isDeviceBound ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> HP Terikat
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/60">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Belum Aktivasi
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mentor Actions: QR Activation & Reset Device */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onTriggerQr({
                              mentorName: firstMentor.fullName,
                              dudiName: partner.name,
                              whatsappNumber: firstMentor.whatsappNumber,
                              mentorId: firstMentor.id,
                            })
                          }
                          className="p-2 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200/70 transition cursor-pointer"
                          title="Tampilkan QR / Kirim Tautan WhatsApp Aktivasi"
                        >
                          <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        {firstMentor.isDeviceBound && (
                          <button
                            type="button"
                            onClick={() => onOpenResetDevice(firstMentor.id, firstMentor.fullName)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/70 transition cursor-pointer"
                            title="Reset Ikatan Perangkat (Ganti HP)"
                          >
                            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Overlay Trigger Button if > 1 Mentor */}
                    {extraMentorsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedPartnerId(partner.id)}
                        className="w-full py-2.5 px-4 rounded-xl bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200/70 text-sky-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-sky-600" />
                        <span>
                          Lihat Selengkapnya (+{extraMentorsCount} Mentor Lainnya)
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── OVERLAY MODAL: DAFTAR LENGKAP MENTOR DUDI ─── */}
      {selectedPartner && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedPartnerId(null)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 truncate">
                    Daftar Mentor — {selectedPartner.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {selectedPartner.mentors.length} Mentor Terdaftar &bull; {selectedPartner.address}, {selectedPartner.city}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPartnerId(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Full Mentor List */}
            <div className="p-6 overflow-y-auto space-y-3">
              {selectedPartner.mentors.map((mentor, idx) => (
                <div
                  key={mentor.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60 shrink-0">
                          #{idx + 1}
                        </span>
                        <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {mentor.fullName}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {mentor.jobTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                      <span className="text-xs sm:text-sm font-mono text-slate-700 font-semibold bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80">
                        WA: {mentor.whatsappNumber}
                      </span>
                      {mentor.isDeviceBound ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> HP Terikat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/60">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Belum Aktivasi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mentor Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onTriggerQr({
                          mentorName: mentor.fullName,
                          dudiName: selectedPartner.name,
                          whatsappNumber: mentor.whatsappNumber,
                          mentorId: mentor.id,
                        })
                      }
                      className="p-2.5 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200/70 transition cursor-pointer"
                      title="Tampilkan QR / Kirim Tautan WhatsApp Aktivasi"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                    {mentor.isDeviceBound && (
                      <button
                        type="button"
                        onClick={() => onOpenResetDevice(mentor.id, mentor.fullName)}
                        className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/70 transition cursor-pointer"
                        title="Reset Ikatan Perangkat (Ganti HP)"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onOpenAddMentor(selectedPartner.id, selectedPartner.name);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mentor Baru</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPartnerId(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
