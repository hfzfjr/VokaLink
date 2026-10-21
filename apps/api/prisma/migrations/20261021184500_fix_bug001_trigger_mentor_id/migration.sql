-- Fix BUG-001: Correct column name in block_verified_log_update trigger function
-- Ganti NEW.mentor_id dengan NEW.verified_by_mentor_id sesuai skema daily_logs

CREATE OR REPLACE FUNCTION block_verified_log_update() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'VERIFIED' AND (
       NEW.log_date IS DISTINCT FROM OLD.log_date OR
       NEW.signature_hash IS DISTINCT FROM OLD.signature_hash OR
       NEW.status IS DISTINCT FROM OLD.status OR
       NEW.placement_id IS DISTINCT FROM OLD.placement_id OR
       NEW.verified_by_mentor_id IS DISTINCT FROM OLD.verified_by_mentor_id ) THEN
    RAISE EXCEPTION 'verified log is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
