-- ============================================================================
-- Migration: Add UNIQUE constraint to prevent duplicate income records
-- Date: 2026-01-13
-- Description: Ensures only one income record per time_entry_id to prevent
--              duplicate income records from being created
-- ============================================================================

-- First, clean up any existing duplicates (keep the most recent one)
DO $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete older duplicates, keep only the most recent
  WITH duplicates AS (
    SELECT
      time_entry_id,
      id,
      created_at,
      ROW_NUMBER() OVER (PARTITION BY time_entry_id ORDER BY created_at DESC) as rn
    FROM income_records
    WHERE time_entry_id IS NOT NULL
  )
  DELETE FROM income_records
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removed % duplicate income records', deleted_count;
  ELSE
    RAISE NOTICE 'No duplicate income records found';
  END IF;
END $$;

-- Add UNIQUE constraint to prevent future duplicates
-- This will cause an error if trigger tries to INSERT a duplicate
-- and will force it to take the UPDATE path instead
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'income_records_time_entry_id_unique'
  ) THEN
    ALTER TABLE income_records
    ADD CONSTRAINT income_records_time_entry_id_unique
    UNIQUE (time_entry_id);

    RAISE NOTICE 'Added UNIQUE constraint on time_entry_id';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists';
  END IF;
END $$;

-- Update the trigger to use UPSERT instead of IF EXISTS check
-- This is more reliable and handles race conditions better
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
    RAISE NOTICE 'Using custom_currency: %', v_currency;
  ELSIF NEW.job_id IS NOT NULL THEN
    -- Get job details
    SELECT currency INTO v_currency
    FROM jobs
    WHERE id = NEW.job_id AND user_id = NEW.user_id;

    -- If job has no currency, use user's primary currency
    v_currency := COALESCE(v_currency, v_user_primary_currency);
    RAISE NOTICE 'Using job currency: % (or fallback: %)', v_currency, v_user_primary_currency;
  ELSE
    -- No job, no custom currency - use user's primary currency
    v_currency := v_user_primary_currency;
    RAISE NOTICE 'Using primary_currency (no job): %', v_currency;
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

  -- Only create/update income record if amount > 0
  IF v_amount > 0 THEN
    RAISE NOTICE 'Creating/updating income record: amount=%, currency=%', v_amount, v_currency;

    -- Use INSERT ... ON CONFLICT (UPSERT) for atomic operation
    -- This is more reliable than separate EXISTS check + INSERT/UPDATE
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
      v_source_type,
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
    )
    ON CONFLICT (time_entry_id)
    DO UPDATE SET
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      date = EXCLUDED.date,
      job_id = EXCLUDED.job_id,
      source_type = EXCLUDED.source_type,
      calculation_basis = EXCLUDED.calculation_basis,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_create_income_record() IS
'Automatically creates or updates income records for completed work shifts using UPSERT.
Currency priority: 1) custom_currency, 2) job.currency, 3) user primary_currency, 4) USD
Source type: job_shift for jobs, freelance for shifts without jobs, job_salary for salary-based jobs
Uses UPSERT (INSERT ... ON CONFLICT) to prevent race conditions and duplicates.';
