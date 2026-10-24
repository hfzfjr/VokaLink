import Link from "next/link";
import { Lightbulb } from "lucide-react";

interface VokaLogoProps {
  /** Tampilkan teks "VokaLink" di samping ikon. Default: true */
  showText?: boolean;
  /** Ukuran kotak ikon. Default: "md" */
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { box: "size-7 rounded-lg", icon: "size-4", text: "text-sm", sub: "text-[8px]" },
  md: { box: "size-9 rounded-xl", icon: "size-5", text: "text-base", sub: "text-[9px]" },
  lg: { box: "size-11 rounded-2xl", icon: "size-6", text: "text-lg", sub: "text-[10px]" },
};

export default function VokaLogo({
  showText = true,
  size = "md",
  href = "/",
  className = "",
}: VokaLogoProps) {
  const { box, icon, text, sub } = sizeMap[size];

  const inner = (
    <span className={`inline-flex items-center gap-2.5 group ${className}`}>
      <span
        className={`${box} bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/25 shrink-0 group-hover:scale-105 transition duration-150`}
      >
        <Lightbulb className={`${icon} text-white`} />
      </span>
      {showText && (
        <span className="leading-tight">
          <span className={`font-extrabold text-slate-900 tracking-tight block ${text}`}>
            VokaLink <span className="text-sky-500">SMK</span>
          </span>
          <span className={`font-bold tracking-widest text-slate-400 uppercase block ${sub}`}>
            Sistem Monitoring PKL
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
