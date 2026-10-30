"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, Menu, X } from "lucide-react";
import VokaLogo from "@/components/common/VokaLogo";

const NAV_ITEMS = [
  { id: "fitur", label: "Fitur Ekosistem" },
  { id: "alur", label: "Alur Kerja PKL" },
  { id: "simulasi", label: "Program Keahlian" },
  { id: "testimoni", label: "Testimoni" },
  { id: "faq", label: "FAQ" },
] as const;

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const navItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  // Update sliding pill position based on active tab element
  const updateIndicator = useCallback(() => {
    if (!activeSection) {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const activeEl = navItemRefs.current[activeSection];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    }
  }, [activeSection]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  // Re-measure indicator when window resizes
  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  // Scroll spy to detect active section
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const scrollY = window.scrollY;

      // If in hero area (above first section), no tab is active
      const fiturEl = document.getElementById("fitur");
      const fiturThreshold = fiturEl ? fiturEl.offsetTop - 200 : 300;
      if (scrollY < fiturThreshold) {
        setActiveSection(null);
        return;
      }

      // If scrolled to bottom of page, activate last item
      const isBottom =
        window.innerHeight + scrollY >= document.documentElement.scrollHeight - 80;
      if (isBottom) {
        setActiveSection("faq");
        return;
      }

      // Check sections from bottom to top with navbar offset
      const offset = 140;
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const item = NAV_ITEMS[i];
        if (!item) continue;
        const el = document.getElementById(item.id);
        if (el && scrollY >= el.offsetTop - offset) {
          setActiveSection(item.id);
          return;
        }
      }

      setActiveSection(null);
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check on mount
    handleScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToMobile = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveSection(id);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveSection(null);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
        {/* Left Section: Mobile (Hamburger + Logo) / Desktop (Logo only) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 flex items-center justify-center transition focus:outline-none"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          {/* Brand Logo with Smooth Scroll to Top */}
          <VokaLogo size="md" href="/" onClick={scrollToTop} className="shrink-0" />
        </div>

        {/* Center Section: Desktop Nav Menu with Animated Sliding Indicator */}
        <nav className="relative hidden lg:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60 text-xs font-semibold text-slate-600">
          {/* Animated Sliding Pill */}
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 left-0 rounded-full bg-white shadow-xs border border-slate-200/60 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
            style={{
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
          />

          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                ref={(el) => {
                  navItemRefs.current[item.id] = el;
                }}
                href={`#${item.id}`}
                onClick={scrollTo(item.id)}
                className={`relative z-10 px-4 py-2 rounded-full transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? "text-sky-600 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Right Section: Mobile (Masuk Portal only) / Desktop (Masuk Portal + Daftarkan Sekolah) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/login"
            className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-bold text-slate-700 bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition shadow-xs inline-flex items-center gap-1.5"
          >
            <ExternalLink className="size-3.5 text-sky-500" />
            <span>Masuk Portal</span>
          </Link>
          <Link
            href="/register-school"
            className="hidden lg:inline-flex px-5 py-2.5 rounded-full text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-md shadow-sky-500/25 transition cursor-pointer"
          >
            Daftarkan Sekolah
          </Link>
        </div>
      </div>

      {/* Mobile Floating Overlay Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Click Outside */}
          <div
            className="fixed inset-0 top-20 bg-slate-900/20 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Floating Menu Panel */}
          <div className="absolute top-full inset-x-0 bg-white border-b border-slate-200 shadow-2xl px-6 py-5 space-y-2 z-40 lg:hidden">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={scrollToMobile(item.id)}
                  className={`block text-sm py-2.5 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-sky-50 text-sky-600 font-bold border-l-4 border-sky-500 pl-3"
                      : "font-semibold text-slate-700 hover:text-sky-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition"
              >
                Masuk Portal
              </Link>
              <Link
                href="/register-school"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-md shadow-sky-500/25 transition"
              >
                Daftarkan Sekolah
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

