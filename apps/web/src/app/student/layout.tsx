import React from "react";
import type { Metadata } from "next";
import { StudentShell } from "@/components/shell/StudentShell";

export const metadata: Metadata = {
  title: "Portal Siswa PKL — VokaLink",
  description:
    "Logbook harian offline-first, pencatatan kartu kerja zero-typing, bukti WebP, dan portofolio CV ATS VokaLink.",
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentShell>{children}</StudentShell>;
}
