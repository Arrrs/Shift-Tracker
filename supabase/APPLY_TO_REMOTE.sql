-- =====================================================
-- APPLY ALL MISSING MIGRATIONS TO REMOTE SUPABASE
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- MIGRATION 1: Add 'cancelled' status
-- =====================================================
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_status_check;
ALTER TABLE shifts ADD CONSTRAINT shifts_status_check
  CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled'));

-- =====================================================
-- MIGRATION 2: Fix overnight shift calculation
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_scheduled_hours(
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_is_overnight BOOLEAN DEFAULT false
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  hours_diff DECIMAL(5,2);
BEGIN
  IF p_end_time IS NULL THEN
    RETURN NULL;
  END IF;

  hours_diff := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;

  -- If overnight flag is set and hours are negative, add 24
  IF p_is_overnight AND hours_diff < 0 THEN
    hours_diff := hours_diff + 24;
  END IF;

  -- If result is still negative (shouldn't happen but safety check), return absolute value
  IF hours_diff < 0 THEN
    hours_diff := ABS(hours_diff);
  END IF;

  RETURN hours_diff;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- MIGRATION 3: Fix unique constraint for multiple shifts
-- =====================================================
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_user_id_date_start_time_key;
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_unique_shift;
ALTER TABLE shifts ADD CONSTRAINT shifts_unique_shift
  UNIQUE (user_id, date, start_time, job_id);

COMMENT ON CONSTRAINT shifts_unique_shift ON shifts IS
  'Prevents duplicate shifts with same date, time, and job, but allows multiple jobs at same time';

-- =====================================================
-- MIGRATION 4: Add custom_hourly_rate field
-- =====================================================
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS custom_hourly_rate DECIMAL(10,2);

COMMENT ON COLUMN shifts.custom_hourly_rate IS
  'Optional hourly rate override. Used for: (1) shifts without job assignment, (2) shifts with different rate than job default';

COMMENT ON COLUMN shifts.is_holiday IS
  'Whether this shift is on a holiday (affects pay calculation)';

COMMENT ON COLUMN shifts.holiday_multiplier IS
  'Multiplier for holiday pay (e.g., 1.5 for time-and-a-half, 2.0 for double time)';

-- =====================================================
-- MIGRATION 5: Add holiday_fixed_rate field
-- =====================================================
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS holiday_fixed_rate DECIMAL(10,2);

COMMENT ON COLUMN shifts.holiday_fixed_rate IS
  'Fixed hourly rate for holiday shifts (alternative to holiday_multiplier)';

-- =====================================================
-- DONE! Now regenerate types with:
-- npx supabase gen types --lang=typescript --project-id plpktnhidwquefekgwmg > lib/database.types.ts
-- =====================================================
