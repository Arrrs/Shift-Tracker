-- Fix overnight shift calculation and remove duplicate constraint

-- =====================================================
-- PART 1: Fix calculate_scheduled_hours for overnight shifts
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
-- PART 2: Remove unique constraint that prevents multiple shifts per day
-- The constraint "shifts_user_id_date_start_time_key" prevents users from having
-- multiple shifts at the same start time on the same day (e.g., two different jobs)
-- =====================================================

ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_user_id_date_start_time_key;

-- Optional: Add a more flexible constraint that still prevents exact duplicates
-- but allows multiple shifts at the same time for different jobs
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_unique_shift;
ALTER TABLE shifts ADD CONSTRAINT shifts_unique_shift
  UNIQUE (user_id, date, start_time, job_id);

COMMENT ON CONSTRAINT shifts_unique_shift ON shifts IS
  'Prevents duplicate shifts with same date, time, and job, but allows multiple jobs at same time';
