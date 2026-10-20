-- ==============================================================================
-- Migration: 20261020192102_security_guards
-- Author: Orang A (Hari 1 Sprint)
-- Purpose: Database-level Security Guards (RLS deny-all, Immutability, CHECKs, Indexes)
-- Reference: docs/DESIGN.md Section 4.2 & 4.3, PRD BR-001, BR-007, BR-008
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) Enable Row Level Security (RLS) on all public domain tables
--    Without custom policies, anon and authenticated Supabase roles are denied all direct access.
--    All data access must proceed through the Express backend via Prisma / service_role.
-- ------------------------------------------------------------------------------
ALTER TABLE "public"."schools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."academic_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."master_departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."school_departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cp_elements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."job_cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."dudi_partners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."dudi_capabilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."dudi_mentors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."placements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."daily_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."daily_log_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."drift_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."intervention_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."endorsements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."skill_passports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."signed_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."security_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2) Immutability Triggers for VERIFIED Daily Logs (PRD BR-007 / DESIGN 4.2)
--    Logs that have been verified by mentor with HMAC seal cannot be edited or deleted.
-- ------------------------------------------------------------------------------

-- Trigger 1: Block modification to verified daily_logs
CREATE OR REPLACE FUNCTION block_verified_log_update() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'VERIFIED' AND (
       NEW.log_date IS DISTINCT FROM OLD.log_date OR
       NEW.signature_hash IS DISTINCT FROM OLD.signature_hash OR
       NEW.status IS DISTINCT FROM OLD.status OR
       NEW.placement_id IS DISTINCT FROM OLD.placement_id OR
       NEW.mentor_id IS DISTINCT FROM OLD.mentor_id ) THEN
    RAISE EXCEPTION 'verified log is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_logs_immutable ON daily_logs;
CREATE TRIGGER trg_daily_logs_immutable
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION block_verified_log_update();

-- Trigger 2: Block deletion of verified daily_logs
CREATE OR REPLACE FUNCTION block_verified_log_delete() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'VERIFIED' THEN
    RAISE EXCEPTION 'verified log cannot be deleted';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_logs_no_delete ON daily_logs;
CREATE TRIGGER trg_daily_logs_no_delete
  BEFORE DELETE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION block_verified_log_delete();

-- Trigger 3: Block insert/update/delete on daily_log_items when parent log is VERIFIED
CREATE OR REPLACE FUNCTION block_verified_log_item_mutation() RETURNS trigger AS $$
DECLARE
  v_status text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT status::text INTO v_status FROM daily_logs WHERE id = OLD.daily_log_id;
  ELSE
    SELECT status::text INTO v_status FROM daily_logs WHERE id = NEW.daily_log_id;
  END IF;

  IF v_status = 'VERIFIED' THEN
    RAISE EXCEPTION 'items of a verified log are immutable';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_log_items_immutable ON daily_log_items;
CREATE TRIGGER trg_daily_log_items_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON daily_log_items
  FOR EACH ROW
  EXECUTE FUNCTION block_verified_log_item_mutation();

-- ------------------------------------------------------------------------------
-- 3) Business Rule Constraints (BR-001, BR-002, BR-006)
-- ------------------------------------------------------------------------------

-- Evidence size must not exceed 150 KB (153,600 bytes)
ALTER TABLE daily_logs 
  DROP CONSTRAINT IF EXISTS chk_evidence_size,
  ADD CONSTRAINT chk_evidence_size CHECK (evidence_size_bytes IS NULL OR evidence_size_bytes <= 153600);

-- Duration JP per item must be between 1 and 10 JP
ALTER TABLE daily_log_items 
  DROP CONSTRAINT IF EXISTS chk_jp,
  ADD CONSTRAINT chk_jp CHECK (duration_jp BETWEEN 1 AND 10);

-- ------------------------------------------------------------------------------
-- 4) Unique constraint on active drift alerts (BR-008)
--    Only one unresolved alert per type per placement at any given time.
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS ux_alert_open 
  ON drift_alerts (placement_id, alert_type) 
  WHERE status <> 'RESOLVED';

-- ------------------------------------------------------------------------------
-- 5) Minimum performance indexes (DESIGN 4.3)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_daily_logs_placement_status ON daily_logs (placement_id, status);
CREATE INDEX IF NOT EXISTS idx_daily_logs_placement_date ON daily_logs (placement_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_log_items_job_card ON daily_log_items (job_card_id);
CREATE INDEX IF NOT EXISTS idx_drift_alerts_placement_status ON drift_alerts (placement_id, status);
CREATE INDEX IF NOT EXISTS idx_signed_links_active ON signed_links (expires_at) WHERE used_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dudi_partners_search ON dudi_partners (city, sector_category);
CREATE INDEX IF NOT EXISTS idx_user_profiles_school_role ON user_profiles (school_id, role);
CREATE INDEX IF NOT EXISTS idx_placements_student ON placements (student_id);
CREATE INDEX IF NOT EXISTS idx_placements_teacher ON placements (teacher_id);