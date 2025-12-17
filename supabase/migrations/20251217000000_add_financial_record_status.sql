-- ============================================================================
-- Add status field to financial_records table
-- ============================================================================
-- This migration adds a status field to track planned, completed, and cancelled
-- financial records, matching the pattern used for time entries (shifts).
--
-- Statuses:
-- - 'completed': Default. Actual income/expenses that occurred (included in totals)
-- - 'planned': Expected future income/expenses (shown separately, not in actual totals)
-- - 'cancelled': Cancelled transactions (not included in totals, kept for history)
-- ============================================================================

-- Add status column with default 'completed' for backward compatibility
ALTER TABLE financial_records
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'
CHECK (status IN ('completed', 'planned', 'cancelled'));

-- Create index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_financial_records_status ON financial_records(status);

-- Create composite index for common query pattern (user + date + status)
CREATE INDEX IF NOT EXISTS idx_financial_records_user_date_status
ON financial_records(user_id, date, status);

-- Add comment to document the field
COMMENT ON COLUMN financial_records.status IS 'Status of the financial record: completed (actual), planned (expected), or cancelled (historical)';
