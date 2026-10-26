import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF8F5",
        line: "#E7E1D8",
        ink: {
          50: "#F3F6F9",
          100: "#E8EEF4",
          200: "#D3DEE9",
          300: "#A9BBCD",
          500: "#4A6A8A",
          700: "#1E4468",
          900: "#0F2A43",
          950: "#081827",
        },
        safety: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          400: "#FB923C",
          500: "#F97316",
          700: "#C2410C",
        },
        ok: {
          100: "#DCFCE7",
          700: "#15803D",
        },
        warn: {
          100: "#FEF3C7",
          700: "#A16207",
        },
        danger: {
          100: "#FEE2E2",
          700: "#B91C1C",
        },
        info: {
          100: "#DBEAFE",
          700: "#1D4ED8",
        },
        primary: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          500: "#0EA5E9",
          600: "#0EA5E9",
          700: "#0284C7",
        },
        canvas: "#F8FAFD",
        surface: "#FFFFFF",
        muted: "#F8FAFC",
        content: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
        },
        border: {
          default: "#E2E8F0",
          strong: "#CBD5E1",
        },
        accent: {
          teal: "#0D9488",
          "teal-light": "#F0FDFA",
          sky: "#0284C7",
          "sky-light": "#F0F9FF",
          indigo: "#4338CA",
          "indigo-light": "#EEF2FF",
          rose: "#E11D48",
          "rose-light": "#FFF1F2",
          amber: "#D97706",
          "amber-light": "#FFFBEB",
        },
        brand: {
          blue: "#1D4ED8",
          blueHover: "#1E40AF",
          lightBlue: "#2563EB",
          bg: "#F3F6FC",
          mint: "#10B981",
          amber: "#F59E0B",
          coral: "#F43F5E",
          purple: "#6366F1",
          slateCard: "#F8FAFC",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
        pill: "0 4px 12px -2px rgba(37, 99, 235, 0.2)",
        modal: "0 20px 40px -8px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.06)",
        soft: "0 14px 40px -10px rgba(37, 99, 235, 0.08)",
        floating: "0 20px 48px -12px rgba(15, 23, 42, 0.12)",
        capsule: "0 6px 18px -2px rgba(0, 0, 0, 0.1)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", '"Plus Jakarta Sans"', "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      maxWidth: {
        page: "80rem",
      },
    },
  },
  plugins: [],
};

export default config;
