-- Add 'cancelled' to the allowed shift status values
-- Drop the old constraint
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_status_check;

-- Add the new constraint with 'cancelled' included
ALTER TABLE shifts ADD CONSTRAINT shifts_status_check
  CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled'));
