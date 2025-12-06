-- =====================================================
-- Update shifts.job_id foreign key constraint
-- Change from ON DELETE CASCADE to ON DELETE SET NULL
-- This preserves shift history even when jobs are deleted
-- =====================================================

-- Drop the existing foreign key constraint
ALTER TABLE shifts
DROP CONSTRAINT shifts_job_id_fkey;

-- Recreate with SET NULL instead of CASCADE
-- This allows shifts to remain when a job is deleted
ALTER TABLE shifts
ADD CONSTRAINT shifts_job_id_fkey
FOREIGN KEY (job_id)
REFERENCES jobs(id)
ON DELETE SET NULL;

-- Make job_id nullable (it was NOT NULL before)
ALTER TABLE shifts
ALTER COLUMN job_id DROP NOT NULL;

-- =====================================================
-- Note: shift_templates still CASCADE (correct behavior)
-- Templates are just patterns, not historical data
-- =====================================================
