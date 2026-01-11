# 📋 Manual Testing Checklist

**Branch**: `refactor/modernize-architecture`
**Last Updated**: 2026-01-10
**Phase**: 6 - Testing & Polish

## How to Use This Checklist

- [ ] means not tested yet
- [x] means tested and working
- [!] means tested and found a bug (note the bug below)

**After each test**, mark it with [x] if it works or [!] if you found a bug.

---

## 🏢 Jobs Management

### Create Job
- [x] Create hourly rate job ($25/hour)
- [x] Create daily rate job ($200/day)
- [x] Create monthly salary job ($5000/month)
- [x] Create job with all optional fields (description, PTO days, sick days)
- [x] Try creating job with empty name (should show error)
- [x] Try creating job with negative rate (should show error)
- [x] Create job with different currency (EUR, GBP, JPY)

### Edit Job
- [x] Edit job name
- [x] Change pay type (hourly → daily)
- [x] Update hourly/daily rates
- [x] Mark job as inactive
- [x] Edit job color
- [x] Save with valid changes (should update immediately in list)

### Delete Job
- [x] Delete job that has NO time entries
- [x] Try to delete job that HAS time entries (should show warning)
- [x] Delete with confirmation

---

## ⏰ Time Entries - Work Shifts

### Create Work Shift - With Job
- [x] Create 9-5 shift with hourly rate job
- [x] Create shift with daily rate job
- [x] Create shift with custom start/end times (e.g., 7:30 AM - 4:15 PM)
- [x] Create overnight shift (23:00 - 07:00)
- [ ] Entry appears immediately in calendar after creation

### Create Work Shift - Without Job
- [ ] Create shift with "None" selected for job
- [ ] Verify it saves successfully
- [ ] Entry appears in calendar

### Create Work Shift - With Template
- [ ] Select a job that has templates
- [ ] Apply template (times should auto-fill)
- [ ] Verify template times are in HH:MM format (not HH:MM:SS)
- [ ] Save and verify entry appears

### Pay Customization
- [ ] Create shift with holiday multiplier (1.5x, 2x)
- [ ] Create shift with custom hourly rate (override job rate)
- [ ] Create shift with custom daily rate
- [ ] Create shift with fixed amount
- [ ] Verify income calculation shows correctly
- [ ] Try submitting with empty custom rate (should use default or show error)

### Edit Work Shift
- [ ] Edit existing shift times
- [ ] Change job
- [ ] Update pay customization
- [ ] Mark as completed/planned/cancelled
- [ ] Changes appear immediately in calendar

### Delete Work Shift
- [ ] Delete shift
- [ ] Confirm it's removed from calendar immediately

---

## 🏖️ Time Entries - Day Off

### Create Day Off
- [ ] Create PTO day (full day)
- [ ] Create sick day (full day)
- [ ] Create vacation day (full day)
- [ ] Create personal day (full day)
- [ ] Create half-day PTO (custom hours)
- [ ] Day off appears in calendar with correct type

### Edit Day Off
- [ ] Change day off type (PTO → Sick)
- [ ] Change hours
- [ ] Update notes
- [ ] Changes reflect immediately

### Delete Day Off
- [ ] Delete day off entry
- [ ] Verify removed from calendar

---

## 💰 Financial Records

### Create Income Record
- [ ] Create income with category
- [ ] Create income without category
- [ ] Create income with job linked
- [ ] Create income with custom amount
- [ ] Create income with different currency
- [ ] **IMPORTANT**: Verify record appears on CORRECT date (not previous day)
- [ ] Record appears immediately after creation (no page refresh needed)

### Create Expense Record
- [ ] Create expense with category
- [ ] Create expense without category
- [ ] Create expense with description
- [ ] Create expense with notes
- [ ] Record appears immediately

### Edit Financial Record
- [ ] Edit amount
- [ ] Change category
- [ ] Update description
- [ ] Change status (completed/planned/cancelled)
- [ ] Link to different job
- [ ] Changes appear immediately

### Delete Financial Record
- [ ] Delete record
- [ ] Confirm removed from list immediately

---

## 🏷️ Categories

### Create Category
- [ ] Create income category with emoji icon
- [ ] Create expense category
- [ ] Set default amount
- [ ] Set default currency
- [ ] Set default description
- [ ] Category appears in list immediately

### Edit Category
- [ ] Change name
- [ ] Update icon
- [ ] Change color
- [ ] Update defaults
- [ ] Archive category
- [ ] Changes reflect immediately in dialogs

### Delete Category
- [ ] Delete unused category
- [ ] Try deleting category used in records (should handle gracefully)

---

## 📅 Calendar & Dashboard

### Calendar Navigation
- [ ] Navigate to next month (data should load quickly/instantly)
- [ ] Navigate to previous month
- [ ] Go to today
- [ ] Verify all entries display on correct dates

