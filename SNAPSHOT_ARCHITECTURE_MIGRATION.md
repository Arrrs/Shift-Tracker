# Snapshot Architecture Migration - Manual Steps

## ✅ What's Been Done

1. **Migration files created** - All necessary SQL migrations are in `supabase/migrations/`
2. **Code updated** - All application code now uses snapshot earnings instead of calculating dynamically
3. **Display logic updated** - All UI components use `actual_earnings` field

## 🔧 What You Need To Do

### Step 1: Run the earnings snapshot migration on your remote Supabase

Open your Supabase SQL Editor and run this migration:

```sql
-- ============================================================================
-- SNAPSHOT EARNINGS ARCHITECTURE
-- Add actual_earnings columns and backfill existing data
-- ============================================================================

-- Add columns for storing actual earnings at time of shift
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS actual_earnings DECIMAL(10, 2);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS earnings_currency TEXT DEFAULT 'USD';

-- Backfill existing shifts with calculated earnings (ONE-TIME OPERATION)
-- This snapshots the current calculated values before switching to the new system
UPDATE shifts
SET
  actual_earnings = (
    CASE
      -- Hourly jobs: hours × rate (use custom rate if set, otherwise job rate)
      WHEN jobs.pay_type = 'hourly' THEN
        COALESCE(shifts.actual_hours, shifts.scheduled_hours, 0) *
        COALESCE(shifts.custom_hourly_rate, jobs.hourly_rate, 0)

      -- Daily jobs: fixed daily rate
      WHEN jobs.pay_type = 'daily' THEN
        COALESCE(jobs.daily_rate, 0)

      -- Monthly jobs with show_in_fixed_income: set to NULL (time tracking only)
      WHEN jobs.pay_type = 'monthly' AND jobs.show_in_fixed_income = true THEN
        NULL

      -- Monthly jobs without show_in_fixed_income: prorate monthly rate
      WHEN jobs.pay_type = 'monthly' THEN
        COALESCE(jobs.monthly_rate, 0) / 22

      -- Salary jobs with show_in_fixed_income: set to NULL (time tracking only)
      WHEN jobs.pay_type = 'salary' AND jobs.show_in_fixed_income = true THEN
        NULL

      -- Salary jobs without show_in_fixed_income: prorate annual salary
      WHEN jobs.pay_type = 'salary' THEN
        COALESCE(jobs.annual_salary, 0) / 260

      -- Default: 0
      ELSE 0
    END
  ),
  earnings_currency = COALESCE(jobs.currency, 'USD')
FROM jobs
WHERE shifts.job_id = jobs.id AND shifts.actual_earnings IS NULL;

-- Add comments explaining the architecture
COMMENT ON COLUMN shifts.actual_earnings IS 'Snapshot of earnings at time of shift creation/completion. Never recalculated - preserves historical accuracy.';
COMMENT ON COLUMN shifts.earnings_currency IS 'Currency used for actual_earnings. Stored per-shift to handle multi-currency scenarios.';
```

### Step 2: Verify the migration

After running the migration, verify it worked:

```sql
-- Check that earnings were populated
SELECT
  COUNT(*) as total_shifts,
  COUNT(actual_earnings) as shifts_with_earnings,
  COUNT(CASE WHEN actual_earnings IS NULL THEN 1 END) as null_earnings_shifts
FROM shifts;

-- Sample some shifts to see the earnings
SELECT
  date,
  status,
  actual_hours,
  actual_earnings,
  earnings_currency,
  jobs.name as job_name,
  jobs.pay_type
FROM shifts
LEFT JOIN jobs ON shifts.job_id = jobs.id
ORDER BY date DESC
LIMIT 10;
```

## 📋 How It Works Now

### Before (Old System - Dynamic Calculation):
```
User creates shift → Store hours and job_id
User views shift → Calculate earnings using CURRENT job rate ❌
User changes job rate → All past shifts show NEW earnings ❌
```

### After (New System - Snapshot):
```
User creates shift → Calculate earnings using current rate → STORE IT ✅
User views shift → Show STORED earnings ✅
User changes job rate → Past shifts unchanged, only new shifts use new rate ✅
User updates hours → Recalculate and update snapshot ✅
```

## 🎯 Benefits

✅ **Historical Accuracy** - Past earnings never change when rates are updated
✅ **Flexibility** - Can manually override earnings for bonuses/adjustments
✅ **Salary Reality** - Fixed income jobs set earnings to NULL (time tracking only)
✅ **True Records** - Database stores what you actually earned
✅ **Rate Changes** - Update job rates without affecting history
✅ **Multi-Currency** - Each shift stores its own currency
✅ **Auditable** - Can see exactly what was earned when

## 🔄 For Fixed Income Jobs

Monthly and salary jobs with `show_in_fixed_income = true` will have:
- `actual_earnings = NULL` (they're time-tracking only)
- Earnings are recorded separately via `financial_records` when salary is actually paid

## 🚀 Next Steps

After running the migration:
1. Test creating new shifts - they should automatically snapshot earnings
2. Test editing shift hours - earnings should recalculate
3. Test changing a job's hourly rate - past shifts should stay the same
4. Consider removing the "Fixed Income" card (next todo item)

## 📁 Migration Files Location

All migrations are in: `supabase/migrations/20251209140000_add_earnings_snapshot.sql`

This file contains the same SQL above and can be applied via:
- Supabase Dashboard SQL Editor (recommended for remote DB)
- `supabase db push` if you set up remote linking
- Direct PostgreSQL connection
