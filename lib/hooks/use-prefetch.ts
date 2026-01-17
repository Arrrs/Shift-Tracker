/**
 * Prefetch utilities for React Query
 *
 * Implements smart prefetching pattern used by GitHub, Linear, and Vercel:
 * - Prefetch on hover (desktop)
 * - Prefetch on touch start (mobile)
 * - Prefetch on route change prediction
 *
 * Benefits:
 * - Data loads before user clicks
 * - Instant navigation/dialog opening
 * - Better perceived performance
 */

'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook to prefetch data on hover/touch
 *
 * @example
 * const prefetch = usePrefetch();
 *
 * <button
 *   onMouseEnter={() => prefetch.jobs()}
 *   onClick={openJobDialog}
 * >
 *   Edit Job
 * </button>
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    /**
     * Prefetch all jobs
     * Use when hovering over "Jobs" link or "Add Job" button
     */
    jobs: useCallback(() => {
      queryClient.prefetchQuery({
        queryKey: ['jobs'],
        // Prefetch will use the query function from useJobs hook
        staleTime: 5 * 60 * 1000, // Don't refetch if data is less than 5 min old
      });
    }, [queryClient]),

    /**
     * Prefetch categories by type
     * Use when hovering over category-related buttons
     */
    categories: useCallback((type: 'income' | 'expense') => {
      queryClient.prefetchQuery({
        queryKey: ['categories', 'list', type],
        staleTime: 5 * 60 * 1000,
      });
    }, [queryClient]),

    /**
     * Prefetch time entries for a date range
     * Use when hovering over calendar dates
     */
    timeEntries: useCallback((startDate: string, endDate: string) => {
      if (!startDate || !endDate) return;

      queryClient.prefetchQuery({
        queryKey: ['time-entries', startDate, endDate],
        staleTime: 2 * 60 * 1000, // 2 minutes - time entries change more frequently
      });
    }, [queryClient]),

    /**
     * Prefetch financial records for a date range
     * Use when hovering over calendar dates or financial views
     */
    financialRecords: useCallback((startDate: string, endDate: string) => {
      if (!startDate || !endDate) return;

      queryClient.prefetchQuery({
        queryKey: ['financial-records', startDate, endDate],
        staleTime: 2 * 60 * 1000,
      });
    }, [queryClient]),

    /**
     * Prefetch income records for a date range
     */
    incomeRecords: useCallback((startDate: string, endDate: string) => {
      if (!startDate || !endDate) return;

      queryClient.prefetchQuery({
        queryKey: ['income-records', startDate, endDate],
        staleTime: 2 * 60 * 1000,
      });
    }, [queryClient]),
  };
}

/**
 * Helper to create hover/touch handlers for prefetching
 *
 * @example
 * const prefetchProps = createPrefetchHandlers(() => prefetch.jobs());
 * <button {...prefetchProps}>Add Job</button>
 */
export function createPrefetchHandlers(prefetchFn: () => void) {
  return {
    onMouseEnter: prefetchFn,
    onTouchStart: prefetchFn,
  };
}
