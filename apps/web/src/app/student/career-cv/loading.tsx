import { SkeletonTitle, SkeletonText, SkeletonRect } from "@/components/ui/Skeleton";

export default function CareerCvLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200 font-sans max-w-5xl mx-auto">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="space-y-1.5">
          <SkeletonTitle className="w-56 h-7" />
          <SkeletonText className="w-80 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonRect className="w-32 h-10 rounded-xl" />
          <SkeletonRect className="w-28 h-10 rounded-xl" />
        </div>
      </div>

      {/* Main CV Document Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <SkeletonTitle className="w-64 h-8" />
            <SkeletonText className="w-48 h-4" />
            <SkeletonText className="w-60 h-3.5" />
          </div>
          <SkeletonRect className="w-24 h-24 rounded-2xl shrink-0" />
        </div>

        <div className="space-y-3">
          <SkeletonTitle className="w-40 h-5" />
          <SkeletonText className="w-full h-3.5" />
          <SkeletonText className="w-5/6 h-3.5" />
        </div>

        <div className="space-y-4 pt-2">
          <SkeletonTitle className="w-48 h-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SkeletonRect className="h-28 rounded-2xl" />
            <SkeletonRect className="h-28 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
