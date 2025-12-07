# Implementation Plan - Shift Tracker Pro

## Project Vision
Transform from personal tool to **sellable product** with professional-grade shift tracking, multi-currency support, and comprehensive time-off management.

---

## Phase 1: Critical Schema Fixes & Core Features

### 1.1 Database Schema Improvements

#### A. Fix Time Storage (CRITICAL)
**Decision**: Revert to `TIMESTAMPTZ` for proper timezone support
- **Why**: TIME type loses date context for overnight shifts and timezone info
- **Impact**: Better for users who travel or work across timezones
- **Migration**: Convert TIME back to TIMESTAMPTZ

#### B. Make Shifts Flexible
**Decision**: Make `job_id` NULLABLE to allow personal/custom shifts
- **Why**: Users want to track personal time, appointments, non-work events
- **Impact**: Shifts can exist without job assignment
- **UI**: Add "No Job" option in dropdown

#### C. Add Validation Constraints
- Prevent negative hours
- Validate shift timing
- Ensure template-job matching
- Add currency validation

### 1.2 Holiday System (Two Types)

#### Type 1: Work Holidays (Paid/Holiday Pay)
```
- Date with work but holiday multiplier
- Attached to a job
- Counts toward salary with multiplier (1.5x, 2x, etc.)
- Example: Christmas Day shift at double pay
```

#### Type 2: Days Off (PTO/Vacation/Sick)
```
- Date marked as off
- Attached to a job (tracks available days)
- No hours worked but counts as "used PTO day"
- Example: Took Friday off, want to track remaining vacation days
```

**New Table**: `time_off_records`
```sql
- id, user_id, job_id (nullable)
- date, type (vacation, sick, personal, unpaid)
- is_paid (boolean)
- hours_credited (nullable - if counts toward hours)
- notes
```

### 1.3 Shift Status Workflow

**Status**: `planned` → `in_progress` → `completed` → `cancelled`

**Visual Indicators**:
- Planned: Gray border, opacity 0.7
- In Progress: Blue border, pulsing
- Completed: Green checkmark
- Cancelled: Red strikethrough

**Auto-status Logic**:
- If date < today AND status = planned → auto-set to completed
- Allow manual override

### 1.4 Multi-Currency Support

#### Current Issue
- Jobs can have different currencies (USD, EUR, UAH)
- Calendar shows: "$1000 + €500 + ₴2000 = ???" (WRONG)

#### Solution
**A. Display Strategy**:
```
Total Earnings (Multi-Currency):
  USD: $1,250.00
  EUR: €850.50
  UAH: ₴12,500.00

[Converted to USD: $3,547.25 ≈]
```

**B. Store exchange rates in `currency_rates` table**

**C. Settings**: User chooses primary currency for conversions

**D. Job List**: Show each job's currency symbol
```
Warehouse ($25/hr USD)
Freelance (€30/hr EUR)
```

---

## Phase 2: UX Improvements

### 2.1 Smart Defaults

**Job Selection**:
1. Check last 30 days → most frequent job
2. Store in localStorage: `last_selected_job_id`
3. If opening from calendar: check most common job for that day of week

**Time Defaults**:
1. If job has templates → select most recent template
2. If no template → use average times from last 5 shifts
3. Add button: "Use my usual hours for [JobName]"

### 2.2 Clarify Duration vs Actual Hours

**New Field Labels**:
```
┌─────────────────────────────────┐
│ Scheduled Shift                 │
│ Start: [09:00] End: [17:00]     │
│ Duration: 8.0h                  │
│                                 │
│ [✓] Worked exactly as scheduled │
│                                 │
│ OR                              │
│                                 │
│ [ ] Different hours worked      │
│   Actual: [7.5] hrs            │
│   Reason: Unpaid lunch break    │
└─────────────────────────────────┘
```

**Database**:
- Add: `scheduled_hours` (calculated from end - start)
- Keep: `actual_hours` (what was worked)
- Calculate: `variance_hours` (actual - scheduled)

### 2.3 Batch Operations

**Multi-Day Shift Creation**:
```
[✓] Create for multiple days

Select Days:
☐ Sun ☑ Mon ☑ Tue ☑ Wed ☑ Thu ☑ Fri ☐ Sat

Date Range:
From: [Dec 9] To: [Dec 31]

Preview: Will create 16 shifts

[Create All Shifts]
```

### 2.4 Validation & Warnings

1. **Overlapping shifts**: "Warning: This overlaps with [JobName] shift"
2. **Overnight shifts**: Auto-detect if end < start
3. **Past-dating**: "This shift is in the past. Mark as completed?"
4. **Duplicate prevention**: Check existing shifts before save

---

## Phase 3: Advanced Features

### 3.1 Expected vs Actual Tracking

**Monthly Stats**:
```
December 2024

HOURS
Expected:  160h  (from scheduled shifts)
Actual:    152h  (from completed shifts)
Remaining: 8h    (from planned shifts)
Progress:  95%

EARNINGS
Expected:  $3,200
Actual:    $3,040
Remaining: $160
Variance:  -$160 (undertime)

SHIFTS
Total:     20
Completed: 18
Planned:   2
```

### 3.2 Time-Off Tracking & Analytics

**Job Details Page - New Section**:
```
PTO Balance for Warehouse Job

Vacation Days:
  Total:      15 days/year
  Used:       8 days
  Remaining:  7 days

Sick Days:
  Total:      10 days/year
  Used:       2 days
  Remaining:  8 days

Recent Time Off:
  Nov 28-29: Vacation (2 days)
  Nov 15:    Sick (1 day)
  Oct 10:    Personal (1 day)
```

### 3.3 Calendar Enhancements

