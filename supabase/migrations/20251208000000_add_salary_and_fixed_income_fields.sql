-- Add missing pay type fields to jobs table (from manual migrations)

-- Extend pay_type to include monthly and salary
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_pay_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_pay_type_check
  CHECK (pay_type IN ('hourly', 'daily', 'monthly', 'salary'));

-- Add monthly_rate and annual_salary columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS monthly_rate DECIMAL(10,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS annual_salary DECIMAL(10,2);

-- Add show_in_fixed_income flag
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS show_in_fixed_income BOOLEAN DEFAULT false;

-- Automatically set show_in_fixed_income = true for existing monthly/salary jobs
UPDATE jobs
SET show_in_fixed_income = true
WHERE pay_type IN ('monthly', 'salary') AND show_in_fixed_income = false;

COMMENT ON COLUMN jobs.monthly_rate IS 'Monthly rate for monthly-paid jobs';
COMMENT ON COLUMN jobs.annual_salary IS 'Annual salary for salary-paid jobs';
COMMENT ON COLUMN jobs.show_in_fixed_income IS 'Whether to show this job in Fixed Income card instead of per-shift earnings';
