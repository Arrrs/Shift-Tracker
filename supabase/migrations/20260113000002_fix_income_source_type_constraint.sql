-- ============================================================================
-- Migration: Fix Income Records Source Type Check Constraint
-- Date: 2026-01-13
-- Description: Updates the source_type check constraint to include 'time_entry'
--              and fixes the auto_create_income_record trigger to use correct value
-- ============================================================================

-- Drop the existing check constraint
ALTER TABLE income_records DROP CONSTRAINT IF EXISTS income_records_source_type_check;

-- Add updated check constraint that includes 'time_entry'
ALTER TABLE income_records ADD CONSTRAINT income_records_source_type_check
  CHECK (source_type IN ('job_shift', 'job_salary', 'bonus', 'freelance', 'other', 'time_entry'));

-- Update the trigger function to use 'job_shift' instead of 'time_entry' for compatibility
-- (This ensures it works with the original constraint values)
CREATE OR REPLACE FUNCTION auto_create_income_record()
RETURNS TRIGGER AS $$
DECLARE
  v_currency TEXT;
  v_amount NUMERIC;
  v_job_record RECORD;
  v_multiplier NUMERIC;
  v_user_primary_currency TEXT;
  v_source_type TEXT;
BEGIN
  -- Only process work_shift entries that are marked as completed
  IF NEW.entry_type != 'work_shift' OR NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get user's primary currency from settings
  SELECT primary_currency INTO v_user_primary_currency
  FROM user_settings
  WHERE user_id = NEW.user_id;

  -- If no primary currency in settings, default to USD
  v_user_primary_currency := COALESCE(v_user_primary_currency, 'USD');

  -- Determine currency priority:
  -- 1. custom_currency from time entry (if set)
  -- 2. job.currency (if job exists)
  -- 3. User's primary_currency from settings
  -- 4. USD (absolute fallback)
  IF NEW.custom_currency IS NOT NULL THEN
    v_currency := NEW.custom_currency;
  ELSIF NEW.job_id IS NOT NULL THEN
    -- Get job details
    SELECT currency INTO v_currency
    FROM jobs
    WHERE id = NEW.job_id AND user_id = NEW.user_id;

    -- If job has no currency, use user's primary currency
    v_currency := COALESCE(v_currency, v_user_primary_currency);
  ELSE
    -- No job, no custom currency - use user's primary currency
    v_currency := v_user_primary_currency;
  END IF;

  -- Calculate multiplier (for holidays, overtime, etc.)
  v_multiplier := COALESCE(NEW.holiday_multiplier, 1.0);

  -- Determine source_type based on whether there's a job
  IF NEW.job_id IS NOT NULL THEN
    v_source_type := 'job_shift';
  ELSE
    v_source_type := 'freelance';  -- Shifts without jobs are freelance work
  END IF;

  -- Calculate amount based on pay override type
  IF NEW.pay_override_type = 'fixed_amount' AND NEW.holiday_fixed_amount IS NOT NULL THEN
    -- Fixed amount payment
    v_amount := NEW.holiday_fixed_amount;

  ELSIF NEW.pay_override_type = 'custom_hourly' AND NEW.custom_hourly_rate IS NOT NULL THEN
    -- Custom hourly rate
    v_amount := (COALESCE(NEW.actual_hours, 0) * NEW.custom_hourly_rate) * v_multiplier;

  ELSIF NEW.pay_override_type = 'custom_daily' AND NEW.custom_daily_rate IS NOT NULL THEN
    -- Custom daily rate
    v_amount := NEW.custom_daily_rate * v_multiplier;

  ELSIF NEW.job_id IS NOT NULL THEN
    -- Use job's default rates
    SELECT * INTO v_job_record
    FROM jobs
    WHERE id = NEW.job_id AND user_id = NEW.user_id;

    IF v_job_record.pay_type = 'hourly' THEN
      v_amount := (COALESCE(NEW.actual_hours, 0) * COALESCE(v_job_record.hourly_rate, 0)) * v_multiplier;
    ELSIF v_job_record.pay_type = 'daily' THEN
      v_amount := COALESCE(v_job_record.daily_rate, 0) * v_multiplier;
    ELSIF v_job_record.pay_type = 'salary' THEN
      -- For salary, calculate based on working days
      -- Assume 22 working days per month
      v_amount := (COALESCE(v_job_record.monthly_salary, 0) / 22.0);
      v_source_type := 'job_salary';  -- Update source type for salary jobs
    ELSE
      v_amount := 0;
    END IF;
  ELSE
    -- No job and no custom rates - cannot calculate amount
    v_amount := 0;
  END IF;

  -- Only create income record if amount > 0
  IF v_amount > 0 THEN
    -- Check if income record already exists for this time entry
    IF NOT EXISTS (
      SELECT 1 FROM income_records
      WHERE time_entry_id = NEW.id AND user_id = NEW.user_id
    ) THEN
      -- Create income record
      INSERT INTO income_records (
        user_id,
        time_entry_id,
        job_id,
        date,
        amount,
        currency,
        source_type,
        is_manual,
        calculation_basis
      ) VALUES (
        NEW.user_id,
        NEW.id,
        NEW.job_id,
        NEW.date,
        v_amount,
        v_currency,
        v_source_type,  -- Use determined source type
        false,
        jsonb_build_object(
          'pay_type', COALESCE(NEW.pay_override_type, 'default'),
          'hours', NEW.actual_hours,
          'multiplier', v_multiplier,
          'rate_used', CASE
            WHEN NEW.pay_override_type = 'custom_hourly' THEN NEW.custom_hourly_rate
            WHEN NEW.pay_override_type = 'custom_daily' THEN NEW.custom_daily_rate
            WHEN NEW.pay_override_type = 'fixed_amount' THEN NEW.holiday_fixed_amount
            ELSE NULL
          END
        )
      );
    ELSE
      -- Update existing income record
      UPDATE income_records
      SET
        amount = v_amount,
        currency = v_currency,
        date = NEW.date,
        job_id = NEW.job_id,
        source_type = v_source_type,  -- Update source type
        calculation_basis = jsonb_build_object(
          'pay_type', COALESCE(NEW.pay_override_type, 'default'),
          'hours', NEW.actual_hours,
          'multiplier', v_multiplier,
          'rate_used', CASE
            WHEN NEW.pay_override_type = 'custom_hourly' THEN NEW.custom_hourly_rate
            WHEN NEW.pay_override_type = 'custom_daily' THEN NEW.custom_daily_rate
            WHEN NEW.pay_override_type = 'fixed_amount' THEN NEW.holiday_fixed_amount
            ELSE NULL
          END
        ),
        updated_at = NOW()
      WHERE time_entry_id = NEW.id AND user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION auto_create_income_record() IS