**Visual Indicators**:
- 🟢 Completed shift
- 🔵 Planned shift
- 🟡 In progress
- 🔴 Cancelled
- 🏖️ Day off (PTO)
- 🎉 Holiday (working)

**Right-click Menu**:
```
Right-click on calendar day:
  → Add Shift
  → Add Day Off
  → Mark as Holiday
  → Copy to other days
  → View Details
```

---

## Implementation Order (Priority)

### Week 1: Foundation (Must-Have)
1. ✅ Create implementation plan
2. 🔨 Schema migration: Revert TIME to TIMESTAMPTZ
3. 🔨 Make job_id nullable
4. 🔨 Add validation constraints
5. 🔨 Add time_off_records table
6. 🔨 Update database types

### Week 2: Core UX (High Impact)
7. 🔨 Fix Duration vs Actual Hours UI
8. 🔨 Add shift status toggle and indicators
9. 🔨 Smart defaults (last used job)
10. 🔨 Add validation warnings
11. 🔨 Add "No Job" option for shifts

### Week 3: Currency & Analytics
12. 🔨 Multi-currency display in stats
13. 🔨 Currency conversion setup
14. 🔨 Expected vs Actual tracking
15. 🔨 Update job list to show currency symbols

### Week 4: Advanced Features
16. 🔨 Time-off management UI
17. 🔨 Batch shift creation
18. 🔨 Holiday system (both types)
19. 🔨 Calendar visual improvements
20. 🔨 PTO balance tracking

---

## Database Changes Summary

### New Tables
```sql
-- Time off tracking
time_off_records (
  id, user_id, job_id (nullable),
  date, type, is_paid, hours_credited,
  notes, created_at, updated_at
)

-- Store user-specific exchange rates
user_currency_preferences (
  user_id, primary_currency,
  auto_convert, last_updated
)
```

### Modified Tables
```sql
-- shifts
ALTER job_id to NULLABLE
ALTER start_time back to TIMESTAMPTZ
ALTER end_time back to TIMESTAMPTZ
ADD scheduled_hours DECIMAL(5,2)
ADD variance_hours DECIMAL(5,2)

-- jobs
ADD pto_days_per_year INTEGER
ADD sick_days_per_year INTEGER
ADD currency_symbol TEXT (for display)

-- user_settings
ADD primary_currency TEXT DEFAULT 'USD'
ADD show_currency_breakdown BOOLEAN DEFAULT true
```

### New Constraints
```sql
-- Validate timing
CHECK (end_time > start_time OR is_overnight = true)

-- Validate hours
CHECK (actual_hours >= 0)
CHECK (scheduled_hours >= 0)

-- Template-job match
CHECK (template_id IS NULL OR
  template.job_id = shifts.job_id)
```

---

## UI/UX Changes Summary

### Calendar Page
- Add status badges on shifts
- Add time-off indicators
- Multi-currency breakdown in stats
- Expected vs Actual comparison

### Add/Edit Shift Dialog
- "No Job" option
- Scheduled vs Actual hours (clear labels)
- Status selector
- Overnight shift toggle
- Batch creation mode
- Validation warnings

### New: Time-Off Dialog
```
┌─ Add Time Off ─────────────┐
│ Job: [Warehouse ▼]         │
│ Type: [Vacation ▼]         │
│ Date: [Dec 15]             │
│ [ ] Multiple days          │
│ Paid: [✓] Yes [ ] No       │
│ Notes: [____________]      │
│                            │
│ Remaining Vacation: 7 days │
│                            │
│ [Cancel] [Add Time Off]    │
└────────────────────────────┘
```

### Job Details Page
- Add PTO tracking section
- Show currency clearly
- Time-off history list

---

## Technical Notes

### Migration Strategy
1. Create new migration file
2. Backup production data
3. Run migration in transaction
4. Test rollback procedure
5. Update TypeScript types
6. Update all queries

### Testing Checklist
- [ ] Overnight shifts (23:00 - 07:00)
- [ ] Multi-currency calculations
- [ ] Batch shift creation (50+ shifts)
- [ ] Overlapping shift detection
- [ ] Timezone edge cases
- [ ] PTO balance calculations
- [ ] Currency conversion accuracy

### Performance Considerations
- Index on: (user_id, date, status)
- Index on: (user_id, job_id, date)
- Optimize date range queries
- Cache currency rates (refresh daily)
- Paginate shift lists (100/page)

---

## Success Metrics (Product Goals)

### User Experience
- Shift creation: < 10 seconds (with smart defaults)
- Calendar load: < 2 seconds (month view)
- Batch operations: < 5 seconds (20 shifts)

### Business Value
- Multi-job tracking: Support 1-10 jobs/user
- Multi-currency: Support 20+ currencies
- Time-off: Track unlimited PTO/sick days
- Analytics: Expected vs Actual variance tracking
- Export ready: CSV/PDF preparation

### Competitive Advantages
1. ✅ Personal + Professional use
2. ✅ Multi-job support (gig economy)
3. ✅ Multi-currency (international workers)
4. ✅ Flexible time tracking
5. ✅ Offline-first PWA
6. ✅ Privacy-focused (self-hosted option)

---

## Revenue Model Ideas (Future)
- Free: 1 job, basic features
- Pro ($5/mo): Unlimited jobs, analytics, export
- Team ($15/mo): Share schedules, approvals
- Enterprise: Custom deployment

---

## Next Steps
1. Review and approve this plan
2. Start with Schema migrations
3. Update TypeScript types
4. Implement UI changes incrementally
5. Test each feature thoroughly
6. Deploy to production

**Estimated Total Time**: 4 weeks (80-100 hours)
**Priority**: Foundation → UX → Analytics → Advanced
