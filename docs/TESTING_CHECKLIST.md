# Testing Checklist - New Implementation

**Test Date**: _____________
**Tester**: _____________
**Environment**: Local Development

---

## 🔧 Pre-Testing Setup

- [ ] Run the migration: `npx supabase db reset` (or apply migration manually)
- [ ] Verify database types are up to date: `npx supabase gen types typescript --local > lib/database.types.ts`
- [ ] Clear browser cache and localStorage
- [ ] Start development server: `npm run dev`
- [ ] Open browser DevTools Console (watch for errors)

---

## 📊 Test Section 1: Database & Migration

### Test 1.1: Migration Execution
- [ ] Migration runs without errors
- [ ] All tables exist: `shifts`, `jobs`, `time_off_records`, `shift_templates`
- [ ] New columns exist in `shifts`: `scheduled_hours`, `variance_hours`, `is_overnight`
- [ ] New columns exist in `jobs`: `pto_days_per_year`, `sick_days_per_year`, `personal_days_per_year`, `currency_symbol`
- [ ] `job_id` is nullable in `shifts` table

**Notes:**
```
Run in Supabase SQL editor:
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'shifts';
```

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

## 🎨 Test Section 2: Add Shift Dialog

### Test 2.1: Basic Shift Creation (With Job)
1. [ ] Click "Add Shift" button
2. [ ] Select a job from dropdown
3. [ ] Select today's date
4. [ ] Enter start time: `09:00`
5. [ ] Enter end time: `17:00`
6. [ ] Keep "Worked exactly as scheduled" checked
7. [ ] Click "Create Shift"

**Expected Results**:
- [ ] Scheduled duration shows: `8h`
- [ ] Form submits successfully
- [ ] Toast notification: "Shift created"
- [ ] Shift appears on calendar
- [ ] Shift shows on selected date

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 2.2: Create Shift Without Job (Personal Time)
1. [ ] Click "Add Shift"
2. [ ] Select "No Job (Personal Time)" from dropdown
3. [ ] Select a date
4. [ ] Enter times: `10:00` - `12:00`
5. [ ] Submit

**Expected Results**:
- [ ] Form accepts null job
- [ ] Shift saves successfully
- [ ] Calendar shows gray dot for this shift
- [ ] Shift displays as "Personal Time" when clicked

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 2.3: Overnight Shift Detection
1. [ ] Click "Add Shift"
2. [ ] Select a job
3. [ ] Enter start time: `22:00`
4. [ ] Enter end time: `06:00` (next day)

**Expected Results**:
- [ ] "(overnight)" label appears next to scheduled duration
- [ ] Scheduled duration shows: `8h` (calculated correctly)
- [ ] `is_overnight` flag is true when saved

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 2.4: Different Actual Hours (Overtime)
1. [ ] Create shift: `09:00` - `17:00` (8h scheduled)
2. [ ] Uncheck "Worked exactly as scheduled"
3. [ ] Enter actual hours: `9.5`

**Expected Results**:
- [ ] Actual hours input appears when unchecked
- [ ] Variance shows: `+1.5h (overtime)` in green
- [ ] Shift saves with correct `actual_hours` and `scheduled_hours`

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 2.5: Different Actual Hours (Undertime/Lunch Break)
1. [ ] Create shift: `09:00` - `17:00` (8h scheduled)
2. [ ] Uncheck "Worked exactly as scheduled"
3. [ ] Enter actual hours: `7.5` (30min unpaid lunch)

**Expected Results**:
- [ ] Variance shows: `-0.5h (undertime)` in orange
- [ ] Shift saves correctly

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 2.6: Template Application (If Templates Exist)
1. [ ] Click "Add Shift"
2. [ ] Select a job that has templates
3. [ ] Switch to "Use Template" tab
4. [ ] Click on a template

**Expected Results**:
- [ ] Start/end times populate from template
- [ ] Scheduled hours calculate correctly
- [ ] Expected hours populate
- [ ] Template format (TIME string) works with new TIMESTAMPTZ schema

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 2.7: Past Date Auto-Status
1. [ ] Create shift with date in the past (e.g., yesterday)
2. [ ] Complete the form and submit

**Expected Results**:
- [ ] Shift automatically gets `status = 'completed'`
- [ ] Verify in database or by editing the shift

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

## ✏️ Test Section 3: Edit Shift Dialog

### Test 3.1: Edit Existing Shift
1. [ ] Click on any existing shift (calendar, list view, or day drawer)
2. [ ] Edit dialog opens

**Expected Results**:
- [ ] All fields pre-populate correctly
- [ ] Times display as HH:MM format (not ISO timestamps)
- [ ] Job selection shows current job or "No Job (Personal Time)"
- [ ] Status selector shows current status
- [ ] Scheduled hours display correctly
- [ ] "Same as scheduled" checkbox reflects actual vs scheduled

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 3.2: Change Shift Status
1. [ ] Open edit dialog for a shift
2. [ ] Change status from "Planned" to "Completed"
3. [ ] Save

