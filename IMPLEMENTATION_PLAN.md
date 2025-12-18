# Implementation Plan - Shift Tracker Pro

## Project Vision
Transform from personal tool to **sellable product** with professional-grade time tracking, multi-currency support, comprehensive day-off management, flexible pay structures, and complete income/expense tracking with clean separation of concerns.

---

## Current Status (December 2024)

### ✅ COMPLETED: Full Architecture Rewrite (Latest Session)

**Major Achievement:** Complete system redesign with clean separation between time tracking and financial tracking.

#### New Database Schema (Clean Start)
1. ✅ **jobs** table - Simplified with pay_type support (hourly, daily, monthly, salary)
   - Fields: name, pay_type, hourly_rate, daily_rate, monthly_salary, currency, color, is_active
   - Removed: description field (not needed)
   - Benefits tracking: pto_days_per_year, sick_days_per_year, personal_days_per_year

2. ✅ **time_entries** table - Unified time tracking (replaces old shifts table)
   - Entry types: 'work_shift' | 'day_off'
   - Work shifts: job_id, template_id, start_time, end_time, scheduled_hours, actual_hours, is_overnight
   - Day-offs: day_off_type (pto, sick, personal, unpaid, bereavement, maternity, paternity, jury_duty), is_full_day
   - Status: planned, in_progress, completed, cancelled
   - Uses PostgreSQL TIME type (no timezone complexity)

3. ✅ **income_records** table - Separate income tracking
   - Source types: job_shift, job_salary, bonus, freelance, other
   - Auto-generated for completed hourly/daily shifts (via database trigger)
   - Manual entry for monthly/salary jobs
   - calculation_basis JSONB for transparency
   - Never auto-recalculates (snapshot architecture)

4. ✅ **expense_records** table - Expense tracking
   - Linked to expense_categories
   - Date, amount, currency, description, notes

5. ✅ **expense_categories** table - Category management
   - Default categories created for new users
   - Icons and colors for UI

6. ✅ **shift_templates** table - Quick-fill templates (simplified)
   - Optional dropdown helper (not primary workflow)
   - Pre-fills start_time, end_time, expected_hours
   - Always shows editable time inputs

#### Auto-Income Generation Trigger
```sql
CREATE TRIGGER auto_income_on_shift_complete
  AFTER INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  WHEN (NEW.entry_type = 'work_shift' AND NEW.status = 'completed')
  EXECUTE FUNCTION auto_generate_income_for_shift();
```
- Only for hourly/daily jobs
- Creates income_record automatically when shift is completed
- Includes calculation_basis for transparency

#### Completed Frontend Components
1. ✅ **Time Entry Dialogs**
   - add-time-entry-dialog.tsx - Simplified single-page form
   - edit-time-entry-dialog.tsx - Edit with delete functionality
   - Type selector: work_shift vs day_off
   - Optional job selection
   - Optional template dropdown (no tabs/modes)
   - Always-visible, editable time inputs
   - Auto-calculating hours from times

2. ✅ **Calendar Page Updates**
   - Updated to use time_entries instead of shifts
   - MonthCalendar component - Shows time entries with status indicators
   - ListView component - Lists work shifts and day-offs
   - DayShiftsDrawer component - View/edit day entries
   - Removed earnings display (now in separate income tracking)

3. ✅ **Jobs Page Fixes**
   - Fixed getJobs() to query time_entries instead of shifts
   - Updated entry_count display
   - Fixed deleteJob() to handle time_entries

4. ✅ **Job Dialogs - Field Alignment**
   - add-job-dialog.tsx - Matches database schema exactly
   - edit-job-dialog.tsx - Matches add dialog (full parity)
   - Removed description field (not in schema)
   - Pay type selector with dynamic fields:
     - hourly → hourly_rate
     - daily → daily_rate
     - monthly/salary → monthly_salary (single field, different labels)
   - Currency selector
   - Color picker
   - Active status toggle

