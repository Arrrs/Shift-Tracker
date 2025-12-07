-- Change start_time and end_time from TIMESTAMP WITH TIME ZONE to TIME
-- This allows storing just the time portion without date/timezone

-- First, drop the unique constraint that includes start_time
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_user_id_date_start_time_key;

-- Change the column types
ALTER TABLE shifts
  ALTER COLUMN start_time TYPE TIME USING start_time::TIME,
  ALTER COLUMN end_time TYPE TIME USING end_time::TIME;

-- Recreate the unique constraint with the new TIME type
ALTER TABLE shifts
  ADD CONSTRAINT shifts_user_id_date_start_time_key
  UNIQUE(user_id, date, start_time);
