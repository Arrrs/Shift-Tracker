-- ============================================================================
-- Add Default Description to Financial Categories
-- ============================================================================
-- This migration adds an optional default_description field to categories
-- to auto-fill the description field when creating financial records
-- ============================================================================

ALTER TABLE financial_categories
ADD COLUMN IF NOT EXISTS default_description TEXT;

COMMENT ON COLUMN financial_categories.default_description IS 'Optional default description to pre-fill when creating financial records with this category';
