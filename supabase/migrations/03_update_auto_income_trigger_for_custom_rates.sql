-- Update auto-income trigger to support custom_hourly_rate
-- This allows:
-- 1. Shifts without job_id (freelance/one-off work) to generate income using custom_hourly_rate
-- 2. Job-linked shifts to override the job's default rate with custom_hourly_rate
-- 3. More flexible income tracking for varying pay rates

CREATE OR REPLACE FUNCTION auto_generate_income_for_shift()
RETURNS TRIGGER AS $$
DECLARE
  v_job RECORD;
  v_calculated_amount DECIMAL(10,2);
  v_calculation_basis JSONB;
  v_currency TEXT;
  v_rate DECIMAL(10,2);
BEGIN
  -- Only process completed work shifts
  IF NEW.entry_type != 'work_shift' OR NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Check if we have either a job_id OR a custom_hourly_rate
  -- (at least one is needed to calculate income)
  IF NEW.job_id IS NULL AND NEW.custom_hourly_rate IS NULL THEN
    RETURN NEW;  -- Can't calculate income without rate information
  END IF;

  -- Get job details if job_id is present
  IF NEW.job_id IS NOT NULL THEN
    SELECT * INTO v_job FROM jobs WHERE id = NEW.job_id;
    v_currency := v_job.currency;
  ELSE
    -- Default currency for job-less shifts
    v_currency := 'USD';
  END IF;

  -- Determine if this is an hourly or daily calculation
  -- Priority: custom_hourly_rate > job's hourly_rate > job's daily_rate

  IF NEW.custom_hourly_rate IS NOT NULL THEN
    -- Use custom hourly rate (works for both job-linked and job-less shifts)
    v_rate := NEW.custom_hourly_rate;
    v_calculated_amount := NEW.actual_hours * v_rate;
    v_calculation_basis := jsonb_build_object(
      'type', 'custom_hourly',
      'hours', NEW.actual_hours,
      'rate', v_rate,
      'formula', NEW.actual_hours || 'h × $' || v_rate
    );
  ELSIF v_job.pay_type = 'hourly' AND v_job.hourly_rate IS NOT NULL THEN
    -- Use job's default hourly rate
    v_rate := v_job.hourly_rate;
    v_calculated_amount := NEW.actual_hours * v_rate;
    v_calculation_basis := jsonb_build_object(
      'type', 'job_hourly',
      'hours', NEW.actual_hours,
      'rate', v_rate,
      'job_id', v_job.id,
      'job_name', v_job.name,
      'formula', NEW.actual_hours || 'h × $' || v_rate
    );
  ELSIF v_job.pay_type = 'daily' AND v_job.daily_rate IS NOT NULL THEN
    -- Use job's daily rate
    v_calculated_amount := v_job.daily_rate;
    v_calculation_basis := jsonb_build_object(
      'type', 'job_daily',
      'rate', v_job.daily_rate,
      'job_id', v_job.id,
      'job_name', v_job.name,
      'formula', 'Daily rate: $' || v_job.daily_rate
    );
  ELSE
    -- Job is monthly/salary type - don't auto-generate income
    RETURN NEW;
  END IF;

  -- Determine source_type
  -- If no job_id, it's freelance work
  -- If job_id exists, it's a job shift
  DECLARE
    v_source_type TEXT;
  BEGIN
    IF NEW.job_id IS NULL THEN
      v_source_type := 'freelance';
    ELSE
      v_source_type := 'job_shift';
    END IF;

    -- Create income record
    INSERT INTO income_records (
      user_id,
      date,
      source_type,
      job_id,
      time_entry_id,
      amount,
      currency,
      calculation_basis,
      is_manual
    ) VALUES (
      NEW.user_id,
      NEW.date,
      v_source_type,
      NEW.job_id,  -- NULL for freelance shifts
      NEW.id,
      v_calculated_amount,
      v_currency,
      v_calculation_basis,
      false
    )
    ON CONFLICT DO NOTHING;  -- Prevent duplicates if trigger runs twice
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger already exists, so we don't need to recreate it
-- It will automatically use the updated function

COMMENT ON FUNCTION auto_generate_income_for_shift() IS
'Auto-generates income records for completed work shifts. Supports:
- Job-linked shifts with job default rates (hourly/daily)
- Job-linked shifts with custom_hourly_rate override
- Job-less shifts (freelance) with custom_hourly_rate
- Does NOT auto-generate for monthly/salary jobs (manual entry required)';
