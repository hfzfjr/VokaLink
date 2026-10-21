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
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        page: "80rem",
      },
    },
  },
  plugins: [],
};

export default config;
