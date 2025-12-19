# Jobs System - Comprehensive Test Cases

## Overview
This document contains step-by-step test cases to thoroughly test the jobs archive and delete system functionality.

---

## Test Environment Setup

### Prerequisites
1. Have at least 2-3 jobs created in the system
2. Have at least one job with shift templates added
3. Have at least one job with logged shifts in the calendar
4. Have at least one job with both templates AND logged shifts

---

## Test Suite 1: Basic CRUD Operations

### Test 1.1: Create a New Job
**Steps:**
1. Navigate to the Jobs page
2. Click "Add Job" button
3. Fill in the form:
   - Name: "Test Barista"
   - Hourly Rate: 15.50
   - Currency: USD
   - Color: Choose any color
   - Description: "Morning shift position"
4. Click "Create Job"

**Expected Result:**
- Job appears in the Active tab immediately (no refresh needed)
- Job shows with status badge "Active"
- Template count shows 0
- All entered data is displayed correctly

---

### Test 1.2: Edit Job Details
**Steps:**
1. Find any active job in the list
2. Click "Edit" button
3. Change the hourly rate to a different value
4. Change is_active toggle to FALSE
5. Click "Save"

**Expected Result:**
- Job immediately moves from Active tab to Archived tab (no manual refresh)
- Updated hourly rate is reflected
- Status badge changes to "Archived"
- Archive count in tabs updates automatically

---

### Test 1.3: View Job Details
**Steps:**
1. Click "View" button on any job
2. Review the drawer/dialog that opens

**Expected Result:**
- Job details are displayed correctly
- Shift templates section is visible
- Can add/edit/delete templates from this view
- All job information matches what was entered

---

## Test Suite 2: Archive Functionality

### Test 2.1: Quick Archive Active Job (No Shifts)
**Steps:**
1. Create a new job without any shifts or templates
2. In the Active tab, click "Archive" button on the job
3. Confirm the action if prompted

**Expected Result:**
- Job immediately disappears from Active tab
- Job immediately appears in Archived tab
- Tab counts update: Active count -1, Archived count +1
- No page refresh required

---

### Test 2.2: Archive Job with Templates Only
**Steps:**
1. Create a job and add 2-3 shift templates to it
2. Note the template count in the jobs list
3. Click "Archive" button
4. Confirm the action

**Expected Result:**
- Job moves to Archived tab immediately
- Templates remain intact (visible in archived job details)
- Template count is preserved
- No data loss

---

### Test 2.3: Archive Job with Logged Shifts
**Steps:**
1. Create a job
2. Log at least 2 shifts using this job in the calendar
3. Go to Jobs page and click "Archive" button
4. Confirm the action

**Expected Result:**
- Job moves to Archived tab
- Shift count is visible in the job details
- Historical shift data is preserved
- Shifts in calendar are still visible and linked to this job

---

### Test 2.4: Archive via Edit Dialog
**Steps:**
1. Select any active job
2. Click "Edit" button
3. Toggle "Active" switch to OFF
4. Click "Save"

**Expected Result:**
- Same result as quick archive
- Job moves to Archived tab immediately
- All data preserved

---

## Test Suite 3: Delete Functionality

### Test 3.1: Delete Active Job via Archive Flow (Recommended)
**Steps:**
1. Create a new job (or use existing active job)
2. Click "Delete" button (trash icon)
3. Review the dialog that appears

**Expected Result:**
- Dialog shows "Archive this job instead of deleting?" recommendation
- Green highlighted archive option is visible
- Warning shows if job has logged shifts
- Can see shift count if applicable

**Continue:**
4. Click "Archive" button in dialog

**Expected Result:**
- Job is archived (soft deleted)
- Job moves to Archived tab
- All data preserved

---

### Test 3.2: Permanently Delete Active Job (No Shifts)
**Steps:**
1. Create a new job with NO logged shifts
2. Click "Delete" button
3. In the dialog, scroll past archive recommendation
4. Click "Delete Job" button
5. Confirm the deletion

**Expected Result:**
- Job is permanently deleted from database
- Job disappears from all tabs
- Tab counts update correctly
- No errors occur