### Day View (Drawer)
- [ ] Click on a day
- [ ] Verify all time entries for that day show
- [ ] Verify all financial records for that day show
- [ ] Click "Add Entry" from drawer
- [ ] Click "Add Financial Record" from drawer

### Calendar Stats
- [ ] Verify total hours calculation is correct
- [ ] Verify income calculation is correct
- [ ] Check if stats update when entries change
- [ ] Multi-currency: Check if different currencies show correctly

### Dashboard
- [ ] View current month summary
- [ ] Check 3-month income chart
- [ ] Verify statistics are accurate
- [ ] Check financial breakdown by category

---

## 🎨 UI/UX Testing

### Responsive Design
- [ ] Test on mobile (< 768px width)
  - [ ] Dialogs become full-screen drawers
  - [ ] Calendar is readable
  - [ ] All buttons are tappable
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (> 1024px)

### Dialog Behavior
- [ ] Dialogs open smoothly (< 200ms)
- [ ] ESC key closes dialog
- [ ] Click outside closes dialog
- [ ] Back button closes dialog (mobile)
- [ ] Form resets when dialog closes
- [ ] Validation errors show inline

### Loading States
- [ ] First page load shows loading state
- [ ] Dialog data loads instantly (cached)
- [ ] Month navigation is instant or very fast

### Error States
- [ ] Disconnect internet, try creating entry (should show error)
- [ ] Submit invalid form (should show field-specific errors)
- [ ] Try invalid time format (should catch client-side)

---

## 🔍 Edge Cases & Validation

### Time Validation
- [ ] Try invalid time format (should prevent submission)
- [ ] Create overnight shift (end time before start time)
- [ ] Try creating shift with end time = start time
- [ ] Verify times always display in HH:MM format (not HH:MM:SS)

### Date Validation
- [ ] Create entry for future date
- [ ] Create entry for past date
- [ ] Create entry for today
- [ ] Verify timezone doesn't shift dates (e.g., in GMT+3)

### Amount Validation
- [ ] Try negative amount (should prevent)
- [ ] Try zero amount (should handle appropriately)
- [ ] Try very large amount (e.g., 9999999)
- [ ] Try decimal amounts (e.g., 123.45)
- [ ] Verify currency calculations are precise (no 0.300000004)

### Empty/Invalid Inputs
- [ ] Submit form with all required fields empty
- [ ] Submit with only some required fields
- [ ] Enter special characters in text fields
- [ ] Enter very long text in description (200+ chars)
- [ ] Enter very long notes (1000+ chars)

---

## 🌍 Multi-Currency Testing

### Different Currencies
- [ ] Create job in USD
- [ ] Create job in EUR
- [ ] Create job in GBP
- [ ] Create job in JPY (no decimals)
- [ ] Create financial record in each currency
- [ ] Verify currency symbols display correctly ($, €, £, ¥)
- [ ] Verify decimal places (USD=2, JPY=0)
- [ ] Verify thousands separators

---

## ⚡ Performance Testing

### Initial Load
- [ ] Open app in incognito (fresh load)
- [ ] Note: First Contentful Paint time
- [ ] Check if < 2 seconds

### Navigation Speed
- [ ] Calendar month change (should be < 100ms)
- [ ] Dialog open (should be instant from cache)
- [ ] Page transitions

### Network Tab
- [ ] Open DevTools → Network
- [ ] Navigate calendar: should see API calls
- [ ] Open same dialog twice: second time should be cached (no new request)
- [ ] Check bundle size (should be < 300KB)

---

## 🐛 Known Issues from Phase 5.5

**These should all be FIXED now. Verify they work:**

- [x] Infinite re-render loops in dialogs
- [x] Records not appearing after creation
- [x] UUID validation errors with null values
- [x] NaN validation errors
- [x] Wrong date due to timezone conversion
- [x] Time format errors (HH:MM:SS vs HH:MM)

---

## 📝 Bugs Found During Testing

**List any new bugs you find here:**

### Bug 1:
- **What**:
- **Steps to reproduce**:
- **Expected**:
- **Actual**:
- **Priority**: High/Medium/Low

### Bug 2:
- **What**:
- **Steps to reproduce**:
- **Expected**:
- **Actual**:
- **Priority**: High/Medium/Low

---

## ✅ Testing Summary

**Total Test Cases**: ~100+
**Completed**: 0
**Passed**: 0
**Failed**: 0
**Bugs Found**: 0

**Status**: Not Started

---

## 📊 Next Steps After Testing

1. Fix any bugs found during manual testing
2. Set up automated tests (Vitest + React Testing Library)
3. Run accessibility audit
4. Run performance audit (Lighthouse)
5. Clean up console.logs
6. Prepare for merge to main
