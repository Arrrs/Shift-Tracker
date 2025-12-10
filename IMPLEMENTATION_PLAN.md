# Implementation Plan - Shift Tracker Pro

## Project Vision
Transform from personal tool to **sellable product** with professional-grade shift tracking, multi-currency support, comprehensive time-off management, flexible pay structures, and complete income/expense tracking.

---

## Current Status (December 2024)

### ✅ Completed Features (Latest Session)
1. ✅ TIMESTAMPTZ implementation for proper timezone support
2. ✅ Overnight shift calculations with is_overnight flag
3. ✅ Multi-currency support (USD, EUR, UAH, CZK, etc.) with proper symbols
4. ✅ Custom hourly rate per shift (with checkbox toggle)
5. ✅ Holiday pay system (3 modes: standard multiplier, fixed rate, custom multiplier)
6. ✅ Shift templates with job association
7. ✅ Status workflow (planned, in_progress, completed, cancelled)
8. ✅ Loading spinners (Loader2 icons)
9. ✅ Nullable job_id for personal shifts
10. ✅ Edit shift dialog with full feature parity to add dialog
11. ✅ Scheduled vs actual hours tracking
12. ✅ **Day-off system (9 types: PTO, sick, personal, unpaid, bereavement, maternity, paternity, jury_duty)**
13. ✅ **Paid/unpaid day-off visual indicators**
14. ✅ **Status field in shift creation with auto-detection**
15. ✅ **Currency formatting (no .00 for whole numbers, show decimals when needed)**
16. ✅ **Fixed hydration errors (mobile/desktop detection)**
17. ✅ **Pay type system (hourly, daily, monthly, salary) - BASIC**
18. ✅ **Status filtering (only completed shifts count in totals)**
19. ✅ **Multi-currency earnings per day/month (never mix currencies)**
20. ✅ **Snapshot-based earnings architecture (calculate once, never recalculate unless hours change)**
21. ✅ **Three-state earnings system (auto-calculated, manual override, no earnings for fixed income)**
22. ✅ **Custom earnings override UI in add/edit dialogs**
23. ✅ **Simplified income cards (3 cards: Total Earnings combines Shift + Fixed Income)**

### 🐛 Recently Fixed Issues
1. ✅ Daily/salary shifts not showing in totals - FIXED (missing fields in query)
2. ✅ `new Date()` hydration warning - FIXED (moved to useEffect)
3. ✅ Currency symbols showing wrong - FIXED (using getCurrencySymbol())
4. ✅ Decimals showing .00 unnecessarily - FIXED (formatCurrency())
5. ✅ Cancelled/planned shifts counting in totals - FIXED (status filtering)
6. ✅ Float precision showing 55.1999999...6 - FIXED (Math.round to 2 decimals)
7. ✅ Template list showing old templates on job change - FIXED (immediate clear on change)

### 🔨 In Progress - Financial Records System
**Current Focus:** Implementing comprehensive income/expense tracking

### ✅ Completed Today (Phase 1 Progress)
1. ✅ Created `financial_categories` table with RLS
2. ✅ Created `financial_records` table with RLS
3. ✅ Added `show_in_fixed_income` column to jobs table
4. ✅ Created default categories for all users
5. ✅ Implemented `finances/actions.ts` with all backend functions
6. ✅ Created user preferences system (localStorage + database sync)
7. ✅ Applied manual migrations to Supabase
8. ✅ Regenerated TypeScript types

---

## Phase 1: Financial Records System (CURRENT PRIORITY)

### Overview
Separate shift-based income (hourly/daily) from fixed income (monthly/salary) and add support for one-time income/expense records.

### 1.1 Database Schema

#### A. Create `financial_categories` table
```sql
CREATE TABLE financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT, -- Emoji like '💰', '⛽', etc.
  color TEXT, -- Hex color for UI
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, name, type)
);

-- Seed default categories (insert for each new user)
-- Income categories: Bonus (💰), Freelance (💼), Gift (🎁), Other Income (💵)
-- Expense categories: Gas (⛽), Equipment (🔧), Subscription (📱), Other Expense (💸)
```

