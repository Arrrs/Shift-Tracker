/**
 * React Query hooks for financial records
 * Handles financial record CRUD operations with automatic caching
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFinancialRecords,
  createFinancialRecord,
  updateFinancialRecord,
  deleteFinancialRecord,
} from '@/app/(authenticated)/finances/actions';
import { toast } from 'sonner';

/**
 * Query key factory for financial records
 */
export const financialRecordsKeys = {
  all: ['financial-records'] as const,
  lists: () => [...financialRecordsKeys.all, 'list'] as const,
  list: (startDate: string, endDate: string) =>
    [...financialRecordsKeys.lists(), startDate, endDate] as const,
  details: () => [...financialRecordsKeys.all, 'detail'] as const,
  detail: (id: string) => [...financialRecordsKeys.details(), id] as const,
};

/**
 * Fetch financial records for a date range
 *
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 *
 * @example
 * const { data: records, isLoading } = useFinancialRecords('2024-01-01', '2024-01-31');
 */
export function useFinancialRecords(startDate: string, endDate: string) {
  return useQuery({
    queryKey: financialRecordsKeys.list(startDate, endDate),
    queryFn: async () => {
      const result = await getFinancialRecords(startDate, endDate);
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

/**
 * Create a new financial record
 *
 * @example
 * const createRecord = useCreateFinancialRecord();
 * createRecord.mutate(recordData);
 */
export function useCreateFinancialRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFinancialRecord,
    onSuccess: (result) => {
      if (result.record && !result.error) {
        // Invalidate all financial records queries
        queryClient.invalidateQueries({ queryKey: financialRecordsKeys.lists() });
        toast.success('Financial record created successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to create financial record');
      console.error('Create financial record error:', error);
    },
  });
}

/**
 * Update an existing financial record
 *
 * @example
 * const updateRecord = useUpdateFinancialRecord();
 * updateRecord.mutate({ id: '123', updates: { ... } });
 */
export function useUpdateFinancialRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateFinancialRecord>[1];
    }) => updateFinancialRecord(id, data),
    onSuccess: (result) => {
      if (result.record && !result.error) {
        queryClient.invalidateQueries({ queryKey: financialRecordsKeys.lists() });
        toast.success('Financial record updated successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to update financial record');
      console.error('Update financial record error:', error);
    },
  });
}

/**
 * Delete a financial record
 *
 * @example
 * const deleteRecord = useDeleteFinancialRecord();
 * deleteRecord.mutate('record-id-123');
 */
export function useDeleteFinancialRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFinancialRecord(id),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: financialRecordsKeys.lists() });
        toast.success('Financial record deleted successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to delete financial record');
      console.error('Delete financial record error:', error);
    },
  });
}
