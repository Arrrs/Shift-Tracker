-- Add advanced pay customization fields to time_entries
-- Supports: custom daily rate, holiday pay (multiplier or fixed), and pay override type

-- Custom daily rate (for freelance daily work or override)
ALTER TABLE time_entries ADD COLUMN custom_daily_rate DECIMAL(10,2);

-- Holiday/overtime fields
ALTER TABLE time_entries ADD COLUMN is_holiday BOOLEAN DEFAULT false;
ALTER TABLE time_entries ADD COLUMN holiday_multiplier DECIMAL(4,2); -- e.g., 1.5, 2.0
ALTER TABLE time_entries ADD COLUMN holiday_fixed_amount DECIMAL(10,2); -- Fixed total amount for the shift

-- Pay calculation type (determines which custom field to use)
-- Options: 'default', 'custom_hourly', 'custom_daily', 'holiday_multiplier', 'fixed_amount'
ALTER TABLE time_entries ADD COLUMN pay_override_type TEXT
  CHECK (pay_override_type IN ('default', 'custom_hourly', 'custom_daily', 'holiday_multiplier', 'fixed_amount'));

-- Comments for clarity
COMMENT ON COLUMN time_entries.custom_daily_rate IS
  'Custom daily rate (for freelance daily work or overriding job daily rate)';

COMMENT ON COLUMN time_entries.is_holiday IS
  'Whether this is a holiday/overtime shift (affects display and pay calculation)';

COMMENT ON COLUMN time_entries.holiday_multiplier IS
  'Multiplier for holiday pay (e.g., 1.5 for time-and-a-half, 2.0 for double time). Applied to hourly or daily rate.';

COMMENT ON COLUMN time_entries.holiday_fixed_amount IS
  'Fixed total amount for this shift (ignores hours/rates entirely)';

COMMENT ON COLUMN time_entries.pay_override_type IS
  'Determines which pay calculation to use:
  - default: Use job default rate (hourly or daily)
  - custom_hourly: Use custom_hourly_rate
  - custom_daily: Use custom_daily_rate
  - holiday_multiplier: Apply holiday_multiplier to base rate
  - fixed_amount: Use holiday_fixed_amount directly';

-- Index for holiday shifts
CREATE INDEX idx_time_entries_holiday ON time_entries(is_holiday) WHERE is_holiday = true;
