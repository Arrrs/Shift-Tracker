-- ============================================================================
-- EARNINGS MANUAL OVERRIDE - Migration
-- Add flag to track when earnings are manually set vs auto-calculated
-- ============================================================================

-- Add column to track manual overrides
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS earnings_manual_override BOOLEAN DEFAULT false;

-- Backfill existing data:
-- - All existing auto-calculated shifts: false (will recalculate when hours change)
-- - Fixed income shifts with NULL earnings: can stay false (NULL means time tracking)
UPDATE shifts
SET earnings_manual_override = false
WHERE earnings_manual_override IS NULL;

-- Add helpful comment
COMMENT ON COLUMN shifts.earnings_manual_override IS
  'True if actual_earnings was manually set by user. When true, earnings will NOT recalculate automatically when hours/rates change. When false, earnings auto-recalculate from hours × rate.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'shifts' AND column_name = 'earnings_manual_override';

-- Check counts
SELECT
  COUNT(*) as total_shifts,
  COUNT(CASE WHEN earnings_manual_override = true THEN 1 END) as manual_override_shifts,
  COUNT(CASE WHEN earnings_manual_override = false THEN 1 END) as auto_calculated_shifts,
  COUNT(CASE WHEN actual_earnings IS NULL THEN 1 END) as null_earnings_shifts
FROM shifts;

-- Sample some shifts
SELECT
  date,
  status,
  actual_hours,
  actual_earnings,
  earnings_manual_override,
  earnings_currency,
  jobs.name as job_name
FROM shifts
LEFT JOIN jobs ON shifts.job_id = jobs.id
ORDER BY date DESC
LIMIT 10;
