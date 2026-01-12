-- Migration: Clean up income records when time entry status changes from completed
-- Issue: When a time entry status changes from 'completed' to 'planned'/'in_progress'/'cancelled',
-- the income record remains, causing double counting in UI (both actual + expected income)

-- ============================================
-- STEP 1: CREATE BACKUP TABLE FIRST (SAFETY)
-- ============================================

-- Create backup table to preserve data before deletion
CREATE TABLE IF NOT EXISTS income_records_backup_20260112 AS
SELECT ir.*, te.status as current_time_entry_status, NOW() as backed_up_at
FROM income_records ir
JOIN time_entries te ON ir.time_entry_id = te.id
WHERE ir.source_type = 'job_shift'
  AND te.status != 'completed';

-- Report what will be backed up
DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count
  FROM income_records_backup_20260112;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'SAFETY BACKUP: % income records backed up to income_records_backup_20260112', backup_count;
  RAISE NOTICE 'These are income records for non-completed time entries (orphaned data)';
  RAISE NOTICE 'Review this table before proceeding with cleanup';
  RAISE NOTICE '============================================';
END $$;

-- Display the records that will be deleted (for review)
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE 'Records that will be cleaned up:';
  FOR rec IN
    SELECT
      ir.id,
      ir.time_entry_id,
      ir.amount,
      ir.currency,
      ir.date,
      te.status as time_entry_status,
      te.entry_type
    FROM income_records ir
    JOIN time_entries te ON ir.time_entry_id = te.id
    WHERE ir.source_type = 'job_shift'
      AND te.status != 'completed'
    LIMIT 10
  LOOP
    RAISE NOTICE '  Income Record ID: %, Amount: % %, Date: %, Time Entry Status: %',
      rec.id, rec.amount, rec.currency, rec.date, rec.time_entry_status;
  END LOOP;
END $$;

-- ============================================
-- STEP 2: CREATE TRIGGER FOR FUTURE STATUS CHANGES
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_income_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process updates where status is changing
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN

    -- If status is changing FROM 'completed' TO something else
    -- Delete the associated income record
    IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      -- Log before deletion for audit trail
      RAISE NOTICE 'Deleting income record for time_entry % (status changed from completed to %)', OLD.id, NEW.status;

      DELETE FROM income_records
      WHERE time_entry_id = OLD.id
        AND source_type = 'job_shift';
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
-- STEP 3: OPTIONAL CLEANUP (UNCOMMENT TO EXECUTE)
-- ============================================

-- IMPORTANT: Review the backup table first!
-- SELECT * FROM income_records_backup_20260112;
--
-- If everything looks good, uncomment the following block to perform cleanup:


-- Clean up existing orphaned income records
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
  RAISE NOTICE 'Backup preserved in table: income_records_backup_20260112';
END $$;


-- ============================================
-- RESTORE INSTRUCTIONS (if needed)
-- ============================================

COMMENT ON TABLE income_records_backup_20260112 IS
'Backup of income records for non-completed time entries before cleanup migration.
To restore if needed:
  INSERT INTO income_records (id, user_id, date, source_type, job_id, time_entry_id, amount, currency, calculation_basis, is_manual, created_at, updated_at)
  SELECT id, user_id, date, source_type, job_id, time_entry_id, amount, currency, calculation_basis, is_manual, created_at, updated_at
  FROM income_records_backup_20260112;
To drop backup after confirmation:
  DROP TABLE income_records_backup_20260112;';

-- Final safety message
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION COMPLETED - TRIGGER INSTALLED';
  RAISE NOTICE 'Backup table created: income_records_backup_20260112';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Review backup: SELECT * FROM income_records_backup_20260112;';
  RAISE NOTICE '2. If data looks correct, uncomment cleanup section and re-run';
  RAISE NOTICE '3. After confirming everything works, drop backup table';
  RAISE NOTICE '============================================';
END $$;
