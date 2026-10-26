import { SkeletonTitle, SkeletonText, SkeletonRect } from "@/components/ui/Skeleton";

export default function HistoryLoading() {
  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in-0 duration-200 font-sans">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-200/80">
        <div className="space-y-1.5">
          <SkeletonTitle className="w-48 h-7" />
          <SkeletonText className="w-72 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonRect className="w-28 h-9 rounded-xl" />
        </div>
      </div>

      {/* Filter Tabs & Search Bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonRect key={i} className="w-24 h-9 rounded-xl shrink-0" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <SkeletonRect className="w-full sm:w-64 h-9 rounded-xl" />
          <SkeletonRect className="w-20 h-9 rounded-xl" />
        </div>
      </div>

      {/* Grid of Bento Log Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200/70 shadow-2xs space-y-3.5"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SkeletonRect className="w-4 h-4 rounded-md" />
                  <SkeletonText className="w-24 h-3.5" />
                </div>
                <SkeletonRect className="w-16 h-5 rounded-full" />
              </div>

              <div className="space-y-1.5 pt-0.5">
                <SkeletonTitle className="w-4/5 h-4.5" />
                <SkeletonText className="w-full h-3" />
                <SkeletonText className="w-2/3 h-3" />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <SkeletonRect className="w-28 h-5 rounded-md" />
                <SkeletonRect className="w-20 h-5 rounded-md" />
              </div>
            </div>

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
  );
}
