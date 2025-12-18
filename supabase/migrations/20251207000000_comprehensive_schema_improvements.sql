-- =====================================================
-- COMPREHENSIVE SCHEMA IMPROVEMENTS
-- Created: 2024-12-07
-- Purpose: Fix TIME storage, add flexibility, validation, and new features
-- =====================================================

-- =====================================================
-- PART 1: Fix shifts table time storage
-- Revert TIME back to TIMESTAMPTZ for proper timezone/overnight support
-- =====================================================

-- Drop the unique constraint first (it uses start_time)
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_user_id_date_start_time_key;

-- Convert TIME columns back to TIMESTAMPTZ
-- We'll construct proper timestamps using the date + time
ALTER TABLE shifts
  ALTER COLUMN start_time TYPE TIMESTAMP WITH TIME ZONE
    USING (date::text || ' ' || start_time::text)::TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN end_time TYPE TIMESTAMP WITH TIME ZONE
    USING (
      CASE
        WHEN end_time IS NOT NULL
        THEN (date::text || ' ' || end_time::text)::TIMESTAMP WITH TIME ZONE
        ELSE NULL
      END
    );

-- Recreate unique constraint (prevent duplicate shifts)
ALTER TABLE shifts
  ADD CONSTRAINT shifts_user_id_date_start_time_key
  UNIQUE(user_id, date, start_time);

-- =====================================================
-- PART 2: Make shifts more flexible
-- Allow shifts without job assignment (personal time, appointments)
-- =====================================================

-- Make job_id nullable
ALTER TABLE shifts ALTER COLUMN job_id DROP NOT NULL;

-- Add default 'No Job' system marker (optional, can be NULL instead)
COMMENT ON COLUMN shifts.job_id IS 'Job ID - nullable for personal/custom shifts';

-- =====================================================
-- PART 3: Add new columns to shifts for better tracking
-- =====================================================

-- Add scheduled_hours (calculated from times)
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS scheduled_hours DECIMAL(5,2);

-- Add variance tracking
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS variance_hours DECIMAL(5,2);

-- Add overnight shift flag
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS is_overnight BOOLEAN DEFAULT false;

-- Update scheduled_hours calculation for existing data
UPDATE shifts
SET scheduled_hours = EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
WHERE end_time IS NOT NULL AND scheduled_hours IS NULL;

-- Update variance for existing data
UPDATE shifts
SET variance_hours = COALESCE(actual_hours, 0) - COALESCE(scheduled_hours, 0)
WHERE variance_hours IS NULL;

-- =====================================================
-- PART 4: Add validation constraints
-- =====================================================

-- Ensure actual_hours is non-negative
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS positive_actual_hours;
ALTER TABLE shifts ADD CONSTRAINT positive_actual_hours
  CHECK (actual_hours IS NULL OR actual_hours >= 0);

-- Ensure scheduled_hours is non-negative
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS positive_scheduled_hours;
ALTER TABLE shifts ADD CONSTRAINT positive_scheduled_hours
  CHECK (scheduled_hours IS NULL OR scheduled_hours >= 0);

-- Validate shift duration (end must be after start, unless overnight)
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS valid_shift_timing;
ALTER TABLE shifts ADD CONSTRAINT valid_shift_timing
  CHECK (
    end_time IS NULL OR
    is_overnight = true OR
    end_time > start_time
  );

-- =====================================================
-- PART 5: Enhance jobs table
-- Add PTO tracking and currency display
-- =====================================================

-- Add PTO/vacation tracking fields
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pto_days_per_year INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sick_days_per_year INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS personal_days_per_year INTEGER DEFAULT 0;

-- Add currency symbol for display (e.g., "$", "€", "₴")
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$';

-- Update existing jobs with proper currency symbols based on currency code
UPDATE jobs SET currency_symbol =
  CASE currency
    WHEN 'USD' THEN '$'
    WHEN 'EUR' THEN '€'
    WHEN 'GBP' THEN '£'
    WHEN 'UAH' THEN '₴'
    WHEN 'PLN' THEN 'zł'
    WHEN 'CZK' THEN 'Kč'
    ELSE '$'
  END
WHERE currency_symbol = '$';

-- Add constraint for PTO values
ALTER TABLE jobs ADD CONSTRAINT positive_pto_days
  CHECK (
    pto_days_per_year >= 0 AND
    sick_days_per_year >= 0 AND
    personal_days_per_year >= 0
  );

-- =====================================================
-- PART 6: Create time_off_records table
-- Track vacation, sick days, personal days, etc.
-- =====================================================

CREATE TABLE IF NOT EXISTS time_off_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vacation', 'sick', 'personal', 'unpaid', 'holiday', 'other')),
  is_paid BOOLEAN DEFAULT true,
  hours_credited DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date, job_id)
);