'Automatically creates or updates income records for completed work shifts.
Currency priority: 1) custom_currency, 2) job.currency, 3) user primary_currency, 4) USD
Source type: job_shift for jobs, freelance for shifts without jobs, job_salary for salary-based jobs';

-- ============================================================================
-- Update cleanup trigger to handle all source types (including freelance)
-- ============================================================================

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
        AND source_type IN ('job_shift', 'freelance', 'job_salary');
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_income_on_status_change() IS
'Automatically deletes income records when a time entry status changes from completed to another status.
This prevents double-counting where an entry would appear in both actual income (from income_records)
and expected income (calculated for planned/in_progress entries).
Handles all source types: job_shift, freelance, job_salary.';

-- ============================================================================
-- Clean up any existing duplicate or orphaned income records
-- ============================================================================

-- First, backup any problematic records
CREATE TABLE IF NOT EXISTS income_records_cleanup_backup_20260113 AS
SELECT ir.*, te.status as time_entry_status, NOW() as backed_up_at
FROM income_records ir
LEFT JOIN time_entries te ON ir.time_entry_id = te.id
WHERE
  -- Orphaned records (time entry not completed)
  (te.status IS NOT NULL AND te.status != 'completed')
  OR
  -- Records with invalid source_type
  (ir.source_type NOT IN ('job_shift', 'job_salary', 'bonus', 'freelance', 'other', 'time_entry'));

-- Clean up orphaned income records (where time_entry status is not 'completed')
DELETE FROM income_records ir
USING time_entries te
WHERE ir.time_entry_id = te.id
  AND te.status != 'completed';

-- Clean up duplicate income records (keep only the most recent one per time_entry_id)
DELETE FROM income_records ir1
USING (
  SELECT time_entry_id, MAX(created_at) as latest_created_at
  FROM income_records
  WHERE time_entry_id IS NOT NULL
  GROUP BY time_entry_id
  HAVING COUNT(*) > 1
) duplicates
WHERE ir1.time_entry_id = duplicates.time_entry_id
  AND ir1.created_at < duplicates.latest_created_at;

-- Report cleanup results
DO $$
DECLARE
  orphaned_count INTEGER;
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM income_records_cleanup_backup_20260113
  WHERE time_entry_status IS NOT NULL AND time_entry_status != 'completed';

  SELECT COUNT(*) INTO duplicate_count
  FROM income_records_cleanup_backup_20260113
  WHERE time_entry_status = 'completed';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'CLEANUP COMPLETED';
  RAISE NOTICE 'Orphaned records removed: %', orphaned_count;
  RAISE NOTICE 'Duplicate records removed: %', duplicate_count;
  RAISE NOTICE 'Backup table: income_records_cleanup_backup_20260113';
  RAISE NOTICE '============================================';
END $$;
