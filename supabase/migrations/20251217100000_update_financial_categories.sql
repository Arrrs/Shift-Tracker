-- ============================================================================
-- Update Financial Categories System
-- ============================================================================
-- This migration updates the financial_categories table to support:
-- 1. Optional default amount and currency per category
-- 2. Removes old default categories (keeps only "Other Income" and "Other Expense")
-- 3. Ensures category deletion sets financial_records.category_id to NULL
-- ============================================================================

-- 1. Add default amount and currency fields
-- ============================================================================
ALTER TABLE financial_categories
ADD COLUMN IF NOT EXISTS default_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS default_currency TEXT;

-- Add comment to document the fields
COMMENT ON COLUMN financial_categories.default_amount IS 'Optional default amount to pre-fill when creating financial records with this category';
COMMENT ON COLUMN financial_categories.default_currency IS 'Optional default currency (e.g., USD, EUR) for the default amount';

-- 2. Update foreign key constraint to SET NULL on category deletion
-- ============================================================================
-- Drop existing foreign key constraint
ALTER TABLE financial_records
DROP CONSTRAINT IF EXISTS financial_records_category_id_fkey;

-- Add new constraint with ON DELETE SET NULL
ALTER TABLE financial_records
ADD CONSTRAINT financial_records_category_id_fkey
FOREIGN KEY (category_id)
REFERENCES financial_categories(id)
ON DELETE SET NULL;

-- 3. Remove old default categories (except "Other Income" and "Other Expense")
-- ============================================================================
-- Delete all categories except the mandatory "Other" ones
DELETE FROM financial_categories
WHERE name NOT IN ('Other Income', 'Other Expense');

-- Update the "Other" categories to ensure consistent styling
UPDATE financial_categories
SET
  icon = '💰',
  color = '#6366f1'
WHERE name = 'Other Income';

UPDATE financial_categories
SET
  icon = '💸',
  color = '#64748b'
WHERE name = 'Other Expense';

-- 4. Ensure all existing users have the two mandatory categories
-- ============================================================================
INSERT INTO financial_categories (user_id, name, type, icon, color)
SELECT
  id,
  category_name,
  category_type,
  category_icon,
  category_color
FROM auth.users
CROSS JOIN (
  VALUES
    ('Other Income', 'income', '💰', '#6366f1'),
    ('Other Expense', 'expense', '💸', '#64748b')
) AS defaults(category_name, category_type, category_icon, category_color)
ON CONFLICT (user_id, name, type) DO NOTHING;
