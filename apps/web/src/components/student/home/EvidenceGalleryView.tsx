"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

export function EvidenceGalleryView() {
  const evidences = [
    {
      title: "Dokumentasi Arsitektur Routing Express & Middleware",
      jp: 8,
      date: "10 Okt 2026",
      size: "138 KB (WebP)",
      category: "Pemrograman Web",
      tag: "feat(api): modular routing",
      status: "in_progress",
    },
    {
      title: "Perancangan Skema PostgreSQL & Trigger Immutability",
      jp: 8,
      date: "8 Okt 2026",
      size: "112 KB (WebP)",
      category: "Basis Data",
      tag: "schema: audit log triggers",
      status: "verified",
    },
    {
      title: "Automated Unit Testing 116 Test Suites",
      jp: 8,
      date: "7 Okt 2026",
      size: "84 KB (WebP)",
      category: "Testing & QA",
      tag: "test: vitest 100% passing",
      status: "verified",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-4 xl:gap-5 pt-2 pb-6">
      {evidences.map((ev, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-card transition-all duration-200 space-y-3"
        >
          {/* Image Placeholder Visual (Apple terminal style card) */}
          <div className="w-full h-32 rounded-xl bg-slate-900 text-white p-3.5 flex flex-col justify-between font-mono text-[10px] relative overflow-hidden border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-[10px]">{ev.size}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                SHA-256 Valid
              </span>
            </div>
            <div className="text-slate-300">
              <p className="text-sky-400 font-medium">$ git commit -m</p>
              <p className="truncate text-white font-medium">{ev.tag}</p>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-sky-600 block">
              {ev.category} · {ev.date}
            </span>
            <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 leading-snug mt-1">
              {ev.title}
            </h4>
          </div>

          <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-800 font-mono">{ev.jp} JP Praktik</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terverifikasi</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
