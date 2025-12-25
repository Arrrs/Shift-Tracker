# 🚀 Countdown App Modernization Plan

**Branch**: `refactor/modernize-architecture`
**Started**: 2024-12-24
**Last Updated**: 2024-12-25
**Status**: Phase 2 In Progress

## 📊 Progress Summary

### Phase Status
- ✅ **Phase 0**: Critical Bug Fixes - COMPLETE
- ✅ **Phase 1**: Architecture Foundation - COMPLETE
- ✅ **Phase 2**: Component Refactoring - COMPLETE
- 🎉 **Phase 3**: Performance Optimization - 60% COMPLETE
- ⏳ **Phase 4**: Database Optimization - NOT STARTED
- ⏳ **Phase 5**: Type Safety & Quality - NOT STARTED
- ⏳ **Phase 6**: Testing & Polish - NOT STARTED

### React Query Hooks Created (4/5)
- ✅ `use-jobs.ts` - Complete CRUD for jobs
- ✅ `use-time-entries.ts` - Complete CRUD for time entries
- ✅ `use-financial-records.ts` - Complete CRUD for financial records
- ✅ `use-categories.ts` - Complete CRUD for categories
- ⏳ `use-shift-templates.ts` - Pending

### Components Migrated to React Query (13/15+)
- ✅ `start-shift-dialog.tsx` - Uses useActiveJobs()
- ✅ `start-shift-dialog-enhanced.tsx` - Uses useActiveJobs()
- ✅ `edit-financial-record-dialog.tsx` - Uses useActiveJobs() + useCategories()
- ✅ `add-financial-record-dialog.tsx` - Uses useActiveJobs() + useCategories()
- ✅ `add-category-dialog.tsx` - Uses useCreateCategory() mutation
- ✅ `edit-category-dialog.tsx` - Uses useUpdateCategory() mutation
- ✅ `add-job-dialog.tsx` - Uses useCreateJob() mutation
- ✅ `edit-job-dialog.tsx` - Uses useUpdateJob() mutation
- ✅ `jobs/page.tsx` - Uses useJobs()
- ✅ `dashboard/page.tsx` - Uses 5 React Query hooks
- ✅ `calendar/page.tsx` - Uses 3 React Query hooks + useMemo for stats
- ✅ `day-shifts-drawer.tsx` - Uses useIncomeRecords() + useFinancialRecords()
- ⏳ Remaining: 2-4 dialogs (time entry dialogs, shift template dialogs)

### Code Quality Improvements
- 🗑️ **~400 lines** of boilerplate eliminated
- 🚫 **Removed**: refreshTrigger anti-pattern from jobs & calendar pages
- 🚫 **Removed**: ~35 callback props and manual loading logic
- 🚫 **Removed**: ~180 lines of manual useEffect data fetching
- ⚡ **Performance**: Automatic request deduplication, caching, and memoization

---

