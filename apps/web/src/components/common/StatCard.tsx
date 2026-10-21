import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  /** Warna tema kartu. Default: "blue" */
  color?: "blue" | "purple" | "emerald" | "amber" | "rose" | "slate";
  /** Unit teks kecil di bawah nilai, opsional */
  unit?: string;
}

const colorMap: Record<
  NonNullable<StatCardProps["color"]>,
  { bg: string; text: string }
> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "blue",
  unit,
}: StatCardProps) {
  const { bg, text } = colorMap[color];
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
      <div className={`p-3 rounded-xl ${bg} ${text} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-black text-slate-900 leading-tight">
          {value}
          {unit && (
            <span className="text-xs font-semibold text-slate-400 ml-1">{unit}</span>
          )}
        </p>
      </div>
    </div>
  );
}
