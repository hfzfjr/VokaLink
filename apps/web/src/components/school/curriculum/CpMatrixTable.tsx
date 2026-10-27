"use client";

import React from "react";
import { Sliders, Save, RefreshCw } from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";
import type { CpElementItem } from "@/lib/api";

interface CpMatrixTableProps {
  elements: CpElementItem[];
  editedJpMap: Record<string, number>;
  onJpChange: (elementId: string, val: number) => void;
  onSaveJp: () => void;
  saving?: boolean;
  isLocked: boolean;
}

export function CpMatrixTable({
  elements,
  editedJpMap,
  onJpChange,
  onSaveJp,
  saving = false,
  isLocked,
}: CpMatrixTableProps) {
  const currentTotal = elements.reduce(
    (sum, el) => sum + (editedJpMap[el.id] ?? el.targetJp),
    0
  );

  const hasChanges = elements.some(
    (el) => editedJpMap[el.id] !== undefined && editedJpMap[el.id] !== el.targetJp
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-500" />
            Matriks Pembobotan Jam Pelajaran (JP)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur alokasi JP per elemen secara proporsional hingga akumulasi tepat {TOTAL_TARGET_JP} JP.
          </p>
        </div>

        {!isLocked && (
          <button
            type="button"
            onClick={onSaveJp}
            disabled={!hasChanges || saving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              hasChanges && !saving
                ? "bg-sky-500 hover:bg-sky-600 text-white active:scale-95 shadow-sky-500/20"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            }`}
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? "Menyimpan..." : "Simpan Alokasi JP"}</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto -mx-5 sm:mx-0">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-4">Kode</th>
              <th className="py-2.5 px-4">Elemen Capaian Pembelajaran</th>
              <th className="py-2.5 px-4 text-center">Kartu Kerja</th>
              <th className="py-2.5 px-4 text-right">Alokasi Target JP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {elements.map((el) => {
              const currentVal = editedJpMap[el.id] ?? el.targetJp;

              return (
                <tr key={el.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-mono font-bold text-sky-600 shrink-0">
                    {el.code}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{el.title}</p>
                    <p className="text-[11px] text-slate-400">Urutan: #{el.sortOrder}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                      {el.jobCards.length} Kartu
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isLocked ? (
                      <span className="font-black text-slate-900 text-sm tabular-nums">
                        {el.targetJp} JP
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-2 justify-end">
                        <input
                          type="number"
                          min={0}
                          max={TOTAL_TARGET_JP}
                          step={6}
                          value={currentVal}
                          onChange={(e) => onJpChange(el.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-200 text-right font-black text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                        <span className="text-slate-500 font-bold text-xs">JP</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200/80 bg-slate-50/70 font-extrabold text-slate-900 text-xs">
              <td colSpan={3} className="py-3 px-4">
                Total Akumulasi Seluruh Elemen
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-sm">
                <span
                  className={
                    currentTotal === TOTAL_TARGET_JP
                      ? "text-emerald-600 font-black"
                      : "text-amber-600 font-black"
                  }
                >
                  {currentTotal}
                </span>{" "}
                / {TOTAL_TARGET_JP} JP
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
