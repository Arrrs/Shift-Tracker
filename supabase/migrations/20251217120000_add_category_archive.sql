-- Add is_active field to financial_categories for archive functionality
ALTER TABLE financial_categories
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for faster filtering by active status
CREATE INDEX IF NOT EXISTS idx_financial_categories_is_active ON financial_categories(user_id, is_active);

COMMENT ON COLUMN financial_categories.is_active IS 'Whether the category is active (true) or archived (false)';