5. ✅ **Actions Layer**
   - time-entries/actions.ts - Complete CRUD for time entries
   - jobs/actions.ts - Updated for new schema
   - Fixed all references to use correct field names

### 🎯 Key Architectural Decisions

#### 1. **Separation of Concerns**
- **time_entries** = WHEN you worked (time tracking only)
- **income_records** = MONEY you received (financial tracking)
- **expense_records** = MONEY you spent (financial tracking)

#### 2. **Payment Type Strategy**
- **Hourly/Daily**: Auto-generate income when shift completed
- **Monthly/Salary**: Track time only, manual income entry (don't slice salary into daily amounts)

#### 3. **Timezone Simplification**
- Use PostgreSQL TIME type (not TIMESTAMPTZ)
- Store local time without timezone info
- User's device handles display timezone
- Works seamlessly across web/mobile

#### 4. **Template Simplification**
- No template/manual mode tabs
- Templates as optional dropdown helper
- Always show editable time inputs
- User can select template AND modify times

#### 5. **Historical Integrity**
- Income records never auto-recalculate
- Transparent calculation_basis stored as JSONB
- Manual overrides clearly flagged (is_manual: true/false)

### 🐛 Recently Fixed Issues
1. ✅ Jobs page error "Could not find relationship between 'jobs' and 'shifts'" - FIXED (updated to time_entries)
2. ✅ Job creation error "Could not find 'annual_salary' column" - FIXED (uses monthly_salary for both monthly/salary)
3. ✅ Job creation error "Could not find 'description' column" - FIXED (removed from forms)
4. ✅ Job edit dialog missing pay_type and rate fields - FIXED (now matches add dialog)

### 📊 Database Schema Summary

```
jobs
├── id (UUID)
├── user_id (UUID)
├── name (TEXT) *
├── color (TEXT)
├── is_active (BOOLEAN)
├── pay_type (TEXT) * - 'hourly' | 'daily' | 'monthly' | 'salary'
├── hourly_rate (DECIMAL)
├── daily_rate (DECIMAL)
├── monthly_salary (DECIMAL)
├── currency (TEXT)
├── currency_symbol (TEXT)
├── pto_days_per_year (INTEGER)
├── sick_days_per_year (INTEGER)
├── personal_days_per_year (INTEGER)
└── salary_history (JSONB)

time_entries
├── id (UUID)
├── user_id (UUID)
├── date (DATE) *
├── entry_type (TEXT) * - 'work_shift' | 'day_off'
├── job_id (UUID) → jobs
├── template_id (UUID) → shift_templates
├── start_time (TIME)
├── end_time (TIME)
├── scheduled_hours (DECIMAL)
├── actual_hours (DECIMAL) *
├── is_overnight (BOOLEAN)
├── day_off_type (TEXT) - 'pto' | 'sick' | 'personal' | 'unpaid' | etc.
├── is_full_day (BOOLEAN)
├── status (TEXT) * - 'planned' | 'in_progress' | 'completed' | 'cancelled'
└── notes (TEXT)

income_records
├── id (UUID)
├── user_id (UUID)
├── date (DATE) *
├── source_type (TEXT) * - 'job_shift' | 'job_salary' | 'bonus' | 'freelance' | 'other'
├── job_id (UUID) → jobs
├── time_entry_id (UUID) → time_entries
├── amount (DECIMAL) *
├── currency (TEXT) *
├── calculation_basis (JSONB) - {hours, rate, formula}
├── is_manual (BOOLEAN)
└── notes (TEXT)

expense_records
├── id (UUID)
├── user_id (UUID)
├── date (DATE) *
├── category_id (UUID) → expense_categories *
├── amount (DECIMAL) *
├── currency (TEXT) *
├── description (TEXT)
└── notes (TEXT)

expense_categories
├── id (UUID)
├── user_id (UUID)
├── name (TEXT) *
├── icon (TEXT) - emoji
└── color (TEXT)

shift_templates
├── id (UUID)
├── user_id (UUID)
├── job_id (UUID) → jobs *
├── name (TEXT) *
├── short_code (TEXT) - e.g. "M", "E", "N"
├── color (TEXT)
├── start_time (TIME) *
├── end_time (TIME) *
├── expected_hours (DECIMAL) *
├── default_custom_rate (DECIMAL)
└── default_holiday_multiplier (DECIMAL)
```

---

## Phase 2: Income & Expense UI (NEXT PRIORITY)

### 2.1 Income Management Page
- [ ] Create `/income` page
- [ ] List all income records (grouped by month)
- [ ] Filter by source type, job, date range
- [ ] Add manual income dialog
- [ ] Edit/delete income records
- [ ] Show calculation_basis for auto-generated income
- [ ] Multi-currency support

### 2.2 Expense Management Page
- [ ] Create `/expenses` page
- [ ] List all expenses (grouped by month)
- [ ] Filter by category, date range
- [ ] Add expense dialog
- [ ] Edit/delete expenses
- [ ] Category management UI
- [ ] Multi-currency support

### 2.3 Dashboard/Summary
- [ ] Update home page with financial overview
- [ ] Income vs expenses chart
- [ ] Category breakdown
- [ ] Monthly trends
- [ ] Multi-currency handling in summaries

---

## Phase 3: Advanced Features

### 3.1 Reports & Analytics
- [ ] Monthly/yearly reports
- [ ] Export to CSV/PDF
- [ ] Tax preparation summary
- [ ] Job performance comparison
- [ ] Time utilization analysis

### 3.2 Recurring Transactions
- [ ] Set up recurring income (e.g., monthly salary)
- [ ] Set up recurring expenses (e.g., subscriptions)
- [ ] Auto-generation with notifications

### 3.3 Mobile Optimization
- [ ] Progressive Web App (PWA)
- [ ] Offline support
- [ ] Push notifications
- [ ] Quick entry shortcuts

---

## Technical Debt & Cleanup

### Currently Unused Components (TODO: Remove or Update)
- [ ] IncomeStatsCards component (needs rewrite for new schema)
- [ ] StatCardMobile component (needs rewrite for new schema)
- [ ] Old stats calculation logic in calendar page

### Missing Functionality
- [ ] Stats calculation for new time_entries schema
- [ ] Income display in calendar view
- [ ] Benefits tracking (PTO days used/remaining)

---

## Notes & Decisions

### Why Separate time_entries and income_records?
1. **Clarity**: Time tracking vs money tracking are distinct concerns
2. **Flexibility**: Can add income not tied to shifts (bonuses, freelance)
3. **Monthly jobs**: Don't need to split monthly salary into daily amounts
4. **Historical accuracy**: Income snapshots never recalculate
5. **Audit trail**: Clear calculation_basis for transparency

### Why Use TIME Instead of TIMESTAMPTZ?
1. **Simplicity**: No timezone conversion math needed
2. **Portability**: Works across different devices/timezones
3. **User intent**: Users think in local time, not UTC
4. **Mobile-friendly**: Easier to handle on mobile apps

### Why Optional Templates?
1. **User preference**: Some users prefer manual entry
2. **Flexibility**: Can use template AND modify times
3. **Not primary**: Templates are helpers, not required workflow
4. **Reduced complexity**: No mode switching, always show inputs

---

## Migration Notes

### From Old Schema to New Schema
- Ran `00_fresh_start_time_entries.sql` migration
- Dropped old `shifts` table
- Created new `time_entries`, `income_records`, `expense_records` tables
- Auto-income trigger installed
- Default expense categories created
- TypeScript types regenerated

### Breaking Changes
- All references to `shifts` changed to `time_entries`
- Earnings no longer stored in time_entries (moved to income_records)
- Templates are optional (not required for entry)
- No description field on jobs table
- Single `monthly_salary` field for both monthly and salary pay types
