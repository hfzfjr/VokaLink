import React from "react";
import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Portal Guru Pembimbing — VokaLink",
  description:
    "Live Competency Heatmap, deteksi drift kesenjangan kurikulum, dan intervensi pembimbingan PKL siswa.",
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard allowedRoles={["TEACHER"]}>{children}</AuthGuard>;
}
