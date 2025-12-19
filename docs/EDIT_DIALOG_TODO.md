# TODO: Sync Edit Dialog with Add Dialog

## Current Status
✅ Commit made: fcdc985 - All changes before edit dialog update
✅ Backup created: edit-time-entry-dialog.tsx.backup
✅ Build passes successfully

## What Needs to be Done

The `edit-time-entry-dialog.tsx` is MISSING the full pay customization UI that exists in `add-time-entry-dialog.tsx`.

### Files to Compare:
- Source: `app/(authenticated)/calendar/add-time-entry-dialog.tsx` (✅ Complete)
- Target: `app/(authenticated)/calendar/edit-time-entry-dialog.tsx` (⚠️ Incomplete)

### Specific Sections to Copy from Add Dialog:

1. **Pay Customization UI** (lines ~487-688 in add dialog)
   ```tsx
   {customizePay && (
     <div className="space-y-4 p-4 border rounded-md bg-muted/30">
       {/* Currency Selection */}
       {/* Pay Type Selection */}
       {/* Custom Rate Inputs */}
       {/* Holiday Multiplier Section */}
       {/* Live Income Preview */}
     </div>
   )}
   ```

2. **Submit Logic Updates** (lines ~292-331 in add dialog)
   - Build `payData` object
   - Handle `pay_override_type` correctly
   - Set `custom_currency`
   - Clear pay fields when customization disabled

### Current State of Edit Dialog:

✅ Has all state variables (lines 47-60)
✅ Has `useEffect` to load existing pay data (lines 71-117)
✅ Has calculation functions (`getMultiplierValue`, `getCurrencySymbolForPreview`, `calculateExpectedIncome`)
❌ **MISSING**: Full pay customization UI section
❌ **NEEDS FIX**: Submit logic doesn't build `payData` correctly

### Quick Fix Instructions:

1. Open both files side-by-side
2. In add dialog, find line ~487: `{customizePay && (`
3. Copy entire pay customization section through line ~688
4. In edit dialog, paste after "Hours Worked" input (around line 520)
5. Update `handleSubmit` function to match add dialog's pay data logic

### Test After Update:
- [ ] Edit existing shift with custom hourly rate
- [ ] Edit shift and add holiday multiplier
- [ ] Edit shift and change currency
- [ ] Edit shift with fixed amount
- [ ] Verify preview shows correct currency symbol
- [ ] Save and check income_records table has correct data

---
**Note**: Edit dialog already has proper state management and loading logic. 
It just needs the UI components from the add dialog!
