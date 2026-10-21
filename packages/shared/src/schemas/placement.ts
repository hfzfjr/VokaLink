import { z } from "zod";

/**
 * Query parameter untuk rekomendasi penempatan cerdas
 */
export const placementRecommendationQuerySchema = z.object({
  departmentId: z.string().uuid("ID Jurusan harus berupa UUID valid").optional(),
});

export type PlacementRecommendationQuery = z.infer<
  typeof placementRecommendationQuerySchema
>;

/**
 * Schema pembuatan penempatan siswa ke mitra DUDI (FR-004)
 */
export const createPlacementSchema = z.object({
  studentId: z.string().uuid("ID Siswa harus berupa UUID valid"),
  dudiPartnerId: z.string().uuid("ID Mitra DUDI harus berupa UUID valid"),
  teacherId: z.string().uuid("ID Guru Pembimbing harus berupa UUID valid"),
  dudiMentorId: z.string().uuid("ID Mentor harus berupa UUID valid").optional().nullable(),
  academicPeriodId: z.string().uuid("ID Periode Akademik harus berupa UUID valid").optional(),
  overrideReason: z.string().max(300, "Alasan override maksimal 300 karakter").optional(),
});

export type CreatePlacementInput = z.infer<typeof createPlacementSchema>;

/**
 * Schema konfirmasi penugasan massal (Batch Placement)
 */
export const batchCreatePlacementSchema = z.object({
  placements: z
    .array(createPlacementSchema)
    .min(1, "Minimal 1 penempatan harus disertakan")
    .max(50, "Maksimal 50 penempatan per batch"),
});

export type BatchCreatePlacementInput = z.infer<typeof batchCreatePlacementSchema>;

/**
 * Schema update titik koordinat domisili siswa
 */
export const updateStudentCoordinatesSchema = z.object({
  homeLatitude: z
    .number()
    .min(-11, "Latitude wilayah Indonesia harus antara -11 dan 6")
    .max(6, "Latitude wilayah Indonesia harus antara -11 dan 6"),
  homeLongitude: z
    .number()
    .min(95, "Longitude wilayah Indonesia harus antara 95 dan 141")
    .max(141, "Longitude wilayah Indonesia harus antara 95 dan 141"),
});

export type UpdateStudentCoordinatesInput = z.infer<
  typeof updateStudentCoordinatesSchema
>;
