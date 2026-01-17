/**
 * React Query hooks for income records (shift earnings)
 * Handles income record queries with automatic caching
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getIncomeRecords } from '@/app/(authenticated)/time-entries/actions';

/**
 * Query key factory for income records
 */
export const incomeRecordsKeys = {
  all: ['income-records'] as const,
  lists: () => [...incomeRecordsKeys.all, 'list'] as const,
  list: (startDate: string, endDate: string) =>
    [...incomeRecordsKeys.lists(), startDate, endDate] as const,
};

/**
 * Fetch income records for a date range
 *
 * Income records represent the actual earnings from completed shifts
 *
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 *
 * @example
 * const { data: income, isLoading } = useIncomeRecords('2024-01-01', '2024-01-31');
 */
export function useIncomeRecords(startDate: string, endDate: string) {
  return useQuery({
    queryKey: incomeRecordsKeys.list(startDate, endDate),
    queryFn: async () => {
      const result = await getIncomeRecords(startDate, endDate);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.records || [];
    },
    // Keep data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Enable query only if dates are provided
    enabled: !!startDate && !!endDate,
  });
}
