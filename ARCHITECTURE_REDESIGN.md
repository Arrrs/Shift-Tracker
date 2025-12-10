# Architecture Redesign: Snapshot-Based Earnings System

## Problem Statement

### Current Issues:
1. **Historical Inaccuracy**: Changing a job's hourly_rate retroactively changes all past shift earnings
2. **Salary Confusion**: Monthly salary shown even when no shifts worked that month
3. **No True Records**: We calculate earnings on-the-fly instead of recording what was actually paid
4. **Flexibility Lost**: Can't handle salary changes, bonuses, or variable pay accurately

### Example of the Problem:
```
Timeline:
- Jan 2025: Work 10 shifts at $15/hr = $150 total (but we don't store this)
- Feb 2025: Get a raise to $20/hr, update job rate
- View Jan 2025: Now shows $200! (wrong - it recalculates with new rate)
```

## Proposed Solution: Snapshot Architecture

### Core Changes:

#### 1. Add `actual_earnings` to shifts table
```sql
ALTER TABLE shifts ADD COLUMN actual_earnings DECIMAL(10, 2);
ALTER TABLE shifts ADD COLUMN earnings_currency TEXT DEFAULT 'USD';
```

**When to set:**
- Automatically on shift creation (use current job rate)
- Automatically on shift completion (recalculate with final hours)
- Manually editable (for corrections)
- Preserved forever (never recalculated)

**Benefits:**
- Historical accuracy preserved
- Job rate changes don't affect past
- Can override for bonuses/adjustments
- True financial record

#### 2. Simplify Job Types

**Remove complexity:**
- Keep `pay_type` (hourly, daily, monthly, salary)
- Remove `show_in_fixed_income` flag
- All income tracking via shifts + financial_records

**How it works:**

**A. Hourly/Daily Jobs:**
```
Shift created → actual_earnings = hours × hourly_rate (or daily_rate)
Rate changes later → past shifts unchanged ✓
```

**B. Monthly/Salary Jobs:**
```
Option 1 (Recommended): Track time only, record salary separately
- Create shifts with actual_earnings = NULL (just tracking time)
- Create financial_record when salary actually paid
- Link record to job for reporting

Option 2: Prorate salary per shift
- actual_earnings = monthly_rate / expected_shifts
- Snapshot preserved when rate changes
```

#### 3. Financial Records as Primary Source

**Philosophy:**
- Shifts = Time tracking + shift-based pay (hourly/daily)
- Financial Records = Everything else (salary, bonuses, freelance, expenses)

**Workflow for Salary Jobs:**
1. Work shifts → Track hours (actual_earnings = NULL or 0)
2. Get paid → Create financial_record for actual amount
3. Link to job → Can report "time worked vs paid"
4. Salary changes → Just affects future records
5. Job archived → Past records remain accurate

### Implementation Plan

#### Phase 1: Add Earnings Snapshot (CRITICAL)
```sql
-- Migration: Add actual_earnings column
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS actual_earnings DECIMAL(10, 2);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS earnings_currency TEXT DEFAULT 'USD';

-- Backfill existing shifts with calculated earnings
-- (One-time operation to snapshot current values)
UPDATE shifts
SET actual_earnings = (
  CASE
    WHEN jobs.pay_type = 'hourly' THEN
      shifts.actual_hours * COALESCE(shifts.custom_hourly_rate, jobs.hourly_rate)
    WHEN jobs.pay_type = 'daily' THEN
      jobs.daily_rate
    WHEN jobs.pay_type = 'monthly' THEN
      jobs.monthly_rate / 22
    WHEN jobs.pay_type = 'salary' THEN
      jobs.annual_salary / 260
    ELSE 0
  END
),
earnings_currency = jobs.currency
FROM jobs
WHERE shifts.job_id = jobs.id AND shifts.actual_earnings IS NULL;
```

#### Phase 2: Update Application Logic

**A. Shift Creation/Update:**
```typescript
// When creating shift
const actualEarnings = calculateCurrentEarnings(shift, job);
await createShift({
  ...shiftData,
  actual_earnings: actualEarnings, // SNAPSHOT IT!
  earnings_currency: job.currency,
});

// When updating hours (recalculate snapshot)
const newEarnings = calculateCurrentEarnings(updatedShift, job);
await updateShift(shiftId, {
  actual_hours: newHours,
  actual_earnings: newEarnings, // UPDATE SNAPSHOT!
});
```

**B. Display Logic:**
```typescript
// Use stored actual_earnings, NEVER recalculate
const totalEarnings = shifts.reduce((sum, shift) =>
  sum + (shift.actual_earnings || 0), 0
);

// NO MORE: calculateShiftEarnings(shift, job) for display!
// YES: shift.actual_earnings (already stored)
```

