"use client";

import React from "react";
import { SkeletonTitle, SkeletonText, SkeletonRect } from "@/components/ui/Skeleton";

export function HomeSkeleton() {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-5 items-stretch min-h-[840px] animate-in fade-in-0 duration-200">
      {/* ─── Center Section Canvas Skeleton ─── */}
      <section className="flex-1 min-w-0 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-200/70 shadow-card flex flex-col justify-between overflow-hidden">
        <div>
          {/* Mobile Top Metric Strip Skeleton */}
          <div className="lg:hidden mb-4 space-y-2.5">
            <SkeletonRect className="w-full h-16 rounded-2xl" />
            <div className="grid grid-cols-3 gap-2">
              <SkeletonRect className="h-16 rounded-2xl" />
              <SkeletonRect className="h-16 rounded-2xl" />
              <SkeletonRect className="h-16 rounded-2xl" />
            </div>
          </div>

          {/* Header Bar Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-200/70">
            <div className="flex items-center gap-3">
              <SkeletonTitle className="w-32 h-8" />
              <SkeletonRect className="hidden sm:block w-36 h-9 rounded-xl" />
            </div>
            <div className="flex items-center gap-2.5">
              <SkeletonRect className="w-full sm:w-64 h-9 rounded-xl" />
              <SkeletonRect className="w-9 h-9 rounded-xl shrink-0" />
            </div>
          </div>

          {/* Banner Skeleton */}
          <div className="mt-4 p-4 rounded-2xl border border-slate-200/70 bg-slate-50/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <SkeletonRect className="w-8 h-8 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <SkeletonText className="w-48 h-3.5" />
                <SkeletonText className="w-3/4 h-3" />
              </div>
            </div>
            <SkeletonRect className="w-24 h-8 rounded-xl shrink-0" />
          </div>

          {/* View Mode Switcher Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 pb-4">
            <div className="space-y-1.5">
              <SkeletonText className="w-44 h-4" />
              <SkeletonText className="w-56 h-3" />
            </div>
            <SkeletonRect className="w-72 h-8 rounded-xl" />
          </div>

          {/* Kanban Columns Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-4 xl:gap-5 pt-2 pb-6">
            {[1, 2, 3].map((col) => (
              <div
                key={col}
                className="bg-slate-50/60 rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 flex flex-col gap-3.5"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                  <SkeletonText className="w-28 h-3.5" />
                  <SkeletonRect className="w-6 h-6 rounded-full" />
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/70 space-y-3 shadow-xs">
                    <div className="flex justify-between items-center">
                      <SkeletonRect className="w-20 h-5 rounded-full" />
                      <SkeletonRect className="w-12 h-5 rounded-full" />
                    </div>
                    <SkeletonText className="w-full h-4" />
                    <SkeletonText className="w-3/4 h-3" />
                    <SkeletonRect className="w-full h-1.5 rounded-full" />
                    <div className="flex gap-1.5 pt-1">
                      <SkeletonRect className="w-12 h-4 rounded-md" />
                      <SkeletonRect className="w-14 h-4 rounded-md" />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/70 space-y-3 shadow-xs">
                    <div className="flex justify-between items-center">
                      <SkeletonRect className="w-20 h-5 rounded-full" />
                      <SkeletonRect className="w-12 h-5 rounded-full" />
                    </div>
                    <SkeletonText className="w-full h-4" />
                    <SkeletonText className="w-1/2 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Legend Skeleton */}
        <div className="pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <SkeletonRect className="w-16 h-6 rounded-full" />
            <SkeletonRect className="w-28 h-6 rounded-full" />
            <SkeletonRect className="w-24 h-6 rounded-full" />
          </div>
          <SkeletonRect className="w-32 h-6 rounded-full" />
        </div>
      </section>

      {/* ─── Right Aside Skeleton ─── */}
      <aside className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] flex flex-col gap-4 flex-shrink-0">
        <SkeletonRect className="hidden lg:block w-full h-24 rounded-2xl" />
        <div className="hidden lg:grid grid-cols-3 gap-2.5">
          <SkeletonRect className="h-[82px] rounded-2xl" />
          <SkeletonRect className="h-[82px] rounded-2xl" />
          <SkeletonRect className="h-[82px] rounded-2xl" />
        </div>
        <SkeletonRect className="w-full h-44 rounded-2xl" />
        <SkeletonRect className="w-full h-36 rounded-2xl" />
        <SkeletonRect className="w-full h-48 rounded-2xl" />
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <SkeletonRect className="h-11 rounded-xl" />
          <SkeletonRect className="h-11 rounded-xl" />
        </div>
      </aside>
    </div>
  );
}
