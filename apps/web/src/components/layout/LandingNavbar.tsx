"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Menu, X } from "lucide-react";
import VokaLogo from "@/components/common/VokaLogo";

interface LandingNavbarProps {
  onScheduleDemo?: () => void;
}

export default function LandingNavbar({ onScheduleDemo }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <VokaLogo size="md" href="/" />

        {/* Desktop Nav Menu */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60 text-xs font-semibold text-slate-600">
          <a href="#fitur" className="px-4 py-2 rounded-full hover:text-sky-600 hover:bg-white transition">
            Fitur 3 Dimensi
          </a>
          <a href="#alur" className="px-4 py-2 rounded-full hover:text-sky-600 hover:bg-white transition">
            Alur Kerja PKL
          </a>
          <a href="#simulasi" className="px-4 py-2 rounded-full hover:text-sky-600 hover:bg-white transition">
            Simulasi Jurusan
          </a>
          <a href="#testimoni" className="px-4 py-2 rounded-full hover:text-sky-600 hover:bg-white transition">
            Testimoni Sekolah
          </a>
          <a href="#faq" className="px-4 py-2 rounded-full hover:text-sky-600 hover:bg-white transition">
            FAQ
          </a>
        </nav>

        {/* CTA Buttons Right */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-700 bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition shadow-xs inline-flex items-center gap-1.5"
          >
            <ExternalLink className="size-3.5 text-sky-500" />
            <span>Masuk Portal</span>
          </Link>
          <button
            type="button"
            onClick={onScheduleDemo}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-md shadow-sky-500/25 transition cursor-pointer"
          >
            Jadwalkan Demo Sekolah
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-base focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-3">
          <a
            href="#fitur"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 hover:text-sky-600 py-1.5"
          >
            Fitur 3 Dimensi
          </a>
          <a
            href="#alur"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 hover:text-sky-600 py-1.5"
          >
            Alur Kerja PKL
          </a>
          <a
            href="#simulasi"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 hover:text-sky-600 py-1.5"
          >
            Simulasi Jurusan SMK
          </a>
          <a
            href="#testimoni"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 hover:text-sky-600 py-1.5"
          >
            Testimoni DUDI
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 hover:text-sky-600 py-1.5"
          >
            FAQ
          </a>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full text-center py-2.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100"
            >
              Masuk Portal
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onScheduleDemo?.();
              }}
              className="w-full text-center py-2.5 rounded-full text-xs font-bold text-white bg-sky-500 hover:bg-sky-600"
            >
              Jadwalkan Demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