#### B. Create `financial_records` table
```sql
CREATE TABLE financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  job_id UUID REFERENCES jobs ON DELETE SET NULL, -- Optional link
  category_id UUID REFERENCES financial_categories ON DELETE SET NULL,

  -- Type
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),

  -- Money
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Date & Details
  date DATE NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Indexes for performance
  INDEX idx_financial_records_user_date (user_id, date DESC),
  INDEX idx_financial_records_type (user_id, type)
);
```

#### C. Update `jobs` table
```sql
-- Mark if job contributes to fixed income (monthly/salary jobs)
ALTER TABLE jobs ADD COLUMN show_in_fixed_income BOOLEAN DEFAULT false;

-- This will be TRUE for pay_type = 'monthly' or 'salary'
-- FALSE for 'hourly' or 'daily'
```

### 1.2 Backend Actions

**New file:** `app/(authenticated)/finances/actions.ts`

```typescript
// Get all financial records for a date range
export async function getFinancialRecords(startDate: string, endDate: string)

// Create a financial record
export async function createFinancialRecord(data: {
  type: 'income' | 'expense'
  category_id: string
  amount: number
  currency: string
  date: string
  description: string
  notes?: string
  job_id?: string
})

// Update a financial record
export async function updateFinancialRecord(id: string, data: Partial<...>)

// Delete a financial record
export async function deleteFinancialRecord(id: string)

// Get/Create/Update/Delete categories
export async function getCategories(type: 'income' | 'expense')
export async function createCategory(data: { name, type, icon, color })
export async function updateCategory(id: string, data: Partial<...>)
export async function deleteCategory(id: string)

// Get monthly summary (shift income + fixed income + other income - expenses)
export async function getMonthlyFinancialSummary(year: number, month: number) {
  return {
    shiftIncome: { USD: 2450, EUR: 0 },     // Hourly/daily jobs only
    fixedIncome: { USD: 3000 },             // Monthly/salary jobs
    otherIncome: { USD: 250 },              // Financial records (income)
    expenses: { USD: 120 },                 // Financial records (expense)
    netIncome: { USD: 5580 }                // Total - expenses
  }
}
```

### 1.3 UI Components

#### A. Update Calendar Stats Cards - TWO-STATE DESIGN

**Design Philosophy:** Clean minimal view by default, expandable details on demand

**STATE 1: MINIMAL (Default)**
```
Desktop view:
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ 💼 Shift Income      │  │ 🔄 Fixed Income      │  │ 💰 Other Income      │
│ $2,450        [▼]    │  │ $3,000        [▼]    │  │ $250           [▼]   │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌────────────────────────────────────────────────┐
│ 💸 Expenses          │  │ 💵 Net Income: $5,580                         │
│ $120          [▼]    │  │                                               │
└──────────────────────┘  └────────────────────────────────────────────────┘
```

**STATE 2: DETAILED (Expanded)**
Click [▼] to expand individual card:
```
┌──────────────────────┐
│ 💼 Shift Income [▲]  │
│ $2,450               │
│ ─────────────────    │
│ • Job A:    $1,800   │
│ • Job C:      $650   │
│                      │
│ 12 shifts, 96h       │
└──────────────────────┘

┌──────────────────────┐
│ 🔄 Fixed Income [▲]  │
│ $3,000               │
│ ─────────────────    │
│ • Job B (Monthly)    │
│   $3,000/mo          │
│                      │
│ 22 shifts tracked    │
└──────────────────────┘

┌──────────────────────┐
│ 💰 Other Income [▲]  │
│ $250                 │
│ ─────────────────    │
│ • Freelance:   $200  │
│ • Bonus:        $50  │
│                      │
│ [View Details →]     │
└──────────────────────┘

┌──────────────────────┐
│ 💸 Expenses [▲]      │
│ $120                 │
│ ─────────────────    │
│ • Gas:          $80  │
│ • Equipment:    $40  │
│                      │
│ [View Details →]     │
└──────────────────────┘
```