**Expected Results**:
- [ ] Status updates in database
- [ ] Calendar dot updates visual indicator (green border)
- [ ] Stats update (completed count increases)

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 3.3: Change Job to "No Job"
1. [ ] Edit a shift that has a job assigned
2. [ ] Change job to "No Job (Personal Time)"
3. [ ] Save

**Expected Results**:
- [ ] `job_id` becomes null in database
- [ ] Shift displays as "Personal Time"
- [ ] Gray dot appears on calendar

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 3.4: Delete Shift
1. [ ] Open edit dialog
2. [ ] Click "Delete Shift" button
3. [ ] Confirm deletion

**Expected Results**:
- [ ] Shift removes from database
- [ ] Calendar updates immediately
- [ ] Stats recalculate

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

## 📅 Test Section 4: Calendar Display

### Test 4.1: Month Calendar View - Status Indicators
**Setup**: Create shifts with different statuses on the same day
- 1 planned shift
- 1 completed shift
- 1 in_progress shift
- 1 cancelled shift

**Expected Results**:
- [ ] Planned shift: normal dot (no border)
- [ ] Completed shift: green border on dot
- [ ] In progress shift: yellow/orange border on dot
- [ ] Cancelled shift: faded/low opacity dot
- [ ] All dots show correct job colors
- [ ] Hover tooltip shows job name and status

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 4.2: Month Calendar - Single Shift Day
**Setup**: Day with only one shift

**Expected Results**:
- [ ] Earnings display shows correct amount
- [ ] Status emoji appears next to earnings (📅, ✅, ⏳, or ❌)

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 4.3: Month Calendar - Multiple Shifts Day
**Setup**: Day with 4+ shifts

**Expected Results**:
- [ ] First 3 shifts show as dots
- [ ] "+X" indicator shows for additional shifts
- [ ] Total earnings calculate correctly
- [ ] Clicking day opens drawer with all shifts

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 4.4: Day Shifts Drawer
1. [ ] Click on a day with multiple shifts
2. [ ] Drawer/dialog opens

**Expected Results**:
- [ ] All shifts for the day display
- [ ] Times show in HH:MM format (not ISO)
- [ ] Each shift shows:
  - [ ] Job color or gray for personal time
  - [ ] Job name or "Personal Time"
  - [ ] Status emoji
  - [ ] Start/end times formatted correctly
  - [ ] Hours worked
  - [ ] Hourly rate (if job assigned)
  - [ ] Earnings for that shift
  - [ ] Status label with correct color
  - [ ] Overnight indicator if applicable
- [ ] Total hours and total earnings summarize correctly

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 4.5: List View
1. [ ] Switch to List view

**Expected Results**:
- [ ] All shifts for the month display
- [ ] Sorted by date, then start time
- [ ] Times show in HH:MM format
- [ ] Status indicators show (emojis, colored borders)
- [ ] "Personal Time" displays for null jobs
- [ ] Overnight indicators show
- [ ] Clicking shift opens edit dialog

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

## 📊 Test Section 5: Stats Display

### Test 5.1: Single Currency Stats (Desktop)
**Setup**: All shifts use same currency (e.g., USD)

**Expected Results**:
- [ ] Earnings card shows: `$XXX.XX`
- [ ] Hours card shows actual hours
- [ ] Scheduled hours show below actual
- [ ] Variance shows with color coding (green if over, orange if under)
- [ ] Shift count shows total
- [ ] Breakdown by status (completed, planned, in progress)

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 5.2: Multi-Currency Stats (Desktop)
**Setup**: Create jobs with different currencies (USD, EUR, UAH) and add shifts

**Expected Results**:
- [ ] Earnings card shows breakdown:
  ```
  USD: $XXX.XX
  EUR: €XXX.XX
  UAH: ₴XXX.XX
  ```
- [ ] Each currency on separate line
- [ ] Correct symbols used
- [ ] All other stats aggregate correctly

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 5.3: Mobile Stats Cards
**Setup**: Resize browser to mobile width (<768px) or use mobile device

**Expected Results**:
- [ ] Three compact cards display at top
- [ ] Multi-currency shows in compact format
- [ ] Hours variance shows as "of Xh"
- [ ] Shift count shows "X done" for completed
- [ ] All stats readable on small screen

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 5.4: Stats Update on Change
1. [ ] Note current stats
2. [ ] Add a new shift
3. [ ] Watch stats update

**Expected Results**:
- [ ] Stats update immediately after shift creation
- [ ] No page refresh needed
- [ ] All calculations correct

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

## 🔍 Test Section 6: Edge Cases

### Test 6.1: Midnight Shift
1. [ ] Create shift: `00:00` - `08:00`

**Expected Results**:
- [ ] Calculates as 8 hours
- [ ] Not marked as overnight (since end > start chronologically)
- [ ] Saves and displays correctly

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 6.2: 24-Hour Shift
1. [ ] Create shift: `09:00` - `09:00` next day

