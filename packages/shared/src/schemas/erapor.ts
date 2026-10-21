import { z } from "zod";

export const eraporQuerySchema = z.object({
  departmentId: z.string().uuid("ID Jurusan harus berupa UUID valid").optional(),
  academicPeriodId: z.string().uuid("ID Periode harus berupa UUID valid").optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export type EraporQuery = z.infer<typeof eraporQuerySchema>;

export const eraporTeacherOverrideSchema = z.object({
  placementId: z.string().uuid("ID Penempatan harus berupa UUID valid"),
  overrideFinalGrade: z.number().min(0, "Nilai minimal 0").max(100, "Nilai maksimal 100"),
  overrideNote: z.string().min(5, "Catatan berita acara minimal 5 karakter").max(500),
  overrideHighestAchievement: z.string().max(300).optional(),
  overrideNeedsImprovement: z.string().max(300).optional(),
});

export type EraporTeacherOverrideInput = z.infer<typeof eraporTeacherOverrideSchema>;
