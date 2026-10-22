/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FR-009: Smart Intervention Dispatcher Pure Logic
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface InterventionDraftParams {
  studentName: string;
  studentNisn?: string;
  departmentName: string;
  schoolName: string;
  teacherName: string;
  mentorName: string;
  mentorTitle?: string;
  dudiName: string;
  alertType?: "NON_COMPETENCY_OVERLOAD" | "SKILL_MONOTONY" | "APPROVAL_DORMANCY" | "GENERAL";
  // Metrics
  completedJp?: number;
  completedElements?: string[];
  zeroJpElements?: string[];
  recommendedJobCards?: string[];
  nonCompetencyJpLast14Days?: number;
  totalJpLast14Days?: number;
  dominantElementName?: string;
  dominantJp?: number;
  dominantRatio?: number;
  dormantLogCount?: number;
  magicLinkUrl?: string;
}

/**
 * Normalisasi nomor telepon seluler Indonesia ke format internasional 628...
 * Sesuai PRD FR-009: mengubah awalan 08... menjadi 628... dan membuang karakter non-angka.
 */
export function normalizeIndonesianPhoneNumber(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
}

/**
 * Membuat tautan resmi WhatsApp deep link
 */
export function buildWhatsAppDeepLink(phone: string, text: string): string {
  const normalizedPhone = normalizeIndonesianPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
}

/**
 * Menyusun draf pesan koordinasi WhatsApp berbasis data yang sopan dan profesional.
 * Memuat nama siswa, apresiasi bimbingan, rincian data defisit, dan permohonan spesifik.
 */
export function generateInterventionMessage(params: InterventionDraftParams): string {
  const mentorTitleStr = params.mentorTitle ? ` (${params.mentorTitle})` : "";
  const alertType = params.alertType || "GENERAL";

  switch (alertType) {
    case "NON_COMPETENCY_OVERLOAD": {
      const nonCompJp = params.nonCompetencyJpLast14Days || 0;
      const total14d = params.totalJpLast14Days || 40;
      const percentage = Math.round((nonCompJp / (total14d || 1)) * 100);
      const zeroElementsText =
        params.zeroJpElements && params.zeroJpElements.length > 0
          ? params.zeroJpElements.join(", ")
          : "elemen kejuruan utama";
      const jobCardsText =
        params.recommendedJobCards && params.recommendedJobCards.length > 0
          ? ` (seperti: ${params.recommendedJobCards.join(", ")})`
          : "";

      return (
        `Yth. Bapak/Ibu ${params.mentorName}${mentorTitleStr}, ${params.dudiName}\n\n` +
        `Salam hormat, saya ${params.teacherName}, Guru Pembimbing PKL dari ${params.schoolName}. ` +
        `Pertama-tama kami mengucapkan terima kasih banyak atas bimbingan dan kesempatan belajar yang diberikan kepada siswa kami, ${params.studentName} (${params.departmentName}).\n\n` +
        `Berdasarkan rekapitulasi pemantauan berkala 14 hari terakhir, tercatat ${nonCompJp} JP (${percentage}%) kegiatan siswa berada pada penugasan bantuan operasional umum. ` +
        `Agar target kompetensi kejuruan ${params.studentName} dapat tercapai optimal sesuai kurikulum, kami memohon bantuan Bapak/Ibu untuk mulai mengarahkan siswa pada pekerjaan teknis kejuruan dalam 2 minggu ke depan, khususnya pada: ${zeroElementsText}${jobCardsText}.\n\n` +
        `Atas kerja sama, arahan, dan bimbingan yang Bapak/Ibu berikan, kami haturkan terima kasih banyak.\n\n` +
        `Salam hormat,\n${params.teacherName}\n${params.schoolName}`
      );
    }

    case "SKILL_MONOTONY": {
      const dominantElement = params.dominantElementName || "satu bidang keahlian";
      const dominantJp = params.dominantJp || 0;
      const dominantPct = Math.round((params.dominantRatio || 0.85) * 100);
      const zeroElementsText =
        params.zeroJpElements && params.zeroJpElements.length > 0
          ? params.zeroJpElements.join(", ")
          : "elemen materi kompetensi lainnya";

      return (
        `Yth. Bapak/Ibu ${params.mentorName}${mentorTitleStr}, ${params.dudiName}\n\n` +
        `Salam sejahtera, saya ${params.teacherName}, Guru Pembimbing PKL dari ${params.schoolName} untuk siswa kami, ${params.studentName} (${params.departmentName}).\n\n` +
        `Kami sangat berterima kasih dan mengapresiasi kemajuan pesat siswa kami yang telah menguasai kompetensi ${dominantElement} dengan total capaian ${dominantJp} JP (${dominantPct}%).\n\n` +
        `Agar portofolio keahlian siswa berkembang seimbang dan memenuhi seluruh spektrum kurikulum nasional, kami memohon perkenan Bapak/Ibu untuk mulai merotasi atau melibatkan ${params.studentName} pada elemen kompetensi lainnya yang saat ini masih memerlukan jam praktik, seperti: ${zeroElementsText}.\n\n` +
        `Terima kasih banyak atas dedikasi dan bimbingan Bapak/Ibu dalam mencetak calon lulusan vokasi yang unggul dan adaptif.\n\n` +
        `Salam takzim,\n${params.teacherName}\n${params.schoolName}`
      );
    }

    case "APPROVAL_DORMANCY": {
      const dormantCount = params.dormantLogCount || 1;
      const magicLinkText = params.magicLinkUrl
        ? `\n\nBapak/Ibu dapat langsung memeriksa dan menyetujui seluruh entri jurnal sekaligus tanpa perlu login akun (< 10 detik) melalui tautan verifikasi resmi berikut:\n👉 ${params.magicLinkUrl}`
        : "";

      return (
        `Yth. Bapak/Ibu ${params.mentorName}${mentorTitleStr}, ${params.dudiName}\n\n` +
        `Salam hangat dari ${params.schoolName}. Saya ${params.teacherName}, Guru Pembimbing PKL siswa ${params.studentName} (${params.departmentName}).\n\n` +
        `Kami menginformasikan bahwa saat ini terdapat ${dormantCount} entri jurnal harian kegiatan praktik siswa kami yang sedang menunggu validasi Bapak/Ibu (lebih dari 7 hari kalender).` +
        `${magicLinkText}\n\n` +
        `Pengesahan Bapak/Ibu sangat penting agar rekam jejak jam kerja siswa tercatat resmi dan tepat waktu. Terima kasih banyak atas kesediaan Bapak/Ibu meluangkan waktu.\n\n` +
        `Salam hormat,\n${params.teacherName}\n${params.schoolName}`
      );
    }

    case "GENERAL":
    default: {
      return (
        `Yth. Bapak/Ibu ${params.mentorName}${mentorTitleStr}, ${params.dudiName}\n\n` +
        `Salam hormat, saya ${params.teacherName}, Guru Pembimbing PKL dari ${params.schoolName} terkait siswa kami, ${params.studentName} (${params.departmentName}).\n\n` +
        `Kami ingin berkoordinasi mengenai perkembangan kegiatan PKL dan capaian pembelajaran siswa kami di ${params.dudiName}. ` +
        `Kami sangat menghargai arahan dan bimbingan yang telah Bapak/Ibu berikan.\n\n` +
        `Terima kasih atas kerja samanya.\n\n` +
        `Salam hormat,\n${params.teacherName}\n${params.schoolName}`
      );
    }
  }
}