**C. Salary Jobs:**
```typescript
// Option 1: Time tracking only (RECOMMENDED)
await createShift({
  job_id: salaryJob.id,
  actual_hours: 8,
  actual_earnings: null, // or 0 - just tracking time
});

// When salary paid
await createFinancialRecord({
  type: 'income',
  amount: 4500,
  date: '2025-01-15', // actual payment date
  description: 'January salary',
  job_id: salaryJob.id,
  category_id: salaryCategory.id,
});
```

#### Phase 3: UI Updates

**A. Stats Cards:**
```typescript
// Shift Income Card
const shiftIncome = shifts
  .filter(s => s.actual_earnings !== null && s.actual_earnings > 0)
  .reduce((sum, s) => sum + s.actual_earnings, 0);

// Remove "Fixed Income" card entirely
// Use "Other Income" for all financial_records including salary
```

**B. Day Drawer:**
```typescript
// Show stored earnings
<p className="text-lg font-bold">
  {getCurrencySymbol(shift.earnings_currency)}
  {formatCurrency(shift.actual_earnings)}
</p>

// For salary jobs with null earnings
{shift.actual_earnings === null ? (
  <div className="text-sm text-muted-foreground">
    Time tracking only
  </div>
) : (
  <p>{formatCurrency(shift.actual_earnings)}</p>
)}
```

**C. Edit Shift Dialog:**
```typescript
// Add option to override earnings
<Checkbox
  checked={overrideEarnings}
  onCheckedChange={setOverrideEarnings}
>
  Custom earnings amount
</Checkbox>

{overrideEarnings && (
  <Input
    type="number"
    value={customEarnings}
    label="Actual earnings"
    hint="Override calculated amount"
  />
)}
```

### Benefits of This Architecture

✅ **Historical Accuracy**: Past earnings never change
✅ **Flexibility**: Can adjust individual shift earnings
✅ **Salary Reality**: Record when actually paid, not auto-calculated
✅ **True Records**: Database stores what you actually earned
✅ **Rate Changes**: Update job rates without affecting history
✅ **Bonuses/Adjustments**: Easy to handle via financial_records
✅ **Archived Jobs**: History preserved correctly
✅ **Multi-Currency**: Each shift stores its currency
✅ **Auditable**: Can see exactly what was earned when

### Migration Path

1. **Add columns** (non-breaking)
2. **Backfill existing shifts** (one-time calculation)
3. **Update creation logic** (snapshot on create)
4. **Update display logic** (use snapshot, not calculate)
5. **Update edit logic** (recalculate snapshot when needed)
6. **Remove Fixed Income card**
7. **Test thoroughly**

### Recommended Card Structure

```
Desktop Sidebar:
┌──────────────────────┐
│ 💼 Shift Income      │  ← From shifts.actual_earnings
│ $2,450        [▼]    │
└──────────────────────┘

┌──────────────────────┐
│ 💰 Other Income      │  ← From financial_records (includes salary!)
│ $4,750        [▼]    │
└──────────────────────┘

┌──────────────────────┐
│ 💸 Expenses          │  ← From financial_records
│ $120          [▼]    │
└──────────────────────┘

┌──────────────────────┐
│ 💵 Net Income        │
│ $7,080               │
└──────────────────────┘
```

### Example User Workflows

**Scenario 1: Hourly Worker**
```
1. Create shift: 8h × $15/hr = $120 (stored in actual_earnings)
2. Rate increases to $20/hr next month
3. View past month: Still shows $120 ✓
4. New shifts: Calculate at $20/hr
```

**Scenario 2: Salary Worker**
```
1. Work Mon-Fri: Create 5 shifts, actual_earnings = null
2. Get paid Jan 15: Create financial_record $4500
3. View stats: Shift Income = $0, Other Income = $4500
4. Can see: "Worked 40h this month, earned $4500"
```

**Scenario 3: Bonus Payment**
```
1. Complete project shift
2. Override actual_earnings to include bonus
   OR
3. Create separate financial_record for bonus
```

## Decision: Which approach?

**RECOMMENDED: Snapshot + Financial Records**

- Simple mental model
- Matches real-world accounting
- Flexible for all scenarios
- Historical accuracy guaranteed
- Easy to audit and report

## Next Steps

Should I implement this architecture? It will:
1. Add `actual_earnings` column to shifts
2. Backfill existing data with current calculations
3. Update all earnings logic to use snapshots
4. Remove "Fixed Income" card
5. Salary = time tracking + financial records

This is the right foundation for a professional financial tracking app.