**Mobile view:** Stack cards vertically, same two-state behavior

**Implementation:**
- Store expanded/collapsed state in localStorage per card
- Animate expansion with smooth height transition
- Show minimal by default for clean first impression
- User can expand only cards they care about

#### B. Add Financial Record Dialog

**New component:** `app/(authenticated)/finances/add-financial-record-dialog.tsx`

```
┌─────────────────────────────────────┐
│ Add Financial Record          [×]   │
├─────────────────────────────────────┤
│                                     │
│ Type:  ⦿ Income  ○ Expense         │
│                                     │
│ Amount: [________] [USD ▼]          │
│                                     │
│ Date:   [2024-12-15]                │
│                                     │
│ Category: [Select ▼]                │
│   💰 Bonus                          │
│   💼 Freelance                      │
│   🎁 Gift                           │
│   💵 Other Income                   │
│   ─────────────────                 │
│   + Manage Categories               │
│                                     │
│ Description: [_______________]      │
│                                     │
│ Notes (optional):                   │
│ [____________________________]      │
│                                     │
│ Link to job (optional):             │
│ [Select job ▼]                      │
│                                     │
│           [Cancel]  [Save]          │
└─────────────────────────────────────┘
```

#### C. Financial Records List/Detail View

**New component:** `app/(authenticated)/finances/financial-records-drawer.tsx`

```
┌─────────────────────────────────────┐
│ Other Income - December 2024   [×]  │
├─────────────────────────────────────┤
│                                     │
│ Dec 15, 2024                        │
│ 💼 Freelance - Web Design           │
│ $200                                │
│ Notes: Logo redesign project        │
│                       [Edit] [Delete]│
├─────────────────────────────────────┤
│ Dec 20, 2024                        │
│ 💰 Bonus - Q4 Performance           │
│ $50                                 │
│                       [Edit] [Delete]│
├─────────────────────────────────────┤
│ Total                         $250  │
│                                     │
│              [+ Add Record]         │
└─────────────────────────────────────┘
```

#### D. Category Management Dialog

**New component:** `app/(authenticated)/finances/manage-categories-dialog.tsx`

```
┌─────────────────────────────────────┐
│ Manage Categories             [×]   │
├─────────────────────────────────────┤
│ [Income] [Expense]  ← tabs          │
│                                     │
│ Income Categories:                  │
│ ┌─────────────────────────────┐    │
│ │ 💰 Bonus            [Edit] [×]│   │
│ │ 💼 Freelance        [Edit] [×]│   │
│ │ 🎁 Gift             [Edit] [×]│   │
│ │ 💵 Other Income     [Edit] [×]│   │
│ └─────────────────────────────┘    │
│                                     │
│ [+ Add New Category]                │
│                                     │
│           [Close]                   │
└─────────────────────────────────────┘
```

#### E. Update Calendar to Show Financial Records

**In `month-calendar.tsx`:**
- Show icons on calendar days: 💵 (income), 💸 (expense)
- Click to see details in day drawer

**In `day-shifts-drawer.tsx`:**
- Add section below shifts:
```
┌─────────────────────────────────────┐
│ Shifts (2)                          │
│ [shifts displayed here]             │
├─────────────────────────────────────┤
│ Financial Records (1)               │
│ 💵 Freelance Payment        +$200   │
│                        [Edit] [Delete]│
└─────────────────────────────────────┘
```

#### F. View Settings/Filters

