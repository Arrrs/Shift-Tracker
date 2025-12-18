-- Add description field to jobs table
ALTER TABLE jobs ADD COLUMN description TEXT;

COMMENT ON COLUMN jobs.description IS 'Optional notes about the job (location, manager, employee ID, etc.)';
