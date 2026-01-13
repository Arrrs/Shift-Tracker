-- ============================================================================
-- Diagnostic Query: Find Duplicate or Orphaned Income Records
-- ============================================================================

-- This query helps identify problematic income records

-- 1. Check for duplicate income records for the same time_entry_id
SELECT
  'DUPLICATES' as issue_type,
  time_entry_id,
  COUNT(*) as record_count,
  STRING_AGG(id::text, ', ') as income_record_ids,
  STRING_AGG(amount::text || ' ' || currency, ', ') as amounts
FROM income_records
WHERE time_entry_id IS NOT NULL
GROUP BY time_entry_id
HAVING COUNT(*) > 1
ORDER BY record_count DESC;

-- 2. Check for income records where time_entry status is NOT completed
SELECT
  'ORPHANED' as issue_type,
  ir.id as income_record_id,
  ir.time_entry_id,
  ir.amount,
  ir.currency,
  ir.source_type,
  ir.date,
  te.status as time_entry_status,
  te.entry_type,
  te.job_id
FROM income_records ir
JOIN time_entries te ON ir.time_entry_id = te.id
WHERE te.status != 'completed'
ORDER BY ir.date DESC;

-- 3. Check for income records with NULL time_entry_id (manual entries or legacy data)
SELECT
  'NULL_TIME_ENTRY' as issue_type,
  id as income_record_id,
  amount,
  currency,
  source_type,
  date,
  is_manual
FROM income_records
WHERE time_entry_id IS NULL
ORDER BY date DESC
LIMIT 20;

-- 4. Summary counts
SELECT
  'SUMMARY' as report,
  COUNT(*) FILTER (WHERE time_entry_id IS NOT NULL) as income_with_time_entry,
  COUNT(*) FILTER (WHERE time_entry_id IS NULL) as income_manual,
  COUNT(DISTINCT time_entry_id) as unique_time_entries_with_income,
  COUNT(*) as total_income_records
FROM income_records;

-- 5. Check for today's income records specifically (adjust date as needed)
-- Replace 'YYYY-MM-DD' with the date you're testing
SELECT
  'TODAY_RECORDS' as report,
  ir.id,
  ir.time_entry_id,
  ir.amount,
  ir.currency,
  ir.source_type,
  te.status as time_entry_status,
  te.entry_type,
  te.custom_currency,
  j.currency as job_currency,
  j.name as job_name
FROM income_records ir
LEFT JOIN time_entries te ON ir.time_entry_id = te.id
LEFT JOIN jobs j ON ir.job_id = j.id
WHERE ir.date = '2026-01-03'  -- Replace with the date from your screenshot
ORDER BY ir.created_at DESC;
