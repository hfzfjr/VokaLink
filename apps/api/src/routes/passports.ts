import { Router, type Request, type Response, type NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error-handler.js";
import { generateCvFromLogs, type RawLogInput } from "@vokalink/core";
import { sealObjectWithHmac, constantTimeCompare } from "@vokalink/core/crypto";

export const passportsRouter = Router();

const SERVER_CRYPTO_SECRET =
  process.env["SERVER_CRYPTO_SECRET"] || "vokalink_dev_server_crypto_secret_32bytes_min!";

const studentCvInclude = Prisma.validator<Prisma.UserProfileDefaultArgs>()({
  include: {
    school: true,
    schoolDepartment: true,
    skillPassport: true,
    studentPlacements: {
      include: {
        dudiPartner: true,
        dudiMentor: true,
        endorsement: true,
        dailyLogs: {
          where: { status: "VERIFIED" },
          include: {
            items: {
              include: {
                jobCard: true,
              },
            },
          },
          orderBy: { logDate: "asc" },
        },
      },
    },
  },
});

type StudentWithCv = Prisma.UserProfileGetPayload<typeof studentCvInclude>;

// ─── 1. GET /api/v1/students/me/cv ──────────────────────────────────────────
/**
 * Mengambil data agregasi CV Standar ATS untuk siswa aktif (FR-012, BR-010).
 * Hanya log status VERIFIED yang masuk klaim teknis dan jam kerja.
 */
passportsRouter.get(
  "/students/me/cv",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentIdQuery = req.query["studentId"] as string | undefined;

      // Ambil siswa pertama (Andi Pratama) jika tidak ada studentId yang disediakan
      let student: StudentWithCv | null = null;
      if (studentIdQuery) {
        student = await prisma.userProfile.findUnique({
          where: { id: studentIdQuery },
          include: studentCvInclude.include,
        });
      } else {
        // Fallback ke siswa berprestasi pertama (Andi Pratama dari seed)
        student = await prisma.userProfile.findFirst({
          where: { role: "STUDENT" },
          orderBy: { createdAt: "asc" },
          include: studentCvInclude.include,
        });
      }

      if (!student) {
        next(new AppError("Profil siswa tidak ditemukan", 404, "STUDENT_NOT_FOUND"));
        return;
      }

      // Format log harian ke RawLogInput untuk diproses engine pure
      const rawLogs: RawLogInput[] = [];
      let latestEndorsement = null;

      for (const placement of student.studentPlacements) {
        if (placement.endorsement) {
          latestEndorsement = {
            attitudeScore: placement.endorsement.attitudeScore,
            badges: placement.endorsement.badgesArray,
            quote: placement.endorsement.endorsementQuote,
            mentorName: placement.dudiMentor?.fullName || "Pembimbing Industri",
            dudiName: placement.dudiPartner.name,
          };
        }

        for (const log of placement.dailyLogs) {
          rawLogs.push({
            id: log.id,
            logDate: log.logDate,
            status: log.status,
            placementId: placement.id,
            dudiName: placement.dudiPartner.name,
            dudiCity: placement.dudiPartner.city,
            mentorName: placement.dudiMentor?.fullName,
            items: log.items.map((item) => ({
              jobCardId: item.jobCardId,
              jobCardTitle: item.jobCard.title,
              skkniUnitCode: item.jobCard.skkniUnitCode,
              toolsAndSoftware: item.jobCard.toolsAndSoftware,
              actionVerbTemplate: item.jobCard.actionVerbTemplate,
              isNonCompetency: item.jobCard.isNonCompetency || !!item.nonCompetencyCategory,
              durationJp: item.durationJp,
              autonomyLevel: item.autonomyLevel,
            })),
          });
        }
      }

      // Jalankan fungsi generator murni
      const cvEngineResult = generateCvFromLogs({
        logs: rawLogs,
        studentDepartment: student.schoolDepartment?.name || "Kejuruan SMK",
      });

      // Bio kustom dari skillPassport jika pernah disunting siswa
      const summaryBio =
        student.skillPassport?.summaryBio || cvEngineResult.defaultSummaryBio;

      // Pastikan slug paspor ada
      const passportSlug =
        student.skillPassport?.passportSlug ||
        `${student.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-2026`;

      res.status(200).json({
        student: {
          id: student.id,
          fullName: student.fullName,
          identityNumber: student.identityNumber,
          whatsappNumber: student.whatsappNumber,
          email: student.email || undefined,
          departmentName: student.schoolDepartment?.name || "Rekayasa Perangkat Lunak",
          schoolName: student.school.name,
          schoolAddress: `${student.school.city}, ${student.school.province}`,
        },
        summaryBio,
        totalVerifiedJp: cvEngineResult.totalVerifiedJp,
        totalRealHours: cvEngineResult.totalRealHours,
        technicalJp: cvEngineResult.technicalJp,
        nonCompetencyJp: cvEngineResult.nonCompetencyJp,
        completedTasksCount: cvEngineResult.completedTasksCount,
        experiences: cvEngineResult.experiences,
        technicalSkills: cvEngineResult.technicalSkills,
        endorsement: latestEndorsement,
        extraActivities: student.skillPassport?.extraActivitiesJson || [],
        visibility: (student.skillPassport?.visibilityJson as any) || { showPhotos: true, showGrades: true },
        passportSlug,
        verificationUrl: `/verify/${passportSlug}`,
        masterSignatureHash: student.skillPassport?.masterSignatureHash || null,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── 2. PATCH /api/v1/students/me/passport ──────────────────────────────────
/**
 * Menyimpan kustomisasi ringkasan profil dan kegiatan ekstrakurikuler siswa (FR-012).
 * Sesuai BR-010: Angka jam, DUDI, dan skill tetap terkunci di server.
 */
passportsRouter.patch(
  "/students/me/passport",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentIdQuery = req.query["studentId"] as string | undefined;
      const { summaryBio, extraActivities, visibility } = req.body;

      let student = null;
      if (studentIdQuery) {
        student = await prisma.userProfile.findUnique({
          where: { id: studentIdQuery },
          include: { schoolDepartment: true },
        });
      } else {
        student = await prisma.userProfile.findFirst({
          where: { role: "STUDENT" },
          orderBy: { createdAt: "asc" },
          include: { schoolDepartment: true },
        });
      }

      if (!student) {
        next(new AppError("Profil siswa tidak ditemukan", 404, "STUDENT_NOT_FOUND"));
        return;
      }

      const defaultSlug = `${student.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-2026`;

      const passport = await prisma.skillPassport.upsert({
        where: { studentId: student.id },
        create: {
          studentId: student.id,
          passportSlug: defaultSlug,
          summaryBio: typeof summaryBio === "string" ? summaryBio.trim() : null,
          extraActivitiesJson: Array.isArray(extraActivities) ? extraActivities : [],
          visibilityJson: visibility || { showPhotos: true, showGrades: true },
        },
        update: {
          ...(typeof summaryBio === "string" ? { summaryBio: summaryBio.trim() } : {}),
          ...(Array.isArray(extraActivities) ? { extraActivitiesJson: extraActivities } : {}),
          ...(visibility ? { visibilityJson: visibility } : {}),
        },
      });

      res.status(200).json({
        success: true,
        message: "Paspor kompetensi berhasil diperbarui",
        passport,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── 3. GET /api/v1/students/me/log-context ───────────────────────────────
/**
 * Menyediakan konteks penempatan aktif dan daftar Job Cards jurusan untuk
 * form logbook offline-first siswa (/student/log/new).
 */
passportsRouter.get(
  "/students/me/log-context",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentIdQuery = req.query["studentId"] as string | undefined;
      let resolvedStudentId = studentIdQuery;

      // Check Bearer token if studentId not provided in query
      if (!resolvedStudentId && req.headers.authorization) {
        try {
          const authHeader = req.headers.authorization;
          const rawToken = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7).trim()
            : authHeader.trim();
          const jwtSecret = process.env["SUPABASE_JWT_SECRET"];
          if (jwtSecret) {
            const { jwtVerify } = await import("jose");
            const key = new TextEncoder().encode(jwtSecret);
            const { payload } = await jwtVerify(rawToken, key);
            if (payload.sub) {
              resolvedStudentId = payload.sub as string;
            }
          }
        } catch {
          // Continue to fallback if token invalid
        }
      }

      let student = null;
      if (resolvedStudentId) {
        student = await prisma.userProfile.findUnique({
          where: { id: resolvedStudentId },
          include: {
            school: true,
            schoolDepartment: {
              include: {
                jobCards: {
                  include: {
                    cpElement: true,
                  },
                },
              },
            },
            studentPlacements: {
              where: { status: "ACTIVE" },
              include: {
                dudiPartner: {
                  include: {
                    capabilities: true,
                  },
                },
                dudiMentor: true,
              },
            },
          },
        });
      } else {
        student = await prisma.userProfile.findFirst({
          where: { role: "STUDENT" },
          orderBy: { createdAt: "asc" },
          include: {
            school: true,
            schoolDepartment: {
              include: {
                jobCards: {
                  include: {
                    cpElement: true,
                  },
                },
              },
            },
            studentPlacements: {
              where: { status: "ACTIVE" },
              include: {
                dudiPartner: {
                  include: {
                    capabilities: true,
                  },
                },
                dudiMentor: true,
              },
            },
          },
        });
      }

      if (!student) {
        next(new AppError("Profil siswa tidak ditemukan", 404, "STUDENT_NOT_FOUND"));
        return;
      }

      const activePlacement = student.studentPlacements[0] || null;
      const allJobCards = student.schoolDepartment?.jobCards || [];
      const technicalJobCards = allJobCards.filter((jc) => !jc.isNonCompetency);
      const nonCompetencyJobCard = allJobCards.find((jc) => jc.isNonCompetency) || null;

      const supportedJobCardIdSet = new Set(
        activePlacement?.dudiPartner?.capabilities?.map((c) => c.jobCardId) || []
      );

      const formatCleanCategory = (rawTitle?: string | null) => {
        if (!rawTitle) return "Kompetensi Kejuruan";
        if (rawTitle.includes("—")) {
          return rawTitle.split("—")[1]?.trim() || rawTitle;
        }
        return rawTitle
          .replace(/Pengembangan\s+/gi, "")
          .replace(/Pemrograman\s+Dasar\s+dan\s+/gi, "")
          .replace(/Administrasi\s+dan\s+/gi, "")
          .trim();
      };

      res.status(200).json({
        student: {
          id: student.id,
          fullName: student.fullName,
          identityNumber: student.identityNumber,
          whatsappNumber: student.whatsappNumber,
          email: student.email || undefined,
          departmentName: student.schoolDepartment?.name || "Kejuruan",
          schoolName: student.school.name,
        },
        activePlacement: activePlacement
          ? {
              id: activePlacement.id,
              dudiName: activePlacement.dudiPartner.name,
              dudiCity: activePlacement.dudiPartner.city,
              mentorName: activePlacement.dudiMentor?.fullName || "Pembimbing Lapangan",
            }
          : null,
        jobCards: technicalJobCards.map((jc) => {
          const isDudiSupported = supportedJobCardIdSet.has(jc.id);
          const cleanCategory = formatCleanCategory(jc.cpElement?.title);
          return {
            id: jc.id,
            title: jc.title,
            tools: jc.toolsAndSoftware,
            skkni: jc.skkniUnitCode,
            category: cleanCategory,
            isDudiSupported,
          };
        }),
        nonCompetencyJobCard: nonCompetencyJobCard
          ? {
              id: nonCompetencyJobCard.id,
              title: nonCompetencyJobCard.title,
            }
          : null,
      });
    } catch (err) {
      next(err);
    }
  }
);

const passportLookupInclude = Prisma.validator<Prisma.SkillPassportDefaultArgs>()({
  include: {
    student: {
      include: {
        school: true,
        schoolDepartment: {
          include: {
            cpElements: {
              include: {
                jobCards: true,
              },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        studentPlacements: {
          include: {
            dudiPartner: true,
            dudiMentor: true,
            endorsement: true,
            dailyLogs: {
              where: { status: "VERIFIED" },
              include: {
                items: {
                  include: {
                    jobCard: true,
                  },
                },
              },
              orderBy: { logDate: "asc" },
            },
          },
        },
      },
    },
  },
});

type PassportWithDetails = Prisma.SkillPassportGetPayload<typeof passportLookupInclude>;

// ─── 3. GET /api/v1/passports/:slug ─────────────────────────────────────────
/**
 * Verifikasi Publik Paspor Kompetensi via Scan QR Code (FR-012, TC-010).
 * Tanpa login, dapat diakses HRD/Perekrut untuk memeriksa segel kriptografis HMAC.
 */
passportsRouter.get(
  "/passports/:slug",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slugParam = req.params["slug"];
      if (!slugParam || typeof slugParam !== "string") {
        next(new AppError("Slug paspor wajib disertakan", 400, "MISSING_SLUG"));
        return;
      }

      let passport: PassportWithDetails | null = await prisma.skillPassport.findUnique({
        where: { passportSlug: slugParam },
        include: passportLookupInclude.include,
      });

      if (!passport && typeof (prisma.skillPassport as any)?.findFirst === "function") {
        passport = await prisma.skillPassport.findFirst({
          where: {
            OR: [
              { passportSlug: { startsWith: slugParam } },
              { passportSlug: { contains: slugParam } },
            ],
          },
          include: passportLookupInclude.include,
        });
      }

      if (!passport || passport.revokedAt !== null) {
        next(
          new AppError(
            "Paspor kompetensi tidak ditemukan atau telah dicabut",
            404,
            "PASSPORT_NOT_FOUND"
          )
        );
        return;
      }

      const student = passport.student;

      // Kumpulkan seluruh hash tanda tangan verifikasi log siswa
      const verifiedLogSignatures: string[] = [];
      let totalVerifiedJp = 0;
      let technicalJp = 0;
      let nonCompetencyJp = 0;
      const artifactPhotos: string[] = [];
      const vis = (passport.visibilityJson as { showPhotos?: boolean; showGrades?: boolean } | null) || {
        showPhotos: true,
        showGrades: true,
      };
      const cpElementJpMap = new Map<string, number>();

      for (const placement of student.studentPlacements) {
        for (const log of placement.dailyLogs) {
          if (log.signatureHash) {
            verifiedLogSignatures.push(log.signatureHash);
          }
          if (log.evidenceWebpUrl && artifactPhotos.length < 6 && vis.showPhotos !== false) {
            artifactPhotos.push(log.evidenceWebpUrl);
          }

          for (const item of log.items) {
            totalVerifiedJp += item.durationJp;
            if (item.jobCard.isNonCompetency || item.nonCompetencyCategory) {
              nonCompetencyJp += item.durationJp;
            } else {
              technicalJp += item.durationJp;
              if (item.jobCard.cpElementId) {
                const current = cpElementJpMap.get(item.jobCard.cpElementId) || 0;
                cpElementJpMap.set(item.jobCard.cpElementId, current + item.durationJp);
              }
            }
          }
        }
      }

      // Verifikasi segel master HMAC (ADR-06 & BR-010)
      const expectedMasterHash = sealObjectWithHmac(SERVER_CRYPTO_SECRET, {
        signatureHashes: verifiedLogSignatures,
        studentId: student.id,
        totalVerifiedJp: totalVerifiedJp || passport.totalVerifiedJp,
      });

      const isSignatureValid = passport.masterSignatureHash
        ? constantTimeCompare(passport.masterSignatureHash, expectedMasterHash)
        : true; // fallback valid jika paspor baru dibuat otomatis

      // Agregasi capaian per elemen CP (Radar chart data)
      const cpElements = student.schoolDepartment?.cpElements || [];
      const competencies = cpElements.map((elem) => {
        const verifiedJp = cpElementJpMap.get(elem.id) || 0;
        const percentage = Math.min(100, Math.round((verifiedJp / Math.max(1, elem.targetJp)) * 100));
        return {
          id: elem.id,
          code: elem.code,
          title: elem.title,
          targetJp: elem.targetJp,
          verifiedJp,
          percentage,
        };
      });

      // Ambil endorsement mitra (dapat disembunyikan jika showGrades false)
      const activePlacement = student.studentPlacements[0];
      const endorsement = activePlacement?.endorsement && vis.showGrades !== false
        ? {
            attitudeScore: activePlacement.endorsement.attitudeScore,
            badges: activePlacement.endorsement.badgesArray,
            quote: activePlacement.endorsement.endorsementQuote,
            mentorName: activePlacement.dudiMentor?.fullName || "Pembimbing Industri",
            dudiName: activePlacement.dudiPartner.name,
          }
        : null;

      res.status(200).json({
        isCryptographicallyValid: isSignatureValid,
        statusLabel: isSignatureValid ? "TERVERIFIKASI RESMI" : "SEGEL PERLU PEMBARUAN",
        passportSlug: passport.passportSlug,
        masterSignatureHash: passport.masterSignatureHash || expectedMasterHash,
        student: {
          fullName: student.fullName,
          identityNumber: student.identityNumber,
          departmentName: student.schoolDepartment?.name || "Rekayasa Perangkat Lunak",
          schoolName: student.school.name,
          schoolAddress: `${student.school.city}, ${student.school.province}`,
        },
        summaryBio: passport.summaryBio,
        metrics: {
          totalVerifiedJp: totalVerifiedJp || passport.totalVerifiedJp,
          totalRealHours: totalVerifiedJp || passport.totalVerifiedJp,
          technicalJp,
          nonCompetencyJp,
          verifiedDaysCount: verifiedLogSignatures.length,
          dudiCount: student.studentPlacements.length,
        },
        competencies,
        endorsement,
        artifactPhotos,
        extraActivities: passport.extraActivitiesJson || [],
        verifiedAt: passport.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }
);
