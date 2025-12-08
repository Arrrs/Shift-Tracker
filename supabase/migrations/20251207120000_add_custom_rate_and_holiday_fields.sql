-- Add custom hourly rate and holiday multiplier fields to shifts table

-- Add custom_hourly_rate for shifts without job or with override rate
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS custom_hourly_rate DECIMAL(10,2);

COMMENT ON COLUMN shifts.custom_hourly_rate IS
  'Optional hourly rate override. Used for: (1) shifts without job assignment, (2) shifts with different rate than job default';

-- Note: is_holiday and holiday_multiplier already exist in the schema
-- Just adding comments for clarity
COMMENT ON COLUMN shifts.is_holiday IS
  'Whether this shift is on a holiday (affects pay calculation)';

COMMENT ON COLUMN shifts.holiday_multiplier IS
  'Multiplier for holiday pay (e.g., 1.5 for time-and-a-half, 2.0 for double time)';