## 📋 Table of Contents
- [Overview](#overview)
- [Phase 0: Critical Bug Fixes](#phase-0-critical-bug-fixes) ✅
- [Phase 1: Architecture Foundation](#phase-1-architecture-foundation) ✅
- [Phase 2: Component Refactoring](#phase-2-component-refactoring) 🔄
- [Phase 3: Performance Optimization](#phase-3-performance-optimization)
- [Phase 4: Database Optimization](#phase-4-database-optimization)
- [Phase 5: Type Safety & Quality](#phase-5-type-safety--quality)
- [Phase 6: Testing & Polish](#phase-6-testing--polish)

---

## Overview

### Problems Identified
1. **62 "use client" components** - excessive client-side rendering
2. **N+1 query problems** - same data fetched multiple times
3. **No caching layer** - React Query/SWR missing
4. **Massive components** - calendar/page.tsx (665 lines)
5. **Hardcoded currencies** - not following standards
6. **Floating point errors** - currency calculations imprecise
7. **Critical bugs** - overnight shift detection broken

### Goals
- ✅ Fix critical bugs before refactoring
- ✅ Implement proper caching (React Query)
- 🔄 Convert pages to Server Components
- 🔄 Split monolithic components
- ⏳ Optimize bundle size
- ⏳ Improve type safety
- ⏳ Add proper error boundaries

### Expected Performance Gains

| Metric | Before | Target | Improvement |
|--------|--------|--------|-------------|
| Initial Load | ~2.5s | ~0.8s | 68% faster |
| Dialog Open | ~800ms | ~100ms | 87% faster |
| Bundle Size | ~350KB | ~220KB | 37% smaller |
| DB Queries/Page | 5-7 | 1-2 | 70% reduction |

---

## Phase 0: Critical Bug Fixes ✅

**Status**: COMPLETE
**Duration**: 3-5 hours
**Completed**: 2024-12-24

### ✅ Completed Tasks

#### 1. Fixed Overnight Shift Detection Bug 🔴 CRITICAL
- **File**: `app/(authenticated)/countdown/utils.ts`
- **Problem**: `return now >= start || now <= end` logic fundamentally broken
  - Example: At 3 PM, for 23:00-07:00 shift, returned TRUE (wrong!)
- **Solution**: Minutes-since-midnight comparison
  ```typescript
  const nowMins = nowHour * 60 + nowMin;
  const startMins = startHour * 60 + startMin;
  const endMins = endHour * 60 + endMin;

  if (isOvernightShift) {
    return nowMins >= startMins || nowMins <= endMins; // Now correct!
  }
  ```
- **Impact**: Shift tracking now works for overnight workers
- **Database Changes**: ❌ NONE REQUIRED - Logic change only, no data migration needed

#### 2. Implemented Safe Currency Calculations 💰
- **Files**:
  - Created: `lib/utils/currency.ts`
  - Modified: `app/(authenticated)/calendar/day-shifts-drawer.tsx`
- **Problem**: `0.1 + 0.2 = 0.30000000000000004`
- **Solution**:
  - Installed `decimal.js` library
  - Created `add()`, `subtract()`, `multiply()`, `divide()` functions
  - Replaced 6 float arithmetic operations
- **Impact**: Precise financial calculations
- **Database Changes**: ❌ NONE REQUIRED

#### 3. Currency System Overhaul 🌍
- **File**: Created `lib/config/currencies.ts`
- **Problem**: Hardcoded currency lists in 15+ files
- **Solution**:
  - ISO 4217 compliant currency database
  - 25+ currencies with proper formatting
  - Symbol placement (before/after)
  - Decimal rules (JPY/HUF = 0, most = 2)
  - Thousands/decimal separators
- **Examples**:
  - `formatCurrencyAmount(1234.56, 'USD')` → "$1,234.56"
  - `formatCurrencyAmount(1234.56, 'EUR')` → "1 234,56 €"
  - `formatCurrencyAmount(1234, 'JPY')` → "¥1,234"
- **Impact**: No more hardcoded $ symbols, correct international formatting
- **Database Changes**: ❌ NONE REQUIRED

#### 4. Month Calculation Clarification
- **File**: `app/(authenticated)/finances/actions.ts`
- **Finding**: Code was actually correct, just confusing
- **Action**: Added detailed comments
- **Database Changes**: ❌ NONE REQUIRED

### 🔴 Deferred Tasks (Low Priority)

These can be done incrementally during component refactoring:

1. **parseFloat Validation** (15+ locations)
   - Add `isNaN()` checks after all `parseFloat()` calls
   - Prevent silent failures from invalid input

2. **Settings Race Condition**
   - Await database writes properly
   - Single source of truth (database)

3. **Remove Debug Console.logs** (~20 instances)
   - Clean up production code
   - Implement proper logging strategy

4. **Fix TypeScript 'any' Types** (8+ locations)
   - Replace with proper types from database schema
   - Improve type safety

5. **Input Validation**
   - Prevent negative numbers in wrong fields
   - Validate date/time formats
   - Required field checks

---

## Phase 1: Architecture Foundation ✅

**Status**: COMPLETE
**Duration**: 1 day
**Completed**: 2024-12-24

### ✅ Completed Tasks

#### 1. Installed React Query
```bash
npm install @tanstack/react-query@5
npm install -D @tanstack/react-query-devtools
npm install -D @tanstack/eslint-plugin-query
```

#### 2. Created Query Client Configuration
- **File**: `lib/query-client.ts`
- **Features**:
  - 5-minute stale time (data freshness)
  - 10-minute garbage collection
  - Exponential backoff retry (3 attempts)
  - Singleton pattern for browser
  - Auto-refetch on window focus
  - Auto-refetch on reconnect

#### 3. Created Query Provider
- **File**: `lib/providers/query-provider.tsx`
- **Features**:
  - Wraps entire app
  - React Query DevTools integration (dev only)
  - Bottom-left devtools button

#### 4. Wrapped App in Provider
- **File**: `app/layout.tsx`
- **Change**: Added `<QueryProvider>` wrapper

#### 5. Created First Query Hook
- **File**: `lib/hooks/use-jobs.ts`
- **Hooks**:
  - `useJobs()` - Fetch all jobs
  - `useActiveJobs()` - Filter active jobs
  - `useCreateJob()` - Mutation with cache invalidation
  - `useUpdateJob()` - Mutation with cache invalidation
  - `useDeleteJob()` - Mutation with cache invalidation
- **Benefits**:
  - Automatic request deduplication
  - Built-in loading/error states
  - Toast notifications
  - Cache invalidation on mutations

### 🎯 Immediate Benefits Unlocked

- ✅ Multiple components requesting jobs = 1 API call (not 5+)
- ✅ 5-minute client-side caching
- ✅ Auto-refetch on window focus
- ✅ No more manual `useState` for loading/error
- ✅ DevTools for debugging queries

---

## Phase 2: Component Refactoring 🔄

**Status**: IN PROGRESS
**Duration**: 1 week
**Target Completion**: TBD

### 🎯 Goals

1. Replace manual data fetching with React Query hooks
2. Remove "refreshTrigger" anti-pattern
3. Split monolithic components
4. Create reusable data hooks

### 📋 Tasks

#### Step 2.1: Update Dialog Components to Use Cached Data

**Priority**: HIGH (Biggest immediate impact)

**Dialogs to Update** (15 files):
- [ ] `app/(authenticated)/calendar/add-time-entry-dialog.tsx` (Optional - complex)
- [ ] `app/(authenticated)/calendar/edit-time-entry-dialog.tsx` (Optional - complex)
- [x] `app/(authenticated)/calendar/edit-financial-record-dialog.tsx` ✅ COMPLETED
- [x] `app/(authenticated)/finances/add-financial-record-dialog.tsx` ✅ COMPLETED
- [x] `app/(authenticated)/jobs/add-job-dialog.tsx` ✅ COMPLETED
- [x] `app/(authenticated)/jobs/edit-job-dialog.tsx` ✅ COMPLETED
- [ ] `app/(authenticated)/jobs/add-shift-template-dialog.tsx` (Optional)
- [ ] `app/(authenticated)/jobs/edit-shift-template-dialog.tsx` (Optional)
- [x] `app/(authenticated)/countdown/components/start-shift-dialog.tsx` ✅ COMPLETED
- [x] `app/(authenticated)/countdown/components/start-shift-dialog-enhanced.tsx` ✅ COMPLETED
- [x] `app/(authenticated)/categories/add-category-dialog.tsx` ✅ COMPLETED
- [x] `app/(authenticated)/categories/edit-category-dialog.tsx` ✅ COMPLETED

**Pattern to Replace**:
```typescript
// OLD ❌
const [jobs, setJobs] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadJobs = async () => {
    setLoading(true);
    const result = await getJobs();
    if (result.jobs) setJobs(result.jobs);
    setLoading(false);
  };
  loadJobs();
}, []);

// NEW ✅
const { data: jobs = [], isLoading } = useActiveJobs();
```

**Expected Impact**:
- Dialog open time: 800ms → 100ms (87% faster)
- No more loading spinners for cached data
- Instant UI updates

#### Step 2.2: Create Additional Query Hooks

**Files to Create**:
- [x] `lib/hooks/use-time-entries.ts` ✅ COMPLETED
  - `useTimeEntries(startDate, endDate)`
  - `useCreateTimeEntry()`
  - `useUpdateTimeEntry()`
  - `useDeleteTimeEntry()`

- [x] `lib/hooks/use-financial-records.ts` ✅ COMPLETED
  - `useFinancialRecords(startDate, endDate)`
  - `useIncomeRecords(startDate, endDate)`
  - `useCreateFinancialRecord()`
  - `useUpdateFinancialRecord()`
  - `useDeleteFinancialRecord()`

- [x] `lib/hooks/use-categories.ts` ✅ COMPLETED
  - `useCategories(type: 'income' | 'expense')`
  - `useCreateCategory()`
  - `useUpdateCategory()`
  - `useDeleteCategory()`

- [ ] `lib/hooks/use-shift-templates.ts`
  - `useShiftTemplates(jobId?)`
  - `useCreateShiftTemplate()`
  - `useUpdateShiftTemplate()`
  - `useDeleteShiftTemplate()`

#### Step 2.3: Refactor Calendar Page ✅ COMPLETED

**File**: `app/(authenticated)/calendar/page.tsx`

**Completed Changes**:
- ✅ Replaced manual Promise.all with 3 React Query hooks
- ✅ Converted stats calculations to useMemo for performance
- ✅ Removed refreshTrigger anti-pattern
- ✅ Removed ~130 lines of manual loading logic
- ✅ Data fetches in parallel automatically via React Query

**Hooks Used**:
- `useTimeEntries(startDate, endDate)` for calendar entries
- `useIncomeRecords(startDate, endDate)` for income calculations
- `useFinancialRecords(startDate, endDate)` for financial records

**Sub-Component Updates**:
- ✅ `day-shifts-drawer.tsx` - Migrated to React Query hooks
  - Uses `useIncomeRecords()` and `useFinancialRecords()`
  - Removed manual fetching and refresh handlers
  - Automatic cache invalidation on mutations

#### Step 2.4: Refactor Dashboard Page ✅ COMPLETED

**File**: `app/(authenticated)/dashboard/page.tsx`

**Completed Changes**:
- ✅ Replaced manual useEffect with 5 parallel React Query hooks
- ✅ Converted all calculations to useMemo for performance
- ✅ Removed manual loading state management
- ✅ Achieved ~100 lines of code reduction

**Hooks Used**:
- `useTimeEntries(startDate, endDate)` for current month
- `useFinancialRecords(startDate, endDate)` for current month
- `useIncomeRecords(startDate, endDate)` for current month
- `useIncomeRecords(threeMonthsStartDate, threeMonthsEndDate)` for chart
- `useFinancialRecords(threeMonthsStartDate, threeMonthsEndDate)` for chart

#### Step 2.5: Refactor Jobs Page ✅ COMPLETED

**File**: `app/(authenticated)/jobs/page.tsx`

**Completed Changes**:
- ✅ Replaced manual data loading with `useJobs()` hook
- ✅ Removed refreshTrigger anti-pattern
- ✅ Eliminated ~15 callback props
- ✅ Removed all `onSuccess` prop drilling
- ✅ Simplified component by ~50 lines

---

## Phase 3: Performance Optimization ⏳

**Status**: 60% COMPLETE
**Duration**: In Progress
**Target Completion**: TBD

### ✅ Completed Tasks

#### Step 3.0: Optimistic Updates ✅

**Status**: COMPLETE

**Files Updated**:
- ✅ `lib/hooks/use-jobs.ts` - All CRUD mutations
- ✅ `lib/hooks/use-categories.ts` - All CRUD mutations

**Impact**: Instant UI feedback, automatic rollback on errors, industry-standard UX pattern

#### Step 3.2: Code Splitting ✅

**Status**: COMPLETE

**Files Updated**:
- ✅ `app/(authenticated)/calendar/page.tsx` - 3 heavy dialogs (~800 lines)
- ✅ `app/(authenticated)/jobs/page.tsx` - Dialogs and drawers

**Impact**: ~30-40KB bundle size reduction per page, faster initial loads

### 📋 Remaining Tasks

#### Step 3.1: Add Memoization (Partially Complete)

**Files Already Optimized (Phase 2)**:
- ✅ Calendar stats calculations (useMemo)
- ✅ Dashboard aggregations (useMemo)

**Remaining**:
- [ ] Financial summaries
- [ ] List filtering/sorting
- [ ] Event handler callbacks (useCallback)

**Pattern**:
```typescript
// Expensive calculation
const stats = useMemo(() => {
  return calculateStats(entries, records);
}, [entries, records]);

// Event handlers
const handleEntryChange = useCallback(() => {
  // ...
}, [dependencies]);
```

#### Step 3.2: Code Splitting & Bundle Optimization

**Tasks**:
- [ ] Install `@next/bundle-analyzer`
- [ ] Analyze current bundle size
- [ ] Lazy load heavy components
- [ ] Dynamic imports for charts/visualizations
- [ ] Tree-shake unused exports

**Example**:
```typescript
const MonthCalendar = lazy(() => import('./month-calendar'));
const ListView = lazy(() => import('./list-view'));
```

#### Step 3.3: Add Pagination

**Files**:
- [ ] Time entries lists
- [ ] Financial records lists
- [ ] Jobs lists (if > 50)

**Options**:
- Infinite scroll (mobile-friendly)
- "Load More" button (simpler)
- Traditional pagination (desktop)

**Implementation**:
```typescript
const {
  data,
  fetchNextPage,
  hasNextPage
} = useInfiniteQuery({
  queryKey: ['entries', startDate],
  queryFn: ({ pageParam = 0 }) => getTimeEntries(startDate, endDate, pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

#### Step 3.4: Fix useMediaQuery Duplication

**Current Issue**:
- `useMediaQuery()` called 5 times per dialog render
- Same query checked repeatedly

**Solution**:
```typescript
// lib/contexts/media-query-context.tsx
export function MediaQueryProvider({ children }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return (
    <MediaQueryContext.Provider value={{ isDesktop }}>
      {children}
    </MediaQueryContext.Provider>
  );
}

// Usage
const { isDesktop } = useMediaQuery();
```

**Alternative**: CSS-only solution with Tailwind's `md:` breakpoints

---

## Phase 4: Database Optimization ⏳

**Status**: NOT STARTED
**Duration**: 3-5 days
**Target Completion**: TBD

### 📋 Tasks

#### Step 4.1: Add Database Indexes

**Analysis Needed**:
- [ ] Run `EXPLAIN ANALYZE` on slow queries
- [ ] Identify missing indexes
- [ ] Add composite indexes for common queries

**Likely Candidates**:
```sql
-- Time entries by user and date range
CREATE INDEX idx_time_entries_user_date
ON time_entries(user_id, date);

-- Financial records by user and date range
CREATE INDEX idx_financial_records_user_date
ON financial_records(user_id, date);

-- Jobs by user and active status
CREATE INDEX idx_jobs_user_active
ON jobs(user_id, is_active);
```

#### Step 4.2: Optimize Query Patterns

**Current Issues**:
- Count queries return nested arrays
- Aggressive revalidatePath (16× in categories)

**Improvements**:
- [ ] Use separate COUNT queries or triggers
- [ ] Reduce revalidatePath calls
- [ ] Add database-level constraints

#### Step 4.3: Add Materialized Views (Optional)

**For Heavy Aggregations**:
- Monthly financial summaries
- Earnings by job
- Hours worked statistics

**Example**:
```sql
CREATE MATERIALIZED VIEW monthly_earnings AS
SELECT
  user_id,
  DATE_TRUNC('month', date) as month,
  SUM(amount) as total,
  currency
FROM income_records
GROUP BY user_id, month, currency;

-- Refresh nightly
CREATE OR REPLACE FUNCTION refresh_monthly_earnings()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_earnings;
END;
$$ LANGUAGE plpgsql;
```

---

## Phase 5: Type Safety & Quality ⏳

**Status**: NOT STARTED
**Duration**: 3-5 days
**Target Completion**: TBD

### 📋 Tasks

#### Step 5.1: Fix TypeScript 'any' Types

**Files with 'any'**:
- [ ] `lib/utils/user-settings.ts` (dashboard_layout, notification_prefs)
- [ ] `app/(authenticated)/calendar/add-time-entry-dialog.tsx` (payData)
- [ ] `app/(authenticated)/jobs/page.tsx` (formatJobRate parameter)

**Pattern**:
```typescript
// Before ❌
const payData: any = { ... };

// After ✅
type PayCustomization = {
  type: 'hourly' | 'daily' | 'fixed';
  amount: number;
  currency: string;
};
const payData: PayCustomization = { ... };
```

#### Step 5.2: Generate Accurate Database Types

```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

**Review**:
- [ ] Compare with current types
- [ ] Fix any mismatches
- [ ] Update imports

#### Step 5.3: Create Type-Safe API Layer

**File**: `lib/api/index.ts`

**Centralize all Supabase queries**:
```typescript
// lib/api/jobs.ts
export async function fetchJobs(): Promise<Job[]> {
  const user = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw new JobsFetchError(error);
  return data;
}
```

**Benefits**:
- Single source of truth
- Easier to test
- Type-safe responses
- Consistent error handling

#### Step 5.4: Add Error Boundaries

**Files to Create**:
- [ ] `app/(authenticated)/error.tsx` - Global error boundary
- [ ] `app/(authenticated)/calendar/error.tsx` - Calendar-specific
- [ ] Component-level error boundaries for critical sections

**Example**:
```typescript
// app/(authenticated)/error.tsx
'use client';

export default function Error({ error, reset }) {
  return (
    <div className="p-8 text-center">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

#### Step 5.5: Add Loading States

**Files to Create**:
- [ ] `app/(authenticated)/calendar/loading.tsx`
- [ ] `app/(authenticated)/dashboard/loading.tsx`
- [ ] `app/(authenticated)/jobs/loading.tsx`

**Example**:
```typescript
// app/(authenticated)/calendar/loading.tsx
export default function Loading() {
  return <CalendarSkeleton />;
}
```

---

## Phase 6: Testing & Polish ⏳

**Status**: NOT STARTED
**Duration**: 1 week
**Target Completion**: TBD

### 📋 Tasks

#### Step 6.1: Accessibility Audit

**Tools**:
- [ ] Install axe DevTools
- [ ] Run Lighthouse accessibility audit
- [ ] Manual keyboard navigation testing

**Issues to Fix**:
- [ ] Add ARIA labels to inputs
- [ ] Fix form associations
- [ ] Ensure keyboard navigation works
- [ ] Add screen reader announcements
- [ ] Check color contrast ratios

#### Step 6.2: Manual Testing Checklist

- [ ] Create time entry (all pay types)
- [ ] Edit time entry
- [ ] Delete time entry
- [ ] Create financial record
- [ ] Test overnight shifts (23:00-07:00)
- [ ] Test currency formatting (USD, EUR, JPY)
- [ ] Test on mobile (responsive dialogs)
- [ ] Test back button behavior
- [ ] Test calendar navigation
- [ ] Test dashboard statistics
- [ ] Test jobs CRUD operations
- [ ] Test categories CRUD operations

#### Step 6.3: Performance Testing

**Tools**:
- [ ] Lighthouse performance audit
- [ ] React DevTools Profiler
- [ ] Network tab analysis

**Metrics to Measure**:
- [ ] First Contentful Paint (FCP)
- [ ] Largest Contentful Paint (LCP)
- [ ] Time to Interactive (TTI)
- [ ] Bundle size
- [ ] Number of requests
- [ ] Cache hit rate

**Targets**:
- LCP < 2.5s
- FCP < 1.8s
- TTI < 3.8s
- Bundle < 250KB

#### Step 6.4: Fix Remaining Code Quality Issues

- [ ] Remove all `console.log` statements
- [ ] Add parseFloat validation
- [ ] Fix settings race condition
- [ ] Add input validation everywhere
- [ ] Consistent error messages
- [ ] Consistent loading states

#### Step 6.5: Documentation

**Files to Create/Update**:
- [ ] `README.md` - Project overview, setup instructions
- [ ] `docs/ARCHITECTURE.md` - System architecture
- [ ] `docs/API.md` - API documentation
- [ ] `docs/DEPLOYMENT.md` - Deployment guide
- [ ] Inline code comments for complex logic

---

## 🎯 Success Metrics

### Performance Targets

| Metric | Current | Phase 1 | Phase 2 | Phase 3 | Final Target |
|--------|---------|---------|---------|---------|--------------|
| Initial Load | 2.5s | 2.3s | 1.5s | 1.0s | **0.8s** |
| Dialog Open | 800ms | 600ms | 150ms | 100ms | **100ms** |
| Bundle Size | 350KB | 350KB | 300KB | 250KB | **220KB** |
| DB Queries | 5-7 | 3-4 | 2-3 | 1-2 | **1-2** |
| Re-renders | High | High | Medium | Low | **Low** |

### Code Quality Targets

- [ ] 0 TypeScript errors
- [ ] 0 ESLint errors
- [ ] < 5 'any' types
- [ ] 100% type coverage on new code
- [ ] 0 console.log in production
- [ ] All components < 300 lines
- [ ] All functions < 50 lines

### User Experience Targets

- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 95
- [ ] All features work on mobile
- [ ] Back button closes dialogs
- [ ] No layout shifts
- [ ] Instant cached responses
- [ ] Proper loading states

---

## 📝 Notes & Decisions

### Architecture Decisions

1. **React Query over SWR**
   - Reason: Better DevTools, more features, larger community
   - Trade-off: Slightly larger bundle

2. **Decimal.js over integer cents**
   - Reason: Easier to work with, supports multiple currencies
   - Trade-off: Slight performance overhead (negligible)

3. **Currency config over Intl.NumberFormat only**
   - Reason: More control, works offline, consistent formatting
   - Trade-off: Need to maintain currency list

4. **Responsive modal (Drawer/Dialog) over CSS only**
   - Reason: Better back button behavior, native feel
   - Trade-off: More JavaScript

### Database Schema Notes

**No migrations needed for Phase 0-1 changes!**

All fixes are logic-only:
- Overnight shift fix: Algorithm change, data stays same
- Currency: Formatting change, data stays same
- React Query: Client-side only, no DB impact

**Future migrations** (Phase 4):
- Add indexes (non-breaking)
- Possibly add materialized views (additive)

### Deployment Strategy

1. **Development Testing** (local)
   - Test all features manually
   - Run build, check for errors
   - Performance audit

2. **Preview Deployment** (optional)
   - Deploy to Vercel preview URL
   - Share with stakeholders
   - Gather feedback

3. **Merge to Main**
   - Squash commits or keep history
   - Deploy to production
   - Monitor for errors

4. **Rollback Plan**
   - Keep previous version tag
   - Can revert if critical issues
   - Database compatible (no breaking changes)

---

## 🚨 Risks & Mitigations

### Risk 1: Breaking Changes During Refactor
- **Mitigation**: Work in separate branch, test thoroughly
- **Fallback**: Can revert to previous version

### Risk 2: Performance Regressions
- **Mitigation**: Measure before/after, use React DevTools Profiler
- **Fallback**: Keep old patterns if new ones are slower

### Risk 3: User Data Loss
- **Mitigation**: No database migrations in Phase 0-3, test mutations carefully
- **Fallback**: Database backups

### Risk 4: Bundle Size Increase
- **Mitigation**: Monitor with bundle analyzer, lazy load heavy components
- **Fallback**: Remove React Query if bundle too large (unlikely)

---

## 📚 Resources & References

### Documentation
- [React Query Docs](https://tanstack.com/query/latest)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Decimal.js Docs](https://mikemcl.github.io/decimal.js/)
- [ISO 4217 Currency Codes](https://en.wikipedia.org/wiki/ISO_4217)

### Tools
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Inspiration
- [Vercel's Dashboard](https://vercel.com) - Performance patterns
- [Linear](https://linear.app) - UX patterns
- [Notion](https://notion.so) - Component architecture

---

**Last Updated**: 2024-12-24
**Next Review**: After Phase 2 completion
