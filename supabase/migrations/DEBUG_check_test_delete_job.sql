-- Diagnostic query to check "Test delete" job and its shifts
-- Run this in Supabase SQL Editor to debug the income issue

-- 1. Check if the job exists and has a valid hourly_rate
SELECT
  id,
  name,
  pay_type,
  hourly_rate,
  daily_rate,
  monthly_salary,
  currency,
  is_active
FROM jobs
WHERE name = 'Test delete';

-- 2. Check if there are any time entries for this job
SELECT
  te.id,
  te.date,
  te.entry_type,
  te.status,
  te.start_time,
  te.end_time,
  te.actual_hours,
  te.pay_override_type,
  te.custom_hourly_rate,
  te.custom_daily_rate,
  j.name as job_name,
  j.hourly_rate as job_hourly_rate
FROM time_entries te
LEFT JOIN jobs j ON j.id = te.job_id
WHERE j.name = 'Test delete';

-- 3. Check if there are any income records for this job's shifts
SELECT
  ir.id,
  ir.date,
  ir.amount,
  ir.currency,
  ir.source_type,
  ir.calculation_basis,
  ir.time_entry_id,
  j.name as job_name
FROM income_records ir
LEFT JOIN jobs j ON j.id = ir.job_id
WHERE j.name = 'Test delete';

-- 4. Check if the trigger function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'auto_generate_income_for_shift';
