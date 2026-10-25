"use client";

import React from "react";
import {
  Code2,
  Database,
  CheckCircle,
  Cloud,
  CheckCheck,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface SkkniModule {
  id: string;
  title: string;
  code: string;
  badgeLevel: string;
  badgeColor: {
    bg: string;
    border: string;
    text: string;
    dot: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconText: string;
  progressGradient: string;
  description: string;
  verifiedJp: number;
  targetJp: number;
  percentage: number;
  skills: string[];
}

const MODULES: SkkniModule[] = [
  {
    id: "web-mobile",
    title: "Pemrograman Web & Mobile",
    code: "J.620100.009.01",
    badgeLevel: "Mahir (Ready)",
    badgeColor: {
      bg: "bg-emerald-50",
      border: "border-emerald-200/80",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    icon: Code2,
    iconBg: "bg-sky-50 border-sky-100 group-hover:bg-sky-500 group-hover:text-white",
    iconText: "text-sky-600",
    progressGradient: "from-sky-400 to-sky-500",
    description:
      "Perancangan arsitektur REST API modular, router Express, middleware autentikasi, serta integrasi frontend React/Next.js.",
    verifiedJp: 128,
    targetJp: 240,
    percentage: 53,
    skills: ["Express.js", "TypeScript", "Next.js", "RESTful API", "JWT"],
  },
  {
    id: "database",
    title: "Basis Data Relasional",
    code: "J.620100.010.01",
    badgeLevel: "Menengah-Lanjut",
    badgeColor: {
      bg: "bg-teal-50",
      border: "border-teal-200/80",
      text: "text-teal-700",
      dot: "bg-teal-500",
    },
    icon: Database,
    iconBg: "bg-teal-50 border-teal-100 group-hover:bg-teal-600 group-hover:text-white",
    iconText: "text-teal-700",
    progressGradient: "from-teal-400 to-teal-600",
    description:
      "Pemodelan data relasional 3NF, pembuatan skema PostgreSQL, penulisan trigger database, audit immutability, dan ORM Prisma.",
    verifiedJp: 80,
    targetJp: 160,
    percentage: 50,
    skills: ["PostgreSQL", "Prisma ORM", "Database Triggers", "Supavisor"],
  },
  {
    id: "software-qa",
    title: "Software QA & Penjaminan Mutu",
    code: "J.620100.015.01",
    badgeLevel: "Menengah",
    badgeColor: {
      bg: "bg-amber-50",
      border: "border-amber-200/80",
      text: "text-amber-800",
      dot: "bg-amber-500",
    },
    icon: CheckCircle,
    iconBg: "bg-amber-50 border-amber-100 group-hover:bg-amber-500 group-hover:text-white",
    iconText: "text-amber-600",
    progressGradient: "from-amber-400 to-amber-500",
    description:
      "Pengujian unit deterministik, automated endpoint testing dengan Supertest, verifikasi format RFC 7807, dan validasi Zod.",
    verifiedJp: 48,
    targetJp: 120,
    percentage: 40,
    skills: ["Vitest", "Supertest", "Zod", "RFC 7807", "Test Automation"],
  },
  {
    id: "devops",
    title: "Cloud Architecture & DevOps",
    code: "J.620100.020.01",
    badgeLevel: "Dasar-Menengah",
    badgeColor: {
      bg: "bg-indigo-50",
      border: "border-indigo-200/80",
      text: "text-indigo-700",
      dot: "bg-indigo-500",
    },
    icon: Cloud,
    iconBg: "bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
    iconText: "text-indigo-600",
    progressGradient: "from-indigo-400 to-indigo-500",
    description:
      "Kontainerisasi microservice Docker, deployment mandiri via Coolify di Home Server, routing terowongan Cloudflare Tunnel, dan zero-cost monitoring.",
    verifiedJp: 32,
    targetJp: 120,
    percentage: 27,
    skills: ["Docker", "Coolify", "Cloudflare Tunnel", "Linux CI/CD"],
  },
];

export function SkkniMatrixView() {
  const totalVerified = MODULES.reduce((acc, m) => acc + m.verifiedJp, 0);
  const totalTarget = MODULES.reduce((acc, m) => acc + m.targetJp, 0);
  const totalPercentage = Math.round((totalVerified / totalTarget) * 100);

  return (
    <div className="space-y-4 pt-1 pb-6 animate-in fade-in duration-200">
      {/* ─── Summary Header Strip ─── */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                Matriks Capaian SKKNI (Fase F)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                4 Unit Kompetensi
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Akumulasi jam riil tervalidasi mentor industri sesuai standar kurikulum vokasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-200/70 py-2 px-3.5 rounded-2xl shrink-0 self-start sm:self-auto">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Kejuruan
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-bold text-slate-900 text-sm tracking-tight tabular-nums">
                {totalVerified} / {totalTarget} JP
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-full">
                {totalPercentage}%
              </span>
            </div>
          </div>
          <div className="w-px h-7 bg-slate-200" />
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Status Validasi
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Faktual</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4 SKKNI Matrix Cards Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-card hover:shadow-lg hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group space-y-4"
            >
              {/* Header: Icon, Title, SKKNI Code & Level Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-2xl border flex items-center justify-center font-bold shadow-2xs transition-all duration-200 shrink-0",
                        module.iconBg,
                        module.iconText
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                        {module.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Kode SKKNI: <span className="font-semibold text-slate-600">{module.code}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shrink-0 border shadow-2xs",
                      module.badgeColor.bg,
                      module.badgeColor.border,
                      module.badgeColor.text
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", module.badgeColor.dot)} />
                    <span>{module.badgeLevel}</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {module.description}
                </p>
              </div>

              {/* Progress & Verification Metric */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Jam Terverifikasi Mentor
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 tracking-tight tabular-nums text-xs">
                        {module.verifiedJp} / {module.targetJp} JP
                      </span>
                      <span
                        className={cn(
                          "text-[10.5px] font-bold px-1.5 py-0.2 rounded-full border",
                          module.badgeColor.bg,
                          module.badgeColor.border,
                          module.badgeColor.text
                        )}
                      >
                        {module.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* High Quality Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200/50">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                        module.progressGradient
                      )}
                      style={{ width: `${module.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Technology Skill Pills with Context Label */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    Teknologi &amp; Alat Industri:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {module.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SkkniMatrixView;