---

### Test 3.3: Delete Active Job with Logged Shifts (Keep Shifts)
**Steps:**
1. Create a job and log 3-5 shifts in calendar using this job
2. Note the shift IDs or dates for verification
3. Click "Archive" to archive it first
4. Go to Archived tab
5. Click "Delete" button on the archived job
6. Select radio option: "Keep shifts (Recommended)"
7. Click "Delete Job"

**Expected Result:**
- Job is deleted from jobs list
- Shifts in calendar are preserved but show as "orphaned" (no job linked)
- In database: shifts.job_id is set to NULL
- Historical work data is preserved for reports

---

### Test 3.4: Delete Archived Job with Shifts (Delete Shifts)
**Steps:**
1. Archive a job that has logged shifts
2. In Archived tab, click "Delete" button
3. Select radio option: "Delete all shifts" (red/dangerous option)
4. Click "Delete Job"

**Expected Result:**
- Job is permanently deleted
- All associated shifts are permanently deleted from calendar
- Database: Both job row and shift rows are removed
- Warning was clearly shown before deletion

---

### Test 3.5: Delete Job with Templates
**Steps:**
1. Create a job with 2-3 shift templates
2. Click "Delete" button and proceed with deletion

**Expected Result:**
- Job is deleted
- All shift templates are CASCADE deleted (this is expected behavior)
- Templates are removed from database
- No orphaned templates remain

---

## Test Suite 4: Filter and Tab System

### Test 4.1: Active Tab Filtering
**Steps:**
1. Ensure you have both active and archived jobs
2. Click "Active" tab

**Expected Result:**
- Only jobs with is_active = true are shown
- Count in tab matches number of visible jobs
- No archived jobs appear in the list

---

### Test 4.2: Archived Tab Filtering
**Steps:**
1. Click "Archived" tab

**Expected Result:**
- Only jobs with is_active = false are shown
- Count in tab matches number of visible jobs
- No active jobs appear in the list
- Empty state shows if no archived jobs exist

---

### Test 4.3: All Tab Display
**Steps:**
1. Click "All" tab

**Expected Result:**
- Both active and archived jobs are shown
- Count matches total of active + archived
- Status badge clearly shows Active vs Archived for each job
- Archive button only shows on active jobs

---

### Test 4.4: Tab Count Updates
**Steps:**
1. Note the current counts in all tabs (Active: X, Archived: Y, All: Z)
2. Archive one job
3. Observe tab counts

**Expected Result:**
- Active count decreases by 1
- Archived count increases by 1
- All count remains the same
- Updates happen immediately without page refresh

---

## Test Suite 5: Data Integrity and Edge Cases

### Test 5.1: Archive Then Unarchive
**Steps:**
1. Archive a job (it moves to Archived tab)
2. Click "Edit" on the archived job
3. Toggle "Active" switch to ON
4. Click "Save"

**Expected Result:**
- Job moves back to Active tab immediately
- All data (templates, shift references) intact
- Job is fully functional as active job again

---

### Test 5.2: Multiple Quick Actions
**Steps:**
1. Archive 3 jobs in rapid succession
2. Don't wait for any loading states

**Expected Result:**
- All 3 jobs are archived successfully
- UI updates correctly for all
- No race conditions or duplicate entries
- Tab counts are accurate

---

### Test 5.3: Delete Job Referenced in Calendar
**Steps:**
1. Create a job and log shifts over multiple days
2. Archive the job
3. Delete the job choosing "Keep shifts"
4. Navigate to calendar view

**Expected Result:**
- Shifts still appear in calendar
- Shifts show they have no job associated (orphaned)
- Total hours calculations still work
- No broken references or errors

---

### Test 5.4: Delete Job with Large Number of Shifts
**Steps:**
1. Create a job and log 50+ shifts (or modify database directly)
2. Archive the job
3. Delete choosing "Delete all shifts"

**Expected Result:**
- Operation completes successfully (may take a moment)
- All shifts are deleted
- No database errors or timeouts
- UI updates correctly

---

### Test 5.5: Concurrent User Actions
**Steps:**
1. Open jobs page in two browser tabs
2. In Tab 1: Archive a job
3. In Tab 2: Immediately try to edit the same job

