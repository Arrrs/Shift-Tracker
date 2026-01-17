-- ============================================================================
-- Migration: Update Income Record Trigger to Use Primary Currency
-- Date: 2026-01-13
-- Description: Updates the auto-create income trigger to use user's
--              primary_currency as fallback when no other currency is available
-- ============================================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS auto_create_income_record_trigger ON time_entries;

-- Recreate the function with primary_currency fallback
CREATE OR REPLACE FUNCTION auto_create_income_record()
RETURNS TRIGGER AS $$
DECLARE
  v_currency TEXT;
  v_amount NUMERIC;
  v_job_record RECORD;
  v_multiplier NUMERIC;
  v_user_primary_currency TEXT;
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
  -- 3. User's primary_currency from settings (NEW!)
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
        'time_entry',
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

-- Recreate trigger
CREATE TRIGGER auto_create_income_record_trigger
AFTER INSERT OR UPDATE ON time_entries
FOR EACH ROW
EXECUTE FUNCTION auto_create_income_record();

-- Add comment
COMMENT ON FUNCTION auto_create_income_record() IS
'Automatically creates or updates income records for completed work shifts.
Currency priority: 1) custom_currency, 2) job.currency, 3) user primary_currency, 4) USD';