**Update calendar header with filter button:**
```
┌────────────────────────────────────────┐
│ December 2024           [⚙️ Filter]   │
└────────────────────────────────────────┘

Filter Dialog:
┌────────────────────────────────────┐
│ Calendar View Settings        [×]  │
├────────────────────────────────────┤
│ Show in Calendar:                  │
│ ☑ Work Shifts (Hourly/Daily)      │
│ ☑ Time Off (PTO/Sick/etc)         │
│ ☑ Fixed Income Jobs (time track)  │
│ ☑ Other Income Records             │
│ ☑ Expense Records                  │
│                                    │
│ Show in Totals:                    │
│ ☑ Shift Income                     │
│ ☑ Fixed Income                     │
│ ☑ Other Income                     │
│ ☑ Expenses (subtract)              │
│ ☑ Calculate Net Income             │
│                                    │
│        [Reset]  [Save]             │
└────────────────────────────────────┘
```

**Save preferences to BOTH:**
- `localStorage` - instant UI response (no network delay)
- `user_preferences` database table - persistent across devices
- Sync strategy: Update localStorage immediately, sync to database in background
- On login: Load from database, cache to localStorage

### 1.4 Calculation Logic Updates

**Update `getShiftStats` to separate income types:**

```typescript
export async function getShiftStats(startDate: string, endDate: string) {
  // Get shifts
  const shifts = await getShifts(startDate, endDate)

  // Separate by pay type
  const shiftIncome = {} // hourly + daily only
  const fixedIncome = {} // monthly + salary

  shifts.forEach(shift => {
    if (shift.status !== 'completed') return

    const payType = shift.jobs?.pay_type || 'hourly'
    const earnings = calculateShiftEarnings(shift, shift.jobs)
    const currency = shift.jobs?.currency || 'USD'

    if (payType === 'hourly' || payType === 'daily') {
      shiftIncome[currency] = (shiftIncome[currency] || 0) + earnings
    } else if (payType === 'monthly') {
      // Don't count per-shift, show monthly_rate
      fixedIncome[currency] = shift.jobs.monthly_rate
    } else if (payType === 'salary') {
      // Don't count per-shift, show annual_salary / 12
      fixedIncome[currency] = (shift.jobs.annual_salary || 0) / 12
    }
  })

  // Get financial records
  const records = await getFinancialRecords(startDate, endDate)
  const otherIncome = {}
  const expenses = {}

  records.forEach(record => {
    if (record.type === 'income') {
      otherIncome[record.currency] = (otherIncome[record.currency] || 0) + record.amount
    } else {
      expenses[record.currency] = (expenses[record.currency] || 0) + record.amount
    }
  })

  return {
    shiftIncome,
    fixedIncome,
    otherIncome,
    expenses,
    // ... other stats
  }
}
```

---

## Phase 2: Polish & Optimization (AFTER Phase 1)

### 2.1 Error Handling & User Experience
- [ ] **User-friendly error messages for database constraints**
  - [ ] Duplicate shift constraint error → "A shift already exists at this time for this job"
  - [ ] Missing required fields → Clear field-specific messages
  - [ ] Network errors → Retry mechanism with friendly message
  - [ ] Invalid data → Highlight problematic fields with explanations
- [ ] Visual indicator (✏️ icon) for shifts with manual earnings override
- [ ] Toast notifications with action buttons (undo, view details)
- [ ] Loading states for all async operations
- [ ] Optimistic UI updates where possible

### 2.2 Advanced Features
- [ ] Recurring financial records (auto-create monthly)
- [ ] Budget tracking (set monthly limits)
- [ ] Category analytics (spending by category)
- [ ] Tax preparation (mark deductible expenses)
- [ ] Export to CSV/PDF

### 2.3 UX Enhancements
- [ ] Batch shift creation (create multiple days at once)
- [ ] Smart defaults (remember last selected values)
- [ ] Keyboard shortcuts
- [ ] Right-click context menu on calendar
- [ ] Drag & drop shifts to reschedule

### 2.4 Analytics Dashboard
- [ ] Income trends chart
- [ ] Expense breakdown pie chart
- [ ] Month-over-month comparison
- [ ] Year-to-date totals
- [ ] Category spending analysis

