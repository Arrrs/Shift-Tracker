-- Fix income_records to CASCADE delete when time_entry is deleted
-- Currently it's SET NULL which leaves orphaned income records

-- Drop the existing constraint
ALTER TABLE income_records
DROP CONSTRAINT IF EXISTS income_records_time_entry_id_fkey;

-- Add new constraint with CASCADE
ALTER TABLE income_records
ADD CONSTRAINT income_records_time_entry_id_fkey
FOREIGN KEY (time_entry_id)
REFERENCES time_entries(id)
ON DELETE CASCADE;

-- Clean up any existing orphaned records (where time_entry_id is NULL but source is job_shift)
DELETE FROM income_records
WHERE source_type = 'job_shift'
  AND time_entry_id IS NULL;
