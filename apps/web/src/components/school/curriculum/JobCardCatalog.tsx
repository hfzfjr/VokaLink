"use client";

import React from "react";
import { Plus, Trash2, BookOpen, Wrench } from "lucide-react";
import type { CpElementItem, JobCardItem } from "@/lib/api";

interface JobCardCatalogProps {
  elements: CpElementItem[];
  nonCompetencyCards: JobCardItem[];
  onOpenAddModal: (elementId: string | null, isNonCompetency: boolean) => void;
  onDeleteJobCard: (jcId: string) => void;
  isLocked: boolean;
}

export function JobCardCatalog({
  elements,
  nonCompetencyCards,
  onOpenAddModal,
  onDeleteJobCard,
  isLocked,
}: JobCardCatalogProps) {
  return (
    <div className="space-y-5">
      {/* 1. Header & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-500" />
            Katalog Kartu Pekerjaan (Job Cards)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar tugas terstandarisasi yang dapat dipilih siswa saat mencatat jurnal harian.
          </p>
        </div>

        {!isLocked && (
          <button
            type="button"
            onClick={() => onOpenAddModal(null, false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kartu Kerja</span>
          </button>
        )}
      </div>

      {/* 2. Job Cards per Elemen CP */}
      <div className="space-y-4">
        {elements.map((el) => (
          <div
            key={el.id}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-600 font-extrabold text-xs border border-sky-100">
                  {el.code}
                </span>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{el.title}</h3>
                <span className="text-[11px] text-slate-400 font-semibold">
                  ({el.targetJp} JP)
                </span>
              </div>

              {!isLocked && (
                <button
                  type="button"
                  onClick={() => onOpenAddModal(el.id, false)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah di Elemen ini</span>
                </button>
              )}
            </div>

            {el.jobCards.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Belum ada Kartu Kerja terdaftar pada elemen ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {el.jobCards.map((jc) => (
                  <div
                    key={jc.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-slate-300 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                          {jc.title}
                        </p>
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => onDeleteJobCard(jc.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition shrink-0 cursor-pointer"
                            title="Hapus Kartu Kerja"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {jc.skkniUnitCode && (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-[10px] font-mono font-bold text-slate-600">
                            SKKNI: {jc.skkniUnitCode}
                          </span>
                        </div>
                      )}

                      {jc.actionVerbTemplate && (
                        <p className="text-[11px] text-slate-500 italic">
                          Format: &ldquo;{jc.actionVerbTemplate}&rdquo;
                        </p>
                      )}
                    </div>

                    {jc.toolsAndSoftware && jc.toolsAndSoftware.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                        <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
                        {jc.toolsAndSoftware.map((tool, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-white text-slate-700 font-semibold text-[10px] border border-slate-200/70"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* 3. Non-Competency Cards Section (BR-004) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs">
                NON-KOMPETENSI
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Aktivitas Penunjang (K3, Orientasi, Briefing)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Dihitung dalam JP log harian tetapi tidak masuk klaim keahlian di CV/Paspor (BR-004).
                </p>
              </div>
            </div>

            {!isLocked && (
              <button
                type="button"
                onClick={() => onOpenAddModal(null, true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Non-Kompetensi</span>
              </button>
            )}
          </div>

          {nonCompetencyCards.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Belum ada kartu non-kompetensi terdaftar.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nonCompetencyCards.map((jc) => (
                <div
                  key={jc.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        {jc.title}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                        Kegiatan Penunjang (Non-CP)
                      </span>
                    </div>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => onDeleteJobCard(jc.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition shrink-0 cursor-pointer"
                        title="Hapus Kartu Kerja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
