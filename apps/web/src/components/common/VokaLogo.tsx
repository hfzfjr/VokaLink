import Link from "next/link";

interface VokaLogoProps {
  /** Tampilkan teks "VokaLink" di samping ikon. Default: true */
  showText?: boolean;
  /** Ukuran kotak ikon. Default: "md" */
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { box: "w-7 h-7 rounded-md text-sm", text: "text-sm" },
  md: { box: "w-8 h-8 rounded-lg text-base", text: "text-base" },
  lg: { box: "w-10 h-10 rounded-xl text-lg", text: "text-lg" },
};

export default function VokaLogo({
  showText = true,
  size = "md",
  href = "/",
  className = "",
}: VokaLogoProps) {
  const { box, text } = sizeMap[size];

  const inner = (
    <span className={`flex items-center gap-2 ${className}`}>
      <span
        className={`${box} bg-blue-600 flex items-center justify-center text-white font-black shadow-xs shrink-0`}
      >
        V
      </span>
      {showText && (
        <span className={`font-extrabold text-slate-900 tracking-tight ${text}`}>
          VokaLink
        </span>
      )}
    </span>
  );

  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