**Expected Result:**
- Tab 2 should handle the stale data gracefully
- Either refreshes to show archived state, or shows error
- No data corruption occurs

---

## Test Suite 6: UI/UX Validation

### Test 6.1: Archive Button Visibility
**Steps:**
1. View Active jobs tab
2. View Archived jobs tab

**Expected Result:**
- Archive button only appears on ACTIVE jobs
- Archive button does NOT appear on archived jobs
- Button placement is consistent across desktop and mobile

---

### Test 6.2: Delete Dialog Warning Messages
**Steps:**
1. Try to delete a job with 0 shifts
2. Try to delete a job with 5 shifts
3. Compare the warning messages

**Expected Result:**
- Job with shifts shows count: "This job has 5 logged shifts"
- Job without shifts doesn't show shift warning
- Warning is prominent and red/destructive styled

---

### Test 6.3: Radio Button Selection
**Steps:**
1. Archive a job with shifts
2. Click Delete on archived job
3. Try selecting both radio options
4. Observe visual feedback

**Expected Result:**
- Only one radio option can be selected at a time
- "Keep shifts" has green/safe styling
- "Delete shifts" has red/destructive styling
- Clear labels explain each option

---

### Test 6.4: Mobile Responsiveness
**Steps:**
1. Test on mobile device or narrow browser window
2. Perform archive operation
3. Perform delete operation
4. Navigate between tabs

**Expected Result:**
- All buttons are easily tappable
- Dialogs are readable and scrollable
- Radio buttons work well on touch
- No horizontal scrolling required

---

### Test 6.5: Loading States
**Steps:**
1. Archive a job and observe
2. Delete a job and observe
3. Edit a job and observe

**Expected Result:**
- Buttons show loading state (disabled, spinner, etc.)
- Can't trigger duplicate actions while loading
- Loading doesn't persist if error occurs
- Clear feedback when action completes

---

## Test Suite 7: Error Handling

### Test 7.1: Network Error During Archive
**Steps:**
1. Open browser DevTools > Network tab
2. Set network to "Offline"
3. Try to archive a job
4. Restore network

**Expected Result:**
- Error message is displayed
- Job remains in current state
- Can retry the operation
- No partial state changes

---

### Test 7.2: Delete Non-Existent Job
**Steps:**
1. Delete a job from database directly (via SQL or Supabase dashboard)
2. On jobs page, try to delete that same job ID

**Expected Result:**
- Error message displayed
- Page refreshes or job is removed from UI
- No crash or unhandled error

---

### Test 7.3: Permission Denied
**Steps:**
1. Attempt to delete a job that belongs to another user (requires database manipulation)

**Expected Result:**
- Error: "Permission denied" or similar
- Job is not deleted
- No data is modified

---

## Test Suite 8: Database Verification

### Test 8.1: Verify Cascade Behavior - Templates
**Steps:**
1. Create job with templates
2. Delete the job
3. Check database: SELECT * FROM shift_templates WHERE job_id = '<deleted_job_id>'

**Expected Result:**
- Templates are deleted (CASCADE works)
- Query returns 0 rows

---

### Test 8.2: Verify SET NULL Behavior - Shifts
**Steps:**
1. Create job, log shifts
2. Archive job, then delete with "Keep shifts"
3. Check database: SELECT job_id FROM shifts WHERE id IN ('<shift_ids>')

**Expected Result:**
- job_id column is NULL
- Shift rows still exist
- Other shift data is intact

---

### Test 8.3: Verify Hard Delete - Shifts
**Steps:**
1. Create job, log shifts
2. Archive job, then delete with "Delete all shifts"
3. Check database: SELECT * FROM shifts WHERE job_id = '<deleted_job_id>'

**Expected Result:**
- Query returns 0 rows
- All shifts deleted
- No orphaned data

---

### Test 8.4: Verify Archive Status
**Steps:**
1. Archive a job
2. Check database: SELECT is_active FROM jobs WHERE id = '<job_id>'

**Expected Result:**
- is_active = false
- Row still exists
- All other columns unchanged

