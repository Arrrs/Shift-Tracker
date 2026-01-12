/**
 * React Query hooks for time entries
 * Handles time entry CRUD operations with automatic caching
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from '@/app/(authenticated)/time-entries/actions';
import { toast } from 'sonner';
import { incomeRecordsKeys } from './use-income-records';
import { financialRecordsKeys } from './use-financial-records';

/**
 * Query key factory for time entries
 * Allows cache invalidation by date range
 */
export const timeEntriesKeys = {
  all: ['time-entries'] as const,
  lists: () => [...timeEntriesKeys.all, 'list'] as const,
  list: (startDate: string, endDate: string) =>
    [...timeEntriesKeys.lists(), startDate, endDate] as const,
  details: () => [...timeEntriesKeys.all, 'detail'] as const,
  detail: (id: string) => [...timeEntriesKeys.details(), id] as const,
};

/**
 * Fetch time entries for a date range
 *
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 *
 * @example
 * const { data: entries, isLoading } = useTimeEntries('2024-01-01', '2024-01-31');
 */
export function useTimeEntries(startDate: string, endDate: string) {
  return useQuery({
    queryKey: timeEntriesKeys.list(startDate, endDate),
    queryFn: async () => {
      const result = await getTimeEntries(startDate, endDate);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.entries || [];
    },
    // Keep data fresh for 2 minutes (calendar data changes frequently)
    staleTime: 2 * 60 * 1000,
    // Enable query only if dates are provided
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Create a new time entry
 *
 * @example
 * const createEntry = useCreateTimeEntry();
 * createEntry.mutate(entryData, {
 *   onSuccess: () => console.log('Created!'),
 * });
 */
export function useCreateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTimeEntry,
    onSuccess: (result) => {
      if (result.entry && !result.error) {
        // Invalidate time entries queries
        queryClient.invalidateQueries({ queryKey: timeEntriesKeys.lists() });
        // Invalidate income records (completed shifts generate income via trigger)
        queryClient.invalidateQueries({ queryKey: incomeRecordsKeys.lists() });
        // Invalidate financial records (affects totals in calendar)
        queryClient.invalidateQueries({ queryKey: financialRecordsKeys.lists() });
        toast.success('Time entry created successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to create time entry');
      console.error('Create time entry error:', error);
    },
  });
}

/**
 * Update an existing time entry
 *
 * @example
 * const updateEntry = useUpdateTimeEntry();
 * updateEntry.mutate({ id: '123', data: { ... } });
 */
export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateTimeEntry>[1];
    }) => updateTimeEntry(id, data),
    onSuccess: (result) => {
      if (result.entry && !result.error) {
        // Invalidate time entries queries
        queryClient.invalidateQueries({ queryKey: timeEntriesKeys.lists() });
        // Invalidate income records (status/pay changes affect income via trigger)
        queryClient.invalidateQueries({ queryKey: incomeRecordsKeys.lists() });
        // Invalidate financial records (affects totals in calendar)
        queryClient.invalidateQueries({ queryKey: financialRecordsKeys.lists() });
        toast.success('Time entry updated successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to update time entry');
      console.error('Update time entry error:', error);
    },
  });
}

/**
 * Delete a time entry
 *
 * @example
 * const deleteEntry = useDeleteTimeEntry();
 * deleteEntry.mutate('entry-id-123');
 */
export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTimeEntry(id),
    onSuccess: (result) => {
      if (!result.error) {
        // Invalidate time entries queries
        queryClient.invalidateQueries({ queryKey: timeEntriesKeys.lists() });
        // Invalidate income records (CASCADE deletes associated income)
        queryClient.invalidateQueries({ queryKey: incomeRecordsKeys.lists() });
        // Invalidate financial records (affects totals in calendar)
        queryClient.invalidateQueries({ queryKey: financialRecordsKeys.lists() });
        toast.success('Time entry deleted successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to delete time entry');
      console.error('Delete time entry error:', error);
    },
  });
}
