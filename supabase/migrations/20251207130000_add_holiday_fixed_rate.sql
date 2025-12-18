-- Add holiday_fixed_rate field for fixed holiday pay instead of multiplier

ALTER TABLE shifts ADD COLUMN IF NOT EXISTS holiday_fixed_rate DECIMAL(10,2);

COMMENT ON COLUMN shifts.holiday_fixed_rate IS
  'Fixed hourly rate for holiday shifts (alternative to holiday_multiplier)';