---

## Test Suite 9: Performance Tests

### Test 9.1: Load Time with Many Jobs
**Steps:**
1. Create 50+ jobs (or seed database)
2. Navigate to Jobs page
3. Switch between tabs

**Expected Result:**
- Page loads in reasonable time (< 2 seconds)
- Tab switching is instant
- No lag or freezing

---

### Test 9.2: Filter Large Dataset
**Steps:**
1. With 50+ jobs (mix of active and archived)
2. Switch to Archived tab with 25+ archived jobs

**Expected Result:**
- Filtering is immediate
- No performance degradation
- Counts are accurate

---

## Test Checklist Summary

Use this checklist to track your testing progress:

### Basic Operations
- [ ] Test 1.1: Create job
- [ ] Test 1.2: Edit job
- [ ] Test 1.3: View job details

### Archive Functionality
- [ ] Test 2.1: Quick archive (no shifts)
- [ ] Test 2.2: Archive with templates
- [ ] Test 2.3: Archive with shifts
- [ ] Test 2.4: Archive via edit dialog

### Delete Functionality
- [ ] Test 3.1: Delete via archive flow
- [ ] Test 3.2: Permanent delete (no shifts)
- [ ] Test 3.3: Delete keeping shifts
- [ ] Test 3.4: Delete removing shifts
- [ ] Test 3.5: Delete with templates

### Filters and Tabs
- [ ] Test 4.1: Active tab filtering
- [ ] Test 4.2: Archived tab filtering
- [ ] Test 4.3: All tab display
- [ ] Test 4.4: Tab count updates

### Data Integrity
- [ ] Test 5.1: Archive then unarchive
- [ ] Test 5.2: Multiple quick actions
- [ ] Test 5.3: Delete job referenced in calendar
- [ ] Test 5.4: Delete with many shifts
- [ ] Test 5.5: Concurrent actions

### UI/UX
- [ ] Test 6.1: Archive button visibility
- [ ] Test 6.2: Delete dialog warnings
- [ ] Test 6.3: Radio button selection
- [ ] Test 6.4: Mobile responsiveness
- [ ] Test 6.5: Loading states

### Error Handling
- [ ] Test 7.1: Network error
- [ ] Test 7.2: Delete non-existent job
- [ ] Test 7.3: Permission denied

### Database Verification
- [ ] Test 8.1: Cascade behavior (templates)
- [ ] Test 8.2: SET NULL behavior (shifts)
- [ ] Test 8.3: Hard delete (shifts)
- [ ] Test 8.4: Archive status

### Performance
- [ ] Test 9.1: Load time with many jobs
- [ ] Test 9.2: Filter large dataset

---

## Critical Test Scenarios

These are the MUST-TEST scenarios before deploying to production:

1. **Archive active job with shifts** → Verify shifts remain accessible
2. **Delete archived job (keep shifts)** → Verify shifts become orphaned but preserved
3. **Delete archived job (delete shifts)** → Verify all shifts are removed
4. **Auto-refresh after operations** → Verify UI updates without manual refresh
5. **Tab filtering accuracy** → Verify counts and visibility are correct
6. **Mobile usability** → Verify all dialogs and buttons work on mobile

---

## Known Issues / Expected Behavior

1. **Templates always CASCADE delete** - This is intentional. Templates are just patterns, not historical data.
2. **Orphaned shifts have job_id = NULL** - This is expected when keeping shifts after job deletion.
3. **Archive button only on active jobs** - Archived jobs should only be deleted or unarchived via edit.
4. **revalidatePath may take a moment** - There might be a slight delay (< 1 second) on server actions.

---

## Testing Tools

- **Browser**: Chrome DevTools for network simulation
- **Database**: Supabase Dashboard for direct DB verification
- **Mobile**: Chrome DevTools Device Mode or actual mobile device
- **Network**: Chrome DevTools > Network > Throttling

---

## Reporting Issues

When reporting bugs found during testing, include:
1. Test case number
2. Steps to reproduce
3. Expected result
4. Actual result
5. Screenshots if applicable
6. Browser and device information
7. Database state (if relevant)
