-- Update auto-income trigger to support advanced pay customization
-- Handles: hourly, daily, holiday multipliers, fixed amounts, and all combinations

CREATE OR REPLACE FUNCTION auto_generate_income_for_shift()
RETURNS TRIGGER AS $$
DECLARE
  v_job RECORD;
  v_calculated_amount DECIMAL(10,2);
  v_calculation_basis JSONB;
  v_currency TEXT;
  v_base_rate DECIMAL(10,2);
  v_pay_type TEXT;
BEGIN
  -- Only process completed work shifts
  IF NEW.entry_type != 'work_shift' OR NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get job details if job_id is present
  IF NEW.job_id IS NOT NULL THEN
    SELECT * INTO v_job FROM jobs WHERE id = NEW.job_id;
    v_currency := v_job.currency;
  ELSE
    -- Default currency for job-less shifts
    v_currency := 'USD';
  END IF;

  -- ========================================
  -- STEP 1: Determine pay calculation type
  -- ========================================

  -- Priority order:
  -- 1. pay_override_type (if explicitly set)
  -- 2. custom_hourly_rate (backward compatibility)
  -- 3. Job's pay_type

  IF NEW.pay_override_type IS NOT NULL THEN
    v_pay_type := NEW.pay_override_type;
  ELSIF NEW.custom_hourly_rate IS NOT NULL AND NEW.custom_hourly_rate > 0 THEN
    v_pay_type := 'custom_hourly';
  ELSIF v_job.pay_type IN ('hourly', 'daily') THEN
    v_pay_type := v_job.pay_type;
  ELSIF NEW.custom_daily_rate IS NOT NULL AND NEW.custom_daily_rate > 0 THEN
    v_pay_type := 'custom_daily';
  ELSE
    -- No rate information available, or monthly/salary job
    RETURN NEW;
  END IF;

  -- ========================================
  -- STEP 2: Calculate amount based on type
  -- ========================================

  CASE v_pay_type
    -- Fixed amount (highest priority - ignores everything else)
    WHEN 'fixed_amount' THEN
      IF NEW.holiday_fixed_amount IS NULL OR NEW.holiday_fixed_amount <= 0 THEN
        RETURN NEW; -- Can't calculate without fixed amount
      END IF;

      v_calculated_amount := NEW.holiday_fixed_amount;
      v_calculation_basis := jsonb_build_object(
        'type', 'fixed_amount',
        'amount', NEW.holiday_fixed_amount,
        'is_holiday', NEW.is_holiday,
        'formula', 'Fixed amount: $' || NEW.holiday_fixed_amount
      );

    -- Holiday multiplier (applied to hourly or daily rate)
    WHEN 'holiday_multiplier' THEN
      IF NEW.holiday_multiplier IS NULL OR NEW.holiday_multiplier <= 0 THEN
        RETURN NEW; -- Can't calculate without multiplier
      END IF;

      -- Determine base rate (custom or job default)
      IF NEW.custom_hourly_rate IS NOT NULL AND NEW.custom_hourly_rate > 0 THEN
        v_base_rate := NEW.custom_hourly_rate;
        v_calculated_amount := NEW.actual_hours * v_base_rate * NEW.holiday_multiplier;
        v_calculation_basis := jsonb_build_object(
          'type', 'holiday_multiplier_hourly',
          'hours', NEW.actual_hours,
          'base_rate', v_base_rate,
          'multiplier', NEW.holiday_multiplier,
          'is_holiday', NEW.is_holiday,
          'formula', NEW.actual_hours || 'h × $' || v_base_rate || ' × ' || NEW.holiday_multiplier
        );
      ELSIF v_job.pay_type = 'hourly' AND v_job.hourly_rate IS NOT NULL THEN
        v_base_rate := v_job.hourly_rate;
        v_calculated_amount := NEW.actual_hours * v_base_rate * NEW.holiday_multiplier;
        v_calculation_basis := jsonb_build_object(
          'type', 'holiday_multiplier_hourly',
          'hours', NEW.actual_hours,
          'base_rate', v_base_rate,
          'multiplier', NEW.holiday_multiplier,
          'job_id', v_job.id,
          'job_name', v_job.name,
          'is_holiday', NEW.is_holiday,
          'formula', NEW.actual_hours || 'h × $' || v_base_rate || ' × ' || NEW.holiday_multiplier
        );
      ELSIF NEW.custom_daily_rate IS NOT NULL AND NEW.custom_daily_rate > 0 THEN
        v_base_rate := NEW.custom_daily_rate;
        v_calculated_amount := v_base_rate * NEW.holiday_multiplier;
        v_calculation_basis := jsonb_build_object(
          'type', 'holiday_multiplier_daily',
          'base_rate', v_base_rate,
          'multiplier', NEW.holiday_multiplier,
          'is_holiday', NEW.is_holiday,
          'formula', '$' || v_base_rate || ' × ' || NEW.holiday_multiplier
        );
      ELSIF v_job.pay_type = 'daily' AND v_job.daily_rate IS NOT NULL THEN
        v_base_rate := v_job.daily_rate;
        v_calculated_amount := v_base_rate * NEW.holiday_multiplier;
        v_calculation_basis := jsonb_build_object(
          'type', 'holiday_multiplier_daily',
          'base_rate', v_base_rate,
          'multiplier', NEW.holiday_multiplier,
          'job_id', v_job.id,
          'job_name', v_job.name,
          'is_holiday', NEW.is_holiday,
          'formula', '$' || v_base_rate || ' × ' || NEW.holiday_multiplier
        );
      ELSE
        RETURN NEW; -- No base rate available
      END IF;

    -- Custom hourly rate
    WHEN 'custom_hourly' THEN
      IF NEW.custom_hourly_rate IS NULL OR NEW.custom_hourly_rate <= 0 THEN
        RETURN NEW;
      END IF;

      v_calculated_amount := NEW.actual_hours * NEW.custom_hourly_rate;
      v_calculation_basis := jsonb_build_object(
        'type', 'custom_hourly',
        'hours', NEW.actual_hours,
        'rate', NEW.custom_hourly_rate,
        'is_holiday', NEW.is_holiday,
        'formula', NEW.actual_hours || 'h × $' || NEW.custom_hourly_rate
      );

    -- Custom daily rate
    WHEN 'custom_daily' THEN
      IF NEW.custom_daily_rate IS NULL OR NEW.custom_daily_rate <= 0 THEN
        RETURN NEW;
      END IF;

      v_calculated_amount := NEW.custom_daily_rate;
      v_calculation_basis := jsonb_build_object(
        'type', 'custom_daily',
        'rate', NEW.custom_daily_rate,
        'is_holiday', NEW.is_holiday,
        'formula', 'Daily rate: $' || NEW.custom_daily_rate
      );

    -- Job default hourly
    WHEN 'hourly' THEN
      IF v_job.hourly_rate IS NULL THEN
        RETURN NEW;
      END IF;

      v_calculated_amount := NEW.actual_hours * v_job.hourly_rate;
      v_calculation_basis := jsonb_build_object(
        'type', 'job_hourly',
        'hours', NEW.actual_hours,
        'rate', v_job.hourly_rate,
        'job_id', v_job.id,
        'job_name', v_job.name,
        'is_holiday', NEW.is_holiday,
        'formula', NEW.actual_hours || 'h × $' || v_job.hourly_rate
      );

    -- Job default daily
    WHEN 'daily' THEN
      IF v_job.daily_rate IS NULL THEN
        RETURN NEW;
      END IF;

      v_calculated_amount := v_job.daily_rate;
      v_calculation_basis := jsonb_build_object(
        'type', 'job_daily',
        'rate', v_job.daily_rate,
        'job_id', v_job.id,
        'job_name', v_job.name,
        'is_holiday', NEW.is_holiday,
        'formula', 'Daily rate: $' || v_job.daily_rate
      );

    ELSE
      -- Unknown or default - try to fall back
      RETURN NEW;
  END CASE;

  -- ========================================
  -- STEP 3: Create income record
  -- ========================================

  DECLARE
    v_source_type TEXT;
  BEGIN
    IF NEW.job_id IS NULL THEN
      v_source_type := 'freelance';
    ELSE
      v_source_type := 'job_shift';
    END IF;

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
      NEW.job_id,
      NEW.id,
      v_calculated_amount,
      v_currency,
      v_calculation_basis,
      false
    )
    ON CONFLICT DO NOTHING;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists, will use updated function automatically

COMMENT ON FUNCTION auto_generate_income_for_shift() IS
'Auto-generates income records for completed work shifts with advanced pay customization.
Supports:
- Job default rates (hourly/daily)
- Custom hourly/daily rates (freelance or override)
- Holiday multipliers (e.g., 1.5x, 2x)
- Fixed amounts (ignores hours/rates)
Priority: fixed_amount > holiday_multiplier > custom rates > job defaults';
