"use client";

import React from "react";
import { SkeletonTitle, SkeletonText, SkeletonRect } from "@/components/ui/Skeleton";

export function HomeSkeleton() {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 sm:gap-5 items-stretch min-h-[840px] animate-in fade-in-0 duration-200">
      {/* ─── 1. CENTER SECTION CANVAS SKELETON ─── */}
      <section className="flex-1 min-w-0 bg-transparent rounded-none p-0 border-0 shadow-none flex flex-col justify-between gap-4 lg:gap-5">
        <div className="flex flex-col gap-3.5 sm:gap-4">
          {/* Mobile Hero Skeleton (< lg) */}
          <div className="block lg:hidden space-y-3 font-sans">
            <div className="flex items-center justify-between text-xs px-1">
              <SkeletonRect className="w-32 h-4 rounded-md" />
              <SkeletonRect className="w-16 h-5 rounded-full" />
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <SkeletonText className="w-48 h-4" />
                <SkeletonRect className="w-16 h-6 rounded-full" />
              </div>
              <SkeletonText className="w-3/4 h-3" />
              <div className="flex gap-2 pt-1">
                <SkeletonRect className="w-full h-10 rounded-xl" />
                <SkeletonRect className="w-20 h-10 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Desktop Slim Executive Header Skeleton (≥ lg) */}
          <div className="hidden lg:flex lg:h-[86px] items-center justify-between gap-6 bg-white rounded-2xl px-5 border border-slate-200/70 shadow-2xs shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <SkeletonTitle className="w-36 h-5" />
                  <span className="text-slate-300 text-xs">·</span>
                  <SkeletonText className="w-24 h-3.5" />
                  <SkeletonRect className="w-24 h-5 rounded-full" />
                </div>
                <SkeletonText className="w-72 h-3" />
              </div>
            </div>

            <div className="flex items-center gap-5 shrink-0">
              <div className="w-48 space-y-2">
                <div className="flex items-center justify-between">
                  <SkeletonText className="w-20 h-3" />
                  <SkeletonText className="w-16 h-3" />
                </div>
                <SkeletonRect className="w-full h-2 rounded-full" />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <SkeletonRect className="w-28 h-9 rounded-xl" />
                <SkeletonRect className="w-16 h-9 rounded-xl" />
              </div>
            </div>
          </div>

          {/* View Controller (Tab Bar) Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-2 font-sans">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SkeletonTitle className="w-48 h-4.5" />
                <SkeletonRect className="w-16 h-5 rounded-full" />
              </div>
              <SkeletonText className="w-64 h-3" />
            </div>

            <div className="flex items-center gap-1.5">
              <SkeletonRect className="w-64 h-9 rounded-xl" />
            </div>
          </div>

          {/* Notion Minimalist Bento Cards Skeleton (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200/70 shadow-2xs space-y-3.5"
              >
                <div className="space-y-2.5">
                  {/* Top row: Date & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SkeletonRect className="w-4 h-4 rounded-md" />
                      <SkeletonText className="w-24 h-3.5" />
                    </div>
                    <SkeletonRect className="w-16 h-5 rounded-full" />
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5 pt-0.5">
                    <SkeletonTitle className="w-4/5 h-4.5" />
                    <SkeletonText className="w-full h-3" />
                    <SkeletonText className="w-2/3 h-3" />
                  </div>

                  {/* Badges: SKKNI & Autonomy */}
                  <div className="flex items-center gap-2 pt-1">
                    <SkeletonRect className="w-28 h-5 rounded-md" />
                    <SkeletonRect className="w-20 h-5 rounded-md" />
                  </div>
                </div>

                {/* Footer: Mentor info */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SkeletonRect className="w-5 h-5 rounded-full" />
                    <SkeletonText className="w-28 h-3" />
                  </div>
                  <SkeletonRect className="w-4 h-4 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. RIGHT SIDEBAR WIDGET PANEL SKELETON ─── */}
      <aside className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] flex flex-col gap-4 flex-shrink-0">
        {/* Profile Card Header Skeleton */}
        <div className="hidden lg:flex lg:h-[86px] bg-white rounded-2xl px-4 sm:px-5 border border-slate-200/70 shadow-2xs items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <SkeletonRect className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <SkeletonTitle className="w-28 h-4" />
              <SkeletonText className="w-36 h-3" />
              <SkeletonRect className="w-24 h-4 rounded-md" />
            </div>
          </div>
          <SkeletonRect className="w-9 h-9 rounded-xl shrink-0" />
        </div>

        {/* Presensi & Disiplin Pekan Ini Card Skeleton */}
        <div className="hidden lg:block bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-0.5">
            <div className="space-y-1">
              <SkeletonTitle className="w-32 h-3.5" />
              <SkeletonText className="w-28 h-3" />
            </div>
            <SkeletonRect className="w-16 h-5 rounded-full" />
          </div>

          {/* 5 Workdays Strip Skeleton */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
            {[1, 2, 3, 4, 5].map((d) => (
              <div key={d} className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col items-center gap-1.5">
                <SkeletonText className="w-6 h-2.5" />
                <SkeletonText className="w-8 h-3.5" />
                <SkeletonRect className="w-8 h-3.5 rounded-full" />
              </div>
            ))}
          </div>

          {/* Summary Strip Skeleton */}
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
            <SkeletonText className="w-24 h-3" />
            <SkeletonText className="w-16 h-3.5" />
          </div>

          {/* Paspor Digital Card Skeleton */}
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SkeletonRect className="w-8 h-8 rounded-xl shrink-0" />
              <div className="space-y-1">
                <SkeletonText className="w-24 h-3" />
                <SkeletonText className="w-32 h-2.5" />
              </div>
            </div>
            <SkeletonRect className="w-4 h-4 rounded-md" />
          </div>
        </div>

        {/* Mentor Endorsement Card Skeleton */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SkeletonRect className="w-4 h-4 rounded-md" />
              <SkeletonTitle className="w-28 h-3.5" />
            </div>
            <SkeletonRect className="w-14 h-4 rounded-full" />
          </div>

          <div className="space-y-1.5 py-1">
            <SkeletonText className="w-full h-3" />
            <SkeletonText className="w-11/12 h-3" />
            <SkeletonText className="w-4/5 h-3" />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="space-y-1">
              <SkeletonText className="w-24 h-3.5" />
              <SkeletonText className="w-32 h-2.5" />
            </div>
            <SkeletonRect className="w-20 h-5 rounded-full" />
          </div>
        </div>
      </aside>
    </div>
  );
}
