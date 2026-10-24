"use client";

import React from "react";
import { Palette, Layers, Search, ShieldCheck } from "lucide-react";

export function SkkniMatrixView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 pt-2 pb-6">
      {/* Module 1: Web & Mobile (Sektor RPL sky-500) */}
      <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200/70 space-y-3.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-bold shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Pemrograman Web & Mobile
              </h4>
              <p className="text-[11px] text-slate-500 font-mono">
                Kode SKKNI: J.620100.009.01
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[10px] font-medium">
            Mahir (Ready)
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          Perancangan arsitektur REST API modular, router Express, middleware autentikasi, serta integrasi frontend React/Next.js.
        </p>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-slate-500">Jam Terverifikasi Mentor</span>
            <span className="text-sky-600 font-semibold font-mono">128 / 240 JP (53%)</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full" style={{ width: "53%" }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {["Express.js", "TypeScript", "Next.js", "RESTful API", "JWT"].map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200/70 text-slate-700 text-[10px] font-mono font-medium shadow-2xs"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Module 2: Basis Data Relasional */}
      <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200/70 space-y-3.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Basis Data Relasional
              </h4>
              <p className="text-[11px] text-slate-500 font-mono">
                Kode SKKNI: J.620100.010.01
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/70 text-teal-700 text-[10px] font-medium">
            Menengah-Lanjut
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          Pemodelan data relasional 3NF, pembuatan skema PostgreSQL, penulisan trigger database, audit immutability, dan ORM Prisma.
        </p>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-slate-500">Jam Terverifikasi Mentor</span>
            <span className="text-teal-700 font-semibold font-mono">80 / 160 JP (50%)</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-teal-600 rounded-full" style={{ width: "50%" }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {["PostgreSQL", "Prisma ORM", "Database Triggers", "Supavisor"].map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200/70 text-slate-700 text-[10px] font-mono font-medium shadow-2xs"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Module 3: Software QA & Testing */}
      <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200/70 space-y-3.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center font-bold shadow-xs">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Software QA & Penjaminan Mutu
              </h4>
              <p className="text-[11px] text-slate-500 font-mono">
                Kode SKKNI: J.620100.015.01
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-700 text-[10px] font-medium">
            Menengah
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          Pengujian unit deterministik, automated endpoint testing dengan Supertest, verifikasi format RFC 7807, dan validasi Zod.
        </p>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-slate-500">Jam Terverifikasi Mentor</span>
            <span className="text-amber-700 font-semibold font-mono">48 / 120 JP (40%)</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-amber-600 rounded-full" style={{ width: "40%" }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {["Vitest", "Supertest", "Zod", "RFC 7807", "Test Automation"].map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200/70 text-slate-700 text-[10px] font-mono font-medium shadow-2xs"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Module 4: Cloud Architecture & DevOps */}
      <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200/70 space-y-3.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Cloud Architecture & DevOps
              </h4>
              <p className="text-[11px] text-slate-500 font-mono">
                Kode SKKNI: J.620100.020.01
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-[10px] font-medium">
            Dasar-Menengah
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          Kontainerisasi microservice Docker, deployment mandiri via Coolify di Home Server, routing terowongan Cloudflare Tunnel, dan zero-cost monitoring.
        </p>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-slate-500">Jam Terverifikasi Mentor</span>
            <span className="text-indigo-700 font-semibold font-mono">32 / 120 JP (27%)</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: "27%" }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {["Docker", "Coolify", "Cloudflare Tunnel", "Linux CI/CD"].map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200/70 text-slate-700 text-[10px] font-mono font-medium shadow-2xs"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