-- Row Level Security for time_off_records
ALTER TABLE time_off_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time_off_records" ON time_off_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time_off_records" ON time_off_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time_off_records" ON time_off_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time_off_records" ON time_off_records
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_off_records_user_id ON time_off_records(user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_records_job_id ON time_off_records(job_id);
CREATE INDEX IF NOT EXISTS idx_time_off_records_date ON time_off_records(date);
CREATE INDEX IF NOT EXISTS idx_time_off_records_type ON time_off_records(type);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_time_off_records_updated_at
  BEFORE UPDATE ON time_off_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 7: Enhance user_settings for currency preferences
-- =====================================================

-- Add primary currency preference for conversions
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS primary_currency TEXT DEFAULT 'USD';

-- Add preference for showing currency breakdown
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS show_currency_breakdown BOOLEAN DEFAULT true;

-- Add preference for auto-converting currencies
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS auto_convert_currency BOOLEAN DEFAULT false;

-- =====================================================
-- PART 8: Add helpful indexes for new query patterns
-- =====================================================

-- Optimize status-based queries
CREATE INDEX IF NOT EXISTS idx_shifts_status_date ON shifts(user_id, status, date);

-- Optimize job-based shift queries
CREATE INDEX IF NOT EXISTS idx_shifts_job_date ON shifts(user_id, job_id, date);

-- Optimize overnight shift queries
CREATE INDEX IF NOT EXISTS idx_shifts_overnight ON shifts(user_id, is_overnight) WHERE is_overnight = true;

-- =====================================================
-- PART 9: Add functions for common calculations
-- =====================================================

-- Function to calculate scheduled hours from timestamps
CREATE OR REPLACE FUNCTION calculate_scheduled_hours(
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_is_overnight BOOLEAN DEFAULT false
)
RETURNS DECIMAL(5,2) AS $$
BEGIN
  IF p_end_time IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get PTO balance for a job
CREATE OR REPLACE FUNCTION get_pto_balance(
  p_user_id UUID,
  p_job_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE (
  vacation_total INTEGER,
  vacation_used INTEGER,
  vacation_remaining INTEGER,
  sick_total INTEGER,
  sick_used INTEGER,
  sick_remaining INTEGER,
  personal_total INTEGER,
  personal_used INTEGER,
  personal_remaining INTEGER
) AS $$
DECLARE
  v_vacation_total INTEGER;
  v_sick_total INTEGER;
  v_personal_total INTEGER;
  v_vacation_used INTEGER;
  v_sick_used INTEGER;
  v_personal_used INTEGER;
BEGIN
  -- Get totals from job
  SELECT
    pto_days_per_year,
    sick_days_per_year,
    personal_days_per_year
  INTO v_vacation_total, v_sick_total, v_personal_total
  FROM jobs
  WHERE id = p_job_id AND user_id = p_user_id;

  -- Count used days from time_off_records
  SELECT
    COUNT(*) FILTER (WHERE type = 'vacation'),
    COUNT(*) FILTER (WHERE type = 'sick'),
    COUNT(*) FILTER (WHERE type = 'personal')
  INTO v_vacation_used, v_sick_used, v_personal_used
  FROM time_off_records
  WHERE user_id = p_user_id
    AND job_id = p_job_id
    AND EXTRACT(YEAR FROM date) = p_year;

  RETURN QUERY SELECT
    COALESCE(v_vacation_total, 0),
    COALESCE(v_vacation_used, 0),
    COALESCE(v_vacation_total, 0) - COALESCE(v_vacation_used, 0),
    COALESCE(v_sick_total, 0),
    COALESCE(v_sick_used, 0),
    COALESCE(v_sick_total, 0) - COALESCE(v_sick_used, 0),
    COALESCE(v_personal_total, 0),
    COALESCE(v_personal_used, 0),
    COALESCE(v_personal_total, 0) - COALESCE(v_personal_used, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- PART 10: Create trigger to auto-calculate scheduled_hours
-- =====================================================

CREATE OR REPLACE FUNCTION update_shift_calculations()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate scheduled_hours if times are set
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.scheduled_hours := calculate_scheduled_hours(NEW.start_time, NEW.end_time, NEW.is_overnight);
  END IF;

  -- Calculate variance if actual_hours is set
  IF NEW.actual_hours IS NOT NULL AND NEW.scheduled_hours IS NOT NULL THEN
    NEW.variance_hours := NEW.actual_hours - NEW.scheduled_hours;
  ELSE
    NEW.variance_hours := NULL;
  END IF;

  -- Auto-detect overnight shifts
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    IF NEW.end_time < NEW.start_time THEN
      NEW.is_overnight := true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_shift_hours
  BEFORE INSERT OR UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_shift_calculations();

-- =====================================================
-- DONE! Schema improvements complete
-- Next: Regenerate TypeScript types with:
-- npx supabase gen types typescript --local > lib/database.types.ts
-- =====================================================
