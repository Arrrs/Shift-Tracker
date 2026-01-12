-- Migration: Clean up income records when time entry status changes from completed
-- Issue: When a time entry status changes from 'completed' to 'planned'/'in_progress'/'cancelled',
-- the income record remains, causing double counting in UI (both actual + expected income)

-- ============================================
-- CREATE TRIGGER TO DELETE INCOME RECORDS WHEN STATUS CHANGES AWAY FROM COMPLETED
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_income_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process updates where status is changing
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN

    -- If status is changing FROM 'completed' TO something else
    -- Delete the associated income record
    IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      DELETE FROM income_records
      WHERE time_entry_id = OLD.id
        AND source_type = 'job_shift';

      RAISE NOTICE 'Deleted income record for time_entry % (status changed from completed to %)', OLD.id, NEW.status;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_income_on_status_change() IS
'Automatically deletes income records when a time entry status changes from completed to another status.
This prevents double-counting where an entry would appear in both actual income (from income_records)
and expected income (calculated for planned/in_progress entries).';

-- Create trigger that fires BEFORE the auto_generate_income trigger
-- This ensures cleanup happens before new records might be created
DROP TRIGGER IF EXISTS cleanup_income_on_status_change_trigger ON time_entries;

CREATE TRIGGER cleanup_income_on_status_change_trigger
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION cleanup_income_on_status_change();

COMMENT ON TRIGGER cleanup_income_on_status_change_trigger ON time_entries IS
'Cleans up income records when time entry status changes away from completed.
Fires BEFORE UPDATE to ensure cleanup happens before any new income generation.';

-- ============================================
-- CLEAN UP EXISTING ORPHANED INCOME RECORDS
-- ============================================

-- Find and delete income records for entries that are NOT completed
-- These are orphaned records from when status was changed without cleanup
DELETE FROM income_records ir
USING time_entries te
WHERE ir.time_entry_id = te.id
  AND ir.source_type = 'job_shift'
  AND te.status != 'completed';

-- Report the cleanup
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % orphaned income records for non-completed time entries', deleted_count;
END $$;
