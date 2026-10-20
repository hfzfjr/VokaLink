-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('SCHOOL_ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "attendance_type" AS ENUM ('PRESENT', 'SICK', 'PERMIT');

-- CreateEnum
CREATE TYPE "log_status" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REVISION_REQUIRED');

-- CreateEnum
CREATE TYPE "non_competency_category" AS ENUM ('ADMIN_UMUM', 'KEBERSIHAN_GUDANG', 'KURIR', 'JAGA_TOKO');

-- CreateEnum
CREATE TYPE "placement_status" AS ENUM ('PLANNED', 'ACTIVE', 'ROTATED_OUT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "drift_alert_type" AS ENUM ('NON_COMPETENCY_OVERLOAD', 'SKILL_MONOTONY', 'APPROVAL_DORMANCY');

-- CreateEnum
CREATE TYPE "drift_alert_severity" AS ENUM ('WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "drift_alert_status" AS ENUM ('OPEN', 'INTERVENED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "intervention_action_type" AS ENUM ('WA_COORDINATION', 'SITE_VISIT', 'DUDI_ROTATION');

-- CreateEnum
CREATE TYPE "signed_link_purpose" AS ENUM ('DEVICE_ACTIVATION', 'LOG_VERIFY', 'ENDORSEMENT');

-- CreateEnum
CREATE TYPE "signed_link_mode" AS ENUM ('QR', 'WA_BATCH');

-- CreateEnum
CREATE TYPE "security_flag_kind" AS ENUM ('UNTRUSTED_DEVICE', 'PIN_LOCKOUT', 'TOKEN_REUSE');

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "npsn" VARCHAR(8) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "province" VARCHAR(80) NOT NULL,
    "city" VARCHAR(80) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_demo_sandbox" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_periods" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "target_total_jp" INTEGER NOT NULL DEFAULT 792,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_departments" (
    "id" UUID NOT NULL,
    "sector_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_departments" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "master_department_id" UUID,
    "sector_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cp_elements" (
    "id" UUID NOT NULL,
    "school_department_id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "target_jp" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cp_elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_cards" (
    "id" UUID NOT NULL,
    "school_department_id" UUID NOT NULL,
    "cp_element_id" UUID,
    "title" VARCHAR(60) NOT NULL,
    "skkni_unit_code" VARCHAR(40),
    "tools_and_software" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "action_verb_template" VARCHAR(250) NOT NULL,
    "is_non_competency" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "school_department_id" UUID,
    "role" "user_role" NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "identity_number" VARCHAR(30) NOT NULL,
    "whatsapp_number" VARCHAR(20),
    "home_latitude" DECIMAL(9,6),
    "home_longitude" DECIMAL(9,6),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dudi_partners" (
    "id" UUID NOT NULL,
    "created_by_school_id" UUID,
    "name" VARCHAR(150) NOT NULL,
    "sector_category" VARCHAR(80) NOT NULL,
    "address" TEXT NOT NULL,
    "city" VARCHAR(80) NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "max_quota" INTEGER NOT NULL DEFAULT 5,
    "quality_index_score" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dudi_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dudi_capabilities" (
    "id" UUID NOT NULL,
    "dudi_partner_id" UUID NOT NULL,
    "job_card_id" UUID NOT NULL,
    "verified_by_school_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dudi_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dudi_mentors" (
    "id" UUID NOT NULL,
    "dudi_partner_id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "job_title" VARCHAR(100) NOT NULL,
    "whatsapp_number" VARCHAR(20) NOT NULL,
    "pin_hash" VARCHAR(255),
    "pin_salt" VARCHAR(64),
    "device_token_hash" VARCHAR(64),
    "token_bound_at" TIMESTAMPTZ,
    "failed_pin_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dudi_mentors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placements" (
    "id" UUID NOT NULL,
    "academic_period_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "dudi_partner_id" UUID NOT NULL,
    "dudi_mentor_id" UUID,
    "compatibility_score" DECIMAL(5,2) NOT NULL,
    "coverage_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "distance_km" DECIMAL(6,2) NOT NULL,
    "requires_midterm_rotation" BOOLEAN NOT NULL DEFAULT false,
    "rotated_from_id" UUID,
    "rotation_sequence" SMALLINT NOT NULL DEFAULT 1,
    "status" "placement_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" UUID NOT NULL,
    "client_log_uuid" UUID NOT NULL,
    "placement_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "log_date" DATE NOT NULL,
    "attendance_type" "attendance_type" NOT NULL DEFAULT 'PRESENT',
    "evidence_webp_url" TEXT,
    "evidence_sha256" VARCHAR(64),
    "evidence_size_bytes" INTEGER,
    "is_evidence_public" BOOLEAN NOT NULL DEFAULT true,
    "short_note" VARCHAR(250),
    "status" "log_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verified_by_mentor_id" UUID,
    "verified_at" TIMESTAMPTZ,
    "signature_hash" VARCHAR(64),
    "rejection_reason" VARCHAR(300),
    "clock_skew_flag" BOOLEAN NOT NULL DEFAULT false,
    "client_created_at" TIMESTAMPTZ,
    "server_received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_log_items" (
    "id" UUID NOT NULL,
    "daily_log_id" UUID NOT NULL,
    "job_card_id" UUID NOT NULL,
    "duration_jp" INTEGER NOT NULL,
    "autonomy_level" SMALLINT NOT NULL,
    "non_competency_category" "non_competency_category",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_log_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drift_alerts" (
    "id" UUID NOT NULL,
    "placement_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "alert_type" "drift_alert_type" NOT NULL,
    "severity" "drift_alert_severity" NOT NULL DEFAULT 'WARNING',
    "metric_snapshot_json" JSONB NOT NULL,
    "status" "drift_alert_status" NOT NULL DEFAULT 'OPEN',
    "detected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "drift_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervention_logs" (
    "id" UUID NOT NULL,
    "drift_alert_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "action_type" "intervention_action_type" NOT NULL,
    "message_sent" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endorsements" (
    "id" UUID NOT NULL,
    "placement_id" UUID NOT NULL,
    "dudi_mentor_id" UUID NOT NULL,
    "attitude_score" INTEGER NOT NULL,
    "badges_array" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "endorsement_quote" VARCHAR(300),
    "signature_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_passports" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "passport_slug" VARCHAR(64) NOT NULL,
    "summary_bio" TEXT,
    "extra_activities_json" JSONB,
    "visibility_json" JSONB,
    "total_verified_jp" INTEGER NOT NULL DEFAULT 0,
    "master_signature_hash" VARCHAR(64),
    "revoked_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "skill_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signed_links" (
    "id" UUID NOT NULL,
    "purpose" "signed_link_purpose" NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "key_id" VARCHAR(32) NOT NULL,
    "mentor_id" UUID NOT NULL,
    "placement_id" UUID,
    "log_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mode" "signed_link_mode" NOT NULL DEFAULT 'QR',
    "payload_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "created_by" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signed_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_flags" (
    "id" UUID NOT NULL,
    "placement_id" UUID NOT NULL,
    "mentor_id" UUID NOT NULL,
    "signed_link_id" UUID,
    "kind" "security_flag_kind" NOT NULL,
    "meta" JSONB,
    "acknowledged_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actor_type" VARCHAR(40) NOT NULL,
    "actor_id" VARCHAR(64) NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "entity" VARCHAR(60) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "meta" JSONB,
    "ip_hash" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_npsn_key" ON "schools"("npsn");

-- CreateIndex
CREATE INDEX "academic_periods_school_id_idx" ON "academic_periods"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_departments_sector_code_key" ON "master_departments"("sector_code");

-- CreateIndex
CREATE INDEX "school_departments_school_id_idx" ON "school_departments"("school_id");

-- CreateIndex
CREATE INDEX "cp_elements_school_department_id_idx" ON "cp_elements"("school_department_id");

-- CreateIndex
CREATE INDEX "job_cards_school_department_id_idx" ON "job_cards"("school_department_id");

-- CreateIndex
CREATE INDEX "job_cards_cp_element_id_idx" ON "job_cards"("cp_element_id");

-- CreateIndex
CREATE INDEX "user_profiles_school_id_role_idx" ON "user_profiles"("school_id", "role");

-- CreateIndex
CREATE INDEX "user_profiles_identity_number_idx" ON "user_profiles"("identity_number");

-- CreateIndex
CREATE INDEX "dudi_partners_city_sector_category_idx" ON "dudi_partners"("city", "sector_category");

-- CreateIndex
CREATE UNIQUE INDEX "dudi_capabilities_dudi_partner_id_job_card_id_key" ON "dudi_capabilities"("dudi_partner_id", "job_card_id");

-- CreateIndex
CREATE INDEX "placements_student_id_idx" ON "placements"("student_id");

-- CreateIndex
CREATE INDEX "placements_teacher_id_idx" ON "placements"("teacher_id");

-- CreateIndex
CREATE INDEX "placements_dudi_partner_id_idx" ON "placements"("dudi_partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_logs_client_log_uuid_key" ON "daily_logs"("client_log_uuid");

-- CreateIndex
CREATE INDEX "daily_logs_placement_id_status_idx" ON "daily_logs"("placement_id", "status");

-- CreateIndex
CREATE INDEX "daily_logs_placement_id_log_date_idx" ON "daily_logs"("placement_id", "log_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_logs_placement_id_log_date_key" ON "daily_logs"("placement_id", "log_date");

-- CreateIndex
CREATE INDEX "daily_log_items_job_card_id_idx" ON "daily_log_items"("job_card_id");

-- CreateIndex
CREATE INDEX "drift_alerts_placement_id_status_idx" ON "drift_alerts"("placement_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "endorsements_placement_id_key" ON "endorsements"("placement_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_passports_student_id_key" ON "skill_passports"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_passports_passport_slug_key" ON "skill_passports"("passport_slug");

-- CreateIndex
CREATE UNIQUE INDEX "signed_links_token_hash_key" ON "signed_links"("token_hash");

-- CreateIndex
CREATE INDEX "signed_links_expires_at_idx" ON "signed_links"("expires_at");

-- AddForeignKey
ALTER TABLE "academic_periods" ADD CONSTRAINT "academic_periods_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_departments" ADD CONSTRAINT "school_departments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_departments" ADD CONSTRAINT "school_departments_master_department_id_fkey" FOREIGN KEY ("master_department_id") REFERENCES "master_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cp_elements" ADD CONSTRAINT "cp_elements_school_department_id_fkey" FOREIGN KEY ("school_department_id") REFERENCES "school_departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_school_department_id_fkey" FOREIGN KEY ("school_department_id") REFERENCES "school_departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_cp_element_id_fkey" FOREIGN KEY ("cp_element_id") REFERENCES "cp_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_school_department_id_fkey" FOREIGN KEY ("school_department_id") REFERENCES "school_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dudi_capabilities" ADD CONSTRAINT "dudi_capabilities_dudi_partner_id_fkey" FOREIGN KEY ("dudi_partner_id") REFERENCES "dudi_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dudi_capabilities" ADD CONSTRAINT "dudi_capabilities_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "job_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dudi_mentors" ADD CONSTRAINT "dudi_mentors_dudi_partner_id_fkey" FOREIGN KEY ("dudi_partner_id") REFERENCES "dudi_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_academic_period_id_fkey" FOREIGN KEY ("academic_period_id") REFERENCES "academic_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_dudi_partner_id_fkey" FOREIGN KEY ("dudi_partner_id") REFERENCES "dudi_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_dudi_mentor_id_fkey" FOREIGN KEY ("dudi_mentor_id") REFERENCES "dudi_mentors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_log_items" ADD CONSTRAINT "daily_log_items_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "daily_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_log_items" ADD CONSTRAINT "daily_log_items_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "job_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drift_alerts" ADD CONSTRAINT "drift_alerts_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drift_alerts" ADD CONSTRAINT "drift_alerts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_logs" ADD CONSTRAINT "intervention_logs_drift_alert_id_fkey" FOREIGN KEY ("drift_alert_id") REFERENCES "drift_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_logs" ADD CONSTRAINT "intervention_logs_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_dudi_mentor_id_fkey" FOREIGN KEY ("dudi_mentor_id") REFERENCES "dudi_mentors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_passports" ADD CONSTRAINT "skill_passports_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signed_links" ADD CONSTRAINT "signed_links_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "dudi_mentors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_flags" ADD CONSTRAINT "security_flags_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_flags" ADD CONSTRAINT "security_flags_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "dudi_mentors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
