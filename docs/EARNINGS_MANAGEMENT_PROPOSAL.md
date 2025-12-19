# Smart Earnings Management - Architecture Proposal

## Problem Analysis

Current issues:
1. User can't easily override earnings for special cases (bonuses, corrections)
2. Unclear when earnings recalculate vs stay fixed
3. No way to distinguish between auto-calculated and manually-set amounts

## Proposed Solution: Three-State Earnings System

### Database Changes

Add one new column to track manual overrides:

```sql
ALTER TABLE shifts ADD COLUMN earnings_manual_override BOOLEAN DEFAULT false;

COMMENT ON COLUMN shifts.earnings_manual_override IS
  'True if actual_earnings was manually set by user and should not be recalculated automatically';
```

### The Three States

#### State 1: Auto-Calculated (Default)
```
earnings_manual_override = false
actual_earnings = calculated value
```
**Behavior:**
- Recalculates when hours, rates, or job changes
- Most shifts use this mode
- Preserves historical accuracy via snapshot

#### State 2: Manually Overridden
```
earnings_manual_override = true
actual_earnings = user's custom value
```
**Behavior:**
- NEVER recalculates automatically
- User explicitly set this amount
- Perfect for: bonuses, flat payments, corrections

#### State 3: No Earnings (Time Tracking Only)
```
earnings_manual_override = false (or true, doesn't matter)
actual_earnings = NULL
```
**Behavior:**
- Fixed income jobs tracking time only
- No per-shift earnings calculation
- Salary recorded separately via financial_records

## User Experience

### When Creating a Shift

```
┌─────────────────────────────────────┐
│ Hours: [8.0]                        │
│                                      │
│ Calculated Earnings: $120           │
│ (8h × $15/hr)                       │
│                                      │
│ [ ] Custom earnings amount          │
│     └─ [$____] (when checked)       │
│                                      │
│ [Save Shift]                        │
└─────────────────────────────────────┘
```

**If unchecked:** System calculates $120, stores it
**If checked:** User enters $150, system stores $150 + sets override flag

### When Editing Hours

**Scenario A - Auto-calculated shift:**
```
User changes 8h → 10h
System: "Recalculating earnings: $120 → $150"
Result: actual_earnings updated to $150
```

**Scenario B - Manually overridden shift:**
```
User changes 8h → 10h
System: "Earnings remain $150 (custom amount)"
Result: actual_earnings stays $150, hours update to 10h
```

**Option:** Show warning/button to recalculate:
```
⚠️ This shift has custom earnings ($150)
   Hours changed: 8h → 10h

   [Keep Custom Amount] [Recalculate]
```

### Visual Indicators

Show users which shifts have custom earnings:

```
┌────────────────────────────────────┐
│ Monday, Dec 9                      │
│ 8:00 AM - 4:00 PM (8h)            │
│ Regular Shift                      │
│                                     │
│ Earnings: $150 ✏️                  │  ← Pencil icon = manually set
└────────────────────────────────────┘
```

## Code Changes

### 1. Update Migration

```sql
-- Add override flag
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS earnings_manual_override BOOLEAN DEFAULT false;

-- Backfill: All existing shifts are auto-calculated (false)
UPDATE shifts SET earnings_manual_override = false WHERE earnings_manual_override IS NULL;

-- Fixed income shifts could be marked as manual (or left as false with NULL earnings)
UPDATE shifts
SET earnings_manual_override = true
WHERE actual_earnings IS NULL
  AND job_id IN (
    SELECT id FROM jobs WHERE show_in_fixed_income = true
  );
```

### 2. Update createShift() Logic

```typescript
export async function createShift(data: Omit<ShiftInsert, 'user_id'>) {
  // ... existing code ...

  // Check if user provided manual earnings
  const isManualOverride = data.actual_earnings !== undefined;

  let actual_earnings = data.actual_earnings;
  let earnings_currency = data.earnings_currency;
  let earnings_manual_override = isManualOverride;

  // Only auto-calculate if NOT manually provided
  if (!isManualOverride && data.job_id) {
    // ... fetch job and calculate earnings ...
    earnings_manual_override = false;
  }

  const { data: shift, error } = await supabase
    .from('shifts')
    .insert({
      ...data,
      user_id: user.id,
      status,
      actual_earnings,
      earnings_currency,
      earnings_manual_override,
    })
    .select()
    .single();

  // ... rest of code ...
}
```

### 3. Update updateShift() Logic

