-- Add custom_hourly_rate field to time_entries table for freelance/varying rates
ALTER TABLE time_entries ADD COLUMN custom_hourly_rate DECIMAL(10,2);

COMMENT ON COLUMN time_entries.custom_hourly_rate IS 'Optional custom hourly rate that overrides the job default rate for this specific entry (useful for freelance/project work with varying rates)';
