# 🧪 Testing Guide

## Overview

This project uses **Vitest** for unit testing and **React Testing Library** for component testing.

## Test Structure

```
/lib
  /validations
    /__tests__
      time-entries.test.ts      # Zod validation tests
      financial-records.test.ts # Financial record validation tests
```

## Running Tests

### Watch Mode (Development)
```bash
npm test
# or
npm run test
```
Runs tests in watch mode - they re-run when files change.

### Run Once
```bash
npm run test:run
```
Runs all tests once and exits. Useful for CI/CD.

### Coverage Report
```bash
npm run test:coverage
```
Generates a coverage report showing which code is tested.

### UI Mode (Visual Testing)
```bash
npm run test:ui
```
Opens a visual UI for exploring and debugging tests.

## Writing Tests

### Example: Validation Test

```typescript
import { describe, it, expect } from 'vitest';
import { workShiftSchema } from '../time-entries';

describe('Work Shift Validation', () => {
  it('should accept valid work shift', () => {
    const result = workShiftSchema.safeParse({
      entry_type: 'work_shift',
      date: '2026-01-10',
      start_time: '09:00',
      end_time: '17:00',
      // ... other required fields
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid time format', () => {
    const result = workShiftSchema.safeParse({
      // ... valid fields except:
      start_time: '25:00', // Invalid hour
    });

    expect(result.success).toBe(false);
  });
});
```

### Example: Component Test (Future)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AddJobDialog } from '@/app/(authenticated)/jobs/add-job-dialog';

describe('AddJobDialog', () => {
  it('should render form fields', () => {
    render(<AddJobDialog open={true} onOpenChange={() => {}} />);

    expect(screen.getByLabelText(/job name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pay type/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<AddJobDialog open={true} onOpenChange={() => {}} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });
});
```

## Test Coverage Goals

### Current Coverage
- ✅ Zod validation schemas: ~90% covered
- ⏳ React Query hooks: Not yet tested
- ⏳ UI components: Not yet tested
- ⏳ Utility functions: Partially tested

### Target Coverage
- **Validations**: 95%+ (critical for data integrity)
- **Hooks**: 80%+ (business logic)
- **Components**: 60%+ (UI regression prevention)
- **Utils**: 90%+ (currency, date calculations)

## What to Test

### High Priority (Must Test)
1. **Validation Schemas** ✅
   - All edge cases
   - Invalid inputs
   - Boundary conditions

2. **Currency Calculations**
   - Decimal precision
   - Multi-currency support
   - Rounding behavior

3. **Date/Time Logic**
   - Timezone handling
   - Overnight shifts
   - Date formatting

4. **Business Logic**
   - Income calculations
   - Hour calculations
   - Pay override logic

### Medium Priority
5. **React Query Hooks**
   - Cache invalidation
   - Optimistic updates
   - Error handling

6. **Form Validation**
   - Client-side validation
   - Error messages
   - Field interactions

### Low Priority
7. **UI Components**
   - Rendering
   - User interactions
   - Accessibility

## Testing Best Practices

### ✅ DO
- Test behavior, not implementation
- Use descriptive test names
- Test edge cases and error paths
- Keep tests isolated and independent
- Mock external dependencies (API calls, database)

### ❌ DON'T
- Test internal implementation details
- Have tests depend on each other
- Test third-party libraries (React Query, Zod)
- Duplicate tests
- Write tests that are too complex

## Mocking

### Mocked by Default
- `next/navigation` (router, pathname, searchParams)
- `@/lib/supabase/client` (database client)

### How to Mock Additional Modules

```typescript
import { vi } from 'vitest';

// Mock a specific module
vi.mock('@/lib/utils/currency', () => ({
  formatCurrencyAmount: vi.fn((amount) => `$${amount}`),
}));

// Mock a function
const mockFunction = vi.fn();
mockFunction.mockReturnValue('mocked value');
```

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook - optional)
- Every pull request (GitHub Actions - when set up)
- Before deployment

## Debugging Tests

### VS Code
1. Add breakpoint in test file
2. Run "JavaScript Debug Terminal"
3. Run `npm test`

### Console Logging
```typescript
it('should do something', () => {
  const result = someFunction();
  console.log('Result:', result); // Will show in test output
  expect(result).toBe(expected);
});
```

### Vitest UI
```bash
npm run test:ui
```
Opens visual interface showing:
- Test results
- Console logs
- Test file locations
- Coverage

## Next Steps

### Immediate
- [x] Set up Vitest and React Testing Library
- [x] Add validation tests for time entries
- [x] Add validation tests for financial records
- [ ] Add tests for currency utilities
- [ ] Add tests for date/time utilities

### Future
- [ ] Add React Query hook tests
- [ ] Add component tests for critical dialogs
- [ ] Set up GitHub Actions for CI
- [ ] Add E2E tests with Playwright
- [ ] Achieve 80% overall code coverage

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
