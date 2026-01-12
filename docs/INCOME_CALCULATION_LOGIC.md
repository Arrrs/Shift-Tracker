# Income Calculation Logic Verification

## Status: ✅ VERIFIED CORRECT

The income calculation logic across the app correctly implements the following status handling:

## Status Handling Rules

| Status | Calculation Method | Display Location |
|--------|-------------------|------------------|
| **Completed** | Actual income from `income_records` table | "Shift Income (Completed)" - Blue card |
| **Planned** | Estimated based on job rates/overrides | "Expected Income (Planned/In Progress)" - Amber card |
| **In Progress** | Estimated based on job rates/overrides | "Expected Income (Planned/In Progress)" - Amber card |
| **Cancelled** | Not counted | N/A |

## Implementation Details

### 1. Database Trigger (Prevents Double Counting)
**File:** `/supabase/migrations/09_fix_trigger_for_job_deletion.sql:24`

```sql
-- Only process completed work shifts
IF NEW.entry_type != 'work_shift' OR NEW.status != 'completed' THEN
  RETURN NEW;
END IF;
```

**Result:** Income records are ONLY created for completed entries. In-progress entries do NOT generate income records.

### 2. Calendar Monthly Totals
**File:** `/app/(authenticated)/calendar/page.tsx:148-214`

**Completed Income (Actual):**
```typescript
// Line 149-153: Only from income_records (completed only)
const shiftIncomeByCurrency: Record<string, number> = {};
incomeRecords.forEach(record => {
  const currency = record.currency || 'USD';
  shiftIncomeByCurrency[currency] = (shiftIncomeByCurrency[currency] || 0) + record.amount;
});
```

**Expected Income (Planned & In Progress):**
```typescript
// Line 156-195: Explicitly filters for planned/in-progress only
const expectedShiftIncomeByCurrency: Record<string, number> = {};
timeEntries.filter(e => e.status === 'planned' || e.status === 'in_progress').forEach(entry => {
  // Calculate estimated income based on job rates
  // ...
});
```

### 3. Day Shifts Drawer
**File:** `/app/(authenticated)/calendar/day-shifts-drawer.tsx:162-240`

**Same Logic:**
- Completed shifts: Income from `incomeRecords` (line 163-166)
- Planned/In Progress: Estimated income (line 172-240)
- Cancelled: Excluded (line 173, 179-180)

### 4. Dashboard
**File:** `/app/(authenticated)/dashboard/page.tsx:61-87`

**Same Logic:**
- Completed shifts: Income from `incomeRecords` (line 69-73)
- Financial records: Only completed ones counted (line 79-87)
- Cancelled: Excluded by status filter

## Why There's No Double Counting

1. **Database trigger** ensures `income_records` ONLY exist for completed entries
2. **Expected income calculation** EXPLICITLY filters to exclude completed entries:
   ```typescript
   timeEntries.filter(e => e.status === 'planned' || e.status === 'in_progress')
   ```
3. These two calculations are **mutually exclusive** - an entry cannot be both completed AND planned/in-progress

## UI Display Separation

The UI clearly separates these two types of income:

**Monthly Stats Card:**
- **"Shift Income (Completed)"** - Blue gradient card
- **"Expected Income (Planned/In Progress)"** - Amber gradient card

**Monthly Details Drawer:**
- **💼 Shift Income (Completed)** - Blue section
- **📅 Expected Income (Planned/In Progress)** - Amber section

## Verification Checklist

- ✅ Database trigger only creates income for completed entries
- ✅ Completed income uses `income_records` table
- ✅ Expected income explicitly filters for planned/in-progress
- ✅ Cancelled entries excluded from all calculations
- ✅ No overlap between completed and expected calculations
- ✅ Calendar page implements correctly
- ✅ Day drawer implements correctly
- ✅ Dashboard implements correctly
- ✅ UI clearly separates actual vs expected income

## Conclusion

The current implementation is **CORRECT** and follows best practices:
- Actual income (completed) comes from database records
- Expected income (planned/in-progress) is estimated client-side
- No double counting occurs
- Cancelled entries are properly excluded
- UI provides clear visual distinction between actual and expected income
