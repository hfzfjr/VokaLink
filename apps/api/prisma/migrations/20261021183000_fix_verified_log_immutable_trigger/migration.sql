-- ==============================================================================
-- Fix BUG-001: Correct column name from mentor_id to verified_by_mentor_id
-- in block_verified_log_update() trigger function (PRD BR-007 / DESIGN 4.2).
-- In the daily_logs table, the column name is verified_by_mentor_id.
-- ==============================================================================

CREATE OR REPLACE FUNCTION block_verified_log_update() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'VERIFIED' AND (
       NEW.log_date IS DISTINCT FROM OLD.log_date OR
       NEW.signature_hash IS DISTINCT FROM OLD.signature_hash OR
       NEW.status IS DISTINCT FROM OLD.status OR
       NEW.placement_id IS DISTINCT FROM OLD.placement_id OR
       NEW.verified_by_mentor_id IS DISTINCT FROM OLD.verified_by_mentor_id OR
       NEW.short_note IS DISTINCT FROM OLD.short_note OR
       NEW.evidence_webp_url IS DISTINCT FROM OLD.evidence_webp_url OR
       NEW.evidence_sha256 IS DISTINCT FROM OLD.evidence_sha256 ) THEN
    RAISE EXCEPTION 'verified log is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
