-- Backfill income records for completed shifts that don't have them yet
-- This handles shifts created before the trigger fix

DO $$
DECLARE
  v_entry RECORD;
  v_job RECORD;
  v_calculated_amount DECIMAL(10,2);
  v_calculation_basis JSONB;
  v_currency TEXT;
  v_base_rate DECIMAL(10,2);
  v_pay_type TEXT;
  v_source_type TEXT;
  v_records_created INT := 0;
BEGIN
  -- Find all completed work shifts without income records
  FOR v_entry IN
    SELECT te.*
    FROM time_entries te
    LEFT JOIN income_records ir ON ir.time_entry_id = te.id
    WHERE te.entry_type = 'work_shift'
      AND te.status = 'completed'
      AND ir.id IS NULL  -- No income record exists
  LOOP
    -- Get job details if job_id is present
    IF v_entry.job_id IS NOT NULL THEN
      SELECT * INTO v_job FROM jobs WHERE id = v_entry.job_id;
      v_currency := v_job.currency;
    ELSE
      v_currency := 'USD';
      v_job := NULL; -- Explicitly set to NULL
    END IF;

    -- Determine pay calculation type (same logic as trigger)
    v_pay_type := NULL;
    IF v_entry.pay_override_type IS NOT NULL
       AND v_entry.pay_override_type != 'default'
       AND v_entry.pay_override_type != 'none'
       AND v_entry.pay_override_type != '' THEN
      v_pay_type := v_entry.pay_override_type;
    ELSIF v_entry.custom_hourly_rate IS NOT NULL AND v_entry.custom_hourly_rate > 0 THEN
      v_pay_type := 'custom_hourly';
    ELSIF v_entry.job_id IS NOT NULL THEN
      -- Only access v_job fields if job exists
      IF v_job.pay_type IN ('hourly', 'daily') THEN
        v_pay_type := v_job.pay_type;
      END IF;
    ELSIF v_entry.custom_daily_rate IS NOT NULL AND v_entry.custom_daily_rate > 0 THEN
      v_pay_type := 'custom_daily';
    END IF;

    -- Skip if no calculable rate
    IF v_pay_type IS NULL THEN
      CONTINUE;
    END IF;

    -- Calculate amount based on type
    v_calculated_amount := NULL;
    CASE v_pay_type
      WHEN 'fixed_amount' THEN
        IF v_entry.holiday_fixed_amount IS NOT NULL AND v_entry.holiday_fixed_amount > 0 THEN
          v_calculated_amount := v_entry.holiday_fixed_amount;
          v_calculation_basis := jsonb_build_object(
            'type', 'fixed_amount',
            'amount', v_entry.holiday_fixed_amount,
            'is_holiday', v_entry.is_holiday,
            'formula', 'Fixed amount: $' || v_entry.holiday_fixed_amount
          );
        END IF;

      WHEN 'holiday_multiplier' THEN
        IF v_entry.holiday_multiplier IS NOT NULL AND v_entry.holiday_multiplier > 0 THEN
          IF v_entry.custom_hourly_rate IS NOT NULL AND v_entry.custom_hourly_rate > 0 THEN
            v_base_rate := v_entry.custom_hourly_rate;
            v_calculated_amount := v_entry.actual_hours * v_base_rate * v_entry.holiday_multiplier;
            v_calculation_basis := jsonb_build_object(
              'type', 'holiday_multiplier_hourly',
              'hours', v_entry.actual_hours,
              'base_rate', v_base_rate,
              'multiplier', v_entry.holiday_multiplier,
              'is_holiday', v_entry.is_holiday
            );
          ELSIF v_entry.job_id IS NOT NULL THEN
            IF v_job.pay_type = 'hourly' AND v_job.hourly_rate IS NOT NULL THEN
              v_base_rate := v_job.hourly_rate;
              v_calculated_amount := v_entry.actual_hours * v_base_rate * v_entry.holiday_multiplier;
              v_calculation_basis := jsonb_build_object(
                'type', 'holiday_multiplier_hourly',
                'hours', v_entry.actual_hours,
                'base_rate', v_base_rate,
                'multiplier', v_entry.holiday_multiplier,
                'job_id', v_job.id,
                'job_name', v_job.name,
                'is_holiday', v_entry.is_holiday
              );
            ELSIF v_job.pay_type = 'daily' AND v_job.daily_rate IS NOT NULL THEN
              v_base_rate := v_job.daily_rate;
              v_calculated_amount := v_base_rate * v_entry.holiday_multiplier;
              v_calculation_basis := jsonb_build_object(
                'type', 'holiday_multiplier_daily',
                'base_rate', v_base_rate,
                'multiplier', v_entry.holiday_multiplier,
                'job_id', v_job.id,
                'job_name', v_job.name,
                'is_holiday', v_entry.is_holiday
              );
            END IF;
          ELSIF v_entry.custom_daily_rate IS NOT NULL AND v_entry.custom_daily_rate > 0 THEN
            v_base_rate := v_entry.custom_daily_rate;
            v_calculated_amount := v_base_rate * v_entry.holiday_multiplier;
            v_calculation_basis := jsonb_build_object(
              'type', 'holiday_multiplier_daily',
              'base_rate', v_base_rate,
              'multiplier', v_entry.holiday_multiplier,
              'is_holiday', v_entry.is_holiday
            );
          END IF;
        END IF;

      WHEN 'custom_hourly' THEN
        IF v_entry.custom_hourly_rate IS NOT NULL AND v_entry.custom_hourly_rate > 0 THEN
          v_calculated_amount := v_entry.actual_hours * v_entry.custom_hourly_rate;
          v_calculation_basis := jsonb_build_object(
            'type', 'custom_hourly',
            'hours', v_entry.actual_hours,
            'rate', v_entry.custom_hourly_rate,
            'is_holiday', v_entry.is_holiday
          );
        END IF;

      WHEN 'custom_daily' THEN
        IF v_entry.custom_daily_rate IS NOT NULL AND v_entry.custom_daily_rate > 0 THEN
          v_calculated_amount := v_entry.custom_daily_rate;
          v_calculation_basis := jsonb_build_object(
            'type', 'custom_daily',
            'rate', v_entry.custom_daily_rate,
            'is_holiday', v_entry.is_holiday
          );
        END IF;

      WHEN 'hourly' THEN
        IF v_entry.job_id IS NOT NULL THEN
          IF v_job.hourly_rate IS NOT NULL THEN
            v_calculated_amount := v_entry.actual_hours * v_job.hourly_rate;
            v_calculation_basis := jsonb_build_object(
              'type', 'job_hourly',
              'hours', v_entry.actual_hours,
              'rate', v_job.hourly_rate,
              'job_id', v_job.id,
              'job_name', v_job.name,
              'is_holiday', v_entry.is_holiday
            );
          END IF;
        END IF;

      WHEN 'daily' THEN
        IF v_entry.job_id IS NOT NULL THEN
          IF v_job.daily_rate IS NOT NULL THEN
            v_calculated_amount := v_job.daily_rate;
            v_calculation_basis := jsonb_build_object(
              'type', 'job_daily',
              'rate', v_job.daily_rate,
              'job_id', v_job.id,
              'job_name', v_job.name,
              'is_holiday', v_entry.is_holiday
            );
          END IF;
        END IF;
    END CASE;

    -- Create income record if amount was calculated
    IF v_calculated_amount IS NOT NULL AND v_calculated_amount > 0 THEN
      IF v_entry.job_id IS NULL THEN
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
        v_entry.user_id,
        v_entry.date,
        v_source_type,
        v_entry.job_id,
        v_entry.id,
        v_calculated_amount,
        v_currency,
        v_calculation_basis,
        false
      )
      ON CONFLICT DO NOTHING;

      v_records_created := v_records_created + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Backfill complete: Created % income records for existing completed shifts', v_records_created;
END $$;