```typescript
export async function updateShift(shiftId: string, data: Partial<Omit<ShiftInsert, 'user_id'>>) {
  // ... existing code ...

  // Fetch current shift to check override status
  const { data: currentShift } = await supabase
    .from('shifts')
    .select('*, jobs(...)')
    .eq('id', shiftId)
    .single();

  // User is providing manual earnings?
  const isProvidingManualEarnings = data.actual_earnings !== undefined;

  // Should we recalculate?
  const shouldRecalculate =
    !isProvidingManualEarnings &&           // User didn't provide manual amount
    !currentShift.earnings_manual_override && // Not previously overridden
    (data.actual_hours !== undefined ||     // AND something changed
     data.custom_hourly_rate !== undefined ||
     // ... other relevant fields ...
    );

  if (shouldRecalculate) {
    // Auto-recalculate
    actual_earnings = calculateShiftEarnings(mergedShift, job);
    earnings_manual_override = false;
  } else if (isProvidingManualEarnings) {
    // User is manually setting earnings
    actual_earnings = data.actual_earnings;
    earnings_manual_override = true;
  }
  // else: Keep existing earnings (it was manually set)

  // ... rest of update logic ...
}
```

### 4. Update UI - Edit Shift Dialog

```typescript
// Add state for custom earnings
const [useCustomEarnings, setUseCustomEarnings] = useState(
  shift?.earnings_manual_override || false
);
const [customEarnings, setCustomEarnings] = useState(
  shift?.actual_earnings?.toString() || ''
);

// Calculate what earnings WOULD be (for display)
const calculatedEarnings = useMemo(() => {
  if (!shift?.jobs) return 0;
  return calculateShiftEarnings(
    {
      actual_hours: actualHours,
      custom_hourly_rate: customHourlyRate,
      is_holiday: isHoliday,
      // ... other fields ...
    },
    shift.jobs
  );
}, [actualHours, customHourlyRate, isHoliday, /* ... */]);

return (
  <form>
    {/* Hours input */}
    <Input value={actualHours} onChange={...} />

    {/* Show calculated earnings */}
    {!useCustomEarnings && (
      <div className="text-sm text-muted-foreground">
        Calculated earnings: {formatCurrency(calculatedEarnings)}
      </div>
    )}

    {/* Custom earnings toggle */}
    <div className="flex items-center space-x-2">
      <Checkbox
        id="custom-earnings"
        checked={useCustomEarnings}
        onCheckedChange={(checked) => {
          setUseCustomEarnings(!!checked);
          if (checked) {
            // Initialize with calculated value
            setCustomEarnings(calculatedEarnings.toString());
          }
        }}
      />
      <Label htmlFor="custom-earnings">
        Custom earnings amount
      </Label>
    </div>

    {/* Custom earnings input (shown when checked) */}
    {useCustomEarnings && (
      <div className="space-y-2 pl-6 border-l-2 border-yellow-500">
        <Label htmlFor="custom-amount">Earnings Amount</Label>
        <Input
          id="custom-amount"
          type="number"
          step="0.01"
          value={customEarnings}
          onChange={(e) => setCustomEarnings(e.target.value)}
          placeholder="Enter custom amount"
        />
        <p className="text-xs text-muted-foreground">
          ⚠️ Manual amount will not recalculate when hours change
        </p>
      </div>
    )}

    {/* Warning when editing overridden shift */}
    {shift?.earnings_manual_override && !useCustomEarnings && (
      <Alert>
        <AlertDescription>
          This shift has custom earnings. Unchecking will recalculate
          based on hours ({formatCurrency(calculatedEarnings)}).
        </AlertDescription>
      </Alert>
    )}
  </form>
);
```

## Benefits

✅ **Clear Intent** - System knows when to recalculate vs preserve
✅ **Flexibility** - Users can override any amount for any reason
✅ **Transparency** - Visual indicators show which shifts are custom
✅ **Historical Accuracy** - Snapshots still preserve past data
✅ **Bonuses/Corrections** - Easy to handle special cases
✅ **No Surprises** - Users control when amounts change

## Edge Cases Handled

### Case 1: User sets custom amount, then changes hours
**Behavior:** Earnings stay fixed, show warning with option to recalculate

### Case 2: User changes job's hourly rate
**Behavior:**
- Auto-calculated shifts: Keep their snapshot (historical accuracy)
- Manual overrides: Keep their custom amount
- New shifts: Use new rate

### Case 3: User wants to "undo" custom amount
**Behavior:** Uncheck the box → recalculates based on current hours/rate

### Case 4: Importing/bulk operations
**Behavior:** If `actual_earnings` provided → treat as manual override
           If not provided → auto-calculate

## Migration Path

1. Add `earnings_manual_override` column (defaults to false)
2. Mark fixed-income NULL earnings as "manual" (optional)
3. Update createShift() and updateShift() logic
4. Add UI checkbox to edit shift dialog
5. Add visual indicator (icon) for manually-set earnings
6. Test thoroughly

## Alternative: Simpler Approach

If the above is too complex, we could simplify to just **two states**:

1. **NULL earnings** = time tracking only (fixed income)
2. **Non-NULL earnings** = always recalculate when hours change

Then add a separate "adjustment" field:
- `earnings_adjustment` - added to calculated amount
- Use case: "$120 calculated + $30 bonus = $150 total"
- Preserves base calculation while allowing adjustments

What do you think? Should we go with the three-state system (with override flag) or the simpler two-state with adjustments?
