"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = "vokalink_pwa_dismissed_until";
const DISMISS_DAYS = 3;

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Cek apakah sudah berjalan dalam mode standalone (sudah terinstal PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Cek apakah sedang berjalan di perangkat iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) &&
      !(window.navigator as unknown as { standalone?: boolean }).standalone;
    setIsIOS(isIosDevice);

    // 3. Cek apakah user pernah menekan "Nanti Saja" dalam kurun waktu 3 hari
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setIsDismissed(true);
      }
    } catch {
      // Abaikan bila storage diblokir
    }

    // 4. Tangkap event native beforeinstallprompt untuk Android / Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      setShowIOSGuide(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback: jika belum ada event native tapi user ingin pasang, buka petunjuk
      setShowIOSGuide(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn("PWA install prompt error:", err);
    }
  }, [deferredPrompt, isIOS]);

  const dismissPrompt = useCallback(() => {
    setIsDismissed(true);
    setShowIOSGuide(false);
    try {
      const expiresAt = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(expiresAt));
    } catch {
      // Abaikan bila storage diblokir
    }
  }, []);

  const openIOSGuide = useCallback(() => setShowIOSGuide(true), []);
  const closeIOSGuide = useCallback(() => setShowIOSGuide(false), []);

  return {
    isInstallable: isInstallable || (isIOS && !isInstalled),
    isInstalled,
    isDismissed,
    isIOS,
    showIOSGuide,
    promptInstall,
    dismissPrompt,
    openIOSGuide,
    closeIOSGuide,
  };
}
