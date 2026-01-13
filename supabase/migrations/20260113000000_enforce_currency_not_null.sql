-- ============================================================================
-- Migration: Enforce Currency NOT NULL Everywhere
-- Date: 2026-01-13
-- Description: Ensures all currency fields are NOT NULL with proper defaults
--              Uses user's primary_currency as fallback where possible
-- ============================================================================

-- STEP 1: Backfill NULL currencies with user's primary currency
-- ============================================================================

-- Backfill jobs.currency
UPDATE jobs
SET currency = COALESCE(
  (SELECT primary_currency FROM user_settings WHERE user_settings.user_id = jobs.user_id),
  'USD'
)
WHERE currency IS NULL;

-- Backfill income_records.currency
UPDATE income_records
SET currency = COALESCE(
  (SELECT primary_currency FROM user_settings WHERE user_settings.user_id = income_records.user_id),
  'USD'
)
WHERE currency IS NULL;

-- Note: financial_records.currency is already NOT NULL DEFAULT 'USD'
-- But let's ensure no NULLs exist anyway
UPDATE financial_records
SET currency = COALESCE(
  currency,
  (SELECT primary_currency FROM user_settings WHERE user_settings.user_id = financial_records.user_id),
  'USD'
)
WHERE currency IS NULL;

-- STEP 2: Make columns NOT NULL
-- ============================================================================

-- Make jobs.currency NOT NULL
ALTER TABLE jobs
ALTER COLUMN currency SET NOT NULL;

-- Make income_records.currency NOT NULL (should already be, but ensure)
ALTER TABLE income_records
ALTER COLUMN currency SET NOT NULL;

-- STEP 3: Add check constraints to ensure valid ISO 4217 currency codes
-- ============================================================================

-- Drop existing constraints if they exist
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_currency_check;
ALTER TABLE income_records DROP CONSTRAINT IF EXISTS income_records_currency_check;
ALTER TABLE financial_records DROP CONSTRAINT IF EXISTS financial_records_currency_check;

-- Add constraints (3-letter uppercase codes)
ALTER TABLE jobs
ADD CONSTRAINT jobs_currency_check
CHECK (currency ~ '^[A-Z]{3}$' AND length(currency) = 3);

ALTER TABLE income_records
ADD CONSTRAINT income_records_currency_check
CHECK (currency ~ '^[A-Z]{3}$' AND length(currency) = 3);

ALTER TABLE financial_records
ADD CONSTRAINT financial_records_currency_check
CHECK (currency ~ '^[A-Z]{3}$' AND length(currency) = 3);

-- STEP 4: Update default values to use user's primary currency
-- ============================================================================

-- Note: We keep 'USD' as the default in the schema because we can't reference
-- another table in DEFAULT clause. The application and triggers will handle
-- using the user's primary_currency.

-- Ensure defaults are set
ALTER TABLE jobs
ALTER COLUMN currency SET DEFAULT 'USD';

ALTER TABLE income_records
ALTER COLUMN currency SET DEFAULT 'USD';

ALTER TABLE financial_records
ALTER COLUMN currency SET DEFAULT 'USD';

-- STEP 5: Ensure user_settings.primary_currency is NOT NULL
-- ============================================================================

-- Backfill user_settings.primary_currency if NULL
UPDATE user_settings
SET primary_currency = 'USD'
WHERE primary_currency IS NULL;

-- Make it NOT NULL
ALTER TABLE user_settings
ALTER COLUMN primary_currency SET NOT NULL;

-- Set default
ALTER TABLE user_settings
ALTER COLUMN primary_currency SET DEFAULT 'USD';

-- STEP 6: Verify data integrity
-- ============================================================================

-- Check for any remaining NULL currencies (should be 0)
DO $$
DECLARE
  null_jobs_count INTEGER;
  null_income_count INTEGER;
  null_financial_count INTEGER;
  null_settings_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_jobs_count FROM jobs WHERE currency IS NULL;
  SELECT COUNT(*) INTO null_income_count FROM income_records WHERE currency IS NULL;
  SELECT COUNT(*) INTO null_financial_count FROM financial_records WHERE currency IS NULL;
  SELECT COUNT(*) INTO null_settings_count FROM user_settings WHERE primary_currency IS NULL;

  IF null_jobs_count > 0 THEN
    RAISE EXCEPTION 'Found % jobs with NULL currency', null_jobs_count;
  END IF;

  IF null_income_count > 0 THEN
    RAISE EXCEPTION 'Found % income_records with NULL currency', null_income_count;
  END IF;

  IF null_financial_count > 0 THEN
    RAISE EXCEPTION 'Found % financial_records with NULL currency', null_financial_count;
  END IF;

  IF null_settings_count > 0 THEN
    RAISE EXCEPTION 'Found % user_settings with NULL primary_currency', null_settings_count;
  END IF;

  RAISE NOTICE 'Migration successful: All currency fields are properly set';
  RAISE NOTICE 'Jobs with currency: %', (SELECT COUNT(*) FROM jobs);
  RAISE NOTICE 'Income records with currency: %', (SELECT COUNT(*) FROM income_records);
  RAISE NOTICE 'Financial records with currency: %', (SELECT COUNT(*) FROM financial_records);
  RAISE NOTICE 'User settings with primary_currency: %', (SELECT COUNT(*) FROM user_settings);
END $$;
