import React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "Panel Pengelola SMK — VokaLink",
  description:
    "Manajemen kurikulum CP, sinkronisasi kemitraan DUDI, smart placement, dan e-Rapor PKL SMK.",
};

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