---

## Implementation Order

### Week 1: Database & Backend (THIS WEEK)
1. ✅ Review and finalize database schema
2. ✅ **Create migration for financial_categories table**
3. ✅ **Create migration for financial_records table**
4. ✅ **Add show_in_fixed_income to jobs table**
5. ✅ **Create seed data for default categories**
6. ✅ **Implement backend actions (finances/actions.ts)**
7. ✅ **Create user preferences table and utility**
8. ✅ **Regenerate TypeScript types**
9. 🔨 **Update getShiftStats to separate income types**

### Week 2: UI Components
9. 🔨 **Create AddFinancialRecordDialog component**
10. 🔨 **Create FinancialRecordsDrawer component**
11. 🔨 **Create ManageCategoriesDialog component**
12. 🔨 **Update calendar stats cards (3 new cards)**
13. 🔨 **Update day-shifts-drawer to show financial records**
14. 🔨 **Update month-calendar to show icons**
15. 🔨 **Add filter/settings dialog**

### Week 3: Testing & Refinement
16. 🔨 **Test all income/expense scenarios**
17. 🔨 **Test multi-currency with financial records**
18. 🔨 **Test fixed income calculations**
19. 🔨 **Mobile responsiveness check**
20. 🔨 **Performance optimization**

### Week 4+: Advanced Features
21. 🔨 Recurring records
22. 🔨 Budget tracking
23. 🔨 Analytics dashboard
24. 🔨 Export functionality

---

## Testing Checklist

### Financial Records
- [ ] Create income record (custom category)
- [ ] Create expense record (default category)
- [ ] Edit financial record
- [ ] Delete financial record
- [ ] Create custom category
- [ ] Delete custom category (check records still work)
- [ ] Link financial record to job
- [ ] Create records in multiple currencies
- [ ] Verify totals calculate correctly

### Fixed Income
- [ ] Create monthly salary job ($3000/mo)
- [ ] Create shifts for salary job (track time)
- [ ] Verify shifts don't show earnings
- [ ] Verify Fixed Income card shows $3000
- [ ] Create annual salary job ($60k/yr)
- [ ] Verify shows $5000/mo in Fixed Income

### Combined View
- [ ] Day with: shift + salary tracking + income record + expense
- [ ] Verify calendar shows all icons
- [ ] Verify day drawer shows all items
- [ ] Verify totals separate correctly
- [ ] Test filter settings (hide/show different types)

### Multi-Currency
- [ ] Shift in USD, financial record in EUR
- [ ] Multiple currencies in same day
- [ ] Verify separate totals per currency
- [ ] Verify no mixing of currencies

---

## Success Metrics

### Performance
- Financial record creation: < 500ms
- Category management: < 300ms
- Monthly stats load: < 2 seconds

### Features
- ✅ Support hourly, daily, monthly, salary pay types
- 🔨 Separate shift-based vs fixed income
- 🔨 Custom income/expense categories
- 🔨 Multi-currency throughout
- 🔨 Complete financial picture per month

### UX
- Clear visual distinction: shifts vs salary vs records
- Easy to add one-time income/expense
- Intuitive category management
- No confusion about totals
- Mobile-first design

---

## Database Migration Files to Create

1. `20241210_create_financial_categories.sql`
2. `20241210_create_financial_records.sql`
3. `20241210_update_jobs_add_fixed_income_flag.sql`
4. `20241210_seed_default_categories.sql` (function to run on user creation)

---

## Next Immediate Steps

### Today:
1. **Finalize database schema** (confirm with user)
2. **Create migration files**
3. **Run migrations in Supabase**
4. **Regenerate types**

### Tomorrow:
5. **Create finances/actions.ts**
6. **Update getShiftStats logic**
7. **Start building AddFinancialRecordDialog**

**Estimated Time for Phase 1**: 30-35 hours
**Priority**: Database → Backend → UI Components → Testing