**Expected Results**:
- [ ] Should be marked overnight
- [ ] Should calculate as 24 hours (or 0 hours - needs testing)
- [ ] Determine expected behavior

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 6.3: Same Start/End Time
1. [ ] Try to create shift: `09:00` - `09:00`

**Expected Results**:
- [ ] Either prevents submission or treats as overnight 24h
- [ ] Document actual behavior

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 6.4: Very Short Shift
1. [ ] Create shift: `09:00` - `09:30` (0.5 hours)

**Expected Results**:
- [ ] Rounds to 0.5h
- [ ] Saves correctly
- [ ] Displays correctly

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 6.5: Negative Hours Prevention
1. [ ] Create shift with scheduled hours
2. [ ] Try to enter negative actual hours: `-5`

**Expected Results**:
- [ ] Input prevents negative values (min="0")
- [ ] Or shows validation error

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 6.6: Empty/Missing Data
1. [ ] Create shift with minimal data (no job, no notes)
2. [ ] Leave actual hours as 0

**Expected Results**:
- [ ] Shift saves successfully
- [ ] Displays with $0.00 earnings
- [ ] No errors in console

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

## 🌐 Test Section 7: Cross-Browser & Responsive

### Test 7.1: Mobile Drawer vs Desktop Dialog
1. [ ] Test on mobile width (<768px)
2. [ ] Test on desktop width (>768px)

**Expected Results**:
- [ ] Mobile: Drawer slides up from bottom
- [ ] Desktop: Dialog appears centered
- [ ] Both show same content
- [ ] Touch/click interactions work

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 7.2: Time Input Format
1. [ ] Test time inputs on different browsers
2. [ ] Verify format display

**Expected Results**:
- [ ] Chrome/Edge: Native time picker
- [ ] Firefox: Native time picker
- [ ] Safari: Native time picker
- [ ] All save in consistent format

**Result**: ✅ Pass / ❌ Fail
**Browser Tested**: _____________
**Issues Found**:

---

## ⚡ Test Section 8: Performance & Data Integrity

### Test 8.1: Month with Many Shifts
**Setup**: Create 50+ shifts in one month

**Expected Results**:
- [ ] Calendar renders without lag
- [ ] Stats calculate correctly
- [ ] List view scrolls smoothly
- [ ] No console errors

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 8.2: Database Triggers
**Setup**: Create shift and check database directly

1. [ ] Create shift: `09:00` - `17:00`
2. [ ] Check database for the shift

**Expected Results**:
- [ ] `scheduled_hours` auto-calculated by trigger: `8.0`
- [ ] `variance_hours` calculated if actual differs
- [ ] No need to manually set these fields

**SQL to verify**:
```sql
SELECT id, scheduled_hours, actual_hours, variance_hours, is_overnight
FROM shifts
ORDER BY created_at DESC
LIMIT 5;
```

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 8.3: Data Migration (If Existing Data)
**Setup**: If you have existing shifts from before migration

**Expected Results**:
- [ ] Old shifts still display
- [ ] Times converted from TIME to TIMESTAMPTZ correctly
- [ ] No data loss
- [ ] Old shifts backward compatible

**Result**: ✅ Pass / ❌ Fail / ⚠️ N/A (No existing data)
**Issues Found**:

---

## 🐛 Test Section 9: Error Handling

### Test 9.1: Network Error Simulation
1. [ ] Open DevTools → Network tab
2. [ ] Set to "Offline"
3. [ ] Try to create shift

**Expected Results**:
- [ ] Error toast appears
- [ ] User-friendly error message
- [ ] No app crash
- [ ] Form data preserved

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

### Test 9.2: Invalid Time Range
1. [ ] Leave start time empty
2. [ ] Try to submit

**Expected Results**:
- [ ] HTML5 validation prevents submission
- [ ] Error message shown
- [ ] Or custom error toast

**Result**: ✅ Pass / ❌ Fail
**Issues Found**:

---

## 📝 Test Section 10: Console & Logging

### Test 10.1: Console Errors
**Throughout all tests above**:

**Expected Results**:
- [ ] No React errors in console
- [ ] No TypeScript errors in console
- [ ] No Supabase errors (except intentional offline test)
- [ ] No 404s for missing resources

**Result**: ✅ Pass / ❌ Fail
**Errors Found** (list them):

---

## 🎯 Critical Issues Summary

### Blocking Issues (Must Fix Before Next Session)
1.
2.
3.

### Non-Blocking Issues (Can Fix Later)
1.
2.
3.

### Questions/Clarifications Needed
1.
2.
3.

---

## ✅ Overall Test Results

**Total Tests**: 50+
**Passed**: ___
**Failed**: ___
**N/A**: ___

**Ready for Next Development Phase?**: ☐ Yes / ☐ No (fix critical issues first)

---

## 📸 Screenshots (Optional)

Attach screenshots of:
- Multi-currency stats display
- Overnight shift indicator
- Status indicators on calendar
- "Personal Time" shift display
- Any bugs found

---

**Testing Completed On**: _____________
**Time Spent**: _____________
**Next Session Focus**: Based on issues found, prioritize fixes or proceed with remaining tasks
