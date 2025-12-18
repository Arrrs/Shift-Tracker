-- Migration: Add earnings snapshot columns to shifts table
-- This implements the snapshot-based earnings architecture to preserve historical accuracy

-- Add columns for storing actual earnings at time of shift
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS actual_earnings DECIMAL(10, 2);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS earnings_currency TEXT DEFAULT 'USD';

-- Backfill existing shifts with calculated earnings (ONE-TIME OPERATION)
-- This snapshots the current calculated values before switching to the new system
UPDATE shifts
SET
  actual_earnings = (
    CASE
      -- Hourly jobs: hours × rate (use custom rate if set, otherwise job rate)
      WHEN jobs.pay_type = 'hourly' THEN
        COALESCE(shifts.actual_hours, shifts.scheduled_hours, 0) *
        COALESCE(shifts.custom_hourly_rate, jobs.hourly_rate, 0)

      -- Daily jobs: fixed daily rate
      WHEN jobs.pay_type = 'daily' THEN
        COALESCE(jobs.daily_rate, 0)

      -- Monthly jobs with show_in_fixed_income: set to NULL (time tracking only)
      WHEN jobs.pay_type = 'monthly' AND jobs.show_in_fixed_income = true THEN
        NULL

      -- Monthly jobs without show_in_fixed_income: prorate monthly rate
      WHEN jobs.pay_type = 'monthly' THEN
        COALESCE(jobs.monthly_rate, 0) / 22

      -- Salary jobs with show_in_fixed_income: set to NULL (time tracking only)
      WHEN jobs.pay_type = 'salary' AND jobs.show_in_fixed_income = true THEN
        NULL

      -- Salary jobs without show_in_fixed_income: prorate annual salary
      WHEN jobs.pay_type = 'salary' THEN
        COALESCE(jobs.annual_salary, 0) / 260

      -- Default: 0
      ELSE 0
    END
  ),
  earnings_currency = COALESCE(jobs.currency, 'USD')
FROM jobs
WHERE shifts.job_id = jobs.id AND shifts.actual_earnings IS NULL;

-- Add comment explaining the architecture
COMMENT ON COLUMN shifts.actual_earnings IS 'Snapshot of earnings at time of shift creation/completion. Never recalculated - preserves historical accuracy.';
COMMENT ON COLUMN shifts.earnings_currency IS 'Currency used for actual_earnings. Stored per-shift to handle multi-currency scenarios.';
